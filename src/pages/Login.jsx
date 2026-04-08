import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../utils/api'
import './Login.css'

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState(1)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [debugCode, setDebugCode] = useState('')
  const navigate = useNavigate()

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setDebugCode('')

    if (!email || !email.includes('@')) {
      setError('INVALID_EMAIL')
      return
    }

    setLoading(true)
    try {
      const res = await authApi.sendOtp(email)
      setStep(2)
      if (res.data?._debug) {
        setDebugCode(res.data._debug)
      }
    } catch (err) {
      setError(err.message || '发送失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleCodeSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (code.length !== 6) {
      setError('INVALID_CODE')
      return
    }

    setLoading(true)
    try {
      const res = await authApi.loginWithOtp(email, code)
      onLogin(res.data.token, res.data.user)
      navigate('/')
    } catch (err) {
      setError(err.message || '验证码错误')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = () => {
    // 使用特殊的 demo token，后端 auth 中间件会识别并返回 demo 用户
    onLogin('tok_demo', { email: 'demo@divepulse.com', uid: 'DP-DEMO' })
    navigate('/')
  }

  const handleResend = async () => {
    setCode('')
    setError('')
    setDebugCode('')
    setLoading(true)
    try {
      const res = await authApi.sendOtp(email)
      if (res.data?._debug) {
        setDebugCode(res.data._debug)
      }
    } catch (err) {
      setError(err.message || '发送失败，请重试')
    } finally {
      setLoading(false)
    }
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
          {step === 1 ? (
            <form onSubmit={handleEmailSubmit} className="login-form">
              <div className="input-group">
                <input
                  type="email"
                  className="input-field"
                  placeholder="EMAIL"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  autoFocus
                />
              </div>
              {error && <div className="error">{error}</div>}
              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? 'SENDING...' : 'ACCESS'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleCodeSubmit} className="login-form">
              <p className="login-hint">SENT_TO {email}</p>
              {debugCode && (
                <div className="debug-code">
                  DEV: {debugCode}
                </div>
              )}
              <div className="input-group">
                <input
                  type="text"
                  className="input-field code-input"
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  disabled={loading}
                  autoFocus
                />
              </div>
              {error && <div className="error">{error}</div>}
              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? 'VERIFYING...' : 'VERIFY'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={handleResend} disabled={loading}>
                RESEND
              </button>
            </form>
          )}
        </div>

        <div className="login-footer">
          <p className="login-terms">
            BY CONTINUING, YOU AGREE TO<br />
            TERMS OF SERVICE
          </p>
          <button className="btn btn-outline demo-btn" onClick={handleDemoLogin}>
            DEMO ACCESS
          </button>
        </div>
      </div>
    </div>
  )
}
