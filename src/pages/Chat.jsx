import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { safeGetItem, safeSetItem } from '../utils/safeStorage'
import './Chat.css'

const SYSTEM_NOTIFICATIONS = [
  {
    id: 'sys_1',
    type: 'system',
    title: 'Welcome to DivePulse',
    content: 'Your account has been activated. Start exploring dive sites around the world.',
    time: '2026.03.26',
    read: false
  },
  {
    id: 'sys_2',
    type: 'system',
    title: 'New Pulse Nearby',
    content: 'DP-3341 just posted a new pulse at Similan Islands, Thailand.',
    time: '2026.03.25',
    read: true
  }
]

function ChatList({ conversations, notifications, activeTab, onTabChange, onConvClick }) {
  const formatTime = (time) => {
    try {
      const date = new Date()
      const today = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
      if (time === today) {
        return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
      }
      return time || '??:??'
    } catch (e) {
      return '??:??'
    }
  }

  return (
    <>
      <div className="chat-tabs">
        <button
          className={`chat-tab ${activeTab === 'chats' ? 'active' : ''}`}
          onClick={() => onTabChange('chats')}
        >
          CHATS
        </button>
        <button
          className={`chat-tab ${activeTab === 'system' ? 'active' : ''}`}
          onClick={() => onTabChange('system')}
        >
          SYSTEM
        </button>
      </div>

      <div className="chat-list">
        {activeTab === 'chats' ? (
          conversations.length === 0 ? (
            <div className="chat-empty">
              <div className="chat-empty-icon">◻</div>
              <div className="chat-empty-text font-mono">NO CONVERSATIONS</div>
              <div className="chat-empty-hint font-sans">
                Accept a match request to start chatting
              </div>
            </div>
          ) : (
            conversations.map(conv => (
              <div
                key={conv?.id || Date.now()}
                className="chat-item"
                onClick={() => onConvClick(conv)}
              >
                <div className="chat-avatar">
                  {conv?.uid ? conv.uid.slice(-4) : '????'}
                </div>
                <div className="chat-info">
                  <div className="chat-info-top">
                    <span className="chat-name font-mono">{conv?.uid || 'Unknown'}</span>
                    <span className="chat-time font-mono">{formatTime(conv?.lastTime)}</span>
                  </div>
                  <div className="chat-preview font-sans">{conv?.lastMessage || ''}</div>
                </div>
                {!conv?.read && <span className="chat-unread" />}
              </div>
            ))
          )
        ) : (
          notifications.map(notif => (
            <div
              key={notif?.id || Date.now()}
              className={`chat-item ${notif?.type || 'system'} ${notif?.read ? 'read' : ''}`}
            >
              <div className="chat-avatar system-icon">!</div>
              <div className="chat-info">
                <div className="chat-info-top">
                  <span className="chat-name font-mono">{notif?.title || 'System'}</span>
                  <span className="chat-time font-mono">{formatTime(notif?.time)}</span>
                </div>
                <div className="chat-preview font-sans">{notif?.content || ''}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  )
}

function ChatDetail({ convId, conversations, onBack }) {
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const messagesEndRef = useRef(null)

  useEffect(() => {
    const allConvs = safeGetItem('divepulse_conversations', [])
    const conv = allConvs.find(c => c.id === convId)
    if (conv) {
      setMessages(conv.messages || [])
      if (!conv.read) {
        const updated = allConvs.map(c =>
          c.id === convId ? { ...c, read: true } : c
        )
        safeSetItem('divepulse_conversations', updated)
      }
    }
  }, [convId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView()
  }, [messages])

  const handleSend = () => {
    if (!inputText.trim()) return
    const newMsg = {
      id: Date.now(),
      sender: 'me',
      text: inputText.trim(),
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    }
    const allConvs = safeGetItem('divepulse_conversations', [])
    const updated = allConvs.map(c => {
      if (c.id === convId) {
        return {
          ...c,
          messages: [...(c.messages || []), newMsg],
          lastMessage: newMsg.text,
          lastTime: newMsg.time
        }
      }
      return c
    })
    safeSetItem('divepulse_conversations', updated)
    setMessages(prev => [...prev, newMsg])
    setInputText('')
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const conv = safeGetItem('divepulse_conversations', []).find(c => c.id === convId)

  return (
    <div className="chat-detail">
      <div className="chat-detail-header">
        <button className="back-btn" onClick={onBack}>← 返回</button>
        <span className="chat-detail-title font-mono">{conv?.uid || '???'}</span>
      </div>

      <div className="chat-detail-messages">
        {messages.length === 0 ? (
          <div className="chat-detail-empty font-mono">开始对话吧</div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={msg?.id || idx}
              className={`message ${msg?.sender === 'me' ? 'message-me' : 'message-other'}`}
            >
              <div
                className="message-bubble"
                style={msg?.sender === 'me'
                  ? { background: '#00F5FF', color: '#000000' }
                  : { background: 'rgba(255,255,255,0.06)', border: '0.5px solid #333333', color: '#FFFFFF' }
                }
              >
                <span className="message-text">{msg?.text || ''}</span>
                <span className="message-time font-mono">{msg?.time || '??:??'}</span>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-detail-input">
        <input
          type="text"
          className="chat-input font-mono"
          placeholder="输入消息..."
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button className="send-btn font-mono" onClick={handleSend}>
          发送
        </button>
      </div>
    </div>
  )
}

export default function Chat() {
  const { id: convId } = useParams()
  const navigate = useNavigate()
  const [conversations, setConversations] = useState([])
  const [notifications] = useState(SYSTEM_NOTIFICATIONS)
  const [activeTab, setActiveTab] = useState('chats')

  const loadConversations = () => {
    const saved = safeGetItem('divepulse_conversations', [])
    if (Array.isArray(saved)) {
      setConversations(saved)
    }
  }

  useEffect(() => {
    loadConversations()
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadConversations()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('divepulse_conversations_updated', loadConversations)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('divepulse_conversations_updated', loadConversations)
    }
  }, [])

  const handleConvClick = (conv) => {
    if (conv && conv.id) {
      navigate(`/chat/${conv.id}`)
    }
  }

  const handleBack = () => {
    navigate('/chat')
  }

  if (convId) {
    return (
      <div className="chat-page">
        <ChatDetail
          convId={convId}
          conversations={conversations}
          onBack={handleBack}
        />
      </div>
    )
  }

  return (
    <div className="chat-page">
      <div className="chat-header">
        <span className="chat-title font-mono">MESSAGES</span>
      </div>

      <ChatList
        conversations={conversations}
        notifications={notifications}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onConvClick={handleConvClick}
      />
    </div>
  )
}
