-- =============================================================================
-- Phase 1 — In-app notifications (publish lesson → enrolled students)
--
-- Chạy MỘT LẦN:
--   mysql -u root -p course_english < migrations/012_notifications.sql
--
-- Spec: course_english_frontend/docs/NOTIFICATION_ROADMAP.html
-- =============================================================================

USE `course_english`;

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `notifications` (
  `id`              CHAR(36)     NOT NULL,
  `user_id`         CHAR(36)     NOT NULL,
  `type`            VARCHAR(40)  NOT NULL,
  `title`           VARCHAR(255) NOT NULL,
  `body`            TEXT         DEFAULT NULL,
  `link_path`       VARCHAR(512) NOT NULL,
  `payload_json`    JSON         DEFAULT NULL,
  `read_at`         DATETIME(6)  DEFAULT NULL,
  `created_at`      DATETIME(6)  DEFAULT NULL,
  `created_by`      VARCHAR(255) DEFAULT NULL,
  `updated_at`      DATETIME(6)  DEFAULT NULL,
  `updated_by`      VARCHAR(255) DEFAULT NULL,
  `voided`          TINYINT(1)   NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_notif_user_created` (`user_id`, `created_at`),
  KEY `idx_notif_user_unread` (`user_id`, `read_at`, `voided`),
  KEY `idx_notif_type` (`type`),
  CONSTRAINT `fk_notif_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
