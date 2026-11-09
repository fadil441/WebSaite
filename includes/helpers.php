<?php
declare(strict_types=1);

/**
 * ============================================================
 * FUNGSI BANTU
 * ============================================================
 */

/** Ubah DATETIME MySQL menjadi format ISO 8601 untuk JavaScript. */
function iso_date(?string $mysqlDate): string
{
    if ($mysqlDate === null || $mysqlDate === '') {
        return date('c');
    }

    $timestamp = strtotime($mysqlDate);

    return $timestamp === false ? date('c') : date('c', $timestamp);
}

/** Buat nomor tiket unik, contoh: TKT-9F3A1C. */
function generate_ticket_code(PDO $pdo): string
{
    do {
        $code = 'TKT-' . strtoupper(bin2hex(random_bytes(3)));

        $stmt = $pdo->prepare('SELECT 1 FROM tickets WHERE ticket_code = ? LIMIT 1');
        $stmt->execute([$code]);
    } while ($stmt->fetchColumn() !== false);

    return $code;
}
