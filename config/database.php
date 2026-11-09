<?php
declare(strict_types=1);

/**
 * ============================================================
 * KONFIGURASI DATABASE
 * ============================================================
 * Ubah nilai di bawah ini sesuai pengaturan MySQL/MariaDB Anda.
 *
 * XAMPP bawaan biasanya:
 *   host : 127.0.0.1
 *   port : 3306
 *   user : root
 *   pass : (kosong)
 *
 * Nama database harus sama dengan yang Anda buat di phpMyAdmin.
 */
return [
    'host'    => getenv('DB_HOST') ?: '127.0.0.1',
    'port'    => getenv('DB_PORT') ?: '3306',
    'name'    => getenv('DB_NAME') ?: 'etikasosial',
    'user'    => getenv('DB_USER') ?: 'root',
    'pass'    => getenv('DB_PASS') ?: '',
    'charset' => 'utf8mb4',
];
