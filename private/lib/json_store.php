<?php
declare(strict_types=1);

const BECCAN_ALLOWED_COLLECTIONS = ['gallery', 'news', 'announcements', 'events'];
const BECCAN_MAX_BACKUPS_PER_COLLECTION = 30;

function collection_path(string $collection): string
{
    if (!in_array($collection, BECCAN_ALLOWED_COLLECTIONS, true)) {
        throw new InvalidArgumentException('Invalid collection name.');
    }
    return BECCAN_DATA_DIR . '/' . $collection . '.json';
}

function read_json_collection(string $collection): array
{
    $path = collection_path($collection);
    if (!is_file($path)) {
        return [];
    }
    $fp = fopen($path, 'rb');
    if ($fp === false) {
        throw new RuntimeException("Unable to open {$collection} store.");
    }
    try {
        flock($fp, LOCK_SH);
        $raw = stream_get_contents($fp);
        if ($raw === false || trim($raw) === '') {
            return [];
        }
        $decoded = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
        if (!is_array($decoded)) {
            throw new RuntimeException("Corrupted {$collection} store.");
        }
        return array_values($decoded);
    } finally {
        flock($fp, LOCK_UN);
        fclose($fp);
    }
}

function create_collection_backup(string $collection): ?string
{
    $path = collection_path($collection);
    if (!is_file($path) || filesize($path) === 0) {
        return null;
    }

    $timestamp = (new DateTimeImmutable('now', new DateTimeZone('UTC')))->format('Ymd_His');
    $backupName = sprintf('%s_%s_%s.json', $collection, $timestamp, bin2hex(random_bytes(3)));
    $backupPath = BECCAN_BACKUP_DIR . '/' . $backupName;

    if (!@copy($path, $backupPath)) {
        throw new RuntimeException('Failed to create safety backup before modifying content.');
    }
    @chmod($backupPath, 0640);

    // Prune older backups for this collection beyond retention limit
    $pattern = BECCAN_BACKUP_DIR . '/' . $collection . '_*.json';
    $files = glob($pattern) ?: [];
    rsort($files);
    if (count($files) > BECCAN_MAX_BACKUPS_PER_COLLECTION) {
        foreach (array_slice($files, BECCAN_MAX_BACKUPS_PER_COLLECTION) as $oldFile) {
            @unlink($oldFile);
        }
    }

    return $backupName;
}

function atomic_write_json_file(string $targetPath, array $payload): void
{
    $dir = dirname($targetPath);
    if (!is_dir($dir)) {
        @mkdir($dir, 0750, true);
    }

    $encoded = json_encode(
        $payload,
        JSON_THROW_ON_ERROR | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
    ) . "\n";

    $tempPath = $targetPath . '.tmp.' . bin2hex(random_bytes(6));
    $bytes = file_put_contents($tempPath, $encoded, LOCK_EX);
    if ($bytes === false) {
        @unlink($tempPath);
        throw new RuntimeException('Failed to write temporary JSON file.');
    }
    @chmod($tempPath, 0640);

    if (!rename($tempPath, $targetPath)) {
        @unlink($tempPath);
        throw new RuntimeException('Failed to finalize atomic JSON replacement.');
    }
}

function mutate_json_collection(string $collection, callable $mutator): mixed
{
    $path = collection_path($collection);
    $lockPath = $path . '.lock';
    $lockHandle = fopen($lockPath, 'c+b');
    if ($lockHandle === false) {
        throw new RuntimeException('Unable to acquire collection lock.');
    }

    try {
        if (!flock($lockHandle, LOCK_EX)) {
            throw new RuntimeException('Unable to lock collection.');
        }

        $current = [];
        if (is_file($path)) {
            $raw = file_get_contents($path);
            if ($raw !== false && trim($raw) !== '') {
                $decoded = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
                if (!is_array($decoded)) {
                    throw new RuntimeException("Invalid JSON structure in {$collection}.json.");
                }
                $current = array_values($decoded);
            }
        }

        $result = $mutator($current);
        if (!is_array($result) || !array_key_exists('records', $result) || !is_array($result['records'])) {
            throw new LogicException('Mutator must return an array with a records key.');
        }

        create_collection_backup($collection);
        atomic_write_json_file($path, array_values($result['records']));

        return $result['return'] ?? $result['records'];
    } finally {
        flock($lockHandle, LOCK_UN);
        fclose($lockHandle);
    }
}

function list_backups(): array
{
    $files = glob(BECCAN_BACKUP_DIR . '/*.json') ?: [];
    rsort($files);
    $items = [];
    foreach ($files as $filePath) {
        $filename = basename($filePath);
        if (!preg_match('/^(gallery|news|announcements|events)_(\d{8})_(\d{6})_[a-f0-9]+\.json$/', $filename, $matches)) {
            continue;
        }
        $items[] = [
            'filename' => $filename,
            'collection' => $matches[1],
            'createdAt' => DateTimeImmutable::createFromFormat(
                'YmdHis',
                $matches[2] . $matches[3],
                new DateTimeZone('UTC')
            )?->format('Y-m-d\TH:i:s\Z') ?? '',
            'sizeBytes' => filesize($filePath) ?: 0,
        ];
    }
    return $items;
}

function restore_collection_backup(string $filename): array
{
    if (!preg_match('/^(gallery|news|announcements|events)_\d{8}_\d{6}_[a-f0-9]+\.json$/', $filename, $matches)) {
        throw new InvalidArgumentException('Invalid backup filename.');
    }
    $collection = $matches[1];
    $backupPath = BECCAN_BACKUP_DIR . '/' . $filename;
    if (!is_file($backupPath)) {
        throw new RuntimeException('Backup file not found.');
    }

    $raw = file_get_contents($backupPath);
    if ($raw === false) {
        throw new RuntimeException('Unable to read backup file.');
    }
    $decoded = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
    if (!is_array($decoded)) {
        throw new RuntimeException('Backup file is not a valid collection array.');
    }

    mutate_json_collection($collection, static fn (): array => [
        'records' => array_values($decoded),
        'return' => $decoded,
    ]);

    return [
        'collection' => $collection,
        'restoredFrom' => $filename,
        'recordCount' => count($decoded),
    ];
}
