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

$id = sanitize_plain_text($input['id'] ?? '', 60);
if ($id === '') {
    json_error('Article ID is required.', 422);
}

// Validate updated metadata BEFORE staging any uploaded image
if (array_key_exists('title', $input) && sanitize_plain_text($input['title'], 200) === '') {
    json_error('Title cannot be empty.', 422);
}
if (array_key_exists('summary', $input) && sanitize_plain_text($input['summary'], 450) === '') {
    json_error('Summary cannot be empty.', 422);
}
if (array_key_exists('content', $input) && sanitize_article_body($input['content']) === '') {
    json_error('Content cannot be empty.', 422);
}
if (array_key_exists('category', $input)) {
    validate_enum(sanitize_plain_text($input['category'], 60), BECCAN_NEWS_CATEGORIES, 'news category');
}
if (array_key_exists('status', $input)) {
    validate_enum(sanitize_plain_text($input['status'], 20), ['draft', 'published', 'archived'], 'publication status');
}
if (array_key_exists('publishedAt', $input) && trim((string) $input['publishedAt']) !== '') {
    if (normalize_utc_datetime((string) $input['publishedAt']) === null) {
        json_error('Invalid publication date format.', 422);
    }
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
        $stagedCover = stage_uploaded_image($_FILES['coverImage'], 'news', $stagingDir, 'Cover image');
        check_storage_quota_for_bytes((int) $stagedCover['totalStagedBytes']);
    }

    $result = mutate_json_collection(
        'news',
        static function (array $current) use ($id, $input, $stagedCover, $removeCover): array {
            $foundIndex = null;
            foreach ($current as $idx => $item) {
                if (($item['id'] ?? '') === $id) {
                    $foundIndex = $idx;
                    break;
                }
            }
            if ($foundIndex === null) {
                json_error('Article not found.', 404);
            }

            $article = $current[$foundIndex];
            $oldFilename = extract_record_media_filename($article, 'news');
            $cleanupOldCover = false;

            if (array_key_exists('title', $input)) {
                $title = sanitize_plain_text($input['title'], 200);
                $article['title'] = $title;
                if (($input['regenerateSlug'] ?? false) === true || ($input['regenerateSlug'] ?? '') === '1') {
                    $article['slug'] = ensure_unique_slug(generate_slug($title), $current, $id);
                }
            }

            if (array_key_exists('summary', $input)) {
                $article['summary'] = sanitize_plain_text($input['summary'], 450);
            }

            if (array_key_exists('content', $input)) {
                $article['content'] = sanitize_article_body($input['content']);
            }

            if (array_key_exists('category', $input)) {
                $article['category'] = sanitize_plain_text($input['category'], 60);
            }

            if (array_key_exists('status', $input)) {
                $article['status'] = sanitize_plain_text($input['status'], 20);
            }

            if (array_key_exists('publishedAt', $input)) {
                $rawDate = trim((string) $input['publishedAt']);
                $article['publishedAt'] = $rawDate === '' ? null : normalize_utc_datetime($rawDate);
            }

            if (($article['status'] ?? 'draft') === 'published' && empty($article['publishedAt'])) {
                $article['publishedAt'] = now_utc_iso();
            }

            if ($stagedCover !== null) {
                $article['mediaFilename'] = $stagedCover['mediaFilename'];
                $article['coverImageUrl'] = build_media_serve_url('news', $id, 'original');
                $article['coverThumbnailUrl'] = build_media_serve_url('news', $id, 'thumb');
                $cleanupOldCover = $oldFilename !== null;
            } elseif ($removeCover) {
                $article['mediaFilename'] = null;
                $article['coverImageUrl'] = null;
                $article['coverThumbnailUrl'] = null;
                $cleanupOldCover = $oldFilename !== null;
            }

            $article['updatedAt'] = now_utc_iso();
            $current[$foundIndex] = $article;

            return [
                'records' => $current,
                'return' => [
                    'article' => $article,
                    'oldFilenameToDelete' => $cleanupOldCover ? $oldFilename : null,
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

    if (!empty($result['oldFilenameToDelete'])) {
        delete_private_media_asset('news', $result['oldFilenameToDelete']);
    }

    json_success([
        'article' => $result['article'],
    ]);
} finally {
    if ($stagingDir !== null) {
        remove_directory_recursive($stagingDir);
    }
}
