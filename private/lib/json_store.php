<?php
declare(strict_types=1);

const BECCAN_ALLOWED_COLLECTIONS = ['gallery', 'news', 'announcements', 'events'];

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
    $bytes = @file_put_contents($tempPath, $encoded, LOCK_EX);
    if ($bytes === false) {
        @unlink($tempPath);
        throw new RuntimeException('Failed to write temporary JSON file.');
    }
    @chmod($tempPath, 0640);

    if (!@rename($tempPath, $targetPath)) {
        @unlink($tempPath);
        throw new RuntimeException('Failed to finalize atomic JSON replacement.');
    }
}

function resolve_live_media_source_for_backup(string $bucket, string $filename, string $variant): ?string
{
    $privatePath = resolve_private_media_path($bucket, $filename, $variant);
    if ($privatePath !== null && is_file($privatePath)) {
        return $privatePath;
    }
    // Compatibility fallback for unmigrated legacy files under public_html/uploads
    if (defined('BECCAN_UPLOADS_DIR') && is_valid_media_filename($filename)) {
        $sub = $variant === 'thumb' ? '/thumbs/' : '/';
        $legacyPath = BECCAN_UPLOADS_DIR . '/' . $bucket . $sub . $filename;
        if (is_file($legacyPath)) {
            return $legacyPath;
        }
    }
    return null;
}

function remove_backup_entry_recursive(string $path): void
{
    if (is_file($path)) {
        @unlink($path);
        return;
    }
    if (!is_dir($path)) {
        return;
    }
    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($path, FilesystemIterator::SKIP_DOTS),
        RecursiveIteratorIterator::CHILD_FIRST
    );
    foreach ($iterator as $item) {
        if ($item->isDir()) {
            @rmdir($item->getPathname());
        } else {
            @unlink($item->getPathname());
        }
    }
    @rmdir($path);
}

function create_collection_backup(string $collection, bool $forceEvenIfEmpty = false): ?string
{
    $path = collection_path($collection);
    if (!$forceEvenIfEmpty && (!is_file($path) || filesize($path) === 0)) {
        return null;
    }

    $records = [];
    if (is_file($path)) {
        $raw = @file_get_contents($path);
        if (is_string($raw) && trim($raw) !== '') {
            $decoded = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
            if (!is_array($decoded)) {
                throw new RuntimeException("Invalid JSON structure in {$collection}.json.");
            }
            $records = array_values($decoded);
        }
    }

    if (!$forceEvenIfEmpty && $records === []) {
        return null;
    }

    $now = now_utc_iso();
    $timestamp = (new DateTimeImmutable('now', new DateTimeZone('UTC')))->format('Ymd_His');
    $snapshotId = sprintf('%s_%s_%s', $collection, $timestamp, bin2hex(random_bytes(3)));
    $tmpDir = BECCAN_BACKUP_DIR . '/.tmp_' . $snapshotId;
    $finalDir = BECCAN_BACKUP_DIR . '/' . $snapshotId;

    if (!mkdir($tmpDir, 0750, true)) {
        throw new RuntimeException('Failed to initialize backup staging directory.');
    }

    try {
        $recordsJsonPath = $tmpDir . '/records.json';
        atomic_write_json_file($recordsJsonPath, $records);
        $jsonBytes = (int) (filesize($recordsJsonPath) ?: 0);

        $mediaEntries = [];
        $mediaBytes = 0;
        $copiedKeys = [];

        if (in_array($collection, BECCAN_ALLOWED_MEDIA_CATEGORIES, true)) {
            foreach ($records as $record) {
                if (!is_array($record)) {
                    continue;
                }
                $recordId = (string) ($record['id'] ?? '');
                $filename = extract_record_media_filename($record, $collection);
                if ($filename === null) {
                    continue;
                }

                foreach (['original', 'thumb'] as $variant) {
                    $dedupeKey = $variant . ':' . $filename;
                    $relPath = $variant === 'thumb'
                        ? "media/{$collection}/thumbs/{$filename}"
                        : "media/{$collection}/{$filename}";

                    if (isset($copiedKeys[$dedupeKey])) {
                        continue;
                    }

                    $srcPath = resolve_live_media_source_for_backup($collection, $filename, $variant);
                    if ($srcPath === null) {
                        $mediaEntries[] = [
                            'recordId' => $recordId,
                            'variant' => $variant,
                            'bucket' => $collection,
                            'filename' => $filename,
                            'relativePath' => $relPath,
                            'missingOnBackup' => true,
                            'sizeBytes' => 0,
                        ];
                        continue;
                    }

                    $destPath = $tmpDir . '/' . $relPath;
                    $destParent = dirname($destPath);
                    if (!is_dir($destParent) && !@mkdir($destParent, 0750, true)) {
                        throw new RuntimeException('Failed to create backup media directory.');
                    }
                    if (!@copy($srcPath, $destPath)) {
                        throw new RuntimeException("Failed to back up media file {$filename}.");
                    }
                    @chmod($destPath, 0640);
                    $size = (int) (filesize($destPath) ?: 0);
                    $sha = hash_file('sha256', $destPath) ?: '';

                    $copiedKeys[$dedupeKey] = true;
                    $mediaBytes += $size;
                    $mediaEntries[] = [
                        'recordId' => $recordId,
                        'variant' => $variant,
                        'bucket' => $collection,
                        'filename' => $filename,
                        'relativePath' => $relPath,
                        'missingOnBackup' => false,
                        'sizeBytes' => $size,
                        'sha256' => $sha,
                    ];
                }
            }
        }

        $hasMediaSupport = in_array($collection, BECCAN_ALLOWED_MEDIA_CATEGORIES, true);
        $manifest = [
            'version' => 2,
            'kind' => $hasMediaSupport ? 'complete-snapshot' : 'json-records',
            'includesMedia' => $hasMediaSupport,
            'collection' => $collection,
            'snapshotId' => $snapshotId,
            'createdAt' => $now,
            'recordCount' => count($records),
            'mediaFilesCount' => count(array_filter($mediaEntries, static fn (array $m): bool => empty($m['missingOnBackup']))),
            'jsonBytes' => $jsonBytes,
            'mediaBytes' => $mediaBytes,
            'totalBytes' => $jsonBytes + $mediaBytes,
            'media' => $mediaEntries,
        ];
        atomic_write_json_file($tmpDir . '/manifest.json', $manifest);

        if (!@rename($tmpDir, $finalDir)) {
            throw new RuntimeException('Failed to finalize media-aware backup snapshot.');
        }

        prune_collection_backups($collection);
        return $snapshotId;
    } catch (Throwable $e) {
        remove_backup_entry_recursive($tmpDir);
        throw $e;
    }
}

function prune_collection_backups(string $collection): void
{
    $settings = read_cms_settings();
    $retention = (int) ($settings['backupRetentionCount'] ?? 30);

    $entries = glob(BECCAN_BACKUP_DIR . '/' . $collection . '_*') ?: [];
    $valid = [];
    foreach ($entries as $entryPath) {
        $base = basename($entryPath);
        if (
            is_dir($entryPath) &&
            preg_match('/^' . preg_quote($collection, '/') . '_\d{8}_\d{6}_[a-f0-9]+$/', $base) === 1
        ) {
            $valid[] = $entryPath;
        } elseif (
            is_file($entryPath) &&
            preg_match('/^' . preg_quote($collection, '/') . '_\d{8}_\d{6}_[a-f0-9]+\.json$/', $base) === 1
        ) {
            $valid[] = $entryPath;
        }
    }

    usort($valid, static fn (string $a, string $b): int => strcmp(basename($b), basename($a)));

    if (count($valid) > $retention) {
        foreach (array_slice($valid, $retention) as $oldEntry) {
            remove_backup_entry_recursive($oldEntry);
        }
    }
}

function mutate_json_collection(
    string $collection,
    callable $mutator,
    ?callable $beforeCommit = null,
    ?callable $onRollback = null
): mixed {
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

        try {
            if ($beforeCommit !== null) {
                $beforeCommit($result);
            }
            atomic_write_json_file($path, array_values($result['records']));
        } catch (Throwable $e) {
            if ($onRollback !== null) {
                $onRollback($e);
            }
            throw $e;
        }

        return $result['return'] ?? $result['records'];
    } finally {
        flock($lockHandle, LOCK_UN);
        fclose($lockHandle);
    }
}

function list_backups(): array
{
    $entries = glob(BECCAN_BACKUP_DIR . '/*') ?: [];
    $items = [];

    foreach ($entries as $entryPath) {
        $base = basename($entryPath);
        if (str_starts_with($base, '.')) {
            continue;
        }

        if (
            is_dir($entryPath) &&
            preg_match('/^(gallery|news|announcements|events)_(\d{8})_(\d{6})_[a-f0-9]+$/', $base, $matches) === 1
        ) {
            $manifestPath = $entryPath . '/manifest.json';
            $manifest = [];
            if (is_file($manifestPath)) {
                $decoded = json_decode((string) @file_get_contents($manifestPath), true);
                if (is_array($decoded)) {
                    $manifest = $decoded;
                }
            }
            $createdAt = (string) ($manifest['createdAt'] ?? (DateTimeImmutable::createFromFormat(
                'YmdHis',
                $matches[2] . $matches[3],
                new DateTimeZone('UTC')
            )?->format('Y-m-d\TH:i:s\Z') ?? ''));

            $jsonBytes = (int) ($manifest['jsonBytes'] ?? (@filesize($entryPath . '/records.json') ?: 0));
            $mediaBytes = (int) ($manifest['mediaBytes'] ?? 0);
            $totalBytes = (int) ($manifest['totalBytes'] ?? ($jsonBytes + $mediaBytes));
            $hasMedia = (bool) ($manifest['includesMedia'] ?? in_array($matches[1], BECCAN_ALLOWED_MEDIA_CATEGORIES, true));

            $items[] = [
                'filename' => $base,
                'collection' => $matches[1],
                'createdAt' => $createdAt,
                'kind' => (string) ($manifest['kind'] ?? ($hasMedia ? 'complete-snapshot' : 'json-records')),
                'includesMedia' => $hasMedia,
                'recordCount' => (int) ($manifest['recordCount'] ?? 0),
                'mediaFilesCount' => (int) ($manifest['mediaFilesCount'] ?? 0),
                'jsonBytes' => $jsonBytes,
                'mediaBytes' => $mediaBytes,
                'sizeBytes' => $totalBytes,
            ];
            continue;
        }

        if (
            is_file($entryPath) &&
            preg_match('/^(gallery|news|announcements|events)_(\d{8})_(\d{6})_[a-f0-9]+\.json$/', $base, $matches) === 1
        ) {
            $size = (int) (@filesize($entryPath) ?: 0);
            $decoded = json_decode((string) @file_get_contents($entryPath), true);
            $recordCount = is_array($decoded) ? count($decoded) : 0;

            $items[] = [
                'filename' => $base,
                'collection' => $matches[1],
                'createdAt' => DateTimeImmutable::createFromFormat(
                    'YmdHis',
                    $matches[2] . $matches[3],
                    new DateTimeZone('UTC')
                )?->format('Y-m-d\TH:i:s\Z') ?? '',
                'kind' => 'legacy-json-only',
                'includesMedia' => false,
                'recordCount' => $recordCount,
                'mediaFilesCount' => 0,
                'jsonBytes' => $size,
                'mediaBytes' => 0,
                'sizeBytes' => $size,
            ];
        }
    }

    usort($items, static function (array $a, array $b): int {
        $cmp = strcmp((string) $b['createdAt'], (string) $a['createdAt']);
        return $cmp !== 0 ? $cmp : strcmp((string) $b['filename'], (string) $a['filename']);
    });

    return $items;
}

function restore_collection_backup(string $snapshotId): array
{
    $isV2 = preg_match('/^(gallery|news|announcements|events)_\d{8}_\d{6}_[a-f0-9]+$/', $snapshotId, $matchesV2) === 1;
    $isLegacy = !$isV2 && preg_match('/^(gallery|news|announcements|events)_\d{8}_\d{6}_[a-f0-9]+\.json$/', $snapshotId, $matchesLegacy) === 1;

    if (!$isV2 && !$isLegacy) {
        throw new InvalidArgumentException('Invalid backup identifier.');
    }

    $collection = $isV2 ? $matchesV2[1] : $matchesLegacy[1];
    $snapshotPath = BECCAN_BACKUP_DIR . '/' . $snapshotId;

    if ($isV2) {
        if (!is_dir($snapshotPath) || !is_file($snapshotPath . '/records.json')) {
            throw new RuntimeException('Backup snapshot directory or records.json was not found.');
        }
        $recordsRaw = file_get_contents($snapshotPath . '/records.json');
        if ($recordsRaw === false) {
            throw new RuntimeException('Unable to read snapshot records.json.');
        }
        $records = json_decode($recordsRaw, true, 512, JSON_THROW_ON_ERROR);
        if (!is_array($records)) {
            throw new RuntimeException('Backup records.json is invalid.');
        }
        $records = array_values($records);

        $manifest = [];
        if (is_file($snapshotPath . '/manifest.json')) {
            $mDecoded = json_decode((string) file_get_contents($snapshotPath . '/manifest.json'), true);
            if (is_array($mDecoded)) {
                $manifest = $mDecoded;
            }
        }
        $manifestChecksums = [];
        foreach ((array) ($manifest['media'] ?? []) as $mEntry) {
            if (!empty($mEntry['relativePath']) && !empty($mEntry['sha256'])) {
                $manifestChecksums[$mEntry['relativePath']] = (string) $mEntry['sha256'];
            }
        }
    } else {
        if (!is_file($snapshotPath)) {
            throw new RuntimeException('Legacy backup file not found.');
        }
        $raw = file_get_contents($snapshotPath);
        if ($raw === false) {
            throw new RuntimeException('Unable to read legacy backup file.');
        }
        $records = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
        if (!is_array($records)) {
            throw new RuntimeException('Legacy backup file is not a valid collection array.');
        }
        $records = array_values($records);
        $manifestChecksums = [];
    }

    // Verify all referenced media files exist BEFORE touching live JSON or live media
    $restoreQueue = [];
    if (in_array($collection, BECCAN_ALLOWED_MEDIA_CATEGORIES, true)) {
        foreach ($records as $idx => $record) {
            if (!is_array($record)) {
                throw new RuntimeException('Corrupted record entry in backup snapshot.');
            }
            $filename = extract_record_media_filename($record, $collection);
            if ($filename === null) {
                continue;
            }

            foreach (['original', 'thumb'] as $variant) {
                $destPath = resolve_private_media_path($collection, $filename, $variant);
                if ($destPath === null) {
                    throw new RuntimeException("Invalid media reference in backed up record.");
                }
                if ($isV2) {
                    $relPath = $variant === 'thumb'
                        ? "media/{$collection}/thumbs/{$filename}"
                        : "media/{$collection}/{$filename}";
                    $backupMediaPath = $snapshotPath . '/' . $relPath;
                    if (!is_file($backupMediaPath) || (int) filesize($backupMediaPath) <= 0) {
                        throw new RuntimeException(
                            "Restoration aborted: backup is missing media file ({$relPath}) referenced by record '{$record['id']}'."
                        );
                    }
                    if (isset($manifestChecksums[$relPath])) {
                        $actualHash = hash_file('sha256', $backupMediaPath);
                        if ($actualHash === false || !hash_equals($manifestChecksums[$relPath], $actualHash)) {
                            throw new RuntimeException(
                                "Restoration aborted: backup media checksum mismatch for {$relPath}."
                            );
                        }
                    }
                    $restoreQueue[$destPath] = $backupMediaPath;
                } else {
                    // Legacy JSON-only backup: refuse to restore records pointing to non-existent media
                    $existingLive = resolve_live_media_source_for_backup($collection, $filename, $variant);
                    if ($existingLive === null) {
                        throw new RuntimeException(
                            "Restoration aborted: legacy JSON-only backup references missing image {$filename} and contains no media files."
                        );
                    }
                }
            }

            // Ensure restored records use the secure private serve URL format if record has an ID
            if (!empty($record['id'])) {
                $record['mediaFilename'] = $filename;
                if ($collection === 'gallery') {
                    $record['imageUrl'] = build_media_serve_url('gallery', (string) $record['id'], 'original');
                    $record['thumbnailUrl'] = build_media_serve_url('gallery', (string) $record['id'], 'thumb');
                } else {
                    $record['coverImageUrl'] = build_media_serve_url($collection, (string) $record['id'], 'original');
                    $record['coverThumbnailUrl'] = build_media_serve_url($collection, (string) $record['id'], 'thumb');
                }
                $records[$idx] = $record;
            }
        }
    }

    // Lock collection and perform pre-restore backup -> staged media restore -> verification -> atomic JSON write
    $path = collection_path($collection);
    $lockPath = $path . '.lock';
    $lockHandle = fopen($lockPath, 'c+b');
    if ($lockHandle === false) {
        throw new RuntimeException('Unable to acquire collection lock for restoration.');
    }

    $stagingDir = BECCAN_TMP_DIR . '/restore_' . bin2hex(random_bytes(8));
    $writtenTempTargets = [];

    try {
        if (!flock($lockHandle, LOCK_EX)) {
            throw new RuntimeException('Unable to lock collection for restoration.');
        }

        // Stage restored media first so any copy failure occurs before mutating live data
        $stagedPairs = [];
        if ($restoreQueue !== []) {
            if (!mkdir($stagingDir, 0750, true)) {
                throw new RuntimeException('Unable to create temporary restoration staging directory.');
            }
            $counter = 0;
            foreach ($restoreQueue as $destPath => $backupMediaPath) {
                $counter++;
                $stagedFile = $stagingDir . '/item_' . $counter . '_' . basename($destPath);
                if (!@copy($backupMediaPath, $stagedFile) || (int) filesize($stagedFile) <= 0) {
                    throw new RuntimeException('Failed while staging backup media file ' . basename($destPath));
                }
                $stagedPairs[$destPath] = $stagedFile;
            }
        }

        // Create fresh safety backup of current live state BEFORE modifying live JSON or live media
        $safetyBackupId = create_collection_backup($collection, true);

        // Commit staged media via temp-swap per destination so unrelated live media is never touched
        $restoredCount = 0;
        $swappedFiles = [];
        try {
            foreach ($stagedPairs as $destPath => $stagedFile) {
                $destDir = dirname($destPath);
                if (!is_dir($destDir) && !@mkdir($destDir, 0750, true)) {
                    throw new RuntimeException('Unable to create destination media directory during restore.');
                }
                $tmpTarget = $destPath . '.restore_tmp.' . bin2hex(random_bytes(4));
                if (!@copy($stagedFile, $tmpTarget)) {
                    throw new RuntimeException('Failed to write restored media file ' . basename($destPath));
                }
                @chmod($tmpTarget, 0640);
                $writtenTempTargets[] = $tmpTarget;

                if (!@rename($tmpTarget, $destPath)) {
                    throw new RuntimeException('Failed to activate restored media file ' . basename($destPath));
                }
                $swappedFiles[] = $destPath;
                $restoredCount++;
            }

            // Verify every restored record's media exists on disk before replacing JSON
            if (in_array($collection, BECCAN_ALLOWED_MEDIA_CATEGORIES, true)) {
                foreach ($records as $record) {
                    $filename = extract_record_media_filename($record, $collection);
                    if ($filename === null) {
                        continue;
                    }
                    $orig = resolve_private_media_path($collection, $filename, 'original');
                    $thumb = resolve_private_media_path($collection, $filename, 'thumb');
                    if ($orig === null || !is_file($orig) || filesize($orig) <= 0 || $thumb === null || !is_file($thumb) || filesize($thumb) <= 0) {
                        throw new RuntimeException("Post-restore media verification failed for {$filename}.");
                    }
                }
            }

            atomic_write_json_file($path, $records);
        } catch (Throwable $e) {
            foreach ($writtenTempTargets as $tmpFile) {
                if (is_file($tmpFile)) {
                    @unlink($tmpFile);
                }
            }
            throw $e;
        }

        return [
            'collection' => $collection,
            'restoredFrom' => $snapshotId,
            'recordCount' => count($records),
            'restoredMediaFiles' => $restoredCount,
            'safetyBackupId' => $safetyBackupId,
        ];
    } finally {
        remove_backup_entry_recursive($stagingDir);
        flock($lockHandle, LOCK_UN);
        fclose($lockHandle);
    }
}

function build_complete_backup_zip(string $snapshotId): string
{
    if (!class_exists('ZipArchive')) {
        throw new RuntimeException('PHP ZipArchive extension (ext-zip) is not installed on this server.');
    }
    if (preg_match('/^(gallery|news|announcements|events)_\d{8}_\d{6}_[a-f0-9]+$/', $snapshotId) !== 1) {
        throw new InvalidArgumentException('Complete ZIP download is only available for v2 media-aware backup snapshots.');
    }

    $snapshotDir = BECCAN_BACKUP_DIR . '/' . $snapshotId;
    if (!is_dir($snapshotDir) || !is_file($snapshotDir . '/records.json')) {
        throw new RuntimeException('Backup snapshot not found.');
    }

    if (!is_dir(BECCAN_TMP_DIR)) {
        @mkdir(BECCAN_TMP_DIR, 0750, true);
    }
    $zipPath = BECCAN_TMP_DIR . '/export_' . $snapshotId . '_' . bin2hex(random_bytes(4)) . '.zip';
    $zip = new ZipArchive();
    if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
        throw new RuntimeException('Unable to create ZIP archive.');
    }

    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($snapshotDir, FilesystemIterator::SKIP_DOTS),
        RecursiveIteratorIterator::LEAVES_ONLY
    );
    $prefixLen = strlen($snapshotDir) + 1;
    foreach ($iterator as $file) {
        if ($file instanceof SplFileInfo && $file->isFile()) {
            $rel = str_replace('\\', '/', substr($file->getPathname(), $prefixLen));
            $zip->addFile($file->getPathname(), $rel);
        }
    }
    $zip->close();

    return $zipPath;
}
