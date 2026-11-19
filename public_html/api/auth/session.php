<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/_bootstrap.php';

require_http_method('GET');
ensure_session_started();

$authenticated = is_admin_authenticated();

json_success([
    'authenticated' => $authenticated,
    'username' => $authenticated ? (string) ($_SESSION['beccan_admin_username'] ?? '') : null,
    'csrfToken' => get_csrf_token(),
    'setupRequired' => !is_admin_configured(),
    'webSetupEnabled' => is_web_setup_enabled(),
]);
