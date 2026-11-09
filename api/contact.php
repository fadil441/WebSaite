<?php
declare(strict_types=1);

/**
 * ============================================================
 * API PESAN KONTAK
 * ============================================================
 * POST api/contact.php
 * Body: { name, email, subject, message, consent }
 */

require __DIR__ . '/../includes/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    json_fail('Metode tidak diizinkan. Gunakan POST.', 405);
}

try {
    $input   = json_input();
    $name    = clean_string($input['name'] ?? '');
    $email   = strtolower(clean_string($input['email'] ?? ''));
    $subject = clean_string($input['subject'] ?? '');
    $message = clean_string($input['message'] ?? '');
    $consent = !empty($input['consent']);

    $errors = [];
    if (text_length($name) < 2) {
        $errors['name'] = 'Nama minimal 2 karakter.';
    }
    if (!valid_email($email)) {
        $errors['email'] = 'Format surel belum benar.';
    }
    if (text_length($subject) < 3) {
        $errors['subject'] = 'Subjek minimal 3 karakter.';
    }
    if (text_length($message) < 20) {
        $errors['message'] = 'Pesan minimal 20 karakter.';
    }
    if (!$consent) {
        $errors['consent'] = 'Centang persetujuan sebelum mengirim.';
    }
    if ($errors !== []) {
        json_fail('Periksa kembali pesanmu.', 422, $errors);
    }

    $stmt = db()->prepare(
        "INSERT INTO contact_messages (name, email, subject, message, consent, status)
         VALUES (?, ?, ?, ?, 1, 'new')"
    );
    $stmt->execute([$name, $email, $subject, $message]);

    json_ok(['id' => (int) db()->lastInsertId()]);
} catch (Throwable $error) {
    error_log('[EtikaSosial][contact] ' . $error->getMessage());
    json_fail('Terjadi kesalahan pada server. Periksa koneksi database.', 500);
}
