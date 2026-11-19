<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/_bootstrap.php';

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

if ($method === 'GET') {
    require_admin_auth();
    $download = $_GET['download'] ?? '';
    if (is_string($download) && $download !== '') {
        if (!preg_match('/^(gallery|news|announcements|events)_\d{8}_\d{6}_[a-f0-9]+\.json$/', $download)) {
            json_error('Invalid backup filename.', 400);
        }
        $path = BECCAN_BACKUP_DIR . '/' . $download;
        if (!is_file($path)) {
            json_error('Backup file not found.', 404);
        }
        header('Content-Type: application/json; charset=utf-8');
        header('Content-Disposition: attachment; filename="' . $download . '"');
        header('Content-Length: ' . (string) filesize($path));
        readfile($path);
        exit;
    }

    json_success([
        'backups' => list_backups(),
    ]);
}

if ($method === 'POST') {
    require_admin_write_auth();
    $body = read_json_body();
    $filename = (string) ($body['filename'] ?? '');
    try {
        $result = restore_collection_backup($filename);
    } catch (InvalidArgumentException $e) {
        json_error($e->getMessage(), 422);
    } catch (RuntimeException $e) {
        json_error($e->getMessage(), 404);
    }
    json_success($result);
}

header('Allow: GET, POST');
json_error('Method not allowed.', 405);
