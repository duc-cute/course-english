-- =============================================================================
-- Storybook illustration model: FLUX.2 Klein 4B
--
--   mysql -u root -p course_english < migrations/053_story_illustration_model_config.sql
-- =============================================================================

USE `course_english`;

SET NAMES utf8mb4;

-- Cover image model (shared fallback)
UPDATE `system_configs`
SET `config_value` = 'black-forest-labs/flux.2-klein-4b',
    `note` = 'Model sinh ảnh cover/story — flux.2-klein-4b',
    `updated_at` = NOW(6)
WHERE `config_key` = 'AI_VOCAB_SET_COVER_IMAGE_MODEL'
  AND `voided` = 0;

-- Dedicated story illustration model
INSERT INTO `system_configs` (`id`, `config_key`, `config_value`, `note`, `created_at`, `created_by`, `voided`)
SELECT UUID(), 'AI_STORY_ILLUSTRATION_MODEL', 'black-forest-labs/flux.2-klein-4b',
       'Model sinh ảnh storybook scenes / character sheets', NOW(6), 'system', 0
WHERE NOT EXISTS (
  SELECT 1 FROM `system_configs`
  WHERE `config_key` = 'AI_STORY_ILLUSTRATION_MODEL' AND `voided` = 0
);

UPDATE `system_configs`
SET `config_value` = 'black-forest-labs/flux.2-klein-4b',
    `updated_at` = NOW(6)
WHERE `config_key` = 'AI_STORY_ILLUSTRATION_MODEL'
  AND `voided` = 0;

INSERT INTO `system_configs` (`id`, `config_key`, `config_value`, `note`, `created_at`, `created_by`, `voided`)
SELECT UUID(), 'AI_STORY_ILLUSTRATION_TIMEOUT_SEC', '180',
       'Timeout (giây) cho sinh ảnh storybook', NOW(6), 'system', 0
WHERE NOT EXISTS (
  SELECT 1 FROM `system_configs`
  WHERE `config_key` = 'AI_STORY_ILLUSTRATION_TIMEOUT_SEC' AND `voided` = 0
);
