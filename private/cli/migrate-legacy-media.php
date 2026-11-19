<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit('CLI access only.');
}

require_once dirname(__DIR__) . '/config/bootstrap.php';

$cleanupVerified = in_array('--cleanup-verified', $argv, true);
$dryRun = in_array('--dry-run', $argv, true);

fwrite(STDOUT, "Beccan School Legacy Media Migration\n");
fwrite(STDOUT, "Source: " . BECCAN_UPLOADS_DIR . "\n");
fwrite(STDOUT, "Target: " . BECCAN_MEDIA_DIR . "\n");
if ($dryRun) {
    fwrite(STDOUT, "Mode: DRY RUN (no files or JSON records will be modified)\n");
}
fwrite(STDOUT, "\n");

$totalMigrated = 0;
$totalAlreadyPrivate = 0;
$totalSkippedMissing = 0;
$legacyFilesToCleanup = [];

foreach (BECCAN_ALLOWED_MEDIA_CATEGORIES as $bucket) {
    $records = read_json_collection($bucket);
    if ($records === []) {
        fwrite(STDOUT, "[{$bucket}] 0 records.\n");
        continue;
    }

    $bucketMigrated = 0;
    $updatedRecords = $records;

    foreach ($updatedRecords as $idx => $record) {
        $id = (string) ($record['id'] ?? '');
        if ($id === '') {
            continue;
        }

        $filename = extract_record_media_filename($record, $bucket);
        if ($filename === null) {
            continue;
        }

        $privateOrig = resolve_private_media_path($bucket, $filename, 'original');
        $privateThumb = resolve_private_media_path($bucket, $filename, 'thumb');
        $legacyOrig = BECCAN_UPLOADS_DIR . '/' . $bucket . '/' . $filename;
        $legacyThumb = BECCAN_UPLOADS_DIR . '/' . $bucket . '/thumbs/' . $filename;
        $expectedOrigUrl = build_media_serve_url($bucket, $id, 'original');
        $expectedThumbUrl = build_media_serve_url($bucket, $id, 'thumb');

        $alreadyUsesServeUrl = $bucket === 'gallery'
            ? (($record['imageUrl'] ?? '') === $expectedOrigUrl)
            : (($record['coverImageUrl'] ?? '') === $expectedOrigUrl);

        if (
            $alreadyUsesServeUrl &&
            $privateOrig !== null && is_file($privateOrig) && filesize($privateOrig) > 0 &&
            $privateThumb !== null && is_file($privateThumb) && filesize($privateThumb) > 0
        ) {
            $totalAlreadyPrivate++;
            if (is_file($legacyOrig) && hash_file('sha256', $legacyOrig) === hash_file('sha256', $privateOrig)) {
                $legacyFilesToCleanup[] = $legacyOrig;
            }
            if (is_file($legacyThumb) && hash_file('sha256', $legacyThumb) === hash_file('sha256', $privateThumb)) {
                $legacyFilesToCleanup[] = $legacyThumb;
            }
            continue;
        }

        $srcOrig = ($privateOrig !== null && is_file($privateOrig)) ? $privateOrig : (is_file($legacyOrig) ? $legacyOrig : null);
        $srcThumb = ($privateThumb !== null && is_file($privateThumb)) ? $privateThumb : (is_file($legacyThumb) ? $legacyThumb : $srcOrig);

        if ($srcOrig === null) {
            fwrite(STDERR, "[{$bucket}] WARNING: Record {$id} references {$filename}, but file was not found in uploads or private/media.\n");
            $totalSkippedMissing++;
            continue;
        }

        if (!$dryRun) {
            foreach ([dirname($privateOrig), dirname($privateThumb)] as $dir) {
                if (!is_dir($dir)) {
                    mkdir($dir, 0750, true);
                }
            }

            if ($srcOrig !== $privateOrig) {
                if (!copy($srcOrig, $privateOrig)) {
                    throw new RuntimeException("Failed copying {$srcOrig} to {$privateOrig}");
                }
                @chmod($privateOrig, 0640);
                if (hash_file('sha256', $srcOrig) !== hash_file('sha256', $privateOrig)) {
                    throw new RuntimeException("Checksum verification failed for {$privateOrig}");
                }
            }

            if ($srcThumb !== null && $srcThumb !== $privateThumb) {
                if (!copy($srcThumb, $privateThumb)) {
                    throw new RuntimeException("Failed copying {$srcThumb} to {$privateThumb}");
                }
                @chmod($privateThumb, 0640);
                if (hash_file('sha256', $srcThumb) !== hash_file('sha256', $privateThumb)) {
                    throw new RuntimeException("Checksum verification failed for {$privateThumb}");
                }
            }
        }

        $record['mediaFilename'] = $filename;
        if ($bucket === 'gallery') {
            $record['imageUrl'] = $expectedOrigUrl;
            $record['thumbnailUrl'] = $expectedThumbUrl;
        } else {
            $record['coverImageUrl'] = $expectedOrigUrl;
            $record['coverThumbnailUrl'] = $expectedThumbUrl;
        }
        $updatedRecords[$idx] = $record;

        if (is_file($legacyOrig)) {
            $legacyFilesToCleanup[] = $legacyOrig;
        }
        if (is_file($legacyThumb)) {
            $legacyFilesToCleanup[] = $legacyThumb;
        }

        $bucketMigrated++;
        $totalMigrated++;
    }

    if ($bucketMigrated > 0 && !$dryRun) {
        mutate_json_collection($bucket, static fn (): array => [
            'records' => $updatedRecords,
            'return' => true,
        ]);
    }

    fwrite(STDOUT, "[{$bucket}] Migrated {$bucketMigrated} record(s).\n");
}

if ($cleanupVerified && !$dryRun) {
    $removed = 0;
    foreach (array_unique($legacyFilesToCleanup) as $legacyPath) {
        if (is_file($legacyPath) && @unlink($legacyPath)) {
            $removed++;
        }
    }
    fwrite(STDOUT, "Cleaned up {$removed} verified legacy file(s) from public_html/uploads/.\n");
} elseif ($legacyFilesToCleanup !== []) {
    fwrite(
        STDOUT,
        "\nLegacy files were preserved in public_html/uploads/ until you verify the live site.\n" .
        "Once verified, re-run with --cleanup-verified to remove the public copies.\n"
    );
}

fwrite(
    STDOUT,
    "\nSummary: migrated={$totalMigrated}, already_private={$totalAlreadyPrivate}, missing_source={$totalSkippedMissing}\n"
);
