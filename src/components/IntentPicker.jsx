import { useNavigate } from 'react-router-dom'
import './IntentPicker.css'

export default function IntentPicker({ isOpen, onClose }) {
  const navigate = useNavigate()

  if (!isOpen) return null

  const handlePost = () => {
    onClose()
    navigate('/post')
  }

  const handleMatch = () => {
    onClose()
    navigate('/match/create')
  }

  return (
    <div className="intent-overlay" onClick={onClose}>
      <div className="intent-picker" onClick={e => e.stopPropagation()}>
        <div className="intent-title font-mono">选择功能</div>
        
        <button className="intent-option" onClick={handlePost}>
          <span className="intent-icon">◎</span>
          <div className="intent-info">
            <span className="intent-label">发布潜水</span>
            <span className="intent-desc">记录潜水体验</span>
          </div>
        </button>

        <button className="intent-option" onClick={handleMatch}>
          <span className="intent-icon">⊞</span>
          <div className="intent-info">
            <span className="intent-label">发起招募</span>
            <span className="intent-desc">发起拼团招募</span>
          </div>
        </button>

        <button className="intent-cancel" onClick={onClose}>
          取消
        </button>
      </div>
    </div>
  )
}
