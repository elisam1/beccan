<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/_bootstrap.php';

require_http_method('POST');
require_admin_write_auth();

$body = read_json_body();
$id = sanitize_plain_text($body['id'] ?? '', 60);
$status = sanitize_plain_text($body['status'] ?? '', 20);

if ($id === '' || $status === '') {
    json_error('Article ID and status are required.', 422);
}

validate_enum($status, ['draft', 'published', 'archived'], 'publication status');

$updated = mutate_json_collection('news', static function (array $current) use ($id, $status): array {
    $foundIndex = null;
    foreach ($current as $idx => $item) {
        if (($item['id'] ?? '') === $id) {
            $foundIndex = $idx;
            break;
        }
    }
    if ($foundIndex === null) {
        json_error('Article not found.', 404);
    }

    $article = $current[$foundIndex];
    $article['status'] = $status;
    if ($status === 'published' && empty($article['publishedAt'])) {
        $article['publishedAt'] = now_utc_iso();
    }
    $article['updatedAt'] = now_utc_iso();
    $current[$foundIndex] = $article;

    return [
        'records' => $current,
        'return' => $article,
    ];
});

json_success([
    'article' => $updated,
]);
