-- =============================================================================
-- Course English — seed demo: Bộ từ vựng Daily words (Phase 3)
-- Chạy SAU migrations/003_vocabulary_sets.sql
-- mysql -u root -p course_english < seed_vocabulary_set_demo.sql
-- =============================================================================

USE `course_english`;

SET NAMES utf8mb4;

SET @now = NOW(6);
SET @set_id = 'c3000001-0000-4000-8000-000000000001';

DELETE FROM `vocabulary_items` WHERE `set_id` = @set_id;
DELETE FROM `vocabulary_sets` WHERE `id` = @set_id;

INSERT INTO `vocabulary_sets` (
  `id`, `title`, `description`, `status`,
  `created_at`, `created_by`, `voided`
) VALUES (
  @set_id,
  'Daily words — demo',
  'Bộ 5 từ mẫu cho Phase 3 — sinh MCQ tự động.',
  'PUBLISHED',
  @now, 'seed', 0
);

INSERT INTO `vocabulary_items` (
  `id`, `set_id`, `word_en`, `meaning_vi`, `display_order`,
  `created_at`, `created_by`, `voided`
) VALUES
  ('c3000002-0000-4000-8000-000000000001', @set_id, 'apple',  'quả táo',     0, @now, 'seed', 0),
  ('c3000002-0000-4000-8000-000000000002', @set_id, 'book',   'cuốn sách',   1, @now, 'seed', 0),
  ('c3000002-0000-4000-8000-000000000003', @set_id, 'happy',  'vui',         2, @now, 'seed', 0),
  ('c3000002-0000-4000-8000-000000000004', @set_id, 'school', 'trường học',  3, @now, 'seed', 0),
  ('c3000002-0000-4000-8000-000000000005', @set_id, 'water',  'nước',        4, @now, 'seed', 0);
