import { useState, useEffect, createContext, useContext } from 'react'
import { Routes, Route } from 'react-router-dom'
import Splash from './pages/Splash'
import Login from './pages/Login'
import PulseFeed from './pages/PulseFeed'
import PulseDetail from './pages/PulseDetail'
import MatchHub from './pages/MatchHub'
import MatchCreate from './pages/MatchCreate'
import PostPage from './pages/PostPage'
import Chat from './pages/Chat'
import TagSearch from './pages/TagSearch'
import Profile from './pages/Profile'
import BottomNav from './components/BottomNav'
import IntentPicker from './components/IntentPicker'
import { safeGetItem, safeSetItem, safeRemoveItem } from './utils/safeStorage'
import './App.css'

export const AuthContext = createContext({
  user: null,
  login: () => {},
  logout: () => {}
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    console.warn('[useAuth] AuthContext not found, returning default values')
    return { user: null, login: () => {}, logout: () => {} }
  }
  return context
}

function App() {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showSplash, setShowSplash] = useState(true)
  const [showIntentPicker, setShowIntentPicker] = useState(false)

  useEffect(() => {
    // 安全读取用户数据
    const savedUser = safeGetItem('divepulse_user', null)
    if (savedUser && savedUser.uid && savedUser.email) {
      setUser(savedUser)
    }
    
    const timer = setTimeout(() => {
      setShowSplash(false)
      setIsLoading(false)
    }, 800)
    
    return () => clearTimeout(timer)
  }, [])

  const login = (email) => {
    if (!email || typeof email !== 'string') {
      console.error('[login] Invalid email:', email)
      return
    }
    
    const uid = `DP-${Math.floor(1000 + Math.random() * 9000)}`
    const newUser = { uid, email, token: `tok_${Date.now()}` }
    
    safeSetItem('divepulse_user', newUser)
    setUser(newUser)
  }

  const logout = () => {
    safeRemoveItem('divepulse_user')
    setUser(null)
  }

  if (showSplash) {
    return <Splash user={user} />
  }

  if (!isLoading && !user) {
    return <Login onLogin={login} />
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <div className="app">
        <main className="main-content">
          <Routes>
            <Route path="/" element={<PulseFeed />} />
            <Route path="/pulse/:id" element={<PulseDetail />} />
            <Route path="/match" element={<MatchHub />} />
            <Route path="/match/create" element={<MatchCreate />} />
            <Route path="/post" element={<PostPage />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/tag/:tag" element={<TagSearch />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>
        <BottomNav onPostClick={() => setShowIntentPicker(true)} />
        <IntentPicker isOpen={showIntentPicker} onClose={() => setShowIntentPicker(false)} />
      </div>
    </AuthContext.Provider>
  )
}

export default App
