-- Allow AUDIO_FAILED on stories.processing_status (Phase 2 audio error handling).
-- Fixes: Data truncated for column 'processing_status' when saving AUDIO_FAILED.
--
-- Run after 037_story_audio_error.sql:
--   mysql -u root -p course_english < migrations/038_story_processing_status_audio_failed.sql

USE `course_english`;

SET NAMES utf8mb4;

-- Ensure audio_last_error exists (idempotent if 037 already applied)
SET @col_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'stories'
      AND COLUMN_NAME = 'audio_last_error'
);
SET @sql_add_error = IF(
    @col_exists = 0,
    'ALTER TABLE stories ADD COLUMN audio_last_error TEXT NULL COMMENT ''Last TTS generation error'' AFTER voice_profile_json',
    'SELECT 1'
);
PREPARE stmt FROM @sql_add_error;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- VARCHAR(32) — supports AUDIO_FAILED (12 chars) and future values; replaces tight ENUM if any
ALTER TABLE stories
    MODIFY COLUMN processing_status VARCHAR(32) NOT NULL DEFAULT 'PENDING'
    COMMENT 'PENDING | TOKENIZED | AUDIO_READY | AUDIO_FAILED';
