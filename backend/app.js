const express = require('express');
const helmet = require('helmet');
const dotenv = require('dotenv');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// 加载环境变量
dotenv.config();

// 导入数据库配置和模型
const { testConnection } = require('./config/database');
const { migrateDatabase } = require('./models');

// 导入路由
const solutionRoutes = require('./routes/solutionRoutes');
const cabinetRoutes = require('./routes/cabinetRoutes');

// 导入中间件
const corsMiddleware = require('./middlewares/cors');

// 创建Express应用
const app = express();

// 应用中间件
app.use(helmet());
app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger配置
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '智能刀具柜辅助选型系统 API',
      version: '1.0.0',
      description: '智能刀具柜辅助选型系统的API文档',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: '本地服务器',
      },
    ],
  },
  apis: ['./routes/*.js', './controllers/*.js'],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// 注册路由
app.use('/api/solutions', solutionRoutes);
app.use('/api/cabinets', cabinetRoutes);

// 健康检查路由
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ message: '路由不存在' });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: '服务器内部错误' });
});

// 启动服务器
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // 测试数据库连接
    await testConnection();
    
    // 迁移数据库模型
    await migrateDatabase();
    
    // 启动服务器
    app.listen(PORT, () => {
      console.log(`服务器运行在 http://localhost:${PORT}`);
      console.log(`API文档地址: http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('启动服务器失败:', error);
    process.exit(1);
  }
};

// 启动服务器
startServer();