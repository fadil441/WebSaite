<?php
declare(strict_types=1);

/**
 * ============================================================
 * VALIDASI & INPUT
 * ============================================================
 */

/** Membaca body JSON dari permintaan fetch(). */
function json_input(): array
{
    $raw = file_get_contents('php://input');

    if ($raw === false || $raw === '') {
        return [];
    }

    $data = json_decode($raw, true);

    return is_array($data) ? $data : [];
}

/** Membersihkan spasi di awal/akhir dan memastikan nilai berupa string. */
function clean_string($value): string
{
    return trim((string) $value);
}

function valid_email(string $email): bool
{
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

/** Panjang teks yang aman untuk karakter UTF-8. */
function text_length(string $value): int
{
    return function_exists('mb_strlen') ? mb_strlen($value) : strlen($value);
}
