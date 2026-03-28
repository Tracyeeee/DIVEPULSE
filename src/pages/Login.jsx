import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Login.css'

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState(1)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleEmailSubmit = (e) => {
    e.preventDefault()
    if (!email || !email.includes('@')) {
      setError('INVALID_EMAIL')
      return
    }
    setError('')
    setStep(2)
  }

  const handleCodeSubmit = (e) => {
    e.preventDefault()
    // Demo mode: accept any 6-digit code
    if (code.length !== 6) {
      setError('INVALID_CODE')
      return
    }
    onLogin(email)
    navigate('/')
  }

  // Demo: auto-fill code for testing
  const handleDemoLogin = () => {
    onLogin('demo@divepulse.com')
    navigate('/')
  }

  const handleResend = () => {
    setCode('')
    setError('')
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
                  autoFocus
                />
              </div>
              {error && <div className="error">{error}</div>}
              <button type="submit" className="btn btn-primary btn-full">
                ACCESS
              </button>
            </form>
          ) : (
            <form onSubmit={handleCodeSubmit} className="login-form">
              <p className="login-hint">SENT_TO {email}</p>
              <div className="input-group">
                <input
                  type="text"
                  className="input-field code-input"
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  autoFocus
                />
              </div>
              {error && <div className="error">{error}</div>}
              <button type="submit" className="btn btn-primary btn-full">
                VERIFY
              </button>
              <button type="button" className="btn btn-ghost" onClick={handleResend}>
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
