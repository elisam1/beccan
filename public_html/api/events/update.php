<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/_bootstrap.php';

require_http_method('POST');
require_admin_write_auth();

$isMultipart = str_contains(strtolower((string) ($_SERVER['CONTENT_TYPE'] ?? '')), 'multipart/form-data');
$input = $isMultipart ? $_POST : read_json_body();

$id = sanitize_plain_text($input['id'] ?? '', 60);
if ($id === '') {
    json_error('Event ID is required.', 422);
}

$newCover = null;
if ($isMultipart && isset($_FILES['coverImage']) && (int) ($_FILES['coverImage']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE) {
    $newCover = process_uploaded_image($_FILES['coverImage'], 'events');
}

$removeCover = ($input['removeCoverImage'] ?? '') === '1' || ($input['removeCoverImage'] ?? false) === true;

$result = mutate_json_collection('events', static function (array $current) use ($id, $input, $newCover, $removeCover): array {
    $foundIndex = null;
    foreach ($current as $idx => $item) {
        if (($item['id'] ?? '') === $id) {
            $foundIndex = $idx;
            break;
        }
    }
    if ($foundIndex === null) {
        if ($newCover !== null) {
            delete_uploaded_asset($newCover['imageUrl']);
        }
        json_error('Event not found.', 404);
    }

    $event = $current[$foundIndex];
    $oldCover = $event['coverImageUrl'] ?? null;
    $cleanupOld = false;

    if (array_key_exists('title', $input)) {
        $title = sanitize_plain_text($input['title'], 200);
        if ($title === '') {
            json_error('Title cannot be empty.', 422);
        }
        $event['title'] = $title;
    }

    if (array_key_exists('description', $input)) {
        $description = sanitize_article_body($input['description'], 4000);
        if ($description === '') {
            json_error('Description cannot be empty.', 422);
        }
        $event['description'] = $description;
    }

    if (array_key_exists('eventDate', $input)) {
        $date = normalize_utc_date_only((string) $input['eventDate']);
        if ($date === null) {
            json_error('Invalid event date (use YYYY-MM-DD).', 422);
        }
        $event['eventDate'] = $date;
    }

    if (array_key_exists('startTime', $input)) {
        $rawStart = trim((string) ($input['startTime'] ?? ''));
        if ($rawStart === '') {
            $event['startTime'] = null;
        } else {
            $t = normalize_time_hhmm($rawStart);
            if ($t === null) {
                json_error('Start time must use HH:MM format.', 422);
            }
            $event['startTime'] = $t;
        }
    }

    if (array_key_exists('endTime', $input)) {
        $rawEnd = trim((string) ($input['endTime'] ?? ''));
        if ($rawEnd === '') {
            $event['endTime'] = null;
        } else {
            $t = normalize_time_hhmm($rawEnd);
            if ($t === null) {
                json_error('End time must use HH:MM format.', 422);
            }
            $event['endTime'] = $t;
        }
    }

    if (!empty($event['startTime']) && !empty($event['endTime']) && $event['endTime'] < $event['startTime']) {
        json_error('End time cannot be earlier than start time.', 422);
    }

    if (array_key_exists('venue', $input)) {
        $venue = sanitize_plain_text($input['venue'], 180);
        if ($venue === '') {
            json_error('Venue cannot be empty.', 422);
        }
        $event['venue'] = $venue;
    }

    if (array_key_exists('status', $input)) {
        $status = sanitize_plain_text($input['status'], 20);
        validate_enum($status, ['draft', 'published', 'archived'], 'publication status');
        $event['status'] = $status;
    }

    if ($newCover !== null) {
        $event['coverImageUrl'] = $newCover['imageUrl'];
        $event['coverThumbnailUrl'] = $newCover['thumbnailUrl'];
        $cleanupOld = true;
    } elseif ($removeCover) {
        $event['coverImageUrl'] = null;
        $event['coverThumbnailUrl'] = null;
        $cleanupOld = true;
    }

    $event['updatedAt'] = now_utc_iso();
    $current[$foundIndex] = $event;

    return [
        'records' => $current,
        'return' => [
            'item' => $event,
            'oldCover' => $cleanupOld ? $oldCover : null,
        ],
    ];
});

if (!empty($result['oldCover'])) {
    delete_uploaded_asset($result['oldCover']);
}

json_success([
    'item' => $result['item'],
]);
