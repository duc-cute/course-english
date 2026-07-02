-- =============================================================================
-- AI Reading Studio — Story cover image
-- =============================================================================

USE `course_english`;

ALTER TABLE `stories`
  ADD COLUMN IF NOT EXISTS `cover_image_url` VARCHAR(1024) DEFAULT NULL AFTER `prompt`;

