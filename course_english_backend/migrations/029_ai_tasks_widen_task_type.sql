-- =============================================================================
-- Fix ai_tasks.task_type — Hibernate ddl-auto may create MySQL ENUM with only
-- QUESTION_GENERATION; EXAM_PAPER_GENERATION insert fails with "Data truncated".
--
-- Verify before:
--   SELECT COLUMN_NAME, COLUMN_TYPE
--   FROM information_schema.COLUMNS
--   WHERE TABLE_SCHEMA = 'course_english' AND TABLE_NAME = 'ai_tasks' AND COLUMN_NAME = 'task_type';
--
--   mysql -u root -p course_english < migrations/029_ai_tasks_widen_task_type.sql
-- =============================================================================

USE `course_english`;

SET NAMES utf8mb4;

ALTER TABLE `ai_tasks`
  MODIFY COLUMN `task_type` VARCHAR(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;
