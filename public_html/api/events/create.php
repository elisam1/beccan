<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/_bootstrap.php';

require_http_method('POST');
require_admin_auth();
validate_multipart_request_or_fail();
verify_csrf_request();

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

$hasCoverUpload = $isMultipart &&
    isset($_FILES['coverImage']) &&
    (int) ($_FILES['coverImage']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE;

$stagingDir = null;
$stagedCover = null;
$committedPaths = [];

try {
    if ($hasCoverUpload) {
        require_upload_extensions_or_fail();
        $stagingDir = create_upload_staging_dir();
        $stagedCover = stage_uploaded_image($_FILES['coverImage'], 'events', $stagingDir, 'Event image');
        check_storage_quota_for_bytes((int) $stagedCover['totalStagedBytes']);
    }

    $id = generate_unique_id('evt');
    $now = now_utc_iso();
    $mediaFilename = $stagedCover ? $stagedCover['mediaFilename'] : null;
    $coverImageUrl = $stagedCover ? build_media_serve_url('events', $id, 'original') : null;
    $coverThumbnailUrl = $stagedCover ? build_media_serve_url('events', $id, 'thumb') : null;

    $created = mutate_json_collection(
        'events',
        static function (array $current) use (
            $id,
            $title,
            $description,
            $eventDate,
            $startTime,
            $endTime,
            $venue,
            $mediaFilename,
            $coverImageUrl,
            $coverThumbnailUrl,
            $status,
            $now
        ): array {
            $item = [
                'id' => $id,
                'title' => $title,
                'description' => $description,
                'eventDate' => $eventDate,
                'startTime' => $startTime,
                'endTime' => $endTime,
                'venue' => $venue,
                'mediaFilename' => $mediaFilename,
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

    json_success([
        'item' => $created,
    ], 201);
} finally {
    if ($stagingDir !== null) {
        remove_directory_recursive($stagingDir);
    }
}
