import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Search, 
  Bell, 
  BookOpen, 
  Plus, 
  ChevronDown, 
  MessageSquare, 
  Share2, 
  Flag, 
  ChevronUp, 
  Trash2,
  Check,
  ShieldCheck,
  Lock,
  Edit3,
  X,
  UserCheck,
  UserPlus
} from 'lucide-react';
import { Author, Community, CommunityPost, Post } from '../../types';
import { CommunityModeratorModal } from '../modals/CommunityModeratorModal';
import { getSafeUUID } from '../../lib/supabase';

interface CommunityHubScreenProps {
  community: Community;
  currentUser: Author;
  onBack: () => void;
  onNavigateUser?: (user: { name: string; username: string }) => void;
  onToggleFollow?: (userId: string) => void;
  onUpdateGuidelines?: (communityId: string, guidelines: string[]) => void;
  onApproveJoinRequest?: (communityId: string, requestId: string, applicant: Author) => void;
  onDeclineJoinRequest?: (communityId: string, requestId: string) => void;
  onRequestJoin?: (communityId: string) => void;
  communityPosts?: CommunityPost[];
  onCreateDiscussion?: (post: Partial<CommunityPost>) => void;
  onVoteDiscussion?: (postId: string, direction: 'up' | 'down') => void;
  onOpenComments?: (post: Post) => void;
  onOpenShare?: (post: Post) => void;
}

export const CommunityHubScreen: React.FC<CommunityHubScreenProps> = ({
  community,
  currentUser,
  onBack,
  onNavigateUser,
  onToggleFollow,
  onUpdateGuidelines,
  onApproveJoinRequest,
  onDeclineJoinRequest,
  onRequestJoin,
  onOpenShare,
  communityPosts,
  onCreateDiscussion,
  onVoteDiscussion,
  onOpenComments,
}) => {
  const [activeCategory, setActiveCategory] = useState<'All' | 'Discussion' | 'Question' | 'Advice' | 'Story' | 'Milestone'>('All');
  const [composerCategory, setComposerCategory] = useState<'Discussion' | 'Question' | 'Advice' | 'Story' | 'Milestone'>('Discussion');
  const [isComposerExpanded, setIsComposerExpanded] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [activeSort, setActiveSort] = useState<'Hot' | 'New' | 'Top'>('Hot');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [newPostText, setNewPostText] = useState('');
  const [isGuidelinesOpen, setIsGuidelinesOpen] = useState(false);
  const [notificationsActive, setNotificationsActive] = useState(false);
  
  // Moderator Modal State
  const [isModModalOpen, setIsModModalOpen] = useState(false);
  const [modModalTab, setModModalTab] = useState<'invites' | 'guidelines'>('invites');

  // Check if current user is moderator or founder
  const isModerator = 
    community.creator?.username === currentUser.username ||
    community.moderators?.some((m) => m.username === currentUser.username) ||
    currentUser.username === 'aarav.codes';

  const pendingRequestsCount = community.pendingJoinRequests?.length || 0;

  // Guidelines list from community or defaults
  const currentGuidelines = community.guidelines && community.guidelines.length > 0
    ? community.guidelines
    : [
        'Share verifiable daily progress, architecture notes, and code insights.',
        'Keep discussions constructive, positive, and focused on growth.',
        'No spam, unauthorized commercial solicitation, or low-effort ads.',
        'Celebrate shipping milestones and uphold cohort confidentiality.',
      ];

  const defaultPosts: CommunityPost[] = [
    {
      id: `cp_welcome_${community.id}`,
      communityId: community.id,
      author: {
        name: community.creator?.name || 'Community Founder',
        username: community.creator?.username || 'founder',
        avatar: community.creator?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        isMod: true,
      },
      title: `📌 Welcome to ${community.name}! Discussion & Accountability Hub`,
      content: 'Welcome everyone! This is our dedicated discussion space. Share insights, ask questions, exchange advice, and discuss daily progress. Keep discussions respectful and substantive.',
      category: 'Discussion',
      badges: ['ANNOUNCEMENT', 'PINNED'],
      upvotes: 24,
      userVote: 'up',
      timestamp: '1d ago',
      commentsCount: 0,
      isPinned: true,
    }
  ];

  // Merge parent communityPosts with defaults
  const [localPosts, setLocalPosts] = useState<CommunityPost[]>([]);

  // Combined posts list for this specific community
  const posts: CommunityPost[] = React.useMemo(() => {
    const parentList = communityPosts && communityPosts.length > 0 ? communityPosts : [];
    const merged = [...localPosts, ...parentList];
    const forThisComm = merged.filter(p => !p.communityId || p.communityId === community.id);
    if (forThisComm.length === 0) {
      return defaultPosts;
    }
    const seen = new Set<string>();
    return forThisComm.filter(p => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  }, [communityPosts, localPosts, community.id]);

  const handleVote = (postId: string, direction: 'up' | 'down') => {
    onVoteDiscussion?.(postId, direction);
    setLocalPosts(prev => prev.map(p => {
      if (p.id === postId) {
        let delta = 0;
        let newVote: 'up' | 'down' | null = direction;
        if (p.userVote === direction) {
          delta = direction === 'up' ? -1 : 1;
          newVote = null;
        } else if (p.userVote) {
          delta = direction === 'up' ? 2 : -2;
        } else {
          delta = direction === 'up' ? 1 : -1;
        }
        return {
          ...p,
          upvotes: p.upvotes + delta,
          userVote: newVote,
        };
      }
      return p;
    }));
  };

  const handleCreateDiscussion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText.trim()) return;

    const chosenCat = composerCategory || (activeCategory === 'All' ? 'Discussion' : activeCategory);
    const resolvedTitle = newPostTitle.trim() || newPostText.trim().slice(0, 60);
    const newPost: CommunityPost = {
      id: getSafeUUID(),
      communityId: community.id,
      communityName: community.name,
      author: {
        name: currentUser.name,
        username: currentUser.username,
        avatar: currentUser.avatar,
        isMod: isModerator,
      },
      title: resolvedTitle,
      content: newPostText.trim(),
      category: chosenCat,
      upvotes: 1,
      userVote: 'up',
      timestamp: 'Just now',
      commentsCount: 0,
    };

    setLocalPosts(prev => [newPost, ...prev]);
    onCreateDiscussion?.(newPost);
    setNewPostText('');
    setNewPostTitle('');
    setIsComposerExpanded(false);
  };

  const categories: ('All' | 'Discussion' | 'Question' | 'Advice' | 'Story' | 'Milestone')[] = [
    'All', 'Discussion', 'Question', 'Advice', 'Story', 'Milestone'
  ];

  const filteredPosts = posts.filter(p => {
    if (activeCategory !== 'All' && p.category !== activeCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="pb-24 pt-2 px-3 sm:px-4 animate-fade-in bg-black min-h-screen text-white">
      {/* Top Header Bar - Clean Spacious Layout (Never squashes community title) */}
      <div className="flex items-center justify-between gap-2 pb-3 pt-1 border-b border-[#20242C]/70">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-[#101010] hover:bg-[#1f242e] border border-[#20242C] flex items-center justify-center text-[#9298A3] hover:text-white transition-colors cursor-pointer shrink-0"
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>

          {/* Avatar (Matrix / Code pattern) */}
          <div className="w-10 h-10 rounded-full bg-[#080B10] border border-[#20242C] flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
            <div className="w-full h-full bg-emerald-950/70 font-mono text-[8px] text-emerald-400 p-1 flex items-center justify-center font-bold">
              &gt;CODE_
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 cursor-pointer group">
              <h2 className="text-sm sm:text-base font-bold text-white group-hover:text-[#3B82FF] transition-colors truncate">
                {community.name}
              </h2>
              <ChevronDown size={14} className="text-[#9298A3] shrink-0" />
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[#9298A3]">
              <span>{community.category || 'Coding'}</span>
              <span>•</span>
              {community.isJoined ? (
                <span className="text-emerald-400 font-medium flex items-center gap-1 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  Joined
                </span>
              ) : !community.isPublic ? (
                <span className="text-amber-400 font-medium flex items-center gap-1 shrink-0">
                  <Lock size={10} />
                  Private
                </span>
              ) : (
                <span className="text-[#3B82FF] font-medium flex items-center gap-1 shrink-0">
                  Public
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Action Icons: Search Toggle, Mod Console, Notification & Guidelines */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Search Toggle Icon Button */}
          <button
            onClick={() => setShowSearchInput(!showSearchInput)}
            className={`w-9 h-9 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
              showSearchInput || searchQuery
                ? 'bg-[#2166FF]/20 border-[#2166FF] text-[#3B82FF]'
                : 'bg-[#101010] hover:bg-[#1a1f29] border-[#20242C] text-[#9298A3] hover:text-white'
            }`}
            aria-label="Search posts"
            title="Search posts"
          >
            <Search size={16} />
          </button>

          {/* Moderator Console Button (If Moderator / Founder) */}
          {isModerator && (
            <button
              onClick={() => {
                setModModalTab(pendingRequestsCount > 0 ? 'invites' : 'guidelines');
                setIsModModalOpen(true);
              }}
              className="relative w-9 h-9 rounded-full bg-[#101010] hover:bg-[#1a1f29] border border-[#20242C] hover:border-[#2166FF]/60 flex items-center justify-center text-[#3B82FF] transition-all cursor-pointer"
              aria-label="Moderator Console"
              title="Moderator Console (Manage Invites & Guidelines)"
            >
              <ShieldCheck size={16} />
              {pendingRequestsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#2166FF] text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                  {pendingRequestsCount}
                </span>
              )}
            </button>
          )}

          {/* Notification Bell */}
          <button
            onClick={() => setNotificationsActive(!notificationsActive)}
            className={`w-9 h-9 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
              notificationsActive
                ? 'bg-[#2166FF]/20 border-[#2166FF] text-[#3B82FF]'
                : 'bg-[#101010] hover:bg-[#1a1f29] border-[#20242C] text-[#9298A3] hover:text-white'
            }`}
            aria-label="Community Notifications"
            title={notificationsActive ? "Notifications enabled" : "Enable notifications"}
          >
            <Bell size={16} />
          </button>

          {/* Guidelines Book Icon / Pill */}
          <button
            onClick={() => setIsGuidelinesOpen(!isGuidelinesOpen)}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 h-9 rounded-full border text-xs font-semibold transition-colors cursor-pointer ${
              isGuidelinesOpen
                ? 'bg-[#2166FF]/20 border-[#2166FF] text-[#3B82FF]'
                : 'bg-[#101010] hover:bg-[#1a1f29] border-[#20242C] text-[#9298A3] hover:text-white'
            }`}
            title="Community Guidelines"
          >
            <BookOpen size={14} className="text-[#3B82FF]" />
            <span className="hidden xs:inline">Rules</span>
          </button>
        </div>
      </div>

      {/* Expandable / Dedicated Clean Search Bar (Never squashes community title!) */}
      {(showSearchInput || searchQuery) && (
        <div className="relative my-2.5 animate-fade-in">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9298A3]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search posts and insights in ${community.name}...`}
            className="w-full bg-[#080B10] border border-[#20242C] focus:border-[#2166FF] rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-[#9298A3] focus:outline-none"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9298A3] hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {/* Private Community Notice for Non-Members */}
      {!community.isJoined && !community.isPublic && (
        <div className="my-3 p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-[#080B10] to-[#080B10] border border-amber-500/30 flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Lock size={15} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Private Cohort Community</h4>
              <p className="text-[11px] text-[#9298A3]">Requires moderator invitation or approval</p>
            </div>
          </div>
          <button
            onClick={() => onRequestJoin?.(community.id)}
            className="px-3.5 py-1.5 rounded-full bg-[#2166FF] hover:bg-[#3B82FF] active:scale-95 text-white text-xs font-semibold shadow-md transition-all cursor-pointer whitespace-nowrap"
          >
            Request to Join
          </button>
        </div>
      )}

      {/* Guidelines Accordion Drawer if toggled */}
      {isGuidelinesOpen && (
        <div className="my-3 p-4 rounded-2xl bg-[#080B10] border border-[#20242C] text-xs text-white/90 animate-fade-in space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#20242C]">
            <span className="font-bold text-white flex items-center gap-1.5">
              <BookOpen size={15} className="text-[#3B82FF]" />
              {community.name} Code of Conduct & Guidelines
            </span>
            <div className="flex items-center gap-2">
              {isModerator && (
                <button
                  type="button"
                  onClick={() => {
                    setModModalTab('guidelines');
                    setIsModModalOpen(true);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#2166FF]/20 hover:bg-[#2166FF]/30 text-[#3B82FF] text-[11px] font-semibold border border-[#2166FF]/40 cursor-pointer transition-colors"
                >
                  <Edit3 size={11} />
                  <span>Edit Guidelines</span>
                </button>
              )}
              <button 
                onClick={() => setIsGuidelinesOpen(false)} 
                className="w-6 h-6 rounded-full flex items-center justify-center text-[#9298A3] hover:text-white hover:bg-[#101010]"
              >
                <X size={14} />
              </button>
            </div>
          </div>
          <ul className="space-y-2 text-[#9298A3] text-xs">
            {currentGuidelines.map((rule, idx) => (
              <li key={idx} className="flex items-start gap-2 text-white/90 leading-relaxed">
                <span className="w-4 h-4 rounded-full bg-[#101010] border border-[#20242C] text-[10px] font-bold text-[#3B82FF] flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Start a discussion composer box */}
      <form onSubmit={handleCreateDiscussion} className="my-3 p-3 rounded-2xl bg-[#080B10] border border-[#20242C] space-y-2.5">
        <div className="flex items-center gap-3">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-9 h-9 rounded-full object-cover border border-[#20242C] shrink-0"
            referrerPolicy="no-referrer"
          />
          <div className="flex-1 min-w-0">
            {isComposerExpanded && (
              <input
                type="text"
                value={newPostTitle}
                onChange={(e) => setNewPostTitle(e.target.value)}
                placeholder="Title (optional)..."
                className="w-full bg-transparent text-xs font-semibold text-white placeholder-[#8A92A6] focus:outline-none mb-1.5 pb-1 border-b border-[#20242C]/50"
              />
            )}
            <input
              type="text"
              value={newPostText}
              onFocus={() => setIsComposerExpanded(true)}
              onChange={(e) => setNewPostText(e.target.value)}
              placeholder={`Post a ${composerCategory.toLowerCase()} in ${community.name}...`}
              className="w-full bg-transparent text-xs text-white placeholder-[#9298A3] focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={!newPostText.trim()}
            className="w-9 h-9 rounded-full bg-[#2166FF] hover:bg-[#3B82FF] disabled:bg-[#101010] text-white disabled:text-[#9298A3]/40 flex items-center justify-center shadow-md shadow-[#2166FF]/20 transition-all cursor-pointer shrink-0"
            aria-label="Post discussion"
          >
            <Plus size={18} />
          </button>
        </div>

        {/* Category Picker Chips */}
        <div className="flex items-center gap-1.5 pt-1 border-t border-[#20242C]/40 overflow-x-auto no-scrollbar">
          <span className="text-[10px] text-[#8A92A6] uppercase tracking-wider font-semibold shrink-0 mr-1">Type:</span>
          {(['Discussion', 'Question', 'Advice', 'Story', 'Milestone'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setComposerCategory(cat);
                setIsComposerExpanded(true);
              }}
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all cursor-pointer shrink-0 border ${
                composerCategory === cat
                  ? 'bg-[#2166FF] text-white border-[#2166FF] shadow-xs'
                  : 'bg-[#121620] text-[#8A92A6] border-[#202738] hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </form>

      {/* Filter Chips & Sorting Pills */}
      <div className="flex items-center justify-between gap-2 my-3 overflow-x-auto no-scrollbar pb-1">
        {/* Left Filter Chips */}
        <div className="flex items-center gap-1.5 shrink-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all whitespace-nowrap cursor-pointer ${
                activeCategory === cat
                  ? 'bg-[#2166FF] text-white shadow-sm shadow-[#2166FF]/30'
                  : 'bg-[#101010] text-[#9298A3] hover:text-white border border-[#20242C]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Right Sorting Pills */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#080B10] border border-[#20242C] shrink-0">
          <button
            onClick={() => setActiveSort('Hot')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
              activeSort === 'Hot' ? 'bg-[#1a1f29] text-white' : 'text-[#9298A3] hover:text-white'
            }`}
          >
            <span>🔥 Hot</span>
          </button>
          <button
            onClick={() => setActiveSort('New')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
              activeSort === 'New' ? 'bg-[#1a1f29] text-white' : 'text-[#9298A3] hover:text-white'
            }`}
          >
            <span>⏱ New</span>
          </button>
          <button
            onClick={() => setActiveSort('Top')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
              activeSort === 'Top' ? 'bg-[#1a1f29] text-white' : 'text-[#9298A3] hover:text-white'
            }`}
          >
            <span>📈 Top</span>
          </button>
        </div>
      </div>

      {/* Discussion Posts Feed */}
      <div className="space-y-3.5 my-3">
        {filteredPosts.map((post) => {
          return (
            <div
              key={post.id}
              className="p-4 rounded-3xl bg-[#080B10] border border-[#20242C] transition-all flex gap-3.5 group"
            >
              {/* Left Upvote/Downvote Column */}
              <div className="flex flex-col items-center justify-start bg-[#101010]/80 border border-[#20242C] rounded-2xl p-1.5 shrink-0 self-start">
                <button
                  onClick={() => handleVote(post.id, 'up')}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                    post.userVote === 'up' ? 'text-[#2166FF] bg-[#2166FF]/10' : 'text-[#9298A3] hover:text-white'
                  }`}
                  aria-label="Upvote"
                >
                  <ChevronUp size={18} />
                </button>

                <span className="text-xs font-bold font-mono tabular-nums text-white my-1">
                  {post.upvotes}
                </span>

                <button
                  onClick={() => handleVote(post.id, 'down')}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                    post.userVote === 'down' ? 'text-red-400 bg-red-500/10' : 'text-[#9298A3] hover:text-white'
                  }`}
                  aria-label="Downvote"
                >
                  <ChevronDown size={18} />
                </button>
              </div>

              {/* Main Card Content */}
              <div className="flex-1 min-w-0">
                {/* Meta Badges Row */}
                <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    {post.badges?.includes('ANNOUNCEMENT') && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-red-500/15 text-red-400 border border-red-500/25">
                        ANNOUNCEMENT
                      </span>
                    )}

                    {post.badges?.includes('PINNED') && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                        📌 PINNED
                      </span>
                    )}

                    <div className="flex items-center gap-1.5 text-xs text-[#9298A3] flex-wrap">
                      <button
                        onClick={() => onNavigateUser?.(post.author)}
                        className="text-white hover:text-[#3B82FF] font-semibold transition-colors cursor-pointer"
                      >
                        {post.author.name}
                      </button>
                      {post.author.isMod && (
                        <span className="px-1.5 py-0.2 rounded bg-white/10 text-white font-mono text-[9px] uppercase font-bold">
                          MOD
                        </span>
                      )}

                      {/* Follow Button for Community Post Author */}
                      {post.author.username !== currentUser.username && onToggleFollow && (
                        <button
                          type="button"
                          onClick={() => onToggleFollow(post.author.username)}
                          className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#2166FF]/20 hover:bg-[#2166FF] text-[#3B82FF] hover:text-white border border-[#2166FF]/30 transition-all cursor-pointer"
                        >
                          + Follow
                        </button>
                      )}

                      <span>•</span>
                      <span>{post.timestamp}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setLocalPosts(prev => prev.filter(p => p.id !== post.id))}
                    className="text-[#9298A3] hover:text-red-400 p-1 cursor-pointer transition-colors"
                    aria-label="Delete post"
                    title="Remove discussion post"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Post Title */}
                <h3 className="text-sm sm:text-base font-bold text-white mb-1.5 leading-snug">
                  {post.title}
                </h3>

                {/* Post Body */}
                <p className="text-xs text-white/90 leading-relaxed mb-3">
                  {post.content}
                </p>

                {/* Bottom Action Buttons */}
                <div className="flex items-center gap-2 pt-1 border-t border-[#20242C]/40 text-xs text-[#9298A3]">
                  <button
                    onClick={() => {
                      if (onOpenComments) {
                        onOpenComments({
                          id: post.id,
                          author: {
                            id: post.author.username,
                            name: post.author.name,
                            username: post.author.username,
                            avatar: post.author.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
                          },
                          timestamp: post.timestamp,
                          purpose: 'Insight',
                          content: `${post.title ? post.title + '\n\n' : ''}${post.content}`,
                          likesCount: post.upvotes || 0,
                          commentsCount: post.commentsCount || 0,
                          comments: [],
                          communityId: community.id,
                          communityName: community.name,
                        });
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#101010] hover:bg-[#1a1f29] border border-[#20242C] hover:text-white transition-colors cursor-pointer"
                  >
                    <MessageSquare size={13} />
                    <span>{post.commentsCount} Comments</span>
                  </button>

                  <button
                    onClick={() => {
                      if (onOpenShare) {
                        onOpenShare({
                          id: post.id,
                          author: {
                            id: post.author.username,
                            name: post.author.name,
                            username: post.author.username,
                            avatar: post.author.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
                            bio: post.author.isMod ? 'Community Moderator' : 'Community Member',
                          },
                          timestamp: post.timestamp,
                          purpose: 'Insight',
                          content: `${post.title ? post.title + '\n\n' : ''}${post.content}`,
                          likesCount: post.upvotes || 0,
                          commentsCount: post.commentsCount,
                          communityId: community.id,
                          communityName: community.name,
                        });
                      } else {
                        navigator.clipboard?.writeText(window.location.href);
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#101010] hover:bg-[#1a1f29] border border-[#20242C] hover:text-white transition-colors cursor-pointer"
                  >
                    <Share2 size={13} />
                    <span>Share</span>
                  </button>

                  <button
                    onClick={() => {}}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#101010] hover:bg-[#1a1f29] border border-[#20242C] hover:text-white transition-colors cursor-pointer"
                  >
                    <Flag size={13} />
                    <span>Report</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Community Moderator Console Modal */}
      {isModModalOpen && (
        <CommunityModeratorModal
          isOpen={isModModalOpen}
          community={community}
          currentUser={currentUser}
          initialTab={modModalTab}
          onClose={() => setIsModModalOpen(false)}
          onUpdateGuidelines={(cId, g) => onUpdateGuidelines?.(cId, g)}
          onApproveRequest={(cId, rId, u) => onApproveJoinRequest?.(cId, rId, u)}
          onDeclineRequest={(cId, rId) => onDeclineJoinRequest?.(cId, rId)}
        />
      )}
    </div>
  );
};
