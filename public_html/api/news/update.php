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

$id = sanitize_plain_text($input['id'] ?? '', 60);
if ($id === '') {
    json_error('Article ID is required.', 422);
}

$newCover = null;
if ($isMultipart && isset($_FILES['coverImage']) && (int) ($_FILES['coverImage']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE) {
    $newCover = process_uploaded_image($_FILES['coverImage'], 'news');
}

$removeCover = ($input['removeCoverImage'] ?? '') === '1' || ($input['removeCoverImage'] ?? false) === true;

$result = mutate_json_collection('news', static function (array $current) use ($id, $input, $newCover, $removeCover): array {
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
        json_error('Article not found.', 404);
    }

    $article = $current[$foundIndex];
    $oldCoverUrl = $article['coverImageUrl'] ?? null;
    $cleanupOldCover = false;

    if (array_key_exists('title', $input)) {
        $title = sanitize_plain_text($input['title'], 200);
        if ($title === '') {
            json_error('Title cannot be empty.', 422);
        }
        $article['title'] = $title;
        if (($input['regenerateSlug'] ?? false) === true || ($input['regenerateSlug'] ?? '') === '1') {
            $article['slug'] = ensure_unique_slug(generate_slug($title), $current, $id);
        }
    }

    if (array_key_exists('summary', $input)) {
        $summary = sanitize_plain_text($input['summary'], 450);
        if ($summary === '') {
            json_error('Summary cannot be empty.', 422);
        }
        $article['summary'] = $summary;
    }

    if (array_key_exists('content', $input)) {
        $content = sanitize_article_body($input['content']);
        if ($content === '') {
            json_error('Content cannot be empty.', 422);
        }
        $article['content'] = $content;
    }

    if (array_key_exists('category', $input)) {
        $category = sanitize_plain_text($input['category'], 60);
        validate_enum($category, BECCAN_NEWS_CATEGORIES, 'news category');
        $article['category'] = $category;
    }

    if (array_key_exists('status', $input)) {
        $status = sanitize_plain_text($input['status'], 20);
        validate_enum($status, ['draft', 'published', 'archived'], 'publication status');
        $article['status'] = $status;
    }

    if (array_key_exists('publishedAt', $input)) {
        $rawDate = trim((string) $input['publishedAt']);
        if ($rawDate === '') {
            $article['publishedAt'] = null;
        } else {
            $normalized = normalize_utc_datetime($rawDate);
            if ($normalized === null) {
                json_error('Invalid publication date format.', 422);
            }
            $article['publishedAt'] = $normalized;
        }
    }

    if (($article['status'] ?? 'draft') === 'published' && empty($article['publishedAt'])) {
        $article['publishedAt'] = now_utc_iso();
    }

    if ($newCover !== null) {
        $article['coverImageUrl'] = $newCover['imageUrl'];
        $article['coverThumbnailUrl'] = $newCover['thumbnailUrl'];
        $cleanupOldCover = true;
    } elseif ($removeCover) {
        $article['coverImageUrl'] = null;
        $article['coverThumbnailUrl'] = null;
        $cleanupOldCover = true;
    }

    $article['updatedAt'] = now_utc_iso();
    $current[$foundIndex] = $article;

    return [
        'records' => $current,
        'return' => [
            'article' => $article,
            'oldCoverToDelete' => $cleanupOldCover ? $oldCoverUrl : null,
        ],
    ];
});

if (!empty($result['oldCoverToDelete'])) {
    delete_uploaded_asset($result['oldCoverToDelete']);
}

json_success([
    'article' => $result['article'],
]);
