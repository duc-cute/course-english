-- =============================================================================
-- Phase 1 — Vocabulary Library (central words + set membership)
-- Chạy SAU migrations/003_vocabulary_sets.sql
--
--   mysql -u root -p course_english < migrations/008_vocabulary_library.sql
--
-- Thiết kế: docs/VOCABULARY_LIBRARY_DICTIONARY_PROGRESS.md
-- =============================================================================

USE `course_english`;

SET NAMES utf8mb4;

-- -----------------------------------------------------------------------------
-- vocabulary_words — thư viện từ trung tâm (1 từ unique theo word_key)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `vocabulary_words` (
  `id`                CHAR(36)     NOT NULL,
  `word_key`          VARCHAR(255) NOT NULL COMMENT 'lower(trim(word_en))',
  `word_en`           VARCHAR(255) NOT NULL,
  `meaning_vi`        TEXT         NOT NULL,
  `phonetic`          VARCHAR(128) DEFAULT NULL,
  `audio_uk_url`      VARCHAR(512) DEFAULT NULL,
  `audio_us_url`      VARCHAR(512) DEFAULT NULL,
  `part_of_speech`    VARCHAR(64)  DEFAULT NULL,
  `example_sentence`  TEXT         DEFAULT NULL,
  `image_asset_id`    CHAR(36)     DEFAULT NULL,
  `audio_asset_id`    CHAR(36)     DEFAULT NULL COMMENT 'Legacy / future internal storage',
  `enriched_at`       DATETIME(6)  DEFAULT NULL,
  `enrich_source`     VARCHAR(64)  DEFAULT NULL,
  `created_at`        DATETIME(6)  DEFAULT NULL,
  `created_by`        VARCHAR(255) DEFAULT NULL,
  `updated_at`        DATETIME(6)  DEFAULT NULL,
  `updated_by`        VARCHAR(255) DEFAULT NULL,
  `voided`            TINYINT(1)   NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_vocabulary_words_word_key` (`word_key`),
  KEY `idx_vocabulary_words_voided` (`voided`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- vocabulary_set_members — bộ từ tham chiếu từ thư viện (nhóm + thứ tự)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `vocabulary_set_members` (
  `id`             CHAR(36) NOT NULL,
  `set_id`         CHAR(36) NOT NULL,
  `word_id`        CHAR(36) NOT NULL,
  `display_order`  INT      NOT NULL DEFAULT 0,
  `created_at`     DATETIME(6)  DEFAULT NULL,
  `created_by`     VARCHAR(255) DEFAULT NULL,
  `updated_at`     DATETIME(6)  DEFAULT NULL,
  `updated_by`     VARCHAR(255) DEFAULT NULL,
  `voided`         TINYINT(1)   NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_vsm_set_word` (`set_id`, `word_id`),
  KEY `idx_vsm_set_order` (`set_id`, `display_order`),
  KEY `idx_vsm_word` (`word_id`),
  KEY `idx_vsm_voided` (`voided`),
  CONSTRAINT `fk_vsm_set`
    FOREIGN KEY (`set_id`) REFERENCES `vocabulary_sets` (`id`),
  CONSTRAINT `fk_vsm_word`
    FOREIGN KEY (`word_id`) REFERENCES `vocabulary_words` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Migrate vocabulary_items → vocabulary_words (dedupe word_key) + members
-- Idempotent: skip rows already migrated
-- -----------------------------------------------------------------------------

INSERT INTO `vocabulary_words` (
  `id`, `word_key`, `word_en`, `meaning_vi`, `phonetic`,
  `image_asset_id`, `audio_asset_id`,
  `created_at`, `created_by`, `voided`
)
SELECT
  UUID(),
  ranked.`word_key`,
  ranked.`word_en`,
  ranked.`meaning_vi`,
  ranked.`phonetic`,
  ranked.`image_asset_id`,
  ranked.`audio_asset_id`,
  ranked.`created_at`,
  ranked.`created_by`,
  0
FROM (
  SELECT
    vi.`word_en`,
    vi.`meaning_vi`,
    vi.`phonetic`,
    vi.`image_asset_id`,
    vi.`audio_asset_id`,
    vi.`created_at`,
    vi.`created_by`,
    LOWER(TRIM(vi.`word_en`)) AS `word_key`,
    ROW_NUMBER() OVER (
      PARTITION BY LOWER(TRIM(vi.`word_en`))
      ORDER BY vi.`created_at`, vi.`display_order`, vi.`id`
    ) AS `rn`
  FROM `vocabulary_items` vi
  WHERE vi.`voided` = 0
) ranked
WHERE ranked.`rn` = 1
  AND ranked.`word_key` <> ''
  AND NOT EXISTS (
    SELECT 1 FROM `vocabulary_words` w WHERE w.`word_key` = ranked.`word_key`
  );

INSERT INTO `vocabulary_set_members` (
  `id`, `set_id`, `word_id`, `display_order`,
  `created_at`, `created_by`, `voided`
)
SELECT
  vi.`id`,
  vi.`set_id`,
  vw.`id`,
  vi.`display_order`,
  vi.`created_at`,
  vi.`created_by`,
  0
FROM `vocabulary_items` vi
INNER JOIN `vocabulary_words` vw
  ON vw.`word_key` = LOWER(TRIM(vi.`word_en`))
 AND vw.`voided` = 0
LEFT JOIN `vocabulary_set_members` m ON m.`id` = vi.`id`
WHERE vi.`voided` = 0
  AND m.`id` IS NULL;
