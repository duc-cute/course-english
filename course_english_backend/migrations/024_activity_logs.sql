-- =============================================================================
-- Activity logs — error / audit trail (AI monitoring first)
--
--   mysql -u root -p course_english < migrations/024_activity_logs.sql
-- =============================================================================

USE `course_english`;

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id`              CHAR(36)     NOT NULL,
  `severity`        VARCHAR(16)  NOT NULL,
  `module`          VARCHAR(40)  NOT NULL,
  `action`          VARCHAR(80)  NOT NULL,
  `message`         VARCHAR(500) NOT NULL,
  `detail`          TEXT         DEFAULT NULL,
  `context_json`    TEXT         DEFAULT NULL,
  `ref_type`        VARCHAR(40)  DEFAULT NULL,
  `ref_id`          CHAR(36)     DEFAULT NULL,
  `http_method`     VARCHAR(10)  DEFAULT NULL,
  `request_path`    VARCHAR(255) DEFAULT NULL,
  `http_status`     INT          DEFAULT NULL,
  `user_id`         CHAR(36)     DEFAULT NULL,
  `occurred_at`     DATETIME(6)  NOT NULL,
  `created_at`      DATETIME(6)  DEFAULT NULL,
  `created_by`      VARCHAR(255) DEFAULT NULL,
  `updated_at`      DATETIME(6)  DEFAULT NULL,
  `updated_by`      VARCHAR(255) DEFAULT NULL,
  `voided`          TINYINT(1)   NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_activity_log_occurred` (`occurred_at`),
  KEY `idx_activity_log_severity` (`severity`, `occurred_at`),
  KEY `idx_activity_log_module` (`module`, `action`, `occurred_at`),
  KEY `idx_activity_log_user` (`user_id`, `occurred_at`),
  KEY `idx_activity_log_ref` (`ref_type`, `ref_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
