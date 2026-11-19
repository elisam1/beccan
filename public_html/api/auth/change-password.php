<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/_bootstrap.php';

require_http_method('POST');
$admin = require_admin_write_auth();

$body = read_json_body();
$currentPassword = (string) ($body['currentPassword'] ?? '');
$newPassword = (string) ($body['newPassword'] ?? '');
$confirmPassword = (string) ($body['confirmPassword'] ?? '');

if ($currentPassword === '' || $newPassword === '' || $confirmPassword === '') {
    json_error('All password fields are required.', 422);
}

if ($newPassword !== $confirmPassword) {
    json_error('New password and confirmation do not match.', 422);
}

$record = read_admin_record();
if ($record === null || !password_verify($currentPassword, (string) $record['passwordHash'])) {
    json_error('Current password is incorrect.', 401);
}

if (password_verify($newPassword, (string) $record['passwordHash'])) {
    json_error('New password must differ from your current password.', 422);
}

try {
    save_admin_record((string) $admin['username'], $newPassword);
} catch (InvalidArgumentException $e) {
    json_error($e->getMessage(), 422);
}

session_regenerate_id(true);
$_SESSION['csrf_token'] = bin2hex(random_bytes(32));

json_success([
    'message' => 'Password updated successfully.',
    'csrfToken' => $_SESSION['csrf_token'],
]);
