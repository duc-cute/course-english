-- =============================================================================
-- Phase 2 — Question Bank metadata columns
--
-- Chạy MỘT LẦN:
--   mysql -u root -p course_english < migrations/031_question_bank_metadata.sql
-- =============================================================================

USE `course_english`;

SET NAMES utf8mb4;

ALTER TABLE `questions`
  ADD COLUMN `title`           VARCHAR(255) DEFAULT NULL AFTER `status`,
  ADD COLUMN `cefr_level`      VARCHAR(8)   DEFAULT NULL COMMENT 'A1..C2' AFTER `difficulty`,
  ADD COLUMN `skill`           VARCHAR(32)  DEFAULT NULL COMMENT 'vocabulary|grammar|reading|listening|writing|speaking' AFTER `cefr_level`,
  ADD COLUMN `topic`           VARCHAR(128) DEFAULT NULL AFTER `skill`,
  ADD COLUMN `source`          VARCHAR(32)  NOT NULL DEFAULT 'MANUAL' COMMENT 'MANUAL|IMPORT|AI|LESSON|EXAM' AFTER `topic`,
  ADD COLUMN `is_ai_generated` TINYINT(1)   NOT NULL DEFAULT 0 AFTER `source`;

CREATE INDEX `idx_questions_cefr`   ON `questions` (`cefr_level`);
CREATE INDEX `idx_questions_skill`  ON `questions` (`skill`);
CREATE INDEX `idx_questions_topic`  ON `questions` (`topic`);
CREATE INDEX `idx_questions_source` ON `questions` (`source`);
