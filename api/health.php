<?php
declare(strict_types=1);

/**
 * ============================================================
 * PEMERIKSAAN KONEKSI
 * ============================================================
 * Buka di peramban: http://localhost/WebSaite/api/health.php
 * Jika berhasil, akan tampil daftar tabel database.
 */

require __DIR__ . '/../includes/bootstrap.php';

try {
    $tables = db()->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);

    json_ok([
        'php'      => PHP_VERSION,
        'database' => true,
        'tables'   => $tables,
        'session'  => current_user() !== null,
    ]);
} catch (Throwable $error) {
    error_log('[EtikaSosial][health] ' . $error->getMessage());
    json_fail('Database belum terhubung. Periksa config/database.php dan impor database.sql.', 500);
}
