-- Google Sign-In: google_id + auth_provider, password nullable cho user đăng ký qua Google
-- Chạy MỘT LẦN:
--   mysql -u root -p course_english < migrations/016_user_google_auth.sql

USE `course_english`;

ALTER TABLE `users`
    ADD COLUMN `google_id` VARCHAR(255) NULL AFTER `avatar_url`,
    ADD COLUMN `auth_provider` VARCHAR(20) NOT NULL DEFAULT 'LOCAL' AFTER `google_id`;

ALTER TABLE `users`
    MODIFY COLUMN `password` VARCHAR(255) NULL;

CREATE UNIQUE INDEX `uk_users_google_id` ON `users` (`google_id`);

-- User cũ (email/password) giữ LOCAL — DEFAULT ở trên đã gán khi ADD COLUMN
