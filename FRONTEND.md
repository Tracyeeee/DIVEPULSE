# DivePulse Frontend Documentation

> 潜水社交平台前端代码文档

---

## 项目概览

| 项目 | 值 |
|------|-----|
| 框架 | React 19 |
| 路由 | React Router v7 |
| 构建工具 | Vite |
| 样式 | CSS (无框架) |
| 状态管理 | React Context + useState |
| 数据存储 | localStorage |
| 图标 | 内联 SVG |

---

## 目录结构

```
src/
├── main.jsx              # 应用入口
├── App.jsx               # 根组件 & 路由配置
├── App.css               # 全局样式
├── index.css             # 全局样式 & CSS 变量
├── pages/
│   ├── Splash.jsx        # 启动页
│   ├── Login.jsx        # 登录页
│   ├── PulseFeed.jsx    # 脉搏列表 (首页)
│   ├── PulseDetail.jsx  # 脉搏详情
│   ├── PostPage.jsx     # 发布脉搏
│   ├── MatchHub.jsx     # 拼潜列表
│   ├── MatchCreate.jsx   # 创建拼潜
│   ├── Chat.jsx         # 聊天列表
│   ├── DetailIM.jsx     # 私信详情
│   ├── TagSearch.jsx     # 标签搜索
│   └── Profile.jsx      # 个人中心
├── components/
│   ├── BottomNav.jsx    # 底部导航栏
│   ├── IntentPicker.jsx # 发布意图选择器
│   └── CommentDrawer.jsx # 评论抽屉
└── *.css                # 各页面/组件样式
```

---

## 页面路由

| 路径 | 组件 | 说明 |
|------|------|------|
| `/` | `PulseFeed` | 脉搏列表首页 |
| `/pulse/:id` | `PulseDetail` | 脉搏详情页 |
| `/match` | `MatchHub` | 找搭子列表 |
| `/match/create` | `MatchCreate` | 创建拼潜 |
| `/post` | `PostPage` | 发布新脉搏 |
| `/chat` | `Chat` | 聊天列表 |
| `/detail/:id` | `DetailIM` | 私信对话 |
| `/tag/:tag` | `TagSearch` | 标签搜索结果 |
| `/profile` | `Profile` | 个人中心 |

---

## 核心组件

### App.jsx

应用根组件，负责认证状态管理和路由配置。

```jsx
// 状态
const [user, setUser] = useState(null)           // 当前用户
const [isLoading, setIsLoading] = useState(true)  // 加载状态
const [showSplash, setShowSplash] = useState(true) // 启动动画
const [showIntentPicker, setShowIntentPicker] = useState(false) // 意图选择器

// 登录方法
const login = (email) => {
  const uid = `DP-${Math.floor(1000 + Math.random() * 9000)}`
  const newUser = { uid, email, token: `tok_${Date.now()}` }
  localStorage.setItem('divepulse_user', JSON.stringify(newUser))
  setUser(newUser)
}

// 登出方法
const logout = () => {
  localStorage.removeItem('divepulse_user')
  setUser(null)
}
```

---

### AuthContext

全局认证上下文，通过 `useAuth()` hook 访问。

```jsx
// 使用方式
const { user, login, logout } = useAuth()

// Context 内容
export const AuthContext = createContext({
  user: null,
  login: () => {},
  logout: () => {}
})
```

---

## 页面详解

### PulseFeed.jsx (首页)

脉搏(潜水动态)信息流页面。

**状态管理：**
```jsx
const [search, setSearch] = useState('')           // 搜索关键词
const [sortBy, setSortBy] = useState('Most Liked') // 排序方式
const [timeRange, setTimeRange] = useState('All Time') // 时间范围
const [showFilter, setShowFilter] = useState(false) // 筛选面板
const [data, setData] = useState(INITIAL_PULSE_DATA) // 脉搏数据
const [respectedIds, setRespectedIds] = useState([]) // 已点赞ID
const [activeCommentPulse, setActiveCommentPulse] = useState(null) // 当前评论的脉搏
const [commentCounts, setCommentCounts] = useState({}) // 评论数
```

**排序选项：**
| 值 | 显示 |
|---|------|
| `Latest` | 最新 |
| `Most Liked` | 最多点赞 |
| `Most Commented` | 最多评论 |

**时间范围：**
| 值 | 显示 |
|---|------|
| `All Time` | 不限 |
| `24 Hours` | 1天内 |
| `7 Days` | 1周内 |
| `6 Months` | 半年内 |

**数据结构：**
```javascript
{
  id: number,
  location: string,        // 潜点位置
  country: string,         // 国家代码 (PH, TH, ID...)
  visibility: number,      // 能见度 (米)
  flow: string,            // 水流强度 (Light, Moderate, Strong)
  temp: number,            // 水温 (°C)
  time: string,            // 相对时间 (2h, 4h, 1d...)
  image: string,           // 图片URL
  weight: number,          // 重量指数
  geoHash: string,         // 地理哈希
  respectCount: number,    // 点赞数
  uid: string,             // 用户ID (DP-XXXX)
  isAnonymous: boolean,     // 是否匿名
  tags: string[]           // 标签
}
```

---

### Login.jsx

邮箱登录页面，支持验证码流程。

**登录步骤：**
1. Step 1: 输入邮箱
2. Step 2: 输入6位验证码
3. Demo模式: 直接登录

```jsx
const [step, setStep] = useState(1)    // 当前步骤
const [email, setEmail] = useState('') // 邮箱
const [code, setCode] = useState('')   // 验证码

// 邮箱格式验证
if (!email || !email.includes('@')) {
  setError('INVALID_EMAIL')
}

// 验证码长度验证
if (code.length !== 6) {
  setError('INVALID_CODE')
}
```

---

### PostPage.jsx

发布新脉搏页面。

**表单字段：**
```jsx
const [formData, setFormData] = useState({
  location: '',      // 潜点
  country: '',       // 国家代码
  date: '',          // 日期
  visibility: '',    // 能见度
  flow: 'Light',     // 水流
  temp: '',          // 水温
  content: '',       // 内容
  tags: [],          // 标签
  images: []         // 图片
})
```

**预设潜点 (热门潜水目的地)：**
```javascript
const FAMOUS_SPOTS = [
  { name: '仙本那', country: 'MY', display: '马来西亚 - 仙本那' },
  { name: '四王群岛', country: 'ID', display: '印尼 - 四王群岛' },
  { name: '长滩岛', country: 'PH', display: '菲律宾 - 长滩岛' },
  { name: '马尔代夫', country: 'MV', display: '马尔代夫' },
  { name: '帕劳', country: 'PW', display: '帕劳' },
  { name: '大堡礁', country: 'AU', display: '澳大利亚 - 大堡礁' },
  // ...更多
]
```

**预设标签：**
```javascript
['鲸鲨', 'Manta', '海龟', '虎鲸', '珊瑚', '鲨鱼', '章鱼', '水母', '珊瑚礁']
```

**水流选项：**
```javascript
['Light', 'Moderate', 'Strong']
```

---

### MatchHub.jsx

拼潜/找搭子功能页面。

**拼潜类型：**
```javascript
const MATCH_TYPES = {
  'BOAT': '拼船',
  'CAR': '拼车',
  'ROOM': '拼房',
  'TEAM': '组队'
}
```

**Tab切换：**
- `join`: 加入拼 (浏览列表)
- `my`: 我发起的 (我创建的)

**创建表单：**
```jsx
const [createForm, setCreateForm] = useState({
  type: 'BOAT',       // 拼潜类型
  location: '',       // 地点
  startDate: '',      // 开始日期
  endDate: '',        // 结束日期
  total: 2,           // 总人数
  note: ''            // 备注
})
```

**数据结构：**
```javascript
{
  id: number,
  type: string,            // BOAT, CAR, ROOM, TEAM
  location: string,        // 地点
  dateRange: {
    start: string,         // '2026.04.05'
    end: string | null
  },
  current: number,        // 当前人数
  total: number,           // 总人数
  status: string,          // open, full, closed
  uid: string,             // 发起人ID
  note: string             // 备注
}
```

---

### Profile.jsx

个人中心页面。

**统计指标：**
```javascript
const stats = {
  pulse_count: number,         // 发帖数
  match_count: number,         // 加入的拼行数
  respect_received: number     // 收到的点赞数
}
```

**编辑昵称：**
- 最大12字符
- 仅允许中英文数字
- 自动过滤特殊字符
- 保存到 `localStorage`

---

### Chat.jsx

聊天列表页面。

**会话类型：**
| 类型 | 说明 |
|------|------|
| `match` | 拼潜相关 |
| `pulse` | 脉搏相关 |
| `user` | 用户私信 |

---

## 组件详解

### BottomNav.jsx

底部导航栏，固定在页面底部。

**导航项：**
| 路径 | 图标 | 标签 | 说明 |
|------|------|------|------|
| `/` | ◎ | PULSE | 首页 |
| `/match` | ⊞ | MATCH | 找搭子 |
| `button` | + | - | 发布按钮 |
| `/chat` | ◻ | CHAT | 聊天 |
| `/profile` | ◯ | ME | 我的 |

**功能：**
- `NavLink` 自动高亮当前路由
- 发布按钮触发 `IntentPicker`

---

### IntentPicker.jsx

发布意图选择器，弹窗形式。

**选项：**
| 选项 | 图标 | 路由 |
|------|------|------|
| 脉搏 | ◎ | `/post` |
| 拼船 | ⛵ | `/match/create?type=BOAT` |
| 拼车 | 🚗 | `/match/create?type=CAR` |
| 拼房 | 🏠 | `/match/create?type=ROOM` |
| 组队 | 👥 | `/match/create?type=TEAM` |

---

### CommentDrawer.jsx

评论抽屉组件，从底部滑入。

**功能：**
- 发表评论
- 回复评论
- 嵌套显示回复
- 实时更新评论数

**数据存储：**
```
localStorage: divepulse_comments_{pulseId}
```

---

## CSS 设计系统

### 颜色变量

```css
:root {
  --bg-primary: #000000;           /* 主背景 - 纯黑 */
  --bg-secondary: #000000;         /* 次级背景 */
  --color-brand: #00F5FF;          /* 品牌色 - 荧光青 */
  --color-text-primary: #FFFFFF;   /* 主文字 - 白色 */
  --color-text-secondary: #888888; /* 次级文字 - 灰色 */
  --color-border: #333333;         /* 边框色 */
  --color-error: #FF4444;          /* 错误色 - 红色 */
  --color-success: #00F5FF;        /* 成功色 - 品牌青 */
}
```

### 字体

```css
--font-mono: 'Roboto Mono', monospace;  /* 等宽字体 - 数据/标签 */
--font-sans: 'Inter', sans-serif;       /* 无衬线 - 标题/正文 */
```

### 间距

```css
--space-xs: 4px;   /* 超小 */
--space-sm: 8px;   /* 小 */
--space-md: 16px;  /* 中等 */
--space-lg: 24px;  /* 大 */
--space-xl: 32px;  /* 特大 */
--space-xxl: 48px; /* 超大 */
```

### 圆角

```css
--radius: 2px;  /* 固定2px圆角 */
```

### 过渡

```css
--transition-instant: 0ms;  /* 即时切换，无动画 */
```

### Z-Index

```css
--z-base: 1;
--z-dropdown: 100;
--z-modal: 200;
--z-toast: 300;
```

---

## localStorage 数据存储

| 键名 | 数据类型 | 说明 |
|------|----------|------|
| `divepulse_user` | JSON | 用户会话信息 |
| `divepulse_nickname` | string | 用户昵称 |
| `divepulse_respects` | JSON Array | 点赞的脉搏ID列表 |
| `divepulse_new_pulses` | JSON Array | 用户发布的脉搏 |
| `divepulse_matches` | JSON Array | 用户的拼行 |
| `divepulse_comments_{id}` | JSON Array | 脉搏评论 |
| `divepulse_conversations` | JSON Array | 聊天会话 |
| `divepulse_messages_{id}` | JSON Array | 私信消息 |

---

## 用户 ID 格式

用户 ID 采用 `DP-XXXX` 格式：
- 前缀: `DP-`
- 随机4位数字 (1000-9999)

```javascript
const uid = `DP-${Math.floor(1000 + Math.random() * 9000)}`
```

---

## 热门潜水目的地

| 国家 | 代码 | 目的地 |
|------|------|--------|
| 马来西亚 | MY | 仙本那、刁曼岛 |
| 印度尼西亚 | ID | 四王群岛、巴厘岛 |
| 菲律宾 | PH | 长滩岛、妈妈拍丝瓜岛、薄荷岛、科隆 |
| 泰国 | TH | 斯米兰、普吉 |
| 马尔代夫 | MV | 马尔代夫 |
| 帕劳 | PW | 帕劳 |
| 澳大利亚 | AU | 大堡礁 |
| 埃及 | EG | 红海 |
| 日本 | JP | 冲绳 |

---

## 脉搏数据指标

| 指标 | 字段 | 单位 | 说明 |
|------|------|------|------|
| 能见度 | `visibility` | 米(m) | 水下能见距离 |
| 水流 | `flow` | - | None/Light/Moderate/Strong |
| 水温 | `temp` | °C | 水下温度 |
| 深度 | `depth` | 米(m) | 最大深度 |
| 时长 | `duration` | 分钟(min) | 潜水时长 |
| 重量 | `weight` | - | 配重指数 |

---

## 开发指南

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 代码规范

- 使用 `font-mono` 类显示数据/标签
- 使用 `font-sans` 类显示标题/正文
- 所有交互使用 `--transition-instant` (0ms)
- 颜色使用 CSS 变量

### 组件开发规范

1. 组件文件与样式文件同名
2. 使用 CSS Modules 或独立 CSS 文件
3. 所有 SVG 图标内联
4. 不使用外部图标库

---

## 版本信息

- **应用名称**: DivePulse (潜脉)
- **版本**: v1.0
- **技术栈**: React 19 + Vite + React Router v7
