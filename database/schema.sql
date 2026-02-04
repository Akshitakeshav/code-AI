-- Codeকথা AI Website Builder Database Schema
-- Run this in phpMyAdmin or MySQL CLI

-- Create Database
CREATE DATABASE IF NOT EXISTS codekotha_ai;
USE codekotha_ai;

-- Users Table (for authentication)
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    name VARCHAR(255),
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert a default guest user
INSERT INTO users (id, email, name, is_admin) VALUES (1, 'guest@codekotha.ai', 'Guest User', FALSE)
ON DUPLICATE KEY UPDATE name = 'Guest User';

-- Insert default admin user (password: admin123)
-- bcrypt hash for 'admin123' with salt rounds 10
INSERT INTO users (email, password_hash, name, is_admin) 
VALUES ('admin@codekotha.ai', '$2a$10$rIC9e5yJu7rQqHYJVCHrWuVxc7gIvuoSxGoJmJh9tVHC5yVn5/vXe', 'Admin', TRUE)
ON DUPLICATE KEY UPDATE is_admin = TRUE;

-- Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id INT PRIMARY KEY AUTO_INCREMENT,
    project_uid VARCHAR(50) UNIQUE NOT NULL,
    user_id INT DEFAULT 1,
    name VARCHAR(255) NOT NULL,
    theme VARCHAR(100) DEFAULT 'SaaS Landing Page',
    color_theme VARCHAR(100) DEFAULT 'Dark with blue & purple',
    status ENUM('draft', 'generating', 'completed') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Project Files Table
CREATE TABLE IF NOT EXISTS project_files (
    id INT PRIMARY KEY AUTO_INCREMENT,
    project_id INT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    content LONGTEXT,
    file_type ENUM('html', 'css', 'js', 'json', 'md', 'other') DEFAULT 'html',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    UNIQUE KEY unique_project_file (project_id, filename)
);

-- Generation History Table
CREATE TABLE IF NOT EXISTS generation_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    project_id INT NOT NULL,
    project_name VARCHAR(255),
    sections_json TEXT,
    full_html LONGTEXT,
    explanation TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Pricing Plans Table
CREATE TABLE IF NOT EXISTS pricing_plans (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    tokens INT DEFAULT 0,
    price DECIMAL(10,2) DEFAULT 0,
    duration_days INT DEFAULT 30,
    description TEXT,
    features TEXT,
    is_popular BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default pricing plans
INSERT INTO pricing_plans (name, tokens, price, duration_days, description, features, is_popular, is_active, sort_order)
VALUES 
('Free Trial', 100, 0, 30, 'Perfect for testing', '5 website generations,Basic templates,Live preview,HTML export', FALSE, TRUE, 1),
('Starter', 1000, 499, 30, 'Great for small shops', 'Unlimited generations,All premium templates,Priority AI,ZIP export', FALSE, TRUE, 2),
('Professional', 5000, 1499, 30, 'For growing businesses', 'Everything in Starter,Learning mode,Custom themes,Email support', TRUE, TRUE, 3),
('Enterprise', 25000, 4999, 30, 'Unlimited potential', 'Everything in Pro,Team collaboration,Custom branding,API access,Priority support', FALSE, TRUE, 4)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- User Subscriptions Table
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    plan_id INT NOT NULL,
    tokens_remaining INT DEFAULT 0,
    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP,
    status ENUM('active', 'expired', 'cancelled') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES pricing_plans(id) ON DELETE CASCADE
);

-- Payment Transactions Table
CREATE TABLE IF NOT EXISTS payment_transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    plan_id INT NOT NULL,
    razorpay_order_id VARCHAR(100),
    razorpay_payment_id VARCHAR(100),
    razorpay_signature VARCHAR(500),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    status ENUM('created', 'paid', 'failed') DEFAULT 'created',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES pricing_plans(id) ON DELETE CASCADE
);

-- Indexes for better performance (safe for re-runs)
-- MySQL doesn't support CREATE INDEX IF NOT EXISTS, so we use a workaround
SET @exist := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = 'codekotha_ai' AND table_name = 'projects' AND index_name = 'idx_projects_user');
SET @sqlstmt := IF(@exist > 0, 'SELECT ''Index exists''', 'CREATE INDEX idx_projects_user ON projects(user_id)');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = 'codekotha_ai' AND table_name = 'projects' AND index_name = 'idx_projects_status');
SET @sqlstmt := IF(@exist > 0, 'SELECT ''Index exists''', 'CREATE INDEX idx_projects_status ON projects(status)');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = 'codekotha_ai' AND table_name = 'project_files' AND index_name = 'idx_files_project');
SET @sqlstmt := IF(@exist > 0, 'SELECT ''Index exists''', 'CREATE INDEX idx_files_project ON project_files(project_id)');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = 'codekotha_ai' AND table_name = 'generation_history' AND index_name = 'idx_history_project');
SET @sqlstmt := IF(@exist > 0, 'SELECT ''Index exists''', 'CREATE INDEX idx_history_project ON generation_history(project_id)');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = 'codekotha_ai' AND table_name = 'generation_history' AND index_name = 'idx_history_created');
SET @sqlstmt := IF(@exist > 0, 'SELECT ''Index exists''', 'CREATE INDEX idx_history_created ON generation_history(created_at)');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
