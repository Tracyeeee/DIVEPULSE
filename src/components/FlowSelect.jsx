import { useState, useRef } from 'react'
import './FlowSelect.css'

const FLOW_OPTIONS = [
  { value: 'None', label: '无' },
  { value: 'Light', label: '弱' },
  { value: 'Moderate', label: '中' },
  { value: 'Strong', label: '强' },
]

/**
 * 自定义水流下拉选择器
 * 替代原生 <select>，解决 Windows 原生渲染白底白字问题
 * @param {{ value: string, onChange: (value: string) => void, className?: string, placeholder?: string }} props
 */
export default function FlowSelect({ value, onChange, className = '', placeholder = '' }) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 })
  const triggerRef = useRef(null)

  const selected = FLOW_OPTIONS.find(f => f.value === value)
  const hasValue = !!selected

  const handleOpen = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setPosition({ top: rect.bottom + 4, left: rect.left, width: Math.max(rect.width, 100) })
    }
    setOpen(true)
  }

  return (
    <div className={`flow-select ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        className="flow-select-trigger"
        onClick={handleOpen}
      >
        {hasValue ? selected.label : (
          <span className="flow-select-placeholder">{placeholder}</span>
        )}
        <span className="flow-select-arrow">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <>
          <div
            className="flow-select-dropdown"
            style={{ top: position.top, left: position.left, width: position.width }}
          >
            {FLOW_OPTIONS.map(f => (
              <button
                key={f.value}
                type="button"
                className={`flow-select-option ${value === f.value ? 'active' : ''}`}
                onClick={() => { onChange(f.value); setOpen(false) }}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flow-select-overlay" onClick={() => setOpen(false)} />
        </>
      )}
    </div>
  )
}
