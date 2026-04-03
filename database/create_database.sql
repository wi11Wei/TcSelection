-- 创建数据库
CREATE DATABASE IF NOT EXISTS tool_cabinet_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE tool_cabinet_db;

-- 创建选型方案表
CREATE TABLE IF NOT EXISTS solution (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    description TEXT
);

-- 创建柜子实例表
CREATE TABLE IF NOT EXISTS cabinet (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    solution_id BIGINT NOT NULL,
    type ENUM('spring', 'drawer') NOT NULL,
    is_main BOOLEAN NOT NULL DEFAULT FALSE,
    order_index INT NOT NULL,
    FOREIGN KEY (solution_id) REFERENCES solution(id) ON DELETE CASCADE,
    UNIQUE KEY unique_solution_order (solution_id, order_index)
);

-- 创建弹簧柜托盘配置表
CREATE TABLE IF NOT EXISTS spring_tray (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    cabinet_id BIGINT NOT NULL,
    tray_index INT NOT NULL,
    interval_type ENUM('25mm', '35mm', '45mm') NOT NULL,
    FOREIGN KEY (cabinet_id) REFERENCES cabinet(id) ON DELETE CASCADE,
    UNIQUE KEY unique_cabinet_tray (cabinet_id, tray_index)
);

-- 创建抽屉柜托盘配置表
CREATE TABLE IF NOT EXISTS drawer_tray (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    cabinet_id BIGINT NOT NULL,
    tray_index INT NOT NULL,
    channels INT NOT NULL CHECK (channels IN (1, 2, 3, 4)),
    FOREIGN KEY (cabinet_id) REFERENCES cabinet(id) ON DELETE CASCADE,
    UNIQUE KEY unique_cabinet_tray (cabinet_id, tray_index)
);

-- 创建索引以提高查询性能
CREATE INDEX idx_cabinet_solution ON cabinet(solution_id);
CREATE INDEX idx_cabinet_type ON cabinet(type);
CREATE INDEX idx_cabinet_main ON cabinet(is_main);
CREATE INDEX idx_spring_tray_cabinet ON spring_tray(cabinet_id);
CREATE INDEX idx_drawer_tray_cabinet ON drawer_tray(cabinet_id);

-- 插入示例数据（可选）
-- 插入示例方案
INSERT INTO solution (name, description) VALUES 
('标准刀具存储方案', '适合中小型工厂的标准刀具存储配置'),
('专业精密刀具方案', '适合精密加工车间的专业刀具存储配置');

-- 插入示例主柜
INSERT INTO cabinet (solution_id, type, is_main, order_index) VALUES 
(1, 'spring', TRUE, 0),
(2, 'drawer', TRUE, 0);

-- 插入示例弹簧柜托盘配置
INSERT INTO spring_tray (cabinet_id, tray_index, interval_type) VALUES 
(1, 1, '35mm'),
(1, 2, '35mm'),
(1, 3, '35mm'),
(1, 4, '35mm'),
(1, 5, '35mm'),
(1, 6, '35mm'),
(1, 7, '35mm'),
(1, 8, '35mm');

-- 插入示例抽屉柜托盘配置
INSERT INTO drawer_tray (cabinet_id, tray_index, channels) VALUES 
(2, 1, 4),
(2, 2, 4),
(2, 3, 3),
(2, 4, 3),
(2, 5, 2);

-- 插入示例副柜
INSERT INTO cabinet (solution_id, type, is_main, order_index) VALUES 
(1, 'spring', FALSE, 1),
(2, 'drawer', FALSE, 1);

-- 插入示例副柜托盘配置
INSERT INTO spring_tray (cabinet_id, tray_index, interval_type) VALUES 
(3, 1, '25mm'),
(3, 2, '25mm'),
(3, 3, '25mm'),
(3, 4, '25mm'),
(3, 5, '25mm'),
(3, 6, '25mm'),
(3, 7, '25mm'),
(3, 8, '25mm');

INSERT INTO drawer_tray (cabinet_id, tray_index, channels) VALUES 
(4, 1, 2),
(4, 2, 2),
(4, 3, 1);

-- 显示创建的表
SHOW TABLES;

-- 显示表结构
DESCRIBE solution;
DESCRIBE cabinet;
DESCRIBE spring_tray;
DESCRIBE drawer_tray;

-- 显示插入的数据
SELECT * FROM solution;
SELECT * FROM cabinet;
SELECT * FROM spring_tray;
SELECT * FROM drawer_tray;