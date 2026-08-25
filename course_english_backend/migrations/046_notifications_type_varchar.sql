-- =============================================================================
-- Fix notifications.type (+ email logs) — Hibernate ddl-auto may create MySQL
-- ENUM with only LESSON_PUBLISHED / PRACTICE_SUBMITTED. Inserting EXAM_ASSIGNED
-- fails with: Data truncated for column 'type'
--
-- Chạy MỘT LẦN:
--   mysql -u root -p course_english < migrations/046_notifications_type_varchar.sql
--
-- Verify:
--   SELECT COLUMN_NAME, COLUMN_TYPE
--   FROM information_schema.COLUMNS
--   WHERE TABLE_SCHEMA = 'course_english'
--     AND TABLE_NAME IN ('notifications', 'notification_email_logs')
--     AND COLUMN_NAME = 'type';
-- =============================================================================

USE `course_english`;

SET NAMES utf8mb4;

ALTER TABLE `notifications`
  MODIFY COLUMN `type` VARCHAR(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

ALTER TABLE `notification_email_logs`
  MODIFY COLUMN `type` VARCHAR(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;
