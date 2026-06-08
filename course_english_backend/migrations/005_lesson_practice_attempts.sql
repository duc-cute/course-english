-- =============================================================================
-- Phase B — Lesson practice attempts (lưu điểm bài tập)
--
-- Chạy MỘT LẦN:
--   mysql -u root -p course_english < migrations/005_lesson_practice_attempts.sql
--
-- Thiết kế: docs/LESSON_PRACTICE_ATTEMPT.md
-- =============================================================================

USE `course_english`;

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `lesson_practice_attempts` (
  `id`                    CHAR(36)     NOT NULL,
  `user_id`               CHAR(36)     NOT NULL,
  `lesson_id`             CHAR(36)     NOT NULL,
  `correct_count`         INT          NOT NULL,
  `total_count`           INT          NOT NULL,
  `score_percent`         INT          NOT NULL,
  `passed`                TINYINT(1)   NOT NULL DEFAULT 0,
  `pass_score_percent`    INT          NOT NULL DEFAULT 80,
  `elapsed_ms`            BIGINT       NOT NULL DEFAULT 0,
  `block_ids_json`        JSON         DEFAULT NULL COMMENT 'UUID[] khối practice',
  `answers_snapshot_json` JSON         DEFAULT NULL COMMENT 'questionId → đáp án HS chọn',
  `completed_at`          DATETIME(6)  NOT NULL,
  `created_at`            DATETIME(6)  DEFAULT NULL,
  `created_by`            VARCHAR(255) DEFAULT NULL,
  `updated_at`            DATETIME(6)  DEFAULT NULL,
  `updated_by`            VARCHAR(255) DEFAULT NULL,
  `voided`                TINYINT(1)   NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_lpa_user_lesson` (`user_id`, `lesson_id`),
  KEY `idx_lpa_lesson_completed` (`lesson_id`, `completed_at`),
  KEY `idx_lpa_voided` (`voided`),
  CONSTRAINT `fk_lpa_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_lpa_lesson` FOREIGN KEY (`lesson_id`) REFERENCES `lessons` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
