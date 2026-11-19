<?php
declare(strict_types=1);

const BECCAN_SESSION_NAME = 'BECCAN_ADMIN_SESSID';
const BECCAN_SESSION_IDLE_SECONDS = 7200; // 2 hours
const BECCAN_MAX_LOGIN_ATTEMPTS = 5;
const BECCAN_LOCKOUT_SECONDS = 900; // 15 minutes

function admin_config_path(): string
{
    return BECCAN_CONFIG_DIR . '/admin.json';
}

function setup_token_path(): string
{
    return BECCAN_CONFIG_DIR . '/setup-token.txt';
}

function is_admin_configured(): bool
{
    return is_file(admin_config_path());
}

function is_web_setup_enabled(): bool
{
    return !is_admin_configured() && is_file(setup_token_path()) && trim((string) @file_get_contents(setup_token_path())) !== '';
}

function is_https_request(): bool
{
    if (!empty($_SERVER['HTTPS']) && strtolower((string) $_SERVER['HTTPS']) !== 'off') {
        return true;
    }
    if (($_SERVER['SERVER_PORT'] ?? null) === '443') {
        return true;
    }
    if (strtolower((string) ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '')) === 'https') {
        return true;
    }
    return false;
}

function ensure_session_started(): void
{
    if (PHP_SAPI === 'cli') {
        return;
    }
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    ini_set('session.cookie_httponly', '1');

    session_name(BECCAN_SESSION_NAME);
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'domain' => '',
        'secure' => is_https_request(),
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();

    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
}

function get_csrf_token(): string
{
    ensure_session_started();
    if (empty($_SESSION['csrf_token']) || !is_string($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function verify_csrf_request(): void
{
    ensure_session_started();
    $headerToken = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    $postToken = $_POST['_csrf'] ?? '';
    $provided = is_string($headerToken) && $headerToken !== '' ? $headerToken : (is_string($postToken) ? $postToken : '');
    $expected = $_SESSION['csrf_token'] ?? '';

    if (!is_string($expected) || $expected === '' || $provided === '' || !hash_equals($expected, $provided)) {
        json_error('Security validation failed (invalid or missing CSRF token). Please refresh and try again.', 403);
    }
}

function is_admin_authenticated(): bool
{
    ensure_session_started();
    if (empty($_SESSION['beccan_admin_authenticated']) || $_SESSION['beccan_admin_authenticated'] !== true) {
        return false;
    }
    $lastSeen = (int) ($_SESSION['beccan_last_activity'] ?? 0);
    if ($lastSeen > 0 && (time() - $lastSeen) > BECCAN_SESSION_IDLE_SECONDS) {
        destroy_admin_session();
        return false;
    }
    $_SESSION['beccan_last_activity'] = time();
    return true;
}

function require_admin_auth(): array
{
    if (!is_admin_authenticated()) {
        json_error('Administrator authentication required.', 401);
    }
    return [
        'username' => (string) ($_SESSION['beccan_admin_username'] ?? 'administrator'),
    ];
}

function require_admin_write_auth(): array
{
    $admin = require_admin_auth();
    verify_csrf_request();
    return $admin;
}

function destroy_admin_session(): void
{
    if (PHP_SAPI === 'cli' || session_status() !== PHP_SESSION_ACTIVE) {
        return;
    }
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(
            session_name(),
            '',
            [
                'expires' => time() - 42000,
                'path' => $params['path'] ?? '/',
                'domain' => $params['domain'] ?? '',
                'secure' => (bool) ($params['secure'] ?? false),
                'httponly' => (bool) ($params['httponly'] ?? true),
                'samesite' => $params['samesite'] ?? 'Lax',
            ]
        );
    }
    session_destroy();
}

function read_admin_record(): ?array
{
    $path = admin_config_path();
    if (!is_file($path)) {
        return null;
    }
    $raw = file_get_contents($path);
    if ($raw === false || trim($raw) === '') {
        return null;
    }
    $decoded = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
    if (!is_array($decoded) || empty($decoded['username']) || empty($decoded['passwordHash'])) {
        return null;
    }
    return $decoded;
}

function save_admin_record(string $username, string $passwordPlaintext): array
{
    $usernameClean = trim($username);
    if (!preg_match('/^[a-zA-Z0-9._-]{3,40}$/', $usernameClean)) {
        throw new InvalidArgumentException('Username must be 3–40 characters (letters, numbers, dot, underscore, hyphen).');
    }
    validate_password_strength($passwordPlaintext);

    $existing = read_admin_record();
    $now = now_utc_iso();
    $record = [
        'username' => $usernameClean,
        'passwordHash' => password_hash($passwordPlaintext, PASSWORD_DEFAULT),
        'createdAt' => $existing['createdAt'] ?? $now,
        'updatedAt' => $now,
    ];
    atomic_write_json_file(admin_config_path(), $record);
    return $record;
}

function validate_password_strength(string $password): void
{
    if (strlen($password) < 10) {
        throw new InvalidArgumentException('Password must be at least 10 characters long.');
    }
    if (!preg_match('/[A-Z]/', $password) || !preg_match('/[a-z]/', $password) || !preg_match('/[0-9]/', $password)) {
        throw new InvalidArgumentException('Password must include at least one uppercase letter, one lowercase letter, and one number.');
    }
}

function client_rate_limit_path(): string
{
    $ip = (string) ($_SERVER['REMOTE_ADDR'] ?? 'cli');
    return BECCAN_RATE_LIMIT_DIR . '/' . hash('sha256', $ip) . '.json';
}

function check_login_rate_limit(): void
{
    $path = client_rate_limit_path();
    if (!is_file($path)) {
        return;
    }
    $raw = @file_get_contents($path);
    if ($raw === false || trim($raw) === '') {
        return;
    }
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        return;
    }
    $lockedUntil = (int) ($data['lockedUntil'] ?? 0);
    if ($lockedUntil > time()) {
        $retry = $lockedUntil - time();
        json_error(
            "Too many unsuccessful sign-in attempts. Please wait {$retry} seconds before trying again.",
            429,
            ['retryAfterSeconds' => $retry]
        );
    }
}

function record_failed_login_attempt(): void
{
    $path = client_rate_limit_path();
    $now = time();
    $data = ['attempts' => [], 'lockedUntil' => 0];
    if (is_file($path)) {
        $decoded = json_decode((string) @file_get_contents($path), true);
        if (is_array($decoded)) {
            $data = $decoded;
        }
    }

    $recent = array_values(array_filter(
        (array) ($data['attempts'] ?? []),
        static fn (mixed $ts): bool => is_int($ts) && ($now - $ts) <= BECCAN_LOCKOUT_SECONDS
    ));
    $recent[] = $now;

    $lockedUntil = count($recent) >= BECCAN_MAX_LOGIN_ATTEMPTS ? ($now + BECCAN_LOCKOUT_SECONDS) : 0;
    atomic_write_json_file($path, [
        'attempts' => $recent,
        'lockedUntil' => $lockedUntil,
    ]);
}

function clear_login_rate_limit(): void
{
    $path = client_rate_limit_path();
    if (is_file($path)) {
        @unlink($path);
    }
}

function attempt_admin_login(string $username, string $password): array
{
    check_login_rate_limit();

    $admin = read_admin_record();
    if ($admin === null) {
        json_error('Administrator account has not been configured yet.', 503, ['setupRequired' => true]);
    }

    $usernameMatches = hash_equals(strtolower((string) $admin['username']), strtolower(trim($username)));
    $passwordMatches = password_verify($password, (string) $admin['passwordHash']);

    if (!$usernameMatches || !$passwordMatches) {
        record_failed_login_attempt();
        json_error('Invalid username or password.', 401);
    }

    clear_login_rate_limit();
    ensure_session_started();
    session_regenerate_id(true);

    $_SESSION['beccan_admin_authenticated'] = true;
    $_SESSION['beccan_admin_username'] = $admin['username'];
    $_SESSION['beccan_last_activity'] = time();
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));

    if (password_needs_rehash((string) $admin['passwordHash'], PASSWORD_DEFAULT)) {
        save_admin_record((string) $admin['username'], $password);
    }

    return [
        'username' => $admin['username'],
        'csrfToken' => $_SESSION['csrf_token'],
    ];
}
