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

function process_uploaded_image(array $file, string $bucket): array
{
    if (!in_array($bucket, ['gallery', 'news', 'events'], true)) {
        throw new InvalidArgumentException('Invalid upload bucket.');
    }

    $errorCode = (int) ($file['error'] ?? UPLOAD_ERR_NO_FILE);
    if ($errorCode !== UPLOAD_ERR_OK) {
        $message = match ($errorCode) {
            UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE => 'Uploaded file exceeds allowed size limit.',
            UPLOAD_ERR_NO_FILE => 'No file was uploaded.',
            default => 'File upload failed. Please try again.',
        };
        json_error($message, 422);
    }

    $tmpPath = (string) ($file['tmp_name'] ?? '');
    if ($tmpPath === '' || (!is_uploaded_file($tmpPath) && PHP_SAPI !== 'cli')) {
        json_error('Invalid uploaded file source.', 400);
    }

    $size = (int) ($file['size'] ?? filesize($tmpPath));
    if ($size <= 0 || $size > BECCAN_MAX_UPLOAD_BYTES) {
        json_error('Image size must be between 1 byte and 6 MB.', 422);
    }

    // Validate actual MIME type using Fileinfo (never trust client extension or Content-Type)
    if (!class_exists('finfo')) {
        throw new RuntimeException('PHP Fileinfo extension is required for secure upload validation.');
    }
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $detectedMime = (string) $finfo->file($tmpPath);
    if (!array_key_exists($detectedMime, BECCAN_ALLOWED_IMAGE_MIMES)) {
        json_error('Unsupported file format. Only JPEG, PNG, and WebP photographs are permitted.', 422);
    }

    $imageInfo = @getimagesize($tmpPath);
    if ($imageInfo === false) {
        json_error('Uploaded file is not a valid image.', 422);
    }
    [$width, $height] = $imageInfo;
    if (
        $width < BECCAN_MIN_IMAGE_DIM ||
        $height < BECCAN_MIN_IMAGE_DIM ||
        $width > BECCAN_MAX_IMAGE_DIM ||
        $height > BECCAN_MAX_IMAGE_DIM
    ) {
        json_error('Image dimensions must be between 100×100 and 6000×6000 pixels.', 422);
    }

    $ext = BECCAN_ALLOWED_IMAGE_MIMES[$detectedMime];
    $randomName = bin2hex(random_bytes(16)) . '.' . $ext;
    $bucketDir = BECCAN_UPLOADS_DIR . '/' . $bucket;
    $thumbDir = $bucketDir . '/thumbs';

    if (!is_dir($thumbDir)) {
        @mkdir($thumbDir, 0750, true);
    }

    $destPath = $bucketDir . '/' . $randomName;
    $thumbPath = $thumbDir . '/' . $randomName;
    $thumbGenerated = false;
    $finalWidth = $width;
    $finalHeight = $height;

    if (extension_loaded('gd')) {
        [$savedMain, $finalWidth, $finalHeight] = optimize_and_save_gd(
            $tmpPath,
            $destPath,
            $detectedMime,
            BECCAN_OPTIMIZED_MAX_WIDTH
        );
        if ($savedMain) {
            [$thumbGenerated] = optimize_and_save_gd(
                $destPath,
                $thumbPath,
                $detectedMime,
                BECCAN_THUMB_MAX_WIDTH
            );
        }
    }

    if (!is_file($destPath)) {
        if (PHP_SAPI === 'cli') {
            if (!copy($tmpPath, $destPath)) {
                throw new RuntimeException('Failed to store uploaded file.');
            }
        } elseif (!move_uploaded_file($tmpPath, $destPath)) {
            throw new RuntimeException('Failed to store uploaded file.');
        }
    }

    @chmod($destPath, 0644);
    if ($thumbGenerated) {
        @chmod($thumbPath, 0644);
    }

    $originalName = sanitize_plain_text((string) ($file['name'] ?? ''), 120);
    $originalName = basename(str_replace('\\', '/', $originalName));

    return [
        'imageUrl' => "/uploads/{$bucket}/{$randomName}",
        'thumbnailUrl' => $thumbGenerated ? "/uploads/{$bucket}/thumbs/{$randomName}" : "/uploads/{$bucket}/{$randomName}",
        'originalFilename' => $originalName,
        'mimeType' => $detectedMime,
        'width' => $finalWidth,
        'height' => $finalHeight,
        'fileSizeBytes' => is_file($destPath) ? (filesize($destPath) ?: $size) : $size,
    ];
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

    // Apply EXIF orientation for JPEG if exif extension is available
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

function delete_uploaded_asset(?string $publicUrl): void
{
    if ($publicUrl === null || trim($publicUrl) === '') {
        return;
    }
    if (!preg_match('#^/uploads/(gallery|news|events)/([a-f0-9]{32}\.(jpg|png|webp))$#', $publicUrl, $matches)) {
        return;
    }
    $bucket = $matches[1];
    $filename = $matches[2];
    $mainPath = BECCAN_UPLOADS_DIR . '/' . $bucket . '/' . $filename;
    $thumbPath = BECCAN_UPLOADS_DIR . '/' . $bucket . '/thumbs/' . $filename;

    if (is_file($mainPath)) {
        @unlink($mainPath);
    }
    if (is_file($thumbPath)) {
        @unlink($thumbPath);
    }
}
