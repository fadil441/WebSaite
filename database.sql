-- ============================================================
-- EtikaSosial — Skema Database MySQL / MariaDB
-- Dibuat untuk diimpor melalui phpMyAdmin.
--
-- Catatan:
--   Skema ini dipakai oleh backend PHP di folder api/.
--   Tampilan tetap memakai index.html + script.js, sedangkan
--   penyimpanan data dilakukan oleh PHP ke MySQL.
--
-- Cara impor di phpMyAdmin:
--   1. Buat/pilih database tujuan (mis. etikasosial).
--   2. Masuk tab "Import".
--   3. Pilih file database.sql ini, lalu klik "Go".
--   4. Jika database sudah dipilih, baris CREATE DATABASE/USE
--      di bawah boleh dibiarkan sebagai komentar.
-- ============================================================

SET NAMES utf8mb4;
SET time_zone = '+07:00';
SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------
-- Opsional: buat database baru.
-- Hapus tanda komentar jika ingin dibuat otomatis.
-- ------------------------------------------------------------
-- CREATE DATABASE IF NOT EXISTS `etikasosial`
--   DEFAULT CHARACTER SET utf8mb4
--   COLLATE utf8mb4_unicode_ci;
-- USE `etikasosial`;

-- ============================================================
-- 1. PENGGUNA (user & admin/CS)
-- ============================================================
CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `username` VARCHAR(50) DEFAULT NULL,
  `email` VARCHAR(190) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  `avatar_url` VARCHAR(255) DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `last_login_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`),
  UNIQUE KEY `uq_users_username` (`username`),
  KEY `idx_users_role` (`role`),
  KEY `idx_users_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 2. TIKET PENGADUAN
-- ============================================================
CREATE TABLE IF NOT EXISTS `tickets` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `ticket_code` VARCHAR(20) NOT NULL,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `category` VARCHAR(60) NOT NULL,
  `subject` VARCHAR(150) NOT NULL,
  `message` TEXT NOT NULL,
  `status` ENUM('open', 'answered', 'closed') NOT NULL DEFAULT 'open',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `closed_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tickets_code` (`ticket_code`),
  KEY `idx_tickets_user` (`user_id`),
  KEY `idx_tickets_status` (`status`),
  KEY `idx_tickets_category` (`category`),
  KEY `idx_tickets_created` (`created_at`),
  CONSTRAINT `fk_tickets_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. BALASAN ADMIN TERHADAP TIKET
-- ============================================================
CREATE TABLE IF NOT EXISTS `ticket_replies` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `ticket_id` BIGINT UNSIGNED NOT NULL,
  `admin_id` BIGINT UNSIGNED NOT NULL,
  `message` TEXT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_replies_ticket` (`ticket_id`),
  KEY `idx_replies_admin` (`admin_id`),
  KEY `idx_replies_created` (`created_at`),
  CONSTRAINT `fk_replies_ticket`
    FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_replies_admin`
    FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. PESAN DARI FORMULIR KONTAK
-- ============================================================
CREATE TABLE IF NOT EXISTS `contact_messages` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(190) NOT NULL,
  `subject` VARCHAR(150) NOT NULL,
  `message` TEXT NOT NULL,
  `consent` TINYINT(1) NOT NULL DEFAULT 1,
  `status` ENUM('new', 'read', 'replied', 'archived') NOT NULL DEFAULT 'new',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_contact_status` (`status`),
  KEY `idx_contact_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 5. KATEGORI ARTIKEL
-- ============================================================
CREATE TABLE IF NOT EXISTS `article_categories` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(80) NOT NULL,
  `slug` VARCHAR(80) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_article_categories_name` (`name`),
  UNIQUE KEY `uq_article_categories_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 6. ARTIKEL
-- ============================================================
CREATE TABLE IF NOT EXISTS `articles` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `category_id` INT UNSIGNED DEFAULT NULL,
  `title` VARCHAR(200) NOT NULL,
  `slug` VARCHAR(200) NOT NULL,
  `excerpt` VARCHAR(300) DEFAULT NULL,
  `content` LONGTEXT NOT NULL,
  `image_url` VARCHAR(500) DEFAULT NULL,
  `image_alt` VARCHAR(255) DEFAULT NULL,
  `image_source_url` VARCHAR(500) DEFAULT NULL,
  `image_license` VARCHAR(100) DEFAULT 'Pexels License',
  `read_minutes` SMALLINT UNSIGNED NOT NULL DEFAULT 5,
  `status` ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'published',
  `published_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_articles_slug` (`slug`),
  KEY `idx_articles_category` (`category_id`),
  KEY `idx_articles_status` (`status`),
  KEY `idx_articles_published` (`published_at`),
  CONSTRAINT `fk_articles_category`
    FOREIGN KEY (`category_id`) REFERENCES `article_categories` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 7. TAG ARTIKEL
-- ============================================================
CREATE TABLE IF NOT EXISTS `tags` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(60) NOT NULL,
  `slug` VARCHAR(60) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tags_name` (`name`),
  UNIQUE KEY `uq_tags_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 8. RELASI ARTIKEL ↔ TAG (many-to-many)
-- ============================================================
CREATE TABLE IF NOT EXISTS `article_tags` (
  `article_id` BIGINT UNSIGNED NOT NULL,
  `tag_id` INT UNSIGNED NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`article_id`, `tag_id`),
  KEY `idx_article_tags_tag` (`tag_id`),
  CONSTRAINT `fk_article_tags_article`
    FOREIGN KEY (`article_id`) REFERENCES `articles` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_article_tags_tag`
    FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 9. OPSIONAL: RIWAYAT CHAT CUSTOMER SERVICE
--    (Saat ini chat masih simulasi di sisi browser.)
-- ============================================================
CREATE TABLE IF NOT EXISTS `chat_messages` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED DEFAULT NULL,
  `sender` ENUM('user', 'bot') NOT NULL,
  `message` TEXT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_chat_user` (`user_id`),
  KEY `idx_chat_created` (`created_at`),
  CONSTRAINT `fk_chat_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- DATA AWAL
-- ============================================================

-- Akun admin/CS awal.
-- Login : username `admin` atau email `admin@etikasosial.id`
-- Sandi : admin123
-- Hash di bawah dibuat dengan password_hash() / bcrypt.
-- Segera ganti sandi setelah situs dipublikasikan.
INSERT IGNORE INTO `users` (`name`, `username`, `email`, `password_hash`, `role`)
VALUES (
  'Fadil',
  'admin',
  'admin@etikasosial.id',
  '$2y$12$WDbMeTMzPLNC9oNGNCEzo.FXyJoqUiB19ik8cHZ9Sjgz/1Dx75jSG',
  'admin'
);

-- Kategori artikel sesuai isi situs.
INSERT IGNORE INTO `article_categories` (`name`, `slug`) VALUES
  ('Etika Digital', 'etika-digital'),
  ('Privasi & Keamanan', 'privasi-keamanan'),
  ('Literasi Digital', 'literasi-digital');

-- Tag artikel sesuai isi situs (tanpa tanda #).
INSERT IGNORE INTO `tags` (`name`, `slug`) VALUES
  ('KomentarSehat', 'komentar-sehat'),
  ('EmpatiDigital', 'empati-digital'),
  ('KritikKonstruktif', 'kritik-konstruktif'),
  ('JejakDigital', 'jejak-digital'),
  ('Privasi', 'privasi'),
  ('ReputasiOnline', 'reputasi-online'),
  ('AntiHoaks', 'anti-hoaks'),
  ('FaktaCek', 'fakta-cek'),
  ('LiterasiDigital', 'literasi-digital');

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- SELESAI
-- ============================================================
