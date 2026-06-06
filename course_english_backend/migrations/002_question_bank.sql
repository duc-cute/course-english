-- =============================================================================
-- Phase 2.1 — Question Bank (Method 3)
-- Tạo ngân hàng câu hỏi tập trung + danh mục
--
-- Chạy MỘT LẦN:
--   mysql -u root -p course_english < migrations/002_question_bank.sql
--
-- Thiết kế: docs/QUESTION_BANK_DB_DESIGN.md
-- =============================================================================

USE `course_english`;

SET NAMES utf8mb4;

-- -----------------------------------------------------------------------------
-- question_categories — Vocabulary / Grammar / Reading / Listening
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `question_categories` (
  `id`            CHAR(36)     NOT NULL,
  `name`          VARCHAR(128) NOT NULL,
  `slug`          VARCHAR(64)  NOT NULL,
  `parent_id`     CHAR(36)     DEFAULT NULL,
  `display_order` INT          NOT NULL DEFAULT 0,
  `created_at`    DATETIME(6)  DEFAULT NULL,
  `created_by`    VARCHAR(255) DEFAULT NULL,
  `updated_at`    DATETIME(6)  DEFAULT NULL,
  `updated_by`    VARCHAR(255) DEFAULT NULL,
  `voided`        TINYINT(1)   NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_question_categories_slug` (`slug`),
  KEY `idx_question_categories_parent` (`parent_id`),
  CONSTRAINT `fk_question_categories_parent`
    FOREIGN KEY (`parent_id`) REFERENCES `question_categories` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- questions — một câu trong bank (khớp ExerciseQuestionType FE)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `questions` (
  `id`            CHAR(36)     NOT NULL,
  `category_id`   CHAR(36)     DEFAULT NULL,
  `question_type` VARCHAR(32)  NOT NULL,
  `status`        VARCHAR(20)  NOT NULL DEFAULT 'DRAFT',
  `prompt_text`   TEXT         NOT NULL,
  `prompt_lang`   VARCHAR(8)   NOT NULL DEFAULT 'en',
  `explanation`   TEXT         DEFAULT NULL,
  `content_json`  TEXT         DEFAULT NULL COMMENT 'MATCHING pairs, audio assetId, …',
  `difficulty`    TINYINT      DEFAULT NULL COMMENT '1=easy … 5=hard',
  `tags_json`     TEXT         DEFAULT NULL COMMENT 'JSON array of tag strings',
  `created_at`    DATETIME(6)  DEFAULT NULL,
  `created_by`    VARCHAR(255) DEFAULT NULL,
  `updated_at`    DATETIME(6)  DEFAULT NULL,
  `updated_by`    VARCHAR(255) DEFAULT NULL,
  `voided`        TINYINT(1)   NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_questions_category` (`category_id`),
  KEY `idx_questions_type` (`question_type`),
  KEY `idx_questions_status` (`status`),
  KEY `idx_questions_voided` (`voided`),
  CONSTRAINT `fk_questions_category`
    FOREIGN KEY (`category_id`) REFERENCES `question_categories` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- question_choices — đáp án MCQ (choice_key a|b|c|d khớp correctChoiceId FE)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `question_choices` (
  `id`            CHAR(36)     NOT NULL,
  `question_id`   CHAR(36)     NOT NULL,
  `choice_key`    VARCHAR(8)   NOT NULL,
  `choice_text`   TEXT         NOT NULL,
  `is_correct`    TINYINT(1)   NOT NULL DEFAULT 0,
  `display_order` INT          NOT NULL DEFAULT 0,
  `created_at`    DATETIME(6)  DEFAULT NULL,
  `created_by`    VARCHAR(255) DEFAULT NULL,
  `updated_at`    DATETIME(6)  DEFAULT NULL,
  `updated_by`    VARCHAR(255) DEFAULT NULL,
  `voided`        TINYINT(1)   NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_question_choices_question_key` (`question_id`, `choice_key`),
  KEY `idx_question_choices_question` (`question_id`),
  CONSTRAINT `fk_question_choices_question`
    FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Seed: 4 danh mục mặc định (idempotent — chỉ insert nếu slug chưa có)
-- -----------------------------------------------------------------------------
SET @now = NOW(6);

INSERT IGNORE INTO `question_categories`
  (`id`, `name`, `slug`, `parent_id`, `display_order`, `created_at`, `created_by`, `voided`)
VALUES
  ('c3000000-0000-4000-8000-000000000001', 'Từ vựng',  'vocabulary', NULL, 1, @now, 'migration', 0),
  ('c3000000-0000-4000-8000-000000000002', 'Ngữ pháp', 'grammar',    NULL, 2, @now, 'migration', 0),
  ('c3000000-0000-4000-8000-000000000003', 'Đọc hiểu', 'reading',    NULL, 3, @now, 'migration', 0),
  ('c3000000-0000-4000-8000-000000000004', 'Nghe',     'listening',  NULL, 4, @now, 'migration', 0);
