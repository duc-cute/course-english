-- =============================================================================
-- Phase 1 — ExamPaper module (đề thi tách khỏi Lesson)
--
-- Chạy MỘT LẦN:
--   mysql -u root -p course_english < migrations/028_exam_papers.sql
--
-- Thiết kế: docs/EXAM_PAPER_PLAN.md
-- =============================================================================

USE `course_english`;

SET NAMES utf8mb4;

-- -----------------------------------------------------------------------------
-- exam_papers — một đề thi / bài kiểm tra
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `exam_papers` (
  `id`                  CHAR(36)     NOT NULL,
  `title`               VARCHAR(255) NOT NULL,
  `instruction`         TEXT         DEFAULT NULL COMMENT 'Lời dẫn toàn đề',
  `duration_minutes`    INT          DEFAULT NULL COMMENT 'Thời gian làm bài (phút)',
  `pass_score_percent`  INT          NOT NULL DEFAULT 80,
  `status`              VARCHAR(20)  NOT NULL DEFAULT 'DRAFT',
  `subject_id`          CHAR(36)     DEFAULT NULL COMMENT 'Optional — gắn unit/môn',
  `created_at`          DATETIME(6)  DEFAULT NULL,
  `created_by`          VARCHAR(255) DEFAULT NULL,
  `updated_at`          DATETIME(6)  DEFAULT NULL,
  `updated_by`          VARCHAR(255) DEFAULT NULL,
  `voided`              TINYINT(1)   NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_exam_papers_status` (`status`),
  KEY `idx_exam_papers_subject` (`subject_id`),
  KEY `idx_exam_papers_voided` (`voided`),
  CONSTRAINT `fk_exam_papers_subject`
    FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- exam_sections — mỗi phần (I, II, III…) của đề
-- payload_json = ExerciseSetPayload FE (title, instruction, questions[])
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `exam_sections` (
  `id`              CHAR(36)     NOT NULL,
  `exam_paper_id`   CHAR(36)     NOT NULL,
  `display_order`   INT          NOT NULL DEFAULT 0,
  `title`           VARCHAR(255) DEFAULT NULL,
  `instruction`     TEXT         DEFAULT NULL,
  `question_type`   VARCHAR(32)  DEFAULT NULL COMMENT 'Gợi ý loại câu — khớp QuestionTypeEnum',
  `payload_json`    TEXT         NOT NULL COMMENT 'ExerciseSetPayload JSON',
  `created_at`      DATETIME(6)  DEFAULT NULL,
  `created_by`      VARCHAR(255) DEFAULT NULL,
  `updated_at`      DATETIME(6)  DEFAULT NULL,
  `updated_by`      VARCHAR(255) DEFAULT NULL,
  `voided`          TINYINT(1)   NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_exam_sections_paper` (`exam_paper_id`),
  KEY `idx_exam_sections_order` (`exam_paper_id`, `display_order`),
  KEY `idx_exam_sections_voided` (`voided`),
  CONSTRAINT `fk_exam_sections_paper`
    FOREIGN KEY (`exam_paper_id`) REFERENCES `exam_papers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
