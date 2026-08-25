-- =============================================================================
-- Exam assign notifications — email audit log theo exam_assignment_id
--
-- Chạy MỘT LẦN (sau 044):
--   mysql -u root -p course_english < migrations/045_exam_assignment_email_logs.sql
-- =============================================================================

USE `course_english`;

SET NAMES utf8mb4;

-- Cho phép log email không gắn lesson (đề thi gán lớp)
ALTER TABLE `notification_email_logs`
  DROP FOREIGN KEY `fk_email_log_lesson`,
  DROP INDEX `uk_email_log_lesson_user_type`;

ALTER TABLE `notification_email_logs`
  MODIFY COLUMN `lesson_id` CHAR(36) NULL,
  ADD COLUMN `exam_assignment_id` CHAR(36) NULL AFTER `lesson_id`;

ALTER TABLE `notification_email_logs`
  ADD CONSTRAINT `fk_email_log_lesson`
    FOREIGN KEY (`lesson_id`) REFERENCES `lessons` (`id`),
  ADD CONSTRAINT `fk_email_log_exam_assignment`
    FOREIGN KEY (`exam_assignment_id`) REFERENCES `exam_assignments` (`id`),
  ADD UNIQUE KEY `uk_email_log_lesson_user_type` (`lesson_id`, `user_id`, `type`),
  ADD UNIQUE KEY `uk_email_log_exam_assignment_user_type` (`exam_assignment_id`, `user_id`, `type`);
