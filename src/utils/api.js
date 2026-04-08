const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000)

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    // 避免浏览器对 GET 返回 304 且 body 异常，导致详情等接口解析不到 data
    cache: 'no-store',
    ...options,
    signal: controller.signal,
  }

  try {
    const res = await fetch(url, config)
    clearTimeout(timeoutId)
    const data = await res.json()

    if (!res.ok) {
      let msg = data.message || `请求失败 (${res.status})`
      if (data.errors && data.errors.length > 0) {
        msg = data.errors.map(e => e.message || e.field).join('；')
      }
      throw new Error(msg)
    }

    return data
  } catch (err) {
    clearTimeout(timeoutId)
    if (err.name === 'AbortError') {
      throw new Error('请求超时，请检查后端服务是否运行')
    }
    throw err
  }
}

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const authApi = {
  sendOtp: (email) =>
    request('/api/auth/otp/send', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  loginWithOtp: (email, code) =>
    request('/api/auth/otp/login', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    }),
}

export const matchApi = {
  getMatches: (params = {}, token) =>
    request('/api/matches' + (Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : ''), {
      headers: authHeaders(token)
    }),

  getMatchById: (id, token) =>
    request(`/api/matches/${id}`, { headers: authHeaders(token) }),

  createMatch: (data, token) =>
    request('/api/matches', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: authHeaders(token)
    }),

  joinMatch: (id, token) =>
    request(`/api/matches/${id}/join`, {
      method: 'POST',
      headers: authHeaders(token)
    }),

  leaveMatch: (id, token) =>
    request(`/api/matches/${id}/leave`, {
      method: 'POST',
      headers: authHeaders(token)
    }),

  getMyCreated: (token) =>
    request('/api/matches/my/created', { headers: authHeaders(token) }),

  getMyParticipating: (token) =>
    request('/api/matches/my/participating', { headers: authHeaders(token) }),

  approveParticipant: (matchId, participantId, token) =>
    request(`/api/matches/${matchId}/approve/${participantId}`, {
      method: 'POST',
      headers: authHeaders(token)
    }),

  rejectParticipant: (matchId, participantId, token) =>
    request(`/api/matches/${matchId}/reject/${participantId}`, {
      method: 'POST',
      headers: authHeaders(token)
    }),
}
