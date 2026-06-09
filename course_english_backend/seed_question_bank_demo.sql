-- =============================================================================
-- Phase 2 — Question Bank demo seed
-- Chạy SAU: migrations/002_question_bank.sql + seed_lms_demo.sql
--   mysql -u root -p course_english < seed_question_bank_demo.sql
--
-- Tạo:
--   - 5 câu MCQ PUBLISHED (Từ vựng) — cùng nội dung vocab demo
--   - Lesson A: QUESTION_REF q1,q2,q3
--   - Lesson B: QUESTION_REF q1,q4,q5 (overlap q1 — test sửa bank → 2 lesson đổi)
-- =============================================================================

USE `course_english`;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DELETE FROM `question_choices` WHERE `question_id` LIKE 'c3000001-%';
DELETE FROM `questions` WHERE `id` LIKE 'c3000001-%';

DELETE FROM `lesson_blocks` WHERE `lesson_id` IN (
  'b2000002-0000-4000-8000-000000000010',
  'b2000002-0000-4000-8000-000000000020'
);
DELETE FROM `lessons` WHERE `id` IN (
  'b2000002-0000-4000-8000-000000000010',
  'b2000002-0000-4000-8000-000000000020'
);

SET FOREIGN_KEY_CHECKS = 1;

SET @now = NOW(6);
SET @subject_en = 'a1000004-0000-4000-8000-000000000003';
SET @cat_vocab = 'c3000000-0000-4000-8000-000000000001';

-- -----------------------------------------------------------------------------
-- Questions (bank)
-- -----------------------------------------------------------------------------
INSERT INTO `questions` (
  `id`, `category_id`, `question_type`, `status`, `prompt_text`, `prompt_lang`, `explanation`,
  `created_at`, `created_by`, `voided`
) VALUES
('c3000001-0000-4000-8000-000000000001', @cat_vocab, 'MULTIPLE_CHOICE', 'PUBLISHED', 'apple',  'en', 'Apple = quả táo.',  @now, 'seed', 0),
('c3000001-0000-4000-8000-000000000002', @cat_vocab, 'MULTIPLE_CHOICE', 'PUBLISHED', 'book',   'en', 'Book = cuốn sách.', @now, 'seed', 0),
('c3000001-0000-4000-8000-000000000003', @cat_vocab, 'MULTIPLE_CHOICE', 'PUBLISHED', 'happy',  'en', 'Happy = vui.',      @now, 'seed', 0),
('c3000001-0000-4000-8000-000000000004', @cat_vocab, 'MULTIPLE_CHOICE', 'PUBLISHED', 'school', 'en', 'School = trường học.', @now, 'seed', 0),
('c3000001-0000-4000-8000-000000000005', @cat_vocab, 'MULTIPLE_CHOICE', 'PUBLISHED', 'water',  'en', 'Water = nước.',     @now, 'seed', 0);

INSERT INTO `question_choices` (
  `id`, `question_id`, `choice_key`, `choice_text`, `is_correct`, `display_order`, `created_at`, `created_by`, `voided`
) VALUES
-- apple
('c3000002-0000-4000-8000-000000000001', 'c3000001-0000-4000-8000-000000000001', 'a', 'quả cam',   0, 0, @now, 'seed', 0),
('c3000002-0000-4000-8000-000000000002', 'c3000001-0000-4000-8000-000000000001', 'b', 'quả táo',   1, 1, @now, 'seed', 0),
('c3000002-0000-4000-8000-000000000003', 'c3000001-0000-4000-8000-000000000001', 'c', 'quả chuối', 0, 2, @now, 'seed', 0),
('c3000002-0000-4000-8000-000000000004', 'c3000001-0000-4000-8000-000000000001', 'd', 'quả nho',   0, 3, @now, 'seed', 0),
-- book
('c3000002-0000-4000-8000-000000000005', 'c3000001-0000-4000-8000-000000000002', 'a', 'cái bàn',   0, 0, @now, 'seed', 0),
('c3000002-0000-4000-8000-000000000006', 'c3000001-0000-4000-8000-000000000002', 'b', 'cuốn sách', 1, 1, @now, 'seed', 0),
('c3000002-0000-4000-8000-000000000007', 'c3000001-0000-4000-8000-000000000002', 'c', 'cái ghế',   0, 2, @now, 'seed', 0),
('c3000002-0000-4000-8000-000000000008', 'c3000001-0000-4000-8000-000000000002', 'd', 'cửa sổ',    0, 3, @now, 'seed', 0),
-- happy
('c3000002-0000-4000-8000-000000000009', 'c3000001-0000-4000-8000-000000000003', 'a', 'buồn',  0, 0, @now, 'seed', 0),
('c3000002-0000-4000-8000-000000000010', 'c3000001-0000-4000-8000-000000000003', 'b', 'mệt',   0, 1, @now, 'seed', 0),
('c3000002-0000-4000-8000-000000000011', 'c3000001-0000-4000-8000-000000000003', 'c', 'vui',   1, 2, @now, 'seed', 0),
('c3000002-0000-4000-8000-000000000012', 'c3000001-0000-4000-8000-000000000003', 'd', 'đói',   0, 3, @now, 'seed', 0),
-- school
('c3000002-0000-4000-8000-000000000013', 'c3000001-0000-4000-8000-000000000004', 'a', 'bệnh viện',  0, 0, @now, 'seed', 0),
('c3000002-0000-4000-8000-000000000014', 'c3000001-0000-4000-8000-000000000004', 'b', 'trường học', 1, 1, @now, 'seed', 0),
('c3000002-0000-4000-8000-000000000015', 'c3000001-0000-4000-8000-000000000004', 'c', 'siêu thị',    0, 2, @now, 'seed', 0),
('c3000002-0000-4000-8000-000000000016', 'c3000001-0000-4000-8000-000000000004', 'd', 'công viên',  0, 3, @now, 'seed', 0),
-- water
('c3000002-0000-4000-8000-000000000017', 'c3000001-0000-4000-8000-000000000005', 'a', 'nước',      1, 0, @now, 'seed', 0),
('c3000002-0000-4000-8000-000000000018', 'c3000001-0000-4000-8000-000000000005', 'b', 'sữa',       0, 1, @now, 'seed', 0),
('c3000002-0000-4000-8000-000000000019', 'c3000001-0000-4000-8000-000000000005', 'c', 'trà',       0, 2, @now, 'seed', 0),
('c3000002-0000-4000-8000-000000000020', 'c3000001-0000-4000-8000-000000000005', 'd', 'nước ngọt', 0, 3, @now, 'seed', 0);

-- -----------------------------------------------------------------------------
-- Lesson A — QUESTION_REF (3 câu)
-- -----------------------------------------------------------------------------
INSERT INTO `lessons` (
  `id`, `title`, `slug`, `summary`, `status`, `display_order`, `subject_id`,
  `created_at`, `created_by`, `voided`
) VALUES (
  'b2000002-0000-4000-8000-000000000010',
  'Bank demo — Lesson A (3 câu)',
  'bank-demo-lesson-a',
  'QUESTION_REF: apple, book, happy',
  'PUBLISHED', 2, @subject_en, @now, 'seed', 0
);

INSERT INTO `lesson_blocks` (
  `id`, `lesson_id`, `block_type`, `display_order`, `payload_json`,
  `created_at`, `created_by`, `voided`
) VALUES (
  'b2000002-0000-4000-8000-000000000001',
  'b2000002-0000-4000-8000-000000000010',
  'QUESTION_REF', 1,
  '{"title":"Từ vựng — Bank A","instruction":"Chọn đáp án đúng","presentation":"stepped","shuffleQuestions":false,"shuffleOptions":true,"passScorePercent":80,"refs":["c3000001-0000-4000-8000-000000000001","c3000001-0000-4000-8000-000000000002","c3000001-0000-4000-8000-000000000003"]}',
  @now, 'seed', 0
);

-- -----------------------------------------------------------------------------
-- Lesson B — QUESTION_REF (3 câu, overlap apple với Lesson A)
-- -----------------------------------------------------------------------------
INSERT INTO `lessons` (
  `id`, `title`, `slug`, `summary`, `status`, `display_order`, `subject_id`,
  `created_at`, `created_by`, `voided`
) VALUES (
  'b2000002-0000-4000-8000-000000000020',
  'Bank demo — Lesson B (3 câu, overlap)',
  'bank-demo-lesson-b',
  'QUESTION_REF: apple, school, water — sửa apple trong bank → cả A & B đổi',
  'PUBLISHED', 3, @subject_en, @now, 'seed', 0
);

INSERT INTO `lesson_blocks` (
  `id`, `lesson_id`, `block_type`, `display_order`, `payload_json`,
  `created_at`, `created_by`, `voided`
) VALUES (
  'b2000002-0000-4000-8000-000000000002',
  'b2000002-0000-4000-8000-000000000020',
  'QUESTION_REF', 1,
  '{"title":"Từ vựng — Bank B","instruction":"Chọn đáp án đúng","presentation":"stepped","shuffleQuestions":false,"shuffleOptions":true,"passScorePercent":80,"refs":["c3000001-0000-4000-8000-000000000001","c3000001-0000-4000-8000-000000000004","c3000001-0000-4000-8000-000000000005"]}',
  @now, 'seed', 0
);
