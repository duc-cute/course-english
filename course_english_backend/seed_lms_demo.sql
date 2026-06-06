-- =============================================================================
-- Cell Architecture — LMS demo seed
-- Database: cell_architecture (MySQL)
-- Chay: mysql -u root -p cell_architecture < seed_lms_demo.sql
-- Mat khau tat ca tai khoan: 123456
-- =============================================================================

USE `cell_architecture`;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DELETE FROM `enrollments` WHERE `id` LIKE 'a1000005-%';
DELETE FROM `subjects` WHERE `id` LIKE 'a1000004-%';
DELETE FROM `classrooms` WHERE `id` LIKE 'a1000003-%';
DELETE FROM `user_roles` WHERE `user_id` LIKE 'a1000002-%';
DELETE FROM `users` WHERE `id` LIKE 'a1000002-%';
DELETE FROM `roles` WHERE `id` LIKE 'a1000001-%';

SET FOREIGN_KEY_CHECKS = 1;

SET @pwd = '$2a$10$W2neF9.6Agi6kAKVq8q3fec5dHW8KUA.b0VSIGdIZyUraw./O5zTO';
SET @now = NOW(6);

INSERT INTO `roles` (`id`, `name`, `code`, `created_at`, `created_by`, `updated_at`, `updated_by`, `voided`) VALUES
('a1000001-0000-4000-8000-000000000001', 'ADMIN_ROLE',   'ADMIN_ROLE',   @now, 'seed', NULL, NULL, 0),
('a1000001-0000-4000-8000-000000000002', 'TEACHER_ROLE', 'TEACHER_ROLE', @now, 'seed', NULL, NULL, 0),
('a1000001-0000-4000-8000-000000000003', 'STUDENT_ROLE', 'STUDENT_ROLE', @now, 'seed', NULL, NULL, 0);

INSERT INTO `users` (`id`, `email`, `name`, `password`, `address`, `age`, `gender`, `refresh_token`, `created_at`, `created_by`, `updated_at`, `updated_by`, `voided`) VALUES
('a1000002-0000-4000-8000-000000000001', 'admin@demo.local',      'Quản trị Demo',     @pwd, 'Hà Nội',       35, 'MALE',   NULL, @now, 'seed', NULL, NULL, 0),
('a1000002-0000-4000-8000-000000000002', 'giaovien1@demo.local',  'Nguyễn Văn Giáo',   @pwd, 'Hà Nội',       40, 'MALE',   NULL, @now, 'seed', NULL, NULL, 0),
('a1000002-0000-4000-8000-000000000003', 'giaovien2@demo.local',  'Trần Thị Dạy',     @pwd, 'TP.HCM',       38, 'FEMALE', NULL, @now, 'seed', NULL, NULL, 0),
('a1000002-0000-4000-8000-000000000004', 'hs01@demo.local',       'Lê Minh An',       @pwd, 'Hà Nội',       16, 'MALE',   NULL, @now, 'seed', NULL, NULL, 0),
('a1000002-0000-4000-8000-000000000005', 'hs02@demo.local',       'Phạm Thu Bình',    @pwd, 'Hà Nội',       16, 'FEMALE', NULL, @now, 'seed', NULL, NULL, 0),
('a1000002-0000-4000-8000-000000000006', 'hs03@demo.local',       'Hoàng Văn Cường',  @pwd, 'Đà Nẵng',      17, 'MALE',   NULL, @now, 'seed', NULL, NULL, 0),
('a1000002-0000-4000-8000-000000000007', 'hs04@demo.local',       'Vũ Thị Dung',      @pwd, 'Hải Phòng',    16, 'FEMALE', NULL, @now, 'seed', NULL, NULL, 0),
('a1000002-0000-4000-8000-000000000008', 'hs05@demo.local',       'Đỗ Quốc Em',       @pwd, 'TP.HCM',       17, 'MALE',   NULL, @now, 'seed', NULL, NULL, 0),
('a1000002-0000-4000-8000-000000000009', 'hs06@demo.local',       'Bùi Thị Phương',   @pwd, 'Cần Thơ',      16, 'FEMALE', NULL, @now, 'seed', NULL, NULL, 0),
('a1000002-0000-4000-8000-000000000010', 'hs07@demo.local',       'Ngô Văn Giang',     @pwd, 'Huế',          17, 'MALE',   NULL, @now, 'seed', NULL, NULL, 0);

INSERT INTO `user_roles` (`user_id`, `role_id`) VALUES
('a1000002-0000-4000-8000-000000000001', 'a1000001-0000-4000-8000-000000000001'),
('a1000002-0000-4000-8000-000000000002', 'a1000001-0000-4000-8000-000000000002'),
('a1000002-0000-4000-8000-000000000003', 'a1000001-0000-4000-8000-000000000002'),
('a1000002-0000-4000-8000-000000000004', 'a1000001-0000-4000-8000-000000000003'),
('a1000002-0000-4000-8000-000000000005', 'a1000001-0000-4000-8000-000000000003'),
('a1000002-0000-4000-8000-000000000006', 'a1000001-0000-4000-8000-000000000003'),
('a1000002-0000-4000-8000-000000000007', 'a1000001-0000-4000-8000-000000000003'),
('a1000002-0000-4000-8000-000000000008', 'a1000001-0000-4000-8000-000000000003'),
('a1000002-0000-4000-8000-000000000009', 'a1000001-0000-4000-8000-000000000003'),
('a1000002-0000-4000-8000-000000000010', 'a1000001-0000-4000-8000-000000000003');

INSERT INTO `classrooms` (`id`, `name`, `code`, `description`, `teacher_id`, `created_at`, `created_by`, `updated_at`, `updated_by`, `voided`) VALUES
('a1000003-0000-4000-8000-000000000001', 'Lớp 10A1', 'L10A1', 'Khối 10 — cơ bản', 'a1000002-0000-4000-8000-000000000002', @now, 'seed', NULL, NULL, 0),
('a1000003-0000-4000-8000-000000000002', 'Lớp 10A2', 'L10A2', 'Khối 10 — nâng cao', 'a1000002-0000-4000-8000-000000000002', @now, 'seed', NULL, NULL, 0),
('a1000003-0000-4000-8000-000000000003', 'Lớp 11B1', 'L11B1', 'Khối 11 — tự nhiên', 'a1000002-0000-4000-8000-000000000003', @now, 'seed', NULL, NULL, 0);

INSERT INTO `subjects` (`id`, `name`, `display_order`, `classroom_id`, `created_at`, `created_by`, `updated_at`, `updated_by`, `voided`) VALUES
('a1000004-0000-4000-8000-000000000001', 'Toán học',  1, 'a1000003-0000-4000-8000-000000000001', @now, 'seed', NULL, NULL, 0),
('a1000004-0000-4000-8000-000000000002', 'Ngữ văn',   2, 'a1000003-0000-4000-8000-000000000001', @now, 'seed', NULL, NULL, 0),
('a1000004-0000-4000-8000-000000000003', 'Tiếng Anh', 3, 'a1000003-0000-4000-8000-000000000001', @now, 'seed', NULL, NULL, 0),
('a1000004-0000-4000-8000-000000000004', 'Vật lý',    1, 'a1000003-0000-4000-8000-000000000002', @now, 'seed', NULL, NULL, 0),
('a1000004-0000-4000-8000-000000000005', 'Hóa học',   2, 'a1000003-0000-4000-8000-000000000002', @now, 'seed', NULL, NULL, 0),
('a1000004-0000-4000-8000-000000000006', 'Sinh học',  3, 'a1000003-0000-4000-8000-000000000002', @now, 'seed', NULL, NULL, 0),
('a1000004-0000-4000-8000-000000000007', 'Lịch sử',   1, 'a1000003-0000-4000-8000-000000000003', @now, 'seed', NULL, NULL, 0),
('a1000004-0000-4000-8000-000000000008', 'Địa lý',    2, 'a1000003-0000-4000-8000-000000000003', @now, 'seed', NULL, NULL, 0),
('a1000004-0000-4000-8000-000000000009', 'Tin học',   3, 'a1000003-0000-4000-8000-000000000003', @now, 'seed', NULL, NULL, 0),
('a1000004-0000-4000-8000-000000000010', 'GDCD',      4, 'a1000003-0000-4000-8000-000000000003', @now, 'seed', NULL, NULL, 0);

INSERT INTO `enrollments` (`id`, `classroom_id`, `student_id`, `status`, `joined_at`, `created_at`, `created_by`, `updated_at`, `updated_by`, `voided`) VALUES
('a1000005-0000-4000-8000-000000000001', 'a1000003-0000-4000-8000-000000000001', 'a1000002-0000-4000-8000-000000000004', 'ACTIVE',   @now, @now, 'seed', NULL, NULL, 0),
('a1000005-0000-4000-8000-000000000002', 'a1000003-0000-4000-8000-000000000001', 'a1000002-0000-4000-8000-000000000005', 'ACTIVE',   @now, @now, 'seed', NULL, NULL, 0),
('a1000005-0000-4000-8000-000000000003', 'a1000003-0000-4000-8000-000000000001', 'a1000002-0000-4000-8000-000000000006', 'ACTIVE',   @now, @now, 'seed', NULL, NULL, 0),
('a1000005-0000-4000-8000-000000000004', 'a1000003-0000-4000-8000-000000000002', 'a1000002-0000-4000-8000-000000000007', 'ACTIVE',   @now, @now, 'seed', NULL, NULL, 0),
('a1000005-0000-4000-8000-000000000005', 'a1000003-0000-4000-8000-000000000002', 'a1000002-0000-4000-8000-000000000008', 'ACTIVE',   @now, @now, 'seed', NULL, NULL, 0),
('a1000005-0000-4000-8000-000000000006', 'a1000003-0000-4000-8000-000000000002', 'a1000002-0000-4000-8000-000000000009', 'INACTIVE', @now, @now, 'seed', NULL, NULL, 0),
('a1000005-0000-4000-8000-000000000007', 'a1000003-0000-4000-8000-000000000003', 'a1000002-0000-4000-8000-000000000010', 'ACTIVE',   @now, @now, 'seed', NULL, NULL, 0),
('a1000005-0000-4000-8000-000000000008', 'a1000003-0000-4000-8000-000000000003', 'a1000002-0000-4000-8000-000000000004', 'ACTIVE',   @now, @now, 'seed', NULL, NULL, 0),
('a1000005-0000-4000-8000-000000000009', 'a1000003-0000-4000-8000-000000000003', 'a1000002-0000-4000-8000-000000000005', 'ACTIVE',   @now, @now, 'seed', NULL, NULL, 0),
('a1000005-0000-4000-8000-000000000010', 'a1000003-0000-4000-8000-000000000001', 'a1000002-0000-4000-8000-000000000007', 'ACTIVE',   @now, @now, 'seed', NULL, NULL, 0);
