-- ==========================================
-- SAMPLE ACCOUNTS (Password for all users is: 123456)
-- 1. admin@gmail.com / 123456
-- 2. user1@gmail.com / 123456
-- 3. duccute@gmail.com / 123456
-- ==========================================

-- ----------------------------
-- Table structure for permissions
-- ----------------------------
DROP TABLE IF EXISTS `permissions`;
CREATE TABLE `permissions` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `api_path` varchar(255) NOT NULL,
  `method` varchar(50) NOT NULL,
  `module` varchar(255) NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `created_by` varchar(255) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `updated_by` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of permissions
-- ----------------------------
INSERT INTO `permissions` (`id`, `name`, `api_path`, `method`, `module`, `created_at`, `created_by`, `updated_at`, `updated_by`) VALUES 
('115865bb-d779-43c3-bfa5-b77da205e836', 'Create User', '/api/v1/users', 'POST', 'USER', NOW(), 'system', NULL, NULL),
('215865bb-d779-43c3-bfa5-b77da205e836', 'Update User', '/api/v1/users', 'PUT', 'USER', NOW(), 'system', NULL, NULL),
('315865bb-d779-43c3-bfa5-b77da205e836', 'Delete User', '/api/v1/users/{id}', 'DELETE', 'USER', NOW(), 'system', NULL, NULL),
('415865bb-d779-43c3-bfa5-b77da205e836', 'Get User', '/api/v1/users/{id}', 'GET', 'USER', NOW(), 'system', NULL, NULL),
('515865bb-d779-43c3-bfa5-b77da205e836', 'Get Users', '/api/v1/users', 'GET', 'USER', NOW(), 'system', NULL, NULL),
('615865bb-d779-43c3-bfa5-b77da205e836', 'Create Skill', '/api/v1/skills', 'POST', 'SKILL', NOW(), 'system', NULL, NULL),
('715865bb-d779-43c3-bfa5-b77da205e836', 'Update Skill', '/api/v1/skills', 'PUT', 'SKILL', NOW(), 'system', NULL, NULL),
('815865bb-d779-43c3-bfa5-b77da205e836', 'Delete Skill', '/api/v1/skills/{id}', 'DELETE', 'SKILL', NOW(), 'system', NULL, NULL),
('915865bb-d779-43c3-bfa5-b77da205e836', 'Get Skills', '/api/v1/skills', 'GET', 'SKILL', NOW(), 'system', NULL, NULL);

-- ----------------------------
-- Table structure for skills
-- ----------------------------
DROP TABLE IF EXISTS `skills`;
CREATE TABLE `skills` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `created_by` varchar(255) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `updated_by` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of skills
-- ----------------------------
INSERT INTO `skills` (`id`, `name`, `created_at`, `created_by`, `updated_at`, `updated_by`) VALUES 
('a83b27b1-2e21-4d32-9b2f-7c18f1a3f621', 'Java', NOW(), 'system', NULL, NULL),
('b83b27b1-2e21-4d32-9b2f-7c18f1a3f621', 'Spring Boot', NOW(), 'system', NULL, NULL),
('c83b27b1-2e21-4d32-9b2f-7c18f1a3f621', 'React', NOW(), 'system', NULL, NULL),
('d83b27b1-2e21-4d32-9b2f-7c18f1a3f621', 'Node.js', NOW(), 'system', NULL, NULL),
('e83b27b1-2e21-4d32-9b2f-7c18f1a3f621', 'SQL', NOW(), 'system', NULL, NULL),
('f83b27b1-2e21-4d32-9b2f-7c18f1a3f621', 'Docker', NOW(), 'system', NULL, NULL);

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` varchar(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `age` int(11) DEFAULT NULL,
  `gender` varchar(50) DEFAULT NULL,
  `refresh_token` mediumtext,
  `created_at` datetime(6) DEFAULT NULL,
  `created_by` varchar(255) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `updated_by` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of users
-- ----------------------------
-- Password for the users is '123456'
INSERT INTO `users` (`id`, `email`, `name`, `password`, `address`, `age`, `gender`, `refresh_token`, `created_at`, `created_by`, `updated_at`, `updated_by`) VALUES 
('1a9b3a0c-ee41-477d-8152-320d3f7f8812', 'admin@gmail.com', 'Admin User', '$2a$10$W2neF9.6Agi6kAKVq8q3fec5dHW8KUA.b0VSIGdIZyUraw./O5zTO', 'Hà Nội', 30, 'MALE', NULL, NOW(), 'system', NULL, NULL),
('2a9b3a0c-ee41-477d-8152-320d3f7f8812', 'user1@gmail.com', 'User Number One', '$2a$10$W2neF9.6Agi6kAKVq8q3fec5dHW8KUA.b0VSIGdIZyUraw./O5zTO', 'Hồ Chí Minh', 25, 'FEMALE', NULL, NOW(), 'system', NULL, NULL),
('3a9b3a0c-ee41-477d-8152-320d3f7f8812', 'duccute@gmail.com', 'Đức Nguyễn', '$2a$10$W2neF9.6Agi6kAKVq8q3fec5dHW8KUA.b0VSIGdIZyUraw./O5zTO', 'Hà Nội', 22, 'MALE', NULL, NOW(), 'system', NULL, NULL);
