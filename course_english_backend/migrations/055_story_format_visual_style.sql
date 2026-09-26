-- =============================================================================
-- AI Reading Studio — Phase 6 Truyện tự sự (MONOLOGUE)
-- Chạy SAU migrations/052_story_illustrations.sql
--
--   mysql -u root -p course_english < migrations/055_story_format_visual_style.sql
--
-- Plan: docs/STORY_READING_STUDIO_PLAN.md (Phase 6)
-- =============================================================================

USE `course_english`;

SET NAMES utf8mb4;

ALTER TABLE `stories`
  ADD COLUMN IF NOT EXISTS `story_format` VARCHAR(20) NOT NULL DEFAULT 'STORYBOOK'
    COMMENT 'STORYBOOK|MONOLOGUE';

ALTER TABLE `stories`
  ADD COLUMN IF NOT EXISTS `visual_style` VARCHAR(32) NOT NULL DEFAULT 'PASTEL_STORYBOOK'
    COMMENT 'PASTEL_STORYBOOK|INK_SKETCH';
