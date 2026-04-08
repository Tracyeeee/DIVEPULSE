-- DivePulse Database Initialization Script
-- This script runs automatically when the MySQL container starts for the first time
-- Creates the database with UTF8MB4 charset for full Unicode support including emoji

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- Note: Database is already created via MYSQL_DATABASE env var
-- This script is for any additional initialization steps

-- Create extensions if needed (MySQL 8.0 has JSON support built-in)
-- No additional setup required for Prisma with MySQL 8.0
