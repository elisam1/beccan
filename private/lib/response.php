<?php
declare(strict_types=1);

function json_success(mixed $data = null, int $status = 200, array $extra = []): never
{
    if (PHP_SAPI !== 'cli') {
        http_response_code($status);
    }
    $payload = array_merge([
        'ok' => true,
        'data' => $data,
    ], $extra);

    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    exit;
}

function json_error(string $message, int $status = 400, array $details = []): never
{
    if (PHP_SAPI !== 'cli') {
        http_response_code($status);
    }
    $payload = [
        'ok' => false,
        'error' => $message,
    ];
    if ($details !== []) {
        $payload['details'] = $details;
    }

    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    exit;
}

function require_http_method(string $expected): void
{
    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    if ($method !== strtoupper($expected)) {
        header('Allow: ' . strtoupper($expected));
        json_error('Method not allowed.', 405);
    }
}

function read_json_body(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return [];
    }
    try {
        $decoded = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
    } catch (JsonException) {
        json_error('Invalid JSON request payload.', 400);
    }
    if (!is_array($decoded)) {
        json_error('Request payload must be a JSON object.', 400);
    }
    return $decoded;
}
