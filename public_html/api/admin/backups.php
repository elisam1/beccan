<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/_bootstrap.php';

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

if ($method === 'GET') {
    require_admin_auth();
    $download = $_GET['download'] ?? '';
    $format = strtolower(trim((string) ($_GET['format'] ?? 'json')));

    if (is_string($download) && $download !== '') {
        $isV2 = preg_match('/^(gallery|news|announcements|events)_\d{8}_\d{6}_[a-f0-9]+$/', $download) === 1;
        $isLegacy = !$isV2 && preg_match('/^(gallery|news|announcements|events)_\d{8}_\d{6}_[a-f0-9]+\.json$/', $download) === 1;

        if (!$isV2 && !$isLegacy) {
            json_error('Invalid backup identifier.', 400);
        }

        if ($format === 'zip') {
            if (!$isV2) {
                json_error('ZIP archive download is only available for complete media-aware snapshots.', 422);
            }
            if (!class_exists('ZipArchive')) {
                json_error(
                    'Complete ZIP download requires the PHP ZipArchive extension (ext-zip), which is not enabled on this server. Server-side backups and restorations remain active, and JSON records can still be downloaded.',
                    501
                );
            }
            try {
                $zipPath = build_complete_backup_zip($download);
            } catch (Throwable $e) {
                json_error($e->getMessage(), 404);
            }

            register_shutdown_function(static function () use ($zipPath): void {
                if (is_file($zipPath)) {
                    @unlink($zipPath);
                }
            });

            header('Content-Type: application/zip', true);
            header('Content-Disposition: attachment; filename="' . $download . '_complete.zip"', true);
            header('Content-Length: ' . (string) filesize($zipPath), true);
            readfile($zipPath);
            @unlink($zipPath);
            exit;
        }

        // JSON-only download (explicitly named records-only)
        $jsonPath = $isV2
            ? (BECCAN_BACKUP_DIR . '/' . $download . '/records.json')
            : (BECCAN_BACKUP_DIR . '/' . $download);

        if (!is_file($jsonPath)) {
            json_error('Backup file not found.', 404);
        }
        $outName = $isV2 ? ($download . '_records-only.json') : $download;
        header('Content-Type: application/json; charset=utf-8', true);
        header('Content-Disposition: attachment; filename="' . $outName . '"', true);
        header('Content-Length: ' . (string) filesize($jsonPath), true);
        readfile($jsonPath);
        exit;
    }

    $settings = read_cms_settings();
    $zipSupported = class_exists('ZipArchive');

    json_success([
        'backups' => list_backups(),
        'capabilities' => [
            'zipArchiveSupported' => $zipSupported,
            'retentionCount' => (int) $settings['backupRetentionCount'],
            'archiveUnavailableReason' => $zipSupported
                ? null
                : 'PHP ZipArchive extension (ext-zip) is not installed on this server. Complete media-aware backups and restorations continue to work on the server; enable ext-zip in cPanel PHP Selector to download complete .zip archives.',
        ],
    ]);
}

if ($method === 'POST') {
    require_admin_write_auth();
    $body = read_json_body();
    $action = (string) ($body['action'] ?? 'restore');

    if ($action === 'create') {
        $collection = sanitize_plain_text($body['collection'] ?? '', 30);
        if (!in_array($collection, BECCAN_ALLOWED_COLLECTIONS, true)) {
            json_error('Invalid collection specified for snapshot.', 422);
        }
        $snapshotId = create_collection_backup($collection, true);
        json_success([
            'snapshotId' => $snapshotId,
            'collection' => $collection,
        ], 201);
    }

    $filename = (string) ($body['filename'] ?? '');
    try {
        $result = restore_collection_backup($filename);
    } catch (InvalidArgumentException $e) {
        json_error($e->getMessage(), 422);
    } catch (RuntimeException $e) {
        $code = str_contains(strtolower($e->getMessage()), 'not found') ? 404 : 422;
        json_error($e->getMessage(), $code);
    }
    json_success($result);
}

header('Allow: GET, POST');
json_error('Method not allowed.', 405);
