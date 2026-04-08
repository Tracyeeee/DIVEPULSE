import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../App'
import { matchApi } from '../utils/api'
import './MatchDetail.css'

const MATCH_TYPES = {
  'BOAT': '拼船',
  'CAR': '拼车',
  'ROOM': '拼房',
  'TEAM': '组队'
}

const STATUS_LABELS = {
  open: '招募中',
  closed: '已结束',
  full: '已满员'
}

function formatDateRange(range) {
  if (!range) return null
  const start = range.start
  const end = range.end
  if (!start && !end) return null
  if (end) return `${start || '—'} - ${end}`
  return start || null
}

/** 统一解析接口返回的 match（兼容 { success, data } 或直接返回实体） */
function pickMatchPayload(res) {
  if (!res || typeof res !== 'object') return null
  const d = res.data
  if (d != null && typeof d === 'object' && !Array.isArray(d)) return d
  if (res.id != null) return res
  return null
}

export default function MatchDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const token = user?.token || null

  const [match, setMatch] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [applying, setApplying] = useState(false)

  const isOwner = user && match && (
    (match.user?.id != null && user.id != null && String(match.user.id) === String(user.id)) ||
    (match.user?.uid && user.uid && String(match.user.uid) === String(user.uid))
  )

  useEffect(() => {
    if (!id) return
    window.scrollTo(0, 0)
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await matchApi.getMatchById(id, token)
        setMatch(pickMatchPayload(res))
      } catch (err) {
        setError(err.message || '加载失败')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, token])

  const handleApply = async () => {
    if (!user) { setError('请先登录'); return }
    if (isOwner) return
    setApplying(true)
    try {
      await matchApi.joinMatch(id, token)
      setMatch(prev => prev ? { ...prev, current: prev.current + 1 } : prev)
    } catch (err) {
      setError(err.message || '申请失败')
    } finally {
      setApplying(false)
    }
  }

  if (loading) {
    return (
      <div className="match-detail">
        <div className="detail-loading font-mono">LOADING...</div>
      </div>
    )
  }

  if (error && !match) {
    return (
      <div className="match-detail">
        <div className="detail-nav">
          <button className="nav-back" onClick={() => navigate(-1)}>←</button>
          <span className="nav-title font-mono">详情</span>
          <div className="nav-placeholder" />
        </div>
        <div className="detail-error font-sans">{error}</div>
      </div>
    )
  }

  if (!match) return null

  const currentCount = match.current ?? 1
  const totalCount = match.total ?? 2
  const progress = Math.min(100, (currentCount / totalCount) * 100)
  const statusLabel = match.status ? STATUS_LABELS[match.status] || match.status : '招募中'
  const dateDisplay = formatDateRange(match.dateRange)
  const locationText = (match.location && String(match.location).trim()) || ''
  const descText = String(match.note ?? match.description ?? '').trim()
  const creatorName = match.user?.nickname || match.user?.uid || 'DP-????'
  const creatorUid = match.user?.uid || 'DP-????'

  return (
    <div className="match-detail">
      {/* Top Navigation */}
      <div className="detail-nav">
        <button className="nav-back" onClick={() => navigate(-1)}>←</button>
        <div className="nav-title">
          <span className="nav-type font-mono">{MATCH_TYPES[match.type] || match.type || '拼行'}</span>
        </div>
        <div className="nav-badge font-mono">{statusLabel}</div>
      </div>

      {/* Main Content */}
      <div className="detail-body">

        {/* 目的地、时间：与「拼行类型」一致，始终展示（避免 location 为空时整块被隐藏） */}
        <div className="detail-hero detail-hero-always">
          <div className="detail-location font-mono">
            <span className="loc-icon">◎</span>
            <span className="loc-text">{locationText || '未填写目的地'}</span>
          </div>
          <div className="detail-date font-mono">
            <span className="date-icon">◷</span>
            <span className="date-text">{dateDisplay || '未设置日期'}</span>
          </div>
        </div>

        {/* Progress section */}
        <div className="detail-progress">
          <div className="progress-stats">
            <div className="progress-item">
              <span className="progress-num font-mono">{currentCount}</span>
              <span className="progress-label-text font-mono">已加入</span>
            </div>
            <div className="progress-sep-line" />
            <div className="progress-item">
              <span className="progress-num font-mono">{totalCount}</span>
              <span className="progress-label-text font-mono">目标人数</span>
            </div>
            <div className="progress-sep-line" />
            <div className="progress-item">
              <span className="progress-num font-mono">{totalCount - currentCount > 0 ? totalCount - currentCount : 0}</span>
              <span className="progress-label-text font-mono">还需</span>
            </div>
          </div>
          <div className="progress-bar-wrap">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="detail-divider" />

        {/* Type & Crew */}
        <div className="detail-section">
          <div className="section-title font-mono">拼行类型</div>
          <div className="detail-info font-sans">
            {MATCH_TYPES[match.type] || match.type || '未知'}
          </div>
        </div>

        <div className="detail-section">
          <div className="section-title font-mono">招募人数</div>
          <div className="detail-info font-mono">
            {match.total ?? 2} 人
          </div>
        </div>

        {/* Description / Note - 解析展示（无内容时也显示区块，避免误以为未加载） */}
        <div className="detail-section">
          <div className="section-title font-mono">详细描述</div>
          {!descText ? (
            <div className="detail-note detail-note-empty font-sans">暂无详细描述</div>
          ) : (
            <div className="detail-note font-sans">
              {(() => {
                const desc = descText
                const lines = desc.split('\n')
                return lines.map((line, idx) => {
                  // 检测是否是特殊字段
                  if (line.startsWith('费用预算：')) {
                    return (
                      <div key={idx} className="note-line fee-line">
                        <span className="note-label">💰</span>
                        <span>{line}</span>
                      </div>
                    )
                  } else if (line.startsWith('费用说明：')) {
                    return (
                      <div key={idx} className="note-line fee-note-line">
                        <span className="note-label">📝</span>
                        <span>{line}</span>
                      </div>
                    )
                  } else if (line.startsWith('潜水经验：')) {
                    return (
                      <div key={idx} className="note-line exp-line">
                        <span className="note-label">🤿</span>
                        <span>{line}</span>
                      </div>
                    )
                  } else if (line.startsWith('资质要求：')) {
                    const reqs = line.replace('资质要求：', '').split('、')
                    return (
                      <div key={idx} className="note-line req-line">
                        <span className="note-label">📋</span>
                        <div className="req-tags">
                          {reqs.map((req, i) => (
                            <span key={i} className="req-tag">{req}</span>
                          ))}
                        </div>
                      </div>
                    )
                  } else if (line.trim()) {
                    // 普通描述
                    return (
                      <div key={idx} className="note-line desc-line">
                        <span>{line}</span>
                      </div>
                    )
                  }
                  return null
                })
              })()}
            </div>
          )}
        </div>

        {/* Creator info */}
        <div className="detail-section">
          <div className="section-title font-mono">发起人</div>
          <div className="detail-creator font-mono">
            <div className="creator-avatar">
              {match.user?.avatar
                ? <img src={match.user.avatar} alt="" />
                : <span>{creatorUid[0]}</span>
              }
            </div>
            <div className="creator-info">
              <span className="creator-name">{creatorName}</span>
              <span className="creator-uid">@{creatorUid}</span>
            </div>
            {match.createdAt && (
              <span className="creator-time">
                {new Date(match.createdAt).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })}
              </span>
            )}
          </div>
        </div>

        {/* Participants */}
        {match.participants && match.participants.length > 0 && (
          <div className="detail-section">
            <div className="section-title font-mono">已加入 ({match.participants.length})</div>
            <div className="detail-participants">
              {match.participants.map(p => (
                <div key={p.id} className="participant-row font-mono">
                  <div className="participant-avatar-sm">
                    {p.user?.avatar
                      ? <img src={p.user.avatar} alt="" />
                      : <span>{p.user?.uid?.[0] || '?'}</span>
                    }
                  </div>
                  <span className="participant-name">{p.user?.nickname || p.user?.uid || '潜水员'}</span>
                  <span className={`participant-status ${p.status}`}>
                    {p.status === 'confirmed' ? '✓' : p.status === 'pending' ? '◷' : '×'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="detail-error font-sans" onClick={() => setError('')}>
            {error}
          </div>
        )}
      </div>

      {/* Bottom Action */}
      <div className="detail-action-bar">
        {isOwner ? (
          <div className="action-owner font-mono">这是你发起的招募</div>
        ) : (
          <button
            className="action-apply font-mono"
            disabled={applying || match.status === 'closed'}
            onClick={handleApply}
          >
            {applying ? '申请中...' : match.status === 'closed' ? '已结束' : '申请加入'}
          </button>
        )}
      </div>
    </div>
  )
}
