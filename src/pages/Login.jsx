import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../utils/api'
import './Login.css'

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')

    if (!username || !password) {
      setError('请填写用户名和密码')
      return
    }

    setLoading(true)
    try {
      const res = await authApi.loginByUsername(username, password)
      onLogin(res.data.token, res.data.user)
      navigate('/')
    } catch (err) {
      setError(err.message || '登录失败，请检查用户名和密码')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')

    if (!username) {
      setError('请输入用户名')
      return
    }
    if (username.length < 3 || username.length > 20) {
      setError('用户名需3-20个字符')
      return
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('用户名只能包含字母、数字和下划线')
      return
    }
    if (!password) {
      setError('请设置密码')
      return
    }
    if (password.length < 6) {
      setError('密码至少6位')
      return
    }
    if (password !== confirmPassword) {
      setError('两次密码不匹配')
      return
    }

    setLoading(true)
    try {
      const res = await authApi.registerByUsername(username, password, confirmPassword)
      onLogin(res.data.token, res.data.user)
      navigate('/')
    } catch (err) {
      setError(err.message || '注册失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleSwitchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login')
    setError('')
    setPassword('')
    setConfirmPassword('')
  }

  const handleDemoLogin = () => {
    onLogin('tok_demo', { uid: 'DP-DEMO', nickname: 'Demo User', username: 'demo' })
    navigate('/')
  }

  return (
    <div className="login">
      <div className="login-container">
        <div className="login-header">
          <span className="login-logo-pulse">◉</span>
          <h1 className="login-title">DivePulse</h1>
          <p className="login-subtitle">潜脉</p>
        </div>

        <div className="login-content">
          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="login-form">
              <div className="input-group">
                <input
                  type="text"
                  className="input-field"
                  placeholder="用户名"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  autoFocus
                />
              </div>
              <div className="input-group">
                <input
                  type="password"
                  className="input-field"
                  placeholder="密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
              {error && <div className="error">{error}</div>}
              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? '登录中...' : '登录'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="login-form">
              <div className="input-group">
                <input
                  type="text"
                  className="input-field"
                  placeholder="用户名（3-20字符，字母/数字/下划线）"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  autoFocus
                />
              </div>
              <div className="input-group">
                <input
                  type="password"
                  className="input-field"
                  placeholder="设置密码（至少6位）"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="input-group">
                <input
                  type="password"
                  className="input-field"
                  placeholder="确认密码"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
              {error && <div className="error">{error}</div>}
              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? '注册中...' : '注册'}
              </button>
            </form>
          )}
        </div>

        <div className="login-footer">
          <p className="login-switch">
            {mode === 'login' ? '还没有账号？' : '已有账号？'}
            <button type="button" className="link-btn" onClick={handleSwitchMode}>
              {mode === 'login' ? '立即注册' : '去登录'}
            </button>
          </p>
          <button className="btn btn-outline demo-btn" onClick={handleDemoLogin}>
            访客登录
          </button>
        </div>
      </div>
    </div>
  )
}
