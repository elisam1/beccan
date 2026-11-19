<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/_bootstrap.php';

require_http_method('POST');
require_admin_write_auth();

$body = read_json_body();
$id = sanitize_plain_text($body['id'] ?? '', 60);
if ($id === '') {
    json_error('Article ID is required.', 422);
}

$removed = mutate_json_collection('news', static function (array $current) use ($id): array {
    $deleted = null;
    $remaining = [];
    foreach ($current as $item) {
        if (($item['id'] ?? '') === $id) {
            $deleted = $item;
            continue;
        }
        $remaining[] = $item;
    }
    if ($deleted === null) {
        json_error('Article not found.', 404);
    }
    return [
        'records' => $remaining,
        'return' => $deleted,
    ];
});

delete_record_media_assets($removed, 'news');

json_success([
    'deletedId' => $id,
]);
