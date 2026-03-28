import { useState, useEffect } from 'react'
import { useAuth } from '../App'
import { safeGetItem, safeSetItem } from '../utils/safeStorage'
import './CommentDrawer.css'

export default function CommentDrawer({ pulseId, isOpen, onClose, pulseCreatorUid, isAnonymous }) {
  const { user } = useAuth()
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')

  useEffect(() => {
    const savedComments = safeGetItem(`divepulse_comments_${pulseId}`, [])
    if (Array.isArray(savedComments)) {
      setComments(savedComments)
    }
  }, [pulseId])

  const handlePost = () => {
    if (!newComment.trim()) return
    
    const comment = {
      id: Date.now(),
      pulseId,
      uid: user?.uid || 'GUEST',
      content: newComment.trim().slice(0, 100),
      createdAt: new Date().toISOString()
    }

    const updatedComments = [comment, ...comments]
    setComments(updatedComments)
    safeSetItem(`divepulse_comments_${pulseId}`, updatedComments)
    setNewComment('')
  }

  const handleDelete = (commentId) => {
    const comment = comments.find(c => c.id === commentId)
    if (!comment) return
    
    const canDelete = user?.uid === comment.uid || user?.uid === pulseCreatorUid
    if (!canDelete) return

    const updatedComments = comments.filter(c => c.id !== commentId)
    setComments(updatedComments)
    safeSetItem(`divepulse_comments_${pulseId}`, updatedComments)
  }

  const formatTime = (isoString) => {
    try {
      const date = new Date(isoString)
      if (isNaN(date.getTime())) return '?'
      
      const now = new Date()
      const diff = Math.floor((now - date) / 1000)
      
      if (diff < 60) return `${diff}s`
      if (diff < 3600) return `${Math.floor(diff / 60)}m`
      if (diff < 86400) return `${Math.floor(diff / 3600)}h`
      return `${Math.floor(diff / 86400)}d`
    } catch (e) {
      return '?'
    }
  }

  const getNickname = (uid) => {
    const savedNickname = safeGetItem('divepulse_nickname', null)
    return savedNickname || uid || 'GUEST'
  }

  if (!isOpen) return null

  return (
    <>
      <div className="comment-overlay" onClick={onClose} />
      <div className="comment-drawer">
        {/* Header */}
        <div className="comment-header">
          <span className="comment-title font-mono">COMMENTS ({comments.length})</span>
          <button className="comment-close font-mono" onClick={onClose}>×</button>
        </div>

        {/* Comment List */}
        <div className="comment-list">
          {comments.length === 0 ? (
            <div className="comment-empty font-mono">
              暂无评论<br />
              <span>添加补充情报...</span>
            </div>
          ) : (
            comments.map(comment => (
              <div key={comment.id} className="comment-item">
                <div className="comment-meta">
                  <span className="comment-author font-mono">
                    {getNickname(comment.uid)}
                    {comment.uid === pulseCreatorUid && (
                      <span className="author-op">OP</span>
                    )}
                    <span className="author-uid">({comment.uid || 'GUEST'})</span>
                  </span>
                  <span className="comment-time font-mono">{formatTime(comment.createdAt)}</span>
                </div>
                <div className="comment-content font-sans">{comment.content}</div>
                {(user?.uid === comment.uid || user?.uid === pulseCreatorUid) && (
                  <button 
                    className="comment-delete font-mono"
                    onClick={() => handleDelete(comment.id)}
                  >
                    DELETE
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Input Bar */}
        <div className="comment-input-bar">
          <input
            type="text"
            className="comment-input font-sans"
            placeholder="ADD SUPPLEMENTARY INFO..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value.slice(0, 100))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newComment.trim()) handlePost()
            }}
          />
          <button 
            className={`comment-post font-mono ${newComment.trim() ? 'ready' : ''}`}
            onClick={handlePost}
            disabled={!newComment.trim()}
          >
            POST
          </button>
        </div>
      </div>
    </>
  )
}
