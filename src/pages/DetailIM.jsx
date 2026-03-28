import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../App'
import { decrementCountdown, formatCountdown, parseCountdown } from '../utils/safeStorage'
import './DetailIM.css'

const SAMPLE_DETAIL = {
  1: {
    id: 1,
    type: 'BOAT',
    location: '菲律宾 - 长滩岛',
    date: '2026.04.05',
    current: 2,
    total: 6,
    uid: 'DP-7729',
    note: '晨潜，寻找潜伴。计划早上6点出发，3次潜水。有兴趣的朋友请联系我。',
    expiry: '48:00:00'
  },
  2: {
    id: 2,
    type: 'CAR',
    location: '泰国 - 普吉',
    date: '2026.04.08',
    current: 1,
    total: 4,
    uid: 'DP-3341',
    note: '需要拼车从机场到酒店，预计下午2点到达。',
    expiry: '47:30:00'
  },
  3: {
    id: 3,
    type: 'ROOM',
    location: '印尼 - 巴厘岛',
    date: '2026.04.12',
    current: 0,
    total: 2,
    uid: 'DP-5567',
    note: '寻找潜水行程的潜伴一起平摊住宿费。',
    expiry: '46:00:00'
  },
  4: {
    id: 4,
    type: 'TEAM',
    location: '马来西亚 - 仙本那',
    date: '2026.04.15',
    current: 3,
    total: 4,
    uid: 'DP-8892',
    note: 'Fun Dive组队，目前3人，还差1人。',
    expiry: '45:00:00'
  },
  5: {
    id: 5,
    type: 'BOAT',
    location: '马尔代夫',
    date: '2026.04.20',
    current: 4,
    total: 8,
    uid: 'DP-2214',
    note: '船宿行程，7天6夜。还差4人。',
    expiry: '44:00:00'
  }
}

const MATCH_TYPES = {
  'BOAT': '拼船',
  'CAR': '拼车',
  'ROOM': '拼房',
  'TEAM': '组队'
}

const SAMPLE_MESSAGES = [
  { id: 1, sender: 'other', text: '你好，看到你的拼船信息', time: '14:30' },
  { id: 2, sender: 'me', text: '你好，我对这次行程很感兴趣', time: '14:32' },
  { id: 3, sender: 'other', text: '太好了，我们计划早上6点出发', time: '14:35' },
  { id: 4, sender: 'me', text: '没问题，我可以准时到', time: '14:36' }
]

export default function DetailIM() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [view, setView] = useState('detail')
  const [connected, setConnected] = useState(false)
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [countdown, setCountdown] = useState('48:00:00')
  const messagesEndRef = useRef(null)

  // 安全获取详情数据
  const detail = SAMPLE_DETAIL[id] || SAMPLE_DETAIL[1] || {}

  useEffect(() => {
    if (view === 'im' && connected) {
      setMessages(SAMPLE_MESSAGES)
    }
  }, [view, connected])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView()
  }, [messages])

  // 安全的倒计时递减
  useEffect(() => {
    let timer
    if (connected) {
      // 初始化倒计时
      if (detail?.expiry) {
        setCountdown(detail.expiry)
      }
      
      timer = setInterval(() => {
        setCountdown(prev => {
          const totalSeconds = parseCountdown(prev)
          if (totalSeconds <= 0) {
            clearInterval(timer)
            return '00:00:00'
          }
          return decrementCountdown(prev)
        })
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [connected, detail?.expiry])

  const handleConnect = () => {
    setConnected(true)
    setView('im')
  }

  const handleSend = () => {
    if (!inputText.trim()) return
    try {
      const newMsg = {
        id: Date.now(),
        sender: 'me',
        text: inputText.trim(),
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      }
      setMessages([...messages, newMsg])
      setInputText('')
    } catch (e) {
      console.error('[handleSend] Error sending message:', e)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (view === 'im') {
    return (
      <div className="detail-im im-view">
        {/* IM Header */}
        <div className="im-header">
          <button className="back-btn" onClick={() => setView('detail')}>
            ← 返回
          </button>
          <span className="im-title font-mono">{detail?.uid || '???'}</span>
          <span className="im-countdown font-mono">{countdown}</span>
        </div>

        {/* Destruction Warning */}
        <div className="destruction-warning">
          <span className="warning-text font-mono">
            消息将于 {countdown} 后物理销毁
          </span>
        </div>

        {/* Messages */}
        <div className="messages-container">
          {messages.map(msg => (
            <div
              key={msg?.id || Date.now()}
              className={`message ${msg?.sender === 'me' ? 'message-me' : 'message-other'}`}
            >
              <div className="message-bubble">
                <span className="message-text">{msg?.text || ''}</span>
                <span className="message-time font-mono">{msg?.time || '??:??'}</span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="im-input-area">
          <input
            type="text"
            className="im-input font-mono"
            placeholder="输入消息..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button className="send-btn font-mono" onClick={handleSend}>
            发送
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="detail-im detail-view">
      {/* Header */}
      <div className="detail-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← 返回
        </button>
        <span className="detail-title font-mono">{MATCH_TYPES[detail?.type] || '组队'}</span>
      </div>

      {/* Content */}
      <div className="detail-content">
        <div className="detail-location">{detail?.location || '未知地点'}</div>
        <div className="detail-meta">
          <span className="meta-item font-mono">日期: {detail?.date || '??'}</span>
          <span className="meta-item font-mono">发起: {detail?.uid || '???'}</span>
        </div>
        
        <div className="divider" />

        <div className="detail-note">
          <div className="note-label font-mono">备注</div>
          <div className="note-text">{detail?.note || ''}</div>
        </div>

        <div className="detail-progress">
          <span className="progress-label font-mono">当前进度</span>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${Math.min(100, ((detail?.current || 0) / (detail?.total || 1)) * 100)}%` }}
            />
          </div>
          <span className="progress-text font-mono">
            {detail?.current || 0} / {detail?.total || 0}
          </span>
        </div>

        <div className="detail-uid">
          <span className="uid-label font-mono">发起者</span>
          <span className="uid-value font-mono">{detail?.uid || '???'}</span>
        </div>
      </div>

      {/* Sticky Bottom */}
      <div className="btn-sticky">
        <button
          className={`btn btn-full ${connected ? 'btn-disabled' : 'btn-primary'}`}
          onClick={handleConnect}
          disabled={connected}
        >
          {connected ? 'REQUESTED' : 'CONNECT'}
        </button>
      </div>
    </div>
  )
}
