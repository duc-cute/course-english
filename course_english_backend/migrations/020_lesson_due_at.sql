-- =============================================================================
-- SNS-0 — Lesson due date (hạn nộp bài)
--
-- Chạy MỘT LẦN:
--   mysql -u root -p course_english < migrations/020_lesson_due_at.sql
--
-- Thiết kế: course_english_frontend/docs/TEACHER_STUDENTS_NEED_SUPPORT.md
-- =============================================================================

USE `course_english`;

SET NAMES utf8mb4;

ALTER TABLE `lessons`
  ADD COLUMN `due_at` DATETIME(6) DEFAULT NULL AFTER `display_order`;
