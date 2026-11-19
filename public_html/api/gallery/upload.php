<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/_bootstrap.php';

require_http_method('POST');
require_admin_auth();
validate_multipart_request_or_fail();
verify_csrf_request();
require_upload_extensions_or_fail();

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
$phpEnv = get_php_upload_environment();
$maxBatch = min(12, max(1, (int) $phpEnv['maxFileUploads']));

if ($files === [] || count($files) > 12) {
    json_error('You may upload between 1 and 12 photographs per request.', 422);
}
if (count($files) > $phpEnv['maxFileUploads']) {
    json_error(
        "You selected " . count($files) . " files, which exceeds this server's max_file_uploads limit ({$phpEnv['maxFileUploads']}).",
        422
    );
}

$captionsPost = $_POST['captions'] ?? null;
$descriptionsPost = $_POST['descriptions'] ?? null;
$categoriesPost = $_POST['categories'] ?? null;
$defaultCaption = sanitize_plain_text($_POST['caption'] ?? '', 180);
$defaultDescription = sanitize_plain_text($_POST['description'] ?? '', 600);
$defaultCategory = sanitize_plain_text($_POST['category'] ?? 'School Life', 40);

// Step 1: Validate all metadata across the batch BEFORE staging any files
$validatedMeta = [];
foreach ($files as $idx => $file) {
    $rawOriginal = sanitize_plain_text((string) ($file['name'] ?? ''), 120);
    $caption = is_array($captionsPost) && isset($captionsPost[$idx])
        ? sanitize_plain_text($captionsPost[$idx], 180)
        : $defaultCaption;
    if ($caption === '') {
        $baseName = pathinfo(basename(str_replace('\\', '/', $rawOriginal)), PATHINFO_FILENAME);
        $caption = sanitize_plain_text(str_replace(['-', '_'], ' ', $baseName), 180) ?: 'Campus Photograph';
    }

    $description = is_array($descriptionsPost) && isset($descriptionsPost[$idx])
        ? sanitize_plain_text($descriptionsPost[$idx], 600)
        : $defaultDescription;

    $category = is_array($categoriesPost) && isset($categoriesPost[$idx])
        ? sanitize_plain_text($categoriesPost[$idx], 40)
        : $defaultCategory;
    validate_enum($category, BECCAN_GALLERY_CATEGORIES, 'gallery category');

    $validatedMeta[$idx] = [
        'caption' => $caption,
        'description' => $description,
        'category' => $category,
        'label' => 'Photo ' . ($idx + 1) . ($rawOriginal !== '' ? " ({$rawOriginal})" : ''),
    ];
}

// Step 2: Validate and optimize every image inside a private staging directory
$stagingDir = create_upload_staging_dir();
$stagedItems = [];
$committedPaths = [];

try {
    $totalStagedBytes = 0;
    foreach ($files as $idx => $file) {
        $staged = stage_uploaded_image($file, 'gallery', $stagingDir, $validatedMeta[$idx]['label']);
        $stagedItems[$idx] = $staged;
        $totalStagedBytes += (int) $staged['totalStagedBytes'];
    }

    check_storage_quota_for_bytes($totalStagedBytes);

    $now = now_utc_iso();
    $createdItems = [];
    foreach ($stagedItems as $idx => $staged) {
        $id = generate_unique_id('gal');
        $meta = $validatedMeta[$idx];
        // Never auto-publish uploaded photographs without explicit administrator confirmation
        $createdItems[] = [
            'id' => $id,
            'caption' => $meta['caption'],
            'description' => $meta['description'],
            'category' => $meta['category'],
            'mediaFilename' => $staged['mediaFilename'],
            'imageUrl' => build_media_serve_url('gallery', $id, 'original'),
            'thumbnailUrl' => build_media_serve_url('gallery', $id, 'thumb'),
            'originalFilename' => $staged['originalFilename'],
            'mimeType' => $staged['mimeType'],
            'width' => $staged['width'],
            'height' => $staged['height'],
            'fileSizeBytes' => $staged['fileSizeBytes'],
            'status' => 'draft',
            'uploadedAt' => $now,
            'updatedAt' => $now,
            'publishedAt' => null,
        ];
    }

    // Step 3: Transactional commit under collection lock — rollback moved files if JSON write fails
    mutate_json_collection(
        'gallery',
        static function (array $current) use ($createdItems): array {
            $merged = array_merge($createdItems, $current);
            return [
                'records' => $merged,
                'return' => $createdItems,
            ];
        },
        static function () use (&$stagedItems, &$committedPaths): void {
            $committedPaths = commit_staged_images($stagedItems);
        },
        static function () use (&$committedPaths): void {
            rollback_committed_images($committedPaths);
        }
    );

    json_success([
        'items' => $createdItems,
    ], 201);
} finally {
    remove_directory_recursive($stagingDir);
}
