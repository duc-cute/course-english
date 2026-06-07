-- =============================================================================
-- Phase 3.1 — Vocabulary Sets (Method 4)
-- Bộ từ vựng + từng mục (word | meaning)
--
-- Chạy MỘT LẦN:
--   mysql -u root -p course_english < migrations/003_vocabulary_sets.sql
--
-- Thiết kế: docs/VOCABULARY_SET_DB_DESIGN.md
-- =============================================================================

USE `course_english`;

SET NAMES utf8mb4;

-- -----------------------------------------------------------------------------
-- vocabulary_sets — một bộ từ (knowledge asset)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `vocabulary_sets` (
  `id`            CHAR(36)     NOT NULL,
  `title`         VARCHAR(255) NOT NULL,
  `description`   TEXT         DEFAULT NULL,
  `subject_id`    CHAR(36)     DEFAULT NULL COMMENT 'Optional link to subjects',
  `status`        VARCHAR(20)  NOT NULL DEFAULT 'DRAFT',
  `created_at`    DATETIME(6)  DEFAULT NULL,
  `created_by`    VARCHAR(255) DEFAULT NULL,
  `updated_at`    DATETIME(6)  DEFAULT NULL,
  `updated_by`    VARCHAR(255) DEFAULT NULL,
  `voided`        TINYINT(1)   NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_vocabulary_sets_status` (`status`),
  KEY `idx_vocabulary_sets_subject` (`subject_id`),
  KEY `idx_vocabulary_sets_voided` (`voided`),
  CONSTRAINT `fk_vocabulary_sets_subject`
    FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- vocabulary_items — từng cặp word | meaning trong bộ
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `vocabulary_items` (
  `id`             CHAR(36)     NOT NULL,
  `set_id`         CHAR(36)     NOT NULL,
  `word_en`        VARCHAR(255) NOT NULL,
  `meaning_vi`     TEXT         NOT NULL,
  `phonetic`       VARCHAR(128) DEFAULT NULL,
  `image_asset_id` CHAR(36)     DEFAULT NULL,
  `audio_asset_id` CHAR(36)     DEFAULT NULL,
  `display_order`  INT          NOT NULL DEFAULT 0,
  `created_at`     DATETIME(6)  DEFAULT NULL,
  `created_by`     VARCHAR(255) DEFAULT NULL,
  `updated_at`     DATETIME(6)  DEFAULT NULL,
  `updated_by`     VARCHAR(255) DEFAULT NULL,
  `voided`         TINYINT(1)   NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_vocabulary_items_set` (`set_id`),
  KEY `idx_vocabulary_items_voided` (`voided`),
  CONSTRAINT `fk_vocabulary_items_set`
    FOREIGN KEY (`set_id`) REFERENCES `vocabulary_sets` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
