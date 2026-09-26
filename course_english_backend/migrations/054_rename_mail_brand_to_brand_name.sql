-- =============================================================================
-- Rename system config MAIL_BRAND_NAME → BRAND_NAME (shared brand)
--
--   mysql -u root -p course_english < migrations/054_rename_mail_brand_to_brand_name.sql
-- =============================================================================

USE `course_english`;

SET NAMES utf8mb4;

-- Case 1: only legacy key exists → rename in place
UPDATE `system_configs`
SET `config_key` = 'BRAND_NAME',
    `note` = 'Tên thương hiệu hiển thị trên app, email và thông báo (ví dụ: MT English)',
    `config_value` = CASE
        WHEN LOWER(TRIM(`config_value`)) = 'nova english' THEN 'MT English'
        ELSE `config_value`
    END,
    `updated_at` = NOW(6)
WHERE `config_key` = 'MAIL_BRAND_NAME'
  AND `voided` = 0
  AND NOT EXISTS (
    SELECT 1 FROM (
      SELECT 1 AS x FROM `system_configs`
      WHERE `config_key` = 'BRAND_NAME' AND `voided` = 0
    ) t
  );

-- Case 2: both keys exist → void legacy
UPDATE `system_configs`
SET `voided` = 1,
    `updated_at` = NOW(6)
WHERE `config_key` = 'MAIL_BRAND_NAME'
  AND `voided` = 0;

-- Ensure BRAND_NAME row exists
INSERT INTO `system_configs` (`id`, `config_key`, `config_value`, `note`, `created_at`, `created_by`, `voided`)
SELECT UUID(), 'BRAND_NAME', 'MT English',
       'Tên thương hiệu hiển thị trên app, email và thông báo (ví dụ: MT English)', NOW(6), 'system', 0
WHERE NOT EXISTS (
  SELECT 1 FROM `system_configs`
  WHERE `config_key` = 'BRAND_NAME' AND `voided` = 0
);

-- Soft-update known old brand display values
UPDATE `system_configs`
SET `config_value` = 'MT English',
    `note` = 'Tên thương hiệu hiển thị trên app, email và thông báo (ví dụ: MT English)',
    `updated_at` = NOW(6)
WHERE `config_key` = 'BRAND_NAME'
  AND `voided` = 0
  AND LOWER(TRIM(`config_value`)) IN ('nova english', 'course english');
