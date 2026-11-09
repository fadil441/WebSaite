<?php
declare(strict_types=1);

/**
 * ============================================================
 * API TIKET PENGADUAN
 * ============================================================
 * Endpoint:
 *   GET  api/tickets.php?action=list      -> daftar tiket sesuai peran
 *   POST api/tickets.php?action=create    -> user membuat tiket
 *   POST api/tickets.php?action=close     -> user/admin menutup tiket
 *   POST api/tickets.php?action=reopen    -> admin membuka kembali tiket
 *   POST api/tickets.php?action=reply     -> admin membalas tiket
 */

require __DIR__ . '/../includes/bootstrap.php';

$action = isset($_GET['action']) ? (string) $_GET['action'] : '';

/**
 * Ambil balasan untuk beberapa tiket sekaligus (menghindari query berulang).
 *
 * @param int[] $ticketIds
 * @return array<int, array<int, array<string, string>>>
 */
function replies_by_ticket(array $ticketIds): array
{
    if ($ticketIds === []) {
        return [];
    }

    $placeholders = implode(',', array_fill(0, count($ticketIds), '?'));

    $stmt = db()->prepare(
        "SELECT r.ticket_id, r.message, r.created_at, u.name AS admin_name
         FROM ticket_replies r
         JOIN users u ON u.id = r.admin_id
         WHERE r.ticket_id IN ($placeholders)
         ORDER BY r.created_at ASC"
    );
    $stmt->execute($ticketIds);

    $grouped = [];

    foreach ($stmt->fetchAll() as $row) {
        $grouped[(int) $row['ticket_id']][] = [
            'by'   => (string) $row['admin_name'],
            'role' => 'admin',
            'text' => (string) $row['message'],
            'at'   => iso_date($row['created_at']),
        ];
    }

    return $grouped;
}

/** Ubah baris database menjadi bentuk yang dipakai script.js. */
function ticket_payload(array $row, array $replies = []): array
{
    return [
        'id'        => (string) $row['ticket_code'],
        'userId'    => (int) $row['user_id'],
        'userName'  => (string) ($row['user_name'] ?? ''),
        'userEmail' => (string) ($row['user_email'] ?? ''),
        'category'  => (string) $row['category'],
        'subject'   => (string) $row['subject'],
        'message'   => (string) $row['message'],
        'status'    => (string) $row['status'],
        'createdAt' => iso_date($row['created_at']),
        'replies'   => $replies,
    ];
}

/** Cari satu tiket berdasarkan nomor tiket. */
function find_ticket(string $code): ?array
{
    $stmt = db()->prepare('SELECT * FROM tickets WHERE ticket_code = ? LIMIT 1');
    $stmt->execute([$code]);
    $ticket = $stmt->fetch();

    return $ticket ?: null;
}

try {
    switch ($action) {
        case 'list':
            $user = require_login();

            if ($user['role'] === 'admin') {
                $stmt = db()->query(
                    'SELECT t.*, u.name AS user_name, u.email AS user_email
                     FROM tickets t
                     JOIN users u ON u.id = t.user_id
                     ORDER BY t.created_at DESC'
                );
            } else {
                $stmt = db()->prepare(
                    'SELECT t.*, u.name AS user_name, u.email AS user_email
                     FROM tickets t
                     JOIN users u ON u.id = t.user_id
                     WHERE t.user_id = ?
                     ORDER BY t.created_at DESC'
                );
                $stmt->execute([$user['id']]);
            }

            $rows       = $stmt->fetchAll();
            $numericIds = array_map(static fn (array $row): int => (int) $row['id'], $rows);
            $replies    = replies_by_ticket($numericIds);

            $tickets = array_map(
                static fn (array $row): array => ticket_payload(
                    $row,
                    $replies[(int) $row['id']] ?? []
                ),
                $rows
            );

            json_ok(['tickets' => $tickets]);
            break;

        case 'create':
            $user = require_login();

            if ($user['role'] !== 'user') {
                json_fail('Hanya user yang dapat mengirim pengaduan.', 403);
            }

            $input    = json_input();
            $category = clean_string($input['category'] ?? '');
            $subject  = clean_string($input['subject'] ?? '');
            $message  = clean_string($input['message'] ?? '');

            $allowedCategories = [
                'Ujaran kebencian',
                'Perundungan siber',
                'Hoaks & fitnah',
                'Privasi & data pribadi',
                'Hak cipta konten',
                'Spam & penipuan',
                'Keamanan akun',
                'Lainnya',
            ];

            $errors = [];
            if (!in_array($category, $allowedCategories, true)) {
                $errors['category'] = 'Pilih salah satu kategori.';
            }
            if (text_length($subject) < 5) {
                $errors['subject'] = 'Subjek minimal 5 karakter.';
            } elseif (text_length($subject) > 150) {
                $errors['subject'] = 'Subjek maksimal 150 karakter.';
            }
            if (text_length($message) < 30) {
                $errors['message'] = 'Ceritakan kronologi minimal 30 karakter.';
            }
            if ($errors !== []) {
                json_fail('Periksa kembali laporanmu.', 422, $errors);
            }

            $pdo  = db();
            $code = generate_ticket_code($pdo);

            $stmt = $pdo->prepare(
                "INSERT INTO tickets (ticket_code, user_id, category, subject, message, status)
                 VALUES (?, ?, ?, ?, ?, 'open')"
            );
            $stmt->execute([$code, $user['id'], $category, $subject, $message]);

            json_ok([
                'ticket' => [
                    'id'        => $code,
                    'userId'    => (int) $user['id'],
                    'userName'  => (string) $user['name'],
                    'userEmail' => (string) $user['email'],
                    'category'  => $category,
                    'subject'   => $subject,
                    'message'   => $message,
                    'status'    => 'open',
                    'createdAt' => date('c'),
                    'replies'   => [],
                ],
            ]);
            break;

        case 'close':
            $user   = require_login();
            $input  = json_input();
            $code   = clean_string($input['id'] ?? '');
            $ticket = $code !== '' ? find_ticket($code) : null;

            if ($ticket === null) {
                json_fail('Tiket tidak ditemukan.', 404);
            }
            if ($user['role'] !== 'admin' && (int) $ticket['user_id'] !== (int) $user['id']) {
                json_fail('Kamu tidak berhak menutup tiket ini.', 403);
            }

            db()->prepare("UPDATE tickets SET status = 'closed', closed_at = NOW() WHERE id = ?")
                ->execute([$ticket['id']]);

            json_ok(['id' => $code, 'status' => 'closed']);
            break;

        case 'reopen':
            require_admin();

            $input  = json_input();
            $code   = clean_string($input['id'] ?? '');
            $ticket = $code !== '' ? find_ticket($code) : null;

            if ($ticket === null) {
                json_fail('Tiket tidak ditemukan.', 404);
            }

            db()->prepare("UPDATE tickets SET status = 'open', closed_at = NULL WHERE id = ?")
                ->execute([$ticket['id']]);

            json_ok(['id' => $code, 'status' => 'open']);
            break;

        case 'reply':
            $admin  = require_admin();
            $input  = json_input();
            $code   = clean_string($input['id'] ?? '');
            $message = clean_string($input['message'] ?? '');
            $ticket = $code !== '' ? find_ticket($code) : null;

            if ($ticket === null) {
                json_fail('Tiket tidak ditemukan.', 404);
            }
            if (text_length($message) < 10) {
                json_fail('Balasan terlalu singkat.', 422, [
                    'message' => 'Tulis minimal 10 karakter agar jelas.',
                ]);
            }

            $pdo = db();
            $pdo->beginTransaction();

            try {
                $pdo->prepare(
                    'INSERT INTO ticket_replies (ticket_id, admin_id, message) VALUES (?, ?, ?)'
                )->execute([$ticket['id'], $admin['id'], $message]);

                if ($ticket['status'] !== 'closed') {
                    $pdo->prepare("UPDATE tickets SET status = 'answered' WHERE id = ?")
                        ->execute([$ticket['id']]);
                }

                $pdo->commit();
            } catch (Throwable $error) {
                $pdo->rollBack();
                throw $error;
            }

            json_ok([
                'id'     => $code,
                'status' => $ticket['status'] === 'closed' ? 'closed' : 'answered',
            ]);
            break;

        default:
            json_fail('Aksi tidak dikenal.', 404);
    }
} catch (Throwable $error) {
    error_log('[EtikaSosial][tickets] ' . $error->getMessage());
    json_fail('Terjadi kesalahan pada server. Periksa koneksi database.', 500);
}
