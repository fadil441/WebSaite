# EtikaSosial — Panduan Backend PHP & Database

Situs ini terdiri dari **tampilan statis** (`index.html`, `style.css`, `script.js`) dan **backend PHP** yang terpisah di folder `config/`, `includes/`, dan `api/`.

Dengan struktur ini, tampilan dan logika server dipisah sehingga mudah diedit:

- Mengubah warna, layout, atau teks → `style.css` dan `index.html`
- Mengubah alur tampilan/validasi di browser → `script.js`
- Mengubah koneksi database → `config/database.php`
- Mengubah aturan login, tiket, atau kontak → `api/*.php`
- Mengubah fungsi bantuan → `includes/*.php`

---

## 1. Yang dibutuhkan

- **XAMPP** (disarankan) atau Laragon/WAMP
- PHP **8.0+**
- MySQL / MariaDB
- Peramban modern

---

## 2. Cara memasang di XAMPP

1. Salin seluruh folder situs ini ke:
   ```
   C:\xampp\htdocs\WebSaite
   ```
2. Buka **XAMPP Control Panel**, lalu klik **Start** pada **Apache** dan **MySQL**.
3. Buka `http://localhost/phpmyadmin`.
4. Buat database baru bernama **`etikasosial`**
   (collation: `utf8mb4_unicode_ci`).
5. Klik database tersebut → tab **Import** → pilih file **`database.sql`** → **Go**.
6. Periksa `config/database.php`. Untuk XAMPP bawaan biasanya sudah benar:
   ```php
   'host' => '127.0.0.1',
   'port' => '3306',
   'name' => 'etikasosial',
   'user' => 'root',
   'pass' => '',
   ```
   Jika MySQL Anda memakai kata sandi, isi bagian `'pass'`.
7. Buka situs:
   ```
   http://localhost/WebSaite/
   ```
8. Uji koneksi database:
   ```
   http://localhost/WebSaite/api/health.php
   ```
   Jika berhasil, akan tampil daftar tabel: `users`, `tickets`, `ticket_replies`, dan seterusnya.

### Menjalankan tanpa memindah folder

Jika tidak ingin menyalin folder ke `htdocs`, jalankan server PHP langsung dari folder proyek:

```powershell
C:\xampp\php\php.exe -S 127.0.0.1:8000 -t "E:\A Storage and Beckup\WebSaite"
```

Lalu buka `http://127.0.0.1:8000/`. Cara ini cocok untuk demonstrasi tugas di komputer sendiri.

---

## 3. Akun admin awal

Dari data awal di `database.sql`:

| Kolom | Nilai |
|---|---|
| Username | `admin` |
| Email | `admin@etikasosial.id` |
| Kata sandi | `admin123` |
| Nama tampilan | Fadil |

> **Penting:** segera ganti kata sandi admin setelah situs dipublikasikan.
> Kata sandi disimpan sebagai hash bcrypt, bukan teks biasa.

Cara mengganti kata sandi:

1. Buat hash baru dengan PHP:
   ```php
   <?php echo password_hash('sandi-baru-anda', PASSWORD_DEFAULT);
   ```
   (jalankan sekali, lalu hapus file tersebut)
2. Buka phpMyAdmin → tabel `users` → edit baris admin → tempel hash baru pada kolom `password_hash`.

---

## 4. Struktur folder

```
WebSaite/
├── index.html            # Tampilan utama (SPA)
├── style.css             # Seluruh gaya tampilan
├── script.js             # Logika tampilan + pemanggilan API
├── database.sql          # Skema + data awal database
├── README-PHP.md         # Panduan ini
├── assets/
│   └── fadil.jpg
├── config/
│   ├── app.php           # Nama aplikasi, zona waktu, sesi
│   ├── database.php      # Host, user, password, nama database
│   └── .htaccess         # Menolak akses langsung
├── includes/
│   ├── bootstrap.php     # Dimuat semua endpoint API
│   ├── response.php      # Format respons JSON
│   ├── database.php      # Koneksi PDO
│   ├── validation.php    # Pembacaan input & validasi
│   ├── auth.php          # Sesi & hak akses
│   ├── helpers.php       # Tanggal & nomor tiket
│   └── .htaccess         # Menolak akses langsung
└── api/
    ├── auth.php          # me / login / register / logout
    ├── tickets.php       # list / create / close / reopen / reply
    ├── contact.php       # kirim pesan kontak
    └── health.php        # cek koneksi database
```

---

## 5. Alur kerja

### Login dan daftar
- `script.js` mengirim data ke `api/auth.php?action=login` atau `?action=register`.
- PHP memeriksa database, membuat sesi, dan mengirim data user kembali.
- Sesi disimpan sebagai cookie `HttpOnly` + `SameSite=Lax`.

### Tiket pengaduan
- User membuat tiket → `POST api/tickets.php?action=create`.
- User melihat tiketnya sendiri → `GET api/tickets.php?action=list`.
- Admin melihat semua tiket, membalas, menutup, atau membuka kembali.
- Balasan admin disimpan di tabel `ticket_replies`, bukan di dalam tabel tiket.

### Kontak
- Formulir kontak → `POST api/contact.php`.
- Pesan masuk ke tabel `contact_messages`.

### Mode cadangan tanpa PHP
Jika situs dibuka langsung lewat `file://` atau server statis biasa (misalnya `python -m http.server`), `script.js` otomatis memakai `localStorage` seperti versi sebelumnya.

Mode ini hanya untuk pratinjau. Untuk tugas yang memakai database, jalankan melalui **Apache + PHP** seperti langkah di atas.

---

## 6. Hal yang perlu diperhatikan

- **Jangan bagikan folder `config/`** ke publik. File `.htaccess` sudah menolaknya di Apache.
- `config/app.php` memiliki `'debug' => false`. Biarkan false saat presentasi.
- Ganti kata sandi admin sebelum menyerahkan tugas.
- Untuk produksi, gunakan HTTPS agar cookie sesi terkirim dengan aman.
- Folder `api/` hanya menerima permintaan dari halaman yang sama (same-origin), sehingga tidak perlu pengaturan CORS.

---

## 7. Jika ada masalah

| Gejala | Penyebab umum | Solusi |
|---|---|---|
| Halaman tampil tetapi data tidak tersimpan | Dibuka lewat `file://` atau server statis | Jalankan lewat `http://localhost/WebSaite/` dengan Apache |
| `api/health.php` menampilkan error database | Nama database/user/password salah | Sesuaikan `config/database.php` |
| Muncul pesan "Database belum terhubung" | `database.sql` belum diimpor | Impor lewat phpMyAdmin |
| Login admin gagal | Data awal belum masuk | Pastikan tabel `users` berisi baris `admin` |
| Perubahan PHP tidak terlihat | Cache peramban | Tekan `Ctrl + F5` |
| Error 500 saat membuka API | PHP error | Periksa `C:\xampp\apache\logs\error.log` |
