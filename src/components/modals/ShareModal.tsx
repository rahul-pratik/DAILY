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
  ExternalLink
} from 'lucide-react';
import { Author, Community, Post } from '../../types';

interface ShareModalProps {
  isOpen: boolean;
  post: Post | null;
  currentUser: Author;
  joinedCommunities: Community[];
  onClose: () => void;
  onShareToCommunity: (data: {
    originalPost: Post;
    targetCommunity: Community;
    caption: string;
    mentionRealUser: boolean;
  }) => void;
  onCopyLink?: (post: Post) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  post,
  currentUser,
  joinedCommunities,
  onClose,
  onShareToCommunity,
  onCopyLink,
}) => {
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>(
    joinedCommunities[0]?.id || ''
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [caption, setCaption] = useState('');
  const [mentionRealUser, setMentionRealUser] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  // If no initial selection, choose the first joined community
  React.useEffect(() => {
    if (joinedCommunities.length > 0 && (!selectedCommunityId || !joinedCommunities.some(c => c.id === selectedCommunityId))) {
      setSelectedCommunityId(joinedCommunities[0].id);
    }
  }, [joinedCommunities, selectedCommunityId]);

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

  if (!isOpen || !post) return null;

  const isRealUserSelf = post.author.id === currentUser.id || post.author.username === currentUser.username;
  const realAuthorHandle = post.author.username;
  const realAuthorName = post.author.name;

  const handleShare = () => {
    if (!selectedCommunity) return;
    onShareToCommunity({
      originalPost: post,
      targetCommunity: selectedCommunity,
      caption: caption.trim(),
      mentionRealUser,
    });
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
              <Share2 size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Share to Community</span>
                <span className="text-[10px] font-mono font-semibold bg-[#2166FF]/20 text-[#3B82FF] px-2 py-0.5 rounded-full border border-[#2166FF]/30">
                  Post
                </span>
              </h2>
              <p className="text-[11px] text-[#9298A3]">
                Repost to your joined community with your commentary & author mention
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

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto p-4 space-y-4 text-xs">
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

              {/* Media Thumbnail */}
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

            {/* Quick Inspiration Chips */}
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
        </div>
      </div>
    </div>
  );
};
