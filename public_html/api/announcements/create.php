<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/_bootstrap.php';

require_http_method('POST');
require_admin_write_auth();

const BECCAN_ANNOUNCEMENT_PRIORITIES = ['Normal', 'Important', 'Urgent'];

$body = read_json_body();
$title = sanitize_plain_text($body['title'] ?? '', 180);
$message = sanitize_article_body($body['message'] ?? '', 4000);
$priority = sanitize_plain_text($body['priority'] ?? 'Normal', 20);
$status = sanitize_plain_text($body['status'] ?? 'draft', 20);
$rawPublishedAt = isset($body['publishedAt']) ? (string) $body['publishedAt'] : null;
$rawExpiresAt = isset($body['expiresAt']) ? (string) $body['expiresAt'] : null;

if ($title === '' || $message === '') {
    json_error('Announcement title and message are required.', 422);
}

validate_enum($priority, BECCAN_ANNOUNCEMENT_PRIORITIES, 'priority level');
validate_enum($status, ['draft', 'published', 'archived'], 'publication status');

$publishedAt = null;
if ($rawPublishedAt !== null && trim($rawPublishedAt) !== '') {
    $publishedAt = normalize_utc_datetime($rawPublishedAt);
    if ($publishedAt === null) {
        json_error('Invalid publication date format.', 422);
    }
} elseif ($status === 'published') {
    $publishedAt = now_utc_iso();
}

$expiresAt = null;
if ($rawExpiresAt !== null && trim($rawExpiresAt) !== '') {
    $expiresAt = normalize_utc_date_only($rawExpiresAt);
    if ($expiresAt === null) {
        json_error('Invalid expiry date format (use YYYY-MM-DD).', 422);
    }
}

$now = now_utc_iso();
$created = mutate_json_collection('announcements', static function (array $current) use (
    $title,
    $message,
    $priority,
    $status,
    $publishedAt,
    $expiresAt,
    $now
): array {
    $item = [
        'id' => generate_unique_id('ann'),
        'title' => $title,
        'message' => $message,
        'priority' => $priority,
        'status' => $status,
        'createdAt' => $now,
        'publishedAt' => $publishedAt,
        'expiresAt' => $expiresAt,
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
