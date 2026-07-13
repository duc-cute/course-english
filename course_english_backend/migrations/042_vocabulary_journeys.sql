-- =============================================================================
-- Phase 2c — Vocabulary journeys / topics / members / classroom links
--
-- Chạy MỘT LẦN (sau 040, 041):
--   mysql -u root -p course_english < migrations/042_vocabulary_journeys.sql
--
-- Thiết kế: docs/STUDENT_VOCAB_LEARNING_PLAN.md Phase 2c
-- =============================================================================

USE `course_english`;

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `vocabulary_journeys` (
  `id`               CHAR(36)     NOT NULL,
  `title`            VARCHAR(255) NOT NULL,
  `description`      TEXT         DEFAULT NULL,
  `cover_image_url`  VARCHAR(512) DEFAULT NULL,
  `status`           VARCHAR(20)  NOT NULL DEFAULT 'DRAFT',
  `display_order`    INT          NOT NULL DEFAULT 0,
  `created_at`       DATETIME(6)  DEFAULT NULL,
  `created_by`       VARCHAR(255) DEFAULT NULL,
  `updated_at`       DATETIME(6)  DEFAULT NULL,
  `updated_by`       VARCHAR(255) DEFAULT NULL,
  `voided`           TINYINT(1)   NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_vj_status_voided` (`status`, `voided`),
  KEY `idx_vj_display_order` (`display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1 classroom = 1 journey (replace = update journey_id)
CREATE TABLE IF NOT EXISTS `vocabulary_journey_classrooms` (
  `id`            CHAR(36)     NOT NULL,
  `journey_id`    CHAR(36)     NOT NULL,
  `classroom_id`  CHAR(36)     NOT NULL,
  `created_at`    DATETIME(6)  DEFAULT NULL,
  `created_by`    VARCHAR(255) DEFAULT NULL,
  `updated_at`    DATETIME(6)  DEFAULT NULL,
  `updated_by`    VARCHAR(255) DEFAULT NULL,
  `voided`        TINYINT(1)   NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_vjc_classroom` (`classroom_id`),
  KEY `idx_vjc_journey` (`journey_id`),
  CONSTRAINT `fk_vjc_journey`
    FOREIGN KEY (`journey_id`) REFERENCES `vocabulary_journeys` (`id`),
  CONSTRAINT `fk_vjc_classroom`
    FOREIGN KEY (`classroom_id`) REFERENCES `classrooms` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `vocabulary_topics` (
  `id`               CHAR(36)     NOT NULL,
  `journey_id`       CHAR(36)     NOT NULL,
  `slug`             VARCHAR(128) DEFAULT NULL,
  `title`            VARCHAR(255) NOT NULL,
  `subtitle`         VARCHAR(255) DEFAULT NULL,
  `cover_image_url`  VARCHAR(512) DEFAULT NULL,
  `theme_color`      VARCHAR(32)  DEFAULT NULL,
  `display_order`    INT          NOT NULL DEFAULT 0,
  `status`           VARCHAR(20)  NOT NULL DEFAULT 'DRAFT',
  `created_at`       DATETIME(6)  DEFAULT NULL,
  `created_by`       VARCHAR(255) DEFAULT NULL,
  `updated_at`       DATETIME(6)  DEFAULT NULL,
  `updated_by`       VARCHAR(255) DEFAULT NULL,
  `voided`           TINYINT(1)   NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_vt_journey_order` (`journey_id`, `display_order`),
  KEY `idx_vt_status_voided` (`status`, `voided`),
  CONSTRAINT `fk_vt_journey`
    FOREIGN KEY (`journey_id`) REFERENCES `vocabulary_journeys` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `vocabulary_topic_members` (
  `id`                 CHAR(36)     NOT NULL,
  `topic_id`           CHAR(36)     NOT NULL,
  `vocabulary_set_id`  CHAR(36)     NOT NULL,
  `display_order`      INT          NOT NULL DEFAULT 0,
  `created_at`         DATETIME(6)  DEFAULT NULL,
  `created_by`         VARCHAR(255) DEFAULT NULL,
  `updated_at`         DATETIME(6)  DEFAULT NULL,
  `updated_by`         VARCHAR(255) DEFAULT NULL,
  `voided`             TINYINT(1)   NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_vtm_topic_set` (`topic_id`, `vocabulary_set_id`),
  KEY `idx_vtm_set` (`vocabulary_set_id`),
  CONSTRAINT `fk_vtm_topic`
    FOREIGN KEY (`topic_id`) REFERENCES `vocabulary_topics` (`id`),
  CONSTRAINT `fk_vtm_set`
    FOREIGN KEY (`vocabulary_set_id`) REFERENCES `vocabulary_sets` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
