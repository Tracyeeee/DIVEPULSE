import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

// 路由
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import pulseRoutes from './routes/pulses.js';
import matchRoutes from './routes/matches.js';
import messageRoutes from './routes/messages.js';
import tagRoutes from './routes/tags.js';

// 中间件
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';

// 加载环境变量
dotenv.config();

// 初始化 Prisma
export const prisma = new PrismaClient();

// 创建 Express 应用
const app = express();

// ==================== 中间件 ====================

// 安全头
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

// 请求日志
app.use(morgan('dev'));

// 请求体解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ==================== Swagger 文档 ====================

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'DivePulse API',
      version: '1.0.0',
      description: '潜水社交平台后端 API 文档',
      contact: {
        name: 'DivePulse Team'
      }
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: '开发服务器'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            uid: { type: 'string' },
            email: { type: 'string' },
            nickname: { type: 'string' },
            avatar: { type: 'string' },
            bio: { type: 'string' },
            isAnonymous: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Pulse: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            location: { type: 'string' },
            country: { type: 'string' },
            visibility: { type: 'integer' },
            flow: { type: 'string' },
            temp: { type: 'number' },
            image: { type: 'string' },
            weight: { type: 'integer' },
            geoHash: { type: 'string' },
            depth: { type: 'integer' },
            duration: { type: 'integer' },
            isAnonymous: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Match: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            type: { type: 'string', enum: ['DIVE', 'TRIP', 'TRAINING', 'PHOTO'] },
            title: { type: 'string' },
            description: { type: 'string' },
            location: { type: 'string' },
            country: { type: 'string' },
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' },
            maxPeople: { type: 'integer' },
            status: { type: 'string', enum: ['OPEN', 'FULL', 'CLOSED'] },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            errors: { type: 'array', items: { type: 'object' } }
          }
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ==================== 路由 ====================

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/pulses', pulseRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/tags', tagRoutes);

// ==================== 错误处理 ====================

app.use(notFoundHandler);
app.use(errorHandler);

// ==================== 启动服务器 ====================

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════════╗
  ║                                               ║
  ║   🐋  DivePulse API Server                    ║
  ║                                               ║
  ║   Server running on port ${PORT}                  ║
  ║   API Docs: http://localhost:${PORT}/api-docs    ║
  ║   Environment: ${process.env.NODE_ENV || 'development'}                   ║
  ║                                               ║
  ╚═══════════════════════════════════════════════╝
  `);
});

// 优雅关闭
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  await prisma.$disconnect();
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down gracefully...');
  await prisma.$disconnect();
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

export default app;
