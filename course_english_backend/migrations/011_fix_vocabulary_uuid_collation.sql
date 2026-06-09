-- =============================================================================
-- Fix collation mismatch on vocabulary UUID columns (CHAR(36))
--
-- Symptom when saving vocabulary set:
--   Illegal mix of collations (utf8mb4_unicode_ci,IMPLICIT)
--   and (utf8mb4_0900_ai_ci,IMPLICIT) for operation '='
--   on JOIN vocabulary_set_members.word_id = vocabulary_words.id
--
-- Cause: Hibernate ddl-auto=update may create columns with MySQL 8 default
--        utf8mb4_0900_ai_ci while SQL migrations use utf8mb4_unicode_ci.
--
-- Note: Do NOT alter vocabulary_sets.subject_id here — it must stay compatible
--       with subjects.id (may still use utf8mb4_0900_ai_ci from Hibernate).
--
--   mysql -u root -p course_english < migrations/011_fix_vocabulary_uuid_collation.sql
-- =============================================================================

USE `course_english`;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

ALTER TABLE `vocabulary_words`
  MODIFY `id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  MODIFY `image_asset_id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  MODIFY `audio_asset_id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;

ALTER TABLE `vocabulary_sets`
  MODIFY `id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

ALTER TABLE `vocabulary_set_members`
  MODIFY `id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  MODIFY `set_id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  MODIFY `word_id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

SET FOREIGN_KEY_CHECKS = 1;
