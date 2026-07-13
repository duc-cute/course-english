-- =============================================================================
-- Fix collation mismatch on vocabulary journey tables
--
-- Symptom (create/load topic → JOIN topic_members → vocabulary_sets → subjects):
--   Illegal mix of collations (utf8mb4_unicode_ci,IMPLICIT)
--   and (utf8mb4_0900_ai_ci,IMPLICIT) for operation '='
--
-- Cause: 042 set UUID columns to utf8mb4_unicode_ci but table DEFAULT stayed
--        utf8mb4_0900_ai_ci (MySQL 8 / Hibernate). Mixed collations on JOIN.
-- Pattern: migrations/011_fix_vocabulary_uuid_collation.sql
--
--   mysql -u root -p course_english < migrations/043_fix_vocabulary_journey_collation.sql
-- =============================================================================

USE `course_english`;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Align whole journey tables to unicode_ci (match vocabulary_sets.id after 011)
ALTER TABLE `vocabulary_journeys`
  CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `vocabulary_topics`
  CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `vocabulary_topic_members`
  CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Journey↔classroom: convert then restore classroom_id to match classrooms.id (0900)
ALTER TABLE `vocabulary_journey_classrooms`
  CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `vocabulary_journey_classrooms`
  MODIFY `classroom_id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL;

-- Re-assert vocabulary_sets.id unicode (JOIN target for topic_members)
ALTER TABLE `vocabulary_sets`
  MODIFY `id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

-- subject_id must keep matching subjects.id (0900)
ALTER TABLE `vocabulary_sets`
  MODIFY `subject_id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL;

-- 040 / 041 FKs (prevent next collation hit)
ALTER TABLE `vocabulary_set_assignments`
  CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `vocabulary_set_assignments`
  MODIFY `classroom_id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  MODIFY `assigned_by` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL;

ALTER TABLE `vocabulary_practice_attempts`
  CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `vocabulary_practice_attempts`
  MODIFY `user_id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL;

-- Restore FK topic_members → vocabulary_sets if Hibernate dropped it
SET @fk_exists := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = 'course_english'
    AND TABLE_NAME = 'vocabulary_topic_members'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
    AND CONSTRAINT_NAME = 'fk_vtm_set'
);
SET @sql := IF(
  @fk_exists = 0,
  'ALTER TABLE `vocabulary_topic_members` ADD CONSTRAINT `fk_vtm_set` FOREIGN KEY (`vocabulary_set_id`) REFERENCES `vocabulary_sets` (`id`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET FOREIGN_KEY_CHECKS = 1;
