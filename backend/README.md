# DivePulse Backend

潜水社交平台后端 API 服务

## 技术栈

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: SQLite (开发环境) / PostgreSQL (生产环境)
- **ORM**: Prisma
- **Auth**: JWT
- **API Docs**: Swagger/OpenAPI

## 项目结构

```
backend/
├── src/
│   ├── controllers/     # 控制器层
│   │   ├── authController.js
│   │   ├── pulseController.js
│   │   ├── userController.js
│   │   └── matchController.js
│   ├── routes/          # 路由定义
│   │   ├── auth.js
│   │   ├── pulses.js
│   │   ├── users.js
│   │   └── matches.js
│   ├── middleware/      # 中间件
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   └── validator.js
│   ├── services/       # 业务逻辑层
│   │   ├── pulseService.js
│   │   └── matchService.js
│   ├── models/         # 数据模型
│   │   └── schema.prisma
│   ├── utils/          # 工具函数
│   │   └── response.js
│   └── app.js          # 应用入口
├── prisma/
│   └── schema.prisma   # 数据库 Schema
├── package.json
└── .env                # 环境变量
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 配置数据库连接
```

### 3. 初始化数据库

```bash
npm run db:generate  # 生成 Prisma Client
npm run db:push      # 创建数据库表
npm run db:seed       # 填充初始数据
```

### 4. 启动服务

```bash
# 开发模式 (热重载)
npm run dev

# 生产模式
npm start
```

## API 端点概览

| 方法 | 端点 | 描述 |
|------|------|------|
| POST | `/api/auth/register` | 用户注册 |
| POST | `/api/auth/login` | 用户登录 |
| GET | `/api/pulses` | 获取脉搏列表 |
| POST | `/api/pulses` | 发布新脉搏 |
| GET | `/api/pulses/:id` | 获取脉搏详情 |
| POST | `/api/pulses/:id/respect` | 点赞脉搏 |
| GET | `/api/matches` | 获取拼潜列表 |
| POST | `/api/matches` | 发起拼潜 |
| GET | `/api/users/:id` | 获取用户信息 |
| PUT | `/api/users/profile` | 更新个人资料 |

## 环境变量

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key"
PORT=3000
NODE_ENV=development
```
