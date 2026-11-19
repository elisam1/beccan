<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/_bootstrap.php';

require_http_method('POST');
require_admin_write_auth();

$body = read_json_body();
$id = sanitize_plain_text($body['id'] ?? '', 60);
if ($id === '') {
    json_error('Photograph ID is required.', 422);
}

$deletedRecord = mutate_json_collection('gallery', static function (array $current) use ($id): array {
    $removed = null;
    $remaining = [];
    foreach ($current as $item) {
        if (($item['id'] ?? '') === $id) {
            $removed = $item;
            continue;
        }
        $remaining[] = $item;
    }
    if ($removed === null) {
        json_error('Photograph record not found.', 404);
    }

    return [
        'records' => $remaining,
        'return' => $removed,
    ];
});

delete_record_media_assets($deletedRecord, 'gallery');

json_success([
    'deletedId' => $id,
]);
