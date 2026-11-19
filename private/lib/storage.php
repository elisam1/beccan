<?php
declare(strict_types=1);

const BECCAN_DEFAULT_STORAGE_WARNING_PERCENT = 80;
const BECCAN_DEFAULT_BACKUP_RETENTION = 30;
const BECCAN_ALLOWED_MEDIA_CATEGORIES = ['gallery', 'news', 'events'];

function cms_settings_path(): string
{
    return BECCAN_CONFIG_DIR . '/settings.json';
}

function read_cms_settings(): array
{
    $defaults = [
        'storageLimitBytes' => null,
        'storageWarningPercent' => BECCAN_DEFAULT_STORAGE_WARNING_PERCENT,
        'backupRetentionCount' => BECCAN_DEFAULT_BACKUP_RETENTION,
    ];

    $path = cms_settings_path();
    if (is_file($path)) {
        $raw = @file_get_contents($path);
        if (is_string($raw) && trim($raw) !== '') {
            $decoded = json_decode($raw, true);
            if (is_array($decoded)) {
                if (isset($decoded['storageLimitBytes']) && is_int($decoded['storageLimitBytes']) && $decoded['storageLimitBytes'] > 0) {
                    $defaults['storageLimitBytes'] = $decoded['storageLimitBytes'];
                } elseif (isset($decoded['storageLimitBytes']) && is_numeric($decoded['storageLimitBytes']) && (int) $decoded['storageLimitBytes'] > 0) {
                    $defaults['storageLimitBytes'] = (int) $decoded['storageLimitBytes'];
                }
                if (isset($decoded['storageWarningPercent']) && is_numeric($decoded['storageWarningPercent'])) {
                    $pct = (int) $decoded['storageWarningPercent'];
                    if ($pct >= 50 && $pct <= 99) {
                        $defaults['storageWarningPercent'] = $pct;
                    }
                }
                if (isset($decoded['backupRetentionCount']) && is_numeric($decoded['backupRetentionCount'])) {
                    $ret = (int) $decoded['backupRetentionCount'];
                    if ($ret >= 1 && $ret <= 200) {
                        $defaults['backupRetentionCount'] = $ret;
                    }
                }
            }
        }
    }

    // Optional environment variable overrides (if provided by hosting or tests)
    $envLimit = getenv('BECCAN_STORAGE_LIMIT_BYTES');
    if (is_string($envLimit) && trim($envLimit) !== '' && is_numeric($envLimit)) {
        $parsed = (int) $envLimit;
        $defaults['storageLimitBytes'] = $parsed > 0 ? $parsed : null;
    }

    $envRetention = getenv('BECCAN_BACKUP_RETENTION');
    if (is_string($envRetention) && trim($envRetention) !== '' && is_numeric($envRetention)) {
        $parsed = (int) $envRetention;
        if ($parsed >= 1 && $parsed <= 200) {
            $defaults['backupRetentionCount'] = $parsed;
        }
    }

    return $defaults;
}

function save_cms_settings(array $updates): array
{
    $current = read_cms_settings();

    if (array_key_exists('storageLimitBytes', $updates)) {
        $val = $updates['storageLimitBytes'];
        if ($val === null || $val === '') {
            $current['storageLimitBytes'] = null;
        } elseif (is_numeric($val) && (int) $val > 0) {
            $current['storageLimitBytes'] = (int) $val;
        } else {
            throw new InvalidArgumentException('Storage limit must be a positive byte amount or null.');
        }
    }

    if (array_key_exists('storageWarningPercent', $updates)) {
        $pct = (int) $updates['storageWarningPercent'];
        if ($pct < 50 || $pct > 99) {
            throw new InvalidArgumentException('Warning threshold must be between 50% and 99%.');
        }
        $current['storageWarningPercent'] = $pct;
    }

    if (array_key_exists('backupRetentionCount', $updates)) {
        $ret = (int) $updates['backupRetentionCount'];
        if ($ret < 1 || $ret > 200) {
            throw new InvalidArgumentException('Backup retention must be between 1 and 200 snapshots.');
        }
        $current['backupRetentionCount'] = $ret;
    }

    atomic_write_json_file(cms_settings_path(), $current);
    return $current;
}

function parse_php_size_bytes(string|false $value): int
{
    if ($value === false) {
        return 0;
    }
    $trimmed = trim($value);
    if ($trimmed === '' || $trimmed === '-1') {
        return 0;
    }
    $last = strtolower($trimmed[strlen($trimmed) - 1]);
    $num = (int) $trimmed;
    return match ($last) {
        'g' => $num * 1024 * 1024 * 1024,
        'm' => $num * 1024 * 1024,
        'k' => $num * 1024,
        default => $num,
    };
}

function get_php_upload_environment(): array
{
    $uploadMaxRaw = (string) (ini_get('upload_max_filesize') ?: '2M');
    $postMaxRaw = (string) (ini_get('post_max_size') ?: '8M');
    $memoryRaw = (string) (ini_get('memory_limit') ?: '128M');
    $maxUploads = (int) (ini_get('max_file_uploads') ?: 20);

    return [
        'uploadMaxFilesize' => $uploadMaxRaw,
        'uploadMaxFilesizeBytes' => parse_php_size_bytes($uploadMaxRaw),
        'postMaxSize' => $postMaxRaw,
        'postMaxSizeBytes' => parse_php_size_bytes($postMaxRaw),
        'maxFileUploads' => $maxUploads > 0 ? $maxUploads : 20,
        'memoryLimit' => $memoryRaw,
        'memoryLimitBytes' => parse_php_size_bytes($memoryRaw),
        'gdLoaded' => extension_loaded('gd'),
        'fileinfoLoaded' => extension_loaded('fileinfo') && class_exists('finfo'),
        'exifLoaded' => extension_loaded('exif') && function_exists('exif_read_data'),
        'zipLoaded' => class_exists('ZipArchive'),
    ];
}

function scan_flat_media_dir(string $dir): array
{
    if (!is_dir($dir)) {
        return ['count' => 0, 'bytes' => 0];
    }
    $entries = @scandir($dir);
    if ($entries === false) {
        return ['count' => 0, 'bytes' => 0];
    }
    $count = 0;
    $bytes = 0;
    foreach ($entries as $entry) {
        if ($entry === '.' || $entry === '..' || str_starts_with($entry, '.')) {
            continue;
        }
        $fullPath = $dir . '/' . $entry;
        if (!is_file($fullPath)) {
            continue;
        }
        $size = @filesize($fullPath);
        $count++;
        $bytes += $size !== false ? $size : 0;
    }
    return ['count' => $count, 'bytes' => $bytes];
}

function scan_directory_recursive_bytes(string $dir): int
{
    if (!is_dir($dir)) {
        return 0;
    }
    $total = 0;
    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($dir, FilesystemIterator::SKIP_DOTS),
        RecursiveIteratorIterator::LEAVES_ONLY
    );
    foreach ($iterator as $file) {
        if ($file instanceof SplFileInfo && $file->isFile()) {
            $name = $file->getFilename();
            if ($name === '.gitkeep' || str_starts_with($name, '.tmp_')) {
                continue;
            }
            $total += $file->getSize();
        }
    }
    return $total;
}

function get_media_storage_stats(?array $galleryRecords = null): array
{
    $settings = read_cms_settings();
    $gallery = $galleryRecords ?? read_json_collection('gallery');

    $publishedGallery = 0;
    $draftGallery = 0;
    foreach ($gallery as $item) {
        if (($item['status'] ?? 'draft') === 'published') {
            $publishedGallery++;
        } else {
            $draftGallery++;
        }
    }

    $categories = [];
    $totalBytes = 0;
    $totalOriginalsCount = 0;
    $totalThumbnailsCount = 0;

    foreach (BECCAN_ALLOWED_MEDIA_CATEGORIES as $bucket) {
        $origStats = scan_flat_media_dir(BECCAN_MEDIA_DIR . '/' . $bucket);
        $thumbStats = scan_flat_media_dir(BECCAN_MEDIA_DIR . '/' . $bucket . '/thumbs');
        $bucketTotal = $origStats['bytes'] + $thumbStats['bytes'];

        $entry = [
            'originalsCount' => $origStats['count'],
            'thumbnailsCount' => $thumbStats['count'],
            'originalsBytes' => $origStats['bytes'],
            'thumbnailsBytes' => $thumbStats['bytes'],
            'totalBytes' => $bucketTotal,
        ];
        if ($bucket === 'gallery') {
            $entry['publishedCount'] = $publishedGallery;
            $entry['draftCount'] = $draftGallery;
        }

        $categories[$bucket] = $entry;
        $totalBytes += $bucketTotal;
        $totalOriginalsCount += $origStats['count'];
        $totalThumbnailsCount += $thumbStats['count'];
    }

    $backupsBytes = scan_directory_recursive_bytes(BECCAN_BACKUP_DIR);
    $limitBytes = $settings['storageLimitBytes'];
    $warningPercent = (int) $settings['storageWarningPercent'];

    $remainingBytes = null;
    $usagePercent = null;
    $approachingLimit = false;
    $overLimit = false;

    if (is_int($limitBytes) && $limitBytes > 0) {
        $remainingBytes = max(0, $limitBytes - $totalBytes);
        $usagePercent = round(($totalBytes / $limitBytes) * 100, 1);
        $approachingLimit = $usagePercent >= $warningPercent;
        $overLimit = $totalBytes >= $limitBytes;
    }

    return [
        'totalBytes' => $totalBytes,
        'totalOriginalsCount' => $totalOriginalsCount,
        'totalThumbnailsCount' => $totalThumbnailsCount,
        'backupsBytes' => $backupsBytes,
        'gallery' => $categories['gallery'],
        'news' => $categories['news'],
        'events' => $categories['events'],
        'configuredLimitBytes' => $limitBytes,
        'storageWarningPercent' => $warningPercent,
        'remainingBytes' => $remainingBytes,
        'usagePercent' => $usagePercent,
        'approachingLimit' => $approachingLimit,
        'overLimit' => $overLimit,
    ];
}
