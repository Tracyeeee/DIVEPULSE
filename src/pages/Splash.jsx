import { useEffect, useState } from 'react'
import './Splash.css'

export default function Splash({ user }) {
  const [status, setStatus] = useState('INIT')

  useEffect(() => {
    setStatus('LOADED')
  }, [])

  // 安全获取 uid
  const uid = user?.uid || 'GUEST'

  return (
    <div className="splash">
      <div className="splash-logo">
        <span className="splash-pulse">◉</span>
        <span className="splash-text">DivePulse</span>
      </div>
      <div className="splash-status">
        <span className={user ? '' : 'text-secondary'} style={{ fontFamily: 'var(--font-mono)' }}>
          {uid}
        </span>
      </div>
    </div>
  )
}
