-- Story bilingual translations (sentence VI + word glossary)
-- Run: mysql -u root -p course_english < migrations/035_story_translations.sql

USE `course_english`;

SET NAMES utf8mb4;

ALTER TABLE `stories`
  ADD COLUMN `translations_json` TEXT DEFAULT NULL
    COMMENT 'JSON: { glossary: [{ wordKey, wordEn, meaningVi, ... }] }'
    AFTER `tokens_json`;
