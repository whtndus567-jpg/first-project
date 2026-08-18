import React, { useState, useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'

// 상대 시간 변환 유틸 함수
function formatRelativeTime(dateString) {
  if (!dateString) return ''
  const now = new Date()
  const past = new Date(dateString)
  const diffInSeconds = Math.floor((now - past) / 1000)

  if (diffInSeconds < 60) return '방금 전'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}일 전`
  return past.toLocaleDateString()
}

// 작성자 본인 여부 확인 헬퍼 함수
const isMyItem = (item, user) => {
  if (!user || !item) return false
  const myId = String(user.id || user._id)
  const authorId = String(
    item.author_id || 
    item.userId || 
    item.user_id || 
    item.author?.id || 
    item.author?._id || 
    ''
  )
  return authorId === myId
}

export default function App() {
  const [posts, setPosts] = useState([])
  const [user, setUser] = useState(null)
  
  // 모달 상태
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false)
  const [selectedPost, setSelectedPost] = useState(null) 
  const [editingPostId, setEditingPostId] = useState(null) 
  
  // 글쓰기 폼 상태 (목록용)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isNotice, setIsNotice] = useState(false)

  // 상세보기 모달 내부 직접 수정용 상태
  const [isEditingInDetail, setIsEditingInDetail] = useState(false)
  const [detailEditTitle, setDetailEditTitle] = useState('')
  const [detailEditContent, setDetailEditContent] = useState('')
  const [detailEditIsNotice, setDetailEditIsNotice] = useState(false)

  // 댓글/대댓글 상태
  const [commentText, setCommentText] = useState('') 
  const [replyText, setReplyText] = useState('')          
  const [replyToId, setReplyToId] = useState(null)

  // 댓글 수정 상태
  const [editingCommentId, setEditingCommentId] = useState(null)
  const [editingCommentText, setEditingCommentText] = useState('')

  const navigate = useNavigate()

  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (e) {
        localStorage.removeItem('user')
      }
    }
    fetchPosts()
  }, [])

  // 게시글 목록 불러오기
  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/posts')
      if (res.ok) {
        const data = await res.json()
        const sortedData = data.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
        setPosts(sortedData)
      }
    } catch (err) {
      console.error('게시글 불러오기 실패:', err)
    }
  }

  // 로그아웃 처리
  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    alert('로그아웃 되었습니다.')
  }

  // 글쓰기 버튼 클릭
  const handleWriteClick = () => {
    if (!user) {
      alert('로그인이 필요한 기능입니다.')
      navigate('/login')
    } else {
      setEditingPostId(null)
      setTitle('')
      setContent('')
      setIsNotice(false)
      setIsWriteModalOpen(true)
    }
  }

  // 게시글 클릭 (상세보기 및 조회수 증가)
  const handlePostClick = async (post) => {
    const token = localStorage.getItem('token')
    if (!token) {
      alert('로그인이 필요합니다.')
      navigate('/login')
      return
    }

    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (res.ok) {
        const fullData = await res.json()
        setSelectedPost(fullData)
        setIsEditingInDetail(false) 
        fetchPosts()
      } else {
        alert('게시글 상세 정보를 불러오지 못했습니다.')
      }
    } catch (e) {
      alert('상세 정보를 불러오는 중 오류가 발생했습니다.')
    }
  }

  // 게시글 작성 또는 수정 제출
  const handleSubmitPost = async (e) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) {
      return alert('제목과 내용을 모두 입력해 주세요.')
    }

    const token = localStorage.getItem('token')
    const url = editingPostId ? `/api/posts/${editingPostId}` : '/api/posts'
    const method = editingPostId ? 'PUT' : 'POST'

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          title, 
          content, 
          is_notice: isNotice,
          isNotice: isNotice 
        }),
      })

      if (res.ok) {
        alert(editingPostId ? '게시글이 수정되었습니다!' : '게시글이 성공적으로 등록되었습니다!')
        setTitle('')
        setContent('')
        setIsNotice(false)
        setEditingPostId(null)
        setIsWriteModalOpen(false)
        fetchPosts()
        
        if (editingPostId && selectedPost) {
          const updatedRes = await fetch(`/api/posts/${editingPostId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          if (updatedRes.ok) {
            setSelectedPost(await updatedRes.json())
          }
        }
      } else {
        const rawError = await res.text()
        alert(`[에러 발생]\n\n${rawError.slice(0, 300)}`)
      }
    } catch (err) {
      alert('게시글 처리 중 네트워크 오류가 발생했습니다.')
    }
  }

  // 상세보기 창 안에서 직접 수정 저장 요청
  const handleUpdateInDetail = async () => {
    if (!detailEditTitle.trim() || !detailEditContent.trim()) {
      return alert('제목과 내용을 모두 입력해 주세요.')
    }

    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`/api/posts/${selectedPost.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          title: detailEditTitle, 
          content: detailEditContent,
          is_notice: detailEditIsNotice,
          isNotice: detailEditIsNotice
        })
      })

      if (res.ok) {
        const updatedPost = await res.json()
        setSelectedPost(updatedPost)
        setIsEditingInDetail(false)
        fetchPosts()
        alert('게시글이 수정되었습니다!')
      } else {
        alert('게시글 수정에 실패했습니다.')
      }
    } catch (err) {
      alert('네트워크 오류가 발생했습니다.')
    }
  }

  // 게시글 삭제
  const handleDeletePost = async (postId) => {
    if (!window.confirm('정말 이 게시글을 삭제하시겠습니까?')) return

    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (res.ok) {
        alert('게시글이 삭제되었습니다.')
        setSelectedPost(null)
        setIsEditingInDetail(false)
        fetchPosts()
      } else {
        alert('게시글 삭제에 실패했습니다.')
      }
    } catch (err) {
      alert('네트워크 오류가 발생했습니다.')
    }
  }

  // 좋아요 토글
  const handleToggleLike = async () => {
    const token = localStorage.getItem('token')
    if (!token) return alert('로그인이 필요합니다.')

    try {
      const res = await fetch(`/api/posts/${selectedPost.id}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (res.ok) {
        setSelectedPost(prev => ({
          ...prev,
          likes_count: (prev.likes_count || 0) + 1
        }))
        fetchPosts()
      }
    } catch (err) {
      console.error('좋아요 처리 실패:', err)
    }
  }

  // 댓글 및 대댓글 추가
  const handleAddComment = async (parentId = null) => {
    const textToSend = parentId ? replyText : commentText
    if (!textToSend.trim()) return

    const token = localStorage.getItem('token')

    try {
      const res = await fetch(`/api/posts/${selectedPost.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: textToSend,
          parent_id: parentId
        })
      })

      if (res.ok) {
        if (parentId) {
          setReplyText('')
          setReplyToId(null)
        } else {
          setCommentText('')
        }

        fetchPosts()
        
        const updatedPostRes = await fetch(`/api/posts/${selectedPost.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (updatedPostRes.ok) {
          setSelectedPost(await updatedPostRes.json())
        }
      }
    } catch (err) {
      alert('댓글 등록 중 오류가 발생했습니다.')
    }
  }

  // 댓글 수정 제출
  const handleUpdateComment = async (commentId) => {
    if (!editingCommentText.trim()) return alert('댓글 내용을 입력해주세요.')

    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: editingCommentText })
      })

      if (res.ok) {
        setEditingCommentId(null)
        setEditingCommentText('')
        
        const updatedPostRes = await fetch(`/api/posts/${selectedPost.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (updatedPostRes.ok) {
          setSelectedPost(await updatedPostRes.json())
        }
      } else {
        alert('댓글 수정에 실패했습니다.')
      }
    } catch (err) {
      alert('네트워크 오류가 발생했습니다.')
    }
  }

  // 댓글 삭제
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) return

    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (res.ok) {
        const updatedPostRes = await fetch(`/api/posts/${selectedPost.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (updatedPostRes.ok) {
          setSelectedPost(await updatedPostRes.json())
        }
        fetchPosts()
      } else {
        alert('댓글 삭제에 실패했습니다.')
      }
    } catch (err) {
      alert('오류가 발생했습니다.')
    }
  }

  // HOT 게시글 판별 헬퍼 (조회수 10 이상 OR 좋아요 5 이상)
  const isHotPost = (post) => {
    const views = post.views_count || 0
    const likes = post.likes_count || 0
    return views >= 10 || likes >= 5
  }

  // 목록 분할 분류
  const noticePosts = posts.filter(p => p.is_notice || p.isNotice)
  const hotPosts = posts.filter(p => isHotPost(p))

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* 상단 헤더 */}
      <header className="border-b border-slate-800 bg-slate-900/85 backdrop-blur sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div 
            onClick={() => navigate('/')} 
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition"
          >
            <span className="text-2xl">🚀</span>
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              ADM 사내 게시판
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleWriteClick}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-lg shadow-sm transition flex items-center gap-1.5"
            >
              <span>✏️</span> 글쓰기
            </button>

            <div className="h-4 w-[1px] bg-slate-700 mx-1"></div>

            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-indigo-300 bg-indigo-950/60 border border-indigo-800/50 px-3 py-1.5 rounded-full">
                  👤 {user.nickname} 님
                </span>
                <button
                  onClick={handleLogout}
                  className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 transition"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/login')}
                  className="text-sm text-slate-300 hover:text-white px-3 py-1.5 rounded-md hover:bg-slate-800 transition"
                >
                  로그인
                </button>
                <button
                  onClick={() => navigate('/signup')}
                  className="text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-md border border-slate-700 transition"
                >
                  회원가입
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 메인 라우트 컨텐츠 */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-6">
        <Routes>
          <Route
            path="/"
            element={
              <div className="space-y-8">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      📋 사내 게시판
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">
                      공지사항, HOT 인기글, 그리고 전체 게시글을 확인하세요.
                    </p>
                  </div>
                  <span className="text-xs font-semibold bg-indigo-900/40 text-indigo-300 border border-indigo-800/50 px-3 py-1 rounded-full">
                    총 게시글 {posts.length}개
                  </span>
                </div>

                {/* 1. 공지사항 섹션 */}
                {noticePosts.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-fuchsia-400 font-bold text-lg border-l-4 border-fuchsia-500 pl-3">
                      📢 공지사항
                    </div>
                    <div className="grid gap-3">
                      {noticePosts.map((post) => (
                        <div
                          key={post.id}
                          onClick={() => handlePostClick(post)}
                          className="bg-fuchsia-950/20 border border-fuchsia-500/70 hover:border-fuchsia-400 transition cursor-pointer rounded-xl p-5 shadow-sm relative overflow-hidden"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="bg-fuchsia-500/20 border border-fuchsia-500/50 text-fuchsia-300 text-xs font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                                [공지] 📢
                              </span>
                              <h3 className="text-lg font-bold text-slate-100 hover:text-fuchsia-300 transition">
                                {post.title}
                              </h3>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded-md">
                                {post.author_user?.nickname ? `👤 ${post.author_user.nickname}` : '익명'}
                              </span>
                              {isMyItem(post, user) && (
                                <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={() => {
                                      setEditingPostId(post.id)
                                      setTitle(post.title)
                                      setContent(post.content)
                                      setIsNotice(true)
                                      setIsWriteModalOpen(true)
                                    }}
                                    className="text-xs text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-md transition"
                                  >
                                    수정
                                  </button>
                                  <button
                                    onClick={() => handleDeletePost(post.id)}
                                    className="text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-md transition"
                                  >
                                    삭제
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          <p className="text-slate-300 text-sm mt-2 line-clamp-2">
                            {post.content}
                          </p>

                          <div className="flex items-center gap-4 mt-4 text-xs text-slate-400 border-t border-fuchsia-900/40 pt-3">
                            <span>⏱️ {formatRelativeTime(post.created_at)}</span>
                            <span>👁️ 조회수 {post.views_count || 0}</span>
                            <span>💬 댓글 {post.comments_count ?? post.comment_count ?? post.comments?.length ?? 0}</span>
                            <span>❤️ 좋아요 {post.likes_count || 0}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. HOT 게시글 섹션 */}
                {hotPosts.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-lg border-l-4 border-amber-500 pl-3">
                      🔥 HOT 인기글
                    </div>
                    <div className="grid gap-3">
                      {hotPosts.map((post) => (
                        <div
                          key={post.id}
                          onClick={() => handlePostClick(post)}
                          className="bg-amber-950/10 border border-amber-500/40 hover:border-amber-400 transition cursor-pointer rounded-xl p-5 shadow-sm"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1">
                                [HOT] 🔥
                              </span>
                              <h3 className="text-lg font-bold text-slate-100 hover:text-amber-300 transition">
                                {post.title}
                              </h3>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded-md">
                                {post.author_user?.nickname ? `👤 ${post.author_user.nickname}` : '익명'}
                              </span>
                              {isMyItem(post, user) && (
                                <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={() => {
                                      setEditingPostId(post.id)
                                      setTitle(post.title)
                                      setContent(post.content)
                                      setIsNotice(!!(post.is_notice || post.isNotice))
                                      setIsWriteModalOpen(true)
                                    }}
                                    className="text-xs text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-md transition"
                                  >
                                    수정
                                  </button>
                                  <button
                                    onClick={() => handleDeletePost(post.id)}
                                    className="text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-md transition"
                                  >
                                    삭제
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          <p className="text-slate-300 text-sm mt-2 line-clamp-2">
                            {post.content}
                          </p>

                          <div className="flex items-center gap-4 mt-4 text-xs text-slate-400 border-t border-amber-900/30 pt-3">
                            <span>⏱️ {formatRelativeTime(post.created_at)}</span>
                            <span>👁️ 조회수 {post.views_count || 0}</span>
                            <span>💬 댓글 {post.comments_count ?? post.comment_count ?? post.comments?.length ?? 0}</span>
                            <span>❤️ 좋아요 {post.likes_count || 0}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. 전체 게시글 섹션 (인디고 테두리로 색상 통일) */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-lg border-l-4 border-indigo-500 pl-3">
                    💬 전체 게시글
                  </div>
                  {posts.length === 0 ? (
                    <div className="text-center py-12 bg-slate-900/50 rounded-xl border border-slate-800 text-slate-500 text-sm">
                      등록된 게시글이 없습니다.
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {posts.map((post) => {
                        const isNoti = post.is_notice || post.isNotice
                        const isHot = isHotPost(post)
                        
                        return (
                          <div
                            key={post.id}
                            onClick={() => handlePostClick(post)}
                            className="bg-slate-900 border border-slate-800 hover:border-slate-700 transition cursor-pointer rounded-xl p-5 shadow-sm"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2 flex-wrap">
                                {isNoti && (
                                  <span className="bg-fuchsia-500/20 border border-fuchsia-500/50 text-fuchsia-300 text-xs font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1">
                                    [공지] 📢
                                  </span>
                                )}
                                {isHot && (
                                  <span className="bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-md">
                                    [HOT] 🔥
                                  </span>
                                )}
                                <h3 className="text-lg font-bold text-slate-100 hover:text-indigo-400 transition">
                                  {post.title}
                                </h3>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded-md">
                                  {post.author_user?.nickname ? `👤 ${post.author_user.nickname}` : '익명'}
                                </span>
                                {isMyItem(post, user) && (
                                  <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                                    <button
                                      onClick={() => {
                                        setEditingPostId(post.id)
                                        setTitle(post.title)
                                        setContent(post.content)
                                        setIsNotice(!!isNoti)
                                        setIsWriteModalOpen(true)
                                      }}
                                      className="text-xs text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-md transition"
                                    >
                                      수정
                                    </button>
                                    <button
                                      onClick={() => handleDeletePost(post.id)}
                                      className="text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-md transition"
                                    >
                                      삭제
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            <p className="text-slate-300 text-sm mt-2 line-clamp-2">
                              {post.content}
                            </p>

                            <div className="flex items-center gap-4 mt-4 text-xs text-slate-400 border-t border-slate-800/60 pt-3">
                              <span>⏱️ {formatRelativeTime(post.created_at)}</span>
                              <span>👁️ 조회수 {post.views_count || 0}</span>
                              <span>💬 댓글 {post.comments_count ?? post.comment_count ?? post.comments?.length ?? 0}</span>
                              <span>❤️ 좋아요 {post.likes_count || 0}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

              </div>
            }
          />

          <Route path="/login" element={<Login onLoginSuccess={(userData) => setUser(userData)} />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>
      </main>

      {/* 새 글 작성/수정 모달 */}
      {isWriteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <div className="flex justify-between items-center mb-5 border-b border-slate-800 pb-3">
              <h3 className="text-xl font-bold text-indigo-400 flex items-center gap-2">
                ✍️ {editingPostId ? '게시글 수정하기' : '새 글 작성하기'}
              </h3>
              <button
                onClick={() => setIsWriteModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg px-2 py-1 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitPost} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">제목</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="게시글 제목을 입력하세요"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              {/* 공지 여부 버튼형 토글 (핑크/푸시아 색상 적용) */}
              <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5">
                <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  📢 상단 고정 공지사항 등록
                </span>
                <button
                  type="button"
                  onClick={() => setIsNotice(!isNotice)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm ${
                    isNotice 
                      ? 'bg-fuchsia-600 hover:bg-fuchsia-500 text-white border border-fuchsia-500' 
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700'
                  }`}
                >
                  {isNotice ? '공지 적용됨 (ON)' : '일반 글 (OFF)'}
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">내용</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="게시글 내용을 입력하세요"
                  rows={5}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 resize-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsWriteModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg transition"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg shadow-md transition"
                >
                  {editingPostId ? '수정 완료' : '등록하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 게시글 상세보기 모달 */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 shadow-2xl relative">
            
            {/* 상단 헤더 */}
            <div className="flex justify-between items-start gap-4 border-b border-slate-800 pb-4">
              <div className="space-y-2 flex-1">
                {!isEditingInDetail ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    {(selectedPost.is_notice || selectedPost.isNotice) && (
                      <span className="bg-fuchsia-500/20 border border-fuchsia-500/50 text-fuchsia-300 text-xs font-bold px-2.5 py-0.5 rounded-md">
                        [공지] 📢
                      </span>
                    )}
                    {isHotPost(selectedPost) && (
                      <span className="bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-md">
                        [HOT] 🔥
                      </span>
                    )}
                    <h3 className="text-xl font-bold text-slate-100 leading-snug">{selectedPost.title}</h3>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={detailEditTitle}
                      onChange={(e) => setDetailEditTitle(e.target.value)}
                      className="w-full bg-slate-950 border border-indigo-500 rounded-lg px-3 py-1.5 text-lg font-bold text-slate-100 focus:outline-none"
                    />
                    <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-lg px-3 py-2">
                      <span className="text-xs text-slate-300">공지사항으로 지정</span>
                      <button
                        type="button"
                        onClick={() => setDetailEditIsNotice(!detailEditIsNotice)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition shadow-sm ${
                          detailEditIsNotice 
                            ? 'bg-fuchsia-600 text-white border border-fuchsia-500' 
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {detailEditIsNotice ? '공지 적용됨 (ON)' : '일반 글 (OFF)'}
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  <span>👤 {selectedPost.author_user?.nickname || '익명'}</span>
                  <span>⏱️ {formatRelativeTime(selectedPost.created_at)}</span>
                  <span>👁️ 조회수 {selectedPost.views_count || 0}</span>
                  <span>💬 댓글 {selectedPost.comments?.length || 0}개</span>
                  <span>❤️ 좋아요 {selectedPost.likes_count || 0}개</span>
                </div>

                {isMyItem(selectedPost, user) && (
                  <div className="flex gap-3 pt-1">
                    {!isEditingInDetail ? (
                      <>
                        <button
                          onClick={() => {
                            setIsEditingInDetail(true)
                            setDetailEditTitle(selectedPost.title)
                            setDetailEditContent(selectedPost.content)
                            setDetailEditIsNotice(!!(selectedPost.is_notice || selectedPost.isNotice))
                          }}
                          className="text-xs text-indigo-400 hover:underline font-semibold"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDeletePost(selectedPost.id)}
                          className="text-xs text-rose-400 hover:underline"
                        >
                          삭제
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={handleUpdateInDetail}
                          className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded font-medium transition"
                        >
                          수정 완료
                        </button>
                        <button
                          onClick={() => setIsEditingInDetail(false)}
                          className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded transition"
                        >
                          취소
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  setSelectedPost(null)
                  setIsEditingInDetail(false)
                }}
                className="text-slate-400 hover:text-white text-xl p-1 shrink-0 transition"
              >
                ✕
              </button>
            </div>

            {/* 본문 내용 */}
            <div className={`py-6 text-slate-100 text-base leading-relaxed ${!isEditingInDetail ? 'border-b border-slate-800' : ''}`}>
              {!isEditingInDetail ? (
                <div className="whitespace-pre-wrap">{selectedPost.content}</div>
              ) : (
                <textarea
                  value={detailEditContent}
                  onChange={(e) => setDetailEditContent(e.target.value)}
                  rows={8}
                  className="w-full bg-slate-950 border border-indigo-500 rounded-lg p-3 text-sm text-slate-100 focus:outline-none resize-none"
                />
              )}
            </div>

            {/* 댓글 및 리액션 영역 */}
            {!isEditingInDetail && (
              <div className="mt-6 space-y-4">
                <h4 className="font-bold text-slate-300 text-base">💬 댓글 ({selectedPost.comments?.length || 0})</h4>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="댓글을 남겨보세요..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={() => handleAddComment(null)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition shrink-0"
                  >
                    등록
                  </button>
                  <button
                    onClick={handleToggleLike}
                    className="flex items-center gap-1.5 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg text-sm font-medium text-rose-300 transition shrink-0"
                  >
                    <span>❤️</span>
                    <span className="font-bold">{selectedPost.likes_count || 0}</span>
                  </button>
                </div>

                {/* 댓글 리스트 */}
                <div className="space-y-3 mt-4">
                  {selectedPost.comments
                    ?.filter((c) => !c.parent_id)
                    .map((c) => (
                      <div key={c.id} className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-lg space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-indigo-300">
                            👤 {c.author_user?.nickname || '익명'}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500">{formatRelativeTime(c.created_at)}</span>
                            
                            {isMyItem(c, user) && (
                              <div className="flex gap-2">
                                {editingCommentId !== c.id && (
                                  <button
                                    onClick={() => {
                                      setEditingCommentId(c.id)
                                      setEditingCommentText(c.content)
                                    }}
                                    className="text-indigo-400 hover:underline"
                                  >
                                    수정
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteComment(c.id)}
                                  className="text-rose-400 hover:underline"
                                >
                                  삭제
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {editingCommentId === c.id ? (
                          <div className="flex gap-2 mt-2">
                            <input
                              type="text"
                              value={editingCommentText}
                              onChange={(e) => setEditingCommentText(e.target.value)}
                              className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-slate-100"
                            />
                            <button
                              onClick={() => handleUpdateComment(c.id)}
                              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-xs rounded text-white"
                            >
                              저장
                            </button>
                            <button
                              onClick={() => setEditingCommentId(null)}
                              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs rounded text-slate-300"
                            >
                              취소
                            </button>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-200">{c.content}</p>
                        )}

                        <button
                          onClick={() => {
                            if (replyToId === c.id) {
                              setReplyToId(null)
                              setReplyText('')
                            } else {
                              setReplyToId(c.id)
                              setReplyText('')
                            }
                          }}
                          className="text-xs text-indigo-400 hover:underline"
                        >
                          {replyToId === c.id ? '답글 취소' : '답글 작성'}
                        </button>

                        {/* 대댓글 입력 폼 */}
                        {replyToId === c.id && (
                          <div className="flex gap-2 mt-2 pt-2 border-t border-slate-800">
                            <input
                              type="text"
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="답글 입력..."
                              className="flex-1 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-100"
                            />
                            <button
                              onClick={() => handleAddComment(c.id)}
                              className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-xs rounded"
                            >
                              답글 등록
                            </button>
                          </div>
                        )}

                        {/* 대댓글 리스트 */}
                        {selectedPost.comments
                          ?.filter((sub) => String(sub.parent_id) === String(c.id))
                          .map((sub) => (
                            <div
                              key={sub.id}
                              className="ml-4 pl-3 border-l-2 border-indigo-500/40 bg-slate-900/80 p-2 rounded text-xs space-y-1 mt-2"
                            >
                              <div className="flex justify-between text-slate-400">
                                <span className="font-semibold text-indigo-300">
                                  ↳ {sub.author_user?.nickname || '익명'}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span>{formatRelativeTime(sub.created_at)}</span>
                                  
                                  {isMyItem(sub, user) && (
                                    <div className="flex gap-2">
                                      {editingCommentId !== sub.id && (
                                        <button
                                          onClick={() => {
                                            setEditingCommentId(sub.id)
                                            setEditingCommentText(sub.content)
                                          }}
                                          className="text-indigo-400 hover:underline"
                                        >
                                          수정
                                        </button>
                                      )}
                                      <button
                                        onClick={() => handleDeleteComment(sub.id)}
                                        className="text-rose-400 hover:underline"
                                      >
                                        삭제
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {editingCommentId === sub.id ? (
                                <div className="flex gap-2 mt-1">
                                  <input
                                    type="text"
                                    value={editingCommentText}
                                    onChange={(e) => setEditingCommentText(e.target.value)}
                                    className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-100"
                                  />
                                  <button
                                    onClick={() => handleUpdateComment(sub.id)}
                                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-xs rounded text-white"
                                  >
                                    저장
                                  </button>
                                  <button
                                    onClick={() => setEditingCommentId(null)}
                                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs rounded text-slate-300"
                                  >
                                    취소
                                  </button>
                                </div>
                              ) : (
                                <p className="text-sm text-slate-200">{sub.content}</p>
                              )}
                            </div>
                          ))}
                      </div>
                    ))}
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  )
}