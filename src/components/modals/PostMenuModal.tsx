import React, { useState } from 'react';
import { X, Bookmark, Share2, Link, Flag, EyeOff, Trash2 } from 'lucide-react';
import { Author, Post } from '../../types';

interface PostMenuModalProps {
  post: Post | null;
  currentUser?: Author;
  onClose: () => void;
  onToggleSave: (postId: string) => void;
  onCopyLink: (post: Post) => void;
  onOpenShareToCommunity?: (post: Post) => void;
  onDeletePost?: (postId: string) => void;
}

export const PostMenuModal: React.FC<PostMenuModalProps> = ({
  post,
  currentUser,
  onClose,
  onToggleSave,
  onCopyLink,
  onOpenShareToCommunity,
  onDeletePost,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  if (!post) return null;

  const isAuthor = Boolean(
    currentUser && (
      (post.author.username && currentUser.username && post.author.username.toLowerCase() === currentUser.username.toLowerCase()) ||
      (post.author.id && currentUser.id && post.author.id === currentUser.id)
    )
  );

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-[#080B10] border border-[#20242C] rounded-t-3xl sm:rounded-3xl shadow-2xl p-4 overflow-hidden"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#20242C] mb-2">
          <span className="text-xs font-semibold text-[#9298A3]">Post Options</span>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-[#9298A3] hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-1">
          {/* Share to Community Hero Action */}
          {onOpenShareToCommunity && (
            <button
              onClick={() => {
                onOpenShareToCommunity(post);
                onClose();
              }}
              className="w-full p-2.5 rounded-xl hover:bg-[#2166FF]/20 text-left text-xs font-semibold text-white flex items-center gap-3 transition-colors cursor-pointer bg-[#2166FF]/10 border border-[#2166FF]/30 mb-1"
            >
              <Share2 size={16} className="text-[#3B82FF]" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-white font-bold">Share to Community</span>
                  <span className="text-[10px] font-mono bg-[#2166FF] text-white px-1.5 py-0.2 rounded">Post</span>
                </div>
                <p className="text-[11px] text-[#9298A3] truncate">
                  Search joined community, mention user & write thoughts
                </p>
              </div>
            </button>
          )}

          <button
            onClick={() => {
              onToggleSave(post.id);
              onClose();
            }}
            className="w-full p-2.5 rounded-xl hover:bg-[#101010] text-left text-xs font-medium text-white flex items-center gap-3 transition-colors cursor-pointer"
          >
            <Bookmark size={16} className={post.isSaved ? 'text-[#2166FF] fill-[#2166FF]' : 'text-[#9298A3]'} />
            <span>{post.isSaved ? 'Remove from Saved' : 'Save Post'}</span>
          </button>

          <button
            onClick={() => {
              onCopyLink(post);
              onClose();
            }}
            className="w-full p-2.5 rounded-xl hover:bg-[#101010] text-left text-xs font-medium text-white flex items-center gap-3 transition-colors cursor-pointer"
          >
            <Link size={16} className="text-[#9298A3]" />
            <span>Copy Link</span>
          </button>

          <button
            onClick={() => {
              if (onOpenShareToCommunity) {
                onOpenShareToCommunity(post);
              } else if (navigator.share) {
                navigator.share({ title: 'Daily Post', text: post.content, url: window.location.href });
              } else {
                onCopyLink(post);
              }
              onClose();
            }}
            className="w-full p-2.5 rounded-xl hover:bg-[#101010] text-left text-xs font-medium text-white flex items-center gap-3 transition-colors cursor-pointer"
          >
            <Share2 size={16} className="text-[#9298A3]" />
            <span>Share via...</span>
          </button>

          <button
            onClick={() => {
              alert('Post hidden from your feed.');
              onClose();
            }}
            className="w-full p-2.5 rounded-xl hover:bg-[#101010] text-left text-xs font-medium text-white flex items-center gap-3 transition-colors cursor-pointer"
          >
            <EyeOff size={16} className="text-[#9298A3]" />
            <span>Hide Post</span>
          </button>

          <button
            onClick={() => {
              alert('Thank you for your report. Our team will review this post.');
              onClose();
            }}
            className="w-full p-2.5 rounded-xl hover:bg-[#101010] text-left text-xs font-medium text-red-400 flex items-center gap-3 transition-colors cursor-pointer"
          >
            <Flag size={16} className="text-red-400" />
            <span>Report Post</span>
          </button>

          {/* Feature 2: Author Delete Post button */}
          {isAuthor && onDeletePost && (
            <div className="pt-2 mt-1 border-t border-[#20242C]">
              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-left text-xs font-semibold text-red-400 flex items-center gap-3 transition-colors cursor-pointer border border-red-500/20"
                >
                  <Trash2 size={16} className="text-red-400" />
                  <span>Delete Post</span>
                </button>
              ) : (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 space-y-2">
                  <p className="text-xs text-red-300 font-medium">Delete this post permanently?</p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 py-1.5 rounded-lg bg-[#121620] hover:bg-[#1A2030] text-xs text-[#8A92A6] font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onDeletePost(post.id);
                        onClose();
                      }}
                      className="flex-1 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-xs text-white font-bold"
                    >
                      Confirm Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
