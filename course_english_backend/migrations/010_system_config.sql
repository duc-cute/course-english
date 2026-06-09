-- =============================================================================
-- System configuration — feature toggles & global settings
-- mysql -u root -p course_english < migrations/010_system_config.sql
-- =============================================================================

USE `course_english`;

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `system_configs` (
  `id`           CHAR(36)     NOT NULL,
  `config_key`   VARCHAR(128) NOT NULL COMMENT 'UPPER_SNAKE_CASE unique key',
  `config_value` TEXT         DEFAULT NULL,
  `note`         TEXT         DEFAULT NULL,
  `created_at`   DATETIME(6)  DEFAULT NULL,
  `created_by`   VARCHAR(255) DEFAULT NULL,
  `updated_at`   DATETIME(6)  DEFAULT NULL,
  `updated_by`   VARCHAR(255) DEFAULT NULL,
  `voided`       TINYINT(1)   NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_system_configs_config_key` (`config_key`),
  KEY `idx_system_configs_voided` (`voided`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
