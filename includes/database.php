<?php
declare(strict_types=1);

/**
 * ============================================================
 * KONEKSI DATABASE (PDO)
 * ============================================================
 * db() memakai koneksi tunggal (singleton) agar tidak membuka
 * koneksi baru setiap kali dipanggil.
 */
function db(): PDO
{
    static $pdo = null;

    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $config = require __DIR__ . '/../config/database.php';

    $dsn = sprintf(
        'mysql:host=%s;port=%s;dbname=%s;charset=%s',
        $config['host'],
        $config['port'],
        $config['name'],
        $config['charset']
    );

    try {
        $pdo = new PDO($dsn, $config['user'], $config['pass'], [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
    } catch (PDOException $error) {
        error_log('[EtikaSosial][database] ' . $error->getMessage());
        json_fail(
            'Database belum terhubung. Periksa config/database.php dan pastikan database sudah diimpor.',
            500
        );
    }

    return $pdo;
}
