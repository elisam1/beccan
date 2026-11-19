<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/_bootstrap.php';

require_http_method('POST');
require_admin_write_auth();

$isMultipart = str_contains(strtolower((string) ($_SERVER['CONTENT_TYPE'] ?? '')), 'multipart/form-data');
$input = $isMultipart ? $_POST : read_json_body();

$title = sanitize_plain_text($input['title'] ?? '', 200);
$description = sanitize_article_body($input['description'] ?? '', 4000);
$eventDate = normalize_utc_date_only(isset($input['eventDate']) ? (string) $input['eventDate'] : null);
$startTime = normalize_time_hhmm(isset($input['startTime']) ? (string) $input['startTime'] : null);
$endTime = normalize_time_hhmm(isset($input['endTime']) ? (string) $input['endTime'] : null);
$venue = sanitize_plain_text($input['venue'] ?? '', 180);
$status = sanitize_plain_text($input['status'] ?? 'draft', 20);

if ($title === '' || $description === '' || $eventDate === null || $venue === '') {
    json_error('Title, description, valid event date (YYYY-MM-DD), and venue are required.', 422);
}

if (isset($input['startTime']) && trim((string) $input['startTime']) !== '' && $startTime === null) {
    json_error('Start time must use HH:MM format.', 422);
}
if (isset($input['endTime']) && trim((string) $input['endTime']) !== '' && $endTime === null) {
    json_error('End time must use HH:MM format.', 422);
}
if ($startTime !== null && $endTime !== null && $endTime < $startTime) {
    json_error('End time cannot be earlier than start time.', 422);
}

validate_enum($status, ['draft', 'published', 'archived'], 'publication status');

$coverImageUrl = null;
$coverThumbnailUrl = null;
if ($isMultipart && isset($_FILES['coverImage']) && (int) ($_FILES['coverImage']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE) {
    $uploaded = process_uploaded_image($_FILES['coverImage'], 'events');
    $coverImageUrl = $uploaded['imageUrl'];
    $coverThumbnailUrl = $uploaded['thumbnailUrl'];
}

$now = now_utc_iso();
$created = mutate_json_collection('events', static function (array $current) use (
    $title,
    $description,
    $eventDate,
    $startTime,
    $endTime,
    $venue,
    $coverImageUrl,
    $coverThumbnailUrl,
    $status,
    $now
): array {
    $item = [
        'id' => generate_unique_id('evt'),
        'title' => $title,
        'description' => $description,
        'eventDate' => $eventDate,
        'startTime' => $startTime,
        'endTime' => $endTime,
        'venue' => $venue,
        'coverImageUrl' => $coverImageUrl,
        'coverThumbnailUrl' => $coverThumbnailUrl,
        'status' => $status,
        'createdAt' => $now,
        'updatedAt' => $now,
    ];
    array_unshift($current, $item);
    return [
        'records' => $current,
        'return' => $item,
    ];
});

json_success([
    'item' => $created,
], 201);
