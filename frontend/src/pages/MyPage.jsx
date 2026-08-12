import React, { useEffect, useState } from 'react';
import { formatRelativeTime } from '../utils/date';

export default function MyPage() {
  const [myPosts, setMyPosts] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch('/api/users/me/posts', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setMyPosts(data);
      })
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">마이페이지</h2>
      <h3 className="text-lg font-semibold mb-2">내가 작성한 게시글 ({myPosts.length})</h3>
      
      <div className="space-y-2">
        {myPosts.length === 0 ? (
          <p className="text-gray-500">작성한 게시글이 없습니다.</p>
        ) : (
          myPosts.map((post) => (
            <div key={post.id} className="p-3 border rounded flex justify-between items-center">
              <span className="font-medium">{post.title}</span>
              <span className="text-xs text-gray-400">{formatRelativeTime(post.created_at)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}