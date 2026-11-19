<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/_bootstrap.php';

require_http_method('POST');
ensure_session_started();

if (is_admin_authenticated()) {
    verify_csrf_request();
}

destroy_admin_session();

json_success([
    'authenticated' => false,
]);
