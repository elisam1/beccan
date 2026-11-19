<?php
declare(strict_types=1);

/**
 * Isolated End-to-End HTTP & CLI Verification Suite for Beccan School PHP Backend.
 * Copies private/ and public_html/ to a temporary sandbox so the repository remains clean.
 */

$projectRoot = dirname(__DIR__);
$sandbox = sys_get_temp_dir() . '/beccan_test_' . bin2hex(random_bytes(5));

function copy_dir(string $src, string $dst): void
{
    mkdir($dst, 0750, true);
    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($src, FilesystemIterator::SKIP_DOTS),
        RecursiveIteratorIterator::SELF_FIRST
    );
    foreach ($iterator as $item) {
        $target = $dst . DIRECTORY_SEPARATOR . $iterator->getSubPathName();
        if ($item->isDir()) {
            if (!is_dir($target)) {
                mkdir($target, 0750, true);
            }
        } else {
            copy($item->getPathname(), $target);
        }
    }
}

function remove_dir(string $dir): void
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
            rmdir($item->getPathname());
        } else {
            unlink($item->getPathname());
        }
    }
    rmdir($dir);
}

function count_real_files(string $dir): int
{
    if (!is_dir($dir)) {
        return 0;
    }
    $count = 0;
    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($dir, FilesystemIterator::SKIP_DOTS),
        RecursiveIteratorIterator::LEAVES_ONLY
    );
    foreach ($iterator as $item) {
        if ($item->isFile() && $item->getFilename() !== '.gitkeep') {
            $count++;
        }
    }
    return $count;
}

copy_dir($projectRoot . '/private', $sandbox . '/private');
copy_dir($projectRoot . '/public_html', $sandbox . '/public_html');

$port = random_int(18000, 28000);
$cmd = sprintf('php -S 127.0.0.1:%d -t %s', $port, escapeshellarg($sandbox . '/public_html'));
$descriptors = [
    0 => ['pipe', 'r'],
    1 => ['file', $sandbox . '/server.out.log', 'a'],
    2 => ['file', $sandbox . '/server.err.log', 'a'],
];
$proc = proc_open($cmd, $descriptors, $pipes);
if (!is_resource($proc)) {
    fwrite(STDERR, "Failed to start test PHP server.\n");
    exit(1);
}

register_shutdown_function(static function () use ($proc, $sandbox): void {
    @proc_terminate($proc);
    @proc_close($proc);
    remove_dir($sandbox);
});

$baseUrl = "http://127.0.0.1:{$port}";

$ready = false;
for ($i = 0; $i < 30; $i++) {
    $fp = @fsockopen('127.0.0.1', $port, $errno, $errstr, 0.2);
    if ($fp) {
        fclose($fp);
        $ready = true;
        break;
    }
    usleep(100000);
}
if (!$ready) {
    fwrite(STDERR, "PHP built-in server did not become ready.\n");
    exit(1);
}

$cookies = [];

function http_request(string $method, string $url, ?string $body = null, array $headers = [], bool $useCookies = true): array
{
    global $cookies;
    $headerLines = [];
    if ($useCookies && $cookies !== []) {
        $pairs = [];
        foreach ($cookies as $k => $v) {
            $pairs[] = "{$k}={$v}";
        }
        $headerLines[] = 'Cookie: ' . implode('; ', $pairs);
    }
    foreach ($headers as $k => $v) {
        $headerLines[] = "{$k}: {$v}";
    }

    $opts = [
        'http' => [
            'method' => $method,
            'header' => implode("\r\n", $headerLines),
            'ignore_errors' => true,
            'timeout' => 10,
        ],
    ];
    if ($body !== null) {
        $opts['http']['content'] = $body;
    }

    $ctx = stream_context_create($opts);
    $raw = file_get_contents($url, false, $ctx);
    $respHeaders = $http_response_header ?? [];

    $status = 0;
    $setCookies = [];
    $contentType = '';
    foreach ($respHeaders as $h) {
        if (preg_match('#^HTTP/\S+\s+(\d+)#', $h, $m)) {
            $status = (int) $m[1];
        }
        if (stripos($h, 'Content-Type:') === 0) {
            $contentType = trim(substr($h, 13));
        }
        if ($useCookies && stripos($h, 'Set-Cookie:') === 0) {
            $setCookies[] = trim(substr($h, 11));
            if (preg_match('/^Set-Cookie:\s*([^=]+)=([^;]+)/i', $h, $cm)) {
                if ($cm[2] === '' || stripos($h, 'Expires=Thu, 01 Jan 1970') !== false) {
                    unset($cookies[$cm[1]]);
                } else {
                    $cookies[$cm[1]] = $cm[2];
                }
            }
        }
    }

    $decoded = json_decode((string) $raw, true);
    return [
        'status' => $status,
        'contentType' => $contentType,
        'headers' => $respHeaders,
        'raw' => (string) $raw,
        'body' => is_array($decoded) ? $decoded : $raw,
        'setCookies' => $setCookies,
    ];
}

function http_json(string $method, string $url, ?array $payload = null, ?string $csrf = null, bool $useCookies = true): array
{
    $headers = ['Content-Type' => 'application/json'];
    if ($csrf !== null) {
        $headers['X-CSRF-Token'] = $csrf;
    }
    $body = $payload !== null ? json_encode($payload, JSON_THROW_ON_ERROR) : null;
    return http_request($method, $url, $body, $headers, $useCookies);
}

function http_multipart(string $url, array $fields, array $files, ?string $csrf = null): array
{
    $boundary = '----BeccanTestBoundary' . bin2hex(random_bytes(8));
    $body = '';

    foreach ($fields as $name => $value) {
        $body .= "--{$boundary}\r\n";
        $body .= "Content-Disposition: form-data; name=\"{$name}\"\r\n\r\n";
        $body .= "{$value}\r\n";
    }

    foreach ($files as $fieldName => $fileSpec) {
        $filename = $fileSpec['filename'];
        $mime = $fileSpec['mime'];
        $content = file_get_contents($fileSpec['path']);
        $body .= "--{$boundary}\r\n";
        $body .= "Content-Disposition: form-data; name=\"{$fieldName}\"; filename=\"{$filename}\"\r\n";
        $body .= "Content-Type: {$mime}\r\n\r\n";
        $body .= $content . "\r\n";
    }
    $body .= "--{$boundary}--\r\n";

    $headers = [
        'Content-Type' => "multipart/form-data; boundary={$boundary}",
    ];
    if ($csrf !== null) {
        $headers['X-CSRF-Token'] = $csrf;
    }
    return http_request('POST', $url, $body, $headers);
}

$passed = 0;
function assert_true(bool $condition, string $label, mixed $debug = null): void
{
    global $passed, $sandbox;
    if (!$condition) {
        fwrite(STDERR, "[FAIL] {$label}\n");
        if ($debug !== null) {
            fwrite(STDERR, '  Debug: ' . json_encode($debug, JSON_UNESCAPED_SLASHES) . "\n");
        }
        $errLog = $sandbox . '/server.err.log';
        if (is_file($errLog)) {
            fwrite(STDERR, "  Server log:\n" . file_get_contents($errLog) . "\n");
        }
        exit(1);
    }
    $passed++;
    fwrite(STDOUT, "[PASS] {$label}\n");
}

// 1. Setup admin via CLI script in sandbox
$setupOut = [];
$setupCode = 0;
exec(
    sprintf(
        'php %s %s %s 2>&1',
        escapeshellarg($sandbox . '/private/cli/setup-admin.php'),
        escapeshellarg('schooladmin'),
        escapeshellarg('BeccanTest#2026')
    ),
    $setupOut,
    $setupCode
);
assert_true($setupCode === 0 && is_file($sandbox . '/private/config/admin.json'), '1. CLI one-time admin setup hashes password into private/config/admin.json');

$adminJson = json_decode((string) file_get_contents($sandbox . '/private/config/admin.json'), true);
assert_true(isset($adminJson['passwordHash']) && $adminJson['passwordHash'] !== 'BeccanTest#2026', '2. Admin password is stored hashed, never plaintext');

// 2. Unauthenticated access rejected
$unauthOverview = http_json('GET', "{$baseUrl}/api/admin/overview.php");
assert_true($unauthOverview['status'] === 401, '3. Unauthenticated admin overview request returns 401');

$unauthCreate = http_json('POST', "{$baseUrl}/api/news/create.php", ['title' => 'x', 'summary' => 'y', 'content' => 'z']);
assert_true($unauthCreate['status'] === 401, '4. Unauthenticated write operation returns 401');

// 3. Invalid login & rate limiting
for ($attempt = 1; $attempt <= 5; $attempt++) {
    $bad = http_json('POST', "{$baseUrl}/api/auth/login.php", ['username' => 'schooladmin', 'password' => 'WrongPass123']);
    assert_true($bad['status'] === 401, "5.{$attempt}. Bad login attempt {$attempt} rejected with 401");
}
$locked = http_json('POST', "{$baseUrl}/api/auth/login.php", ['username' => 'schooladmin', 'password' => 'BeccanTest#2026']);
assert_true($locked['status'] === 429, '6. Repeated failed attempts trigger 429 rate-limit lockout');

foreach (glob($sandbox . '/private/data/rate_limits/*.json') ?: [] as $rl) {
    unlink($rl);
}

// 4. Valid login & session cookie flags
$login = http_json('POST', "{$baseUrl}/api/auth/login.php", ['username' => 'schooladmin', 'password' => 'BeccanTest#2026']);
assert_true($login['status'] === 200 && ($login['body']['data']['authenticated'] ?? false) === true, '7. Valid credentials permit login');
$csrf = (string) ($login['body']['data']['csrfToken'] ?? '');
assert_true($csrf !== '', '8. Login issues CSRF token');
$cookieHeaderJoined = implode(' | ', $login['setCookies']);
assert_true(stripos($cookieHeaderJoined, 'HttpOnly') !== false && stripos($cookieHeaderJoined, 'SameSite=Lax') !== false, '9. Session cookie enforces HttpOnly and SameSite protection');

// 5. CSRF enforcement
$noCsrf = http_json('POST', "{$baseUrl}/api/announcements/create.php", ['title' => 'Test', 'message' => 'Body']);
assert_true($noCsrf['status'] === 403, '10. Authenticated POST without CSRF token rejected with 403');

// 6. Password change
$badPwdChange = http_json('POST', "{$baseUrl}/api/auth/change-password.php", [
    'currentPassword' => 'WrongOld123',
    'newPassword' => 'BeccanNew#2026',
    'confirmPassword' => 'BeccanNew#2026',
], $csrf);
assert_true($badPwdChange['status'] === 401, '11. Password change rejects incorrect current password');

$goodPwdChange = http_json('POST', "{$baseUrl}/api/auth/change-password.php", [
    'currentPassword' => 'BeccanTest#2026',
    'newPassword' => 'BeccanNew#2026',
    'confirmPassword' => 'BeccanNew#2026',
], $csrf);
assert_true($goodPwdChange['status'] === 200, '12. Password change succeeds with valid current password');
$csrf = (string) ($goodPwdChange['body']['data']['csrfToken'] ?? $csrf);

// Helper test images
$validImgPath = $sandbox . '/valid_test.jpg';
$im = imagecreatetruecolor(320, 240);
$bg = imagecolorallocate($im, 15, 33, 62);
imagefilledrectangle($im, 0, 0, 319, 239, $bg);
imagejpeg($im, $validImgPath, 90);
imagedestroy($im);

$validPngPath = $sandbox . '/valid_test.png';
$imPng = imagecreatetruecolor(240, 180);
imagepng($imPng, $validPngPath);
imagedestroy($imPng);

$fakePhpPath = $sandbox . '/evil.jpg';
file_put_contents($fakePhpPath, "<?php echo 'hacked'; ?>");

$oversizedPath = $sandbox . '/too_large.jpg';
file_put_contents($oversizedPath, str_repeat('A', 6300000)); // > 6 MB

// 7. Failure-safe upload validation & atomic rollback checks
$rejectedUpload = http_multipart(
    "{$baseUrl}/api/gallery/upload.php",
    ['captions[0]' => 'Evil', 'categories[0]' => 'School Life'],
    ['photos[0]' => ['path' => $fakePhpPath, 'filename' => 'evil.jpg', 'mime' => 'image/jpeg']],
    $csrf
);
assert_true(
    $rejectedUpload['status'] === 422 &&
    count_real_files($sandbox . '/private/media/gallery') === 0 &&
    count_real_files($sandbox . '/private/tmp') === 0,
    '13. Disguised PHP payload rejected via Fileinfo MIME check with zero orphaned files',
    $rejectedUpload
);

$oversizedRes = http_multipart(
    "{$baseUrl}/api/gallery/upload.php",
    ['captions[0]' => 'Oversized', 'categories[0]' => 'School Life'],
    ['photos[0]' => ['path' => $oversizedPath, 'filename' => 'too_large.jpg', 'mime' => 'image/jpeg']],
    $csrf
);
assert_true(
    $oversizedRes['status'] === 422 &&
    count_real_files($sandbox . '/private/media/gallery') === 0,
    '13b. Oversized (>6MB) upload rejected with zero orphaned files',
    $oversizedRes
);

// Invalid metadata in a 2-file batch must reject BEFORE committing first valid file
$badMetaBatch = http_multipart(
    "{$baseUrl}/api/gallery/upload.php",
    [
        'captions[0]' => 'Valid First',
        'categories[0]' => 'School Life',
        'captions[1]' => 'Bad Second',
        'categories[1]' => 'InvalidCategoryName',
    ],
    [
        'photos[0]' => ['path' => $validImgPath, 'filename' => 'one.jpg', 'mime' => 'image/jpeg'],
        'photos[1]' => ['path' => $validPngPath, 'filename' => 'two.png', 'mime' => 'image/png'],
    ],
    $csrf
);
assert_true(
    $badMetaBatch['status'] === 422 &&
    count_real_files($sandbox . '/private/media/gallery') === 0 &&
    count_real_files($sandbox . '/private/tmp') === 0,
    '13c. Invalid metadata in multi-file batch rejected before committing any file',
    $badMetaBatch
);

// Partial batch failure (photo 1 valid, photo 2 invalid MIME) must not leave photo 1 orphaned
$boundary = '----BeccanBatchFail' . bin2hex(random_bytes(6));
$batchBody = '';
$batchFields = [
    'captions[0]' => 'Valid One',
    'categories[0]' => 'School Life',
    'captions[1]' => 'Evil Two',
    'categories[1]' => 'School Life',
];
foreach ($batchFields as $k => $v) {
    $batchBody .= "--{$boundary}\r\nContent-Disposition: form-data; name=\"{$k}\"\r\n\r\n{$v}\r\n";
}
$batchFiles = [
    ['name' => 'one.jpg', 'mime' => 'image/jpeg', 'path' => $validImgPath],
    ['name' => 'two.jpg', 'mime' => 'image/jpeg', 'path' => $fakePhpPath],
];
foreach ($batchFiles as $bf) {
    $batchBody .= "--{$boundary}\r\nContent-Disposition: form-data; name=\"photos[]\"; filename=\"{$bf['name']}\"\r\nContent-Type: {$bf['mime']}\r\n\r\n" . file_get_contents($bf['path']) . "\r\n";
}
$batchBody .= "--{$boundary}--\r\n";
$partialFailRes = http_request('POST', "{$baseUrl}/api/gallery/upload.php", $batchBody, [
    'Content-Type' => "multipart/form-data; boundary={$boundary}",
    'X-CSRF-Token' => $csrf,
]);
assert_true(
    $partialFailRes['status'] === 422 &&
    count_real_files($sandbox . '/private/media/gallery') === 0 &&
    count_real_files($sandbox . '/private/tmp') === 0,
    '13d. Partial multi-file batch failure cleans up staging and leaves zero orphaned images',
    $partialFailRes
);

// Direct verification of JSON write failure rollback cleanup inside private/lib
$rollbackCheckCmd = sprintf(
    'php -r %s',
    escapeshellarg(sprintf(
        'require %s; $stage = create_upload_staging_dir(); $s = stage_uploaded_image(["name"=>"rb.jpg","tmp_name"=>%s,"error"=>0,"size"=>filesize(%s)], "gallery", $stage); $committed = []; try { mutate_json_collection("gallery", fn($c) => ["records"=>$c,"return"=>true], function() use ($s, &$committed) { $committed = commit_staged_images([$s]); throw new RuntimeException("Simulated JSON write failure"); }, function() use (&$committed) { rollback_committed_images($committed); }); } catch (RuntimeException $e) {} remove_directory_recursive($stage); echo is_file(resolve_private_media_path("gallery", $s["mediaFilename"], "original")) ? "LEAKED" : "CLEAN";',
        var_export($sandbox . '/private/config/bootstrap.php', true),
        var_export($validImgPath, true),
        var_export($validImgPath, true)
    ))
);
$rbOut = trim((string) shell_exec($rollbackCheckCmd));
assert_true(
    $rbOut === 'CLEAN' && count_real_files($sandbox . '/private/media/gallery') === 0,
    '13e. Rollback cleans up committed media files when JSON write fails',
    $rbOut
);

// Test post_max_size exceeded handling via dedicated small-limit PHP sub-server
$smallPort = random_int(28001, 32000);
$smallCmd = sprintf('php -d post_max_size=1K -d upload_max_filesize=1K -S 127.0.0.1:%d -t %s', $smallPort, escapeshellarg($sandbox . '/public_html'));
$smallProc = proc_open($smallCmd, $descriptors, $smallPipes);
$smallReady = false;
for ($i = 0; $i < 20; $i++) {
    $fp = @fsockopen('127.0.0.1', $smallPort, $errno, $errstr, 0.2);
    if ($fp) {
        fclose($fp);
        $smallReady = true;
        break;
    }
    usleep(100000);
}
if ($smallReady) {
    $smallLogin = http_json('POST', "http://127.0.0.1:{$smallPort}/api/auth/login.php", ['username' => 'schooladmin', 'password' => 'BeccanNew#2026']);
    $smallCsrf = (string) ($smallLogin['body']['data']['csrfToken'] ?? '');
    $postMaxRes = http_multipart(
        "http://127.0.0.1:{$smallPort}/api/gallery/upload.php",
        ['captions[0]' => 'Exceeds post_max_size', 'categories[0]' => 'School Life'],
        ['photos[0]' => ['path' => $validImgPath, 'filename' => 'assembly.jpg', 'mime' => 'image/jpeg']],
        $smallCsrf
    );
    @proc_terminate($smallProc);
    @proc_close($smallProc);
    assert_true(
        $postMaxRes['status'] === 413 && str_contains(strtolower((string) ($postMaxRes['body']['error'] ?? '')), 'post_max_size'),
        '13f. Exceeding PHP post_max_size returns 413 with clear upload limit explanation',
        $postMaxRes
    );
    // Re-login cleanly on primary server after small-server cookie update
    $login = http_json('POST', "{$baseUrl}/api/auth/login.php", ['username' => 'schooladmin', 'password' => 'BeccanNew#2026']);
    $csrf = (string) ($login['body']['data']['csrfToken'] ?? '');
} else {
    @proc_terminate($smallProc);
    @proc_close($smallProc);
    assert_true(false, '13f. Small post_max_size test server failed to boot');
}

// 8. Valid gallery upload -> Private storage & media-serving privacy verification
$goodUpload = http_multipart(
    "{$baseUrl}/api/gallery/upload.php",
    ['captions[0]' => 'Morning Assembly Compound', 'descriptions[0]' => 'Dodowa campus', 'categories[0]' => 'School Life'],
    ['photos[0]' => ['path' => $validImgPath, 'filename' => 'assembly.jpg', 'mime' => 'image/jpeg']],
    $csrf
);
assert_true($goodUpload['status'] === 201, '14. Valid JPEG photograph uploads and optimizes via GD', $goodUpload);
$uploadedPhoto = $goodUpload['body']['data']['items'][0];
$photoId = $uploadedPhoto['id'];
$photoFilename = $uploadedPhoto['mediaFilename'];
$photoServeUrl = $uploadedPhoto['imageUrl'];
$thumbServeUrl = $uploadedPhoto['thumbnailUrl'];

assert_true(($uploadedPhoto['status'] ?? '') === 'draft', '15. Newly uploaded photo defaults to draft (not auto-published)');
assert_true(
    str_starts_with($photoServeUrl, '/api/media/serve.php?') &&
    is_file($sandbox . '/private/media/gallery/' . $photoFilename) &&
    is_file($sandbox . '/private/media/gallery/thumbs/' . $photoFilename) &&
    count_real_files($sandbox . '/public_html/uploads/gallery') === 0,
    '16. Uploaded photo and thumbnail stored strictly in private/media/gallery/ (never public_html/uploads/)'
);

// Public cannot retrieve draft photo or thumbnail via serve.php
$pubDraftOrig = http_request('GET', $baseUrl . $photoServeUrl, null, [], false);
$pubDraftThumb = http_request('GET', $baseUrl . $thumbServeUrl, null, [], false);
assert_true(
    $pubDraftOrig['status'] === 403 && $pubDraftThumb['status'] === 403,
    '16b. Public visitor blocked (403) from retrieving draft gallery photo & thumbnail',
    ['orig' => $pubDraftOrig['status'], 'thumb' => $pubDraftThumb['status']]
);

// Authenticated admin CAN preview draft photo & thumbnail via serve.php
$adminDraftOrig = http_request('GET', $baseUrl . $photoServeUrl, null, [], true);
$adminDraftThumb = http_request('GET', $baseUrl . $thumbServeUrl, null, [], true);
assert_true(
    $adminDraftOrig['status'] === 200 &&
    str_contains($adminDraftOrig['contentType'], 'image/jpeg') &&
    strlen($adminDraftOrig['raw']) > 100 &&
    $adminDraftThumb['status'] === 200 &&
    str_contains($adminDraftThumb['contentType'], 'image/jpeg'),
    '16c. Authenticated admin can preview draft gallery photo & thumbnail via serve.php'
);

// Traversal & filename-only & invalid identifier attempts rejected
$travRes = http_request('GET', "{$baseUrl}/api/media/serve.php?category=gallery&id=../../private/config/admin.json", null, [], false);
$rawNameRes = http_request('GET', "{$baseUrl}/api/media/serve.php?category=gallery&id={$photoFilename}", null, [], false);
$badCatRes = http_request('GET', "{$baseUrl}/api/media/serve.php?category=../config&id={$photoId}", null, [], false);
assert_true(
    $travRes['status'] === 400 && $rawNameRes['status'] === 400 && $badCatRes['status'] === 400,
    '16d. Directory traversal, invalid category, and raw filename probes rejected with 400'
);

$pubGalleryBefore = http_json('GET', "{$baseUrl}/api/gallery/list.php", null, null, false);
assert_true(count($pubGalleryBefore['body']['data']['items']) === 0, '17. Unpublished draft photo hidden from public gallery API');

$pubPhoto = http_json('POST', "{$baseUrl}/api/gallery/update.php", [
    'id' => $photoId,
    'status' => 'published',
], $csrf);
assert_true($pubPhoto['status'] === 200, '18. Admin publishes uploaded photo');

$pubGalleryAfter = http_json('GET', "{$baseUrl}/api/gallery/list.php", null, null, false);
$pubPublishedOrig = http_request('GET', $baseUrl . $photoServeUrl, null, [], false);
assert_true(
    count($pubGalleryAfter['body']['data']['items']) === 1 &&
    $pubPublishedOrig['status'] === 200 &&
    str_contains($pubPublishedOrig['contentType'], 'image/jpeg') &&
    !array_key_exists('mediaFilename', $pubGalleryAfter['body']['data']['items'][0]),
    '19. Published photo appears on public gallery and streams securely via serve.php without leaking internal mediaFilename'
);

// Create a backup snapshot before unpublishing/deleting so we test media-aware restore
$manualSnap = http_json('POST', "{$baseUrl}/api/admin/backups.php", [
    'action' => 'create',
    'collection' => 'gallery',
], $csrf);
assert_true($manualSnap['status'] === 201 && !empty($manualSnap['body']['data']['snapshotId']), '19a. Manual complete media-aware gallery snapshot created', $manualSnap);
$galleryBackupId = (string) $manualSnap['body']['data']['snapshotId'];

$editPhoto = http_json('POST', "{$baseUrl}/api/gallery/update.php", [
    'id' => $photoId,
    'caption' => 'Updated Morning Assembly',
    'category' => 'Events',
    'status' => 'draft',
], $csrf);
$pubAfterUnpublishImg = http_request('GET', $baseUrl . $photoServeUrl, null, [], false);
assert_true(
    $editPhoto['status'] === 200 && $pubAfterUnpublishImg['status'] === 403,
    '19b. Unpublishing gallery photo immediately revokes public media serve access (403)'
);

$delPhoto = http_json('POST', "{$baseUrl}/api/gallery/delete.php", ['id' => $photoId], $csrf);
clearstatcache(true);
assert_true(
    $delPhoto['status'] === 200 &&
    !is_file($sandbox . '/private/media/gallery/' . $photoFilename) &&
    !is_file($sandbox . '/private/media/gallery/thumbs/' . $photoFilename),
    '20. Deleting gallery photo removes JSON record and private image/thumbnail files'
);

// Restore media-aware backup -> must restore BOTH JSON record and original + thumbnail files
$galleryRestore = http_json('POST', "{$baseUrl}/api/admin/backups.php", [
    'action' => 'restore',
    'filename' => $galleryBackupId,
], $csrf);
clearstatcache(true);
$restoredPublicServe = http_request('GET', $baseUrl . $photoServeUrl, null, [], false);
assert_true(
    $galleryRestore['status'] === 200 &&
    ($galleryRestore['body']['data']['recordCount'] ?? 0) === 1 &&
    ($galleryRestore['body']['data']['restoredMediaFiles'] ?? 0) === 2 &&
    !empty($galleryRestore['body']['data']['safetyBackupId']) &&
    is_dir($sandbox . '/private/backups/' . $galleryRestore['body']['data']['safetyBackupId']) &&
    is_file($sandbox . '/private/media/gallery/' . $photoFilename) &&
    is_file($sandbox . '/private/media/gallery/thumbs/' . $photoFilename) &&
    $restoredPublicServe['status'] === 200,
    '20b. Restoring media-aware gallery backup restores JSON, original, thumbnail, safety snapshot, and live serving',
    $galleryRestore
);

// Test failed restoration (missing media inside snapshot) leaves existing live content untouched!
$corruptSnapId = 'gallery_20250101_000000_dead01';
copy_dir($sandbox . '/private/backups/' . $galleryBackupId, $sandbox . '/private/backups/' . $corruptSnapId);
unlink($sandbox . '/private/backups/' . $corruptSnapId . '/media/gallery/' . $photoFilename);
$failedRestore = http_json('POST', "{$baseUrl}/api/admin/backups.php", [
    'action' => 'restore',
    'filename' => $corruptSnapId,
], $csrf);
clearstatcache(true);
$liveAfterFailedRestore = http_json('GET', "{$baseUrl}/api/gallery/list.php", null, null, false);
assert_true(
    $failedRestore['status'] === 422 &&
    count($liveAfterFailedRestore['body']['data']['items'] ?? []) === 1 &&
    is_file($sandbox . '/private/media/gallery/' . $photoFilename),
    '20c. Failed restoration due to missing backup media aborts safely and preserves live JSON + media',
    $failedRestore
);

// 9. Storage monitoring & quota enforcement verification
$storageRes = http_json('GET', "{$baseUrl}/api/admin/storage.php");
$expectedMainSize = (int) filesize($sandbox . '/private/media/gallery/' . $photoFilename);
$expectedThumbSize = (int) filesize($sandbox . '/private/media/gallery/thumbs/' . $photoFilename);
assert_true(
    $storageRes['status'] === 200 &&
    array_key_exists('configuredLimitBytes', $storageRes['body']['data']['storage'] ?? []) &&
    $storageRes['body']['data']['storage']['configuredLimitBytes'] === null &&
    ($storageRes['body']['data']['storage']['totalOriginalsCount'] ?? 0) === 1 &&
    ($storageRes['body']['data']['storage']['totalThumbnailsCount'] ?? 0) === 1 &&
    ($storageRes['body']['data']['storage']['totalBytes'] ?? 0) === ($expectedMainSize + $expectedThumbSize),
    '20d. Storage monitor accurately sums real filesystem bytes & counts and leaves unconfigured limit as null',
    $storageRes
);

// Missing media directory resilience
remove_dir($sandbox . '/private/media/events');
$storageMissingDir = http_json('GET', "{$baseUrl}/api/admin/storage.php");
assert_true(
    $storageMissingDir['status'] === 200 && ($storageMissingDir['body']['data']['storage']['events']['totalBytes'] ?? -1) === 0,
    '20e. Storage monitor handles missing media subdirectory gracefully with zero counts'
);
if (!is_dir($sandbox . '/private/media/events/thumbs')) {
    mkdir($sandbox . '/private/media/events/thumbs', 0750, true);
}

// Enforce storage quota limit tightly just above current usage, verify next upload blocked cleanly
$setQuota = http_json('POST', "{$baseUrl}/api/admin/storage.php", [
    'storageLimitBytes' => $expectedMainSize + $expectedThumbSize + 50,
    'storageWarningPercent' => 80,
], $csrf);
$quotaBlockedUpload = http_multipart(
    "{$baseUrl}/api/gallery/upload.php",
    ['captions[0]' => 'Quota Exceeded Photo', 'categories[0]' => 'School Life'],
    ['photos[0]' => ['path' => $validPngPath, 'filename' => 'quota.png', 'mime' => 'image/png']],
    $csrf
);
assert_true(
    $setQuota['status'] === 200 &&
    ($setQuota['body']['data']['storage']['approachingLimit'] ?? false) === true &&
    $quotaBlockedUpload['status'] === 422 &&
    count_real_files($sandbox . '/private/media/gallery') === 2,
    '20f. Configurable storage limit triggers approaching warning and blocks uploads exceeding quota with zero orphans',
    ['quota' => $setQuota, 'blocked' => $quotaBlockedUpload]
);

// Clear limit to proceed with news & events tests
http_json('POST', "{$baseUrl}/api/admin/storage.php", ['storageLimitBytes' => null], $csrf);

// 10. News create (draft cover image privacy), publish, edit, archive, delete
$newsDraft = http_multipart(
    "{$baseUrl}/api/news/create.php",
    [
        'title' => 'First Term Science Fair',
        'summary' => 'Learners showcase science projects.',
        'content' => "<script>alert('xss')</script>Learners presented science models.\n\nParents attended in Dodowa.",
        'category' => 'Academic News',
        'status' => 'draft',
    ],
    ['coverImage' => ['path' => $validImgPath, 'filename' => 'science-cover.jpg', 'mime' => 'image/jpeg']],
    $csrf
);
assert_true($newsDraft['status'] === 201, '21. News draft created with private cover image', $newsDraft);
$newsId = $newsDraft['body']['data']['article']['id'];
$newsSlug = $newsDraft['body']['data']['article']['slug'];
$newsCoverServeUrl = (string) ($newsDraft['body']['data']['article']['coverImageUrl'] ?? '');
$newsMediaFile = (string) ($newsDraft['body']['data']['article']['mediaFilename'] ?? '');

$pubNewsDraftCover = http_request('GET', $baseUrl . $newsCoverServeUrl, null, [], false);
$adminNewsDraftCover = http_request('GET', $baseUrl . $newsCoverServeUrl, null, [], true);
assert_true(
    $pubNewsDraftCover['status'] === 403 && $adminNewsDraftCover['status'] === 200,
    '21b. Draft news cover image blocked publicly (403) while admin preview succeeds (200)'
);
assert_true(!str_contains($newsDraft['body']['data']['article']['content'], '<script>'), '22. Article content strips executable HTML/script tags');

$draftPublicFetch = http_json('GET', "{$baseUrl}/api/news/article.php?slug=" . urlencode($newsSlug), null, null, false);
assert_true($draftPublicFetch['status'] === 404, '23. Draft news article is inaccessible (404) on public endpoint');

$newsPub = http_json('POST', "{$baseUrl}/api/news/publish.php", ['id' => $newsId, 'status' => 'published'], $csrf);
$pubNewsLiveCover = http_request('GET', $baseUrl . $newsCoverServeUrl, null, [], false);
assert_true($newsPub['status'] === 200 && $pubNewsLiveCover['status'] === 200, '24. Published news article & cover image accessible publicly');

$pubArticleFetch = http_json('GET', "{$baseUrl}/api/news/article.php?slug=" . urlencode($newsSlug), null, null, false);
assert_true(
    $pubArticleFetch['status'] === 200 &&
    ($pubArticleFetch['body']['data']['article']['slug'] ?? '') === $newsSlug &&
    !array_key_exists('mediaFilename', $pubArticleFetch['body']['data']['article']),
    '25. Published article resolves via slug publicly without leaking mediaFilename'
);

$newsEdit = http_json('POST', "{$baseUrl}/api/news/update.php", [
    'id' => $newsId,
    'title' => 'Updated Term Science Fair',
    'category' => 'Achievements',
], $csrf);
assert_true($newsEdit['status'] === 200 && ($newsEdit['body']['data']['article']['title'] ?? '') === 'Updated Term Science Fair', '25b. Admin edits news article');

$newsArchive = http_json('POST', "{$baseUrl}/api/news/publish.php", ['id' => $newsId, 'status' => 'archived'], $csrf);
$archivedPublicFetch = http_json('GET', "{$baseUrl}/api/news/article.php?slug=" . urlencode($newsSlug), null, null, false);
$archivedCoverFetch = http_request('GET', $baseUrl . $newsCoverServeUrl, null, [], false);
assert_true(
    $newsArchive['status'] === 200 && $archivedPublicFetch['status'] === 404 && $archivedCoverFetch['status'] === 403,
    '25c. Archived news article and its cover image are hidden from public website'
);

$newsRepublish = http_json('POST', "{$baseUrl}/api/news/publish.php", ['id' => $newsId, 'status' => 'published'], $csrf);
assert_true($newsRepublish['status'] === 200, '25d. News article re-published');

$newsSecond = http_multipart(
    "{$baseUrl}/api/news/create.php",
    [
        'title' => 'Temporary Second Article',
        'summary' => 'To be rolled back via backup.',
        'content' => 'Temporary body.',
        'category' => 'General News',
        'status' => 'published',
    ],
    [],
    $csrf
);
assert_true($newsSecond['status'] === 201, '26. Second news article created (triggering media-aware backup)');

$backupsList = http_json('GET', "{$baseUrl}/api/admin/backups.php");
$newsBackups = array_values(array_filter(
    $backupsList['body']['data']['backups'] ?? [],
    static fn (array $b): bool => $b['collection'] === 'news'
));
assert_true(
    count($newsBackups) >= 1 && ($newsBackups[0]['includesMedia'] ?? false) === true,
    '27. Pre-write media-aware snapshot created for news',
    $backupsList
);
$latestNewsBackup = $newsBackups[0]['filename'];

$restoreRes = http_json('POST', "{$baseUrl}/api/admin/backups.php", ['filename' => $latestNewsBackup], $csrf);
assert_true(
    $restoreRes['status'] === 200 &&
    ($restoreRes['body']['data']['recordCount'] ?? 0) === 1 &&
    ($restoreRes['body']['data']['restoredMediaFiles'] ?? 0) === 2,
    '28. Backup restoration rolls news back to 1 article and verifies both cover image files'
);

$newsDelete = http_json('POST', "{$baseUrl}/api/news/delete.php", ['id' => $newsId], $csrf);
clearstatcache(true);
assert_true(
    $newsDelete['status'] === 200 &&
    !is_file($sandbox . '/private/media/news/' . $newsMediaFile) &&
    !is_file($sandbox . '/private/media/news/thumbs/' . $newsMediaFile),
    '28b. Deleting news article removes record and private cover image files'
);

// 11. Announcements expiry, edit & delete rules
$annActive = http_json('POST', "{$baseUrl}/api/announcements/create.php", [
    'title' => 'Active Urgent Notice',
    'message' => 'School gate opens at 7:00 AM.',
    'priority' => 'Urgent',
    'status' => 'published',
], $csrf);
$annExpired = http_json('POST', "{$baseUrl}/api/announcements/create.php", [
    'title' => 'Expired Notice',
    'message' => 'Old term notice.',
    'priority' => 'Normal',
    'status' => 'published',
    'expiresAt' => '2020-01-01',
], $csrf);
assert_true($annActive['status'] === 201 && $annExpired['status'] === 201, '29. Created active and expired announcements');
$annActiveId = $annActive['body']['data']['item']['id'];

$pubAnn = http_json('GET', "{$baseUrl}/api/announcements/list.php", null, null, false);
assert_true(
    count($pubAnn['body']['data']['items']) === 1 &&
    $pubAnn['body']['data']['items'][0]['title'] === 'Active Urgent Notice',
    '30. Expired announcements automatically excluded from public announcement feed'
);

$annEdit = http_json('POST', "{$baseUrl}/api/announcements/update.php", [
    'id' => $annActiveId,
    'priority' => 'Important',
    'status' => 'draft',
], $csrf);
$pubAnnAfterUnpub = http_json('GET', "{$baseUrl}/api/announcements/list.php", null, null, false);
assert_true(
    $annEdit['status'] === 200 && count($pubAnnAfterUnpub['body']['data']['items']) === 0,
    '30b. Editing and unpublishing announcement removes it from public feed'
);

$annDel = http_json('POST', "{$baseUrl}/api/announcements/delete.php", ['id' => $annActiveId], $csrf);
assert_true($annDel['status'] === 200, '30c. Announcement deleted');

// 12. Events upcoming vs past, draft event cover privacy, edit & delete
$evtUpcoming = http_multipart("{$baseUrl}/api/events/create.php", [
    'title' => 'Future Speech Day',
    'description' => 'Annual celebration.',
    'eventDate' => '2099-05-15',
    'startTime' => '09:00',
    'endTime' => '12:30',
    'venue' => 'School Courtyard',
    'status' => 'published',
], ['coverImage' => ['path' => $validImgPath, 'filename' => 'event.jpg', 'mime' => 'image/jpeg']], $csrf);
$evtPast = http_multipart("{$baseUrl}/api/events/create.php", [
    'title' => 'Past Orientation',
    'description' => 'Previous gathering.',
    'eventDate' => '2020-02-10',
    'venue' => 'Main Hall',
    'status' => 'published',
], [], $csrf);
$evtDraft = http_multipart("{$baseUrl}/api/events/create.php", [
    'title' => 'Unpublished Event',
    'description' => 'Draft only.',
    'eventDate' => '2099-06-01',
    'venue' => 'Hall',
    'status' => 'draft',
], ['coverImage' => ['path' => $validPngPath, 'filename' => 'draft-event.png', 'mime' => 'image/png']], $csrf);
assert_true($evtUpcoming['status'] === 201 && $evtPast['status'] === 201 && $evtDraft['status'] === 201, '31. Created upcoming, past, and draft events');

$evtUpcomingId = $evtUpcoming['body']['data']['item']['id'];
$evtMediaFile = (string) ($evtUpcoming['body']['data']['item']['mediaFilename'] ?? '');
$evtPubCoverUrl = (string) ($evtUpcoming['body']['data']['item']['coverImageUrl'] ?? '');
$evtDraftCoverUrl = (string) ($evtDraft['body']['data']['item']['coverImageUrl'] ?? '');

$pubDraftEventCover = http_request('GET', $baseUrl . $evtDraftCoverUrl, null, [], false);
$adminDraftEventCover = http_request('GET', $baseUrl . $evtDraftCoverUrl, null, [], true);
$pubLiveEventCover = http_request('GET', $baseUrl . $evtPubCoverUrl, null, [], false);
assert_true(
    $pubDraftEventCover['status'] === 403 &&
    $adminDraftEventCover['status'] === 200 &&
    $pubLiveEventCover['status'] === 200,
    '31b. Draft event cover blocked publicly (403), previewable by admin (200), published event cover served publicly (200)'
);

$pubEvents = http_json('GET', "{$baseUrl}/api/events/list.php", null, null, false);
assert_true(
    count($pubEvents['body']['data']['upcoming']) === 1 &&
    count($pubEvents['body']['data']['past']) === 1 &&
    $pubEvents['body']['data']['upcoming'][0]['title'] === 'Future Speech Day',
    '32. Events API automatically separates upcoming vs past and hides unpublished events'
);

$evtEdit = http_json('POST', "{$baseUrl}/api/events/update.php", [
    'id' => $evtUpcomingId,
    'venue' => 'Assembly Courtyard',
], $csrf);
assert_true($evtEdit['status'] === 200 && ($evtEdit['body']['data']['item']['venue'] ?? '') === 'Assembly Courtyard', '32b. Admin edits event details');

$evtDel = http_json('POST', "{$baseUrl}/api/events/delete.php", ['id' => $evtUpcomingId], $csrf);
clearstatcache(true);
assert_true(
    $evtDel['status'] === 200 &&
    !is_file($sandbox . '/private/media/events/' . $evtMediaFile) &&
    !is_file($sandbox . '/private/media/events/thumbs/' . $evtMediaFile),
    '32c. Deleting event removes record and private cover image files'
);

// 13. ZIP archive capability check & JSON-only download check
$capRes = http_json('GET', "{$baseUrl}/api/admin/backups.php");
$zipSupported = (bool) ($capRes['body']['data']['capabilities']['zipArchiveSupported'] ?? false);
$jsonDownload = http_request('GET', "{$baseUrl}/api/admin/backups.php?download={$galleryBackupId}&format=json", null, [], true);
$zipDownload = http_request('GET', "{$baseUrl}/api/admin/backups.php?download={$galleryBackupId}&format=zip", null, [], true);
assert_true(
    $jsonDownload['status'] === 200 &&
    is_array($jsonDownload['body']) &&
    ($zipSupported ? $zipDownload['status'] === 200 : $zipDownload['status'] === 501),
    '32d. JSON-only backup export downloads cleanly and ZIP download accurately checks ZipArchive availability',
    ['zipSupported' => $zipSupported, 'zipStatus' => $zipDownload['status']]
);

// 14. Legacy media CLI migration verification
$legacyHex = bin2hex(random_bytes(16)) . '.jpg';
copy($validImgPath, $sandbox . '/public_html/uploads/gallery/' . $legacyHex);
if (!is_dir($sandbox . '/public_html/uploads/gallery/thumbs')) {
    mkdir($sandbox . '/public_html/uploads/gallery/thumbs', 0750, true);
}
copy($validImgPath, $sandbox . '/public_html/uploads/gallery/thumbs/' . $legacyHex);
$legacyRecord = [[
    'id' => 'gal_0123456789abcdef',
    'caption' => 'Legacy Migrated Photo',
    'description' => 'From old uploads dir',
    'category' => 'Facilities',
    'imageUrl' => '/uploads/gallery/' . $legacyHex,
    'thumbnailUrl' => '/uploads/gallery/thumbs/' . $legacyHex,
    'status' => 'published',
    'uploadedAt' => '2026-01-01T00:00:00Z',
    'updatedAt' => '2026-01-01T00:00:00Z',
    'publishedAt' => '2026-01-01T00:00:00Z',
]];
file_put_contents($sandbox . '/private/data/gallery.json', json_encode($legacyRecord, JSON_PRETTY_PRINT));
$migOut = [];
$migCode = 0;
exec(sprintf('php %s 2>&1', escapeshellarg($sandbox . '/private/cli/migrate-legacy-media.php')), $migOut, $migCode);
clearstatcache(true);
$migratedGallery = json_decode((string) file_get_contents($sandbox . '/private/data/gallery.json'), true);
$migratedServe = http_request('GET', $baseUrl . ($migratedGallery[0]['imageUrl'] ?? ''), null, [], false);
assert_true(
    $migCode === 0 &&
    is_file($sandbox . '/private/media/gallery/' . $legacyHex) &&
    is_file($sandbox . '/public_html/uploads/gallery/' . $legacyHex) &&
    $migratedServe['status'] === 200,
    '32e. Legacy migration moves record to private/media & serve.php while preserving old files until verified',
    $migOut
);
exec(sprintf('php %s --cleanup-verified 2>&1', escapeshellarg($sandbox . '/private/cli/migrate-legacy-media.php')), $migCleanOut, $migCleanCode);
clearstatcache(true);
assert_true(
    $migCleanCode === 0 &&
    !is_file($sandbox . '/public_html/uploads/gallery/' . $legacyHex) &&
    is_file($sandbox . '/private/media/gallery/' . $legacyHex),
    '32f. Legacy migration --cleanup-verified removes old public copies safely once private files verified'
);

// 15. Logout invalidates session
$logout = http_json('POST', "{$baseUrl}/api/auth/logout.php", [], $csrf);
assert_true($logout['status'] === 200, '33. Logout succeeds');
$afterLogout = http_json('GET', "{$baseUrl}/api/admin/overview.php");
assert_true($afterLogout['status'] === 401, '34. Logout destroys session and blocks subsequent admin access');

// 16. One-time web token setup verification
unlink($sandbox . '/private/config/admin.json');
file_put_contents($sandbox . '/private/config/setup-token.txt', "beccan-one-time-token-98765\n");

$badTokenSetup = http_json('POST', "{$baseUrl}/api/auth/setup.php", [
    'setupToken' => 'wrong-token',
    'username' => 'webadmin',
    'password' => 'BeccanWeb#2026',
    'confirmPassword' => 'BeccanWeb#2026',
]);
assert_true($badTokenSetup['status'] === 403, '35. Web setup rejects invalid setup token');

$goodTokenSetup = http_json('POST', "{$baseUrl}/api/auth/setup.php", [
    'setupToken' => 'beccan-one-time-token-98765',
    'username' => 'webadmin',
    'password' => 'BeccanWeb#2026',
    'confirmPassword' => 'BeccanWeb#2026',
]);
clearstatcache(true);
assert_true(
    $goodTokenSetup['status'] === 201 &&
    !is_file($sandbox . '/private/config/setup-token.txt') &&
    is_file($sandbox . '/private/config/admin.json'),
    '36. Valid web setup creates admin.json, deletes setup-token.txt, and logs admin in'
);

$repeatSetup = http_json('POST', "{$baseUrl}/api/auth/setup.php", [
    'setupToken' => 'beccan-one-time-token-98765',
    'username' => 'anotheradmin',
    'password' => 'BeccanWeb#2026',
    'confirmPassword' => 'BeccanWeb#2026',
]);
assert_true($repeatSetup['status'] === 403, '37. Repeated web setup blocked after admin configuration');

fwrite(STDOUT, "\nAll {$passed} PHP backend security, privacy, backup, upload, and storage assertions passed.\n");
