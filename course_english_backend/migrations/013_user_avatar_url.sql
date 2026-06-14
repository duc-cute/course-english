-- Optional profile photo URL for users (teacher avatar in notifications, profile later)
ALTER TABLE users
    ADD COLUMN avatar_url TEXT NULL AFTER name;
