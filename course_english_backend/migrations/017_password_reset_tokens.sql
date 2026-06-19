-- Password reset tokens (forgot password flow)
-- Chạy MỘT LẦN:
--   mysql -u root -p course_english < migrations/017_password_reset_tokens.sql

USE `course_english`;

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
  `id`          CHAR(36)     NOT NULL,
  `user_id`     CHAR(36)     NOT NULL,
  `token_hash`  VARCHAR(64)  NOT NULL,
  `expires_at`  DATETIME(6)  NOT NULL,
  `used_at`     DATETIME(6)  DEFAULT NULL,
  `created_at`  DATETIME(6)  DEFAULT NULL,
  `created_by`  VARCHAR(255) DEFAULT NULL,
  `updated_at`  DATETIME(6)  DEFAULT NULL,
  `updated_by`  VARCHAR(255) DEFAULT NULL,
  `voided`      TINYINT(1)   NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_prt_token_hash` (`token_hash`),
  KEY `idx_prt_user_expires` (`user_id`, `expires_at`),
  CONSTRAINT `fk_prt_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
