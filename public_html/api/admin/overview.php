<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/_bootstrap.php';

require_http_method('GET');
require_admin_auth();

$gallery = read_json_collection('gallery');
$news = read_json_collection('news');
$announcements = read_json_collection('announcements');
$events = read_json_collection('events');
$backups = list_backups();

$nowUtc = now_utc_iso();
$todayUtc = substr($nowUtc, 0, 10);

$publishedPhotos = count(array_filter($gallery, static fn (array $g): bool => ($g['status'] ?? 'draft') === 'published'));
$draftPhotos = count($gallery) - $publishedPhotos;

$publishedNews = count(array_filter($news, static fn (array $n): bool => ($n['status'] ?? 'draft') === 'published'));
$draftNews = count(array_filter($news, static fn (array $n): bool => ($n['status'] ?? 'draft') === 'draft'));
$archivedNews = count(array_filter($news, static fn (array $n): bool => ($n['status'] ?? 'draft') === 'archived'));

$activeAnnouncements = count(array_filter($announcements, static function (array $a) use ($nowUtc, $todayUtc): bool {
    if (($a['status'] ?? 'draft') !== 'published') {
        return false;
    }
    $pub = (string) ($a['publishedAt'] ?? '');
    if ($pub !== '' && $pub > $nowUtc) {
        return false;
    }
    $exp = $a['expiresAt'] ?? null;
    if (is_string($exp) && $exp !== '' && $exp < $todayUtc) {
        return false;
    }
    return true;
}));

$upcomingEvents = count(array_filter($events, static fn (array $e): bool =>
    ($e['status'] ?? 'draft') === 'published' && (string) ($e['eventDate'] ?? '') >= $todayUtc
));

$pastEvents = count(array_filter($events, static fn (array $e): bool =>
    ($e['status'] ?? 'draft') === 'published' && (string) ($e['eventDate'] ?? '') < $todayUtc
));

$activity = [];
foreach ($gallery as $item) {
    $activity[] = [
        'type' => 'gallery',
        'id' => $item['id'] ?? '',
        'title' => $item['caption'] ?? 'Untitled photo',
        'status' => $item['status'] ?? 'draft',
        'updatedAt' => $item['updatedAt'] ?? ($item['uploadedAt'] ?? ''),
    ];
}
foreach ($news as $item) {
    $activity[] = [
        'type' => 'news',
        'id' => $item['id'] ?? '',
        'title' => $item['title'] ?? 'Untitled article',
        'status' => $item['status'] ?? 'draft',
        'updatedAt' => $item['updatedAt'] ?? ($item['createdAt'] ?? ''),
    ];
}
foreach ($announcements as $item) {
    $activity[] = [
        'type' => 'announcement',
        'id' => $item['id'] ?? '',
        'title' => $item['title'] ?? 'Untitled announcement',
        'status' => $item['status'] ?? 'draft',
        'updatedAt' => $item['updatedAt'] ?? ($item['createdAt'] ?? ''),
    ];
}
foreach ($events as $item) {
    $activity[] = [
        'type' => 'event',
        'id' => $item['id'] ?? '',
        'title' => $item['title'] ?? 'Untitled event',
        'status' => $item['status'] ?? 'draft',
        'updatedAt' => $item['updatedAt'] ?? ($item['createdAt'] ?? ''),
    ];
}

usort($activity, static fn (array $a, array $b): int => strcmp((string) $b['updatedAt'], (string) $a['updatedAt']));

json_success([
    'counts' => [
        'publishedPhotos' => $publishedPhotos,
        'draftPhotos' => $draftPhotos,
        'publishedNews' => $publishedNews,
        'draftNews' => $draftNews,
        'archivedNews' => $archivedNews,
        'activeAnnouncements' => $activeAnnouncements,
        'totalAnnouncements' => count($announcements),
        'upcomingEvents' => $upcomingEvents,
        'pastEvents' => $pastEvents,
        'backupCount' => count($backups),
    ],
    'recentActivity' => array_slice($activity, 0, 10),
]);
