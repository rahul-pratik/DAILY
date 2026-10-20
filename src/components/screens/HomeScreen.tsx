import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, 
  MessageSquare, 
  Bookmark, 
  Share2, 
  MoreHorizontal, 
  Sparkles,
  RefreshCw,
  ArrowDown,
  CheckCircle2,
  Loader2
} from 'lucide-react';
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
  onRefresh?: () => Promise<void> | void;
  isRefreshingSupabase?: boolean;
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
  onRefresh,
  isRefreshingSupabase = false,
}) => {
  const [activeFilter, setActiveFilter] = useState<'for_you' | 'following' | 'recent'>('for_you');

  // Pull-to-refresh states
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshSuccess, setRefreshSuccess] = useState(false);
  const touchStartY = useRef<number | null>(null);
  const isDraggingMouse = useRef<boolean>(false);
  const mouseStartY = useRef<number | null>(null);

  const PULL_THRESHOLD = 65;

  // Sync external loading state with local refreshing
  useEffect(() => {
    if (!isRefreshingSupabase && isRefreshing && !refreshSuccess) {
      setRefreshSuccess(true);
      const timer = setTimeout(() => {
        setRefreshSuccess(false);
        setPullDistance(0);
        setIsRefreshing(false);
        setIsPulling(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isRefreshingSupabase]);

  // Touch pull-down handler for mobile devices
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY <= 5 && !isRefreshing) {
        touchStartY.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartY.current !== null && window.scrollY <= 5 && !isRefreshing) {
        const deltaY = e.touches[0].clientY - touchStartY.current;
        if (deltaY > 0) {
          const damped = Math.min(deltaY * 0.45, 110);
          setPullDistance(damped);
          setIsPulling(true);
        }
      }
    };

    const handleTouchEnd = async () => {
      if (touchStartY.current === null) return;
      touchStartY.current = null;

      if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
        setIsRefreshing(true);
        setPullDistance(55);
        try {
          if (onRefresh) {
            await onRefresh();
          }
          setRefreshSuccess(true);
          setTimeout(() => {
            setRefreshSuccess(false);
            setPullDistance(0);
            setIsRefreshing(false);
            setIsPulling(false);
          }, 600);
        } catch {
          setPullDistance(0);
          setIsRefreshing(false);
          setIsPulling(false);
        }
      } else {
        setPullDistance(0);
        setIsPulling(false);
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullDistance, isRefreshing, onRefresh]);

  // Desktop mouse drag pull-down support
  const handleMouseDown = (e: React.MouseEvent) => {
    if (window.scrollY <= 5 && !isRefreshing) {
      isDraggingMouse.current = true;
      mouseStartY.current = e.clientY;
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingMouse.current && mouseStartY.current !== null && window.scrollY <= 5 && !isRefreshing) {
      const deltaY = e.clientY - mouseStartY.current;
      if (deltaY > 0) {
        const damped = Math.min(deltaY * 0.45, 110);
        setPullDistance(damped);
        setIsPulling(true);
      }
    }
  };

  const handleMouseUp = async () => {
    if (!isDraggingMouse.current) return;
    isDraggingMouse.current = false;
    mouseStartY.current = null;

    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(55);
      try {
        if (onRefresh) {
          await onRefresh();
        }
        setRefreshSuccess(true);
        setTimeout(() => {
          setRefreshSuccess(false);
          setPullDistance(0);
          setIsRefreshing(false);
          setIsPulling(false);
        }, 600);
      } catch {
        setPullDistance(0);
        setIsRefreshing(false);
        setIsPulling(false);
      }
    } else {
      setPullDistance(0);
      setIsPulling(false);
    }
  };

  // Explicit button reload trigger
  const triggerManualReload = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setPullDistance(55);
    try {
      if (onRefresh) {
        await onRefresh();
      }
      setRefreshSuccess(true);
      setTimeout(() => {
        setRefreshSuccess(false);
        setPullDistance(0);
        setIsRefreshing(false);
      }, 600);
    } catch {
      setPullDistance(0);
      setIsRefreshing(false);
    }
  };

  // Filter posts based on active filter
  const filteredPosts = posts.filter((post) => {
    if (activeFilter === 'following') {
      return post.author.username !== currentUser.username;
    }
    return true; // For you / recent
  });

  return (
    <div 
      className="pb-24 pt-1 animate-fade-in relative select-none sm:select-auto"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Pull Down to Reload Indicator Area */}
      <div
        className="overflow-hidden transition-[height] duration-200 ease-out flex items-center justify-center bg-[#070A10] border-b border-[#20242C]/40"
        style={{ height: pullDistance > 0 ? `${pullDistance}px` : '0px' }}
      >
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#121622] border border-[#202738] shadow-lg text-xs font-semibold">
          {isRefreshing || isRefreshingSupabase ? (
            <>
              <Loader2 size={14} className="animate-spin text-[#3B82FF]" />
              <span className="text-white">Reloading feed & data...</span>
            </>
          ) : refreshSuccess ? (
            <>
              <CheckCircle2 size={14} className="text-emerald-400" />
              <span className="text-emerald-400 font-bold">Feed up to date!</span>
            </>
          ) : pullDistance >= PULL_THRESHOLD ? (
            <>
              <ArrowDown size={14} className="text-[#3B82FF] -rotate-180 transition-transform duration-200" />
              <span className="text-[#60A5FA]">Release to reload</span>
            </>
          ) : (
            <>
              <RefreshCw
                size={14}
                className="text-[#9298A3] transition-transform duration-100"
                style={{ transform: `rotate(${pullDistance * 4}deg)` }}
              />
              <span className="text-[#9298A3]">Pull down to reload</span>
            </>
          )}
        </div>
      </div>

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

      {/* Feed Filter Pills & Reload Button */}
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

        {/* Quick Reload Feed Button */}
        <button
          onClick={triggerManualReload}
          disabled={isRefreshing || isRefreshingSupabase}
          title="Reload feed from Supabase"
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-[#8A92A6] hover:text-white bg-[#101010] hover:bg-[#161B26] border border-[#202738] transition-all cursor-pointer shrink-0"
        >
          <RefreshCw size={12} className={isRefreshing || isRefreshingSupabase ? "animate-spin text-[#3B82FF]" : "text-[#8A92A6]"} />
          <span className="hidden sm:inline">Reload</span>
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
                  <div className="flex items-center gap-1.5 text-xs text-[#9298A3] flex-wrap">
                    <span>{post.timestamp}</span>
                    {post.purpose && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-[#3B82FF] font-medium">{post.purpose}</span>
                      </>
                    )}
                    {post.isDailyProof && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold text-[10px]">
                        <Sparkles size={9} />
                        <span>Daily Proof{post.proofDay ? ` • Day ${post.proofDay}` : ''}</span>
                      </span>
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
          <div className="py-16 text-center text-[#9298A3] px-4 space-y-3">
            <Sparkles size={28} className="mx-auto text-[#2166FF] mb-1 opacity-70" />
            <div>
              <p className="text-sm font-semibold text-white mb-0.5">No posts yet in this feed</p>
              <p className="text-xs text-[#9298A3]">Show up and be the first to share your daily craft.</p>
            </div>
            <button
              type="button"
              onClick={onOpenCreate}
              className="px-4 py-2 rounded-xl bg-[#2166FF] hover:bg-[#3B82FF] text-white text-xs font-semibold cursor-pointer transition-colors shadow-md shadow-[#2166FF]/20"
            >
              Share Your First Post
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
