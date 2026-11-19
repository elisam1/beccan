<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/_bootstrap.php';

require_http_method('POST');
require_admin_write_auth();

$body = read_json_body();
$id = sanitize_plain_text($body['id'] ?? '', 60);
if ($id === '') {
    json_error('Announcement ID is required.', 422);
}

mutate_json_collection('announcements', static function (array $current) use ($id): array {
    $found = false;
    $remaining = [];
    foreach ($current as $item) {
        if (($item['id'] ?? '') === $id) {
            $found = true;
            continue;
        }
        $remaining[] = $item;
    }
    if (!$found) {
        json_error('Announcement not found.', 404);
    }
    return [
        'records' => $remaining,
        'return' => true,
    ];
});

json_success([
    'deletedId' => $id,
]);
