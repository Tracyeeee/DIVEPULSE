import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../App'
import { safeGetItem, safeSetItem } from '../utils/safeStorage'
import './Profile.css'

export default function Profile() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isEditing, setIsEditing] = useState(false)
  const [nickname, setNickname] = useState('')
  const [myPulses, setMyPulses] = useState([])
  const [showMyPulses, setShowMyPulses] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null) // 待删除的脉搏

  useEffect(() => {
    const savedNickname = safeGetItem('divepulse_nickname', null)
    if (savedNickname && typeof savedNickname === 'string') {
      setNickname(savedNickname)
    } else {
      setNickname('Diver')
    }
  }, [])

  useEffect(() => {
    const savedPulses = safeGetItem('divepulse_new_pulses', [])
    if (Array.isArray(savedPulses)) {
      const userPulses = savedPulses.filter(p => p && p.uid === user?.uid)
      setMyPulses(userPulses)
    }
  }, [user?.uid])

  const handleSaveNickname = () => {
    const filtered = nickname.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '').slice(0, 12)
    const finalNickname = filtered || 'Diver'
    setNickname(finalNickname)
    safeSetItem('divepulse_nickname', finalNickname)
    setIsEditing(false)
  }

  const handleDeletePulse = (id) => {
    const savedPulses = safeGetItem('divepulse_new_pulses', [])
    if (Array.isArray(savedPulses)) {
      const filtered = savedPulses.filter(p => p && p.id !== id)
      safeSetItem('divepulse_new_pulses', filtered)
      setMyPulses(myPulses.filter(p => p && p.id !== id))
    }
  }

  /**
   * 点击删除按钮 → 显示确认弹窗
   */
  const handleDeleteClick = (pulse, e) => {
    e.stopPropagation()
    setDeleteTarget(pulse)
  }

  /**
   * 确认删除 → 正式删除
   */
  const handleConfirmDelete = () => {
    if (deleteTarget) {
      handleDeletePulse(deleteTarget.id)
      setDeleteTarget(null)
    }
  }

  /**
   * 取消删除 → 关闭弹窗
   */
  const handleCancelDelete = () => {
    setDeleteTarget(null)
  }

  const handleLogout = () => {
    if (window.confirm('确定退出登录？')) {
      logout()
    }
  }

  const stats = {
    pulse_count: myPulses.length + 3,
    match_count: 2,
    respect_received: myPulses.reduce((sum, p) => sum + (p?.respectCount || 0), 0) + 42
  }

  return (
    <div className="profile">
      {/* Top Identity Bar */}
      <div className="profile-header">
        {isEditing ? (
          <div className="nickname-edit">
            <input
              type="text"
              className="nickname-input font-sans"
              value={nickname}
              onChange={(e) => setNickname(e.target.value.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '').slice(0, 12))}
              placeholder="输入昵称"
              autoFocus
            />
            <button className="save-btn font-mono" onClick={handleSaveNickname}>
              SAVE
            </button>
          </div>
        ) : (
          <div className="identity-display" onClick={() => setIsEditing(true)}>
            <div className="nickname-row">
              <span className="nickname font-sans">{nickname}</span>
              <span className="edit-hint font-mono">[ 编辑 ]</span>
            </div>
            <span className="uid-display font-mono">ID: {user?.uid || 'DP-0000'}</span>
          </div>
        )}
      </div>

      {/* Stats Dashboard */}
      <div className="stats-dashboard">
        <div className="stat-item">
          <span className="stat-value font-mono">{stats.pulse_count}</span>
          <span className="stat-label font-mono">发帖</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-value font-mono">{stats.match_count}</span>
          <span className="stat-label font-mono">加入</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-value font-mono">{stats.respect_received}</span>
          <span className="stat-label font-mono">支持</span>
        </div>
      </div>

      {/* Function List */}
      <div className="function-list">
        <div 
          className="function-item"
          onClick={() => setShowMyPulses(!showMyPulses)}
        >
          <span className="function-label font-sans">我的脉搏</span>
          <span className="function-arrow font-mono">{showMyPulses ? '↑' : '→'}</span>
        </div>
        
        {showMyPulses && (
          <div className="my-pulses-list">
            {myPulses.length === 0 ? (
              <div className="empty-pulses font-mono">暂无发布的脉搏</div>
            ) : (
              myPulses.map(pulse => (
                <div key={pulse?.id || Date.now()} className="my-pulse-item">
                  <div className="pulse-info">
                    <span className="pulse-location font-sans">{pulse?.location || '未知'}</span>
                    <span className="pulse-stats font-mono">
                      ↑ {pulse?.respectCount || 0}
                    </span>
                  </div>
                  <button
                    className="delete-btn font-mono"
                    onClick={(e) => handleDeleteClick(pulse, e)}
                  >
                    删除
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        <div className="function-item" onClick={() => navigate('/match')}>
          <span className="function-label font-sans">我的拼行</span>
          <span className="function-arrow font-mono">→</span>
        </div>

        <div className="function-item logout" onClick={handleLogout}>
          <span className="function-label font-sans">退出登录</span>
          <span className="function-arrow font-mono">→</span>
        </div>
      </div>

      {/* App Info */}
      <div className="app-info">
        <span className="app-version font-mono">DivePulse v1.0</span>
      </div>

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={handleCancelDelete}>
          <div className="delete-confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-icon">!</div>
            <div className="modal-title font-mono">确认删除</div>
            <div className="modal-content font-sans">
              确定要删除这条脉搏吗？<br />
              <span className="modal-match-info">
                {deleteTarget?.location || '未知地点'}
              </span>
            </div>
            <div className="modal-actions">
              <button className="modal-btn cancel font-mono" onClick={handleCancelDelete}>
                取消
              </button>
              <button className="modal-btn confirm font-mono" onClick={handleConfirmDelete}>
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
