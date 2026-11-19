<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/_bootstrap.php';

require_http_method('POST');
require_admin_auth();
validate_multipart_request_or_fail();
verify_csrf_request();

$isMultipart = str_contains(strtolower((string) ($_SERVER['CONTENT_TYPE'] ?? '')), 'multipart/form-data');
$input = $isMultipart ? $_POST : read_json_body();

$id = sanitize_plain_text($input['id'] ?? '', 60);
if ($id === '') {
    json_error('Event ID is required.', 422);
}

// Validate fields BEFORE staging any replacement image
if (array_key_exists('title', $input) && sanitize_plain_text($input['title'], 200) === '') {
    json_error('Title cannot be empty.', 422);
}
if (array_key_exists('description', $input) && sanitize_article_body($input['description'], 4000) === '') {
    json_error('Description cannot be empty.', 422);
}
if (array_key_exists('eventDate', $input) && normalize_utc_date_only((string) $input['eventDate']) === null) {
    json_error('Invalid event date (use YYYY-MM-DD).', 422);
}
if (array_key_exists('startTime', $input)) {
    $rawStart = trim((string) ($input['startTime'] ?? ''));
    if ($rawStart !== '' && normalize_time_hhmm($rawStart) === null) {
        json_error('Start time must use HH:MM format.', 422);
    }
}
if (array_key_exists('endTime', $input)) {
    $rawEnd = trim((string) ($input['endTime'] ?? ''));
    if ($rawEnd !== '' && normalize_time_hhmm($rawEnd) === null) {
        json_error('End time must use HH:MM format.', 422);
    }
}
if (array_key_exists('venue', $input) && sanitize_plain_text($input['venue'], 180) === '') {
    json_error('Venue cannot be empty.', 422);
}
if (array_key_exists('status', $input)) {
    validate_enum(sanitize_plain_text($input['status'], 20), ['draft', 'published', 'archived'], 'publication status');
}

$hasNewCover = $isMultipart &&
    isset($_FILES['coverImage']) &&
    (int) ($_FILES['coverImage']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE;
$removeCover = ($input['removeCoverImage'] ?? '') === '1' || ($input['removeCoverImage'] ?? false) === true;

$stagingDir = null;
$stagedCover = null;
$committedPaths = [];

try {
    if ($hasNewCover) {
        require_upload_extensions_or_fail();
        $stagingDir = create_upload_staging_dir();
        $stagedCover = stage_uploaded_image($_FILES['coverImage'], 'events', $stagingDir, 'Event image');
        check_storage_quota_for_bytes((int) $stagedCover['totalStagedBytes']);
    }

    $result = mutate_json_collection(
        'events',
        static function (array $current) use ($id, $input, $stagedCover, $removeCover): array {
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
            $oldFilename = extract_record_media_filename($event, 'events');
            $cleanupOld = false;

            if (array_key_exists('title', $input)) {
                $event['title'] = sanitize_plain_text($input['title'], 200);
            }
            if (array_key_exists('description', $input)) {
                $event['description'] = sanitize_article_body($input['description'], 4000);
            }
            if (array_key_exists('eventDate', $input)) {
                $event['eventDate'] = normalize_utc_date_only((string) $input['eventDate']);
            }
            if (array_key_exists('startTime', $input)) {
                $rawStart = trim((string) ($input['startTime'] ?? ''));
                $event['startTime'] = $rawStart === '' ? null : normalize_time_hhmm($rawStart);
            }
            if (array_key_exists('endTime', $input)) {
                $rawEnd = trim((string) ($input['endTime'] ?? ''));
                $event['endTime'] = $rawEnd === '' ? null : normalize_time_hhmm($rawEnd);
            }

            if (!empty($event['startTime']) && !empty($event['endTime']) && $event['endTime'] < $event['startTime']) {
                json_error('End time cannot be earlier than start time.', 422);
            }

            if (array_key_exists('venue', $input)) {
                $event['venue'] = sanitize_plain_text($input['venue'], 180);
            }
            if (array_key_exists('status', $input)) {
                $event['status'] = sanitize_plain_text($input['status'], 20);
            }

            if ($stagedCover !== null) {
                $event['mediaFilename'] = $stagedCover['mediaFilename'];
                $event['coverImageUrl'] = build_media_serve_url('events', $id, 'original');
                $event['coverThumbnailUrl'] = build_media_serve_url('events', $id, 'thumb');
                $cleanupOld = $oldFilename !== null;
            } elseif ($removeCover) {
                $event['mediaFilename'] = null;
                $event['coverImageUrl'] = null;
                $event['coverThumbnailUrl'] = null;
                $cleanupOld = $oldFilename !== null;
            }

            $event['updatedAt'] = now_utc_iso();
            $current[$foundIndex] = $event;

            return [
                'records' => $current,
                'return' => [
                    'item' => $event,
                    'oldFilename' => $cleanupOld ? $oldFilename : null,
                ],
            ];
        },
        static function () use ($stagedCover, &$committedPaths): void {
            if ($stagedCover !== null) {
                $committedPaths = commit_staged_images([$stagedCover]);
            }
        },
        static function () use (&$committedPaths): void {
            rollback_committed_images($committedPaths);
        }
    );

    if (!empty($result['oldFilename'])) {
        delete_private_media_asset('events', $result['oldFilename']);
    }

    json_success([
        'item' => $result['item'],
    ]);
} finally {
    if ($stagingDir !== null) {
        remove_directory_recursive($stagingDir);
    }
}
