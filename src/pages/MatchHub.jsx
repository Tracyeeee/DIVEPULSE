import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../App'
import { matchApi } from '../utils/api'
import './MatchHub.css'

const MATCH_TYPES = {
  'BOAT': '拼船',
  'CAR': '拼车',
  'ROOM': '拼房',
  'TEAM': '组队'
}

const SAMPLE_MATCH_DATA = [
  {
    id: 'sample-1',
    type: 'BOAT',
    location: '菲律宾 - 长滩岛',
    dateRange: { start: '2026.04.05', end: null },
    current: 2,
    total: 6,
    status: 'open',
    uid: 'DP-7729',
    note: '晨潜，寻找潜伴'
  },
  {
    id: 'sample-2',
    type: 'CAR',
    location: '泰国 - 普吉',
    dateRange: { start: '2026.04.08', end: '2026.04.10' },
    current: 1,
    total: 4,
    status: 'open',
    uid: 'DP-3341',
    note: '机场接送'
  },
  {
    id: 'sample-3',
    type: 'ROOM',
    location: '印尼 - 巴厘岛',
    dateRange: { start: '2026.04.12', end: '2026.04.18' },
    current: 0,
    total: 2,
    status: 'open',
    uid: 'DP-5567',
    note: '平摊住宿费'
  },
  {
    id: 'sample-4',
    type: 'TEAM',
    location: '马来西亚 - 仙本那',
    dateRange: { start: '2026.04.15', end: null },
    current: 3,
    total: 4,
    status: 'open',
    uid: 'DP-8892',
    note: 'Fun Dive组队'
  }
]

function formatDateRange(range) {
  if (!range) return ''
  if (range.end) return `${range.start} - ${range.end}`
  return range.start
}

function getToday() {
  return new Date().toISOString().split('T')[0]
}

/**
 * 删除确认弹窗
 */
function DeleteConfirmModal({ match, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="delete-confirm-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-icon">!</div>
        <div className="modal-title font-mono">确认删除</div>
        <div className="modal-content font-sans">
          确定要删除这条拼行吗？<br />
          <span className="modal-match-info">
            [{MATCH_TYPES[match.type]}] {match.location}
          </span>
        </div>
        <div className="modal-actions">
          <button className="modal-btn cancel font-mono" onClick={onCancel}>取消</button>
          <button className="modal-btn confirm font-mono" onClick={onConfirm}>确认删除</button>
        </div>
      </div>
    </div>
  )
}

/**
 * 申请人操作弹窗（同意 / 拒绝）
 */
function ParticipantActionModal({ participant, matchType, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="participant-action-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title font-mono">处理申请</div>
        <div className="modal-content font-sans">
          {participant?.user?.nickname
            ? <>确定同意 <strong>{participant.user.nickname}</strong>（{participant.user.uid}）加入此 [{MATCH_TYPES[matchType]}] 吗？</>
            : <>确定同意该用户加入此 [{MATCH_TYPES[matchType]}] 吗？</>
          }
          <br /><span className="modal-hint">确认后，该用户将被正式计入拼行人数</span>
        </div>
        <div className="modal-actions">
          <button className="modal-btn cancel font-mono" onClick={onCancel}>取消</button>
          <button className="modal-btn confirm font-mono" onClick={() => onConfirm('confirm')}>同意加入</button>
        </div>
      </div>
    </div>
  )
}

export default function MatchHub() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const token = user?.token || null
  const [hubKey, setHubKey] = useState(0)

  const [activeTab, setActiveTab] = useState('join')

  // "加入拼" 数据
  const [joinList, setJoinList] = useState([])
  const [joinLoading, setJoinLoading] = useState(false)
  const [myAppliedIds, setMyAppliedIds] = useState(new Set())
  const [joinError, setJoinError] = useState('')

  // "我发起的" 数据
  const [myCreatedMatches, setMyCreatedMatches] = useState([])
  const [myLoading, setMyLoading] = useState(false)

  // 删除弹窗
  const [deleteTarget, setDeleteTarget] = useState(null)

  // 申请人操作弹窗
  const [pendingParticipant, setPendingParticipant] = useState(null)
  const [pendingMatch, setPendingMatch] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  // 加载"加入拼"列表
  const loadJoinList = useCallback(async () => {
    setJoinLoading(true)
    setJoinError('')
    try {
      const res = await matchApi.getMatches({ status: 'OPEN' }, token)
      // 后端返回 { success, data: [...] } 或 { success, data: { items: [...] } }
      let items = res.data?.items ?? res.data ?? []
      setJoinList(items.length > 0 ? items : SAMPLE_MATCH_DATA)
    } catch {
      setJoinList(SAMPLE_MATCH_DATA)
    } finally {
      setJoinLoading(false)
    }
  }, [token])

  // 加载"我发起的"列表（含申请人）
  const loadMyCreated = useCallback(async () => {
    if (!user) return
    setMyLoading(true)
    try {
      const res = await matchApi.getMyCreated(token)
      console.log('[MatchHub] getMyCreated 响应:', res)
      // 支持后端两种返回格式
      const data = Array.isArray(res.data) ? res.data : res.data?.items ?? []
      setMyCreatedMatches(data)
    } catch (err) {
      console.error('[MatchHub] getMyCreated 失败:', err)
      // 静默失败，不弹 alert 阻塞 UI
      setMyCreatedMatches([])
    } finally {
      setMyLoading(false)
    }
  }, [user, token])

  // 监听发布成功信号，刷新列表
  useEffect(() => {
    const stored = localStorage.getItem('matchhub_refresh')
    if (stored) {
      localStorage.removeItem('matchhub_refresh')
      loadJoinList()
      loadMyCreated()
    }
  }, [hubKey])

  useEffect(() => {
    loadJoinList()
  }, [loadJoinList])

  useEffect(() => {
    if (activeTab === 'my' && user) {
      loadMyCreated()
    }
  }, [activeTab, user, loadMyCreated])

  // 在"加入拼"tab，从后端获取已申请的 matchId
  useEffect(() => {
    if (!user) return
    const loadApplied = async () => {
      try {
        const res = await matchApi.getMyParticipating(token)
        const applied = res.data ?? []
        setMyAppliedIds(new Set(applied.map(m => m.id)))
      } catch { /* 静默 */ }
    }
    loadApplied()
  }, [user, token])

  // 申请加入（POST /api/matches/:id/join）
  const handleRequest = async (item) => {
    if (!user) {
      alert('请先登录')
      return
    }
    if (myAppliedIds.has(item.id)) return

    try {
      await matchApi.joinMatch(item.id, token)
      setMyAppliedIds(prev => new Set([...prev, item.id]))
    } catch (err) {
      alert(err.message || '申请失败')
    }
  }

  // 删除弹窗
  const handleDeleteClick = (match, e) => {
    e.stopPropagation()
    setDeleteTarget(match)
  }

  const handleConfirmDelete = () => {
    if (!deleteTarget) return
    setMyCreatedMatches(prev => prev.filter(m => m.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  // 同意 / 拒绝
  const handleParticipantAction = (participant, match, e) => {
    e.stopPropagation()
    setPendingParticipant(participant)
    setPendingMatch(match)
  }

  const handleConfirmParticipant = async (action) => {
    if (!pendingParticipant || !pendingMatch) return
    setActionLoading(true)
    try {
      if (action === 'confirm') {
        await matchApi.approveParticipant(pendingMatch.id, pendingParticipant.id, token)
      } else {
        await matchApi.rejectParticipant(pendingMatch.id, pendingParticipant.id, token)
      }
      await loadMyCreated()
    } catch (err) {
      alert(err.message || '操作失败')
    } finally {
      setActionLoading(false)
      setPendingParticipant(null)
      setPendingMatch(null)
    }
  }

  // 计算已确认人数（发起者本人 + 所有 CONFIRMED）
  const getConfirmedCount = (match) => {
    const confirmed = match.participants
      ? match.participants.filter(p => p.status === 'confirmed').length
      : 0
    return confirmed + 1 // +1 发起者本人
  }

  return (
    <div className="match-hub" key={hubKey}>
      {/* Header */}
      <div className="match-header">
        <h1 className="match-title">找搭子</h1>
      </div>

      {/* Tab Switcher */}
      <div className="match-tabs">
        <button
          className={`tab-item ${activeTab === 'join' ? 'active' : ''}`}
          onClick={() => setActiveTab('join')}
        >
          加入拼
        </button>
        <button
          className={`tab-item ${activeTab === 'my' ? 'active' : ''}`}
          onClick={() => setActiveTab('my')}
        >
          我发起的
        </button>
      </div>

      {/* ── 加入拼 ── */}
      {activeTab === 'join' && (
        <div className="match-list">
          {joinLoading && <div className="list-loading font-mono">加载中...</div>}
          {!joinLoading && joinList.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">◎</div>
              <div className="empty-state-text">暂无拼行</div>
            </div>
          )}
          {joinList.map(item => (
            <div
              key={item.id}
              className="match-card"
              onClick={() => navigate(`/match/${item.id}`)}
            >
              <div className="match-card-left">
                <span className="match-type-badge">{MATCH_TYPES[item.type] || item.type}</span>
              </div>
              <div className="match-card-center">
                <div className="match-location">{item.location}</div>
                <div className="match-date font-mono">{formatDateRange(item.dateRange)}</div>
              </div>
              <div className="match-card-right">
                <div className="match-progress font-mono">
                  <span className="progress-current">{item.current ?? 1}</span>
                  <span className="progress-divider">/</span>
                  <span className="progress-total">{item.total ?? 2}</span>
                </div>
                <button
                  className={`request-btn font-mono ${myAppliedIds.has(item.id) ? 'requested' : ''}`}
                  onClick={(e) => { e.stopPropagation(); handleRequest(item) }}
                >
                  {myAppliedIds.has(item.id) ? '已申请' : '申请'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── 我发起的 ── */}
      {activeTab === 'my' && (
        <div className="match-list">
          {myLoading && <div className="list-loading font-mono">加载中...</div>}
          {!myLoading && myCreatedMatches.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">⊞</div>
              <div className="empty-state-text">尚未发起任何拼行</div>
            </div>
          )}
          {myCreatedMatches.map(match => (
            <div key={match.id} className="match-card match-card-mine" onClick={() => navigate(`/match/${match.id}`)}>
              <div className="match-card-main">
                <div className="match-card-left">
                  <span className="match-type-badge">{MATCH_TYPES[match.type] || match.type}</span>
                </div>
                <div className="match-card-center">
                  <div className="match-location">{match.location}</div>
                  <div className="match-date font-mono">{formatDateRange(match.dateRange)}</div>
                </div>
                <div className="match-card-right">
                  <div className="match-progress font-mono">
                    <span className="progress-current">{getConfirmedCount(match)}</span>
                    <span className="progress-divider">/</span>
                    <span className="progress-total">{match.total ?? 2}</span>
                  </div>
                  <button
                    className="delete-match-btn font-mono"
                    onClick={(e) => { e.stopPropagation(); handleDeleteClick(match, e) }}
                  >
                    删除
                  </button>
                </div>
              </div>

              {/* 申请人列表 */}
              {match.participants && match.participants.length > 0 && (
                <div className="participants-section">
                  <div className="participants-label font-mono">申请人</div>
                  {match.participants.map(p => (
                    <div key={p.id} className="participant-row">
                      <div className="participant-info">
                        <span className="participant-avatar">
                          {p.user?.avatar
                            ? <img src={p.user.avatar} alt="" />
                            : <span>{p.user?.uid?.[0] || '?'}</span>
                          }
                        </span>
                        <span className="participant-name">
                          {p.user?.nickname || p.user?.uid || '潜水员'}
                        </span>
                        <span className={`participant-status font-mono ${p.status}`}>
                          {p.status === 'confirmed' ? '已加入' : '待确认'}
                        </span>
                      </div>
                      {p.status === 'pending' && (
                        <div className="participant-actions">
                          <button
                            className="confirm-btn font-mono"
                            onClick={(e) => handleParticipantAction(p, match, e)}
                          >
                            确认
                          </button>
                          <button
                            className="reject-btn font-mono"
                            onClick={async (e) => {
                              e.stopPropagation()
                              try {
                                await matchApi.rejectParticipant(match.id, p.id, token)
                                await loadMyCreated()
                              } catch (err) { alert(err.message) }
                            }}
                          >
                            拒绝
                          </button>
                        </div>
                      )}
                      {p.status === 'confirmed' && (
                        <span className="confirmed-tag font-mono">已确认</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {(!match.participants || match.participants.length === 0) && (
                <div className="participants-empty font-mono">暂无申请人</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 删除确认弹窗 */}
      {deleteTarget && (
        <DeleteConfirmModal
          match={deleteTarget}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* 同意弹窗 */}
      {pendingParticipant && pendingMatch && (
        <ParticipantActionModal
          participant={pendingParticipant}
          matchType={pendingMatch.type}
          onConfirm={handleConfirmParticipant}
          onCancel={() => { setPendingParticipant(null); setPendingMatch(null) }}
        />
      )}

    </div>
  )
}
