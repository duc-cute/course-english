-- =============================================================================
-- Course English — seed demo: Bộ từ vựng Daily words
-- Chạy SAU migrations/003 + 008 (vocabulary library)
-- mysql -u root -p course_english < seed_vocabulary_set_demo.sql
-- =============================================================================

USE `course_english`;

SET NAMES utf8mb4;

SET @now = NOW(6);
SET @set_id = 'c3000001-0000-4000-8000-000000000001';

DELETE FROM `vocabulary_set_members` WHERE `set_id` = @set_id;
DELETE FROM `vocabulary_sets` WHERE `id` = @set_id;

INSERT INTO `vocabulary_sets` (
  `id`, `title`, `description`, `status`,
  `created_at`, `created_by`, `voided`
) VALUES (
  @set_id,
  'Daily words — demo',
  'Bộ 5 từ mẫu — sinh MCQ tự động.',
  'PUBLISHED',
  @now, 'seed', 0
);

INSERT INTO `vocabulary_words` (
  `id`, `word_key`, `word_en`, `meaning_vi`,
  `created_at`, `created_by`, `voided`
) VALUES
  ('c3000002-0000-4000-8000-000000000001', 'apple',  'apple',  'quả táo',     @now, 'seed', 0),
  ('c3000002-0000-4000-8000-000000000002', 'book',   'book',   'cuốn sách',   @now, 'seed', 0),
  ('c3000002-0000-4000-8000-000000000003', 'happy',  'happy',  'vui',         @now, 'seed', 0),
  ('c3000002-0000-4000-8000-000000000004', 'school', 'school', 'trường học',  @now, 'seed', 0),
  ('c3000002-0000-4000-8000-000000000005', 'water',  'water',  'nước',        @now, 'seed', 0)
ON DUPLICATE KEY UPDATE
  `meaning_vi` = VALUES(`meaning_vi`),
  `updated_at` = @now,
  `updated_by` = 'seed';

INSERT INTO `vocabulary_set_members` (
  `id`, `set_id`, `word_id`, `display_order`,
  `created_at`, `created_by`, `voided`
) VALUES
  ('c3000003-0000-4000-8000-000000000001', @set_id, 'c3000002-0000-4000-8000-000000000001', 0, @now, 'seed', 0),
  ('c3000003-0000-4000-8000-000000000002', @set_id, 'c3000002-0000-4000-8000-000000000002', 1, @now, 'seed', 0),
  ('c3000003-0000-4000-8000-000000000003', @set_id, 'c3000002-0000-4000-8000-000000000003', 2, @now, 'seed', 0),
  ('c3000003-0000-4000-8000-000000000004', @set_id, 'c3000002-0000-4000-8000-000000000004', 3, @now, 'seed', 0),
  ('c3000003-0000-4000-8000-000000000005', @set_id, 'c3000002-0000-4000-8000-000000000005', 4, @now, 'seed', 0);
