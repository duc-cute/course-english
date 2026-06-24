-- Widen mime_type — DOCX full type is 71 chars (VARCHAR(64) was too short)
-- mysql -u root -p course_english < migrations/023_ai_documents_mime_type.sql

USE `course_english`;

ALTER TABLE `ai_documents`
  MODIFY COLUMN `mime_type` VARCHAR(128) DEFAULT NULL;
