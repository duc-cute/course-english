-- =============================================================================
-- Phase 1 — Class sessions (Today's Teaching Plan)
--
-- Chạy MỘT LẦN:
--   mysql -u root -p course_english < migrations/018_class_sessions.sql
--
-- Thiết kế: course_english_frontend/docs/TEACHER_TEACHING_PLAN.md
-- =============================================================================

USE `course_english`;

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `class_sessions` (
  `id`                  CHAR(36)     NOT NULL,
  `classroom_id`        CHAR(36)     NOT NULL,
  `teacher_id`          CHAR(36)     NOT NULL,
  `lesson_id`           CHAR(36)     DEFAULT NULL,
  `title`               VARCHAR(255) NOT NULL,
  `session_type`        VARCHAR(32)  NOT NULL DEFAULT 'LIVE_CLASS',
  `start_at`            DATETIME(6)  NOT NULL,
  `end_at`              DATETIME(6)  NOT NULL,
  `meet_link`           TEXT         DEFAULT NULL,
  `location_label`      VARCHAR(128) DEFAULT NULL,
  `status`              VARCHAR(32)  NOT NULL DEFAULT 'SCHEDULED',
  `notes`               TEXT         DEFAULT NULL,
  `recurrence_group_id` CHAR(36)     DEFAULT NULL,
  `recurrence_rule`     VARCHAR(64)  DEFAULT NULL,
  `created_at`          DATETIME(6)  DEFAULT NULL,
  `created_by`          VARCHAR(255) DEFAULT NULL,
  `updated_at`          DATETIME(6)  DEFAULT NULL,
  `updated_by`          VARCHAR(255) DEFAULT NULL,
  `voided`              TINYINT(1)   NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_cs_teacher_start` (`teacher_id`, `start_at`),
  KEY `idx_cs_classroom_start` (`classroom_id`, `start_at`),
  KEY `idx_cs_start_end` (`start_at`, `end_at`),
  KEY `idx_cs_voided` (`voided`),
  CONSTRAINT `fk_cs_classroom` FOREIGN KEY (`classroom_id`) REFERENCES `classrooms` (`id`),
  CONSTRAINT `fk_cs_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_cs_lesson` FOREIGN KEY (`lesson_id`) REFERENCES `lessons` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
