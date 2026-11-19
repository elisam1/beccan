<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/_bootstrap.php';

require_http_method('GET');

$slug = sanitize_plain_text($_GET['slug'] ?? '', 120);
if ($slug === '') {
    json_error('Article slug is required.', 422);
}

$allowPreview = ($_GET['preview'] ?? '') === '1';
if ($allowPreview) {
    require_admin_auth();
}

$articles = read_json_collection('news');
$nowUtc = now_utc_iso();

$matched = null;
foreach ($articles as $article) {
    if (($article['slug'] ?? '') === $slug) {
        $matched = $article;
        break;
    }
}

if ($matched === null) {
    json_error('Article not found.', 404);
}

if (!$allowPreview) {
    $status = (string) ($matched['status'] ?? 'draft');
    $pub = (string) ($matched['publishedAt'] ?? '');
    if ($status !== 'published' || ($pub !== '' && $pub > $nowUtc)) {
        json_error('Article not found.', 404);
    }
    $matched = [
        'id' => $matched['id'] ?? '',
        'title' => $matched['title'] ?? '',
        'slug' => $matched['slug'] ?? '',
        'summary' => $matched['summary'] ?? '',
        'content' => $matched['content'] ?? '',
        'coverImageUrl' => $matched['coverImageUrl'] ?? null,
        'coverThumbnailUrl' => $matched['coverThumbnailUrl'] ?? null,
        'category' => $matched['category'] ?? 'General News',
        'publishedAt' => $matched['publishedAt'] ?? null,
        'updatedAt' => $matched['updatedAt'] ?? '',
    ];
}

json_success([
    'article' => $matched,
]);
