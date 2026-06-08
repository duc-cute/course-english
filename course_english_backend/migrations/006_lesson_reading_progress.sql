-- =============================================================================
-- Phase 3 — Lesson reading progress (sync tiến độ đọc bài)
--
-- Chạy MỘT LẦN:
--   mysql -u root -p course_english < migrations/006_lesson_reading_progress.sql
--
-- Thiết kế: docs/LESSON_READING_PROGRESS.md
-- =============================================================================

USE `course_english`;

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `lesson_reading_progress` (
  `id`              CHAR(36)     NOT NULL,
  `user_id`         CHAR(36)     NOT NULL,
  `lesson_id`       CHAR(36)     NOT NULL,
  `last_block_id`   VARCHAR(36)  DEFAULT NULL,
  `scroll_percent`  INT          NOT NULL DEFAULT 0,
  `last_tab`        VARCHAR(16)  NOT NULL DEFAULT 'study',
  `lesson_title`    VARCHAR(255) DEFAULT NULL,
  `subject_name`    VARCHAR(255) DEFAULT NULL,
  `created_at`      DATETIME(6)  DEFAULT NULL,
  `created_by`      VARCHAR(255) DEFAULT NULL,
  `updated_at`      DATETIME(6)  DEFAULT NULL,
  `updated_by`      VARCHAR(255) DEFAULT NULL,
  `voided`          TINYINT(1)   NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_lrp_user_lesson` (`user_id`, `lesson_id`),
  KEY `idx_lrp_user_updated` (`user_id`, `updated_at`),
  KEY `idx_lrp_voided` (`voided`),
  CONSTRAINT `fk_lrp_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_lrp_lesson` FOREIGN KEY (`lesson_id`) REFERENCES `lessons` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
