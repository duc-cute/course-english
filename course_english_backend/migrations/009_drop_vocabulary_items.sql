-- =============================================================================
-- Phase 6 — Drop legacy vocabulary_items table
-- Chạy SAU migrations/008_vocabulary_library.sql (đã migrate data sang library)
--
--   mysql -u root -p course_english < migrations/009_drop_vocabulary_items.sql
-- =============================================================================

USE `course_english`;

SET NAMES utf8mb4;

DROP TABLE IF EXISTS `vocabulary_items`;
