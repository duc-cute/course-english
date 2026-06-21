-- =============================================================================
-- Demo seed — class sessions for Today's Teaching Plan
-- Chạy SAU migrations/018_class_sessions.sql + seed_lms_demo.sql
--
--   mysql -u root -p course_english < seed_class_sessions_demo.sql
--
-- Tạo 3 buổi trong ngày hiện tại (theo giờ VN) cho giaovien1@demo.local
-- =============================================================================

USE `course_english`;

SET NAMES utf8mb4;

DELETE FROM `class_sessions` WHERE `id` LIKE 'a1000006-%';

SET @teacher := 'a1000002-0000-4000-8000-000000000002';
SET @class10a1 := 'a1000003-0000-4000-8000-000000000001';
SET @class10a2 := 'a1000003-0000-4000-8000-000000000002';
SET @now := NOW(6);

-- Buổi 1: 19:00–19:50 VN hôm nay
SET @d := CURDATE();
SET @s1_start := TIMESTAMP(@d, '19:00:00') - INTERVAL 7 HOUR;
SET @s1_end   := TIMESTAMP(@d, '19:50:00') - INTERVAL 7 HOUR;
-- Buổi 2: 20:00–20:50 VN
SET @s2_start := TIMESTAMP(@d, '20:00:00') - INTERVAL 7 HOUR;
SET @s2_end   := TIMESTAMP(@d, '20:50:00') - INTERVAL 7 HOUR;
-- Buổi 3: 21:00–21:30 VN (office hours, chưa có meet link)
SET @s3_start := TIMESTAMP(@d, '21:00:00') - INTERVAL 7 HOUR;
SET @s3_end   := TIMESTAMP(@d, '21:30:00') - INTERVAL 7 HOUR;

INSERT INTO `class_sessions` (
  `id`, `classroom_id`, `teacher_id`, `lesson_id`, `title`, `session_type`,
  `start_at`, `end_at`, `meet_link`, `location_label`, `status`, `notes`,
  `created_at`, `created_by`, `voided`
) VALUES
(
  'a1000006-0000-4000-8000-000000000001',
  @class10a1, @teacher, NULL,
  'Creative Writing', 'LIVE_CLASS',
  @s1_start, @s1_end,
  'https://zoom.us/j/demo-room-a', 'Zoom Room A',
  'SCHEDULED', NULL,
  @now, 'seed', 0
),
(
  'a1000006-0000-4000-8000-000000000002',
  @class10a2, @teacher, NULL,
  'Advanced Grammar', 'LIVE_CLASS',
  @s2_start, @s2_end,
  'https://zoom.us/j/demo-room-b', 'Zoom Room B',
  'SCHEDULED', NULL,
  @now, 'seed', 0
),
(
  'a1000006-0000-4000-8000-000000000003',
  @class10a1, @teacher, NULL,
  'Homework Review Session', 'OFFICE_HOURS',
  @s3_start, @s3_end,
  NULL, 'Open Office Hours',
  'SCHEDULED', 'Link TBD',
  @now, 'seed', 0
);
