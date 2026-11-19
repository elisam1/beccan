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
$todayUtc = substr(now_utc_iso(), 0, 10);

$events = read_json_collection('events');

$filtered = array_values(array_filter($events, static function (array $event) use ($isAdminScope, $statusFilter): bool {
    $status = (string) ($event['status'] ?? 'draft');
    if (!$isAdminScope) {
        return $status === 'published';
    }
    if ($statusFilter !== '' && $statusFilter !== 'all' && $status !== $statusFilter) {
        return false;
    }
    return true;
}));

$upcoming = [];
$past = [];

foreach ($filtered as $event) {
    $eventDate = (string) ($event['eventDate'] ?? '');
    $isUpcoming = $eventDate >= $todayUtc;
    $payload = $isAdminScope
        ? array_merge($event, ['isUpcoming' => $isUpcoming])
        : [
            'id' => $event['id'] ?? '',
            'title' => $event['title'] ?? '',
            'description' => $event['description'] ?? '',
            'eventDate' => $eventDate,
            'startTime' => $event['startTime'] ?? null,
            'endTime' => $event['endTime'] ?? null,
            'venue' => $event['venue'] ?? '',
            'coverImageUrl' => $event['coverImageUrl'] ?? null,
            'coverThumbnailUrl' => $event['coverThumbnailUrl'] ?? null,
            'isUpcoming' => $isUpcoming,
        ];

    if ($isUpcoming) {
        $upcoming[] = $payload;
    } else {
        $past[] = $payload;
    }
}

usort($upcoming, static fn (array $a, array $b): int => strcmp((string) $a['eventDate'], (string) $b['eventDate']));
usort($past, static fn (array $a, array $b): int => strcmp((string) $b['eventDate'], (string) $a['eventDate']));

json_success([
    'upcoming' => $upcoming,
    'past' => $past,
    'items' => array_merge($upcoming, $past),
]);
