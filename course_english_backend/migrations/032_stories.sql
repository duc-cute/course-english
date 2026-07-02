-- =============================================================================
-- AI Reading Studio — Phase 1
-- Chạy SAU migrations/008_vocabulary_library.sql
--
--   mysql -u root -p course_english < migrations/032_stories.sql
--
-- Plan: docs/STORY_READING_STUDIO_PLAN.md
-- =============================================================================

USE `course_english`;

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `stories` (
  `id`                    CHAR(36)     NOT NULL,
  `title`                 VARCHAR(255) NOT NULL,
  `slug`                  VARCHAR(255) NOT NULL,
  `content`               TEXT         NOT NULL,
  `level`                 VARCHAR(16)  DEFAULT NULL COMMENT 'A1–C2',
  `reading_time_minutes`  INT          DEFAULT NULL,
  `prompt`                TEXT         DEFAULT NULL,
  `vocabulary_set_id`     CHAR(36)     DEFAULT NULL,
  `status`                VARCHAR(20)  NOT NULL DEFAULT 'DRAFT',
  `processing_status`     VARCHAR(32)  NOT NULL DEFAULT 'PENDING',
  `tokens_json`           TEXT         DEFAULT NULL,
  `is_ai_generated`       TINYINT(1)   NOT NULL DEFAULT 0,
  `created_at`            DATETIME(6)  DEFAULT NULL,
  `created_by`            VARCHAR(255) DEFAULT NULL,
  `updated_at`            DATETIME(6)  DEFAULT NULL,
  `updated_by`            VARCHAR(255) DEFAULT NULL,
  `voided`                TINYINT(1)   NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_stories_slug` (`slug`),
  KEY `idx_stories_status` (`status`),
  KEY `idx_stories_vocab_set` (`vocabulary_set_id`),
  KEY `idx_stories_voided` (`voided`),
  CONSTRAINT `fk_stories_vocab_set`
    FOREIGN KEY (`vocabulary_set_id`) REFERENCES `vocabulary_sets` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `student_notebook_entries` (
  `id`                 CHAR(36)     NOT NULL,
  `student_id`         CHAR(36)     NOT NULL,
  `word_id`            CHAR(36)     NOT NULL,
  `story_id`           CHAR(36)     NOT NULL,
  `context_sentence`   TEXT         DEFAULT NULL,
  `review_status`      VARCHAR(20)  NOT NULL DEFAULT 'NEW',
  `created_at`         DATETIME(6)  DEFAULT NULL,
  `created_by`         VARCHAR(255) DEFAULT NULL,
  `updated_at`         DATETIME(6)  DEFAULT NULL,
  `updated_by`         VARCHAR(255) DEFAULT NULL,
  `voided`             TINYINT(1)   NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_notebook_student_word_story` (`student_id`, `word_id`, `story_id`),
  KEY `idx_notebook_student` (`student_id`),
  KEY `idx_notebook_story` (`story_id`),
  KEY `idx_notebook_voided` (`voided`),
  CONSTRAINT `fk_notebook_word`
    FOREIGN KEY (`word_id`) REFERENCES `vocabulary_words` (`id`),
  CONSTRAINT `fk_notebook_story`
    FOREIGN KEY (`story_id`) REFERENCES `stories` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
