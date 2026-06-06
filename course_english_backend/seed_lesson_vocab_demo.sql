-- =============================================================================
-- Course English — lesson demo: Từ vựng (EXERCISE_SET, 5 câu MCQ)
-- Chạy SAU seed_lms_demo.sql (cần subject Tiếng Anh)
-- mysql -u root -p course_english < seed_lesson_vocab_demo.sql
-- =============================================================================

USE `course_english`;

SET NAMES utf8mb4;

ALTER TABLE `lesson_blocks`
  MODIFY COLUMN `block_type` VARCHAR(64) NOT NULL;

SET FOREIGN_KEY_CHECKS = 0;

DELETE FROM `lesson_blocks` WHERE `id` = 'b2000001-0000-4000-8000-000000000001';
DELETE FROM `lessons` WHERE `id` = 'b2000001-0000-4000-8000-000000000010';

SET FOREIGN_KEY_CHECKS = 1;

SET @now = NOW(6);
SET @subject_en = 'a1000004-0000-4000-8000-000000000003';

INSERT INTO `lessons` (
  `id`, `title`, `summary`, `status`, `display_order`, `subject_id`,
  `created_at`, `created_by`, `updated_at`, `updated_by`, `voided`
) VALUES (
  'b2000001-0000-4000-8000-000000000010',
  'Từ vựng demo — Daily words',
  'Bài luyện 5 câu chọn đáp án (EXERCISE_SET) cho Lesson Player MVP.',
  'PUBLISHED',
  1,
  @subject_en,
  @now, 'seed', NULL, NULL, 0
);

INSERT INTO `lesson_blocks` (
  `id`, `lesson_id`, `block_type`, `display_order`, `payload_json`,
  `created_at`, `created_by`, `updated_at`, `updated_by`, `voided`
) VALUES (
  'b2000001-0000-4000-8000-000000000001',
  'b2000001-0000-4000-8000-000000000010',
  'EXERCISE_SET',
  1,
  '{"title":"Từ vựng demo","instruction":"Chọn đáp án đúng","presentation":"stepped","shuffleQuestions":false,"shuffleOptions":true,"passScorePercent":80,"questions":[{"id":"q1","type":"MULTIPLE_CHOICE","prompt":{"text":"apple","lang":"en"},"choices":[{"id":"a","text":"quả cam"},{"id":"b","text":"quả táo"},{"id":"c","text":"quả chuối"},{"id":"d","text":"quả nho"}],"correctChoiceId":"b","explanation":"Apple = quả táo."},{"id":"q2","type":"MULTIPLE_CHOICE","prompt":{"text":"book","lang":"en"},"choices":[{"id":"a","text":"cái bàn"},{"id":"b","text":"cuốn sách"},{"id":"c","text":"cái ghế"},{"id":"d","text":"cửa sổ"}],"correctChoiceId":"b","explanation":"Book = cuốn sách."},{"id":"q3","type":"MULTIPLE_CHOICE","prompt":{"text":"happy","lang":"en"},"choices":[{"id":"a","text":"buồn"},{"id":"b","text":"mệt"},{"id":"c","text":"vui"},{"id":"d","text":"đói"}],"correctChoiceId":"c","explanation":"Happy = vui."},{"id":"q4","type":"MULTIPLE_CHOICE","prompt":{"text":"school","lang":"en"},"choices":[{"id":"a","text":"bệnh viện"},{"id":"b","text":"trường học"},{"id":"c","text":"siêu thị"},{"id":"d","text":"công viên"}],"correctChoiceId":"b","explanation":"School = trường học."},{"id":"q5","type":"MULTIPLE_CHOICE","prompt":{"text":"water","lang":"en"},"choices":[{"id":"a","text":"nước"},{"id":"b","text":"sữa"},{"id":"c","text":"trà"},{"id":"d","text":"nước ngọt"}],"correctChoiceId":"a","explanation":"Water = nước."}]}',
  @now, 'seed', NULL, NULL, 0
);
