-- Mở rộng block_type: MySQL ENUM cũ không có EXERCISE_SET → lỗi 1265 Data truncated
-- Chạy MỘT LẦN trước khi import bài tập:
--   mysql -u root -p course_english < migrations/001_block_type_varchar.sql

USE `course_english`;

ALTER TABLE `lesson_blocks`
  MODIFY COLUMN `block_type` VARCHAR(64) NOT NULL;
