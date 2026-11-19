<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/_bootstrap.php';

require_http_method('POST');
require_admin_write_auth();

const BECCAN_NEWS_CATEGORIES = [
    'Academic News',
    'School Activities',
    'Achievements',
    'Sports',
    'General News',
];

$isMultipart = str_contains(strtolower((string) ($_SERVER['CONTENT_TYPE'] ?? '')), 'multipart/form-data');
$input = $isMultipart ? $_POST : read_json_body();

$title = sanitize_plain_text($input['title'] ?? '', 200);
$summary = sanitize_plain_text($input['summary'] ?? '', 450);
$content = sanitize_article_body($input['content'] ?? '');
$category = sanitize_plain_text($input['category'] ?? 'General News', 60);
$status = sanitize_plain_text($input['status'] ?? 'draft', 20);
$requestedDate = isset($input['publishedAt']) ? (string) $input['publishedAt'] : null;

if ($title === '' || $summary === '' || $content === '') {
    json_error('Title, summary, and article content are required.', 422);
}

validate_enum($category, BECCAN_NEWS_CATEGORIES, 'news category');
validate_enum($status, ['draft', 'published', 'archived'], 'publication status');

$publishedAt = null;
if ($requestedDate !== null && trim($requestedDate) !== '') {
    $publishedAt = normalize_utc_datetime($requestedDate);
    if ($publishedAt === null) {
        json_error('Invalid publication date format.', 422);
    }
} elseif ($status === 'published') {
    $publishedAt = now_utc_iso();
}

$coverImageUrl = null;
$coverThumbnailUrl = null;
if ($isMultipart && isset($_FILES['coverImage']) && (int) ($_FILES['coverImage']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE) {
    $uploaded = process_uploaded_image($_FILES['coverImage'], 'news');
    $coverImageUrl = $uploaded['imageUrl'];
    $coverThumbnailUrl = $uploaded['thumbnailUrl'];
}

$now = now_utc_iso();
$created = mutate_json_collection('news', static function (array $current) use (
    $title,
    $summary,
    $content,
    $category,
    $status,
    $publishedAt,
    $coverImageUrl,
    $coverThumbnailUrl,
    $now
): array {
    $id = generate_unique_id('news');
    $slug = ensure_unique_slug(generate_slug($title), $current);

    $article = [
        'id' => $id,
        'title' => $title,
        'slug' => $slug,
        'summary' => $summary,
        'content' => $content,
        'coverImageUrl' => $coverImageUrl,
        'coverThumbnailUrl' => $coverThumbnailUrl,
        'category' => $category,
        'status' => $status,
        'createdAt' => $now,
        'updatedAt' => $now,
        'publishedAt' => $publishedAt,
    ];

    array_unshift($current, $article);
    return [
        'records' => $current,
        'return' => $article,
    ];
});

json_success([
    'article' => $created,
], 201);
