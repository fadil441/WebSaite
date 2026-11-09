<?php
declare(strict_types=1);

/**
 * ============================================================
 * RESPONS JSON
 * ============================================================
 * Semua API mengembalikan bentuk:
 *   { "ok": true,  "data": ... }
 *   { "ok": false, "message": "...", "errors": { ... } }
 */

function json_response(array $payload, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function json_ok($data = null): void
{
    json_response([
        'ok'   => true,
        'data' => $data,
    ]);
}

/**
 * @param array<string, string> $errors Pesan error per nama field.
 */
function json_fail(string $message, int $status = 400, array $errors = []): void
{
    json_response([
        'ok'      => false,
        'message' => $message,
        'errors'  => $errors,
    ], $status);
}
