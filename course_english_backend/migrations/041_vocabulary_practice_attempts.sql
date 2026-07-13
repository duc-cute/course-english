-- =============================================================================
-- Phase 2b — Vocabulary practice attempts (lưu điểm luyện bộ từ)
--
-- Chạy MỘT LẦN:
--   mysql -u root -p course_english < migrations/041_vocabulary_practice_attempts.sql
--
-- Thiết kế: docs/STUDENT_VOCAB_LEARNING_PLAN.md Phase 2b
-- =============================================================================

USE `course_english`;

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `vocabulary_practice_attempts` (
  `id`                    CHAR(36)     NOT NULL,
  `user_id`               CHAR(36)     NOT NULL,
  `vocabulary_set_id`     CHAR(36)     NOT NULL,
  `assignment_id`         CHAR(36)     DEFAULT NULL COMMENT 'NULL = luyện từ Explore',
  `correct_count`         INT          NOT NULL,
  `total_count`           INT          NOT NULL,
  `score_percent`         INT          NOT NULL,
  `passed`                TINYINT(1)   NOT NULL DEFAULT 0,
  `pass_score_percent`    INT          NOT NULL DEFAULT 80,
  `elapsed_ms`            BIGINT       NOT NULL DEFAULT 0,
  `block_ids_json`        JSON         DEFAULT NULL,
  `answers_snapshot_json` JSON         DEFAULT NULL,
  `completed_at`          DATETIME(6)  NOT NULL,
  `created_at`            DATETIME(6)  DEFAULT NULL,
  `created_by`            VARCHAR(255) DEFAULT NULL,
  `updated_at`            DATETIME(6)  DEFAULT NULL,
  `updated_by`            VARCHAR(255) DEFAULT NULL,
  `voided`                TINYINT(1)   NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_vpa_user_set` (`user_id`, `vocabulary_set_id`),
  KEY `idx_vpa_assignment_completed` (`assignment_id`, `completed_at`),
  KEY `idx_vpa_set_completed` (`vocabulary_set_id`, `completed_at`),
  KEY `idx_vpa_voided` (`voided`),
  CONSTRAINT `fk_vpa_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_vpa_set`
    FOREIGN KEY (`vocabulary_set_id`) REFERENCES `vocabulary_sets` (`id`),
  CONSTRAINT `fk_vpa_assignment`
    FOREIGN KEY (`assignment_id`) REFERENCES `vocabulary_set_assignments` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
