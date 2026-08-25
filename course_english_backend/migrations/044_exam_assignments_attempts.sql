-- =============================================================================
-- ExamPaper Phase 4–5 — Gán đề cho lớp + attempt HS làm đề
--
-- Chạy MỘT LẦN:
--   mysql -u root -p course_english < migrations/044_exam_assignments_attempts.sql
--
-- Task Plan: exam-paper-phase-4-5 Wave 1
-- Thiết kế: docs/EXAM_PAPER_PLAN.md Phase 4–5
-- Pattern: vocabulary_set_assignments + lesson_practice_attempts
-- =============================================================================

USE `course_english`;

SET NAMES utf8mb4;

-- -----------------------------------------------------------------------------
-- exam_assignments — gán một đề PUBLISHED cho một lớp
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `exam_assignments` (
  `id`              CHAR(36)     NOT NULL,
  `exam_paper_id`   CHAR(36)     NOT NULL,
  `classroom_id`    CHAR(36)     NOT NULL,
  `assigned_by`     CHAR(36)     DEFAULT NULL,
  `assigned_at`     DATETIME(6)  NOT NULL,
  `open_at`         DATETIME(6)  DEFAULT NULL COMMENT 'NULL = mở ngay khi gán',
  `due_at`          DATETIME(6)  DEFAULT NULL COMMENT 'Hạn nộp (hiển thị / nhắc)',
  `close_at`        DATETIME(6)  DEFAULT NULL COMMENT 'NULL = không khóa cửa sổ làm bài',
  `max_attempts`    INT          NOT NULL DEFAULT 1,
  `note`            VARCHAR(512) DEFAULT NULL,
  `status`          VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE' COMMENT 'ACTIVE | CANCELLED',
  `created_at`      DATETIME(6)  DEFAULT NULL,
  `created_by`      VARCHAR(255) DEFAULT NULL,
  `updated_at`      DATETIME(6)  DEFAULT NULL,
  `updated_by`      VARCHAR(255) DEFAULT NULL,
  `voided`          TINYINT(1)   NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_ea_classroom_assigned` (`classroom_id`, `assigned_at`),
  KEY `idx_ea_exam_paper` (`exam_paper_id`),
  KEY `idx_ea_status_voided` (`status`, `voided`),
  CONSTRAINT `fk_ea_exam_paper`
    FOREIGN KEY (`exam_paper_id`) REFERENCES `exam_papers` (`id`),
  CONSTRAINT `fk_ea_classroom`
    FOREIGN KEY (`classroom_id`) REFERENCES `classrooms` (`id`),
  CONSTRAINT `fk_ea_assigned_by`
    FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- exam_attempts — mỗi lần HS làm một assignment
-- unique (assignment_id, user_id, attempt_no): attempt_no tăng dần; soft-delete giữ số
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `exam_attempts` (
  `id`                     CHAR(36)     NOT NULL,
  `assignment_id`          CHAR(36)     NOT NULL,
  `exam_paper_id`          CHAR(36)     NOT NULL,
  `user_id`                CHAR(36)     NOT NULL,
  `attempt_no`             INT          NOT NULL DEFAULT 1,
  `status`                 VARCHAR(20)  NOT NULL DEFAULT 'IN_PROGRESS'
                           COMMENT 'IN_PROGRESS | SUBMITTED | TIMED_OUT',
  `started_at`             DATETIME(6)  NOT NULL,
  `submitted_at`           DATETIME(6)  DEFAULT NULL,
  `elapsed_ms`             BIGINT       NOT NULL DEFAULT 0,
  `correct_count`          INT          DEFAULT NULL,
  `total_count`            INT          DEFAULT NULL,
  `score_percent`          INT          DEFAULT NULL,
  `passed`                 TINYINT(1)   DEFAULT NULL,
  `pass_score_percent`     INT          NOT NULL DEFAULT 80,
  `answers_json`           JSON         DEFAULT NULL COMMENT 'questionId → đáp án HS',
  `sections_snapshot_json` JSON         DEFAULT NULL COMMENT 'Optional snapshot sections lúc start',
  `created_at`             DATETIME(6)  DEFAULT NULL,
  `created_by`             VARCHAR(255) DEFAULT NULL,
  `updated_at`             DATETIME(6)  DEFAULT NULL,
  `updated_by`             VARCHAR(255) DEFAULT NULL,
  `voided`                 TINYINT(1)   NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_ea_assignment_user_attempt` (`assignment_id`, `user_id`, `attempt_no`),
  KEY `idx_eat_assignment_user` (`assignment_id`, `user_id`),
  KEY `idx_eat_exam_paper` (`exam_paper_id`),
  KEY `idx_eat_user_submitted` (`user_id`, `submitted_at`),
  KEY `idx_eat_status_voided` (`status`, `voided`),
  CONSTRAINT `fk_eat_assignment`
    FOREIGN KEY (`assignment_id`) REFERENCES `exam_assignments` (`id`),
  CONSTRAINT `fk_eat_exam_paper`
    FOREIGN KEY (`exam_paper_id`) REFERENCES `exam_papers` (`id`),
  CONSTRAINT `fk_eat_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
