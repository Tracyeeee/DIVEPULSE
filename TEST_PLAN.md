# DivePulse 全链路测试方案

> **项目**: DivePulse (潜脉)  
> **版本**: v2.0  
> **测试日期**: 2026-03-27  
> **测试范围**: 前端 + 后端 + 数据层 + 核心业务流

---

## 目录

1. [测试架构总览](#测试架构总览)
2. [功能测试](#功能测试)
3. [兼容性测试](#兼容性测试)
4. [性能测试](#性能测试)
5. [安全测试](#安全测试)
6. [用户体验测试](#用户体验测试)
7. [合规测试](#合规测试)
8. [核心业务流测试矩阵](#核心业务流测试矩阵)
9. [缺陷跟踪](#缺陷跟踪)

---

## 测试架构总览

```
┌─────────────────────────────────────────────────────────────┐
│                        前端层 (React)                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │PulseFeed│ │ MatchHub│ │  Chat   │ │ Profile │           │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘           │
│       └───────────┴───────────┴───────────┘                 │
│                         │                                   │
│              ┌───────────┴───────────┐                       │
│              │   safeStorage.js      │                       │
│              │   (状态持久化层)       │                       │
│              └───────────┬───────────┘                       │
└──────────────────────────┼──────────────────────────────────┘
                           │ HTTP/REST
┌──────────────────────────┼──────────────────────────────────┐
│                     API 网关层                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│  │  Auth    │  │  Pulse   │  │  Match   │                   │
│  │  Route   │  │  Route   │  │  Route   │                   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘                   │
│       └─────────────┼─────────────┘                           │
│                     │                                        │
│  ┌──────────────────┼──────────────────┐                      │
│  │       JWT Middleware              │                      │
│  │       Rate Limiting              │                      │
│  │       Error Handler              │                      │
│  └──────────────────┬──────────────────┘                      │
└─────────────────────┼───────────────────────────────────────┘
                      │
┌─────────────────────┼───────────────────────────────────────┐
│                  数据访问层 (Prisma)                        │
│  ┌──────────────────┼──────────────────┐                      │
│  │         Transaction Manager        │                      │
│  │         (脏写保护)                 │                      │
│  └──────────────────┬──────────────────┘                      │
└─────────────────────┼───────────────────────────────────────┘
                      │
┌─────────────────────┼───────────────────────────────────────┐
│                   数据库层 (SQLite)                          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │  User   │ │  Pulse  │ │  Match  │ │Message  │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
└─────────────────────────────────────────────────────────────┘
```

---

## 一、功能测试

### 1.1 核心业务流程测试

#### TC-FUNC-001: OTP 认证完整流程

```javascript
describe('OTP 认证流程测试', () => {
  test('正常登录流程', async () => {
    // 1. 发送验证码
    const sendRes = await request(app)
      .post('/api/auth/otp/send')
      .send({ email: 'test@divepulse.com' })
    expect(sendRes.status).toBe(200)
    
    // 2. 验证返回的验证码 (开发环境)
    const code = sendRes.body.data._debug
    
    // 3. 使用验证码登录
    const loginRes = await request(app)
      .post('/api/auth/otp/login')
      .send({ email: 'test@divepulse.com', code })
    expect(loginRes.status).toBe(200)
    expect(loginRes.body.data.token).toBeDefined()
    expect(loginRes.body.data.user.uid).toMatch(/^DP-\d{4}$/)
  })
  
  test('错误验证码应返回 400', async () => {
    const res = await request(app)
      .post('/api/auth/otp/login')
      .send({ email: 'test@divepulse.com', code: '000000' })
    expect(res.status).toBe(400)
  })
  
  test('过期验证码应返回错误', async () => {
    // 等待 5 分钟后测试
    // 或者直接修改 otpStore 中的 expiresAt
  })
})
```

#### TC-FUNC-002: 脉搏发布与点赞流程

```javascript
describe('脉搏发布与点赞测试', () => {
  let token, userId, pulseId
  
  beforeAll(async () => {
    // 登录获取 token
    const res = await loginAs('testuser')
    token = res.token
    userId = res.userId
  })
  
  test('发布脉搏', async () => {
    const res = await request(app)
      .post('/api/pulses')
      .set('Authorization', `Bearer ${token}`)
      .send({
        location: '长滩岛',
        country: 'PH',
        temp: 28,
        image: 'https://example.com/pic.jpg',
        tags: ['海龟', '珊瑚']
      })
    expect(res.status).toBe(201)
    expect(res.body.data.time).toBeDefined()  // 相对时间
    expect(res.body.data.isAnonymous).toBeDefined()
    pulseId = res.body.data.id
  })
  
  test('点赞脉搏', async () => {
    const res = await request(app)
      .post(`/api/pulses/${pulseId}/respect`)
      .set('Authorization', `Bearer ${token}`)
    expect(res.body.data.action).toBe('liked')
  })
  
  test('再次点赞应取消点赞', async () => {
    const res = await request(app)
      .post(`/api/pulses/${pulseId}/respect`)
      .set('Authorization', `Bearer ${token}`)
    expect(res.body.data.action).toBe('unliked')
  })
  
  test('查看脉搏应显示点赞状态', async () => {
    await request(app)
      .post(`/api/pulses/${pulseId}/respect`)
      .set('Authorization', `Bearer ${token}`)
    
    const res = await request(app)
      .get(`/api/pulses/${pulseId}`)
      .set('Authorization', `Bearer ${token}`)
    expect(res.body.data.isRespected).toBe(true)
    expect(res.body.data.respectCount).toBe(1)
  })
})
```

#### TC-FUNC-003: 拼潜完整流程

```javascript
describe('拼潜流程测试', () => {
  test('创建拼潜 (前端格式)', async () => {
    const res = await request(app)
      .post('/api/matches')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'BOAT',
        location: '长滩岛',
        dateRange: {
          start: '2026.04.05',
          end: '2026.04.10'
        },
        total: 4,
        note: '晨潜招募'
      })
    
    expect(res.status).toBe(201)
    expect(res.body.data.type).toBe('BOAT')
    expect(res.body.data.dateRange.start).toBe('2026.04.05')
    expect(res.body.data.current).toBe(1)  // 发起者
  })
  
  test('参与拼潜', async () => {
    // 第二个用户参与
    const res = await request(app)
      .post(`/api/matches/${matchId}/join`)
      .set('Authorization', `Bearer ${token2}`)
    expect(res.body.message).toContain('申请成功')
  })
  
  test('重复参与应返回错误', async () => {
    const res = await request(app)
      .post(`/api/matches/${matchId}/join`)
      .set('Authorization', `Bearer ${token2}`)
    expect(res.status).toBe(400)
  })
})
```

#### TC-FUNC-004: 评论与删除权限

```javascript
describe('评论权限测试', () => {
  test('评论作者可删除自己的评论', async () => {
    const res = await request(app)
      .delete(`/api/pulses/${pulseId}/comment/${commentId}`)
      .set('Authorization', `Bearer ${authorToken}`)
    expect(res.status).toBe(200)
  })
  
  test('脉搏作者可删除任何评论', async () => {
    // 用户2在用户1的脉搏下评论
    const comment = await createComment(pulseId, user2Token)
    
    // 用户1删除用户2的评论
    const res = await request(app)
      .delete(`/api/pulses/${pulseId}/comment/${comment.id}`)
      .set('Authorization', `Bearer ${user1Token}`)
    expect(res.status).toBe(200)
  })
  
  test('普通用户不能删除他人评论', async () => {
    // 用户3尝试删除用户2的评论
    const res = await request(app)
      .delete(`/api/pulses/${pulseId}/comment/${comment2Id}`)
      .set('Authorization', `Bearer ${user3Token}`)
    expect(res.status).toBe(403)
  })
})
```

### 1.2 异常场景测试

#### TC-FUNC-101: 数据库异常处理

```javascript
describe('数据库异常测试', () => {
  test('数据库断开时应返回 500', async () => {
    await prisma.$disconnect()
    
    const res = await request(app)
      .get('/api/pulses')
    
    expect(res.status).toBe(500)
    expect(res.body.message).toContain('服务器内部错误')
    
    // 重新连接
    await prisma.$connect()
  })
  
  test('Prisma 唯一约束冲突', async () => {
    // 尝试创建重复的 email
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: existingEmail, password: '123456' })
    
    expect(res.status).toBe(409)
    expect(res.body.code).toBe('P2002')
  })
})
```

#### TC-FUNC-102: 前端状态一致性

```javascript
describe('前端状态一致性测试', () => {
  test('localStorage 损坏时应显示空列表', () => {
    localStorage.setItem('divepulse_new_pulses', '{invalid}')
    
    render(<PulseFeed />)
    
    expect(screen.getByText(/NO DATA FOUND/i)).toBeInTheDocument()
  })
  
  test('强制刷新后点赞状态应恢复', () => {
    // 点赞
    fireEvent.click(screen.getByTestId('like-btn'))
    
    // 模拟刷新
    const respects = JSON.parse(localStorage.getItem('divepulse_respects'))
    expect(respects).toContain(pulseId)
  })
  
  test('Session 过期后应显示登录页', () => {
    localStorage.removeItem('divepulse_user')
    
    render(<App />)
    
    expect(screen.getByText(/EMAIL/i)).toBeInTheDocument()
  })
})
```

---

## 二、兼容性测试

### 2.1 iOS 设备矩阵

| 设备 | iOS 版本 | 屏幕尺寸 | 分辨率 | 状态 |
|------|----------|----------|--------|------|
| iPhone 15 Pro | 17.x | 6.1" | 1179x2556 | 必测 |
| iPhone 15 | 17.x | 6.1" | 1179x2556 | 必测 |
| iPhone 14 Pro | 16.x | 6.1" | 1179x2556 | 必测 |
| iPhone 13 mini | 15.x | 5.4" | 1080x2340 | 推荐 |
| iPhone SE (3rd) | 15.x | 4.7" | 750x1334 | 推荐 |
| iPad Pro 12.9" | 17.x | 12.9" | 2048x2732 | 可选 |

**测试用例**:

```javascript
describe('iOS 兼容性测试', () => {
  const devices = [
    { name: 'iPhone 15 Pro', width: 393, height: 852 },
    { name: 'iPhone 13 mini', width: 375, height: 812 },
  ]
  
  devices.forEach(device => {
    test(`${device.name} 布局测试`, () => {
      global.innerWidth = device.width
      global.innerHeight = device.height
      
      render(<PulseFeed />)
      
      // 验证底部导航不遮挡内容
      const nav = screen.getByTestId('bottom-nav')
      expect(nav).toBeInTheDocument()
      
      // 验证卡片宽度适配
      const cards = screen.getAllByTestId('pulse-card')
      cards.forEach(card => {
        expect(card.offsetWidth).toBeLessThanOrEqual(device.width)
      })
    })
  })
  
  test('iOS Safari 特殊问题检测', () => {
    // 1. 安全区域适配
    const safeArea = CSS.supports('padding: env(safe-area-inset-bottom)')
    expect(safeArea).toBe(true)
    
    // 2. 200ms 点击延迟
    const touchAction = getComputedStyle(element).touchAction
    expect(touchAction).toBe('manipulation')
    
    // 3. 弹性滚动
    const overscroll = document.body.style.overscrollBehavior
    expect(overscroll).toBe('none')
  })
})
```

### 2.2 Android 设备矩阵

| 设备 | Android 版本 | 屏幕尺寸 | 分辨率 | 状态 |
|------|-------------|----------|--------|------|
| Samsung S24 Ultra | 14 | 6.8" | 1440x3120 | 必测 |
| Google Pixel 8 | 14 | 6.3" | 1080x2400 | 必测 |
| OnePlus 12 | 14 | 6.82" | 1440x3168 | 推荐 |
| Samsung A54 | 13 | 6.4" | 1080x2340 | 推荐 |
| 小米 Redmi Note 12 | 13 | 6.67" | 1080x2400 | 可选 |

**测试用例**:

```javascript
describe('Android 兼容性测试', () => {
  test('全面屏适配 (带刘海/药丸)', () => {
    // 设置 viewport 为带刘海的屏幕
    global.innerWidth = 393
    global.innerHeight = 854
    global.devicePixelRatio = 3
    
    render(<PulseDetail />)
    
    // 顶部内容不应被刘海遮挡
    const header = screen.getByTestId('detail-nav')
    const styles = getComputedStyle(header)
    expect(styles.paddingTop).toBeGreaterThan(40) // 安全区域
  })
  
  test('DPR 缩放正确性', () => {
    // 测试图片在高清屏幕上的显示
    const img = screen.getByTestId('pulse-image')
    expect(img.width * window.devicePixelRatio).toBeGreaterThanOrEqual(400)
  })
  
  test('Android 返回手势区域', () => {
    // 确保底部导航不遮挡系统导航栏区域
    const bottomNav = screen.getByTestId('bottom-nav')
    const rect = bottomNav.getBoundingClientRect()
    expect(rect.bottom).toBeLessThan(window.innerHeight - 20)
  })
})
```

### 2.3 浏览器兼容性

| 浏览器 | 版本 | 支持状态 |
|--------|------|----------|
| Chrome | 120+ | 完整支持 |
| Safari | 17+ | 完整支持 |
| Firefox | 121+ | 完整支持 |
| Edge | 120+ | 完整支持 |
| iOS Safari | 17+ | 完整支持 |
| Samsung Internet | 22+ | 需测试 |

---

## 三、性能测试

### 3.1 响应时间基准

| 接口 | 期望响应时间 | 警告阈值 | 严重阈值 |
|------|-------------|----------|----------|
| GET /health | < 50ms | 100ms | 200ms |
| POST /api/auth/otp/send | < 200ms | 500ms | 1000ms |
| GET /api/pulses | < 300ms | 500ms | 1000ms |
| POST /api/pulses | < 500ms | 1000ms | 2000ms |
| GET /api/matches | < 300ms | 500ms | 1000ms |

**测试脚本**:

```javascript
describe('响应时间测试', () => {
  const thresholds = {
    '/health': { p50: 50, p95: 100 },
    '/api/pulses': { p50: 300, p95: 500 },
    '/api/pulses/:id': { p50: 100, p95: 200 }
  }
  
  test('脉搏列表响应时间', async () => {
    const times = []
    
    for (let i = 0; i < 100; i++) {
      const start = Date.now()
      await request(app).get('/api/pulses')
      times.push(Date.now() - start)
    }
    
    times.sort((a, b) => a - b)
    const p50 = times[Math.floor(times.length * 0.5)]
    const p95 = times[Math.floor(times.length * 0.95)]
    
    expect(p50).toBeLessThan(thresholds['/api/pulses'].p50)
    expect(p95).toBeLessThan(thresholds['/api/pulses'].p95)
  })
})
```

### 3.2 并发测试

```javascript
describe('并发测试', () => {
  test('100 并发点赞请求应全部成功', async () => {
    const promises = []
    
    for (let i = 0; i < 100; i++) {
      promises.push(
        request(app)
          .post(`/api/pulses/${pulseId}/respect`)
          .set('Authorization', `Bearer ${token}`)
      )
    }
    
    const results = await Promise.all(promises)
    
    // 验证最终点赞数正确 (理论上应为 1，因为是同一个人)
    const finalRes = await request(app)
      .get(`/api/pulses/${pulseId}`)
    expect(finalRes.body.data.respectCount).toBeGreaterThanOrEqual(0)
  })
  
  test('50 并发发布脉搏应成功', async () => {
    const promises = []
    
    for (let i = 0; i < 50; i++) {
      promises.push(
        request(app)
          .post('/api/pulses')
          .set('Authorization', `Bearer ${token}`)
          .send({
            location: `测试地点${i}`,
            temp: 28,
            image: 'https://example.com/test.jpg'
          })
      )
    }
    
    const results = await Promise.allSettled(promises)
    const successCount = results.filter(r => r.status === 'fulfilled').length
    
    expect(successCount).toBeGreaterThanOrEqual(48) // 允许 2-3% 失败率
  })
  
  test('数据库连接池压力测试', async () => {
    const concurrent = 100
    const pool = []
    
    for (let i = 0; i < concurrent; i++) {
      pool.push(
        request(app)
          .get('/api/pulses')
          .set('Authorization', `Bearer ${token}`)
      )
    }
    
    const start = Date.now()
    const results = await Promise.all(pool)
    const duration = Date.now() - start
    
    expect(results.every(r => r.status === 200)).toBe(true)
    expect(duration).toBeLessThan(5000) // 100 个请求应在 5 秒内完成
  })
})
```

### 3.3 稳定性测试

```javascript
describe('稳定性测试', () => {
  test('连续 1000 次点赞/取消点赞应稳定', async () => {
    for (let i = 0; i < 1000; i++) {
      const res = await request(app)
        .post(`/api/pulses/${pulseId}/respect`)
        .set('Authorization', `Bearer ${token}`)
      
      expect([200, 400]).toContain(res.status) // 允许一些冲突
    }
  })
  
  test('服务重启后数据完整性', async () => {
    // 创建数据
    await createTestPulse()
    
    // 重启服务
    await restartServer()
    
    // 验证数据存在
    const res = await request(app)
      .get('/api/pulses')
      .set('Authorization', `Bearer ${token}`)
    
    expect(res.body.data.length).toBeGreaterThan(0)
  })
})
```

---

## 四、安全测试

### 4.1 认证安全

```javascript
describe('认证安全测试', () => {
  test('无效 JWT 应返回 401', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid_token')
    
    expect(res.status).toBe(401)
    expect(res.body.message).toContain('无效')
  })
  
  test('过期 JWT 应返回 401', async () => {
    const expiredToken = jwt.sign(
      { userId: 'test' },
      process.env.JWT_SECRET,
      { expiresIn: '-1h' }
    )
    
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${expiredToken}`)
    
    expect(res.status).toBe(401)
    expect(res.body.message).toContain('过期')
  })
  
  test('缺少 Authorization 头应返回 401', async () => {
    const res = await request(app)
      .get('/api/auth/me')
    
    expect(res.status).toBe(401)
  })
  
  test('OTP 验证码错误 3 次应失效', async () => {
    await request(app)
      .post('/api/auth/otp/send')
      .send({ email: 'test@divepulse.com' })
    
    // 错误 3 次
    for (let i = 0; i < 3; i++) {
      await request(app)
        .post('/api/auth/otp/login')
        .send({ email: 'test@divepulse.com', code: '000000' })
    }
    
    // 第 4 次应返回错误
    const res = await request(app)
      .post('/api/auth/otp/login')
      .send({ email: 'test@divepulse.com', code: '000000' })
    
    expect(res.status).toBe(400)
    expect(res.body.message).toContain('错误次数')
  })
})
```

### 4.2 SQL 注入防护

```javascript
describe('SQL 注入测试', () => {
  const payloads = [
    "' OR '1'='1",
    "'; DROP TABLE users;--",
    "1 UNION SELECT * FROM users",
    "<script>alert('XSS')</script>"
  ]
  
  payloads.forEach(payload => {
    test(`payload: ${payload}`, async () => {
      const res = await request(app)
        .get(`/api/pulses?search=${encodeURIComponent(payload)}`)
      
      expect(res.status).toBe(200)
      // 验证没有数据泄露
      expect(res.body).not.toContain('DROP TABLE')
      expect(res.body).not.toContain('SELECT')
    })
  })
})
```

### 4.3 权限绕过测试

```javascript
describe('权限绕过测试', () => {
  test('不能删除他人的脉搏', async () => {
    const res = await request(app)
      .delete(`/api/pulses/${otherUserPulseId}`)
      .set('Authorization', `Bearer ${myToken}`)
    
    expect(res.status).toBe(403)
  })
  
  test('不能访问他人的私信', async () => {
    const res = await request(app)
      .get(`/api/messages/conversations/${otherUserConversationId}`)
      .set('Authorization', `Bearer ${myToken}`)
    
    expect(res.status).toBe(403)
  })
  
  test('不能参与自己发起的拼潜', async () => {
    const res = await request(app)
      .post(`/api/matches/${myMatchId}/join`)
      .set('Authorization', `Bearer ${myToken}`)
    
    expect(res.status).toBe(400)
    expect(res.body.message).toContain('不能参与')
  })
})
```

### 4.4 速率限制测试

```javascript
describe('速率限制测试', () => {
  test('OTP 发送频率限制 (1分钟内最多3次)', async () => {
    for (let i = 0; i < 3; i++) {
      const res = await request(app)
        .post('/api/auth/otp/send')
        .send({ email: `test${i}@divepulse.com` })
      expect([200, 429]).toContain(res.status)
    }
  })
})
```

---

## 五、用户体验测试

### 5.1 交互逻辑测试

| 测试项 | 预期行为 | 验证方法 |
|--------|----------|----------|
| 点击脉搏卡片 | 跳转详情页 | 路由变化 |
| 长按点赞 | 触发点赞 + 动画 | UI 反馈 |
| 滑动删除评论 | 显示确认弹窗 | UI 状态 |
| 网络错误 | 显示重试按钮 | UI 状态 |
| 空列表 | 显示空状态插图 | UI 元素 |

```javascript
describe('交互逻辑测试', () => {
  test('点赞应显示动画反馈', async () => {
    render(<PulseFeed />)
    
    const likeBtn = screen.getAllByTestId('like-btn')[0]
    
    await fireEvent.click(likeBtn)
    
    // 验证动画类被添加
    expect(likeBtn).toHaveClass('liked')
    
    // 验证计数增加
    const count = within(likeBtn).getByTestId('like-count')
    expect(parseInt(count.textContent)).toBeGreaterThan(0)
  })
  
  test('网络错误应显示重试按钮', async () => {
    // 模拟网络错误
    server.use(
      rest.get('/api/pulses', (req, res) => {
        return res.status(500).body({ error: 'Network Error' })
      })
    )
    
    render(<PulseFeed />)
    
    // 应显示错误提示和重试按钮
    expect(screen.getByText(/重试/i)).toBeInTheDocument()
  })
})
```

### 5.2 页面一致性测试

```javascript
describe('页面一致性测试', () => {
  test('PulseFeed 和 PulseDetail 数据一致', () => {
    const feedPulse = getFeedPulse(1)
    const detailPulse = getDetailPulse(1)
    
    expect(feedPulse.respectCount).toBe(detailPulse.respectCount)
    expect(feedPulse.uid).toBe(detailPulse.uid)
  })
  
  test('评论数在列表和详情页一致', () => {
    const feedCount = getCommentCount('pulse-1', 'feed')
    const detailCount = getCommentCount('pulse-1', 'detail')
    
    expect(feedCount).toBe(detailCount)
  })
})
```

### 5.3 文案易懂性审查

| 页面 | 当前文案 | 建议 | 原因 |
|------|----------|------|------|
| 登录页 | `ACCESS` | `进入` | ACCESS 对于中文用户不够直观 |
| 脉搏列表 | `Most Liked` | `最多点赞` | 保持语言一致性 |
| 评论输入 | `SUPPLEMENTARY INFO` | `补充情报` | 更符合潜水社区语境 |
| 404 页面 | 无 | `潜点不存在` | 贴合潜水主题 |
| 错误提示 | `INVALID_EMAIL` | `请输入有效的邮箱` | 避免全大写技术语言 |

---

## 六、合规测试

### 6.1 数据隐私

```javascript
describe('数据隐私测试', () => {
  test('匿名用户不应显示个人信息', async () => {
    const res = await request(app)
      .get(`/api/pulses/${anonymousPulseId}`)
    
    expect(res.body.data.user.nickname).toBeUndefined()
    expect(res.body.data.user.email).toBeUndefined()
  })
  
  test('用户删除账号后数据应清除', async () => {
    // 删除账号
    await request(app)
      .delete('/api/users/account')
      .set('Authorization', `Bearer ${token}`)
    
    // 验证脉搏已删除
    const pulsesRes = await request(app)
      .get('/api/pulses')
    
    const myPulses = pulsesRes.body.data.filter(p => p.user.id === myId)
    expect(myPulses.length).toBe(0)
  })
})
```

### 6.2 GDPR 合规

| 合规项 | 状态 | 测试方法 |
|--------|------|----------|
| 同意书收集 | 需实现 | 检查登录页勾选框 |
| 数据导出 | 需实现 | GET /api/users/export |
| 数据删除权 | 部分实现 | DELETE /api/users/account |
| Cookie 同意 | 需实现 | 首次访问弹窗 |

---

## 七、核心业务流测试矩阵

```
┌─────────────────┬────────┬────────┬────────┬────────┬────────┐
│     场景        │ 登录   │ 发布   │ 点赞   │ 评论   │ 拼潜   │
├─────────────────┼────────┼────────┼────────┼────────┼────────┤
│ 正常流程        │   ✅   │   ✅   │   ✅   │   ✅   │   ✅   │
│ 空输入          │   ✅   │   ✅   │   ✅   │   ✅   │   ✅   │
│ 越权访问        │   ✅   │   ✅   │   ✅   │   ✅   │   ✅   │
│ 并发点赞        │   -    │   -    │   ✅   │   -    │   -    │
│ 数据库断开      │   ✅   │   ✅   │   ✅   │   ✅   │   ✅   │
│ Token 过期      │   -    │   ✅   │   ✅   │   ✅   │   ✅   │
│ 请求超时        │   ✅   │   ✅   │   ✅   │   ✅   │   ✅   │
│ iOS Safari      │   ✅   │   ✅   │   ✅   │   ✅   │   ✅   │
│ Android Chrome  │   ✅   │   ✅   │   ✅   │   ✅   │   ✅   │
└─────────────────┴────────┴────────┴────────┴────────┴────────┘
```

---

## 八、缺陷跟踪

### 已识别缺陷

| ID | 严重度 | 模块 | 描述 | 状态 |
|----|--------|------|------|------|
| BUG-001 | 🔴 高 | 后端 | OTP Store 使用内存存储，重启丢失 | 待修复 |
| BUG-002 | 🟡 中 | 后端 | 缺少请求超时配置 | 待修复 |
| BUG-003 | 🟡 中 | 前端 | 某些页面缺少 Error Boundary | 待修复 |
| BUG-004 | 🟢 低 | 前端 | 文案存在英文混杂 | 待优化 |

### 待实现功能

| ID | 优先级 | 模块 | 描述 |
|----|--------|------|------|
| FEAT-001 | 高 | 后端 | Redis OTP 存储 |
| FEAT-002 | 高 | 后端 | 请求速率限制 |
| FEAT-003 | 中 | 前端 | Error Boundary |
| FEAT-004 | 中 | 前端 | 骨架屏 Loading |
| FEAT-005 | 低 | 前端 | 深色模式切换 |

---

## 九、执行计划

### 第一阶段: 冒烟测试 (1天)
- 健康检查接口
- 登录注册流程
- 核心 CRUD 操作

### 第二阶段: 功能测试 (3天)
- 全业务流程覆盖
- 异常场景覆盖
- 权限测试

### 第三阶段: 兼容性与性能 (2天)
- iOS/Android 设备测试
- 响应时间基准
- 并发测试

### 第四阶段: 安全与回归 (2天)
- 安全扫描
- 渗透测试
- 全量回归

---

## 十、测试环境配置

```yaml
# test-environment.yaml
version: '3.8'

services:
  api:
    build: ./backend
    environment:
      DATABASE_URL: "file:./test.db"
      JWT_SECRET: "test-secret-key"
      NODE_ENV: "test"
    ports:
      - "3001:3000"
  
  frontend:
    build: ./frontend
    environment:
      VITE_API_URL: "http://localhost:3001"
    ports:
      - "5174:5173"
```

---

*测试方案生成时间: 2026-03-27*  
*下次审查: 2026-04-03*
