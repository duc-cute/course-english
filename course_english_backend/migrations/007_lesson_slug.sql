-- =============================================================================
-- Course English — lesson slug (friendly student URLs)
-- mysql -u root -p course_english < migrations/007_lesson_slug.sql
-- =============================================================================

USE `course_english`;

SET NAMES utf8mb4;

ALTER TABLE `lessons`
  ADD COLUMN `slug` VARCHAR(64) NULL AFTER `title`;

-- Backfill known demo lessons (idempotent)
UPDATE `lessons` SET `slug` = 'tu-vung-demo-daily-words'
  WHERE `id` = 'b2000001-0000-4000-8000-000000000010' AND (`slug` IS NULL OR `slug` = '');

UPDATE `lessons` SET `slug` = 'bank-demo-lesson-a'
  WHERE `id` = 'b2000002-0000-4000-8000-000000000010' AND (`slug` IS NULL OR `slug` = '');

UPDATE `lessons` SET `slug` = 'bank-demo-lesson-b'
  WHERE `id` = 'b2000002-0000-4000-8000-000000000020' AND (`slug` IS NULL OR `slug` = '');

-- Remaining rows: temporary slug from id until app backfill runs on startup
UPDATE `lessons`
SET `slug` = CONCAT('lesson-', LOWER(SUBSTRING(REPLACE(`id`, '-', ''), 1, 24)))
WHERE `slug` IS NULL OR `slug` = '';

ALTER TABLE `lessons`
  MODIFY COLUMN `slug` VARCHAR(64) NOT NULL;

CREATE UNIQUE INDEX `uk_lessons_slug` ON `lessons` (`slug`);
