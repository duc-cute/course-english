-- =============================================================================
-- Phase 2a — Vocabulary set assignments (gán bộ từ → lớp)
--
-- Chạy MỘT LẦN:
--   mysql -u root -p course_english < migrations/040_vocabulary_set_assignments.sql
--
-- Thiết kế: docs/STUDENT_VOCAB_LEARNING_PLAN.md Phase 2a
-- =============================================================================

USE `course_english`;

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `vocabulary_set_assignments` (
  `id`                 CHAR(36)     NOT NULL,
  `vocabulary_set_id`  CHAR(36)     NOT NULL,
  `classroom_id`       CHAR(36)     NOT NULL,
  `assigned_by`        CHAR(36)     DEFAULT NULL,
  `assigned_at`        DATETIME(6)  NOT NULL,
  `due_at`             DATETIME(6)  DEFAULT NULL,
  `note`               VARCHAR(512) DEFAULT NULL,
  `status`             VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
  `created_at`         DATETIME(6)  DEFAULT NULL,
  `created_by`         VARCHAR(255) DEFAULT NULL,
  `updated_at`         DATETIME(6)  DEFAULT NULL,
  `updated_by`         VARCHAR(255) DEFAULT NULL,
  `voided`             TINYINT(1)   NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_vsa_classroom_assigned` (`classroom_id`, `assigned_at`),
  KEY `idx_vsa_set` (`vocabulary_set_id`),
  KEY `idx_vsa_status_voided` (`status`, `voided`),
  CONSTRAINT `fk_vsa_set`
    FOREIGN KEY (`vocabulary_set_id`) REFERENCES `vocabulary_sets` (`id`),
  CONSTRAINT `fk_vsa_classroom`
    FOREIGN KEY (`classroom_id`) REFERENCES `classrooms` (`id`),
  CONSTRAINT `fk_vsa_assigned_by`
    FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
