<?php
declare(strict_types=1);

/**
 * ============================================================
 * SESI & HAK AKSES
 * ============================================================
 */

/** Data pengguna yang sedang masuk, atau null. */
function current_user(): ?array
{
    return isset($_SESSION['user']) && is_array($_SESSION['user'])
        ? $_SESSION['user']
        : null;
}

/** Hentikan permintaan jika pengguna belum masuk. */
function require_login(): array
{
    $user = current_user();

    if ($user === null) {
        json_fail('Sesi berakhir. Silakan masuk kembali.', 401);
    }

    return $user;
}

/** Hentikan permintaan jika pengguna bukan admin. */
function require_admin(): array
{
    $user = require_login();

    if (($user['role'] ?? '') !== 'admin') {
        json_fail('Akses ditolak. Halaman ini hanya untuk admin (customer service).', 403);
    }

    return $user;
}

/** Simpan data pengguna ke sesi setelah login berhasil. */
function login_user(array $user): void
{
    session_regenerate_id(true);

    $_SESSION['user'] = [
        'id'    => (int) $user['id'],
        'name'  => (string) $user['name'],
        'email' => (string) $user['email'],
        'role'  => (string) $user['role'],
    ];
}
