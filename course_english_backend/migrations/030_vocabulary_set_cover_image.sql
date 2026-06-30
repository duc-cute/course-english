-- Cover image for vocabulary set (AI image-gen or manual upload)
USE `course_english`;

ALTER TABLE `vocabulary_sets`
  ADD COLUMN `cover_image_url` VARCHAR(1024) NULL AFTER `description`;
