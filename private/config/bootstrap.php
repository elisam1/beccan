<?php
declare(strict_types=1);

if (defined('BECCAN_BOOTSTRAPPED')) {
    return;
}
define('BECCAN_BOOTSTRAPPED', true);

// Prevent raw PHP errors/paths from leaking into JSON API output
ini_set('display_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);

date_default_timezone_set('UTC');

$privateRoot = dirname(__DIR__);
define('BECCAN_PRIVATE_DIR', $privateRoot);
define('BECCAN_CONFIG_DIR', $privateRoot . '/config');
define('BECCAN_DATA_DIR', $privateRoot . '/data');
define('BECCAN_BACKUP_DIR', $privateRoot . '/backups');
define('BECCAN_RATE_LIMIT_DIR', $privateRoot . '/data/rate_limits');

// Resolve public_html root whether running locally or on cPanel (sibling directory)
$publicCandidates = [
    dirname($privateRoot) . '/public_html',
    dirname($privateRoot) . '/htdocs',
    dirname($privateRoot) . '/www',
];
$resolvedPublicDir = $publicCandidates[0];
foreach ($publicCandidates as $candidate) {
    if (is_dir($candidate)) {
        $resolvedPublicDir = $candidate;
        break;
    }
}
define('BECCAN_PUBLIC_DIR', $resolvedPublicDir);
define('BECCAN_UPLOADS_DIR', $resolvedPublicDir . '/uploads');

foreach ([
    BECCAN_CONFIG_DIR,
    BECCAN_DATA_DIR,
    BECCAN_BACKUP_DIR,
    BECCAN_RATE_LIMIT_DIR,
    BECCAN_UPLOADS_DIR . '/gallery/thumbs',
    BECCAN_UPLOADS_DIR . '/news/thumbs',
    BECCAN_UPLOADS_DIR . '/events/thumbs',
] as $dir) {
    if (!is_dir($dir)) {
        @mkdir($dir, 0750, true);
    }
}

if (PHP_SAPI !== 'cli') {
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    header('Permissions-Policy: camera=(), microphone=(), geolocation=()');
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
}

require_once BECCAN_PRIVATE_DIR . '/lib/response.php';
require_once BECCAN_PRIVATE_DIR . '/lib/validation.php';
require_once BECCAN_PRIVATE_DIR . '/lib/json_store.php';
require_once BECCAN_PRIVATE_DIR . '/lib/auth.php';
require_once BECCAN_PRIVATE_DIR . '/lib/upload.php';

set_exception_handler(static function (Throwable $e): void {
    if (PHP_SAPI === 'cli') {
        fwrite(STDERR, 'Error: ' . $e->getMessage() . PHP_EOL);
        exit(1);
    }
    error_log('[Beccan API] ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
    json_error('An unexpected server error occurred. Please try again.', 500);
});
