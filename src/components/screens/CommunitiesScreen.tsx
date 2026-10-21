import React, { useState } from 'react';
import { 
  Compass, 
  Plus, 
  Code, 
  Flame, 
  Gamepad2, 
  BookOpen, 
  Palette, 
  Building2, 
  MessageSquare, 
  ChevronRight, 
  Globe, 
  Check, 
  Users, 
  Search,
  ChevronDown,
  ArrowRight,
  Lock,
  Clock
} from 'lucide-react';
import { Author, Community } from '../../types';

interface CommunitiesScreenProps {
  communities: Community[];
  creators: Author[];
  currentUser?: Author;
  onToggleJoin: (communityId: string) => void;
  onOpenCreateCommunity: () => void;
  onNavigateUser: (user: { name: string; username: string }) => void;
  onOpenJoinedCommunities?: () => void;
  onSelectCommunity?: (community: Community) => void;
  onToggleFollow?: (userId: string) => void;
  onRequestJoin?: (communityId: string) => void;
}

export const CommunitiesScreen: React.FC<CommunitiesScreenProps> = ({
  communities,
  creators,
  currentUser,
  onToggleJoin,
  onOpenCreateCommunity,
  onNavigateUser,
  onOpenJoinedCommunities,
  onSelectCommunity,
  onToggleFollow,
  onRequestJoin,
}) => {
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [accessFilter, setAccessFilter] = useState<'All' | 'Public' | 'Joined'>('All');

  const topics = [
    { label: 'All', icon: '🔥', tag: 'All' },
    { label: '#Gardening', icon: '🌱', tag: 'Gardening' },
    { label: '#Medicine', icon: '🩺', tag: 'Medicine' },
    { label: '#Coding', icon: '💻', tag: 'Coding' },
    { label: '#AI & Tech', icon: '🤖', tag: 'Tech' },
    { label: '#Startups', icon: '🚀', tag: 'Startups' },
    { label: '#Fitness', icon: '⚡', tag: 'Fitness' },
    { label: '#Wellness', icon: '🧘', tag: 'Wellness' },
    { label: '#Gaming', icon: '🎮', tag: 'Gaming' },
    { label: '#Design', icon: '🎨', tag: 'Art' },
  ];

  const joinedCount = communities.filter((c) => c.isJoined).length;

  const filteredCommunities = communities.filter((item) => {
    if (accessFilter === 'Joined' && !item.isJoined) return false;
    if (accessFilter === 'Public' && item.isPublic === false) return false;

    if (selectedTopic !== 'All') {
      const matchCategory = item.category.toLowerCase().includes(selectedTopic.toLowerCase()) ||
        item.tags?.some(t => t.toLowerCase().includes(selectedTopic.toLowerCase())) ||
        item.name.toLowerCase().includes(selectedTopic.toLowerCase());
      if (!matchCategory) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.creator?.username.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  const getCommunityIcon = (icon: string, color: string) => {
    switch (icon) {
      case 'code':
        return <Code size={22} className="text-emerald-400" />;
      case 'runner':
        return <Flame size={22} className="text-[#F59E0B]" />;
      case 'gamepad':
        return <Gamepad2 size={22} className="text-[#06B6D4]" />;
      case 'book':
        return <BookOpen size={22} className="text-[#A855F7]" />;
      case 'palette':
        return <Palette size={22} className="text-[#F97316]" />;
      default:
        return <Building2 size={22} style={{ color }} />;
    }
  };

  return (
    <div className="pb-24 pt-2 px-4 animate-fade-in">
      {/* Title & Actions */}
      <div className="flex items-center justify-between gap-2 mb-3 pt-1">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-full bg-[#101010] border border-[#20242C] flex items-center justify-center text-[#3B82FF] shrink-0">
            <Compass size={20} />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-extrabold tracking-tight text-white leading-tight truncate">Explore</h1>
            <p className="text-xs text-[#9298A3] truncate">
              Discover communities & fellow builders
            </p>
          </div>
        </div>

        {/* Create Community Button - Fits mobile phone resolution */}
        <button
          onClick={onOpenCreateCommunity}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#2166FF] hover:bg-[#3B82FF] active:scale-95 text-white shadow-md shadow-[#2166FF]/25 transition-all cursor-pointer shrink-0"
        >
          <Plus size={14} className="stroke-[2.5]" />
          <span>New Community</span>
        </button>
      </div>

      {/* Access Filter & Topic Pills Row */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto no-scrollbar pb-1">
        {/* Filter Dropdown */}
        <div className="relative shrink-0">
          <button
            onClick={() => setFilterMenuOpen(!filterMenuOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#080B10] hover:bg-[#101010] border border-[#20242C] text-xs font-semibold text-white transition-colors cursor-pointer"
          >
            <span>{accessFilter}</span>
            <ChevronDown size={13} className="text-[#9298A3]" />
          </button>

          {filterMenuOpen && (
            <div className="absolute left-0 top-full mt-1.5 w-32 rounded-xl bg-[#080B10] border border-[#20242C] shadow-2xl py-1 z-50">
              {(['All', 'Public', 'Joined'] as const).map((filterOpt) => (
                <button
                  key={filterOpt}
                  onClick={() => {
                    setAccessFilter(filterOpt);
                    setFilterMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs transition-colors hover:bg-[#101010] cursor-pointer ${
                    accessFilter === filterOpt ? 'text-[#2166FF] font-semibold' : 'text-white'
                  }`}
                >
                  {filterOpt}
                </button>
              ))}
            </div>
          )}
        </div>

        {topics.map((t) => (
          <button
            key={t.label}
            onClick={() => setSelectedTopic(t.tag)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              selectedTopic === t.tag
                ? 'bg-[#2166FF] text-white shadow-sm shadow-[#2166FF]/30'
                : 'bg-[#080B10] hover:bg-[#101010] text-[#9298A3] hover:text-white border border-[#20242C]'
            }`}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* My Joined Communities Banner */}
      <div 
        onClick={() => onOpenJoinedCommunities ? onOpenJoinedCommunities() : setAccessFilter('Joined')}
        className="mb-5 p-3.5 rounded-2xl bg-[#080B10] hover:bg-[#101010] border border-[#20242C] transition-all flex items-center justify-between gap-3 cursor-pointer group"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#101010] border border-[#20242C] flex items-center justify-center text-[#3B82FF] shrink-0 group-hover:border-[#2166FF]/40 transition-colors">
            <MessageSquare size={19} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-bold text-white group-hover:text-[#3B82FF] transition-colors truncate">
                My Joined Communities
              </span>
              <span className="text-[10px] font-bold text-[#3B82FF] bg-[#2166FF]/15 px-1.5 py-0.5 rounded-full">
                {joinedCount}
              </span>
            </div>
            <p className="text-[11px] text-[#9298A3] truncate">
              View chat-style updates, discussions & announcements
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs font-semibold text-[#3B82FF] group-hover:underline shrink-0">
          <span>View Chats</span>
          <ChevronRight size={16} />
        </div>
      </div>

      {/* COMMUNITIES Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider">
          <Globe size={15} className="text-[#3B82FF]" />
          <span>COMMUNITIES</span>
        </div>
        <span className="text-[11px] text-[#9298A3] font-mono">
          {filteredCommunities.length} Active Hubs
        </span>
      </div>

      {/* Communities Card List */}
      <div className="space-y-4 mb-6">
        {filteredCommunities.map((community) => {
          return (
            <div
              key={community.id}
              className="rounded-2xl bg-[#090C13] border border-[#1C2230] overflow-hidden transition-all group flex flex-col"
            >
              {/* Banner Area */}
              <div className="h-28 relative bg-[#0E121B] overflow-hidden">
                {community.coverUrl ? (
                  <img
                    src={community.coverUrl}
                    alt={community.name}
                    className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-[#080B10] via-[#101827] to-[#080B10] opacity-80" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#080B10] via-black/30 to-transparent" />

                {/* Top Badges */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md text-[11px] font-semibold text-white border border-white/10">
                    <Globe size={12} className="text-[#3B82FF]" />
                    <span>{community.isPublic !== false ? 'Public Community' : 'Private'}</span>
                  </span>

                  {community.tags && community.tags[0] && (
                    <span className="px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md text-[11px] font-semibold text-white/90 border border-white/10">
                      {community.tags[0]}
                    </span>
                  )}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 pt-1 flex flex-col gap-3">
                {/* Avatar + Title + Join Button */}
                <div className="flex items-start justify-between gap-3 -mt-6 relative z-10">
                  <div className="flex items-end gap-3 min-w-0">
                    <div className="w-14 h-14 rounded-2xl bg-[#101010] border-2 border-[#20242C] flex items-center justify-center shrink-0 shadow-xl overflow-hidden">
                      {community.coverUrl && community.name === 'Growingup' ? (
                        <div className="w-full h-full bg-emerald-950/80 font-mono text-[9px] text-emerald-400 p-1 flex items-center justify-center font-bold tracking-tighter">
                          &gt;CODE_
                        </div>
                      ) : (
                        getCommunityIcon(community.icon, community.accentColor)
                      )}
                    </div>

                    <div className="min-w-0 pb-0.5">
                      <h3 className="text-base font-bold text-white group-hover:text-[#3B82FF] transition-colors truncate">
                        {community.name}
                      </h3>
                      {community.creator && (
                        <p className="text-xs text-[#9298A3]">
                          Mod:{' '}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigateUser(community.creator!);
                            }}
                            className="text-white hover:text-[#3B82FF] font-medium hover:underline cursor-pointer"
                          >
                            @{community.creator.username}
                          </button>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Joined / Join Button */}
                  {(() => {
                    const isPending = community.pendingJoinRequests?.some(
                      (r) => r.user.username === currentUser?.username
                    );

                    if (community.isJoined) {
                      return (
                        <button
                          type="button"
                          onClick={() => onToggleJoin(community.id)}
                          className="px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all shrink-0 cursor-pointer flex items-center gap-1.5 bg-[#101010] text-emerald-400 border border-[#20242C] hover:bg-[#1a1f29]"
                        >
                          <Check size={14} className="text-emerald-400" />
                          <span>Joined</span>
                        </button>
                      );
                    }

                    if (!community.isPublic) {
                      if (isPending) {
                        return (
                          <div className="px-3.5 py-1.5 rounded-full text-xs font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 flex items-center gap-1.5 shrink-0">
                            <Clock size={13} />
                            <span>Requested</span>
                          </div>
                        );
                      }

                      return (
                        <button
                          type="button"
                          onClick={() => onRequestJoin ? onRequestJoin(community.id) : onToggleJoin(community.id)}
                          className="px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all shrink-0 cursor-pointer flex items-center gap-1.5 bg-[#2166FF] hover:bg-[#3B82FF] active:scale-95 text-white shadow-md shadow-[#2166FF]/25"
                        >
                          <Lock size={12} />
                          <span>Request Join</span>
                        </button>
                      );
                    }

                    return (
                      <button
                        type="button"
                        onClick={() => onToggleJoin(community.id)}
                        className="px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all shrink-0 cursor-pointer flex items-center gap-1.5 bg-[#2166FF] hover:bg-[#3B82FF] active:scale-95 text-white shadow-md shadow-[#2166FF]/25"
                      >
                        <span>+ Join</span>
                      </button>
                    );
                  })()}
                </div>

                {/* Description */}
                <p className="text-xs text-white/90 leading-relaxed">
                  {community.description}
                </p>

                {/* Footer Meta Row */}
                <div className="pt-2 border-t border-[#20242C]/60 flex items-center justify-between text-xs text-[#9298A3]">
                  <div className="flex items-center gap-1.5 font-mono">
                    <Users size={13} />
                    <span>
                      {community.membersCount >= 1000
                        ? `${(community.membersCount / 1000).toFixed(1)}k`
                        : community.membersCount}{' '}
                      members
                    </span>
                    <span>•</span>
                    <span>{community.isPublic !== false ? 'Open Access' : 'Private'}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectCommunity?.(community)}
                    className="flex items-center gap-1 text-[#3B82FF] hover:underline font-semibold cursor-pointer"
                  >
                    <span>Explore Hub</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredCommunities.length === 0 && (
          <div className="py-14 text-center text-[#9298A3] px-4 bg-[#080B10] rounded-2xl border border-[#20242C] space-y-3">
            <Compass size={28} className="mx-auto text-[#2166FF] mb-1 opacity-70" />
            <div>
              <p className="text-sm font-semibold text-white mb-0.5">No communities found</p>
              <p className="text-xs text-[#9298A3]">Try selecting another topic filter or create your own hub.</p>
            </div>
            <button
              type="button"
              onClick={onOpenCreateCommunity}
              className="px-4 py-2 rounded-xl bg-[#2166FF] hover:bg-[#3B82FF] text-white text-xs font-semibold cursor-pointer shadow-md transition-colors"
            >
              Create Community
            </button>
          </div>
        )}
      </div>

      {/* MATCHING CREATORS SECTION */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider">
            <Users size={15} className="text-[#3B82FF]" />
            <span>MATCHING CREATORS & BUILDERS</span>
          </div>
        </div>

        <div className="space-y-2.5">
          {creators.map((creator) => (
            <div
              key={creator.id}
              onClick={() => onNavigateUser(creator)}
              className="p-3.5 rounded-2xl bg-[#080B10] hover:bg-[#101010] border border-[#20242C] transition-all flex items-center justify-between gap-3 cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={creator.avatar}
                  alt={creator.name}
                  className="w-10 h-10 rounded-full object-cover border border-[#20242C] group-hover:border-[#2166FF] transition-colors shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white group-hover:text-[#3B82FF] transition-colors truncate">
                    {creator.name}
                  </h4>
                  <p className="text-[11px] text-[#9298A3] font-mono truncate">
                    @{creator.username}
                  </p>
                  {creator.bio && (
                    <p className="text-[11px] text-white/80 line-clamp-1 mt-0.5">
                      {creator.bio}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFollow?.(creator.id);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  creator.isFollowing
                    ? 'bg-[#101010] text-[#9298A3] border border-[#20242C] hover:text-white'
                    : 'bg-[#2166FF] hover:bg-[#3B82FF] text-white shadow-sm'
                }`}
              >
                {creator.isFollowing ? 'Following' : 'Follow'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
