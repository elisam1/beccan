<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/_bootstrap.php';

require_http_method('POST');
require_admin_write_auth();

$body = read_json_body();
$id = sanitize_plain_text($body['id'] ?? '', 60);
$status = sanitize_plain_text($body['status'] ?? '', 20);

if ($id === '' || $status === '') {
    json_error('Announcement ID and status are required.', 422);
}

validate_enum($status, ['draft', 'published', 'archived'], 'publication status');

$updated = mutate_json_collection('announcements', static function (array $current) use ($id, $status): array {
    $foundIndex = null;
    foreach ($current as $idx => $item) {
        if (($item['id'] ?? '') === $id) {
            $foundIndex = $idx;
            break;
        }
    }
    if ($foundIndex === null) {
        json_error('Announcement not found.', 404);
    }

    $record = $current[$foundIndex];
    $record['status'] = $status;
    if ($status === 'published' && empty($record['publishedAt'])) {
        $record['publishedAt'] = now_utc_iso();
    }
    $record['updatedAt'] = now_utc_iso();
    $current[$foundIndex] = $record;

    return [
        'records' => $current,
        'return' => $record,
    ];
});

json_success([
    'item' => $updated,
]);
