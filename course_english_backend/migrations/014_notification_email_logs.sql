-- =============================================================================
-- Phase 1.5 — Email audit log (lesson publish notifications)
--
-- Chạy MỘT LẦN:
--   mysql -u root -p course_english < migrations/014_notification_email_logs.sql
-- =============================================================================

USE `course_english`;

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `notification_email_logs` (
  `id`              CHAR(36)     NOT NULL,
  `lesson_id`       CHAR(36)     NOT NULL,
  `user_id`         CHAR(36)     NOT NULL,
  `email`           VARCHAR(255) NOT NULL,
  `type`            VARCHAR(40)  NOT NULL,
  `status`          VARCHAR(20)  NOT NULL,
  `error_message`   TEXT         DEFAULT NULL,
  `sent_at`         DATETIME(6)  DEFAULT NULL,
  `created_at`      DATETIME(6)  DEFAULT NULL,
  `created_by`      VARCHAR(255) DEFAULT NULL,
  `updated_at`      DATETIME(6)  DEFAULT NULL,
  `updated_by`      VARCHAR(255) DEFAULT NULL,
  `voided`          TINYINT(1)   NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_email_log_lesson_user_type` (`lesson_id`, `user_id`, `type`),
  KEY `idx_email_log_status` (`status`, `created_at`),
  CONSTRAINT `fk_email_log_lesson` FOREIGN KEY (`lesson_id`) REFERENCES `lessons` (`id`),
  CONSTRAINT `fk_email_log_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
