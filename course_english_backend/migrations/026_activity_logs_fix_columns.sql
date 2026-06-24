-- =============================================================================
-- Fix activity_logs column types (ENUM -> VARCHAR, JSON -> TEXT)
--
--   mysql -u root -p course_english < migrations/026_activity_logs_fix_columns.sql
-- =============================================================================

USE `course_english`;

SET NAMES utf8mb4;

ALTER TABLE `activity_logs`
  MODIFY COLUMN `severity` VARCHAR(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  MODIFY COLUMN `module` VARCHAR(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  MODIFY COLUMN `action` VARCHAR(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  MODIFY COLUMN `context_json` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;
