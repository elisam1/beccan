<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/_bootstrap.php';

require_http_method('POST');
require_admin_write_auth();

const BECCAN_ANNOUNCEMENT_PRIORITIES = ['Normal', 'Important', 'Urgent'];

$body = read_json_body();
$id = sanitize_plain_text($body['id'] ?? '', 60);
if ($id === '') {
    json_error('Announcement ID is required.', 422);
}

$updated = mutate_json_collection('announcements', static function (array $current) use ($id, $body): array {
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

    if (array_key_exists('title', $body)) {
        $title = sanitize_plain_text($body['title'], 180);
        if ($title === '') {
            json_error('Title cannot be empty.', 422);
        }
        $record['title'] = $title;
    }

    if (array_key_exists('message', $body)) {
        $message = sanitize_article_body($body['message'], 4000);
        if ($message === '') {
            json_error('Message cannot be empty.', 422);
        }
        $record['message'] = $message;
    }

    if (array_key_exists('priority', $body)) {
        $priority = sanitize_plain_text($body['priority'], 20);
        validate_enum($priority, BECCAN_ANNOUNCEMENT_PRIORITIES, 'priority level');
        $record['priority'] = $priority;
    }

    if (array_key_exists('status', $body)) {
        $status = sanitize_plain_text($body['status'], 20);
        validate_enum($status, ['draft', 'published', 'archived'], 'publication status');
        $record['status'] = $status;
    }

    if (array_key_exists('publishedAt', $body)) {
        $raw = trim((string) ($body['publishedAt'] ?? ''));
        if ($raw === '') {
            $record['publishedAt'] = null;
        } else {
            $normalized = normalize_utc_datetime($raw);
            if ($normalized === null) {
                json_error('Invalid publication date format.', 422);
            }
            $record['publishedAt'] = $normalized;
        }
    }

    if (array_key_exists('expiresAt', $body)) {
        $raw = trim((string) ($body['expiresAt'] ?? ''));
        if ($raw === '') {
            $record['expiresAt'] = null;
        } else {
            $normalized = normalize_utc_date_only($raw);
            if ($normalized === null) {
                json_error('Invalid expiry date format (use YYYY-MM-DD).', 422);
            }
            $record['expiresAt'] = $normalized;
        }
    }

    if (($record['status'] ?? 'draft') === 'published' && empty($record['publishedAt'])) {
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
