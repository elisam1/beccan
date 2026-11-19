<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/_bootstrap.php';

require_http_method('POST');
require_admin_write_auth();

const BECCAN_GALLERY_CATEGORIES = [
    'School Life',
    'Academics',
    'Sports',
    'Events',
    'Facilities',
    'Activities',
];

$rawFiles = $_FILES['photos'] ?? ($_FILES['photo'] ?? null);
if (!is_array($rawFiles)) {
    json_error('Please select at least one photograph to upload.', 422);
}

$files = normalize_uploaded_files_array($rawFiles);
if ($files === [] || count($files) > 12) {
    json_error('You may upload between 1 and 12 photographs per request.', 422);
}

$captionsPost = $_POST['captions'] ?? null;
$descriptionsPost = $_POST['descriptions'] ?? null;
$categoriesPost = $_POST['categories'] ?? null;
$defaultCaption = sanitize_plain_text($_POST['caption'] ?? '', 180);
$defaultDescription = sanitize_plain_text($_POST['description'] ?? '', 600);
$defaultCategory = sanitize_plain_text($_POST['category'] ?? 'School Life', 40);

$createdItems = [];
foreach ($files as $idx => $file) {
    $uploaded = process_uploaded_image($file, 'gallery');

    $caption = is_array($captionsPost) && isset($captionsPost[$idx])
        ? sanitize_plain_text($captionsPost[$idx], 180)
        : $defaultCaption;
    if ($caption === '') {
        $baseName = pathinfo($uploaded['originalFilename'], PATHINFO_FILENAME);
        $caption = sanitize_plain_text(str_replace(['-', '_'], ' ', $baseName), 180) ?: 'Campus Photograph';
    }

    $description = is_array($descriptionsPost) && isset($descriptionsPost[$idx])
        ? sanitize_plain_text($descriptionsPost[$idx], 600)
        : $defaultDescription;

    $category = is_array($categoriesPost) && isset($categoriesPost[$idx])
        ? sanitize_plain_text($categoriesPost[$idx], 40)
        : $defaultCategory;
    validate_enum($category, BECCAN_GALLERY_CATEGORIES, 'gallery category');

    $now = now_utc_iso();
    // Never auto-publish uploaded photographs without explicit administrator confirmation
    $createdItems[] = [
        'id' => generate_unique_id('gal'),
        'caption' => $caption,
        'description' => $description,
        'category' => $category,
        'imageUrl' => $uploaded['imageUrl'],
        'thumbnailUrl' => $uploaded['thumbnailUrl'],
        'originalFilename' => $uploaded['originalFilename'],
        'mimeType' => $uploaded['mimeType'],
        'width' => $uploaded['width'],
        'height' => $uploaded['height'],
        'fileSizeBytes' => $uploaded['fileSizeBytes'],
        'status' => 'draft',
        'uploadedAt' => $now,
        'updatedAt' => $now,
        'publishedAt' => null,
    ];
}

mutate_json_collection('gallery', static function (array $current) use ($createdItems): array {
    $merged = array_merge($createdItems, $current);
    return [
        'records' => $merged,
        'return' => $createdItems,
    ];
});

json_success([
    'items' => $createdItems,
], 201);
