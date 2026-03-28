# DivePulse API 文档 (前端适配版)

> 潜水社交平台后端 API 完整文档
> **版本**: v2.0 (适配前端)

---

## 基础信息

| 项目 | 值 |
|------|-----|
| 基础 URL | `http://localhost:3000` |
| API 文档 | `http://localhost:3000/api-docs` |
| 认证方式 | JWT Bearer Token |
| 数据格式 | JSON |

---

## 认证模块 (Auth)

### 发送OTP验证码

```
POST /api/auth/otp/send
```

**请求体：**

```json
{
  "email": "user@example.com"
}
```

**响应示例：**

```json
{
  "success": true,
  "message": "发送成功",
  "data": {
    "message": "验证码已发送",
    "_debug": "123456"
  }
}
```

> **注意**: `_debug` 字段仅在开发环境返回，用于测试。生产环境请配置真实的邮件发送服务。

---

### 使用OTP验证码登录

```
POST /api/auth/otp/login
```

**请求体：**

```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | ✓ | 邮箱地址 |
| code | string | ✓ | 6位验证码 |

**响应示例：**

```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "user": {
      "id": "uuid",
      "uid": "DP-7729",
      "email": "user@example.com",
      "nickname": "Diver-1234",
      "avatar": null,
      "isAnonymous": false
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

> **说明**: 验证码有效期5分钟，错误3次后需重新获取。首次登录会自动创建账号。

---

### 用户注册

```
POST /api/auth/register
```

**请求体：**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "nickname": "我的昵称"
}
```

---

### 用户登录 (密码方式)

```
POST /api/auth/login
```

**请求体：**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

---

### 获取当前用户

```
GET /api/auth/me
```

**响应示例：**

```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "id": "uuid",
    "uid": "DP-7729",
    "email": "user@example.com",
    "nickname": "我的昵称",
    "avatar": "https://...",
    "bio": "我是潜水爱好者",
    "isAnonymous": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "_count": {
      "pulses": 10,
      "respects": 25
    }
  }
}
```

---

## 脉搏模块 (Pulses)

### 获取脉搏列表

```
GET /api/pulses
```

**查询参数：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | integer | 1 | 页码 |
| limit | integer | 20 | 每页数量 (最大50) |
| search | string | | 搜索关键词 (位置/标签) |
| sortBy | string | "Most Liked" | 排序: Latest, Most Liked, Most Commented |
| timeRange | string | "All Time" | 时间范围: All Time, 24 Hours, 7 Days, 6 Months |
| country | string | | 国家代码筛选 |

**响应示例：**

```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "id": "uuid",
      "location": "菲律宾 - 长滩岛",
      "country": "PH",
      "visibility": 30,
      "flow": "Light",
      "temp": 28,
      "time": "2h",
      "image": "https://...",
      "weight": 45,
      "geoHash": "PH.BH",
      "depth": null,
      "duration": null,
      "isAnonymous": false,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "user": {
        "id": "uuid",
        "uid": "DP-7729",
        "nickname": "Alice",
        "avatar": "https://...",
        "isAnonymous": false
      },
      "tags": ["珊瑚", "海龟"],
      "respectCount": 12,
      "commentCount": 5,
      "isRespected": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasMore": true
  }
}
```

**适配说明：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `time` | string | 相对时间，如 "2h", "1d", "3w" |
| `isAnonymous` | boolean | 是否匿名发布 |
| `isRespected` | boolean | 当前用户是否点赞 |

---

### 获取脉搏详情

```
GET /api/pulses/:id
```

**响应示例：**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "location": "菲律宾 - 长滩岛",
    "country": "PH",
    "visibility": 30,
    "flow": "Light",
    "temp": 28,
    "time": "2h",
    "image": "https://...",
    "weight": 45,
    "geoHash": "PH.BH",
    "depth": 18,
    "duration": 45,
    "isAnonymous": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "user": { ... },
    "tags": ["珊瑚", "海龟"],
    "respectCount": 12,
    "commentCount": 5,
    "isRespected": false
  }
}
```

---

### 发布新脉搏

```
POST /api/pulses
```

**请求头：**

```
Authorization: Bearer <token>
```

**请求体：**

```json
{
  "location": "菲律宾 - 长滩岛",
  "country": "PH",
  "visibility": 30,
  "flow": "Light",
  "temp": 28,
  "image": "https://example.com/image.jpg",
  "weight": 45,
  "geoHash": "PH.BH",
  "depth": 18,
  "duration": 45,
  "isAnonymous": false,
  "tags": ["珊瑚", "海龟"]
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| location | string | ✓ | 潜点位置 |
| image | string | ✓ | 照片URL |
| temp | number | ✓ | 水温 (-10°C ~ 40°C) |
| country | string | | 国家代码 |
| visibility | integer | | 能见度 (米) |
| flow | string | | 水流: None, Light, Moderate, Strong |
| weight | integer | | 重量指数 (1-100) |
| depth | integer | | 深度 (米) |
| duration | integer | | 潜水时长 (分钟) |
| geoHash | string | | 地理哈希 |
| isAnonymous | boolean | | 是否匿名 |
| tags | array | | 标签数组 |

---

### 点赞脉搏

```
POST /api/pulses/:id/respect
```

**响应示例：**

```json
{
  "success": true,
  "message": "点赞成功",
  "data": {
    "action": "liked"
  }
}
```

再次调用将取消点赞，action 变为 `"unliked"`。

---

### 评论脉搏

```
POST /api/pulses/:id/comment
```

**请求体：**

```json
{
  "content": "这地方太美了！",
  "parentId": null
}
```

---

### 获取脉搏评论

```
GET /api/pulses/:id/comments
```

---

## 拼潜模块 (Matches)

> **重要更新**: type 枚举已更改为 `BOAT`, `CAR`, `ROOM`, `TEAM`

### 获取拼潜列表

```
GET /api/matches
```

**查询参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| page | integer | 页码 |
| limit | integer | 每页数量 |
| type | string | 类型: BOAT, CAR, ROOM, TEAM |
| status | string | 状态: OPEN, FULL, CLOSED |
| country | string | 国家代码 |

**响应示例：**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "BOAT",
      "location": "菲律宾 - 长滩岛",
      "dateRange": {
        "start": "2026.04.05",
        "end": "2026.04.10"
      },
      "current": 2,
      "total": 6,
      "status": "open",
      "uid": "DP-7729",
      "note": "晨潜，寻找潜伴"
    }
  ],
  "pagination": { ... }
}
```

**适配说明：**

| 字段 | 前端字段 | 说明 |
|------|---------|------|
| `dateRange` | form.dateRange | 日期范围 { start, end } |
| `current` | item.current | 当前人数 (含发起人) |
| `total` | item.total | 最大人数 |
| `uid` | item.uid | 发起人 UID |
| `note` | item.note | 备注/描述 |

---

### 发起拼潜

```
POST /api/matches
```

**支持两种请求格式：**

**格式1: 标准格式**

```json
{
  "type": "BOAT",
  "title": "拼船出海",
  "location": "菲律宾薄荷岛",
  "country": "PH",
  "startDate": "2026-04-05T00:00:00.000Z",
  "endDate": "2026-04-10T00:00:00.000Z",
  "maxPeople": 6,
  "description": "晨潜，寻找潜伴"
}
```

**格式2: 前端格式 (推荐)**

```json
{
  "type": "BOAT",
  "location": "菲律宾薄荷岛",
  "dateRange": {
    "start": "2026.04.05",
    "end": "2026.04.10"
  },
  "total": 6,
  "note": "晨潜，寻找潜伴"
}
```

**响应示例：**

```json
{
  "success": true,
  "message": "发起成功",
  "data": {
    "id": "uuid",
    "type": "BOAT",
    "location": "菲律宾薄荷岛",
    "dateRange": {
      "start": "2026.04.05",
      "end": "2026.04.10"
    },
    "current": 1,
    "total": 6,
    "status": "open",
    "uid": "DP-7729",
    "note": "晨潜，寻找潜伴"
  }
}
```

---

### 参与拼潜

```
POST /api/matches/:id/join
```

**响应示例：**

```json
{
  "success": true,
  "message": "申请成功，等待发起者确认",
  "data": {
    "id": "uuid",
    "status": "pending",
    "user": { ... }
  }
}
```

---

### 退出拼潜

```
POST /api/matches/:id/leave
```

---

## 用户模块 (Users)

### 获取用户信息

```
GET /api/users/:id
```

---

### 更新个人资料

```
PUT /api/users/profile
```

**请求体：**

```json
{
  "nickname": "新昵称",
  "avatar": "https://example.com/avatar.jpg",
  "bio": "我是新的个人简介",
  "isAnonymous": false
}
```

---

## 消息模块 (Messages)

### 获取会话列表

```
GET /api/messages/conversations
```

---

### 获取会话消息

```
GET /api/messages/conversations/:id
```

---

### 发送消息

```
POST /api/messages
```

**请求体：**

```json
{
  "receiverId": "uuid",
  "content": "明天见！",
  "type": "TEXT"
}
```

---

## 标签模块 (Tags)

### 获取热门标签

```
GET /api/tags/popular
```

---

## 拼潜类型枚举

| 类型 | 说明 |
|------|------|
| `BOAT` | 拼船 |
| `CAR` | 拼车 |
| `ROOM` | 拼房 |
| `TEAM` | 组队 |

---

## 错误响应

```json
{
  "success": false,
  "message": "错误描述",
  "errors": [
    { "field": "email", "message": "请提供有效的邮箱" }
  ]
}
```

### HTTP 状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未认证 / 认证失败 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 409 | 资源冲突 |
| 500 | 服务器内部错误 |

---

## 启动指南

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 配置环境

```bash
cp .env.example .env
```

### 3. 初始化数据库

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

### 4. 启动服务

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

---

## 前端适配要点

### 1. 认证流程

```javascript
// 1. 发送验证码
const sendResponse = await fetch('/api/auth/otp/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: userEmail })
});

// 2. 用户输入验证码后登录
const loginResponse = await fetch('/api/auth/otp/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: userEmail, code: userCode })
});

// 3. 保存 token
const { token, user } = loginResponse.data;
localStorage.setItem('divepulse_user', JSON.stringify(user));
```

### 2. 请求示例 (带认证)

```javascript
const response = await fetch('/api/pulses', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

### 3. 脉搏数据结构

```javascript
const pulse = {
  id: 'uuid',
  location: '菲律宾 - 长滩岛',
  country: 'PH',
  visibility: 30,
  flow: 'Light',
  temp: 28,
  time: '2h',          // 相对时间
  weight: 45,
  geoHash: 'PH.BH',
  isAnonymous: false,
  user: { uid: 'DP-7729', ... },
  tags: ['珊瑚', '海龟'],
  respectCount: 12,
  commentCount: 5,
  isRespected: true    // 当前用户是否点赞
};
```

### 4. 拼潜数据结构

```javascript
const match = {
  id: 'uuid',
  type: 'BOAT',       // BOAT, CAR, ROOM, TEAM
  location: '菲律宾薄荷岛',
  dateRange: {
    start: '2026.04.05',
    end: '2026.04.10'
  },
  current: 2,          // 当前人数 (含发起人)
  total: 6,            // 最大人数
  status: 'open',
  uid: 'DP-7729',      // 发起人 UID
  note: '晨潜，寻找潜伴'
};
```

---

## 测试账号

| 邮箱 | 密码/验证码 |
|------|-------------|
| alice@divepulse.com | password123 / OTP登录 |
| bob@divepulse.com | password123 / OTP登录 |
| carol@divepulse.com | password123 / OTP登录 |
