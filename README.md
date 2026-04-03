# 智能刀具柜辅助选型系统

## 项目简介

智能刀具柜辅助选型系统是一款Web端的选型工具，帮助销售人员和客户通过交互式步骤，快速配置出符合需求的刀具柜组合方案，并生成详细的配置清单。

## 技术栈

- **后端**: Node.js + Express
- **数据库**: MySQL
- **ORM**: Sequelize
- **前端**: HTML5 + CSS3 + JavaScript + Bootstrap 5
- **API文档**: Swagger

## 功能特性

- 向导式步骤引导用户完成选型
- 支持专业型和通用型两种产品系列
- 支持弹簧柜和抽屉柜两种柜子类型
- 可视化配置界面，实时计算仓位
- 方案保存和管理功能
- 详细的配置清单生成

## 安装与运行

### 1. 安装依赖

```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

### 2. 配置数据库

创建MySQL数据库，并在`.env`文件中配置数据库连接信息。

### 3. 启动服务

```bash
# 启动后端服务
cd backend
npm start

# 前端可直接打开index.html文件
```

### 4. 访问系统

- 系统地址：直接打开frontend/index.html
- API文档：http://localhost:3000/api-docs

## 使用教程

1. **选择产品系列**：选择专业型或通用型
2. **配置主柜**：选择主柜类型并进行内部配置
3. **配置副柜**：添加0-5台副柜并进行配置
4. **生成方案**：查看方案总览和详细配置，保存方案

## 项目结构

```
smart-tool-cabinet/
├── backend/                # 后端代码
├── frontend/               # 前端代码
└── README.md               # 项目说明
```

## 数据库设计

系统使用MySQL数据库，包含以下主要表：
- solution：选型方案
- cabinet：柜子实例
- spring_tray：弹簧柜托盘配置
- drawer_tray：抽屉柜托盘配置