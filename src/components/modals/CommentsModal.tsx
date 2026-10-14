import React, { useState } from 'react';
import { X, Send, Heart } from 'lucide-react';
import { Author, Comment, Post } from '../../types';

interface CommentsModalProps {
  post: Post | null;
  currentUser: Author;
  onClose: () => void;
  onAddComment: (postId: string, text: string) => void;
  onNavigateAuthorProfile?: (author: Author) => void;
}

export const CommentsModal: React.FC<CommentsModalProps> = ({
  post,
  currentUser,
  onClose,
  onAddComment,
  onNavigateAuthorProfile,
}) => {
  const [commentText, setCommentText] = useState('');

  if (!post) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(post.id, commentText.trim());
    setCommentText('');
  };

  const handleAuthorClick = (author: Author) => {
    onClose();
    onNavigateAuthorProfile?.(author);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[#080B10] border border-[#20242C] rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#20242C]">
          <h3 className="text-sm font-bold text-white">Comments</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#9298A3] hover:text-white hover:bg-[#101010] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Post Summary */}
        <div className="px-4 py-3 bg-[#101010]/50 border-b border-[#20242C]/60 flex items-start gap-3">
          <button
            onClick={() => handleAuthorClick(post.author)}
            className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-[#20242C] cursor-pointer"
          >
            <img
              src={post.author.avatar}
              alt={post.author.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </button>
          <div className="flex-1 min-w-0">
            <button
              onClick={() => handleAuthorClick(post.author)}
              className="text-xs font-semibold text-white hover:text-[#3B82FF] transition-colors cursor-pointer text-left block"
            >
              {post.author.username}
            </button>
            <p className="text-xs text-[#9298A3] line-clamp-2">{post.content}</p>
          </div>
        </div>

        {/* Comment List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 divide-y divide-[#20242C]/40">
          {(post.comments || []).map((comment: Comment) => (
            <div key={comment.id} className="pt-3 first:pt-0 flex items-start gap-3">
              <button
                onClick={() => handleAuthorClick(comment.author)}
                className="w-7 h-7 rounded-full overflow-hidden shrink-0 border border-[#20242C] cursor-pointer"
              >
                <img
                  src={comment.author.avatar}
                  alt={comment.author.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <button
                    onClick={() => handleAuthorClick(comment.author)}
                    className="text-xs font-semibold text-white hover:text-[#3B82FF] transition-colors cursor-pointer"
                  >
                    {comment.author.username}
                  </button>
                  <span className="text-[10px] text-[#9298A3]">
                    {comment.timestamp}
                  </span>
                </div>
                <p className="text-xs text-white/90 leading-relaxed mb-1">
                  {comment.text}
                </p>
                <div className="flex items-center gap-1 text-[11px] text-[#9298A3]">
                  <Heart size={12} className="hover:text-[#2166FF] cursor-pointer" />
                  <span className="tabular-nums font-mono">{comment.likes}</span>
                </div>
              </div>
            </div>
          ))}

          {(!post.comments || post.comments.length === 0) && (
            <div className="py-8 text-center text-[#9298A3] text-xs">
              No comments yet. Start the conversation!
            </div>
          )}
        </div>

        {/* New Comment Input */}
        <form
          onSubmit={handleSubmit}
          className="p-3 border-t border-[#20242C] bg-[#080B10] flex items-center gap-2"
        >
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-7 h-7 rounded-full object-cover border border-[#20242C]"
            referrerPolicy="no-referrer"
          />
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 bg-[#101010] border border-[#20242C] rounded-full px-3.5 py-1.5 text-xs text-white placeholder-[#9298A3] focus:outline-none focus:border-[#2166FF]"
          />
          <button
            type="submit"
            disabled={!commentText.trim()}
            className="w-8 h-8 rounded-full bg-[#2166FF] disabled:bg-[#101010] text-white disabled:text-[#9298A3]/40 flex items-center justify-center transition-colors cursor-pointer"
          >
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
};
