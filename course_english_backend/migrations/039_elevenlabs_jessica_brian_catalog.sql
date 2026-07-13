-- Reset ElevenLabs voice catalog: Jessica (female) + Brian (male narrator)
-- Run: mysql -u root -p course_english < migrations/039_elevenlabs_jessica_brian_catalog.sql
--
-- Keeps Edge voices for TTS fallback. Voids old ElevenLabs rows (Ed, Adam, Lyan, …).
-- After run: re-open each story in Admin and confirm voice profile dropdowns, then re-generate audio.

USE `course_english`;

SET NAMES utf8mb4;

UPDATE `tts_voice_catalog`
SET `voided` = 1,
    `active` = 0,
    `updated_at` = NOW(6),
    `updated_by` = 'migration-039'
WHERE `provider` = 'elevenlabs'
  AND `voided` = 0;

INSERT INTO `tts_voice_catalog` (
  `id`, `provider`, `voice_id`, `display_name`, `profile_key`,
  `gender`, `age_group`, `priority`, `active`, `notes`,
  `created_at`, `created_by`, `voided`
)
SELECT
  'b7c2e4f1-8a3d-4e56-9c1a-2f8d6b4e9012',
  'elevenlabs',
  'nPczCjzI2devNBz1zQrb',
  'Brian - Deep, Resonant and Comforting',
  'NARRATOR',
  'male',
  'adult',
  10,
  1,
  'Default ElevenLabs narrator (male adult). Map MALE_ADULT to same voice in story profile if needed.',
  NOW(6),
  'migration-039',
  0
WHERE NOT EXISTS (
  SELECT 1 FROM `tts_voice_catalog`
  WHERE `provider` = 'elevenlabs' AND `voice_id` = 'nPczCjzI2devNBz1zQrb' AND `voided` = 0
);

INSERT INTO `tts_voice_catalog` (
  `id`, `provider`, `voice_id`, `display_name`, `profile_key`,
  `gender`, `age_group`, `priority`, `active`, `notes`,
  `created_at`, `created_by`, `voided`
)
SELECT
  'a9d1f3e5-6b2c-4a78-8d4e-1c5f7a9b3021',
  'elevenlabs',
  'cgSgspJ2msm6clMCkdW9',
  'Jessica - Playful, Bright, Warm',
  'FEMALE_ADULT',
  'female',
  'adult',
  10,
  1,
  'ElevenLabs female adult (premade).',
  NOW(6),
  'migration-039',
  0
WHERE NOT EXISTS (
  SELECT 1 FROM `tts_voice_catalog`
  WHERE `provider` = 'elevenlabs' AND `voice_id` = 'cgSgspJ2msm6clMCkdW9' AND `voided` = 0
);

-- Stories still pointing at voided voices (e.g. Ed) need profile refresh in Admin UI.
-- Suggested voice_profile_json after edit:
--   NARRATOR     -> elevenlabs / nPczCjzI2devNBz1zQrb (Brian)
--   MALE_ADULT   -> elevenlabs / nPczCjzI2devNBz1zQrb (Brian)
--   FEMALE_ADULT -> elevenlabs / cgSgspJ2msm6clMCkdW9 (Jessica)
