<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/_bootstrap.php';

require_http_method('POST');
require_admin_write_auth();

const BECCAN_GALLERY_CATEGORIES = [
    'School Life',
    'Academics',
    'Sports',
    'Events',
    'Facilities',
    'Activities',
];

$body = read_json_body();
$id = sanitize_plain_text($body['id'] ?? '', 60);
if ($id === '') {
    json_error('Photograph ID is required.', 422);
}

$updatedRecord = mutate_json_collection('gallery', static function (array $current) use ($id, $body): array {
    $foundIndex = null;
    foreach ($current as $idx => $item) {
        if (($item['id'] ?? '') === $id) {
            $foundIndex = $idx;
            break;
        }
    }
    if ($foundIndex === null) {
        json_error('Photograph record not found.', 404);
    }

    $record = $current[$foundIndex];

    if (array_key_exists('caption', $body)) {
        $caption = sanitize_plain_text($body['caption'], 180);
        if ($caption === '') {
            json_error('Caption cannot be empty.', 422);
        }
        $record['caption'] = $caption;
    }

    if (array_key_exists('description', $body)) {
        $record['description'] = sanitize_plain_text($body['description'], 600);
    }

    if (array_key_exists('category', $body)) {
        $category = sanitize_plain_text($body['category'], 40);
        validate_enum($category, BECCAN_GALLERY_CATEGORIES, 'gallery category');
        $record['category'] = $category;
    }

    if (array_key_exists('status', $body)) {
        $status = sanitize_plain_text($body['status'], 20);
        validate_enum($status, ['draft', 'published'], 'publication status');
        $record['status'] = $status;
        if ($status === 'published' && empty($record['publishedAt'])) {
            $record['publishedAt'] = now_utc_iso();
        } elseif ($status === 'draft') {
            $record['publishedAt'] = null;
        }
    }

    $record['updatedAt'] = now_utc_iso();
    $current[$foundIndex] = $record;

    return [
        'records' => $current,
        'return' => $record,
    ];
});

json_success([
    'item' => $updatedRecord,
]);
