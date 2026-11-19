<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit('CLI access only.');
}

require_once dirname(__DIR__) . '/config/bootstrap.php';

if (is_admin_configured()) {
    fwrite(STDERR, "Administrator account is already configured at private/config/admin.json.\n");
    fwrite(STDERR, "To change the password, sign in to /admin and use Account Settings.\n");
    exit(1);
}

$username = $argv[1] ?? '';
$password = $argv[2] ?? '';

if ($username === '') {
    fwrite(STDOUT, "Enter initial administrator username (3-40 chars): ");
    $username = trim((string) fgets(STDIN));
}

if ($password === '') {
    fwrite(STDOUT, "Enter initial administrator password (min 10 chars, upper+lower+digit): ");
    if (function_exists('system')) {
        @system('stty -echo');
        $password = trim((string) fgets(STDIN));
        @system('stty echo');
        fwrite(STDOUT, PHP_EOL);
    } else {
        $password = trim((string) fgets(STDIN));
    }
}

try {
    $record = save_admin_record($username, $password);
    if (is_file(setup_token_path())) {
        @unlink(setup_token_path());
    }
    fwrite(STDOUT, "Administrator '{$record['username']}' configured successfully.\n");
    fwrite(STDOUT, "Password stored securely with PHP password_hash() in private/config/admin.json.\n");
} catch (Throwable $e) {
    fwrite(STDERR, 'Setup failed: ' . $e->getMessage() . PHP_EOL);
    exit(1);
}
