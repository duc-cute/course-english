-- Phase 2 — AI document upload + question generation tasks
-- mysql -u root -p course_english < migrations/022_ai_documents_tasks.sql

USE `course_english`;

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `ai_documents` (
  `id`                CHAR(36)     NOT NULL,
  `user_id`           CHAR(36)     NOT NULL,
  `file_name`         VARCHAR(255) NOT NULL,
  `mime_type`         VARCHAR(128) DEFAULT NULL,
  `storage_folder`    VARCHAR(128) NOT NULL,
  `storage_file_name` VARCHAR(255) NOT NULL,
  `file_size_bytes`   BIGINT       DEFAULT NULL,
  `page_count`        INT          DEFAULT NULL,
  `extracted_text`    LONGTEXT     DEFAULT NULL,
  `status`            VARCHAR(20)  NOT NULL DEFAULT 'UPLOADED',
  `error_message`     TEXT         DEFAULT NULL,
  `created_at`        DATETIME(6)  DEFAULT NULL,
  `created_by`        VARCHAR(255) DEFAULT NULL,
  `updated_at`        DATETIME(6)  DEFAULT NULL,
  `updated_by`        VARCHAR(255) DEFAULT NULL,
  `voided`            TINYINT(1)   NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_ai_doc_user` (`user_id`, `created_at`),
  KEY `idx_ai_doc_status` (`status`),
  CONSTRAINT `fk_ai_doc_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ai_tasks` (
  `id`                 CHAR(36)     NOT NULL,
  `user_id`            CHAR(36)     NOT NULL,
  `conversation_id`    CHAR(36)     DEFAULT NULL,
  `document_id`        CHAR(36)     DEFAULT NULL,
  `task_type`          VARCHAR(32)  NOT NULL,
  `status`             VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
  `input_json`         TEXT         DEFAULT NULL,
  `output_json`        LONGTEXT     DEFAULT NULL,
  `model`              VARCHAR(64)  DEFAULT NULL,
  `prompt_tokens`      INT          DEFAULT NULL,
  `completion_tokens`  INT          DEFAULT NULL,
  `error_message`      TEXT         DEFAULT NULL,
  `started_at`         DATETIME(6)  DEFAULT NULL,
  `finished_at`        DATETIME(6)  DEFAULT NULL,
  `created_at`         DATETIME(6)  DEFAULT NULL,
  `created_by`         VARCHAR(255) DEFAULT NULL,
  `updated_at`         DATETIME(6)  DEFAULT NULL,
  `updated_by`         VARCHAR(255) DEFAULT NULL,
  `voided`             TINYINT(1)   NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_ai_task_user` (`user_id`, `created_at`),
  KEY `idx_ai_task_status` (`status`),
  KEY `idx_ai_task_document` (`document_id`),
  CONSTRAINT `fk_ai_task_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_ai_task_document` FOREIGN KEY (`document_id`) REFERENCES `ai_documents` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
