import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../App'
import { FLOW_LABELS, LOCATION_SUGGESTIONS, PRESET_TAGS } from '../utils/constants'
import FlowSelect from '../components/FlowSelect'
import '../components/FlowSelect.css'
import './PostPulse.css'

export default function PostPulse() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [media, setMedia] = useState(null)
  const [mediaPreview, setMediaPreview] = useState(null)
  const [location, setLocation] = useState('')
  const [locationInput, setLocationInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [visibility, setVisibility] = useState('')
  const [flow, setFlow] = useState('None')
  const [temp, setTemp] = useState('')
  const [selectedTags, setSelectedTags] = useState([])
  const [customTag, setCustomTag] = useState('')
  const [showTagInput, setShowTagInput] = useState(false)
  const [note, setNote] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Filter suggestions based on input
  const getFilteredSuggestions = (input) => {
    if (!input) return LOCATION_SUGGESTIONS.slice(0, 5)
    const lower = input.toLowerCase()
    return LOCATION_SUGGESTIONS.filter(s =>
      s.name.toLowerCase().includes(lower) ||
      s.display.toLowerCase().includes(lower) ||
      s.country.toLowerCase().includes(lower)
    ).slice(0, 8)
  }

  const filteredSuggestions = getFilteredSuggestions(locationInput)

  const filteredCustomTags = PRESET_TAGS.filter(t =>
    !selectedTags.includes(t) && t.toLowerCase().includes(customTag.toLowerCase())
  )

  const handleMediaUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        return
      }
      setMedia(file)
      const reader = new FileReader()
      reader.onload = (ev) => {
        setMediaPreview(ev.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveMedia = () => {
    setMedia(null)
    setMediaPreview(null)
  }

  const handleLocationSelect = (spot) => {
    setLocation(spot.display)
    setLocationInput(spot.display)
    setShowSuggestions(false)
  }

  const handleLocationInput = (e) => {
    const value = e.target.value
    setLocationInput(value)
    setLocation(value)
    setShowSuggestions(true)
  }

  const handleLocationBlur = () => {
    setTimeout(() => setShowSuggestions(false), 200)
  }

  const handleCustomLocationConfirm = () => {
    setLocation(locationInput)
    setShowSuggestions(false)
  }

  const handleTagToggle = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag))
    } else if (selectedTags.length < 5) {
      setSelectedTags([...selectedTags, tag])
    }
  }

  const handleAddCustomTag = () => {
    if (customTag.trim() && selectedTags.length < 5) {
      const newTag = customTag.trim().slice(0, 20)
      if (!selectedTags.includes(newTag)) {
        setSelectedTags([...selectedTags, newTag])
      }
      setCustomTag('')
      setShowTagInput(false)
    }
  }

  const handleSubmit = () => {
    if (!location) return

    setIsSubmitting(true)

    setTimeout(() => {
      const newPulse = {
        id: Date.now(),
        location,
        visibility: visibility || 0,
        flow,
        temp: temp || 0,
        time: '0m',
        image: mediaPreview || null,
        weight: 48,
        geoHash: 'NEW',
        respectCount: 0,
        uid: user?.uid || 'DP-0000',
        isAnonymous,
        note,
        tags: selectedTags
      }

      const savedPulses = localStorage.getItem('divepulse_new_pulses')
      const pulses = savedPulses ? JSON.parse(savedPulses) : []
      pulses.unshift(newPulse)
      localStorage.setItem('divepulse_new_pulses', JSON.stringify(pulses))

      setIsSubmitting(false)
      navigate('/')
    }, 500)
  }

  const isFormValid = location.length > 0

  return (
    <div className="post-pulse">
      {/* Header */}
      <div className="post-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← 返回
        </button>
        <span className="post-title font-mono">发布情报</span>
        <button
          className={`submit-btn font-mono ${isFormValid ? 'ready' : ''}`}
          onClick={handleSubmit}
          disabled={!isFormValid || isSubmitting}
        >
          {isSubmitting ? '...' : 'SUBMIT'}
        </button>
      </div>

      {/* Form Content */}
      <div className="post-content">
        {/* Media Upload */}
        <div className="media-section">
          {mediaPreview ? (
            <div className="media-preview">
              <img src={mediaPreview} alt="Preview" className="preview-image" />
              <button className="remove-media" onClick={handleRemoveMedia}>
                ×
              </button>
            </div>
          ) : (
            <label className="media-upload">
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleMediaUpload}
                className="media-input"
              />
              <div className="upload-placeholder">
                <span className="upload-icon">+</span>
                <span className="upload-text font-mono">添加照片（可选）</span>
                <span className="upload-hint font-mono">4:3 或 1:1，支持 JPG/PNG</span>
              </div>
            </label>
          )}
        </div>

        {/* Location */}
        <div className="input-section">
          <label className="input-label font-mono">地点</label>
          <div className="location-input-wrapper">
            <input
              type="text"
              className="location-input font-sans"
              placeholder="输入地点..."
              value={locationInput}
              onChange={handleLocationInput}
              onFocus={() => setShowSuggestions(true)}
              onBlur={handleLocationBlur}
            />
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div className="suggestions-drawer">
                <div className="suggestions-header font-mono">推荐潜点</div>
                {filteredSuggestions.map((spot, i) => (
                  <button
                    key={i}
                    className="suggestion-item"
                    onClick={() => handleLocationSelect(spot)}
                  >
                    <span className="suggestion-country font-mono">{spot.country}</span>
                    <span className="suggestion-name font-sans">{spot.display}</span>
                  </button>
                ))}
                {locationInput && !filteredSuggestions.some(s => s.display.toLowerCase() === locationInput.toLowerCase()) && (
                  <button
                    className="suggestion-item custom-item"
                    onClick={handleCustomLocationConfirm}
                  >
                    <span className="suggestion-label font-mono">+ 自定义</span>
                    <span className="suggestion-name font-sans">{locationInput}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="input-section">
          <label className="input-label font-mono">环境指标 (可选)</label>
          <div className="stats-grid">
            <div className="stat-input">
              <span className="stat-letter font-mono">V</span>
              <input
                type="number"
                className="stat-field font-mono"
                placeholder="能见度"
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
              />
              <span className="stat-unit font-mono">m</span>
            </div>
            <div className="stat-input flow-select">
              <span className="stat-letter font-mono">水流强度</span>
              <FlowSelect value={flow} onChange={setFlow} placeholder="水流强度" />
            </div>
            <div className="stat-input">
              <span className="stat-letter font-mono">T</span>
              <input
                type="number"
                className="stat-field font-mono"
                placeholder="水温"
                value={temp}
                onChange={(e) => setTemp(e.target.value)}
              />
              <span className="stat-unit font-mono">°C</span>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="input-section">
          <label className="input-label font-mono">
            目击标签 (可选) 
            <span className="char-count font-mono">{selectedTags.length}/5</span>
          </label>
          <div className="tags-container">
            {/* Preset Tags */}
            {PRESET_TAGS.slice(0, 8).map(tag => (
              <button
                key={tag}
                className={`tag-btn ${selectedTags.includes(tag) ? 'active' : ''}`}
                onClick={() => handleTagToggle(tag)}
              >
                {tag}
              </button>
            ))}
            {/* Custom Tag Input */}
            {showTagInput ? (
              <div className="custom-tag-input">
                <input
                  type="text"
                  className="custom-tag-field font-mono"
                  placeholder="输入标签"
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value.slice(0, 20))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddCustomTag()
                    if (e.key === 'Escape') setShowTagInput(false)
                  }}
                  autoFocus
                />
                <button className="custom-tag-confirm" onClick={handleAddCustomTag}>✓</button>
              </div>
            ) : (
              selectedTags.length < 5 && (
                <button className="tag-btn add-tag" onClick={() => setShowTagInput(true)}>
                  +
                </button>
              )
            )}
          </div>
          {/* Selected Tags Preview */}
          {selectedTags.length > 0 && (
            <div className="selected-tags">
              <span className="selected-label font-mono">已选:</span>
              {selectedTags.map(tag => (
                <span key={tag} className="selected-tag font-mono" onClick={() => handleTagToggle(tag)}>
                  {tag} ×
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Note */}
        <div className="input-section">
          <label className="input-label font-mono">
            备注 
            <span className="char-count font-mono">{note.length}/50</span>
          </label>
          <textarea
            className="note-input"
            placeholder="限50字以内，纯文本"
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 50))}
            rows={3}
          />
        </div>

        {/* Anonymous Toggle */}
        <div className="anonymous-section">
          <span className="anonymous-label font-mono">
            {isAnonymous ? 'Anonymous' : user?.uid || 'DP-0000'}
          </span>
          <button
            className={`anonymous-toggle ${isAnonymous ? 'active' : ''}`}
            onClick={() => setIsAnonymous(!isAnonymous)}
          >
            <span className="toggle-track">
              <span className="toggle-thumb" />
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
