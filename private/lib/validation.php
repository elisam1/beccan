<?php
declare(strict_types=1);

function utf8_len(string $value): int
{
    if (function_exists('mb_strlen')) {
        return mb_strlen($value, 'UTF-8');
    }
    $count = preg_match_all('/./us', $value);
    return $count === false ? strlen($value) : $count;
}

function utf8_sub(string $value, int $start, int $length): string
{
    if (function_exists('mb_substr')) {
        return mb_substr($value, $start, $length, 'UTF-8');
    }
    $chars = preg_split('//u', $value, -1, PREG_SPLIT_NO_EMPTY);
    if ($chars === false) {
        return substr($value, $start, $length);
    }
    return implode('', array_slice($chars, $start, $length));
}

function utf8_lower(string $value): string
{
    if (function_exists('mb_strtolower')) {
        return mb_strtolower($value, 'UTF-8');
    }
    return strtolower($value);
}

function sanitize_plain_text(mixed $value, int $maxLength = 500): string
{
    if (!is_string($value)) {
        return '';
    }
    $cleaned = str_replace("\0", '', $value);
    $cleaned = strip_tags($cleaned);
    $cleaned = preg_replace('/\r\n|\r/', "\n", $cleaned) ?? $cleaned;
    $cleaned = trim($cleaned);
    if (utf8_len($cleaned) > $maxLength) {
        $cleaned = utf8_sub($cleaned, 0, $maxLength);
    }
    return $cleaned;
}

function sanitize_article_body(mixed $value, int $maxLength = 30000): string
{
    if (!is_string($value)) {
        return '';
    }
    $cleaned = str_replace("\0", '', $value);
    // Remove all executable HTML/script tags while preserving plain paragraph structure
    $cleaned = strip_tags($cleaned);
    $cleaned = preg_replace('/\r\n|\r/', "\n", $cleaned) ?? $cleaned;
    $cleaned = preg_replace("/\n{3,}/", "\n\n", $cleaned) ?? $cleaned;
    $cleaned = trim($cleaned);
    if (utf8_len($cleaned) > $maxLength) {
        $cleaned = utf8_sub($cleaned, 0, $maxLength);
    }
    return $cleaned;
}

function normalize_utc_date_only(?string $value): ?string
{
    if ($value === null || trim($value) === '') {
        return null;
    }
    $trimmed = trim($value);
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $trimmed)) {
        return null;
    }
    [$year, $month, $day] = array_map('intval', explode('-', $trimmed));
    if (!checkdate($month, $day, $year)) {
        return null;
    }
    return $trimmed;
}

function normalize_time_hhmm(?string $value): ?string
{
    if ($value === null || trim($value) === '') {
        return null;
    }
    $trimmed = trim($value);
    if (!preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', $trimmed)) {
        return null;
    }
    return $trimmed;
}

function normalize_utc_datetime(?string $value): ?string
{
    if ($value === null || trim($value) === '') {
        return null;
    }
    try {
        $dt = new DateTimeImmutable(trim($value), new DateTimeZone('UTC'));
        return $dt->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d\TH:i:s\Z');
    } catch (Exception) {
        return null;
    }
}

function now_utc_iso(): string
{
    return (new DateTimeImmutable('now', new DateTimeZone('UTC')))->format('Y-m-d\TH:i:s\Z');
}

function generate_unique_id(string $prefix = 'item'): string
{
    return $prefix . '_' . bin2hex(random_bytes(8));
}

function generate_slug(string $title): string
{
    $slug = utf8_lower($title);
    $slug = preg_replace('/[^a-z0-9]+/i', '-', $slug) ?? '';
    $slug = trim($slug, '-');
    if ($slug === '') {
        $slug = 'item-' . bin2hex(random_bytes(4));
    }
    return substr($slug, 0, 80);
}

function ensure_unique_slug(string $baseSlug, array $existingRecords, ?string $ignoreId = null): string
{
    $candidate = $baseSlug;
    $suffix = 2;
    while (true) {
        $collision = false;
        foreach ($existingRecords as $record) {
            if (($record['id'] ?? null) === $ignoreId) {
                continue;
            }
            if (($record['slug'] ?? null) === $candidate) {
                $collision = true;
                break;
            }
        }
        if (!$collision) {
            return $candidate;
        }
        $candidate = $baseSlug . '-' . $suffix;
        $suffix++;
    }
}

function validate_enum(string $value, array $allowed, string $fieldLabel): string
{
    if (!in_array($value, $allowed, true)) {
        json_error("Invalid {$fieldLabel}.", 422);
    }
    return $value;
}
