-- =============================================================================
-- Fix activity_logs.action — Hibernate ddl-auto may create MySQL ENUM; widen to VARCHAR
--
-- Verify before:
--   SELECT COLUMN_NAME, COLUMN_TYPE
--   FROM information_schema.COLUMNS
--   WHERE TABLE_SCHEMA = 'course_english' AND TABLE_NAME = 'activity_logs' AND COLUMN_NAME = 'action';
--
--   mysql -u root -p course_english < migrations/025_activity_logs_widen_action.sql
-- =============================================================================

USE `course_english`;

SET NAMES utf8mb4;

ALTER TABLE `activity_logs`
  MODIFY COLUMN `action` VARCHAR(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;
