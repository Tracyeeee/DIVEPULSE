import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../App'
import { matchApi } from '../utils/api'
import './MatchCreate.css'

const MATCH_TYPES = {
  'BOAT': '拼船',
  'CAR': '拼车',
  'ROOM': '拼房',
  'TEAM': '组队'
}

export default function MatchCreatePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const token = user?.token || null

  const [formData, setFormData] = useState({
    type: 'BOAT',
    location: '',
    country: '',
    date: '',
    dateType: 'date',
    timeSlot: '',
    crewCount: 2,
    fee: '',
    feeNote: '',
    description: '',
    certification: '',
    experience: 'Intermediate',
    requirements: []
  })
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!user) {
      setError('请先登录')
      return
    }

    setSubmitting(true)
    setError('')

    // 构建完整位置信息
    const location = ((formData.country
      ? `${formData.country} - ${formData.location}`
      : formData.location) || '').trim()

    // 格式化日期为 YYYY.MM.DD
    const dateFormatted = formData.date ? formData.date.replace(/-/g, '.') : null

    // 构建完整描述信息（包括费用、资质要求等）
    const descriptionParts = []
    if (formData.description) {
      descriptionParts.push(formData.description)
    }
    if (formData.fee) {
      descriptionParts.push(`费用预算：${formData.fee}`)
    }
    if (formData.feeNote) {
      descriptionParts.push(`费用说明：${formData.feeNote}`)
    }
    if (formData.experience) {
      descriptionParts.push(`潜水经验：${formData.experience}`)
    }
    if (formData.requirements.length > 0) {
      descriptionParts.push(`资质要求：${formData.requirements.join('、')}`)
    }

    const fullDescription = descriptionParts.join('\n')

    try {
      await matchApi.createMatch({
        type: formData.type,
        location: location || null,
        dateRange: { start: dateFormatted, end: null },
        total: formData.crewCount,
        description: fullDescription || null,
        note: fullDescription || null
      }, token)

      // 通知 MatchHub 刷新列表
      localStorage.setItem('matchhub_refresh', Date.now().toString())
      navigate('/match')
    } catch (err) {
      setError(err.message || '发布失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleRequirement = (req) => {
    if (formData.requirements.includes(req)) {
      setFormData({ ...formData, requirements: formData.requirements.filter(r => r !== req) })
    } else {
      setFormData({ ...formData, requirements: [...formData.requirements, req] })
    }
  }

  return (
    <div className="match-create-page">
      {/* Header */}
      <div className="match-header">
        <button className="match-back" onClick={() => navigate(-1)}>←</button>
        <span className="match-title font-mono">发起招募</span>
        <button className="match-submit font-mono" disabled={submitting} onClick={handleSubmit}>
          {submitting ? '发布中...' : '发布'}
        </button>
      </div>

      {error && (
        <div className="match-create-error font-sans" onClick={() => setError('')}>
          {error}
        </div>
      )}

      {/* Form */}
      <div className="match-form">
        {/* Type */}
        <div className="form-section">
          <div className="section-label font-mono">类型</div>
          <div className="type-selector">
            {Object.entries(MATCH_TYPES).map(([key, label]) => (
              <button
                key={key}
                className={`type-btn ${formData.type === key ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, type: key })}
              >
                [{label}]
              </button>
            ))}
          </div>
        </div>

        {/* Location */}
        <div className="form-section">
          <div className="section-label font-mono">目的地</div>
          <div className="form-row">
            <input
              type="text"
              className="form-input"
              placeholder="输入地点名称..."
              value={formData.location}
              onChange={e => setFormData({ ...formData, location: e.target.value })}
            />
            <input
              type="text"
              className="form-input country-input"
              placeholder="国家"
              maxLength={2}
              value={formData.country}
              onChange={e => setFormData({ ...formData, country: e.target.value.toUpperCase() })}
            />
          </div>
        </div>

        {/* Time */}
        <div className="form-section">
          <div className="section-label font-mono">时间</div>
          <div className="time-row">
            <button
              className={`time-type-btn ${formData.dateType === 'date' ? 'active' : ''}`}
              onClick={() => setFormData({...formData, dateType: 'date'})}
            >
              特定日期
            </button>
            <button
              className={`time-type-btn ${formData.dateType === 'period' ? 'active' : ''}`}
              onClick={() => setFormData({...formData, dateType: 'period'})}
            >
              时间区间
            </button>
          </div>
          <div className="date-input-row">
            <button
              className="date-value font-mono"
              onClick={() => setShowDatePicker(!showDatePicker)}
            >
              {formData.date || '选择日期'}
            </button>
            {formData.dateType === 'period' && (
              <input
                type="text"
                className="form-input time-slot"
                placeholder="如：4月下旬"
                value={formData.timeSlot}
                onChange={e => setFormData({...formData, timeSlot: e.target.value})}
              />
            )}
          </div>
          {showDatePicker && (
            <input
              type="date"
              className="date-picker font-mono"
              value={formData.date}
              onChange={e => {
                setFormData({...formData, date: e.target.value})
                setShowDatePicker(false)
              }}
            />
          )}
        </div>

        {/* Crew */}
        <div className="form-section">
          <div className="section-label font-mono">人数</div>
          <div className="crew-selector">
            <button
              className="crew-btn"
              onClick={() => setFormData({...formData, crewCount: Math.max(1, formData.crewCount - 1)})}
            >−</button>
            <span className="crew-count font-mono">{formData.crewCount}</span>
            <button
              className="crew-btn"
              onClick={() => setFormData({...formData, crewCount: Math.min(20, formData.crewCount + 1)})}
            >+</button>
          </div>
          <div className="crew-hint font-mono">招募 {formData.crewCount} 名潜水员</div>
        </div>

        {/* Fee */}
        <div className="form-section">
          <div className="section-label font-mono">费用分摊</div>
          <input
            type="text"
            className="form-input"
            placeholder="人均预算（如：2000元）"
            value={formData.fee}
            onChange={e => setFormData({...formData, fee: e.target.value})}
          />
          <input
            type="text"
            className="form-input"
            placeholder="费用备注（可选）"
            value={formData.feeNote}
            onChange={e => setFormData({...formData, feeNote: e.target.value})}
            style={{ marginTop: 'var(--space-sm)' }}
          />
        </div>

        {/* Requirements */}
        <div className="form-section">
          <div className="section-label font-mono">资质要求</div>
          <div className="req-chips">
            {['OW+', 'AOW+', 'RESCUE', 'NITROX', 'DEEP'].map(req => (
              <button
                key={req}
                className={`req-chip ${formData.requirements.includes(req) ? 'active' : ''}`}
                onClick={() => toggleRequirement(req)}
              >
                {req}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="form-section">
          <div className="section-label font-mono">描述</div>
          <textarea
            className="form-textarea"
            placeholder="分享你的潜水计划..."
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
            rows={5}
          />
        </div>
      </div>
    </div>
  )
}
