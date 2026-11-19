<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/_bootstrap.php';

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

if ($method === 'GET') {
    require_admin_auth();
    json_success([
        'storage' => get_media_storage_stats(),
        'phpEnvironment' => get_php_upload_environment(),
        'settings' => read_cms_settings(),
    ]);
}

if ($method === 'POST') {
    require_admin_write_auth();
    $body = read_json_body();

    $updates = [];
    if (array_key_exists('storageLimitBytes', $body)) {
        $raw = $body['storageLimitBytes'];
        $updates['storageLimitBytes'] = ($raw === null || $raw === '') ? null : (int) $raw;
    }
    if (array_key_exists('storageWarningPercent', $body)) {
        $updates['storageWarningPercent'] = (int) $body['storageWarningPercent'];
    }
    if (array_key_exists('backupRetentionCount', $body)) {
        $updates['backupRetentionCount'] = (int) $body['backupRetentionCount'];
    }

    try {
        $saved = save_cms_settings($updates);
    } catch (InvalidArgumentException $e) {
        json_error($e->getMessage(), 422);
    }

    json_success([
        'settings' => $saved,
        'storage' => get_media_storage_stats(),
        'phpEnvironment' => get_php_upload_environment(),
    ]);
}

header('Allow: GET, POST');
json_error('Method not allowed.', 405);
