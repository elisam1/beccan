<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/_bootstrap.php';

require_http_method('POST');
require_admin_auth();
validate_multipart_request_or_fail();
verify_csrf_request();

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
        $stagedCover = stage_uploaded_image($_FILES['coverImage'], 'news', $stagingDir, 'Cover image');
        check_storage_quota_for_bytes((int) $stagedCover['totalStagedBytes']);
    }

    $id = generate_unique_id('news');
    $now = now_utc_iso();
    $mediaFilename = $stagedCover ? $stagedCover['mediaFilename'] : null;
    $coverImageUrl = $stagedCover ? build_media_serve_url('news', $id, 'original') : null;
    $coverThumbnailUrl = $stagedCover ? build_media_serve_url('news', $id, 'thumb') : null;

    $created = mutate_json_collection(
        'news',
        static function (array $current) use (
            $id,
            $title,
            $summary,
            $content,
            $category,
            $status,
            $publishedAt,
            $mediaFilename,
            $coverImageUrl,
            $coverThumbnailUrl,
            $now
        ): array {
            $slug = ensure_unique_slug(generate_slug($title), $current);

            $article = [
                'id' => $id,
                'title' => $title,
                'slug' => $slug,
                'summary' => $summary,
                'content' => $content,
                'mediaFilename' => $mediaFilename,
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
        'article' => $created,
    ], 201);
} finally {
    if ($stagingDir !== null) {
        remove_directory_recursive($stagingDir);
    }
}
