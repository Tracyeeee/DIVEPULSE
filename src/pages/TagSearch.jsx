import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { safeGetItem, safeSetItem } from '../utils/safeStorage'
import './TagSearch.css'

const ALL_PULSE_DATA = [
  {
    id: 1,
    location: '菲律宾 - 长滩岛',
    visibility: 25,
    flow: 'Moderate',
    temp: 28,
    time: '2h',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop',
    respectCount: 42,
    uid: 'DP-7729',
    isAnonymous: false,
    tags: ['海龟', '珊瑚']
  },
  {
    id: 2,
    location: '泰国 - 斯米兰',
    visibility: 30,
    flow: 'Strong',
    temp: 29,
    time: '4h',
    image: 'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=400&h=300&fit=crop',
    respectCount: 28,
    uid: 'DP-3341',
    isAnonymous: false,
    tags: ['Manta', '鲨鱼']
  },
  {
    id: 3,
    location: '印尼 - 四王群岛',
    visibility: 40,
    flow: 'Light',
    temp: 27,
    time: '6h',
    image: 'https://images.unsplash.com/photo-1559825481-12a05cc00344?w=400&h=300&fit=crop',
    respectCount: 15,
    uid: 'DP-5567',
    isAnonymous: true,
    tags: ['杰克鱼风暴']
  },
  {
    id: 4,
    location: '马来西亚 - 仙本那',
    visibility: 20,
    flow: 'Strong',
    temp: 30,
    time: '8h',
    image: 'https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?w=400&h=300&fit=crop',
    respectCount: 36,
    uid: 'DP-8892',
    isAnonymous: false,
    tags: ['海龟', '沉船']
  },
  {
    id: 5,
    location: '马尔代夫',
    visibility: 35,
    flow: 'Moderate',
    temp: 28,
    time: '12h',
    image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=400&h=300&fit=crop',
    respectCount: 89,
    uid: 'DP-2214',
    isAnonymous: false,
    tags: ['Manta', '鲸鲨']
  },
  {
    id: 6,
    location: '埃及 - 红海',
    visibility: 28,
    flow: 'Strong',
    temp: 26,
    time: '18h',
    image: 'https://images.unsplash.com/photo-1551244072-5d12893278ab?w=400&h=300&fit=crop',
    respectCount: 12,
    uid: 'DP-4455',
    isAnonymous: true,
    tags: ['蝠鲼', '珊瑚']
  },
  {
    id: 7,
    location: '澳大利亚 - 大堡礁',
    visibility: 22,
    flow: 'Light',
    temp: 25,
    time: '24h',
    image: 'https://images.unsplash.com/photo-1587139223877-04cb899fa3e8?w=400&h=300&fit=crop',
    respectCount: 7,
    uid: 'DP-6678',
    isAnonymous: false,
    tags: ['Mola Mola', '海龟']
  },
  {
    id: 8,
    location: '帕劳',
    visibility: 45,
    flow: 'Moderate',
    temp: 29,
    time: '36h',
    image: 'https://images.unsplash.com/photo-1519451241324-20b4ea2c4220?w=400&h=300&fit=crop',
    respectCount: 23,
    uid: 'DP-9901',
    isAnonymous: false,
    tags: ['水母湖', '鲨鱼']
  }
]

export default function TagSearch() {
  const { tag } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState([])
  const [respectedIds, setRespectedIds] = useState(() => safeGetItem('divepulse_respects', []))

  const decodedTag = decodeURIComponent(tag || '')

  useEffect(() => {
    const filtered = ALL_PULSE_DATA.filter(item => 
      item && Array.isArray(item.tags) && item.tags.includes(decodedTag)
    )
    setData(filtered.sort((a, b) => b.respectCount - a.respectCount))
  }, [decodedTag])

  const handleRespect = (id, e) => {
    e.stopPropagation()
    const currentRespects = Array.isArray(respectedIds) ? respectedIds : []
    
    if (currentRespects.includes(id)) {
      const newRespects = currentRespects.filter(i => i !== id)
      setRespectedIds(newRespects)
      safeSetItem('divepulse_respects', newRespects)
      setData(data.map(item => 
        item && item.id === id ? { ...item, respectCount: Math.max(0, (item.respectCount || 0) - 1) } : item
      ))
    } else {
      const newRespects = [...currentRespects, id]
      setRespectedIds(newRespects)
      safeSetItem('divepulse_respects', newRespects)
      setData(data.map(item => 
        item && item.id === id ? { ...item, respectCount: (item.respectCount || 0) + 1 } : item
      ))
    }
  }

  return (
    <div className="tag-search">
      {/* Header */}
      <div className="tag-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← 返回
        </button>
        <div className="tag-title">
          <span className="tag-label font-mono">Tag:</span>
          <span className="tag-name font-sans">{decodedTag}</span>
        </div>
        <span className="tag-count font-mono">{data.length} 条</span>
      </div>

      {/* Results Grid */}
      <div className="tag-grid">
        {data.map(item => (
          <div key={item?.id || Date.now()} className="pulse-card">
            <div className="pulse-header">
              <div className="pulse-location font-sans">{item?.location || '未知'}</div>
              <div className="pulse-creator font-mono">
                {item?.isAnonymous ? 'Anonymous' : (item?.uid || '???')}
              </div>
            </div>
            <div className="pulse-image-container">
              <img
                src={item?.image || ''}
                alt={item?.location || ''}
                className="pulse-image"
                loading="lazy"
              />
            </div>
            <div className="pulse-metrics font-mono">
              <span className="metric">
                <span className="metric-value">V:{item?.visibility || 0}m</span>
              </span>
              <span className="metric-divider">|</span>
              <span className="metric">
                <span className="metric-value">F:{item?.flow || 'None'}</span>
              </span>
              <span className="metric-divider">|</span>
              <span className="metric">
                <span className="metric-value">T:{item?.temp || 0}°C</span>
              </span>
            </div>
            <div className="pulse-footer">
              <div className="pulse-time font-mono">{item?.time || '?'} ago</div>
              <button 
                className={`respect-btn ${Array.isArray(respectedIds) && respectedIds.includes(item?.id) ? 'respected' : ''}`}
                onClick={(e) => handleRespect(item?.id, e)}
              >
                <span className="respect-icon">↑</span>
                {(item?.respectCount || 0) > 0 && (
                  <span className="respect-count font-mono">{item.respectCount}</span>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {data.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">◎</div>
          <div className="empty-state-text">暂无相关情报</div>
        </div>
      )}
    </div>
  )
}
