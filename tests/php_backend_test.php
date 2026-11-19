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

// Wait for server readiness
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

function http_request(string $method, string $url, ?string $body = null, array $headers = []): array
{
    global $cookies;
    $headerLines = [];
    if ($cookies !== []) {
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
    foreach ($respHeaders as $h) {
        if (preg_match('#^HTTP/\S+\s+(\d+)#', $h, $m)) {
            $status = (int) $m[1];
        }
        if (stripos($h, 'Set-Cookie:') === 0) {
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
        'body' => is_array($decoded) ? $decoded : $raw,
        'setCookies' => $setCookies,
    ];
}

function http_json(string $method, string $url, ?array $payload = null, ?string $csrf = null): array
{
    $headers = ['Content-Type' => 'application/json'];
    if ($csrf !== null) {
        $headers['X-CSRF-Token'] = $csrf;
    }
    $body = $payload !== null ? json_encode($payload, JSON_THROW_ON_ERROR) : null;
    return http_request($method, $url, $body, $headers);
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

// Clear rate limit in sandbox to continue testing valid login
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

// 7. Gallery upload, MIME rejection, publish/unpublish, delete cleanup
$validImgPath = $sandbox . '/valid_test.jpg';
$im = imagecreatetruecolor(320, 240);
$bg = imagecolorallocate($im, 15, 33, 62);
imagefilledrectangle($im, 0, 0, 319, 239, $bg);
imagejpeg($im, $validImgPath, 90);
imagedestroy($im);

$fakePhpPath = $sandbox . '/evil.jpg';
file_put_contents($fakePhpPath, "<?php echo 'hacked'; ?>");

$rejectedUpload = http_multipart(
    "{$baseUrl}/api/gallery/upload.php",
    ['captions[0]' => 'Evil', 'categories[0]' => 'School Life'],
    ['photos[0]' => ['path' => $fakePhpPath, 'filename' => 'evil.jpg', 'mime' => 'image/jpeg']],
    $csrf
);
assert_true($rejectedUpload['status'] === 422, '13. Disguised PHP payload upload rejected via Fileinfo MIME check', $rejectedUpload);

$goodUpload = http_multipart(
    "{$baseUrl}/api/gallery/upload.php",
    ['captions[0]' => 'Morning Assembly Compound', 'descriptions[0]' => 'Dodowa campus', 'categories[0]' => 'School Life'],
    ['photos[0]' => ['path' => $validImgPath, 'filename' => 'assembly.jpg', 'mime' => 'image/jpeg']],
    $csrf
);
assert_true($goodUpload['status'] === 201, '14. Valid JPEG photograph uploads and optimizes via GD');
$uploadedPhoto = $goodUpload['body']['data']['items'][0];
$photoId = $uploadedPhoto['id'];
$photoRelUrl = $uploadedPhoto['imageUrl'];
$thumbRelUrl = $uploadedPhoto['thumbnailUrl'];
assert_true(($uploadedPhoto['status'] ?? '') === 'draft', '15. Newly uploaded photo defaults to draft (not auto-published)');
assert_true(
    is_file($sandbox . '/public_html' . $photoRelUrl) && is_file($sandbox . '/public_html' . $thumbRelUrl),
    '16. Uploaded photo and thumbnail written to public_html/uploads/gallery/'
);

$pubGalleryBefore = http_json('GET', "{$baseUrl}/api/gallery/list.php");
assert_true(count($pubGalleryBefore['body']['data']['items']) === 0, '17. Unpublished draft photo hidden from public gallery');

$pubPhoto = http_json('POST', "{$baseUrl}/api/gallery/update.php", [
    'id' => $photoId,
    'status' => 'published',
], $csrf);
assert_true($pubPhoto['status'] === 200, '18. Admin publishes uploaded photo');

$pubGalleryAfter = http_json('GET', "{$baseUrl}/api/gallery/list.php");
assert_true(count($pubGalleryAfter['body']['data']['items']) === 1, '19. Published photo appears on public gallery');

$editPhoto = http_json('POST', "{$baseUrl}/api/gallery/update.php", [
    'id' => $photoId,
    'caption' => 'Updated Morning Assembly',
    'category' => 'Events',
    'status' => 'draft',
], $csrf);
assert_true(
    $editPhoto['status'] === 200 &&
    ($editPhoto['body']['data']['item']['caption'] ?? '') === 'Updated Morning Assembly' &&
    ($editPhoto['body']['data']['item']['status'] ?? '') === 'draft',
    '19b. Admin edits gallery caption/category and unpublishes photo',
    $editPhoto
);

$pubGalleryUnpublished = http_json('GET', "{$baseUrl}/api/gallery/list.php");
assert_true(count($pubGalleryUnpublished['body']['data']['items']) === 0, '19c. Unpublished photo removed from public gallery');

$delPhoto = http_json('POST', "{$baseUrl}/api/gallery/delete.php", ['id' => $photoId], $csrf);
clearstatcache(true);
$adminGalleryAfterDelete = http_json('GET', "{$baseUrl}/api/gallery/list.php?scope=admin");
assert_true(
    $delPhoto['status'] === 200 &&
    !is_file($sandbox . '/public_html' . $photoRelUrl) &&
    !is_file($sandbox . '/public_html' . $thumbRelUrl) &&
    count($adminGalleryAfterDelete['body']['data']['items'] ?? []) === 0,
    '20. Deleting gallery photo removes JSON record and image/thumbnail files',
    ['del' => $delPhoto, 'adminList' => $adminGalleryAfterDelete]
);

// 8. News create (with XSS sanitization), draft privacy, publish, edit, archive, cover delete, backup restore
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
assert_true($newsDraft['status'] === 201, '21. News draft created with cover image', $newsDraft);
$newsId = $newsDraft['body']['data']['article']['id'];
$newsSlug = $newsDraft['body']['data']['article']['slug'];
$newsCoverUrl = (string) ($newsDraft['body']['data']['article']['coverImageUrl'] ?? '');
assert_true(!str_contains($newsDraft['body']['data']['article']['content'], '<script>'), '22. Article content strips executable HTML/script tags');

$draftPublicFetch = http_json('GET', "{$baseUrl}/api/news/article.php?slug=" . urlencode($newsSlug));
assert_true($draftPublicFetch['status'] === 404, '23. Draft news article is inaccessible (404) on public endpoint');

$newsPub = http_json('POST', "{$baseUrl}/api/news/publish.php", ['id' => $newsId, 'status' => 'published'], $csrf);
assert_true($newsPub['status'] === 200, '24. News article published');

$pubArticleFetch = http_json('GET', "{$baseUrl}/api/news/article.php?slug=" . urlencode($newsSlug));
assert_true($pubArticleFetch['status'] === 200 && ($pubArticleFetch['body']['data']['article']['slug'] ?? '') === $newsSlug, '25. Published article resolves via slug publicly');

$newsEdit = http_json('POST', "{$baseUrl}/api/news/update.php", [
    'id' => $newsId,
    'title' => 'Updated Term Science Fair',
    'category' => 'Achievements',
], $csrf);
assert_true($newsEdit['status'] === 200 && ($newsEdit['body']['data']['article']['title'] ?? '') === 'Updated Term Science Fair', '25b. Admin edits news article');

$newsArchive = http_json('POST', "{$baseUrl}/api/news/publish.php", ['id' => $newsId, 'status' => 'archived'], $csrf);
$archivedPublicFetch = http_json('GET', "{$baseUrl}/api/news/article.php?slug=" . urlencode($newsSlug));
assert_true($newsArchive['status'] === 200 && $archivedPublicFetch['status'] === 404, '25c. Archived news article is hidden from public website');

$newsRepublish = http_json('POST', "{$baseUrl}/api/news/publish.php", ['id' => $newsId, 'status' => 'published'], $csrf);
assert_true($newsRepublish['status'] === 200, '25d. News article re-published');

// Create second article then restore earlier backup
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
assert_true($newsSecond['status'] === 201, '26. Second news article created (triggering pre-write backup)');

$backupsList = http_json('GET', "{$baseUrl}/api/admin/backups.php");
$newsBackups = array_values(array_filter(
    $backupsList['body']['data']['backups'] ?? [],
    static fn (array $b): bool => $b['collection'] === 'news'
));
assert_true(count($newsBackups) >= 1, '27. Pre-write backup snapshot created for news');
$latestNewsBackup = $newsBackups[0]['filename'];

$restoreRes = http_json('POST', "{$baseUrl}/api/admin/backups.php", ['filename' => $latestNewsBackup], $csrf);
assert_true($restoreRes['status'] === 200 && ($restoreRes['body']['data']['recordCount'] ?? 0) === 1, '28. Backup restoration rolls news.json back to 1 article');

$newsDelete = http_json('POST', "{$baseUrl}/api/news/delete.php", ['id' => $newsId], $csrf);
clearstatcache(true);
assert_true(
    $newsDelete['status'] === 200 && ($newsCoverUrl === '' || !is_file($sandbox . '/public_html' . $newsCoverUrl)),
    '28b. Deleting news article removes record and cover image file'
);

// 9. Announcements expiry, edit & delete rules
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

$pubAnn = http_json('GET', "{$baseUrl}/api/announcements/list.php");
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
$pubAnnAfterUnpub = http_json('GET', "{$baseUrl}/api/announcements/list.php");
assert_true(
    $annEdit['status'] === 200 && count($pubAnnAfterUnpub['body']['data']['items']) === 0,
    '30b. Editing and unpublishing announcement removes it from public feed'
);

$annDel = http_json('POST', "{$baseUrl}/api/announcements/delete.php", ['id' => $annActiveId], $csrf);
assert_true($annDel['status'] === 200, '30c. Announcement deleted');

// 10. Events upcoming vs past separation, edit & delete
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
], [], $csrf);
assert_true($evtUpcoming['status'] === 201 && $evtPast['status'] === 201 && $evtDraft['status'] === 201, '31. Created upcoming, past, and draft events');
$evtUpcomingId = $evtUpcoming['body']['data']['item']['id'];
$evtCoverUrl = (string) ($evtUpcoming['body']['data']['item']['coverImageUrl'] ?? '');

$pubEvents = http_json('GET', "{$baseUrl}/api/events/list.php");
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
    $evtDel['status'] === 200 && ($evtCoverUrl === '' || !is_file($sandbox . '/public_html' . $evtCoverUrl)),
    '32c. Deleting event removes record and cover image'
);

// 11. Logout invalidates session
$logout = http_json('POST', "{$baseUrl}/api/auth/logout.php", [], $csrf);
assert_true($logout['status'] === 200, '33. Logout succeeds');
$afterLogout = http_json('GET', "{$baseUrl}/api/admin/overview.php");
assert_true($afterLogout['status'] === 401, '34. Logout destroys session and blocks subsequent admin access');

// 12. One-time web token setup verification (when admin.json does not yet exist)
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

fwrite(STDOUT, "\nAll {$passed} PHP backend security & CMS assertions passed.\n");
