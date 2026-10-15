import React, { useState } from 'react';
import { Heart, MessageSquare, Bookmark, Share2, MoreHorizontal, Sparkles } from 'lucide-react';
import { Author, Post } from '../../types';

interface HomeScreenProps {
  posts: Post[];
  currentUser: Author;
  onOpenCreate: () => void;
  onToggleLike: (postId: string) => void;
  onToggleSave: (postId: string) => void;
  onOpenComments: (post: Post) => void;
  onOpenPostMenu: (post: Post) => void;
  onOpenShare?: (post: Post) => void;
  onNavigateAuthorProfile?: (author: Author) => void;
  onToggleFollow?: (userId: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  posts,
  currentUser,
  onOpenCreate,
  onToggleLike,
  onToggleSave,
  onOpenComments,
  onOpenPostMenu,
  onOpenShare,
  onNavigateAuthorProfile,
  onToggleFollow,
}) => {
  const [activeFilter, setActiveFilter] = useState<'for_you' | 'following' | 'recent'>('for_you');

  // Filter posts based on active filter
  const filteredPosts = posts.filter((post) => {
    if (activeFilter === 'following') {
      // In this demo, posts by Sarah and Devin are from accounts followed
      return post.author.username !== currentUser.username;
    }
    return true; // For you / recent
  });

  return (
    <div className="pb-24 pt-1 animate-fade-in">
      {/* What's on your mind? entry trigger */}
      <div className="px-4 py-3 border-b border-[#20242C]/60">
        <button
          onClick={onOpenCreate}
          className="w-full flex items-center gap-3 p-2.5 rounded-full bg-[#080B10] hover:bg-[#101010] border border-[#20242C] transition-colors text-left cursor-pointer group"
          aria-label="Create a post"
        >
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-8 h-8 rounded-full object-cover border border-[#20242C]"
            referrerPolicy="no-referrer"
          />
          <span className="text-xs sm:text-sm text-[#9298A3] group-hover:text-white transition-colors">
            What's on your mind?
          </span>
        </button>
      </div>

      {/* Feed Filter Pills */}
      <div className="px-4 py-3 flex items-center gap-2 border-b border-[#20242C]/40 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveFilter('for_you')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all whitespace-nowrap cursor-pointer ${
            activeFilter === 'for_you'
              ? 'bg-[#2166FF] text-white shadow-sm shadow-[#2166FF]/30'
              : 'bg-[#101010] text-[#9298A3] hover:text-white border border-[#20242C]'
          }`}
        >
          For You
        </button>
        <button
          onClick={() => setActiveFilter('following')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all whitespace-nowrap cursor-pointer ${
            activeFilter === 'following'
              ? 'bg-[#2166FF] text-white shadow-sm shadow-[#2166FF]/30'
              : 'bg-[#101010] text-[#9298A3] hover:text-white border border-[#20242C]'
          }`}
        >
          Following
        </button>
        <button
          onClick={() => setActiveFilter('recent')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all whitespace-nowrap cursor-pointer ${
            activeFilter === 'recent'
              ? 'bg-[#2166FF] text-white shadow-sm shadow-[#2166FF]/30'
              : 'bg-[#101010] text-[#9298A3] hover:text-white border border-[#20242C]'
          }`}
        >
          Recent
        </button>
      </div>

      {/* Feed List */}
      <div className="divide-y divide-[#20242C]/60">
        {filteredPosts.map((post) => (
          <article key={post.id} className="p-4 hover:bg-[#080B10]/40 transition-colors">
            {/* Author Row */}
            <div className="flex items-start justify-between gap-3 mb-2.5">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onNavigateAuthorProfile?.(post.author)}
                  className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-[#20242C] hover:border-[#2166FF] transition-colors cursor-pointer"
                >
                  <img
                    src={post.author.avatar}
                    alt={post.author.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </button>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onNavigateAuthorProfile?.(post.author)}
                      className="text-sm font-semibold text-white hover:text-[#3B82FF] transition-colors cursor-pointer"
                    >
                      {post.author.username}
                    </button>

                    {/* Follow button in Home Screen posts */}
                    {!post.author.isCurrentUser && post.author.username !== currentUser.username && onToggleFollow && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFollow(post.author.id);
                        }}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all cursor-pointer ${
                          post.author.isFollowing
                            ? 'bg-[#101010] text-[#9298A3] border border-[#20242C] hover:text-white hover:border-[#3B82FF]'
                            : 'bg-[#2166FF]/20 hover:bg-[#2166FF] text-[#3B82FF] hover:text-white border border-[#2166FF]/40'
                        }`}
                      >
                        {post.author.isFollowing ? 'Following' : '+ Follow'}
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[#9298A3]">
                    <span>{post.timestamp}</span>
                    {post.purpose && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-[#3B82FF] font-medium">{post.purpose}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Context Menu Button */}
              <button
                onClick={() => onOpenPostMenu(post)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#9298A3] hover:text-white hover:bg-[#101010] transition-colors cursor-pointer"
                aria-label="More options"
              >
                <MoreHorizontal size={18} />
              </button>
            </div>

            {/* Post Content */}
            <p className="text-[14px] leading-relaxed text-white/95 whitespace-pre-line mb-3 font-normal">
              {post.content}
            </p>

            {/* Post Media */}
            {post.mediaUrls && post.mediaUrls.length > 0 && (
              <div className="mb-3.5 rounded-xl overflow-hidden border border-[#20242C] bg-[#080B10]">
                {post.mediaUrls.length === 1 ? (
                  <div className="relative aspect-video max-h-[380px] w-full overflow-hidden bg-[#080B10]">
                    <img
                      src={post.mediaUrls[0]}
                      alt="Post visual"
                      className="w-full h-full object-cover hover:scale-[1.01] transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-1 bg-[#101010]">
                    {post.mediaUrls.map((url, idx) => (
                      <div key={idx} className="relative aspect-square overflow-hidden bg-[#080B10]">
                        <img
                          src={url}
                          alt={`Attachment ${idx + 1}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Quoted Shared Post Preview Card */}
            {post.sharedPost && (
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  if (onNavigateAuthorProfile && post.sharedPost) {
                    onNavigateAuthorProfile(post.sharedPost.author);
                  }
                }}
                className="mb-3.5 p-3 rounded-2xl bg-[#080B10] border border-[#20242C] hover:border-[#3B82FF]/40 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={post.sharedPost.author.avatar}
                      alt={post.sharedPost.author.name}
                      className="w-5 h-5 rounded-full object-cover border border-[#20242C]"
                    />
                    <span className="text-xs font-semibold text-white truncate">
                      {post.sharedPost.author.name}
                    </span>
                    <span className="text-[11px] text-[#3B82FF] font-mono">
                      @{post.sharedPost.author.username}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#9298A3] font-mono shrink-0">
                    {post.sharedPost.timestamp}
                  </span>
                </div>
                <p className="text-xs text-white/90 line-clamp-3 leading-relaxed mb-2">
                  {post.sharedPost.content}
                </p>
                {(post.sharedPost.imageUrl || (post.sharedPost.mediaUrls && post.sharedPost.mediaUrls.length > 0)) && (
                  <div className="rounded-xl overflow-hidden max-h-44 border border-[#20242C] bg-black">
                    <img
                      src={post.sharedPost.imageUrl || post.sharedPost.mediaUrls![0]}
                      alt="Quoted visual"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Post Engagement Action Bar */}
            <div className="flex items-center justify-between text-[#9298A3] pt-1">
              <div className="flex items-center gap-6">
                {/* Like Button */}
                <button
                  onClick={() => onToggleLike(post.id)}
                  className={`flex items-center gap-1.5 text-xs font-medium transition-colors cursor-pointer group ${
                    post.isLiked ? 'text-[#2166FF]' : 'hover:text-white'
                  }`}
                  aria-label="Like post"
                >
                  <Heart
                    size={18}
                    className={`transition-transform active:scale-125 ${
                      post.isLiked
                        ? 'fill-[#2166FF] text-[#2166FF]'
                        : 'text-[#9298A3] group-hover:text-white'
                    }`}
                  />
                  <span className="tabular-nums font-mono">{post.likesCount}</span>
                </button>

                {/* Comment Button */}
                <button
                  onClick={() => onOpenComments(post)}
                  className="flex items-center gap-1.5 text-xs font-medium hover:text-white transition-colors cursor-pointer group"
                  aria-label="Comment on post"
                >
                  <MessageSquare
                    size={18}
                    className="text-[#9298A3] group-hover:text-white group-hover:scale-105 transition-transform"
                  />
                  <span className="tabular-nums font-mono">{post.commentsCount}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {/* Save Button */}
                <button
                  onClick={() => onToggleSave(post.id)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                    post.isSaved ? 'text-[#2166FF]' : 'text-[#9298A3] hover:text-white'
                  }`}
                  aria-label="Bookmark post"
                >
                  <Bookmark
                    size={18}
                    className={post.isSaved ? 'fill-[#2166FF] text-[#2166FF]' : ''}
                  />
                </button>

                {/* Share Button */}
                <button
                  onClick={() => (onOpenShare ? onOpenShare(post) : onOpenPostMenu(post))}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#9298A3] hover:text-white transition-colors cursor-pointer"
                  aria-label="Share post"
                  title="Share post to community"
                >
                  <Share2 size={17} />
                </button>
              </div>
            </div>
          </article>
        ))}

        {filteredPosts.length === 0 && (
          <div className="py-16 text-center text-[#9298A3] px-4">
            <Sparkles size={28} className="mx-auto text-[#2166FF] mb-2 opacity-70" />
            <p className="text-sm font-medium text-white mb-1">No posts found in this feed</p>
            <p className="text-xs text-[#9298A3]">Show up and be the first to share your work today.</p>
          </div>
        )}
      </div>
    </div>
  );
};
