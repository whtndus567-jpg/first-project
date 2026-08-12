import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function PostDetail({ postId, onClose }) {
  const [post, setPost] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);

  // 🔥 게시글 수정 모드 상태 관리
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  // 댓글 수정 상태 관리
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [commentEditContent, setCommentEditContent] = useState('');

  const token = localStorage.getItem('token');
  const authHeader = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  const fetchPostDetail = async () => {
    if (!postId) return;
    try {
      const res = await axios.get(`http://localhost:8000/api/posts/${postId}`);
      setPost(res.data);
    } catch (error) {
      console.error("게시글 로딩 실패:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (!postId) return;
      try {
        const res = await axios.get(`http://localhost:8000/api/posts/${postId}`);
        setPost(res.data);
      } catch (error) {
        console.error("게시글 로딩 실패:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [postId]);

  // 좋아요
  const handleLike = async () => {
    try {
      const res = await axios.post(`http://localhost:8000/api/posts/${postId}/like`, {}, authHeader);
      setPost((prev) => ({ ...prev, likes_count: res.data.likes_count }));
    } catch (error) {
      if (error.response?.status === 401) alert('로그인이 필요한 기능입니다.');
    }
  };

  // 🔥 게시글 수정 저장 요청
  const handleUpdatePost = async () => {
    if (!editTitle.trim() || !editContent.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }
    try {
      const res = await axios.put(
        `http://localhost:8000/api/posts/${postId}`,
        { title: editTitle, content: editContent },
        authHeader
      );
      setPost(res.data);
      setIsEditing(false); // 수정 모드 종료
    } catch (error) {
      alert(error.response?.data?.detail || '게시글 수정에 실패했습니다.');
    }
  };

  // 🔥 게시글 삭제 요청
  const handleDeletePost = async () => {
    if (!window.confirm('정말 이 게시글을 삭제하시겠습니까?')) return;
    try {
      await axios.delete(`http://localhost:8000/api/posts/${postId}`, authHeader);
      alert('게시글이 삭제되었습니다.');
      onClose(); // 창 닫기 및 목록으로 돌아가기
    } catch (error) {
      alert(error.response?.data?.detail || '게시글 삭제에 실패했습니다.');
    }
  };

  // 댓글 작성
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      await axios.post(
        `http://localhost:8000/api/posts/${postId}/comments`,
        { content: commentText, parent_id: null },
        authHeader
      );
      await fetchPostDetail();
      setCommentText('');
    } catch (error) {
      if (error.response?.status === 401) {
        alert('로그인이 필요한 기능입니다.');
      } else {
        alert('댓글 등록에 실패했습니다.');
      }
    }
  };

  // 댓글 수정 요청
  const handleUpdateComment = async (commentId) => {
    if (!commentEditContent.trim()) return;
    try {
      await axios.put(
        `http://localhost:8000/api/comments/${commentId}`,
        { content: commentEditContent, parent_id: null },
        authHeader
      );
      setEditingCommentId(null);
      setCommentEditContent('');
      await fetchPostDetail();
    } catch (error) {
      alert(error.response?.data?.detail || '댓글 수정에 실패했습니다.');
    }
  };

  // 댓글 삭제 요청
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('정말 이 댓글을 삭제하시겠습니까?')) return;
    try {
      await axios.delete(`http://localhost:8000/api/comments/${commentId}`, authHeader);
      await fetchPostDetail();
    } catch (error) {
      alert(error.response?.data?.detail || '댓글 삭제에 실패했습니다.');
    }
  };

  if (loading) return <div className="p-4 text-white">로딩 중...</div>;
  if (!post) return null;

  return (
    <div className="p-6 border border-slate-800 rounded-2xl shadow-xl bg-slate-900 text-slate-100 space-y-4 max-w-2xl mx-auto my-6">
      <div className="flex justify-between items-center mb-2">
        <button onClick={onClose} className="text-sm text-indigo-400 hover:underline">
          ← 목록으로 돌아가기
        </button>

        {/* 게시글 수정/삭제 버튼 (작성자 기준 또는 강제 노출부) */}
        {!isEditing && (
          <div className="space-x-2 text-xs">
            <button 
              onClick={() => {
                setIsEditing(true);
                setEditTitle(post.title);
                setEditContent(post.content);
              }}
              className="text-slate-400 hover:text-white"
            >
              수정
            </button>
            <button 
              onClick={handleDeletePost}
              className="text-rose-400 hover:text-rose-300"
            >
              삭제
            </button>
          </div>
        )}
      </div>

      {/* 🔥 수정 중일 때와 아닐 때의 화면 분기 */}
      {isEditing ? (
        <div className="space-y-3">
          <input
            type="text"
            className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded-lg text-lg font-bold text-slate-100 focus:outline-none focus:border-indigo-500"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="제목을 입력하세요"
          />
          <textarea
            className="w-full bg-slate-950 border border-slate-700 p-3 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-indigo-500 min-h-[150px]"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            placeholder="내용을 입력하세요"
          />
          <div className="flex justify-end gap-2">
            <button 
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg text-sm hover:bg-slate-600 transition"
            >
              취소
            </button>
            <button 
              onClick={handleUpdatePost}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-500 transition font-medium"
            >
              수정 완료
            </button>
          </div>
        </div>
      ) : (
        <>
          <h1 className="text-2xl font-bold">{post.title}</h1>
          <div className="text-sm text-slate-400 space-x-4 border-b border-slate-800 pb-2">
            <span>조회수: {post.views_count}</span>
            {post.updated_at && (
              <span className="text-xs text-indigo-400">(수정됨)</span>
            )}
          </div>

          <p className="text-slate-300 whitespace-pre-wrap min-h-[100px]">{post.content}</p>

          <div>
            <button 
              onClick={handleLike}
              className="px-4 py-2 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg hover:bg-rose-500/20 transition font-bold text-sm"
            >
              ❤️ 좋아요 {post.likes_count}
            </button>
          </div>
        </>
      )}

      {/* 댓글 영역 */}
      <div className="border-t border-slate-800 pt-4">
        <h3 className="font-bold mb-3 text-slate-200">댓글 ({post.comments?.length || 0})</h3>
        
        <div className="space-y-3 mb-4">
          {post.comments?.map((comment) => {
            return (
              <div key={comment.id} className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-sm space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-indigo-400">
                    {comment.author || comment.author_user?.nickname || comment.user?.nickname || '익명'}
                  </span>

                  {editingCommentId !== comment.id && (
                    <div className="space-x-2 text-xs">
                      <button 
                        onClick={() => {
                          setEditingCommentId(comment.id);
                          setCommentEditContent(comment.content);
                        }}
                        className="text-slate-400 hover:text-white"
                      >
                        수정
                      </button>
                      <button 
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-rose-400 hover:text-rose-300"
                      >
                        삭제
                      </button>
                    </div>
                  )}
                </div>

                {editingCommentId === comment.id ? (
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      className="flex-1 bg-slate-900 border border-slate-700 p-1.5 rounded text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                      value={commentEditContent}
                      onChange={(e) => setCommentEditContent(e.target.value)}
                    />
                    <button 
                      onClick={() => handleUpdateComment(comment.id)}
                      className="px-3 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-500"
                    >
                      저장
                    </button>
                    <button 
                      onClick={() => setEditingCommentId(null)}
                      className="px-3 py-1 bg-slate-700 text-slate-300 rounded text-xs hover:bg-slate-600"
                    >
                      취소
                    </button>
                  </div>
                ) : (
                  <p className="text-slate-200">{comment.content}</p>
                )}
              </div>
            );
          })}
        </div>

        <form onSubmit={handleCommentSubmit} className="flex gap-2">
          <input
            type="text"
            className="flex-1 bg-slate-950 border border-slate-800 p-2 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            placeholder="댓글을 남겨보세요..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
          />
          <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-500 font-medium transition">
            등록
          </button>
        </form>
      </div>
    </div>
  );
}