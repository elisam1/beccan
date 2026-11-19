<?php
declare(strict_types=1);

const BECCAN_MAX_UPLOAD_BYTES = 6291456; // 6 MB
const BECCAN_MIN_IMAGE_DIM = 100;
const BECCAN_MAX_IMAGE_DIM = 6000;
const BECCAN_OPTIMIZED_MAX_WIDTH = 1920;
const BECCAN_THUMB_MAX_WIDTH = 640;

const BECCAN_ALLOWED_IMAGE_MIMES = [
    'image/jpeg' => 'jpg',
    'image/png' => 'png',
    'image/webp' => 'webp',
];

function build_media_serve_url(string $bucket, string $recordId, string $variant = 'original'): string
{
    $v = $variant === 'thumb' ? 'thumb' : 'original';
    return sprintf(
        '/api/media/serve.php?category=%s&id=%s&variant=%s',
        rawurlencode($bucket),
        rawurlencode($recordId),
        $v
    );
}

function is_valid_media_filename(?string $filename): bool
{
    return is_string($filename) && preg_match('/^[a-f0-9]{32}\.(jpg|png|webp)$/', $filename) === 1;
}

function extract_record_media_filename(array $record, string $bucket): ?string
{
    $explicit = $record['mediaFilename'] ?? null;
    if (is_valid_media_filename($explicit)) {
        return $explicit;
    }

    foreach (['imageUrl', 'coverImageUrl', 'thumbnailUrl', 'coverThumbnailUrl'] as $key) {
        $val = $record[$key] ?? null;
        if (!is_string($val)) {
            continue;
        }
        $pattern = '#^/uploads/' . preg_quote($bucket, '#') . '/(?:thumbs/)?([a-f0-9]{32}\.(?:jpg|png|webp))$#';
        if (preg_match($pattern, $val, $m) === 1) {
            return $m[1];
        }
    }

    return null;
}

function resolve_private_media_path(string $bucket, string $filename, string $variant = 'original'): ?string
{
    if (!in_array($bucket, BECCAN_ALLOWED_MEDIA_CATEGORIES, true)) {
        return null;
    }
    if (!in_array($variant, ['original', 'thumb'], true)) {
        return null;
    }
    if (!is_valid_media_filename($filename)) {
        return null;
    }
    $sub = $variant === 'thumb' ? '/thumbs/' : '/';
    return BECCAN_MEDIA_DIR . '/' . $bucket . $sub . $filename;
}

function validate_multipart_request_or_fail(): void
{
    if (strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET')) !== 'POST') {
        return;
    }
    $contentLength = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
    $contentType = strtolower((string) ($_SERVER['CONTENT_TYPE'] ?? ''));

    if ($contentLength > 0 && empty($_POST) && empty($_FILES)) {
        $postMaxRaw = (string) (ini_get('post_max_size') ?: '8M');
        $postMaxBytes = parse_php_size_bytes($postMaxRaw);
        if ($postMaxBytes > 0 && $contentLength > $postMaxBytes) {
            json_error(
                "Upload exceeds the server's maximum request size ({$postMaxRaw}). Upload fewer photographs at once or ask your host to raise post_max_size.",
                413,
                ['postMaxSize' => $postMaxRaw, 'contentLength' => $contentLength]
            );
        }
        if (str_contains($contentType, 'multipart/form-data')) {
            json_error(
                "Upload payload was discarded by the server (exceeded post_max_size {$postMaxRaw} or malformed multipart body).",
                413,
                ['postMaxSize' => $postMaxRaw]
            );
        }
    }
}

function require_upload_extensions_or_fail(): void
{
    if (!extension_loaded('fileinfo') || !class_exists('finfo')) {
        json_error(
            'Image uploads are disabled because the PHP Fileinfo extension is unavailable on this server.',
            503
        );
    }
    if (!extension_loaded('gd')) {
        json_error(
            'Image uploads are disabled because the PHP GD image processing extension is unavailable on this server.',
            503
        );
    }
}

function normalize_uploaded_files_array(array $fileEntry): array
{
    if (!isset($fileEntry['name'])) {
        return [];
    }
    if (!is_array($fileEntry['name'])) {
        return [$fileEntry];
    }

    $normalized = [];
    $count = count($fileEntry['name']);
    for ($i = 0; $i < $count; $i++) {
        $normalized[] = [
            'name' => $fileEntry['name'][$i] ?? '',
            'type' => $fileEntry['type'][$i] ?? '',
            'tmp_name' => $fileEntry['tmp_name'][$i] ?? '',
            'error' => $fileEntry['error'][$i] ?? UPLOAD_ERR_NO_FILE,
            'size' => $fileEntry['size'][$i] ?? 0,
        ];
    }
    return $normalized;
}

function create_upload_staging_dir(): string
{
    if (!is_dir(BECCAN_TMP_DIR)) {
        @mkdir(BECCAN_TMP_DIR, 0750, true);
    }
    // Sweep orphaned staging dirs older than 2 hours
    foreach (glob(BECCAN_TMP_DIR . '/stage_*') ?: [] as $oldDir) {
        if (is_dir($oldDir) && (time() - (@filemtime($oldDir) ?: time())) > 7200) {
            remove_directory_recursive($oldDir);
        }
    }

    $dir = BECCAN_TMP_DIR . '/stage_' . bin2hex(random_bytes(8));
    if (!mkdir($dir, 0750, true)) {
        throw new RuntimeException('Unable to initialize private temporary upload staging directory.');
    }
    register_shutdown_function(static function () use ($dir): void {
        if (is_dir($dir)) {
            remove_directory_recursive($dir);
        }
    });
    return $dir;
}

function remove_directory_recursive(string $dir): void
{
    if (!is_dir($dir)) {
        return;
    }
    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($dir, FilesystemIterator::SKIP_DOTS),
        RecursiveIteratorIterator::CHILD_FIRST
    );
    foreach ($iterator as $item) {
        if ($item->isDir()) {
            @rmdir($item->getPathname());
        } else {
            @unlink($item->getPathname());
        }
    }
    @rmdir($dir);
}

function stage_uploaded_image(array $file, string $bucket, string $stagingDir, ?string $labelPrefix = null): array
{
    if (!in_array($bucket, BECCAN_ALLOWED_MEDIA_CATEGORIES, true)) {
        throw new InvalidArgumentException('Invalid upload bucket.');
    }

    require_upload_extensions_or_fail();

    $prefix = $labelPrefix !== null ? ($labelPrefix . ': ') : '';
    $errorCode = (int) ($file['error'] ?? UPLOAD_ERR_NO_FILE);
    if ($errorCode !== UPLOAD_ERR_OK) {
        $uploadMaxRaw = (string) (ini_get('upload_max_filesize') ?: 'unknown');
        $message = match ($errorCode) {
            UPLOAD_ERR_INI_SIZE => "{$prefix}File exceeds PHP upload_max_filesize limit ({$uploadMaxRaw}).",
            UPLOAD_ERR_FORM_SIZE => "{$prefix}File exceeds form upload size limit.",
            UPLOAD_ERR_PARTIAL => "{$prefix}File was only partially uploaded. Please retry.",
            UPLOAD_ERR_NO_FILE => "{$prefix}No file was uploaded.",
            default => "{$prefix}File upload failed (error code {$errorCode}).",
        };
        json_error($message, 422);
    }

    $tmpPath = (string) ($file['tmp_name'] ?? '');
    if ($tmpPath === '' || (!is_uploaded_file($tmpPath) && PHP_SAPI !== 'cli') || !is_file($tmpPath)) {
        json_error("{$prefix}Invalid uploaded file source.", 400);
    }

    $size = (int) ($file['size'] ?? filesize($tmpPath));
    if ($size <= 0 || $size > BECCAN_MAX_UPLOAD_BYTES) {
        json_error("{$prefix}Image size must be between 1 byte and 6 MB.", 422);
    }

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $detectedMime = (string) $finfo->file($tmpPath);
    if (!array_key_exists($detectedMime, BECCAN_ALLOWED_IMAGE_MIMES)) {
        json_error("{$prefix}Unsupported file format. Only JPEG, PNG, and WebP photographs are permitted.", 422);
    }

    $imageInfo = @getimagesize($tmpPath);
    if ($imageInfo === false) {
        json_error("{$prefix}Uploaded file is not a valid image.", 422);
    }
    [$width, $height] = $imageInfo;
    if (
        $width < BECCAN_MIN_IMAGE_DIM ||
        $height < BECCAN_MIN_IMAGE_DIM ||
        $width > BECCAN_MAX_IMAGE_DIM ||
        $height > BECCAN_MAX_IMAGE_DIM
    ) {
        json_error("{$prefix}Image dimensions must be between 100×100 and 6000×6000 pixels.", 422);
    }

    // Check decoded raster memory requirement before loading into GD memory
    $memoryLimitBytes = parse_php_size_bytes((string) ini_get('memory_limit'));
    if ($memoryLimitBytes > 0) {
        $estimatedDecodedBytes = (int) ($width * $height * 4 * 2.5);
        $availableBytes = $memoryLimitBytes - memory_get_usage(true);
        if ($estimatedDecodedBytes > ($availableBytes * 0.85)) {
            json_error(
                "{$prefix}Image pixel dimensions ({$width}×{$height}) exceed available server memory for safe processing. Resize the image before uploading.",
                422
            );
        }
    }

    $ext = BECCAN_ALLOWED_IMAGE_MIMES[$detectedMime];
    $randomName = bin2hex(random_bytes(16)) . '.' . $ext;
    $stagedMainPath = $stagingDir . '/main_' . $randomName;
    $stagedThumbPath = $stagingDir . '/thumb_' . $randomName;

    [$savedMain, $finalWidth, $finalHeight] = optimize_and_save_gd(
        $tmpPath,
        $stagedMainPath,
        $detectedMime,
        BECCAN_OPTIMIZED_MAX_WIDTH
    );
    if (!$savedMain || !is_file($stagedMainPath) || (int) filesize($stagedMainPath) <= 0) {
        json_error("{$prefix}Failed to decode and optimize image safely.", 422);
    }

    [$thumbGenerated] = optimize_and_save_gd(
        $stagedMainPath,
        $stagedThumbPath,
        $detectedMime,
        BECCAN_THUMB_MAX_WIDTH
    );
    if (!$thumbGenerated || !is_file($stagedThumbPath) || (int) filesize($stagedThumbPath) <= 0) {
        @unlink($stagedMainPath);
        json_error("{$prefix}Failed to generate image thumbnail.", 422);
    }

    $mainSize = (int) (filesize($stagedMainPath) ?: 0);
    $thumbSize = (int) (filesize($stagedThumbPath) ?: 0);

    $originalName = sanitize_plain_text((string) ($file['name'] ?? ''), 120);
    $originalName = basename(str_replace('\\', '/', $originalName));

    return [
        'bucket' => $bucket,
        'mediaFilename' => $randomName,
        'stagedMainPath' => $stagedMainPath,
        'stagedThumbPath' => $stagedThumbPath,
        'originalFilename' => $originalName,
        'mimeType' => $detectedMime,
        'width' => $finalWidth,
        'height' => $finalHeight,
        'fileSizeBytes' => $mainSize,
        'totalStagedBytes' => $mainSize + $thumbSize,
    ];
}

function check_storage_quota_for_bytes(int $incomingBytes): void
{
    $stats = get_media_storage_stats();
    $limit = $stats['configuredLimitBytes'];
    if ($limit !== null && ($stats['totalBytes'] + $incomingBytes) > $limit) {
        $limitMb = number_format($limit / (1024 * 1024), 1);
        json_error(
            "Upload blocked: adding this media exceeds the configured storage limit ({$limitMb} MB). Delete unused files or increase the storage limit in Settings.",
            422
        );
    }
}

function commit_staged_images(array $stagedItems): array
{
    $movedPaths = [];
    try {
        foreach ($stagedItems as $item) {
            $bucket = (string) $item['bucket'];
            $filename = (string) $item['mediaFilename'];
            $destMain = resolve_private_media_path($bucket, $filename, 'original');
            $destThumb = resolve_private_media_path($bucket, $filename, 'thumb');

            if ($destMain === null || $destThumb === null) {
                throw new RuntimeException('Invalid destination media path.');
            }
            foreach ([dirname($destMain), dirname($destThumb)] as $dir) {
                if (!is_dir($dir) && !@mkdir($dir, 0750, true)) {
                    throw new RuntimeException('Unable to create private media storage directory.');
                }
            }

            if (!@rename((string) $item['stagedMainPath'], $destMain)) {
                throw new RuntimeException('Failed to commit staged photograph to private storage.');
            }
            @chmod($destMain, 0640);
            $movedPaths[] = $destMain;

            if (!@rename((string) $item['stagedThumbPath'], $destThumb)) {
                throw new RuntimeException('Failed to commit staged thumbnail to private storage.');
            }
            @chmod($destThumb, 0640);
            $movedPaths[] = $destThumb;

            if (!is_file($destMain) || filesize($destMain) <= 0 || !is_file($destThumb) || filesize($destThumb) <= 0) {
                throw new RuntimeException('Committed media verification failed.');
            }
        }
        return $movedPaths;
    } catch (Throwable $e) {
        rollback_committed_images($movedPaths);
        throw $e;
    }
}

function rollback_committed_images(array $paths): void
{
    foreach ($paths as $path) {
        if (is_string($path) && is_file($path)) {
            @unlink($path);
        }
    }
}

function optimize_and_save_gd(string $sourcePath, string $destPath, string $mime, int $maxWidth): array
{
    $src = match ($mime) {
        'image/jpeg' => @imagecreatefromjpeg($sourcePath),
        'image/png' => @imagecreatefrompng($sourcePath),
        'image/webp' => function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($sourcePath) : false,
        default => false,
    };

    if (!$src) {
        return [false, 0, 0];
    }

    if ($mime === 'image/jpeg' && function_exists('exif_read_data')) {
        $exif = @exif_read_data($sourcePath);
        $orientation = (int) ($exif['Orientation'] ?? 1);
        $src = match ($orientation) {
            3 => imagerotate($src, 180, 0) ?: $src,
            6 => imagerotate($src, -90, 0) ?: $src,
            8 => imagerotate($src, 90, 0) ?: $src,
            default => $src,
        };
    }

    $srcWidth = imagesx($src);
    $srcHeight = imagesy($src);
    $targetWidth = $srcWidth;
    $targetHeight = $srcHeight;

    if ($srcWidth > $maxWidth) {
        $targetWidth = $maxWidth;
        $targetHeight = max(1, (int) round(($srcHeight / $srcWidth) * $maxWidth));
    }

    $dst = imagecreatetruecolor($targetWidth, $targetHeight);
    if (!$dst) {
        imagedestroy($src);
        return [false, 0, 0];
    }

    if ($mime === 'image/png' || $mime === 'image/webp') {
        imagealphablending($dst, false);
        imagesavealpha($dst, true);
        $transparent = imagecolorallocatealpha($dst, 0, 0, 0, 127);
        imagefilledrectangle($dst, 0, 0, $targetWidth, $targetHeight, $transparent);
    }

    imagecopyresampled($dst, $src, 0, 0, 0, 0, $targetWidth, $targetHeight, $srcWidth, $srcHeight);

    $saved = match ($mime) {
        'image/jpeg' => imagejpeg($dst, $destPath, 84),
        'image/png' => imagepng($dst, $destPath, 6),
        'image/webp' => function_exists('imagewebp') ? imagewebp($dst, $destPath, 84) : false,
        default => false,
    };

    imagedestroy($src);
    imagedestroy($dst);

    return [$saved, $targetWidth, $targetHeight];
}

function delete_private_media_asset(string $bucket, ?string $filename): void
{
    if (!is_valid_media_filename($filename)) {
        return;
    }
    $main = resolve_private_media_path($bucket, $filename, 'original');
    $thumb = resolve_private_media_path($bucket, $filename, 'thumb');
    if ($main !== null && is_file($main)) {
        @unlink($main);
    }
    if ($thumb !== null && is_file($thumb)) {
        @unlink($thumb);
    }
}

function delete_record_media_assets(array $record, string $bucket): void
{
    $filename = extract_record_media_filename($record, $bucket);
    if ($filename !== null) {
        delete_private_media_asset($bucket, $filename);
    }
}
