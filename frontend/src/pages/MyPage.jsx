import React from 'react';

export default function PostList({ posts = [], onOpenDetail }) {
  const handleTitleClick = (postId) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      alert('게시글 상세보기 및 이용은 로그인 후 가능합니다.');
      return;
    }

    onOpenDetail(postId);
  };

  return (
    <div className="space-y-3">
      {posts.map((post) => {
        console.log("확인용 포스트 객체:", post);

        return (
          <div key={post.id} className="p-4 border border-slate-800 bg-slate-900 rounded-xl shadow-sm hover:shadow transition flex justify-between items-center text-slate-100">
            <div className="space-y-2 w-full">
              <div 
                onClick={() => handleTitleClick(post.id)}
                className="cursor-pointer font-bold text-lg hover:text-indigo-400 flex items-center gap-2"
              >
                {/* 🔥 공지 뱃지 */}
                {post.is_notice && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded font-normal">공지</span>
                )}
                
                {/* 🔥 HOT 뱃지 추가 */}
                {post.is_hot && (
                  <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded font-normal flex items-center gap-0.5">
                    HOT 🔥
                  </span>
                )}

                {post.title}
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span>조회수 {post.views_count ?? 0}</span>
                <span>💬 댓글 {post.comments_count ?? post.comment_count ?? 0}</span>
                <span>❤️ 좋아요 {post.likes_count ?? 0}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}