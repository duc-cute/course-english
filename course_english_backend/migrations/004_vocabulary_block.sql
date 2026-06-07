-- Block VOCABULARY (tab Bài học — ref vocabulary_sets)
-- Lỗi 1265 "Data truncated for column block_type" = cột vẫn là ENUM cũ.
-- Chạy file này MỘT LẦN (an toàn chạy lại nếu đã là VARCHAR):
--   mysql -u root -p course_english < migrations/004_vocabulary_block.sql

USE `course_english`;

ALTER TABLE `lesson_blocks`
  MODIFY COLUMN `block_type` VARCHAR(64) NOT NULL;
