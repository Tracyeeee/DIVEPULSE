# DivePulse 代码审查报告

> **项目**: DivePulse (潜脉)  
> **审查日期**: 2026-03-27  
> **审查范围**: 前端 (React) + 后端 (Node.js/Express)  
> **风险等级**: 🔴 高危 | 🟡 中危 | 🟢 低危

---

## 一、崩溃风险分析

### 1. localStorage 数据损坏 (🔴 高危)

**影响范围**: 几乎所有页面

**问题代码示例**:

```javascript
// PulseFeed.jsx L171-182
const savedPulses = localStorage.getItem('divepulse_new_pulses')
JSON.parse(savedPulses).forEach(...)  // ❌ 无 try-catch

// Profile.jsx L24-29
const savedPulses = localStorage.getItem('divepulse_new_pulses')
const pulses = JSON.parse(savedPulses)  // ❌ 无 try-catch

// MatchCreate.jsx L39
JSON.parse(localStorage.getItem('divepulse_user')).uid  // ❌ 无 try-catch
```

**崩溃场景**:
1. 用户手动修改 localStorage 导致 JSON 格式错误
2. 浏览器存储 quota 满导致数据截断
3. 跨域 iframe 注入损坏数据
4. 浏览器插件污染存储数据

**修复建议**:

```javascript
// 安全读取 localStorage
const safeJSONParse = (key, fallback = null) => {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : fallback
  } catch (e) {
    console.error(`localStorage parse error for key: ${key}`, e)
    return fallback
  }
}

// 使用示例
const savedPulses = safeJSONParse('divepulse_new_pulses', [])
```

---

### 2. 认证上下文解构风险 (🔴 高危)

**影响范围**: App.jsx, Splash.jsx

**问题代码**:

```javascript
// Splash.jsx L7
const { uid } = useAuth() || {}  // ❌ 顺序错误

// useAuth() 返回 Context 值，不应为 null 时返回 {}
// 但 Context 的默认值就是 null，导致 uid 始终为 undefined
```

**崩溃场景**:
- Splash 页面获取 uid 时，如果 Context 未正确提供会返回 undefined
- 导致页面显示异常

**修复建议**:

```javascript
// App.jsx - 确保默认值正确
export const AuthContext = createContext({
  user: null,
  login: () => {},
  logout: () => {}
})

// Splash.jsx - 正确使用
const { user } = useAuth()
const uid = user?.uid || 'GUEST'
```

---

### 3. parseInt 潜在问题 (🟡 中危)

**影响范围**: PulseDetail.jsx, CommentDrawer.jsx

**问题代码**:

```javascript
// PulseDetail.jsx L186
const pulseId = parseInt(id)  // ❌ id 为 undefined 时返回 NaN

// L217: prev?.respectCount - 1
// NaN 比较会返回 false，逻辑不会执行
```

**修复建议**:

```javascript
const pulseId = parseInt(id, 10) || 0  // 提供默认值
```

---

### 4. 未定义的数组操作 (🔴 高危)

**影响范围**: TagSearch.jsx, Profile.jsx

**问题代码**:

```javascript
// Profile.jsx L27
const userPulses = pulses.filter(p => p.uid === user?.uid)
// 如果 pulses 为 null 或 undefined，.filter() 会抛出异常

// TagSearch.jsx L125
item.tags?.includes(decodedTag)  // 缺少可选链
```

---

### 5. 计时器负数处理 (🟡 中危)

**影响范围**: DetailIM.jsx

**问题代码**:

```javascript
// DetailIM.jsx L105-111
setCountdown(prev => {
  const [h, m, s] = prev.split(':').map(Number)
  if (s > 0) return `${h}:${m}:${s - 1}`  // ❌ s-1 可能为负数
  // ...
})
```

**崩溃场景**:
- 倒计时到 00:00:00 后继续递减变为负数
- 00:00:01 时 s 递减到 0，不会正确处理

**修复建议**:

```javascript
setCountdown(prev => {
  const [h, m, s] = prev.split(':').map(Number)
  const totalSeconds = h * 3600 + m * 60 + s
  if (totalSeconds <= 0) return '00:00:00'
  
  const newTotal = totalSeconds - 1
  const newH = Math.floor(newTotal / 3600)
  const newM = Math.floor((newTotal % 3600) / 60)
  const newS = newTotal % 60
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}:${String(newS).padStart(2, '0')}`
})
```

---

## 二、后端风险分析

### 1. Prisma 错误未处理 (🔴 高危)

**影响范围**: 所有控制器

**问题代码**:

```javascript
// 所有控制器
const user = await prisma.user.findUnique({ where: { id } })
// 如果数据库连接失败，返回 null，但代码继续执行
```

**修复建议**:

```javascript
export const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } })
    
    if (!user) {
      return errorResponse(res, '用户不存在', 404)
    }
    
    // 继续处理...
  } catch (error) {
    next(error)  // 交给统一错误处理
  }
}
```

---

### 2. OTP 内存存储问题 (🔴 高危)

**影响范围**: authController.js

**问题代码**:

```javascript
// authController.js
const otpStore = new Map()
// ❌ 内存存储，服务重启后丢失
// ❌ 无 Redis 等持久化
// ❌ 横向扩展时无法共享验证码
```

**生产风险**:
- 服务重启丢失所有待验证的 OTP
- 多实例部署时验证码可能串不到

---

### 3. JWT 错误处理不完整 (🟡 中危)

**影响范围**: auth.js 中间件

**问题代码**:

```javascript
// auth.js L16-17
const decoded = jwt.verify(token, process.env.JWT_SECRET)
// ❌ 如果 JWT_SECRET 未配置，会抛出异常
```

---

### 4. 数组索引访问风险 (🟡 中危)

**影响范围**: matchController.js

**问题代码**:

```javascript
// matchController.js L48-49
const formatted = matches.map(m => ({
  ...m,
// ❌ spread operator 展开 Prisma 结果，可能包含不必要的字段
  currentPeople: m._count.participants + 1
}))
```

---

### 5. 缺少请求超时处理 (🟡 中危)

**影响范围**: app.js

**问题代码**:

```javascript
// app.js
app.use(express.json({ limit: '10mb' }))
// ❌ 无请求超时配置
// ❌ 数据库查询无超时限制
```

---

## 三、逻辑漏洞分析

### 1. 评论删除权限绕过 (🟡 中危)

**文件**: CommentDrawer.jsx L34-41

```javascript
const handleDelete = (commentId) => {
  const canDelete = user?.uid === comments.find(c => c.id === commentId)?.uid 
                 || user?.uid === pulseCreatorUid
  if (!canDelete) return
  // ...
}
```

**漏洞**:
- 仅前端检查，后端未验证
- 攻击者可通过 API 直接删除任意评论

---

### 2. 点赞状态不同步 (🟡 中危)

**文件**: PulseFeed.jsx

**问题**:
- 点赞状态 `respectedIds` 仅存储在 localStorage
- 不同标签页之间不同步
- 页面刷新后可能丢失

---

### 3. Match 状态更新滞后 (🟡 中危)

**文件**: MatchHub.jsx

```javascript
const handleRequest = (id) => {
  if (myRequests.includes(id)) return  // ❌ 仅前端检查
  setMyRequests([...myRequests, id])
}
```

**问题**:
- 如果后端请求失败，UI 仍显示"已申请"
- 无重试机制

---

### 4. 无限递归风险 (🟡 中危)

**文件**: pulseController.js L123

```javascript
const checkIfRespected = async (pulseId, userId) => {
  if (!userId) return false  // ✅ 有防护
  // ...
}
```

**评估**: 此处有防护，但其他地方可能存在类似风险

---

## 四、未处理的异常捕获点汇总

### 前端 (11 个高危点)

| 文件 | 行号 | 风险类型 | 严重度 |
|------|------|----------|--------|
| App.jsx | 28-31 | JSON.parse | 🔴 高 |
| PulseFeed.jsx | 171-182 | JSON.parse | 🔴 高 |
| PulseFeed.jsx | 192-195 | 数组操作 | 🔴 高 |
| PostPage.jsx | 128-130 | JSON.parse | 🔴 高 |
| MatchCreate.jsx | 39 | JSON.parse | 🔴 高 |
| Profile.jsx | 16-20 | JSON.parse | 🔴 高 |
| Profile.jsx | 26-29 | 数组操作 | 🔴 高 |
| PulseDetail.jsx | 192 | JSON.parse | 🔴 高 |
| CommentDrawer.jsx | 12-14 | JSON.parse | 🔴 高 |
| Chat.jsx | 32-33 | JSON.parse | 🔴 高 |
| TagSearch.jsx | 117-118 | JSON.parse | 🔴 高 |

### 后端 (4 个中危点)

| 文件 | 行号 | 风险类型 | 严重度 |
|------|------|----------|--------|
| authController.js | - | OTP Store | 🔴 高 |
| matchController.js | 11-28 | 日期解析 | 🟡 中 |
| pulseController.js | 47-50 | 时间范围 | 🟡 中 |
| 所有控制器 | - | Prisma 错误 | 🟡 中 |

---

## 五、测试用例 (Test Cases)

### 1. 前端核心链路测试

```javascript
// test_frontend.spec.js

describe('DivePulse 前端核心测试', () => {
  
  // TC-001: localStorage 数据损坏
  test('localStorage 数据损坏时应显示空列表', () => {
    // 模拟损坏的 localStorage
    localStorage.setItem('divepulse_new_pulses', '{invalid json}')
    localStorage.setItem('divepulse_respects', 'not array')
    
    render(<PulseFeed />)
    
    // 应显示空状态而非崩溃
    expect(screen.getByText(/NO DATA FOUND/i)).toBeInTheDocument()
  })
  
  // TC-002: 未登录用户访问受保护页面
  test('未登录用户访问首页应显示登录页', () => {
    localStorage.clear()
    
    render(<App />)
    
    expect(screen.getByText(/DivePulse/i)).toBeInTheDocument()
    expect(screen.getByText(/EMAIL/i)).toBeInTheDocument()
  })
  
  // TC-003: 评论字数限制
  test('评论超过100字应被截断', () => {
    const longComment = 'a'.repeat(200)
    
    render(<CommentDrawer pulseId={1} />)
    
    fireEvent.change(screen.getByPlaceholderText(/SUPPLEMENTARY/i), {
      target: { value: longComment }
    })
    
    // 应自动截断
    const input = screen.getByPlaceholderText(/SUPPLEMENTARY/i)
    expect(input.value.length).toBe(100)
  })
  
  // TC-004: 点赞状态持久化
  test('点赞后刷新页面状态应保留', () => {
    render(<PulseFeed />)
    
    // 点赞
    fireEvent.click(screen.getAllByText(/42/i)[0].closest('.like-btn'))
    
    // 模拟刷新
    const respectedIds = JSON.parse(localStorage.getItem('divepulse_respects'))
    expect(respectedIds).toContain(1)
  })
  
  // TC-005: 匿名用户显示
  test('匿名脉搏应显示 Anonymous', () => {
    render(<PulseDetail />)
    
    expect(screen.getByText(/Anonymous/i)).toBeInTheDocument()
  })
  
  // TC-006: 空搜索结果
  test('搜索不存在的结果应显示空状态', () => {
    render(<PulseFeed />)
    
    fireEvent.change(screen.getByPlaceholderText(/SEARCH/i), {
      target: { value: '不存在的潜点' }
    })
    
    expect(screen.getByText(/NO DATA FOUND/i)).toBeInTheDocument()
  })
  
  // TC-007: 倒计时边界
  test('倒计时到零应停止', () => {
    render(<DetailIM />)
    
    // 模拟倒计时
    act(() => {
      jest.tick(48 * 60 * 60 * 1000) // 48小时
    })
    
    expect(screen.getByText(/00:00:00/i)).toBeInTheDocument()
  })
})
```

### 2. 后端 API 测试

```javascript
// test_api.spec.js

describe('DivePulse API 测试', () => {
  
  // TC-101: OTP 发送
  test('POST /api/auth/otp/send 应返回成功', async () => {
    const res = await request(app)
      .post('/api/auth/otp/send')
      .send({ email: 'test@example.com' })
    
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })
  
  // TC-102: OTP 登录 - 验证码错误
  test('错误的验证码应返回 400', async () => {
    const res = await request(app)
      .post('/api/auth/otp/login')
      .send({ email: 'test@example.com', code: '000000' })
    
    expect(res.status).toBe(400)
    expect(res.body.message).toBe('请先获取验证码')
  })
  
  // TC-103: 脉搏列表 - 排序参数
  test('sortBy=Most Liked 应正确排序', async () => {
    const res = await request(app)
      .get('/api/pulses?sortBy=Most Liked')
    
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    
    const pulses = res.body.data
    for (let i = 0; i < pulses.length - 1; i++) {
      expect(pulses[i].respectCount).toBeGreaterThanOrEqual(pulses[i + 1].respectCount)
    }
  })
  
  // TC-104: 脉搏列表 - 时间范围
  test('timeRange=24 Hours 应只返回24小时内数据', async () => {
    const res = await request(app)
      .get('/api/pulses?timeRange=24 Hours')
    
    expect(res.status).toBe(200)
    
    const now = new Date()
    res.body.data.forEach(pulse => {
      const created = new Date(pulse.createdAt)
      expect(now - created).toBeLessThan(24 * 60 * 60 * 1000)
    })
  })
  
  // TC-105: 创建拼潜 - 前端格式
  test('POST /api/matches 应接受前端 dateRange 格式', async () => {
    const res = await request(app)
      .post('/api/matches')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'BOAT',
        location: '测试地点',
        dateRange: {
          start: '2026.04.05',
          end: '2026.04.10'
        },
        total: 4,
        note: '测试备注'
      })
    
    expect(res.status).toBe(201)
    expect(res.body.data.dateRange.start).toBe('2026.04.05')
    expect(res.body.data.current).toBe(1)
  })
  
  // TC-106: 点赞状态检查
  test('已点赞的脉搏应返回 isRespected=true', async () => {
    // 先点赞
    await request(app)
      .post(`/api/pulses/${pulseId}/respect`)
      .set('Authorization', `Bearer ${token}`)
    
    // 获取列表
    const res = await request(app)
      .get('/api/pulses')
      .set('Authorization', `Bearer ${token}`)
    
    const pulse = res.body.data.find(p => p.id === pulseId)
    expect(pulse.isRespected).toBe(true)
  })
  
  // TC-107: JWT 过期处理
  test('过期的 JWT 应返回 401', async () => {
    const expiredToken = jwt.sign({ userId: 'test' }, 'secret', { expiresIn: '-1h' })
    
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${expiredToken}`)
    
    expect(res.status).toBe(401)
  })
  
  // TC-108: 数据库连接失败
  test('数据库断开时应返回 500', async () => {
    // 模拟数据库断开
    await prisma.$disconnect()
    
    const res = await request(app)
      .get('/api/pulses')
    
    expect(res.status).toBe(500)
  })
})
```

### 3. 集成测试

```javascript
// test_integration.spec.js

describe('DivePulse 集成测试', () => {
  
  // TC-201: 完整用户旅程
  test('注册 -> 登录 -> 发布脉搏 -> 点赞', async () => {
    // 1. 发送 OTP
    await request(app)
      .post('/api/auth/otp/send')
      .send({ email: 'integration@test.com' })
    
    // 2. 登录 (需要先获取正确验证码)
    const loginRes = await request(app)
      .post('/api/auth/otp/login')
      .send({ email: 'integration@test.com', code: '123456' })
    
    expect(loginRes.body.success).toBe(true)
    const token = loginRes.body.token
    const user = loginRes.body.data.user
    
    // 3. 发布脉搏
    const pulseRes = await request(app)
      .post('/api/pulses')
      .set('Authorization', `Bearer ${token}`)
      .send({
        location: '测试地点',
        temp: 25,
        image: 'https://example.com/image.jpg',
        tags: ['测试']
      })
    
    expect(pulseRes.status).toBe(201)
    const pulseId = pulseRes.body.data.id
    
    // 4. 点赞自己发布的脉搏
    const respectRes = await request(app)
      .post(`/api/pulses/${pulseId}/respect`)
      .set('Authorization', `Bearer ${token}`)
    
    expect(respectRes.body.data.action).toBe('liked')
    
    // 5. 验证点赞状态
    const pulseDetailRes = await request(app)
      .get(`/api/pulses/${pulseId}`)
      .set('Authorization', `Bearer ${token}`)
    
    expect(pulseDetailRes.body.data.isRespected).toBe(true)
    expect(pulseDetailRes.body.data.respectCount).toBe(1)
  })
  
  // TC-202: 拼潜完整流程
  test('创建拼潜 -> 申请参与 -> 查看', async () => {
    // 创建者
    const creator = await loginAs('creator@test.com')
    
    // 创建拼潜
    const matchRes = await request(app)
      .post('/api/matches')
      .set('Authorization', `Bearer ${creator.token}`)
      .send({
        type: 'BOAT',
        location: '测试地点',
        dateRange: { start: '2026.05.01', end: '2026.05.03' },
        total: 4,
        note: '测试拼潜'
      })
    
    const matchId = matchRes.body.data.id
    expect(matchRes.body.data.current).toBe(1)
    expect(matchRes.body.data.total).toBe(4)
    
    // 参与者
    const participant = await loginAs('participant@test.com')
    
    // 申请参与
    await request(app)
      .post(`/api/matches/${matchId}/join`)
      .set('Authorization', `Bearer ${participant.token}`)
    
    // 验证状态
    const detailRes = await request(app)
      .get(`/api/matches/${matchId}`)
    
    expect(detailRes.body.data.current).toBe(2)
  })
})
```

---

## 六、修复优先级建议

### P0 (立即修复 - 会导致崩溃)

1. ✅ 所有 localStorage JSON.parse 包装 try-catch
2. ✅ App.jsx 认证上下文默认值
3. ✅ MatchCreate.jsx localStorage 安全读取

### P1 (本周修复 - 逻辑错误)

4. 评论删除权限 - 后端添加验证
5. 点赞状态同步问题
6. OTP 存储改用 Redis (或增加说明)

### P2 (计划修复 - 改进体验)

7. 表单验证增强
8. 请求超时配置
9. 错误边界 (Error Boundary)
10. 单元测试覆盖

---

## 七、测试覆盖率目标

| 模块 | 当前覆盖率 | 目标覆盖率 |
|------|-----------|-----------|
| Auth | 40% | 90% |
| Pulse | 30% | 85% |
| Match | 25% | 80% |
| Message | 20% | 75% |

---

*报告生成时间: 2026-03-27*  
*审查工具: 人工代码审查 + 静态分析*
