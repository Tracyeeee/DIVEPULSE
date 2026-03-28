import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import CommentDrawer from '../components/CommentDrawer'
import { safeGetItem, safeSetItem } from '../utils/safeStorage'
import './PulseFeed.css'

const INITIAL_PULSE_DATA = [
  {
    id: 1,
    location: '菲律宾 - 长滩岛',
    country: 'PH',
    visibility: 25,
    flow: 'Moderate',
    temp: 28,
    time: '2h',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop',
    weight: 48,
    geoHash: 'PH.BH',
    respectCount: 42,
    uid: 'DP-7729',
    isAnonymous: false,
    tags: ['海龟', '珊瑚']
  },
  {
    id: 2,
    location: '泰国 - 斯米兰',
    country: 'TH',
    visibility: 30,
    flow: 'Strong',
    temp: 29,
    time: '4h',
    image: 'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=400&h=300&fit=crop',
    weight: 47,
    geoHash: 'TH.SM',
    respectCount: 28,
    uid: 'DP-3341',
    isAnonymous: false,
    tags: ['Manta', '鲨鱼']
  },
  {
    id: 3,
    location: '印尼 - 四王群岛',
    country: 'ID',
    visibility: 40,
    flow: 'Light',
    temp: 27,
    time: '6h',
    image: 'https://images.unsplash.com/photo-1559825481-12a05cc00344?w=400&h=300&fit=crop',
    weight: 46,
    geoHash: 'ID.R4',
    respectCount: 15,
    uid: 'DP-5567',
    isAnonymous: true,
    tags: ['杰克鱼风暴']
  },
  {
    id: 4,
    location: '马来西亚 - 仙本那',
    country: 'MY',
    visibility: 20,
    flow: 'Strong',
    temp: 30,
    time: '8h',
    image: 'https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?w=400&h=300&fit=crop',
    weight: 45,
    geoHash: 'MY.SB',
    respectCount: 36,
    uid: 'DP-8892',
    isAnonymous: false,
    tags: ['海龟', '沉船']
  },
  {
    id: 5,
    location: '马尔代夫',
    country: 'MV',
    visibility: 35,
    flow: 'Moderate',
    temp: 28,
    time: '12h',
    image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=400&h=300&fit=crop',
    weight: 44,
    geoHash: 'MV.AT',
    respectCount: 89,
    uid: 'DP-2214',
    isAnonymous: false,
    tags: ['Manta', '鲸鲨']
  },
  {
    id: 6,
    location: '埃及 - 红海',
    country: 'EG',
    visibility: 28,
    flow: 'Strong',
    temp: 26,
    time: '18h',
    image: 'https://images.unsplash.com/photo-1551244072-5d12893278ab?w=400&h=300&fit=crop',
    weight: 43,
    geoHash: 'EG.RS',
    respectCount: 12,
    uid: 'DP-4455',
    isAnonymous: true,
    tags: ['蝠鲼', '珊瑚']
  },
  {
    id: 7,
    location: '澳大利亚 - 大堡礁',
    country: 'AU',
    visibility: 22,
    flow: 'Light',
    temp: 25,
    time: '24h',
    image: 'https://images.unsplash.com/photo-1587139223877-04cb899fa3e8?w=400&h=300&fit=crop',
    weight: 42,
    geoHash: 'AU.GB',
    respectCount: 7,
    uid: 'DP-6678',
    isAnonymous: false,
    tags: ['Mola Mola', '海龟']
  },
  {
    id: 8,
    location: '帕劳',
    country: 'PW',
    visibility: 45,
    flow: 'Moderate',
    temp: 29,
    time: '36h',
    image: 'https://images.unsplash.com/photo-1519451241324-20b4ea2c4220?w=400&h=300&fit=crop',
    weight: 40,
    geoHash: 'PW.PL',
    respectCount: 23,
    uid: 'DP-9901',
    isAnonymous: false,
    tags: ['水母湖', '鲨鱼']
  }
]

export default function PulseFeed() {
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('Most Liked')
  const [timeRange, setTimeRange] = useState('All Time')
  const [showFilter, setShowFilter] = useState(false)
  const [data, setData] = useState(INITIAL_PULSE_DATA)
  const [loading, setLoading] = useState(false)
  const [respectedIds, setRespectedIds] = useState(() => safeGetItem('divepulse_respects', []))
  const [activeCommentPulse, setActiveCommentPulse] = useState(null)
  const [commentCounts, setCommentCounts] = useState({})
  const navigate = useNavigate()

  const hasActiveFilter = sortBy !== 'Most Liked' || timeRange !== 'All Time'

  const TIME_RANGES = {
    'All Time': Infinity,
    '24 Hours': 24 * 60 * 60 * 1000,
    '7 Days': 7 * 24 * 60 * 60 * 1000,
    '6 Months': 180 * 24 * 60 * 60 * 1000,
  }

  // 持久化点赞状态
  useEffect(() => {
    safeSetItem('divepulse_respects', respectedIds)
  }, [respectedIds])

  // 加载评论数
  useEffect(() => {
    const counts = {}
    
    // 从初始数据加载
    INITIAL_PULSE_DATA.forEach(pulse => {
      const saved = safeGetItem(`divepulse_comments_${pulse.id}`, null)
      counts[pulse.id] = Array.isArray(saved) ? saved.length : 0
    })
    
    // 从用户发布的数据加载
    const savedPulses = safeGetItem('divepulse_new_pulses', [])
    if (Array.isArray(savedPulses)) {
      savedPulses.forEach(pulse => {
        const saved = safeGetItem(`divepulse_comments_${pulse.id}`, null)
        counts[pulse.id] = Array.isArray(saved) ? saved.length : 0
      })
    }
    
    setCommentCounts(counts)
  }, [])

  // 过滤和排序
  useEffect(() => {
    setLoading(true)
    const timer = setTimeout(() => {
      let filtered = [...INITIAL_PULSE_DATA]

      // 安全获取用户发布的脉搏
      const userPulses = safeGetItem('divepulse_new_pulses', [])
      if (Array.isArray(userPulses) && userPulses.length > 0) {
        filtered = [...userPulses, ...filtered]
      }

      // 搜索过滤
      if (search.trim()) {
        const searchLower = search.toLowerCase()
        filtered = filtered.filter(item =>
          item.location?.toLowerCase().includes(searchLower) ||
          item.tags?.some(tag => tag.toLowerCase().includes(searchLower))
        )
      }

      // 时间范围过滤
      const now = Date.now()
      const rangeMs = TIME_RANGES[timeRange]
      if (rangeMs !== Infinity) {
        filtered = filtered.filter(item => {
          const postTime = now - (item.id * 1000)
          return (now - postTime) <= rangeMs
        })
      }

      // 排序
      if (sortBy === 'Latest') {
        filtered.sort((a, b) => b.id - a.id)
      } else if (sortBy === 'Most Liked') {
        filtered.sort((a, b) => b.respectCount - a.respectCount)
      } else if (sortBy === 'Most Commented') {
        filtered.sort((a, b) => (commentCounts[b.id] || 0) - (commentCounts[a.id] || 0))
      }

      setData(filtered)
      setLoading(false)
    }, 100)

    return () => clearTimeout(timer)
  }, [search, sortBy, timeRange, commentCounts])

  const handleSortSelect = (sort) => {
    setSortBy(sort)
    setShowFilter(false)
  }

  const handleTimeRangeSelect = (range) => {
    setTimeRange(range)
    setShowFilter(false)
  }

  const handleResetFilters = () => {
    setSortBy('Most Liked')
    setTimeRange('All Time')
  }

  const handleRespect = (id, e) => {
    e.stopPropagation()
    if (respectedIds.includes(id)) {
      setRespectedIds(respectedIds.filter(i => i !== id))
      setData(data.map(item => 
        item.id === id ? { ...item, respectCount: Math.max(0, item.respectCount - 1) } : item
      ))
    } else {
      setRespectedIds([...respectedIds, id])
      setData(data.map(item => 
        item.id === id ? { ...item, respectCount: item.respectCount + 1 } : item
      ))
    }
  }

  const handleTagClick = (tag, e) => {
    e.stopPropagation()
    navigate(`/tag/${encodeURIComponent(tag)}`)
  }

  const handleOpenComments = (pulse, e) => {
    e.stopPropagation()
    setActiveCommentPulse(pulse)
  }

  const handleCloseComments = () => {
    const counts = { ...commentCounts }
    const saved = safeGetItem(`divepulse_comments_${activeCommentPulse?.id}`, null)
    if (activeCommentPulse?.id) {
      counts[activeCommentPulse.id] = Array.isArray(saved) ? saved.length : 0
    }
    setCommentCounts(counts)
    setActiveCommentPulse(null)
  }

  return (
    <div className="pulse-feed">
      <div className={`search-bar ${hasActiveFilter ? 'has-active-filter' : ''}`}>
        <div className="search-top-row">
          <span className="search-logo">DIVEPULSE</span>
        </div>
        <div className="search-bottom-row">
          <div className="search-input-wrapper">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="SEARCH SPECIES / LOCATION..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="search-divider"></div>
          <button
            className={`filter-toggle ${hasActiveFilter ? 'active' : ''}`}
            onClick={() => setShowFilter(!showFilter)}
          >
            <svg className="filter-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>
            </svg>
            {hasActiveFilter && (
              <span className="filter-active-label">
                {timeRange === '24 Hours' ? '1d' : timeRange === '7 Days' ? '7d' : timeRange === '6 Months' ? '6m' : sortBy === 'Latest' ? '新' : sortBy === 'Most Commented' ? '评' : '赞'}
              </span>
            )}
          </button>
        </div>

        {showFilter && (
          <div className="filter-panel">
            <div className="panel-section">
              <div className="section-header font-mono">排序依据</div>
              <div className="filter-options">
                {['Latest', 'Most Liked', 'Most Commented'].map(sort => (
                  <button
                    key={sort}
                    className={`filter-option ${sortBy === sort ? 'active' : ''}`}
                    onClick={() => handleSortSelect(sort)}
                  >
                    {sort === 'Latest' && '最新'}
                    {sort === 'Most Liked' && '最多点赞'}
                    {sort === 'Most Commented' && '最多评论'}
                    {sortBy === sort && <span className="check-mark">✓</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="panel-section">
              <div className="section-header font-mono">发布时间</div>
              <div className="filter-options">
                {['All Time', '24 Hours', '7 Days', '6 Months'].map(range => (
                  <button
                    key={range}
                    className={`filter-option ${timeRange === range ? 'active' : ''}`}
                    onClick={() => handleTimeRangeSelect(range)}
                  >
                    {range === 'All Time' && '不限'}
                    {range === '24 Hours' && '1天内'}
                    {range === '7 Days' && '1周内'}
                    {range === '6 Months' && '半年内'}
                    {timeRange === range && <span className="check-mark">✓</span>}
                  </button>
                ))}
              </div>
            </div>

            {hasActiveFilter && (
              <button className="reset-filters font-mono" onClick={handleResetFilters}>
                重置筛选
              </button>
            )}
          </div>
        )}
      </div>

      {loading && (
        <div className="loading-bar font-mono">LOADING...</div>
      )}

      <div className="pulse-grid">
        {data.map(item => (
          <div key={item.id} className="pulse-card">
            <div className="pulse-header" onClick={() => navigate(`/pulse/${item.id}`)}>
              <div className="pulse-location font-sans">{item.location}</div>
              <div className="pulse-creator font-mono">
                {item.isAnonymous ? 'Anonymous' : item.uid}
              </div>
            </div>
            <div className="pulse-image-container" onClick={() => navigate(`/pulse/${item.id}`)}>
              <img
                src={item.image}
                alt={item.location}
                className="pulse-image"
                loading="lazy"
              />
              {item.weight > 45 && (
                <span className="pulse-top-badge font-mono">TOP</span>
              )}
            </div>
            
            {item.tags && item.tags.length > 0 && (
              <div className="pulse-tags">
                {item.tags.slice(0, 2).map(tag => (
                  <button 
                    key={tag} 
                    className="pulse-tag font-sans"
                    onClick={(e) => handleTagClick(tag, e)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
            
            <div className="pulse-metrics font-mono">
              <span className="metric">
                <span className="metric-value">V:{item.visibility}m</span>
              </span>
              <span className="metric-divider">|</span>
              <span className="metric">
                <span className="metric-value">F:{item.flow}</span>
              </span>
              <span className="metric-divider">|</span>
              <span className="metric">
                <span className="metric-value">T:{item.temp}°C</span>
              </span>
            </div>
            <div className="pulse-footer">
              <button 
                className="comment-btn font-mono"
                onClick={(e) => handleOpenComments(item, e)}
              >
                {commentCounts[item.id] || 0} Comments
              </button>
              <button
                className={`like-btn ${respectedIds.includes(item.id) ? 'liked' : ''}`}
                onClick={(e) => handleRespect(item.id, e)}
              >
                <svg className="heart-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                <span className="like-count">{item.respectCount}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {data.length === 0 && !loading && (
        <div className="empty-state">
          <div className="empty-state-icon">◎</div>
          <div className="empty-state-text">NO DATA FOUND</div>
        </div>
      )}

      {activeCommentPulse && (
        <CommentDrawer
          pulseId={activeCommentPulse.id}
          isOpen={!!activeCommentPulse}
          onClose={handleCloseComments}
          pulseCreatorUid={activeCommentPulse.uid}
          isAnonymous={activeCommentPulse.isAnonymous}
        />
      )}
    </div>
  )
}
