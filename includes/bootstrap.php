<?php
declare(strict_types=1);

/**
 * ============================================================
 * BOOTSTRAP
 * ============================================================
 * Dimuat oleh semua file di folder api/.
 * Mengatur zona waktu, sesi, header keamanan, dan pustaka.
 */

$app = require __DIR__ . '/../config/app.php';

date_default_timezone_set($app['timezone']);

/* Jangan tampilkan error ke respons JSON; cukup catat ke log. */
ini_set('display_errors', '0');
ini_set('log_errors', '1');

header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('Referrer-Policy: same-origin');

if (session_status() !== PHP_SESSION_ACTIVE) {
    $secure = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';

    session_name($app['session_name']);
    session_set_cookie_params([
        'lifetime' => 0,
        'path'     => '/',
        'secure'   => $secure,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
}

require_once __DIR__ . '/response.php';
require_once __DIR__ . '/database.php';
require_once __DIR__ . '/validation.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/helpers.php';
