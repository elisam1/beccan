<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/_bootstrap.php';

require_http_method('POST');
ensure_session_started();

if (is_admin_configured()) {
    json_error('Initial setup has already been completed.', 403);
}

if (!is_web_setup_enabled()) {
    json_error(
        'One-time web setup is locked. Place a random token in private/config/setup-token.txt or run php private/cli/setup-admin.php via CLI.',
        403
    );
}

$body = read_json_body();
$providedToken = trim((string) ($body['setupToken'] ?? ''));
$expectedToken = trim((string) @file_get_contents(setup_token_path()));

if ($providedToken === '' || $expectedToken === '' || !hash_equals($expectedToken, $providedToken)) {
    json_error('Invalid setup token.', 403);
}

$username = (string) ($body['username'] ?? '');
$password = (string) ($body['password'] ?? '');
$confirmPassword = (string) ($body['confirmPassword'] ?? '');

if ($password !== $confirmPassword) {
    json_error('Passwords do not match.', 422);
}

try {
    $record = save_admin_record($username, $password);
} catch (InvalidArgumentException $e) {
    json_error($e->getMessage(), 422);
}

@unlink(setup_token_path());

session_regenerate_id(true);
$_SESSION['beccan_admin_authenticated'] = true;
$_SESSION['beccan_admin_username'] = $record['username'];
$_SESSION['beccan_last_activity'] = time();
$_SESSION['csrf_token'] = bin2hex(random_bytes(32));

json_success([
    'authenticated' => true,
    'username' => $record['username'],
    'csrfToken' => $_SESSION['csrf_token'],
], 201);
