-- Block SLIDE_DECK (import slide từ ZIP PDF Canva)
-- Lỗi 1265 "Data truncated for column block_type" = cột vẫn là ENUM cũ, chưa có SLIDE_DECK.
-- Chạy MỘT LẦN (an toàn chạy lại nếu đã là VARCHAR):
--   mysql -u root -p course_english < migrations/015_slide_deck_block_type.sql

USE `course_english`;

ALTER TABLE `lesson_blocks`
  MODIFY COLUMN `block_type` VARCHAR(64) NOT NULL;
