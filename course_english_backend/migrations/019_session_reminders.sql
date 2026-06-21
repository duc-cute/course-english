-- =============================================================================
-- Phase 3a — Email reminders for class sessions (teacher only)
--
--   mysql -u root -p course_english < migrations/019_session_reminders.sql
-- =============================================================================

USE `course_english`;

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `session_reminders` (
  `id`           CHAR(36)     NOT NULL,
  `session_id`   CHAR(36)     NOT NULL,
  `teacher_id`   CHAR(36)     NOT NULL,
  `channel`      VARCHAR(16)  NOT NULL DEFAULT 'EMAIL',
  `remind_at`    DATETIME(6)  NOT NULL,
  `status`       VARCHAR(16)  NOT NULL DEFAULT 'PENDING',
  `sent_at`      DATETIME(6)  DEFAULT NULL,
  `last_error`   TEXT         DEFAULT NULL,
  `created_at`   DATETIME(6)  DEFAULT NULL,
  `created_by`   VARCHAR(255) DEFAULT NULL,
  `updated_at`   DATETIME(6)  DEFAULT NULL,
  `updated_by`   VARCHAR(255) DEFAULT NULL,
  `voided`       TINYINT(1)   NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_sr_session_channel` (`session_id`, `channel`),
  KEY `idx_sr_due` (`status`, `remind_at`),
  CONSTRAINT `fk_sr_session` FOREIGN KEY (`session_id`) REFERENCES `class_sessions` (`id`),
  CONSTRAINT `fk_sr_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
