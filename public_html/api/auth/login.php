<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/_bootstrap.php';

require_http_method('POST');
ensure_session_started();

$body = read_json_body();
$username = (string) ($body['username'] ?? '');
$password = (string) ($body['password'] ?? '');

if (trim($username) === '' || $password === '') {
    json_error('Username and password are required.', 422);
}

$result = attempt_admin_login($username, $password);

json_success([
    'authenticated' => true,
    'username' => $result['username'],
    'csrfToken' => $result['csrfToken'],
]);
