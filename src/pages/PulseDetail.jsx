import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import CommentDrawer from '../components/CommentDrawer'
import { safeGetItem, safeSetItem } from '../utils/safeStorage'
import './PulseDetail.css'

const INITIAL_PULSE_DATA = {
  1: {
    id: 1,
    location: '长滩岛',
    country: 'PH',
    fullLocation: '菲律宾 - 长滩岛 - 潜点东侧',
    coordinates: '11.967°N, 121.923°E',
    visibility: 25,
    flow: 'Moderate',
    temp: 28,
    time: '2h',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=800&fit=crop',
    weight: 48,
    geoHash: 'PH.BH',
    respectCount: 42,
    uid: 'DP-7729',
    isAnonymous: false,
    tags: ['海龟', '珊瑚'],
    title: '晨潜邂逅海龟群',
    story: '早上6点的第一潜，能见度出奇的好。在潜点东侧遇到了一群5只海龟，正在悠闲地啃食珊瑚。流速适中，水温28度非常舒适。建议早潜避开人流高峰。',
    note: '最佳观测时间：清晨6-8点'
  },
  2: {
    id: 2,
    location: '斯米兰',
    country: 'TH',
    fullLocation: '泰国 - 斯米兰群岛 - 9号潜点',
    coordinates: '7.763°N, 97.641°E',
    visibility: 30,
    flow: 'Strong',
    temp: 29,
    time: '4h',
    image: 'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=800&h=800&fit=crop',
    weight: 47,
    geoHash: 'TH.SM',
    respectCount: 28,
    uid: 'DP-3341',
    isAnonymous: false,
    tags: ['Manta', '鲨鱼'],
    title: 'Manta 清洁站',
    story: '斯米兰9号潜点果然名不虚传。Manta 清洁站周围有3只 Manta 在盘旋，等待鱼医生清理。流速较强，需要有经验。建议放流潜注意安全。',
    note: null
  },
  3: {
    id: 3,
    location: '四王群岛',
    country: 'ID',
    fullLocation: '印尼 - 四王群岛 - 梅德港',
    coordinates: '0.252°S, 130.668°E',
    visibility: 40,
    flow: 'Light',
    temp: 27,
    time: '6h',
    image: 'https://images.unsplash.com/photo-1559825481-12a05cc00344?w=800&h=800&fit=crop',
    weight: 46,
    geoHash: 'ID.R4',
    respectCount: 15,
    uid: 'DP-5567',
    isAnonymous: true,
    tags: ['杰克鱼风暴'],
    title: '震撼的杰克鱼球',
    story: '下午3点的杰克鱼风暴，规模是见过最大的。成千上万条杰克鱼形成巨大的球形，被海狼群围攻。拍摄时注意控制中性浮力，不要惊扰鱼群。',
    note: '下午2-4点最佳'
  },
  4: {
    id: 4,
    location: '仙本那',
    country: 'MY',
    fullLocation: '马来西亚 - 仙本那 - 珍珠岛',
    coordinates: '4.414°N, 118.026°E',
    visibility: 20,
    flow: 'Strong',
    temp: 30,
    time: '8h',
    image: 'https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?w=800&h=800&fit=crop',
    weight: 45,
    geoHash: 'MY.SB',
    respectCount: 36,
    uid: 'DP-8892',
    isAnonymous: false,
    tags: ['海龟', '沉船'],
    title: '海龟与沉船',
    story: '珍珠岛的经典潜点，有一艘30米长的二战沉船。海龟经常在沉船周围活动，今天还看到一只绿海龟在沉船顶部晒太阳。流速较强，注意入水和出水点。',
    note: '需要AOW级别'
  },
  5: {
    id: 5,
    location: '马尔代夫',
    country: 'MV',
    fullLocation: '马尔代夫 - 芭环礁 - Hanifaru湾',
    coordinates: '5.315°N, 73.046°E',
    visibility: 35,
    flow: 'Moderate',
    temp: 28,
    time: '12h',
    image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&h=800&fit=crop',
    weight: 44,
    geoHash: 'MV.AT',
    respectCount: 89,
    uid: 'DP-2214',
    isAnonymous: false,
    tags: ['Manta', '鲸鲨'],
    title: 'Manta 夜潜',
    story: 'Hanifaru 湾的夜潜是此行最震撼的体验。当手电照向水面，数十只 Manta 围过来，张开大嘴过滤浮游生物。它们就在你身边1-2米处掠过。',
    note: '需预约当地潜导'
  },
  6: {
    id: 6,
    location: '红海',
    country: 'EG',
    fullLocation: '埃及 - 红海 - 达哈布',
    coordinates: '27.828°N, 34.286°E',
    visibility: 28,
    flow: 'Strong',
    temp: 26,
    time: '18h',
    image: 'https://images.unsplash.com/photo-1551244072-5d12893278ab?w=800&h=800&fit=crop',
    weight: 43,
    geoHash: 'EG.RS',
    respectCount: 12,
    uid: 'DP-4455',
    isAnonymous: true,
    tags: ['蝠鲼', '珊瑚'],
    title: '珊瑚墙潜点',
    story: '达哈布附近的珊瑚墙保存完好，色彩斑斓。蝠鲼经常在珊瑚墙上方游弋。今天遇到两只，都在5-6米深度。流速较强，建议使用流钩。',
    note: null
  },
  7: {
    id: 7,
    location: '大堡礁',
    country: 'AU',
    fullLocation: '澳大利亚 - 大堡礁 - 蜥蜴岛',
    coordinates: '14.668°S, 145.448°E',
    visibility: 22,
    flow: 'Light',
    temp: 25,
    time: '24h',
    image: 'https://images.unsplash.com/photo-1587139223877-04cb899fa3e8?w=800&h=800&fit=crop',
    weight: 42,
    geoHash: 'AU.GB',
    respectCount: 7,
    uid: 'DP-6678',
    isAnonymous: false,
    tags: ['Mola Mola', '海龟'],
    title: 'Mola Mola 季节',
    story: '刚好赶上 Mola Mola 季节！在蜥蜴岛北侧遇到了两只正在让鱼医生清洁的 Mola Mola。它们有2米宽，完全不怕潜水员。',
    note: '最佳季节：6-10月'
  },
  8: {
    id: 8,
    location: '帕劳',
    country: 'PW',
    fullLocation: '帕劳 - 科罗尔 - 水母湖',
    coordinates: '7.452°N, 134.479°E',
    visibility: 45,
    flow: 'Moderate',
    temp: 29,
    time: '36h',
    image: 'https://images.unsplash.com/photo-1519451241324-20b4ea2c4220?w=800&h=800&fit=crop',
    weight: 40,
    geoHash: 'PW.PL',
    respectCount: 23,
    uid: 'DP-9901',
    isAnonymous: false,
    tags: ['水母湖', '鲨鱼'],
    title: '无毒水母湖',
    story: '帕劳水母湖是必打卡地点。数以百万计的金色水母在湖中漂浮，完全无毒。鲨鱼经常在湖口的蓝角游弋。注意：水母湖需要爬山30分钟。',
    note: '建议上午前往，避免人多'
  }
}

export default function PulseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [pulse, setPulse] = useState(null)
  const [isRespected, setIsRespected] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [commentCount, setCommentCount] = useState(0)

  useEffect(() => {
    const pulseId = parseInt(id, 10) || 1
    
    // 安全获取用户发布的脉搏
    const savedPulses = safeGetItem('divepulse_new_pulses', [])
    let pulseData = null
    
    if (Array.isArray(savedPulses) && savedPulses.length > 0) {
      pulseData = savedPulses.find(p => p.id === pulseId)
    }
    
    if (!pulseData) {
      pulseData = INITIAL_PULSE_DATA[pulseId]
    }
    
    setPulse(pulseData)
    
    // 安全读取点赞状态
    const savedRespects = safeGetItem('divepulse_respects', [])
    if (Array.isArray(savedRespects)) {
      setIsRespected(savedRespects.includes(pulseId))
    }
    
    // 安全读取评论数
    const savedComments = safeGetItem(`divepulse_comments_${pulseId}`, null)
    setCommentCount(Array.isArray(savedComments) ? savedComments.length : 0)
  }, [id])

  const handleRespect = () => {
    const pulseId = parseInt(id, 10) || 1
    const savedRespects = safeGetItem('divepulse_respects', [])
    const respects = Array.isArray(savedRespects) ? savedRespects : []
    
    let newRespects
    if (isRespected) {
      newRespects = respects.filter(r => r !== pulseId)
      setPulse(prev => prev ? { ...prev, respectCount: Math.max(0, prev.respectCount - 1) } : null)
    } else {
      newRespects = [...respects, pulseId]
      setPulse(prev => prev ? { ...prev, respectCount: prev.respectCount + 1 } : null)
    }
    
    safeSetItem('divepulse_respects', newRespects)
    setIsRespected(!isRespected)
  }

  const handleOpenComments = () => {
    setShowComments(true)
  }

  const handleCloseComments = () => {
    const savedComments = safeGetItem(`divepulse_comments_${id}`, null)
    setCommentCount(Array.isArray(savedComments) ? savedComments.length : 0)
    setShowComments(false)
  }

  if (!pulse) {
    return (
      <div className="pulse-detail">
        <div className="detail-loading font-mono">LOADING...</div>
      </div>
    )
  }

  return (
    <div className="pulse-detail">
      {/* Top Navigation */}
      <div className="detail-nav">
        <button className="nav-back" onClick={() => navigate(-1)}>
          ←
        </button>
        <div className="nav-title">
          <span className="nav-location font-sans">{pulse.location}</span>
          <span className="nav-country font-mono">{pulse.country}</span>
        </div>
        <div className="nav-placeholder" />
      </div>

      {/* Media Section */}
      <div className="detail-media">
        <img 
          src={pulse.image} 
          alt={pulse.location}
          className="detail-image"
        />
        {pulse.tags && pulse.tags.length > 0 && (
          <div className="media-tags">
            {pulse.tags.map(tag => (
              <span key={tag} className="media-tag font-sans">{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* Stats Bar */}
      <div className="stats-bar font-mono">
        <div className="stat-item">
          <span className="stat-label">能见度</span>
          <span className="stat-value">{pulse.visibility}m</span>
        </div>
        <div className="stat-divider">|</div>
        <div className="stat-item">
          <span className="stat-label">流速</span>
          <span className="stat-value">{pulse.flow}</span>
        </div>
        <div className="stat-divider">|</div>
        <div className="stat-item">
          <span className="stat-label">水温</span>
          <span className="stat-value">{pulse.temp}°C</span>
        </div>
      </div>

      {/* Content Section */}
      <div className="detail-content">
        <h1 className="content-title font-sans">{pulse.title}</h1>
        
        <div className="content-coords font-mono">
          LOC: {pulse.coordinates}
        </div>

        <div className="content-location font-mono">
          <span className="location-icon">◎</span>
          {pulse.fullLocation}
        </div>

        <div className="content-story font-sans">
          {pulse.story}
        </div>

        {pulse.note && (
          <blockquote className="content-blockquote font-sans">
            {pulse.note}
          </blockquote>
        )}
      </div>

      {/* Creator Info */}
      <div className="creator-info font-mono">
        <span className="creator-label">发布者</span>
        <span className="creator-uid">{pulse.isAnonymous ? 'Anonymous' : pulse.uid}</span>
        <span className="creator-time">{pulse.time} 前</span>
      </div>

      {/* Social Bar */}
      <div className="social-bar">
        <button 
          className={`social-btn respect ${isRespected ? 'active' : ''}`}
          onClick={handleRespect}
          aria-label={isRespected ? '取消Like' : 'Like'}
        >
          <svg className="heart-icon" viewBox="0 0 24 24" fill={isRespected ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
          <span className="social-count">Like {pulse.respectCount}</span>
        </button>
        
        <button 
          className="social-btn comment"
          onClick={handleOpenComments}
        >
          <svg className="comment-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
          </svg>
          <span className="social-count">{commentCount}</span>
        </button>
      </div>

      {/* Accessibility */}
      <div className="sr-only">
        详情页：{pulse.title}，地点：{pulse.fullLocation}，
        能见度：{pulse.visibility}米，流速：{pulse.flow}，水温：{pulse.temp}摄氏度，
        获得{pulse.respectCount}次Like，{commentCount}条评论
      </div>

      {/* Comment Drawer */}
      {showComments && (
        <CommentDrawer
          pulseId={parseInt(id, 10) || 1}
          isOpen={showComments}
          onClose={handleCloseComments}
          pulseCreatorUid={pulse.uid}
          isAnonymous={pulse.isAnonymous}
        />
      )}
    </div>
  )
}
