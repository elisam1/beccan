<?php
declare(strict_types=1);

$candidates = [
    dirname(__DIR__, 2) . '/private/config/bootstrap.php',
    dirname(__DIR__, 3) . '/private/config/bootstrap.php',
];

$loaded = false;
foreach ($candidates as $candidate) {
    if (is_file($candidate)) {
        require_once $candidate;
        $loaded = true;
        break;
    }
}

if (!$loaded) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'ok' => false,
        'error' => 'Server configuration directory could not be located.',
    ]);
    exit;
}
