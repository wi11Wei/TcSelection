# 数据库配置指南

## 数据库创建

1. 确保已安装MySQL数据库（推荐5.7或更高版本）
2. 使用以下命令创建数据库和表结构：

```bash
mysql -u root -p < create_database.sql
```

3. 或者手动执行`create_database.sql`文件中的SQL语句

## 数据库连接配置

在后端的`.env`文件中配置数据库连接信息：

```
# 数据库配置
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=tool_cabinet_db
DB_PORT=3306
```

## 数据库结构说明

系统包含以下主要表：

1. **solution** - 选型方案表
   - id: 方案ID
   - name: 方案名称
   - created_at: 创建时间
   - description: 备注描述

2. **cabinet** - 柜子实例表
   - id: 柜子ID
   - solution_id: 所属方案ID
   - type: 柜子类型（spring/drawer）
   - is_main: 是否为主柜
   - order_index: 柜子顺序

3. **spring_tray** - 弹簧柜托盘配置表
   - id: 记录ID
   - cabinet_id: 所属柜子ID
   - tray_index: 托盘序号
   - interval_type: 弹簧间隔类型

4. **drawer_tray** - 抽屉柜托盘配置表
   - id: 记录ID
   - cabinet_id: 所属柜子ID
   - tray_index: 托盘序号
   - channels: 通道数

## 示例数据

`create_database.sql`文件中包含了一些示例数据，可以帮助您快速了解系统的数据结构和关系。