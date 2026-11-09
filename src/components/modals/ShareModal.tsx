import React, { useState, useMemo } from 'react';
import { 
  X, 
  Share2, 
  Search, 
  Send, 
  Users, 
  AtSign, 
  Link, 
  Check, 
  Sparkles,
  Globe,
  MessageSquare,
  ExternalLink,
  Trophy,
  AlertTriangle,
  Flame,
  Camera
} from 'lucide-react';
import { Author, Challenge, Community, Post } from '../../types';

interface ShareModalProps {
  isOpen: boolean;
  post: Post | null;
  currentUser: Author;
  joinedCommunities: Community[];
  joinedChallenges?: Challenge[];
  onClose: () => void;
  onShareToCommunity: (data: {
    originalPost: Post;
    targetCommunity: Community;
    caption: string;
    mentionRealUser: boolean;
  }) => void;
  onShareToChallenge?: (data: {
    originalPost: Post;
    targetChallenge: Challenge;
    note: string;
  }) => void;
  onCopyLink?: (post: Post) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  post,
  currentUser,
  joinedCommunities,
  joinedChallenges = [],
  onClose,
  onShareToCommunity,
  onShareToChallenge,
  onCopyLink,
}) => {
  const [shareDestination, setShareDestination] = useState<'community' | 'challenges'>('community');
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>(
    joinedCommunities[0]?.id || ''
  );
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>(
    joinedChallenges[0]?.id || ''
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [caption, setCaption] = useState('');
  const [mentionRealUser, setMentionRealUser] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  // If no initial selection, choose the first joined community / challenge
  React.useEffect(() => {
    if (joinedCommunities.length > 0 && (!selectedCommunityId || !joinedCommunities.some(c => c.id === selectedCommunityId))) {
      setSelectedCommunityId(joinedCommunities[0].id);
    }
  }, [joinedCommunities, selectedCommunityId]);

  React.useEffect(() => {
    if (joinedChallenges.length > 0 && (!selectedChallengeId || !joinedChallenges.some(c => c.id === selectedChallengeId))) {
      setSelectedChallengeId(joinedChallenges[0].id);
    }
  }, [joinedChallenges, selectedChallengeId]);

  // Filter joined communities by search term
  const filteredCommunities = useMemo(() => {
    if (!searchQuery.trim()) return joinedCommunities;
    const q = searchQuery.toLowerCase().trim();
    return joinedCommunities.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.category?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q)
    );
  }, [joinedCommunities, searchQuery]);

  const selectedCommunity = useMemo(() => {
    return joinedCommunities.find((c) => c.id === selectedCommunityId) || joinedCommunities[0];
  }, [joinedCommunities, selectedCommunityId]);

  const selectedChallenge = useMemo(() => {
    return joinedChallenges.find((c) => c.id === selectedChallengeId) || joinedChallenges[0];
  }, [joinedChallenges, selectedChallengeId]);

  if (!isOpen || !post) return null;

  const isRealUserSelf = post.author.id === currentUser.id || post.author.username === currentUser.username;
  const hasPhoto = Boolean(post.imageUrl || post.mediaUrls?.some(Boolean));
  const realAuthorHandle = post.author.username;
  const realAuthorName = post.author.name;

  const handleShare = () => {
    if (shareDestination === 'community') {
      if (!selectedCommunity) return;
      onShareToCommunity({
        originalPost: post,
        targetCommunity: selectedCommunity,
        caption: caption.trim(),
        mentionRealUser,
      });
    } else {
      if (!isRealUserSelf || !selectedChallenge || !onShareToChallenge) return;
      onShareToChallenge({
        originalPost: post,
        targetChallenge: selectedChallenge,
        note: caption.trim() || post.content,
      });
    }
    setCaption('');
    setSearchQuery('');
    onClose();
  };

  const handleCopy = () => {
    if (onCopyLink) {
      onCopyLink(post);
    } else {
      navigator.clipboard?.writeText(window.location.href);
    }
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSystemShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Post by ${post.author.name}`,
        text: post.content,
        url: window.location.href,
      }).catch(() => {});
    } else {
      handleCopy();
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[#080B10] border border-[#20242C] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92dvh] animate-slide-up"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#20242C] bg-[#0c1017]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#2166FF]/15 border border-[#2166FF]/30 flex items-center justify-center text-[#3B82FF]">
              {shareDestination === 'community' ? <Users size={16} /> : <Trophy size={16} />}
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>{shareDestination === 'community' ? 'Share to Community' : 'Share to Challenges'}</span>
                <span className="text-[10px] font-mono font-semibold bg-[#2166FF]/20 text-[#3B82FF] px-2 py-0.5 rounded-full border border-[#2166FF]/30">
                  {shareDestination === 'community' ? 'Community Repost' : 'Daily Proof'}
                </span>
              </h2>
              <p className="text-[11px] text-[#9298A3]">
                {shareDestination === 'community'
                  ? 'Repost to your joined community with your commentary'
                  : 'Submit your photo to an active challenge for moderator verification'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#9298A3] hover:text-white hover:bg-[#1a1f29] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* 2-Way Destination Switcher */}
        <div className="grid grid-cols-2 p-1.5 bg-[#10141d] border-b border-[#20242C] gap-1.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setShareDestination('community')}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              shareDestination === 'community'
                ? 'bg-[#2166FF] text-white shadow-md shadow-[#2166FF]/25'
                : 'text-[#9298A3] hover:text-white hover:bg-[#1a2130]'
            }`}
          >
            <Users size={14} />
            <span>Share to Community</span>
          </button>

          <button
            type="button"
            onClick={() => setShareDestination('challenges')}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              shareDestination === 'challenges'
                ? 'bg-[#2166FF] text-white shadow-md shadow-[#2166FF]/25'
                : 'text-[#9298A3] hover:text-white hover:bg-[#1a2130]'
            }`}
          >
            <Trophy size={14} />
            <span>Share to Challenges</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto p-4 space-y-4 text-xs">
          {shareDestination === 'community' ? (
            <>
              {/* STEP 1: SELECT JOINED COMMUNITY WITH SEARCH BAR */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-semibold text-white flex items-center gap-1.5">
                    <Users size={14} className="text-[#3B82FF]" />
                    <span>1. Select Destination Community</span>
                  </label>
                  <span className="text-[11px] font-mono text-[#9298A3]">
                    {joinedCommunities.length} joined
                  </span>
                </div>

                {/* Search Bar for Joined Communities */}
                <div className="relative mb-2.5">
                  <Search
                    size={14}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9298A3]"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search joined communities..."
                    className="w-full pl-9 pr-8 py-2 bg-[#101010] border border-[#20242C] focus:border-[#3B82FF] rounded-xl text-xs text-white placeholder-[#9298A3] outline-none transition-colors"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9298A3] hover:text-white"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* List / Grid of Joined Communities */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                  {filteredCommunities.map((comm) => {
                    const isSelected = selectedCommunity?.id === comm.id;
                    return (
                      <button
                        key={comm.id}
                        type="button"
                        onClick={() => setSelectedCommunityId(comm.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${
                          isSelected
                            ? 'bg-[#2166FF]/15 border-[#2166FF] text-white shadow-sm shadow-[#2166FF]/20'
                            : 'bg-[#101010] border-[#20242C] text-[#9298A3] hover:border-white/20 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center text-[#3B82FF] shrink-0">
                            <Globe size={13} />
                          </div>
                          <div className="min-w-0">
                            <p className={`text-xs font-semibold truncate ${isSelected ? 'text-white' : 'text-gray-200'}`}>
                              {comm.name}
                            </p>
                            <p className="text-[10px] text-[#9298A3] truncate">
                              {comm.category} • {comm.membersCount} members
                            </p>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-[#2166FF] flex items-center justify-center text-white shrink-0">
                            <Check size={12} />
                          </div>
                        )}
                      </button>
                    );
                  })}

                  {filteredCommunities.length === 0 && (
                    <div className="col-span-full py-4 text-center text-[#9298A3] bg-[#101010] rounded-xl border border-[#20242C]">
                      <p className="text-xs">No joined communities matching &quot;{searchQuery}&quot;</p>
                    </div>
                  )}
                </div>
              </div>

              {/* STEP 2: REAL USER MENTION & ORIGINAL POST QUOTE PREVIEW */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-semibold text-white flex items-center gap-1.5">
                    <AtSign size={14} className="text-[#3B82FF]" />
                    <span>2. Mention Real User & Quoted Post</span>
                  </label>
                  
                  {/* Mention Toggle Chip */}
                  <button
                    type="button"
                    onClick={() => setMentionRealUser(!mentionRealUser)}
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all flex items-center gap-1 cursor-pointer ${
                      mentionRealUser
                        ? 'bg-[#2166FF]/20 text-[#3B82FF] border-[#2166FF]/40'
                        : 'bg-[#101010] text-[#9298A3] border-[#20242C]'
                    }`}
                  >
                    <Check size={11} className={mentionRealUser ? 'opacity-100' : 'opacity-0'} />
                    <span>Mention @{realAuthorHandle} {isRealUserSelf ? '(You)' : ''}</span>
                  </button>
                </div>

                {/* Quoted Post Card */}
                <div className="p-3.5 rounded-2xl bg-[#101010] border border-[#20242C] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={post.author.avatar}
                        alt={realAuthorName}
                        className="w-6 h-6 rounded-full object-cover border border-[#20242C]"
                      />
                      <div className="min-w-0 flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-white truncate">{realAuthorName}</span>
                        <span className="font-mono text-[#3B82FF] font-semibold">@{realAuthorHandle}</span>
                        {isRealUserSelf && (
                          <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-500/30">
                            You
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-[#9298A3] shrink-0">{post.timestamp}</span>
                  </div>

                  <p className="text-xs text-white/90 line-clamp-3 leading-relaxed">
                    {post.content}
                  </p>

                  {(post.imageUrl || (post.mediaUrls && post.mediaUrls.length > 0)) && (
                    <div className="w-full h-28 rounded-xl overflow-hidden border border-[#20242C] bg-black">
                      <img
                        src={post.imageUrl || post.mediaUrls![0]}
                        alt="Post visual proof"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {mentionRealUser && (
                    <div className="pt-2 border-t border-[#20242C] flex items-center gap-1.5 text-[11px] text-[#3B82FF] font-mono">
                      <AtSign size={12} />
                      <span>Attribution: Real post creator @{realAuthorHandle} will be tagged in community</span>
                    </div>
                  )}
                </div>
              </div>

              {/* STEP 3: WRITE UNDER THE POST WHAT YOU WANNA CONVEY */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-semibold text-white flex items-center gap-1.5">
                    <MessageSquare size={14} className="text-[#3B82FF]" />
                    <span>3. What do you want to convey?</span>
                  </label>
                  <span className="text-[11px] font-mono text-[#9298A3]">
                    {caption.length}/400
                  </span>
                </div>

                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value.slice(0, 400))}
                  rows={3}
                  placeholder={`Write what you want to convey about this post to ${selectedCommunity?.name || 'the community'} (your thoughts, takeaways, why this matters)...`}
                  className="w-full p-3 bg-[#101010] border border-[#20242C] focus:border-[#3B82FF] rounded-2xl text-xs text-white placeholder-[#9298A3] outline-none transition-colors resize-none leading-relaxed"
                />

                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1.5">
                  {[
                    `Crucial learning from @${realAuthorHandle}!`,
                    'Sharing with our syndicate builders.',
                    'What are everyone’s thoughts on this approach?',
                    'Must-read for anyone tackling this milestone.',
                  ].map((chipText, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCaption(chipText)}
                      className="px-2.5 py-1 rounded-full bg-[#101010] hover:bg-[#1a1f29] border border-[#20242C] text-[10px] text-[#9298A3] hover:text-white whitespace-nowrap transition-colors cursor-pointer"
                    >
                      {chipText}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* CHALLENGES SHARING MODE */
            !isRealUserSelf ? (
              <div className="p-6 text-center space-y-4 bg-[#101010] rounded-2xl border border-[#20242C]">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">
                    Only Your Own Posts Can Be Sent to Challenges
                  </h3>
                  <p className="text-xs text-[#9298A3] max-w-sm mx-auto leading-relaxed">
                    In Daily, challenge proofs must represent your personal commitment and daily discipline. You cannot send someone else&apos;s post (@{realAuthorHandle}) to challenges.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShareDestination('community')}
                  className="px-4 py-2.5 rounded-xl bg-[#2166FF] hover:bg-[#1a55d6] text-xs font-bold text-white transition-all cursor-pointer inline-flex items-center gap-2 shadow-lg shadow-[#2166FF]/20"
                >
                  <Users size={14} />
                  <span>Share to Community Instead</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {!hasPhoto && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-200">
                    Challenge proofs require a photo. Add a photo to your post first.
                  </div>
                )}
                {/* Challenge Destination Selection */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-semibold text-white flex items-center gap-1.5">
                      <Trophy size={14} className="text-[#3B82FF]" />
                      <span>Select Target Challenge</span>
                    </label>
                    <span className="text-[11px] font-mono text-[#9298A3]">
                      {joinedChallenges.length} active
                    </span>
                  </div>

                  {joinedChallenges.length === 0 ? (
                    <div className="p-4 rounded-2xl bg-[#101010] border border-[#20242C] text-center text-[#9298A3]">
                      <Trophy size={24} className="mx-auto text-[#2166FF] mb-2 opacity-60" />
                      <p className="text-xs font-semibold text-white mb-1">No Active Challenges Joined</p>
                      <p className="text-[11px] text-[#9298A3]">Join or create a challenge to start posting daily proofs.</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {joinedChallenges.map((ch) => {
                        const isSelected = selectedChallenge?.id === ch.id;
                        return (
                          <button
                            key={ch.id}
                            type="button"
                            onClick={() => setSelectedChallengeId(ch.id)}
                            className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                              isSelected
                                ? 'bg-[#2166FF]/15 border-[#2166FF] text-white shadow-sm shadow-[#2166FF]/20'
                                : 'bg-[#101010] border-[#20242C] text-[#9298A3] hover:text-white hover:border-white/20'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`font-bold text-xs truncate ${isSelected ? 'text-white' : 'text-gray-200'}`}>
                                  {ch.title}
                                </span>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 uppercase">
                                  {ch.type}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#9298A3] mt-0.5 truncate">{ch.description}</p>
                            </div>
                            <div className="shrink-0 text-right font-mono text-[11px]">
                              <span className="text-[#3B82FF] font-bold">Day {ch.current}</span>
                              <span className="text-[#9298A3]">/{ch.target}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Proof Preview */}
                <div className="p-3.5 rounded-2xl bg-[#101010] border border-[#20242C] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white text-[11px]">Submitting Proof From Your Post</span>
                    <span className="text-[10px] font-mono text-[#2166FF]">Day {(selectedChallenge?.current || 0) + 1} Proof</span>
                  </div>
                  <p className="text-xs text-white/90 line-clamp-2">{post.content}</p>
                  {(post.imageUrl || (post.mediaUrls && post.mediaUrls.length > 0)) && (
                    <div className="w-full h-24 rounded-xl overflow-hidden border border-[#20242C] bg-black">
                      <img
                        src={post.imageUrl || post.mediaUrls![0]}
                        alt="Proof preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>

                {/* Optional Check-in Note */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-semibold text-white flex items-center gap-1.5">
                      <MessageSquare size={14} className="text-[#3B82FF]" />
                      <span>Check-in Note (Optional)</span>
                    </label>
                    <span className="text-[11px] font-mono text-[#9298A3]">{caption.length}/200</span>
                  </div>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value.slice(0, 200))}
                    placeholder="Add brief note for your cohort (e.g. Day 4 completed: 10km run done)..."
                    className="w-full p-3 bg-[#101010] border border-[#20242C] focus:border-[#3B82FF] rounded-2xl text-xs text-white placeholder-[#9298A3] outline-none transition-colors resize-none leading-relaxed"
                    rows={2}
                  />
                </div>
              </div>
            )
          )}

          {/* Quick Alternative Share Options */}
          <div className="pt-3 border-t border-[#20242C] flex items-center justify-between gap-2">
            <span className="text-[11px] text-[#9298A3] font-medium">Other options:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-xl bg-[#101010] hover:bg-[#1a1f29] border border-[#20242C] text-xs font-semibold text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedLink ? <Check size={13} className="text-emerald-400" /> : <Link size={13} className="text-[#9298A3]" />}
                <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
              </button>
              <button
                type="button"
                onClick={handleSystemShare}
                className="px-3 py-1.5 rounded-xl bg-[#101010] hover:bg-[#1a1f29] border border-[#20242C] text-xs font-semibold text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ExternalLink size={13} className="text-[#9298A3]" />
                <span>Share via...</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="p-4 border-t border-[#20242C] bg-[#0c1017] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-[#101010] hover:bg-[#1a1f29] border border-[#20242C] text-xs font-semibold text-[#9298A3] hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>

          {shareDestination === 'community' ? (
            <button
              type="button"
              onClick={handleShare}
              disabled={!selectedCommunity}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#2166FF] hover:bg-[#1a55d6] disabled:opacity-50 text-xs font-bold text-white flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#2166FF]/25 cursor-pointer"
            >
              <Send size={14} />
              <span>
                Share to {selectedCommunity?.name ? `"${selectedCommunity.name}"` : 'Community'}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleShare}
              disabled={!isRealUserSelf || !selectedChallenge || !hasPhoto || !onShareToChallenge}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#2166FF] hover:bg-[#1a55d6] disabled:opacity-50 text-xs font-bold text-white flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#2166FF]/25 cursor-pointer"
            >
              <Trophy size={14} />
              <span>
                {isRealUserSelf
                  ? !hasPhoto ? 'Add a Photo to Submit Proof' : `Submit Proof to ${selectedChallenge?.title ? `"${selectedChallenge.title}"` : 'Challenge'}`
                  : 'Only Author Can Send to Challenge'}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
