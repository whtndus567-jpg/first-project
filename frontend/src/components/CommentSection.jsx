import React, { useState } from 'react';
import { formatRelativeTime } from '../utils/date';

export default function CommentSection({ comments = [], onAddComment }) {
  const [replyToId, setReplyToId] = useState(null);
  const [content, setContent] = useState('');

  const rootComments = comments.filter((c) => !c.parent_id);

  const handleSubmit = (parentId = null) => {
    if (!content.trim()) return;
    onAddComment(content, parentId);
    setContent('');
    setReplyToId(null);
  };

  return (
    <div className="mt-6 space-y-4">
      <h3 className="font-bold text-lg">댓글</h3>

      <div className="flex gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="댓글을 작성하세요..."
          className="border p-2 rounded flex-1"
        />
        <button 
          onClick={() => handleSubmit(null)} 
          className="bg-blue-600 text-white px-4 py-2 rounded font-medium"
        >
          등록
        </button>
      </div>

      <div className="space-y-3">
        {rootComments.map((comment) => {
          const childComments = comments.filter((c) => c.parent_id === comment.id);

          return (
            <div key={comment.id} className="border-b pb-2">
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-semibold mr-2">{comment.author}</span>
                  <span className="text-xs text-gray-400">{formatRelativeTime(comment.created_at)}</span>
                  <p className="mt-1">{comment.content}</p>
                </div>
                <button
                  onClick={() => setReplyToId(replyToId === comment.id ? null : comment.id)}
                  className="text-xs text-blue-500 hover:underline"
                >
                  답글
                </button>
              </div>

              {replyToId === comment.id && (
                <div className="ml-6 mt-2 flex gap-2">
                  <input
                    type="text"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="답글 작성..."
                    className="border p-1 text-sm rounded flex-1"
                  />
                  <button
                    onClick={() => handleSubmit(comment.id)}
                    className="bg-gray-700 text-white text-xs px-3 py-1 rounded"
                  >
                    등록
                  </button>
                </div>
              )}

              {childComments.map((child) => (
                <div key={child.id} className="ml-6 mt-2 p-2 bg-gray-50 rounded border-l-2 border-blue-400">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-sm">↳ {child.author}</span>
                    <span className="text-xs text-gray-400">{formatRelativeTime(child.created_at)}</span>
                  </div>
                  <p className="text-sm mt-1">{child.content}</p>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}