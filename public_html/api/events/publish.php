<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/_bootstrap.php';

require_http_method('POST');
require_admin_write_auth();

$body = read_json_body();
$id = sanitize_plain_text($body['id'] ?? '', 60);
$status = sanitize_plain_text($body['status'] ?? '', 20);

if ($id === '' || $status === '') {
    json_error('Event ID and status are required.', 422);
}

validate_enum($status, ['draft', 'published', 'archived'], 'publication status');

$updated = mutate_json_collection('events', static function (array $current) use ($id, $status): array {
    $foundIndex = null;
    foreach ($current as $idx => $item) {
        if (($item['id'] ?? '') === $id) {
            $foundIndex = $idx;
            break;
        }
    }
    if ($foundIndex === null) {
        json_error('Event not found.', 404);
    }

    $event = $current[$foundIndex];
    $event['status'] = $status;
    $event['updatedAt'] = now_utc_iso();
    $current[$foundIndex] = $event;

    return [
        'records' => $current,
        'return' => $event,
    ];
});

json_success([
    'item' => $updated,
]);
