import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './MatchCreate.css'

export default function MatchCreatePage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
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

  const handleSubmit = () => {
    const newMatch = {
      id: Date.now(),
      location: formData.location,
      country: formData.country,
      fullLocation: `${formData.country} - ${formData.location}`,
      date: formData.date,
      timeSlot: formData.timeSlot,
      crewCount: formData.crewCount,
      fee: formData.fee,
      feeNote: formData.feeNote,
      description: formData.description,
      certification: formData.certification,
      experience: formData.experience,
      requirements: formData.requirements,
      createdAt: new Date().toISOString(),
      creatorUid: localStorage.getItem('divepulse_user') ? JSON.parse(localStorage.getItem('divepulse_user')).uid : 'GUEST',
      status: 'open',
      applicants: []
    }

    const savedMatches = localStorage.getItem('divepulse_matches')
    const existingMatches = savedMatches ? JSON.parse(savedMatches) : []
    localStorage.setItem('divepulse_matches', JSON.stringify([newMatch, ...existingMatches]))

    navigate('/match')
  }

  const toggleRequirement = (req) => {
    if (formData.requirements.includes(req)) {
      setFormData({...formData, requirements: formData.requirements.filter(r => r !== req)})
    } else {
      setFormData({...formData, requirements: [...formData.requirements, req]})
    }
  }

  return (
    <div className="match-create-page">
      {/* Header */}
      <div className="match-header">
        <button className="match-back" onClick={() => navigate(-1)}>←</button>
        <span className="match-title font-mono">CREATE MATCH</span>
        <button className="match-submit font-mono" onClick={handleSubmit}>POST</button>
      </div>

      {/* Form */}
      <div className="match-form">
        {/* Location */}
        <div className="form-section">
          <div className="section-label font-mono">DESTINATION</div>
          <div className="form-row">
            <input
              type="text"
              className="form-input"
              placeholder="LOCATION NAME"
              value={formData.location}
              onChange={e => setFormData({...formData, location: e.target.value})}
            />
            <input
              type="text"
              className="form-input country-input"
              placeholder="XX"
              maxLength={2}
              value={formData.country}
              onChange={e => setFormData({...formData, country: e.target.value.toUpperCase()})}
            />
          </div>
        </div>

        {/* Time */}
        <div className="form-section">
          <div className="section-label font-mono">DATE & TIME</div>
          <div className="time-row">
            <button 
              className={`time-type-btn ${formData.dateType === 'date' ? 'active' : ''}`}
              onClick={() => setFormData({...formData, dateType: 'date'})}
            >
              SPECIFIC DATE
            </button>
            <button 
              className={`time-type-btn ${formData.dateType === 'period' ? 'active' : ''}`}
              onClick={() => setFormData({...formData, dateType: 'period'})}
            >
              TIME PERIOD
            </button>
          </div>
          <div className="date-input-row">
            <button 
              className="date-value font-mono"
              onClick={() => setShowDatePicker(!showDatePicker)}
            >
              {formData.date || 'SELECT DATE'}
            </button>
            {formData.dateType === 'period' && (
              <input
                type="text"
                className="form-input time-slot"
                placeholder="e.g. Late April"
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
          <div className="section-label font-mono">CREW SIZE</div>
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
          <div className="crew-hint font-mono">LOOKING FOR {formData.crewCount} DIVERS</div>
        </div>

        {/* Fee */}
        <div className="form-section">
          <div className="section-label font-mono">FEE SPLIT</div>
          <input
            type="text"
            className="form-input"
            placeholder="$ ESTIMATED COST PER PERSON"
            value={formData.fee}
            onChange={e => setFormData({...formData, fee: e.target.value})}
          />
          <input
            type="text"
            className="form-input"
            placeholder="FEE NOTES (OPTIONAL)"
            value={formData.feeNote}
            onChange={e => setFormData({...formData, feeNote: e.target.value})}
            style={{ marginTop: 'var(--space-sm)' }}
          />
        </div>

        {/* Requirements */}
        <div className="form-section">
          <div className="section-label font-mono">REQUIREMENTS</div>
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
          <div className="section-label font-mono">DESCRIPTION</div>
          <textarea
            className="form-textarea"
            placeholder="SHARE YOUR DIVE PLAN..."
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
            rows={5}
          />
        </div>
      </div>
    </div>
  )
}
