<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit('CLI access only.');
}

require_once dirname(__DIR__) . '/config/bootstrap.php';

$arg = $argv[1] ?? '';

if ($arg === '' || $arg === '--list') {
    $backups = list_backups();
    if ($backups === []) {
        fwrite(STDOUT, "No backups found in private/backups/.\n");
        exit(0);
    }
    fwrite(STDOUT, "Available backups:\n");
    foreach ($backups as $b) {
        $typeLabel = $b['includesMedia'] ? 'JSON + Media' : 'JSON only';
        fwrite(STDOUT, sprintf(
            "  - %s (%s, %s, %d records, %d media files, %d bytes, %s)\n",
            $b['filename'],
            $b['collection'],
            $typeLabel,
            $b['recordCount'],
            $b['mediaFilesCount'],
            $b['sizeBytes'],
            $b['createdAt']
        ));
    }
    fwrite(STDOUT, "\nTo restore: php private/cli/restore-backup.php <snapshot_id>\n");
    exit(0);
}

try {
    $res = restore_collection_backup($arg);
    fwrite(STDOUT, sprintf(
        "Restored collection '%s' from '%s' (%d records, %d media files verified).\nSafety snapshot of previous state: %s\n",
        $res['collection'],
        $res['restoredFrom'],
        $res['recordCount'],
        $res['restoredMediaFiles'] ?? 0,
        $res['safetyBackupId'] ?? 'none'
    ));
} catch (Throwable $e) {
    fwrite(STDERR, 'Restore failed: ' . $e->getMessage() . PHP_EOL);
    exit(1);
}
