import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { safeGetItem, safeSetItem } from '../utils/safeStorage'
import './PostPage.css'

const PRESET_TAGS = ['鲸鲨', 'Manta', '海龟', '虎鲸', '珊瑚', '鲨鱼', '章鱼', '水母', '珊瑚礁']

const FAMOUS_SPOTS = [
  { name: '仙本那', country: 'MY', display: '马来西亚 - 仙本那' },
  { name: '四王群岛', country: 'ID', display: '印尼 - 四王群岛' },
  { name: '妈妈拍丝瓜岛', country: 'PH', display: '菲律宾 - 妈妈拍丝瓜岛' },
  { name: '红海', country: 'EG', display: '埃及 - 红海' },
  { name: '长滩岛', country: 'PH', display: '菲律宾 - 长滩岛' },
  { name: '斯米兰', country: 'TH', display: '泰国 - 斯米兰' },
  { name: '马尔代夫', country: 'MV', display: '马尔代夫' },
  { name: '帕劳', country: 'PW', display: '帕劳' },
  { name: '大堡礁', country: 'AU', display: '澳大利亚 - 大堡礁' },
  { name: '科隆', country: 'PH', display: '菲律宾 - 科隆' },
  { name: '薄荷岛', country: 'PH', display: '菲律宾 - 薄荷岛' },
  { name: '巴厘岛', country: 'ID', display: '印尼 - 巴厘岛' },
  { name: '冲绳', country: 'JP', display: '日本 - 冲绳' },
  { name: '刁曼岛', country: 'MY', display: '马来西亚 - 刁曼岛' },
]

export default function PostPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    location: '',
    country: '',
    date: new Date().toISOString().split('T')[0],
    visibility: '',
    flow: 'Light',
    temp: '',
    content: '',
    tags: [],
    images: []
  })
  const [customTag, setCustomTag] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showLocationDropdown, setShowLocationDropdown] = useState(false)
  const [locationInput, setLocationInput] = useState('')

  const getFilteredSpots = (input) => {
    if (!input) return FAMOUS_SPOTS.slice(0, 5)
    const lower = input.toLowerCase()
    return FAMOUS_SPOTS.filter(spot =>
      spot.name.toLowerCase().includes(lower) ||
      spot.display.toLowerCase().includes(lower) ||
      spot.country.toLowerCase().includes(lower)
    ).slice(0, 8)
  }

  const filteredSpots = getFilteredSpots(locationInput)

  const handleLocationInput = (e) => {
    const value = e.target.value
    setLocationInput(value)
    setShowLocationDropdown(true)
    const matchedSpot = FAMOUS_SPOTS.find(spot =>
      spot.name.toLowerCase().includes(value.toLowerCase()) ||
      spot.display.toLowerCase().includes(value.toLowerCase())
    )
    if (matchedSpot) {
      setFormData({
        ...formData,
        location: matchedSpot.name,
        country: matchedSpot.country
      })
    } else {
      setFormData({
        ...formData,
        location: value,
        country: ''
      })
    }
  }

  const handleSpotSelect = (spot) => {
    setLocationInput(spot.display)
    setFormData({
      ...formData,
      location: spot.name,
      country: spot.country
    })
    setShowLocationDropdown(false)
  }

  const handleLocationBlur = () => {
    setTimeout(() => setShowLocationDropdown(false), 200)
  }

  const handleCustomLocationConfirm = () => {
    setFormData({
      ...formData,
      location: locationInput,
      country: ''
    })
    setShowLocationDropdown(false)
  }

  const handleSubmit = () => {
    // 验证必填字段
    if (!formData.location || !formData.temp) {
      alert('请填写位置和水温')
      return
    }

    const userData = safeGetItem('divepulse_user', null)
    
    const newPulse = {
      id: Date.now(),
      location: formData.location,
      country: formData.country,
      fullLocation: `${formData.country} - ${formData.location}`,
      coordinates: 'TBD',
      visibility: parseInt(formData.visibility, 10) || 0,
      flow: formData.flow,
      temp: parseInt(formData.temp, 10) || 0,
      time: getRelativeTime(formData.date),
      image: formData.images[0] || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=800&fit=crop',
      weight: 50,
      geoHash: 'XX.XX',
      respectCount: 0,
      uid: userData?.uid || 'GUEST',
      isAnonymous: false,
      tags: formData.tags,
      title: formData.content.slice(0, 50) || 'New Pulse',
      story: formData.content,
      note: null
    }

    const savedPulses = safeGetItem('divepulse_new_pulses', [])
    const existingPulses = Array.isArray(savedPulses) ? savedPulses : []
    safeSetItem('divepulse_new_pulses', [newPulse, ...existingPulses])

    navigate('/')
  }

  const getRelativeTime = (dateStr) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now - date
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return '1d'
    if (diffDays < 7) return `${diffDays}d`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w`
    return `${Math.floor(diffDays / 30)}m`
  }

  const toggleTag = (tag) => {
    if (formData.tags.includes(tag)) {
      setFormData({...formData, tags: formData.tags.filter(t => t !== tag)})
    } else {
      setFormData({...formData, tags: [...formData.tags, tag]})
    }
  }

  const addCustomTag = () => {
    if (customTag.trim() && !formData.tags.includes(customTag.trim())) {
      setFormData({...formData, tags: [...formData.tags, customTag.trim()]})
      setCustomTag('')
    }
  }

  return (
    <div className="post-page">
      {/* Header */}
      <div className="post-header">
        <button className="post-back" onClick={() => navigate(-1)}>←</button>
        <span className="post-title font-mono">POST PULSE</span>
        <button className="post-submit font-mono" onClick={handleSubmit}>POST</button>
      </div>

      {/* Form */}
      <div className="post-form">
        {/* Location Selector */}
        <div className="form-section">
          <label className="section-label font-mono">LOCATION</label>
          <div className="location-selector-wrapper">
            <div className="location-input-row">
              <input
                type="text"
                className="location-selector-input"
                placeholder="Search Species / Location..."
                value={locationInput}
                onChange={handleLocationInput}
                onFocus={() => setShowLocationDropdown(true)}
                onBlur={handleLocationBlur}
              />
            </div>

            {showLocationDropdown && (
              <div className="location-dropdown">
                {filteredSpots.length > 0 && (
                  <div className="dropdown-section">
                    <div className="dropdown-label font-mono">推荐潜点</div>
                    {filteredSpots.map((spot, index) => (
                      <button
                        key={index}
                        className="dropdown-item"
                        onClick={() => handleSpotSelect(spot)}
                      >
                        <span className="item-country font-mono">{spot.country}</span>
                        <span className="item-name font-sans">{spot.display}</span>
                      </button>
                    ))}
                  </div>
                )}

                {locationInput && !FAMOUS_SPOTS.some(spot => spot.display.toLowerCase() === locationInput.toLowerCase()) && (
                  <div className="dropdown-section">
                    <button
                      className="dropdown-item custom-location"
                      onClick={handleCustomLocationConfirm}
                    >
                      <span className="item-label font-mono">+ 自定义地点</span>
                      <span className="item-name font-sans">{locationInput}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Date */}
        <div className="form-section">
          <div className="date-selector">
            <span className="date-label font-mono">DATE</span>
            <button 
              className="date-value font-mono"
              onClick={() => setShowDatePicker(!showDatePicker)}
            >
              {formData.date === new Date().toISOString().split('T')[0] ? 'Today' : formData.date}
            </button>
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

        {/* Stats */}
        <div className="form-section">
          <div className="form-stats">
            <div className="stat-input">
              <label className="stat-label font-mono">V</label>
              <input
                type="number"
                className="stat-field font-mono"
                placeholder="0"
                value={formData.visibility}
                onChange={e => setFormData({...formData, visibility: e.target.value})}
              />
              <span className="stat-unit font-mono">m</span>
            </div>
            <div className="stat-input">
              <label className="stat-label font-mono">F</label>
              <select
                className="stat-field font-mono"
                value={formData.flow}
                onChange={e => setFormData({...formData, flow: e.target.value})}
              >
                <option value="Light">Light</option>
                <option value="Moderate">Moderate</option>
                <option value="Strong">Strong</option>
              </select>
            </div>
            <div className="stat-input">
              <label className="stat-label font-mono">T</label>
              <input
                type="number"
                className="stat-field font-mono"
                placeholder="0"
                value={formData.temp}
                onChange={e => setFormData({...formData, temp: e.target.value})}
              />
              <span className="stat-unit font-mono">°C</span>
            </div>
          </div>
        </div>

        {/* Sighting Tags */}
        <div className="form-section">
          <div className="section-label font-mono">SIGHTING TAGS</div>
          <div className="preset-tags">
            {PRESET_TAGS.map(tag => (
              <button
                key={tag}
                className={`preset-tag ${formData.tags.includes(tag) ? 'active' : ''}`}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
          <div className="custom-tag-input">
            <input
              type="text"
              className="tag-input"
              placeholder="+ ADD CUSTOM TAG"
              value={customTag}
              onChange={e => setCustomTag(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCustomTag()}
            />
          </div>
          {formData.tags.length > 0 && (
            <div className="selected-tags">
              {formData.tags.map(tag => (
                <span 
                  key={tag} 
                  className="selected-tag"
                  onClick={() => toggleTag(tag)}
                >
                  {tag} ×
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="form-section">
          <textarea
            className="form-textarea"
            placeholder="WRITE YOUR STORY..."
            value={formData.content}
            onChange={e => setFormData({...formData, content: e.target.value})}
            rows={6}
          />
        </div>
      </div>
    </div>
  )
}
