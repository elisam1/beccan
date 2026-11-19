<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/_bootstrap.php';

require_http_method('GET');

$scope = (string) ($_GET['scope'] ?? 'public');
$isAdminScope = $scope === 'admin';
if ($isAdminScope) {
    require_admin_auth();
}

$statusFilter = trim((string) ($_GET['status'] ?? ''));
$categoryFilter = trim((string) ($_GET['category'] ?? ''));
$queryFilter = utf8_lower(trim((string) ($_GET['q'] ?? '')));
$nowUtc = now_utc_iso();

$articles = read_json_collection('news');

$filtered = array_values(array_filter($articles, static function (array $article) use (
    $isAdminScope,
    $statusFilter,
    $categoryFilter,
    $queryFilter,
    $nowUtc
): bool {
    $status = (string) ($article['status'] ?? 'draft');
    if (!$isAdminScope) {
        if ($status !== 'published') {
            return false;
        }
        $pub = (string) ($article['publishedAt'] ?? '');
        if ($pub !== '' && $pub > $nowUtc) {
            return false;
        }
    } else {
        if ($statusFilter !== '' && $statusFilter !== 'all' && $status !== $statusFilter) {
            return false;
        }
    }

    if ($categoryFilter !== '' && $categoryFilter !== 'All' && ($article['category'] ?? '') !== $categoryFilter) {
        return false;
    }

    if ($queryFilter !== '') {
        $haystack = utf8_lower(
            ($article['title'] ?? '') . ' ' . ($article['summary'] ?? '') . ' ' . ($article['content'] ?? '')
        );
        if (!str_contains($haystack, $queryFilter)) {
            return false;
        }
    }

    return true;
}));

usort($filtered, static function (array $a, array $b): int {
    $dateA = (string) ($a['publishedAt'] ?? ($a['updatedAt'] ?? $a['createdAt'] ?? ''));
    $dateB = (string) ($b['publishedAt'] ?? ($b['updatedAt'] ?? $b['createdAt'] ?? ''));
    return strcmp($dateB, $dateA);
});

if (!$isAdminScope) {
    $filtered = array_map(static fn (array $a): array => [
        'id' => $a['id'] ?? '',
        'title' => $a['title'] ?? '',
        'slug' => $a['slug'] ?? '',
        'summary' => $a['summary'] ?? '',
        'content' => $a['content'] ?? '',
        'coverImageUrl' => $a['coverImageUrl'] ?? null,
        'coverThumbnailUrl' => $a['coverThumbnailUrl'] ?? null,
        'category' => $a['category'] ?? 'General News',
        'publishedAt' => $a['publishedAt'] ?? null,
        'updatedAt' => $a['updatedAt'] ?? '',
    ], $filtered);
}

json_success([
    'items' => $filtered,
]);
