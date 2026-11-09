<?php
declare(strict_types=1);

/**
 * ============================================================
 * API AUTENTIKASI
 * ============================================================
 * Endpoint:
 *   GET  api/auth.php?action=me       -> cek sesi aktif
 *   POST api/auth.php?action=login    -> masuk
 *   POST api/auth.php?action=register -> daftar user baru
 *   POST api/auth.php?action=logout   -> keluar
 */

require __DIR__ . '/../includes/bootstrap.php';

$action = isset($_GET['action']) ? (string) $_GET['action'] : '';

try {
    switch ($action) {
        case 'me':
            json_ok(['user' => current_user()]);
            break;

        case 'login':
            $input      = json_input();
            $identifier = clean_string($input['identifier'] ?? '');
            $password   = (string) ($input['password'] ?? '');

            $errors = [];
            if ($identifier === '') {
                $errors['identifier'] = 'Surel atau nama pengguna wajib diisi.';
            }
            if (strlen($password) < 6) {
                $errors['password'] = 'Kata sandi minimal 6 karakter.';
            }
            if ($errors !== []) {
                json_fail('Periksa kembali data masukmu.', 422, $errors);
            }

            $stmt = db()->prepare(
                'SELECT id, name, email, password_hash, role, is_active
                 FROM users
                 WHERE email = :email OR username = :username
                 LIMIT 1'
            );
            $stmt->execute([
                ':email'    => $identifier,
                ':username' => $identifier,
            ]);
            $user = $stmt->fetch();

            if (
                !$user
                || (int) $user['is_active'] !== 1
                || !password_verify($password, (string) $user['password_hash'])
            ) {
                json_fail('Akun tidak ditemukan atau kata sandi salah.', 401, [
                    'identifier' => 'Periksa kembali surel dan kata sandi.',
                ]);
            }

            /* Perbarui hash jika algoritma PHP berubah di masa depan. */
            if (password_needs_rehash((string) $user['password_hash'], PASSWORD_DEFAULT)) {
                db()->prepare('UPDATE users SET password_hash = ? WHERE id = ?')
                    ->execute([password_hash($password, PASSWORD_DEFAULT), $user['id']]);
            }

            login_user($user);

            db()->prepare('UPDATE users SET last_login_at = NOW() WHERE id = ?')
                ->execute([$user['id']]);

            json_ok([
                'user' => [
                    'id'    => (int) $user['id'],
                    'name'  => (string) $user['name'],
                    'email' => (string) $user['email'],
                    'role'  => (string) $user['role'],
                ],
            ]);
            break;

        case 'register':
            $input    = json_input();
            $name     = clean_string($input['name'] ?? '');
            $email    = strtolower(clean_string($input['email'] ?? ''));
            $password = (string) ($input['password'] ?? '');
            $consent  = !empty($input['consent']);

            $errors = [];
            if (text_length($name) < 2) {
                $errors['name'] = 'Nama minimal 2 karakter.';
            }
            if (!valid_email($email)) {
                $errors['email'] = 'Format surel belum benar.';
            }
            if (strlen($password) < 6) {
                $errors['password'] = 'Kata sandi minimal 6 karakter.';
            }
            if (!$consent) {
                $errors['consent'] = 'Kamu perlu menyetujui aturan komunitas.';
            }
            if ($errors !== []) {
                json_fail('Periksa kembali data pendaftaran.', 422, $errors);
            }

            $stmt = db()->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
            $stmt->execute([$email]);
            if ($stmt->fetch()) {
                json_fail('Surel ini sudah terdaftar. Silakan masuk.', 409, [
                    'email' => 'Surel ini sudah terdaftar. Silakan masuk.',
                ]);
            }

            $stmt = db()->prepare(
                "INSERT INTO users (name, email, password_hash, role, is_active)
                 VALUES (?, ?, ?, 'user', 1)"
            );
            $stmt->execute([$name, $email, password_hash($password, PASSWORD_DEFAULT)]);

            $newUser = [
                'id'    => (int) db()->lastInsertId(),
                'name'  => $name,
                'email' => $email,
                'role'  => 'user',
            ];

            login_user($newUser);

            json_ok(['user' => $newUser]);
            break;

        case 'logout':
            $_SESSION = [];

            if (ini_get('session.use_cookies')) {
                $params = session_get_cookie_params();
                setcookie(
                    session_name(),
                    '',
                    time() - 42000,
                    $params['path'],
                    $params['domain'],
                    $params['secure'],
                    $params['httponly']
                );
            }

            session_destroy();
            json_ok(['user' => null]);
            break;

        default:
            json_fail('Aksi tidak dikenal.', 404);
    }
} catch (Throwable $error) {
    error_log('[EtikaSosial][auth] ' . $error->getMessage());
    json_fail('Terjadi kesalahan pada server. Periksa koneksi database.', 500);
}
