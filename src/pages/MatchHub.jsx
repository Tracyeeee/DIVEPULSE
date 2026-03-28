import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../App'
import { safeGetItem, safeSetItem } from '../utils/safeStorage'
import './MatchHub.css'

const SAMPLE_MATCH_DATA = [
  {
    id: 1,
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
    id: 2,
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
    id: 3,
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
    id: 4,
    type: 'TEAM',
    location: '马来西亚 - 仙本那',
    dateRange: { start: '2026.04.15', end: null },
    current: 3,
    total: 4,
    status: 'open',
    uid: 'DP-8892',
    note: 'Fun Dive组队'
  },
  {
    id: 5,
    type: 'BOAT',
    location: '马尔代夫',
    dateRange: { start: '2026.04.20', end: '2026.04.26' },
    current: 4,
    total: 8,
    status: 'open',
    uid: 'DP-2214',
    note: '船宿行程'
  }
]

const MATCH_TYPES = {
  'BOAT': '拼船',
  'CAR': '拼车',
  'ROOM': '拼房',
  'TEAM': '组队'
}

function formatDateForDisplay(dateStr) {
  if (!dateStr) return ''
  return dateStr.replace(/-/g, '.')
}

function formatDateRange(range) {
  if (!range) return ''
  if (range.end) {
    return `${range.start} - ${range.end}`
  }
  return range.start
}

/**
 * 删除确认弹窗组件
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
          <button className="modal-btn cancel font-mono" onClick={onCancel}>
            取消
          </button>
          <button className="modal-btn confirm font-mono" onClick={onConfirm}>
            确认删除
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MatchHub() {
  const [activeTab, setActiveTab] = useState('join')
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({
    type: 'BOAT',
    location: '',
    startDate: '',
    endDate: '',
    total: 2,
    note: ''
  })
  const [myRequests, setMyRequests] = useState(() => safeGetItem('divepulse_my_matches', []))
  const [deleteTarget, setDeleteTarget] = useState(null) // 待删除的拼行
  const [myCreatedMatches, setMyCreatedMatches] = useState(() => safeGetItem('divepulse_my_created_matches', []))
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleCreate = () => {
    if (!createForm.location || !createForm.startDate) return

    const startFormatted = formatDateForDisplay(createForm.startDate)
    const endFormatted = createForm.endDate ? formatDateForDisplay(createForm.endDate) : null

    // 创建新拼行
    const newMatch = {
      id: Date.now(),
      type: createForm.type,
      location: createForm.location,
      dateRange: { start: startFormatted, end: endFormatted },
      current: 1,
      total: createForm.total,
      status: 'open',
      uid: user?.uid || 'DP-0000',
      note: createForm.note
    }

    const updated = [newMatch, ...myCreatedMatches]
    setMyCreatedMatches(updated)
    safeSetItem('divepulse_my_created_matches', updated)

    setShowCreate(false)
    setActiveTab('my')
    setCreateForm({
      type: 'BOAT',
      location: '',
      startDate: '',
      endDate: '',
      total: 2,
      note: ''
    })
  }

  const handleRequest = (id) => {
    if (myRequests.includes(id)) return
    const updated = [...myRequests, id]
    setMyRequests(updated)
    safeSetItem('divepulse_my_matches', updated)
  }

  /**
   * 点击删除按钮 → 显示确认弹窗
   */
  const handleDeleteClick = (match, e) => {
    e.stopPropagation()
    setDeleteTarget(match)
  }

  /**
   * 确认删除 → 正式删除并关闭弹窗
   */
  const handleConfirmDelete = () => {
    if (!deleteTarget) return

    const updated = myCreatedMatches.filter(m => m.id !== deleteTarget.id)
    setMyCreatedMatches(updated)
    safeSetItem('divepulse_my_created_matches', updated)
    setDeleteTarget(null)
  }

  /**
   * 取消删除 → 关闭弹窗
   */
  const handleCancelDelete = () => {
    setDeleteTarget(null)
  }

  const getToday = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  return (
    <div className="match-hub">
      {/* Header */}
      <div className="match-header">
        <h1 className="match-title">找搭子</h1>
        <button className="add-btn" onClick={() => setShowCreate(true)}>
          +
        </button>
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

      {/* Join List */}
      {activeTab === 'join' && (
        <div className="match-list">
          {SAMPLE_MATCH_DATA.map(item => (
            <div
              key={item.id}
              className="match-card"
              onClick={() => navigate(`/detail/${item.id}`)}
            >
              <div className="match-card-left">
                <span className="match-type-badge">{MATCH_TYPES[item.type]}</span>
              </div>
              <div className="match-card-center">
                <div className="match-location">{item.location}</div>
                <div className="match-date font-mono">
                  {formatDateRange(item.dateRange)}
                </div>
              </div>
              <div className="match-card-right">
                <div className="match-progress font-mono">
                  <span className="progress-current">{item.current}</span>
                  <span className="progress-divider">/</span>
                  <span className="progress-total">{item.total}</span>
                </div>
                <button
                  className={`request-btn font-mono ${
                    myRequests.includes(item.id) ? 'requested' : ''
                  }`}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRequest(item.id)
                  }}
                >
                  {myRequests.includes(item.id) ? '已申请' : '申请'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* My Launch List */}
      {activeTab === 'my' && (
        <div className="match-list">
          {myCreatedMatches.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">⊞</div>
              <div className="empty-state-text">尚未发起任何拼行</div>
              <button
                className="btn btn-outline"
                onClick={() => setShowCreate(true)}
              >
                发起拼行
              </button>
            </div>
          ) : (
            myCreatedMatches.map(item => (
              <div
                key={item.id}
                className="match-card"
                onClick={() => navigate(`/detail/${item.id}`)}
              >
                <div className="match-card-left">
                  <span className="match-type-badge">{MATCH_TYPES[item.type]}</span>
                </div>
                <div className="match-card-center">
                  <div className="match-location">{item.location}</div>
                  <div className="match-date font-mono">
                    {formatDateRange(item.dateRange)}
                  </div>
                </div>
                <div className="match-card-right">
                  <span className="badge">进行中</span>
                  <button
                    className="delete-match-btn font-mono"
                    onClick={(e) => handleDeleteClick(item, e)}
                    title="删除"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <DeleteConfirmModal
          match={deleteTarget}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}

      {/* Create Drawer */}
      {showCreate && (
        <>
          <div className="drawer-overlay" onClick={() => setShowCreate(false)} />
          <div className="drawer create-drawer">
            <div className="drawer-title">发起拼行</div>
            
            <div className="input-group">
              <label className="input-label">类型</label>
              <div className="type-selector">
                {Object.entries(MATCH_TYPES).map(([key, label]) => (
                  <button
                    key={key}
                    className={`type-btn ${createForm.type === key ? 'active' : ''}`}
                    onClick={() => setCreateForm({ ...createForm, type: key })}
                  >
                    [{label}]
                  </button>
                ))}
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">地点</label>
              <input
                type="text"
                className="input-field"
                placeholder="输入目的地"
                value={createForm.location}
                onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })}
              />
            </div>

            <div className="input-group">
              <label className="input-label">时间</label>
              <div className="date-range-input">
                <input
                  type="date"
                  className="date-input font-mono"
                  value={createForm.startDate}
                  min={getToday()}
                  onChange={(e) => setCreateForm({ ...createForm, startDate: e.target.value })}
                />
                <span className="date-separator">-</span>
                <input
                  type="date"
                  className="date-input font-mono"
                  value={createForm.endDate}
                  min={createForm.startDate || getToday()}
                  onChange={(e) => setCreateForm({ ...createForm, endDate: e.target.value })}
                  placeholder="可选"
                />
              </div>
              <div className="date-hint font-mono">
                {createForm.startDate && !createForm.endDate && (
                  <span className="hint-single">单日: {formatDateForDisplay(createForm.startDate)}</span>
                )}
                {createForm.startDate && createForm.endDate && (
                  <span className="hint-range">
                    区间: {formatDateForDisplay(createForm.startDate)} - {formatDateForDisplay(createForm.endDate)}
                  </span>
                )}
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">人数</label>
              <div className="counter-input">
                <button
                  className="counter-btn"
                  onClick={() => setCreateForm({ ...createForm, total: Math.max(2, createForm.total - 1) })}
                >
                  -
                </button>
                <span className="counter-value font-mono">{createForm.total}</span>
                <button
                  className="counter-btn"
                  onClick={() => setCreateForm({ ...createForm, total: createForm.total + 1 })}
                >
                  +
                </button>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">备注</label>
              <input
                type="text"
                className="input-field"
                placeholder="补充说明"
                value={createForm.note}
                onChange={(e) => setCreateForm({ ...createForm, note: e.target.value })}
              />
            </div>

            <button className="btn btn-primary btn-full" onClick={handleCreate}>
              发布
            </button>
          </div>
        </>
      )}
    </div>
  )
}
