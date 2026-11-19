<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/_bootstrap.php';

$method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));
if (!in_array($method, ['GET', 'HEAD'], true)) {
    header('Allow: GET, HEAD');
    json_error('Method not allowed.', 405);
}

$category = (string) ($_GET['category'] ?? '');
$id = (string) ($_GET['id'] ?? '');
$variant = (string) ($_GET['variant'] ?? 'original');

if (!in_array($category, BECCAN_ALLOWED_MEDIA_CATEGORIES, true)) {
    json_error('Invalid media category.', 400);
}

if (!in_array($variant, ['original', 'thumb'], true)) {
    json_error('Invalid media variant.', 400);
}

$expectedPrefix = match ($category) {
    'gallery' => 'gal_',
    'news' => 'news_',
    'events' => 'evt_',
};

if (preg_match('/^' . preg_quote($expectedPrefix, '/') . '[a-f0-9]{16}$/', $id) !== 1) {
    json_error('Invalid media identifier.', 400);
}

$records = read_json_collection($category);
$matched = null;
foreach ($records as $record) {
    if (($record['id'] ?? '') === $id) {
        $matched = $record;
        break;
    }
}

if ($matched === null) {
    json_error('Media record not found.', 404);
}

$isAdmin = is_admin_authenticated();
$status = (string) ($matched['status'] ?? 'draft');
$isPubliclyPublished = $status === 'published';

if ($isPubliclyPublished && $category === 'news') {
    $pub = (string) ($matched['publishedAt'] ?? '');
    if ($pub !== '' && $pub > now_utc_iso()) {
        $isPubliclyPublished = false;
    }
}

if (!$isAdmin && !$isPubliclyPublished) {
    json_error('Access denied: this media item is not published.', 403);
}

$filename = extract_record_media_filename($matched, $category);
if ($filename === null) {
    json_error('Media file is not attached to this record.', 404);
}

$mediaPath = resolve_private_media_path($category, $filename, $variant);
if ($mediaPath === null || !is_file($mediaPath)) {
    json_error('Media file not found.', 404);
}

$realBase = realpath(BECCAN_MEDIA_DIR);
$realTarget = realpath($mediaPath);
if ($realBase === false || $realTarget === false || !str_starts_with($realTarget, $realBase . DIRECTORY_SEPARATOR)) {
    json_error('Invalid media location.', 403);
}

$ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
$fallbackMime = match ($ext) {
    'jpg', 'jpeg' => 'image/jpeg',
    'png' => 'image/png',
    'webp' => 'image/webp',
    default => null,
};

$detectedMime = $fallbackMime;
if (class_exists('finfo')) {
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $probe = (string) $finfo->file($realTarget);
    if (array_key_exists($probe, BECCAN_ALLOWED_IMAGE_MIMES)) {
        $detectedMime = $probe;
    } else {
        $detectedMime = null;
    }
}

if ($detectedMime === null) {
    json_error('Unsupported media type.', 415);
}

$fileSize = filesize($realTarget);
if ($fileSize === false || $fileSize <= 0) {
    json_error('Media file is unreadable.', 404);
}

header('Content-Type: ' . $detectedMime, true);
header('Content-Length: ' . (string) $fileSize, true);
header('Content-Disposition: inline; filename="' . $filename . '"', true);
header('X-Content-Type-Options: nosniff', true);
header('X-Frame-Options: DENY', true);

if ($isPubliclyPublished) {
    header('Cache-Control: private, max-age=60, must-revalidate', true);
} else {
    header('Cache-Control: private, no-store, no-cache, must-revalidate, max-age=0', true);
}

if ($method === 'GET') {
    readfile($realTarget);
}
exit;
