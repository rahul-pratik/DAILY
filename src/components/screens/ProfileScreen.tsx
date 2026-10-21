import React, { useState } from 'react';
import { 
  Settings, 
  Flame, 
  ChevronRight, 
  Heart, 
  MessageSquare, 
  Edit3, 
  Bookmark, 
  ArrowLeft, 
  UserPlus, 
  Check, 
  Globe, 
  Lock, 
  Calendar, 
  Trophy, 
  Target, 
  Users, 
  Code, 
  BookOpen, 
  Camera,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Share2,
  Trash2,
  Sparkles
} from 'lucide-react';
import { Author, Challenge, Community, Post } from '../../types';

interface ProfileScreenProps {
  user: Author;
  posts: Post[];
  challenges: Challenge[];
  joinedCommunitiesCount: number;
  allUsers?: Author[];
  allCommunities?: Community[];
  onOpenSettings: () => void;
  onOpenEditProfile: () => void;
  onSelectPost: (post: Post) => void;
  onSelectChallenge: (challenge: Challenge) => void;
  onBack?: () => void;
  onToggleFollow?: (userId: string) => void;
  onSelectUser?: (user: Author) => void;
  onOpenAccountabilityHub: (user: Author) => void;
  onToggleHubPrivacy?: (newPrivacy: 'public' | 'private') => void;
  onSelectCommunity?: (community: Community) => void;
  onOpenShare?: (post: Post) => void;
  onToggleSave?: (postId: string) => void;
  onDeletePost?: (postId: string) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  user,
  posts,
  challenges,
  joinedCommunitiesCount,
  allUsers = [],
  allCommunities = [],
  onOpenSettings,
  onOpenEditProfile,
  onSelectPost,
  onSelectChallenge,
  onBack,
  onToggleFollow,
  onSelectUser,
  onOpenAccountabilityHub,
  onToggleHubPrivacy,
  onSelectCommunity,
  onOpenShare,
  onToggleSave,
  onDeletePost,
}) => {
  // Tabs: strictly ONLY posts | saved | following per user requirement
  const [activeTab, setActiveTab] = useState<'posts' | 'saved' | 'following'>('posts');
  
  // Local state for privacy toggle to guarantee instant UI feedback
  const [hubPrivacy, setHubPrivacy] = useState<'public' | 'private'>(user.accountabilityHubPrivacy || 'public');
  const [privateHubAlert, setPrivateHubAlert] = useState(false);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);

  const isSelf = user.isCurrentUser;

  // Sync privacy if prop changes
  React.useEffect(() => {
    if (user.accountabilityHubPrivacy) {
      setHubPrivacy(user.accountabilityHubPrivacy);
    }
  }, [user.accountabilityHubPrivacy]);

  // Filter posts written by this user
  const userPosts = posts.filter(
    (p) => p.author.username === user.username || p.author.id === user.id
  );
  const savedPosts = posts.filter((p) => p.isSaved);

  // Total likes accumulated over each post written by this user
  const totalLikesAccumulated = React.useMemo(() => {
    return userPosts.reduce((acc, p) => acc + (p.likesCount || 0), 0);
  }, [userPosts]);

  // Filter following users for this profile
  const followingUsers = React.useMemo(() => {
    if (isSelf) {
      // Current user follows accounts where isFollowing is true
      return allUsers.filter((u) => u.isFollowing && u.username !== user.username);
    }
    // Viewing other profile: show community creators & peers
    return allUsers.filter((u) => u.username !== user.username);
  }, [allUsers, isSelf, user.username]);

  // Filter challenges joined by this user
  const joinedChallenges = isSelf
    ? challenges.filter((c) => c.joined && c.status !== 'completed' && c.current < c.target)
    : challenges.filter((c) => 
        (c.joined || c.squadMembers?.some(m => m.username === user.username) || c.creator?.username === user.username || c.id === 'ch_run5k') &&
        c.status !== 'completed' && c.current < c.target
      );

  // Filter challenges completed by this user
  const completedChallenges = isSelf
    ? challenges.filter((c) => c.status === 'completed' || c.current >= c.target)
    : challenges.filter((c) => 
        (c.status === 'completed' || c.current >= c.target) &&
        (c.creator?.username === user.username || c.squadMembers?.some(m => m.username === user.username) || c.id === 'ch_coding30' || c.id === 'ch_buildsomething')
      );

  // Filter communities for this user
  const userCommunities = allCommunities.filter((c) => 
    isSelf ? c.isJoined : (c.creator?.username === user.username || c.isJoined)
  );

  const handleTogglePrivacySetting = () => {
    const nextPrivacy: 'public' | 'private' = hubPrivacy === 'public' ? 'private' : 'public';
    setHubPrivacy(nextPrivacy);
    onToggleHubPrivacy?.(nextPrivacy);
  };

  const handleAccountabilityHubClick = () => {
    if (!isSelf && hubPrivacy === 'private') {
      setPrivateHubAlert(true);
      return;
    }
    onOpenAccountabilityHub(user);
  };

  const getChallengeIcon = (iconName: string) => {
    switch (iconName) {
      case 'runner':
        return <Flame size={20} className="text-[#F59E0B]" />;
      case 'book':
        return <BookOpen size={20} className="text-[#3B82FF]" />;
      case 'code':
        return <Code size={20} className="text-[#06B6D4]" />;
      case 'camera':
        return <Camera size={20} className="text-[#EC4899]" />;
      default:
        return <Trophy size={20} className="text-[#3B82FF]" />;
    }
  };

  return (
    <div className="pb-24 animate-fade-in text-white">
      {/* Profile Header Banner */}
      <div className="relative w-full h-36 overflow-hidden bg-[#080B10]">
        <img
          src={user.bannerUrl || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&auto=format&fit=crop&q=80'}
          alt="Profile Header Banner"
          className="w-full h-full object-cover opacity-85"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black" />

        {/* Back Button if viewing another profile */}
        {!isSelf && onBack && (
          <button
            onClick={onBack}
            className="absolute top-3 left-3 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 backdrop-blur-md transition-all cursor-pointer border border-white/10"
            aria-label="Go back"
          >
            <ArrowLeft size={15} />
            <span>Back</span>
          </button>
        )}

        {/* Settings and Edit Banner buttons if viewing self */}
        {isSelf && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5">
            <button
              onClick={onOpenEditProfile}
              className="px-2.5 py-1.5 rounded-full bg-black/70 hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 backdrop-blur-md transition-all cursor-pointer border border-white/10 shadow-lg"
              title="Upload & Crop Profile Banner (1200×400)"
            >
              <Camera size={13} className="text-[#3B82FF]" />
              <span className="text-[11px]">Edit Banner</span>
            </button>
            <button
              onClick={onOpenSettings}
              className="w-8 h-8 rounded-full bg-black/70 hover:bg-black text-[#9298A3] hover:text-white flex items-center justify-center backdrop-blur-md transition-colors cursor-pointer border border-white/10"
              aria-label="Settings"
            >
              <Settings size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Profile Info Section */}
      <div className="px-4 -mt-12 relative z-10 mb-4">
        {/* Avatar with electric blue border ring and crop trigger */}
        <div className="relative inline-block mb-3">
          <div 
            onClick={isSelf ? onOpenEditProfile : undefined}
            className={`w-20 h-20 rounded-full overflow-hidden border-2 border-[#2166FF] shadow-lg shadow-[#2166FF]/20 bg-[#080B10] ${
              isSelf ? 'cursor-pointer group' : ''
            }`}
          >
            <img
              src={user.avatar}
              alt={user.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              referrerPolicy="no-referrer"
            />
            {isSelf && (
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                <Camera size={18} />
              </div>
            )}
          </div>

          {isSelf && (
            <button
              onClick={onOpenEditProfile}
              className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-[#2166FF] hover:bg-[#3B82FF] text-white flex items-center justify-center shadow-md border-2 border-black cursor-pointer transition-colors"
              title="Upload & Crop Profile Picture (1:1)"
            >
              <Camera size={11} />
            </button>
          )}
        </div>

        {/* Name, Handle & Follower stats */}
        <div className="mb-2">
          <h2 className="text-xl font-bold text-white tracking-tight leading-tight">
            {user.name}
          </h2>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <p className="text-xs text-[#9298A3] font-mono">@{user.username}</p>
            <span className="text-[#9298A3]/50">·</span>
            <button 
              type="button"
              onClick={() => setActiveTab('following')}
              className="text-xs font-mono text-white/90 hover:text-[#3B82FF] transition-colors cursor-pointer"
            >
              <strong className="text-white">{followingUsers.length}</strong>{' '}
              <span className="text-[#9298A3]">following</span>
            </button>
          </div>
        </div>

        {/* Bio */}
        <p className="text-xs text-white/90 leading-relaxed max-w-md mb-4">
          {user.bio || 'Building better things. Just getting started.'}
        </p>

        {/* ACCOUNTABILITY HUB PRIVACY SETTING */}
        <div className="p-3.5 rounded-2xl bg-[#090C13] border border-[#1C2230] mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              hubPrivacy === 'public' ? 'bg-[#2166FF]/15 text-[#3B82FF]' : 'bg-amber-500/15 text-amber-400'
            }`}>
              {hubPrivacy === 'public' ? <Globe size={16} /> : <Lock size={16} />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white truncate">
                  Accountability Hub
                </span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  hubPrivacy === 'public' 
                    ? 'bg-[#2166FF]/20 text-[#3B82FF] border border-[#2166FF]/30' 
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {hubPrivacy}
                </span>
              </div>
              <p className="text-[11px] text-[#9298A3] truncate mt-0.5">
                {hubPrivacy === 'public' 
                  ? 'Daily sprints & 30-day proof gallery are visible to all' 
                  : 'Daily sprints & proof gallery are private to this account'}
              </p>
            </div>
          </div>

          {isSelf ? (
            <button
              onClick={handleTogglePrivacySetting}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                hubPrivacy === 'public'
                  ? 'bg-[#101010] hover:bg-[#1f242e] text-[#9298A3] hover:text-white border border-[#20242C]'
                  : 'bg-[#2166FF] hover:bg-[#3B82FF] text-white shadow-sm'
              }`}
            >
              Make {hubPrivacy === 'public' ? 'Private' : 'Public'}
            </button>
          ) : (
            <span className="text-[11px] font-mono text-[#9298A3] shrink-0">
              {hubPrivacy === 'public' ? 'Unlocked' : 'Locked'}
            </span>
          )}
        </div>

        {/* PRIMARY ACTIONS: ACCOUNTABILITY HUB BUTTON + (EDIT PROFILE OR FOLLOW) */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          {/* Button to show Accountability Hub */}
          <button
            onClick={handleAccountabilityHubClick}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold bg-[#2166FF] hover:bg-[#3B82FF] active:scale-95 text-white shadow-md shadow-[#2166FF]/25 transition-all cursor-pointer"
          >
            <Calendar size={15} />
            <span>Accountability Hub</span>
          </button>

          {/* Edit Profile (Self) OR Follow (Other user) */}
          {isSelf ? (
            <button
              onClick={onOpenEditProfile}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold bg-[#101010] hover:bg-[#1a1f29] text-white border border-[#20242C] transition-colors cursor-pointer"
            >
              <Edit3 size={14} className="text-[#3B82FF]" />
              <span>Edit Profile</span>
            </button>
          ) : (
            <button
              onClick={() => onToggleFollow?.(user.id)}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                user.isFollowing
                  ? 'bg-[#101010] text-emerald-400 border border-[#20242C] hover:bg-[#1a1f29]'
                  : 'bg-[#101010] hover:bg-[#20242C] text-white border border-[#20242C]'
              }`}
            >
              {user.isFollowing ? <Check size={14} /> : <UserPlus size={14} />}
              <span>{user.isFollowing ? 'Following' : 'Follow'}</span>
            </button>
          )}
        </div>

        {/* Private Hub Notification Modal / Alert */}
        {privateHubAlert && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 mb-4 flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2.5 min-w-0">
              <Lock size={16} className="text-amber-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-amber-300">
                  Private Accountability Hub
                </p>
                <p className="text-[11px] text-[#9298A3] truncate">
                  @{user.username} has chosen to keep their accountability hub private.
                </p>
              </div>
            </div>
            <button
              onClick={() => setPrivateHubAlert(false)}
              className="text-xs text-[#9298A3] hover:text-white px-2 py-1 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* STATS SECTION: COMMUNITIES JOINED, CHALLENGES COMPLETED, CHALLENGES ONGOING, TOTAL LIKES ACCUMULATED */}
        <div className="grid grid-cols-4 gap-1 sm:gap-2 py-3 px-2 rounded-2xl bg-[#090C13] border border-[#1C2230] mb-4 text-center">
          {/* 1. Communities Joined */}
          <button 
            type="button"
            onClick={() => {
              if (userCommunities.length > 0 && onSelectCommunity) {
                onSelectCommunity(userCommunities[0]);
              }
            }}
            className="flex flex-col items-center justify-center py-1 px-1 rounded-xl hover:bg-[#101010] transition-all cursor-pointer group"
            title="Communities Joined"
          >
            <span className="text-base sm:text-lg font-bold text-white group-hover:text-[#3B82FF] transition-colors tabular-nums font-mono">
              {userCommunities.length || joinedCommunitiesCount}
            </span>
            <span className="text-[10px] text-[#9298A3] group-hover:text-white transition-colors truncate max-w-full font-medium">
              Communities
            </span>
            <span className="text-[9px] text-[#3B82FF] font-mono">
              Joined
            </span>
          </button>

          {/* 2. Challenges Completed */}
          <button 
            type="button"
            onClick={handleAccountabilityHubClick}
            className="flex flex-col items-center justify-center py-1 px-1 rounded-xl hover:bg-[#101010] transition-all cursor-pointer group"
            title="Challenges Completed"
          >
            <span className="text-base sm:text-lg font-bold text-emerald-400 group-hover:text-white transition-colors tabular-nums font-mono">
              {completedChallenges.length}
            </span>
            <span className="text-[10px] text-[#9298A3] group-hover:text-white transition-colors truncate max-w-full font-medium">
              Completed
            </span>
            <span className="text-[9px] text-emerald-400 font-mono">
              Challenges
            </span>
          </button>

          {/* 3. Challenges Ongoing */}
          <button 
            type="button"
            onClick={handleAccountabilityHubClick}
            className="flex flex-col items-center justify-center py-1 px-1 rounded-xl hover:bg-[#101010] transition-all cursor-pointer group"
            title="Challenges Ongoing"
          >
            <span className="text-base sm:text-lg font-bold text-[#3B82FF] group-hover:text-white transition-colors tabular-nums font-mono">
              {joinedChallenges.length}
            </span>
            <span className="text-[10px] text-[#9298A3] group-hover:text-white transition-colors truncate max-w-full font-medium">
              Ongoing
            </span>
            <span className="text-[9px] text-[#3B82FF] font-mono">
              Challenges
            </span>
          </button>

          {/* 4. Total Likes Accumulated Over Each Post */}
          <button 
            type="button"
            onClick={() => setActiveTab('posts')}
            className="flex flex-col items-center justify-center py-1 px-1 rounded-xl hover:bg-[#101010] transition-all cursor-pointer group"
            title="Total Likes accumulated over each post"
          >
            <span className="text-base sm:text-lg font-bold text-rose-400 group-hover:text-white transition-colors tabular-nums font-mono flex items-center justify-center gap-1">
              <Heart size={13} className="fill-rose-500 text-rose-500 shrink-0" />
              <span>{totalLikesAccumulated}</span>
            </span>
            <span className="text-[10px] text-[#9298A3] group-hover:text-white transition-colors truncate max-w-full font-medium">
              Total Likes
            </span>
            <span className="text-[9px] text-rose-400 font-mono">
              Accumulated
            </span>
          </button>
        </div>

        {/* SEGMENTED TAB NAVIGATOR: ONLY Posts, Saved, Following */}
        <div className="flex items-center gap-4 mb-4 border-b border-[#20242C] pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('posts')}
            className={`text-xs font-semibold transition-colors pb-1 relative whitespace-nowrap cursor-pointer px-1 ${
              activeTab === 'posts' ? 'text-white' : 'text-[#9298A3] hover:text-white'
            }`}
          >
            Posts ({userPosts.length})
            {activeTab === 'posts' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2166FF] rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('saved')}
            className={`text-xs font-semibold transition-colors pb-1 relative whitespace-nowrap cursor-pointer px-1 ${
              activeTab === 'saved' ? 'text-white' : 'text-[#9298A3] hover:text-white'
            }`}
          >
            Saved ({savedPosts.length})
            {activeTab === 'saved' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2166FF] rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('following')}
            className={`text-xs font-semibold transition-colors pb-1 relative whitespace-nowrap cursor-pointer px-1 ${
              activeTab === 'following' ? 'text-white' : 'text-[#9298A3] hover:text-white'
            }`}
          >
            Following ({followingUsers.length})
            {activeTab === 'following' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2166FF] rounded-full" />
            )}
          </button>
        </div>

        {/* TAB CONTENT: 1. POSTS */}
        {activeTab === 'posts' && (
          <div className="space-y-4">
            {userPosts.map((post) => (
              <div
                key={post.id}
                onClick={() => onSelectPost(post)}
                className="p-4 rounded-3xl bg-[#080B10] hover:bg-[#101010] border border-[#20242C] transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-semibold text-[#3B82FF] bg-[#2166FF]/15 px-2.5 py-0.5 rounded-full border border-[#2166FF]/20">
                      {post.purpose || 'Progress'}
                    </span>
                    {post.isDailyProof && (
                      <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                        <Sparkles size={10} />
                        <span>Daily Proof{post.proofDay ? ` • Day ${post.proofDay}` : ''}</span>
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-[#9298A3] font-mono">{post.timestamp}</span>
                </div>

                <p className="text-xs text-white leading-relaxed line-clamp-3 mb-3">
                  {post.content}
                </p>

                {(post.imageUrl || (post.mediaUrls && post.mediaUrls.length > 0)) && (
                  <div className="w-full h-44 rounded-2xl overflow-hidden mb-3 border border-[#20242C] bg-black">
                    <img
                      src={post.imageUrl || post.mediaUrls![0]}
                      alt="Post visual proof"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-[#9298A3] font-mono pt-2 border-t border-[#20242C]/50">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 hover:text-white transition-colors">
                      <Heart size={14} className={post.isLiked ? 'fill-red-500 text-red-500' : ''} />
                      <span>{post.likesCount}</span>
                    </span>
                    <span className="flex items-center gap-1.5 hover:text-white transition-colors">
                      <MessageSquare size={14} />
                      <span>{post.commentsCount}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Feature 2: Delete button for user's own posts */}
                    {(isSelf || post.author.username === user.username) && onDeletePost && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPostToDelete(post);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-colors cursor-pointer"
                        title="Delete post"
                        aria-label="Delete post"
                      >
                        <Trash2 size={12} />
                        <span className="text-[11px]">Delete</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenShare?.(post);
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#101010] hover:bg-[#2166FF]/20 text-[#9298A3] hover:text-[#3B82FF] border border-[#20242C] transition-colors cursor-pointer"
                      title="Share to community"
                    >
                      <Share2 size={13} />
                      <span className="text-[11px]">Share</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {userPosts.length === 0 && (
              <div className="py-12 text-center text-[#9298A3] bg-[#080B10] rounded-2xl border border-[#20242C]">
                <p className="text-xs text-white mb-1">No posts published yet.</p>
                <p className="text-[11px] text-[#9298A3]">
                  Create a post to start building your record.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB CONTENT: 2. SAVED */}
        {activeTab === 'saved' && (
          <div className="space-y-4">
            {savedPosts.map((post) => (
              <div
                key={post.id}
                onClick={() => onSelectPost(post)}
                className="p-4 rounded-3xl bg-[#080B10] hover:bg-[#101010] border border-[#20242C] transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={post.author.avatar}
                      alt={post.author.name}
                      className="w-6 h-6 rounded-full object-cover border border-[#20242C]"
                    />
                    <span className="text-xs font-bold text-white truncate">{post.author.name}</span>
                    <span className="text-[11px] text-[#9298A3] font-mono">@{post.author.username}</span>
                  </div>
                  <span className="text-xs text-[#9298A3] font-mono">{post.timestamp}</span>
                </div>

                <p className="text-xs text-white leading-relaxed line-clamp-3 mb-3">
                  {post.content}
                </p>

                {(post.imageUrl || (post.mediaUrls && post.mediaUrls.length > 0)) && (
                  <div className="w-full h-44 rounded-2xl overflow-hidden mb-3 border border-[#20242C] bg-black">
                    <img
                      src={post.imageUrl || post.mediaUrls![0]}
                      alt="Post visual proof"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-[#9298A3] font-mono pt-2 border-t border-[#20242C]/50">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 hover:text-white transition-colors">
                      <Heart size={14} className={post.isLiked ? 'fill-red-500 text-red-500' : ''} />
                      <span>{post.likesCount}</span>
                    </span>
                    <span className="flex items-center gap-1.5 hover:text-white transition-colors">
                      <MessageSquare size={14} />
                      <span>{post.commentsCount}</span>
                    </span>
                    {onToggleSave && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleSave(post.id);
                        }}
                        className="flex items-center gap-1 text-[#2166FF] hover:text-red-400 transition-colors cursor-pointer"
                        title="Toggle bookmark"
                      >
                        <Bookmark size={13} className="fill-[#2166FF]" />
                        <span className="text-[11px]">Saved</span>
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenShare?.(post);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#101010] hover:bg-[#2166FF]/20 text-[#9298A3] hover:text-[#3B82FF] border border-[#20242C] transition-colors cursor-pointer"
                    title="Share to community"
                  >
                    <Share2 size={13} />
                    <span className="text-[11px]">Share</span>
                  </button>
                </div>
              </div>
            ))}

            {savedPosts.length === 0 && (
              <div className="py-12 text-center text-[#9298A3] bg-[#080B10] rounded-2xl border border-[#20242C]">
                <Bookmark size={24} className="mx-auto text-[#2166FF] mb-2 opacity-60" />
                <p className="text-xs text-white mb-1">No saved posts.</p>
                <p className="text-[11px] text-[#9298A3]">
                  Bookmark posts to review them here anytime.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB CONTENT: 3. FOLLOWING */}
        {activeTab === 'following' && (
          <div className="space-y-3">
            {followingUsers.map((followed) => (
              <div
                key={followed.id}
                onClick={() => onSelectUser?.(followed)}
                className="p-3.5 rounded-3xl bg-[#080B10] hover:bg-[#101010] border border-[#20242C] hover:border-white/20 transition-all flex items-center justify-between gap-3 cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <img
                      src={followed.avatar}
                      alt={followed.name}
                      className="w-11 h-11 rounded-2xl object-cover border border-[#20242C] group-hover:border-[#3B82FF]/40 transition-colors"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-black" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-[#3B82FF] transition-colors truncate">
                        {followed.name}
                      </h3>
                      <span className="text-[11px] text-[#9298A3] font-mono truncate">
                        @{followed.username}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#9298A3] line-clamp-1 leading-relaxed">
                      {followed.bio || 'Active daily accountability builder'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Quick Accountability Hub Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (followed.accountabilityHubPrivacy === 'private') {
                        setPrivateHubAlert(true);
                      } else {
                        onOpenAccountabilityHub(followed);
                      }
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-[#2166FF]/15 hover:bg-[#2166FF] text-[#3B82FF] hover:text-white border border-[#2166FF]/30 text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                    title="View Accountability Hub"
                  >
                    <Trophy size={13} />
                    <span className="hidden sm:inline">Hub</span>
                  </button>

                  {/* Follow / Unfollow Toggle */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFollow?.(followed.id || followed.username);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                      followed.isFollowing
                        ? 'bg-[#101010] text-emerald-400 border border-[#20242C] hover:bg-[#1a1f29]'
                        : 'bg-[#2166FF] text-white hover:bg-[#1a55d6]'
                    }`}
                  >
                    {followed.isFollowing ? (
                      <>
                        <Check size={12} />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus size={12} />
                        <span>Follow</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}

            {followingUsers.length === 0 && (
              <div className="py-12 text-center text-[#9298A3] bg-[#080B10] rounded-2xl border border-[#20242C]">
                <Users size={24} className="mx-auto text-[#2166FF] mb-2 opacity-60" />
                <p className="text-xs text-white mb-1">Not following anyone yet.</p>
                <p className="text-[11px] text-[#9298A3]">
                  Explore community creators and sprint builders to follow their daily discipline!
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Post Confirmation Modal */}
      {postToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-[#090C13] border border-red-500/30 p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Delete Post?</h3>
                <p className="text-xs text-[#8A92A6]">This post will be permanently deleted from your profile and the public feed.</p>
              </div>
            </div>

            <div className="bg-[#121622] p-3 rounded-xl border border-[#202738] text-xs text-white/80 line-clamp-3">
              "{postToDelete.content}"
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPostToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-[#141926] hover:bg-[#1E2433] text-xs font-semibold text-[#8A92A6] hover:text-white border border-[#202738] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = postToDelete.id;
                  setPostToDelete(null);
                  onDeletePost?.(id);
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 text-xs font-semibold text-white transition-all cursor-pointer shadow-md shadow-red-600/30"
              >
                Yes, Delete Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
