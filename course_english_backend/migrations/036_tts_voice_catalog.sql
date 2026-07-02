-- Story voice catalog and per-story voice profile map
-- Run: mysql -u root -p course_english < migrations/036_tts_voice_catalog.sql

USE `course_english`;

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `tts_voice_catalog` (
  `id`            CHAR(36)     NOT NULL,
  `provider`      VARCHAR(32)  NOT NULL DEFAULT 'edge',
  `voice_id`      VARCHAR(128) NOT NULL,
  `display_name`  VARCHAR(255) NOT NULL,
  `profile_key`   VARCHAR(64)  DEFAULT NULL COMMENT 'NARRATOR, MALE_ADULT, FEMALE_ADULT, BOY_CHILD, GIRL_CHILD',
  `gender`        VARCHAR(16)  DEFAULT NULL COMMENT 'male, female, neutral',
  `age_group`     VARCHAR(16)  DEFAULT NULL COMMENT 'child, teen, adult, elder',
  `priority`      INT          NOT NULL DEFAULT 100,
  `active`        TINYINT(1)   NOT NULL DEFAULT 1,
  `notes`         VARCHAR(512) DEFAULT NULL,
  `created_at`    DATETIME(6)  DEFAULT NULL,
  `created_by`    VARCHAR(255) DEFAULT NULL,
  `updated_at`    DATETIME(6)  DEFAULT NULL,
  `updated_by`    VARCHAR(255) DEFAULT NULL,
  `voided`        TINYINT(1)   NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tts_voice_catalog_provider_voice` (`provider`, `voice_id`),
  KEY `idx_tts_voice_catalog_profile` (`profile_key`),
  KEY `idx_tts_voice_catalog_active` (`active`),
  KEY `idx_tts_voice_catalog_voided` (`voided`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `stories`
  ADD COLUMN `voice_profile_json` TEXT DEFAULT NULL
    COMMENT 'JSON mapping profile key -> catalog voice id'
    AFTER `translations_json`;

INSERT INTO `tts_voice_catalog` (`id`, `provider`, `voice_id`, `display_name`, `profile_key`, `gender`, `age_group`, `priority`, `active`, `notes`, `created_at`, `created_by`, `voided`)
SELECT '2ef8772f-a6bd-4335-85a2-36f5f2863890', 'edge', 'en-US-AriaNeural', 'Aria (US Female)', 'NARRATOR', 'female', 'adult', 10, 1, 'Default narrator', NOW(6), 'system', 0
WHERE NOT EXISTS (
  SELECT 1 FROM `tts_voice_catalog` WHERE `provider`='edge' AND `voice_id`='en-US-AriaNeural'
);

INSERT INTO `tts_voice_catalog` (`id`, `provider`, `voice_id`, `display_name`, `profile_key`, `gender`, `age_group`, `priority`, `active`, `notes`, `created_at`, `created_by`, `voided`)
SELECT '85f38e72-3f92-4f2b-893f-a379dcb8dc7b', 'edge', 'en-US-GuyNeural', 'Guy (US Male)', 'MALE_ADULT', 'male', 'adult', 10, 1, 'Male adult profile', NOW(6), 'system', 0
WHERE NOT EXISTS (
  SELECT 1 FROM `tts_voice_catalog` WHERE `provider`='edge' AND `voice_id`='en-US-GuyNeural'
);

INSERT INTO `tts_voice_catalog` (`id`, `provider`, `voice_id`, `display_name`, `profile_key`, `gender`, `age_group`, `priority`, `active`, `notes`, `created_at`, `created_by`, `voided`)
SELECT '0756cf62-b7b7-4b2f-9645-2ab6f9725fda', 'edge', 'en-US-JennyNeural', 'Jenny (US Female)', 'FEMALE_ADULT', 'female', 'adult', 10, 1, 'Female adult profile', NOW(6), 'system', 0
WHERE NOT EXISTS (
  SELECT 1 FROM `tts_voice_catalog` WHERE `provider`='edge' AND `voice_id`='en-US-JennyNeural'
);

INSERT INTO `tts_voice_catalog` (`id`, `provider`, `voice_id`, `display_name`, `profile_key`, `gender`, `age_group`, `priority`, `active`, `notes`, `created_at`, `created_by`, `voided`)
SELECT '9922814d-b1bf-4bf8-9616-aad3f2d95cb5', 'edge', 'en-GB-RyanNeural', 'Ryan (UK Male)', 'BOY_CHILD', 'male', 'child', 20, 1, 'Boy/young male fallback', NOW(6), 'system', 0
WHERE NOT EXISTS (
  SELECT 1 FROM `tts_voice_catalog` WHERE `provider`='edge' AND `voice_id`='en-GB-RyanNeural'
);

INSERT INTO `tts_voice_catalog` (`id`, `provider`, `voice_id`, `display_name`, `profile_key`, `gender`, `age_group`, `priority`, `active`, `notes`, `created_at`, `created_by`, `voided`)
SELECT '6d2b56e5-3d0f-4f8f-a401-f816f7096ca1', 'edge', 'en-GB-SoniaNeural', 'Sonia (UK Female)', 'GIRL_CHILD', 'female', 'child', 20, 1, 'Girl/young female fallback', NOW(6), 'system', 0
WHERE NOT EXISTS (
  SELECT 1 FROM `tts_voice_catalog` WHERE `provider`='edge' AND `voice_id`='en-GB-SoniaNeural'
);

INSERT INTO `tts_voice_catalog` (`id`, `provider`, `voice_id`, `display_name`, `profile_key`, `gender`, `age_group`, `priority`, `active`, `notes`, `created_at`, `created_by`, `voided`)
SELECT 'de99ec0e-5bcc-4534-a925-a6a11471317f', 'elevenlabs', 'IRHApOXLvnW57QJPQH2P', 'Adam', 'MALE_ADULT', 'male', 'adult', 10, 1, 'Adult male voice', NOW(6), 'system', 0
WHERE NOT EXISTS (
  SELECT 1 FROM `tts_voice_catalog` WHERE `provider`='elevenlabs' AND `voice_id`='IRHApOXLvnW57QJPQH2P'
);

INSERT INTO `tts_voice_catalog` (`id`, `provider`, `voice_id`, `display_name`, `profile_key`, `gender`, `age_group`, `priority`, `active`, `notes`, `created_at`, `created_by`, `voided`)
SELECT '69bb3e5a-d0e2-4ecd-83b2-8114d5ad5f7a', 'elevenlabs', 'XJ2fW4ybq7HouelYYGcL', 'Cherry Twinkle', 'GIRL_CHILD', 'female', 'teen', 10, 1, 'Young playful female (~16)', NOW(6), 'system', 0
WHERE NOT EXISTS (
  SELECT 1 FROM `tts_voice_catalog` WHERE `provider`='elevenlabs' AND `voice_id`='XJ2fW4ybq7HouelYYGcL'
);

INSERT INTO `tts_voice_catalog` (`id`, `provider`, `voice_id`, `display_name`, `profile_key`, `gender`, `age_group`, `priority`, `active`, `notes`, `created_at`, `created_by`, `voided`)
SELECT '16f4108f-9218-4453-a4b7-bef7f849d9cf', 'elevenlabs', 'tnVKC6NjwhdRxoQIfKue', 'Lyan', 'FEMALE_ADULT', 'female', 'adult', 10, 1, 'Adult female voice', NOW(6), 'system', 0
WHERE NOT EXISTS (
  SELECT 1 FROM `tts_voice_catalog` WHERE `provider`='elevenlabs' AND `voice_id`='tnVKC6NjwhdRxoQIfKue'
);

INSERT INTO `tts_voice_catalog` (`id`, `provider`, `voice_id`, `display_name`, `profile_key`, `gender`, `age_group`, `priority`, `active`, `notes`, `created_at`, `created_by`, `voided`)
SELECT 'b251027a-96c7-4da4-b3e9-94029defb7d3', 'elevenlabs', 'b8gbDO0ybjX1VA89pBdX', 'Ruby Roo', 'FEMALE_ADULT', 'female', 'adult', 20, 1, 'Adult female voice', NOW(6), 'system', 0
WHERE NOT EXISTS (
  SELECT 1 FROM `tts_voice_catalog` WHERE `provider`='elevenlabs' AND `voice_id`='b8gbDO0ybjX1VA89pBdX'
);

INSERT INTO `tts_voice_catalog` (`id`, `provider`, `voice_id`, `display_name`, `profile_key`, `gender`, `age_group`, `priority`, `active`, `notes`, `created_at`, `created_by`, `voided`)
SELECT '34674f5b-a9b7-4f97-b90f-c111821307eb', 'elevenlabs', 'DODLEQrClDo8wCz460ld', 'Lauren', 'FEMALE_ADULT', 'female', 'adult', 30, 1, 'Adult female voice', NOW(6), 'system', 0
WHERE NOT EXISTS (
  SELECT 1 FROM `tts_voice_catalog` WHERE `provider`='elevenlabs' AND `voice_id`='DODLEQrClDo8wCz460ld'
);

INSERT INTO `tts_voice_catalog` (`id`, `provider`, `voice_id`, `display_name`, `profile_key`, `gender`, `age_group`, `priority`, `active`, `notes`, `created_at`, `created_by`, `voided`)
SELECT 'e9f6f6b7-a1ec-49de-8012-b9b11dcf7ca8', 'elevenlabs', 'dHd5gvgSOzSfduK4CvEg', 'Ed', 'NARRATOR', 'male', 'adult', 10, 1, 'Storytelling adult male narrator', NOW(6), 'system', 0
WHERE NOT EXISTS (
  SELECT 1 FROM `tts_voice_catalog` WHERE `provider`='elevenlabs' AND `voice_id`='dHd5gvgSOzSfduK4CvEg'
);
