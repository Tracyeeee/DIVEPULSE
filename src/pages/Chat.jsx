import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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

export default function Chat() {
  const [conversations, setConversations] = useState([])
  const [notifications, setNotifications] = useState([])
  const [activeTab, setActiveTab] = useState('chats')
  const navigate = useNavigate()

  useEffect(() => {
    const savedConversations = safeGetItem('divepulse_conversations', [])
    if (Array.isArray(savedConversations)) {
      setConversations(savedConversations)
    }

    setNotifications(SYSTEM_NOTIFICATIONS)
  }, [])

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

  const handleConversationClick = (conv) => {
    if (conv && conv.id) {
      navigate(`/chat/${conv.id}`)
    }
  }

  return (
    <div className="chat-page">
      {/* Header */}
      <div className="chat-header">
        <span className="chat-title font-mono">MESSAGES</span>
      </div>

      {/* Tabs */}
      <div className="chat-tabs">
        <button 
          className={`chat-tab ${activeTab === 'chats' ? 'active' : ''}`}
          onClick={() => setActiveTab('chats')}
        >
          CHATS
        </button>
        <button 
          className={`chat-tab ${activeTab === 'system' ? 'active' : ''}`}
          onClick={() => setActiveTab('system')}
        >
          SYSTEM
        </button>
      </div>

      {/* Content */}
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
                onClick={() => handleConversationClick(conv)}
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
    </div>
  )
}
