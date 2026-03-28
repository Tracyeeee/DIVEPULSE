import { NavLink } from 'react-router-dom'
import './BottomNav.css'

export default function BottomNav({ onPostClick }) {
  return (
    <nav className="bottom-nav">
      <NavLink to="/" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
        <span className="nav-icon">◎</span>
        <span className="nav-label">PULSE</span>
      </NavLink>
      
      <NavLink to="/match" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
        <span className="nav-icon">⊞</span>
        <span className="nav-label">MATCH</span>
      </NavLink>
      
      <button className="nav-item post-btn" onClick={onPostClick}>
        <span className="post-icon">+</span>
      </button>
      
      <NavLink to="/chat" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
        <span className="nav-icon">◻</span>
        <span className="nav-label">CHAT</span>
      </NavLink>
      
      <NavLink to="/profile" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
        <span className="nav-icon">◯</span>
        <span className="nav-label">ME</span>
      </NavLink>
    </nav>
  )
}
