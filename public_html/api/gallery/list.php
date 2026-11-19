<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/_bootstrap.php';

require_http_method('GET');

$scope = (string) ($_GET['scope'] ?? 'public');
$isAdminScope = $scope === 'admin';
if ($isAdminScope) {
    require_admin_auth();
}

$categoryFilter = trim((string) ($_GET['category'] ?? ''));
$statusFilter = trim((string) ($_GET['status'] ?? ''));
$queryFilter = utf8_lower(trim((string) ($_GET['q'] ?? '')));

$items = read_json_collection('gallery');

$filtered = array_values(array_filter($items, static function (array $item) use (
    $isAdminScope,
    $categoryFilter,
    $statusFilter,
    $queryFilter
): bool {
    $status = (string) ($item['status'] ?? 'draft');
    if (!$isAdminScope && $status !== 'published') {
        return false;
    }
    if ($isAdminScope && $statusFilter !== '' && $statusFilter !== 'all' && $status !== $statusFilter) {
        return false;
    }
    if ($categoryFilter !== '' && $categoryFilter !== 'All' && ($item['category'] ?? '') !== $categoryFilter) {
        return false;
    }
    if ($queryFilter !== '') {
        $haystack = utf8_lower(
            ($item['caption'] ?? '') . ' ' . ($item['description'] ?? '') . ' ' . ($item['category'] ?? '')
        );
        if (!str_contains($haystack, $queryFilter)) {
            return false;
        }
    }
    return true;
}));

usort($filtered, static fn (array $a, array $b): int =>
    strcmp((string) ($b['uploadedAt'] ?? ''), (string) ($a['uploadedAt'] ?? ''))
);

if (!$isAdminScope) {
    $filtered = array_map(static fn (array $item): array => [
        'id' => $item['id'] ?? '',
        'caption' => $item['caption'] ?? '',
        'description' => $item['description'] ?? '',
        'category' => $item['category'] ?? 'School Life',
        'imageUrl' => $item['imageUrl'] ?? '',
        'thumbnailUrl' => $item['thumbnailUrl'] ?? ($item['imageUrl'] ?? ''),
        'width' => $item['width'] ?? null,
        'height' => $item['height'] ?? null,
        'uploadedAt' => $item['uploadedAt'] ?? '',
        'publishedAt' => $item['publishedAt'] ?? null,
    ], $filtered);
}

json_success([
    'items' => $filtered,
]);
