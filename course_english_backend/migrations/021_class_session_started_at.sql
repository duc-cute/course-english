-- =============================================================================
-- Phase 4a — Online Class workflow: started_at on class_sessions
--
-- Chạy MỘT LẦN:
--   mysql -u root -p course_english < migrations/021_class_session_started_at.sql
--
-- Thiết kế: promt.md · TEACHER_TEACHING_PLAN.md Phase 4a
-- =============================================================================

USE `course_english`;

SET NAMES utf8mb4;

ALTER TABLE `class_sessions`
  ADD COLUMN `started_at` DATETIME(6) DEFAULT NULL
    COMMENT 'GV bấm Start Online Class (LIVE_CLASS)'
    AFTER `meet_link`;
