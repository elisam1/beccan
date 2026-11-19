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
$priorityFilter = trim((string) ($_GET['priority'] ?? ''));
$nowUtc = now_utc_iso();
$todayUtc = substr($nowUtc, 0, 10);

$items = read_json_collection('announcements');

$filtered = array_values(array_filter($items, static function (array $item) use (
    $isAdminScope,
    $statusFilter,
    $priorityFilter,
    $nowUtc,
    $todayUtc
): bool {
    $status = (string) ($item['status'] ?? 'draft');
    if (!$isAdminScope) {
        if ($status !== 'published') {
            return false;
        }
        $pub = (string) ($item['publishedAt'] ?? '');
        if ($pub !== '' && $pub > $nowUtc) {
            return false;
        }
        $exp = $item['expiresAt'] ?? null;
        if (is_string($exp) && $exp !== '' && $exp < $todayUtc) {
            return false;
        }
    } else {
        if ($statusFilter !== '' && $statusFilter !== 'all' && $status !== $statusFilter) {
            return false;
        }
    }

    if ($priorityFilter !== '' && $priorityFilter !== 'All' && ($item['priority'] ?? '') !== $priorityFilter) {
        return false;
    }

    return true;
}));

$priorityRank = ['Urgent' => 3, 'Important' => 2, 'Normal' => 1];
usort($filtered, static function (array $a, array $b) use ($priorityRank): int {
    $rankA = $priorityRank[$a['priority'] ?? 'Normal'] ?? 1;
    $rankB = $priorityRank[$b['priority'] ?? 'Normal'] ?? 1;
    if ($rankA !== $rankB) {
        return $rankB <=> $rankA;
    }
    return strcmp((string) ($b['publishedAt'] ?? $b['updatedAt'] ?? ''), (string) ($a['publishedAt'] ?? $a['updatedAt'] ?? ''));
});

if (!$isAdminScope) {
    $filtered = array_map(static fn (array $a): array => [
        'id' => $a['id'] ?? '',
        'title' => $a['title'] ?? '',
        'message' => $a['message'] ?? '',
        'priority' => $a['priority'] ?? 'Normal',
        'publishedAt' => $a['publishedAt'] ?? null,
        'expiresAt' => $a['expiresAt'] ?? null,
    ], $filtered);
} else {
    $filtered = array_map(static function (array $a) use ($todayUtc): array {
        $exp = $a['expiresAt'] ?? null;
        $a['isExpired'] = is_string($exp) && $exp !== '' && $exp < $todayUtc;
        return $a;
    }, $filtered);
}

json_success([
    'items' => $filtered,
]);
