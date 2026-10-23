import React, { useState, useEffect } from 'react';
import { Search, X, Users, Trophy, Loader2, Clock, Trash2, TrendingUp, Sparkles } from 'lucide-react';
import { Author, Challenge, Community, Post } from '../../types';
import { supabase } from '../../lib/supabase';
import { OTHER_USERS } from '../../data/initialData';

const RECENT_SEARCHES_KEY = 'daily_recent_searches';

interface SearchModalProps {
  posts: Post[];
  communities: Community[];
  challenges: Challenge[];
  creators?: Author[];
  onClose: () => void;
  onSelectPost: (post: Post) => void;
  onSelectCommunity: (community: Community) => void;
  onSelectChallenge: (challenge: Challenge) => void;
  onNavigateAuthorProfile?: (author: Author) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  posts,
  communities,
  challenges,
  creators = [],
  onClose,
  onSelectPost,
  onSelectCommunity,
  onSelectChallenge,
  onNavigateAuthorProfile,
}) => {
  const [query, setQuery] = useState('');
  const [supabaseCreators, setSupabaseCreators] = useState<Author[]>([]);
  const [isSearchingProfiles, setIsSearchingProfiles] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.filter(item => typeof item === 'string' && item.trim().length > 0);
        }
      }
    } catch {}
    return [];
  });

  const saveRecentSearch = (searchTerm: string) => {
    const trimmed = searchTerm.trim();
    if (!trimmed) return;
    setRecentSearches(prev => {
      const filtered = prev.filter(q => q.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 10);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const removeRecentSearch = (e: React.MouseEvent, searchTerm: string) => {
    e.stopPropagation();
    setRecentSearches(prev => {
      const updated = prev.filter(q => q !== searchTerm);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const clearAllRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {}
  };

  // Search Supabase profiles in real-time when query changes
  useEffect(() => {
    const clean = query.trim().toLowerCase().replace(/^@/, '');
    if (!clean) {
      setSupabaseCreators([]);
      setIsSearchingProfiles(false);
      return;
    }

    setIsSearchingProfiles(true);
    const timeoutId = setTimeout(async () => {
      try {
        let results: any[] = [];
        
        // 1. Try flexible OR search
        const { data: orData, error: orErr } = await supabase
          .from('profiles')
          .select('*')
          .or(`username.ilike.%${clean}%,name.ilike.%${clean}%`)
          .limit(25);

        if (!orErr && orData && orData.length > 0) {
          results = orData;
        } else {
          // Fallback: search username directly
          const { data: userMatches } = await supabase
            .from('profiles')
            .select('*')
            .ilike('username', `%${clean}%`)
            .limit(25);

          if (userMatches && userMatches.length > 0) {
            results = userMatches;
          } else {
            // Fallback: search name directly
            const { data: nameMatches } = await supabase
              .from('profiles')
              .select('*')
              .ilike('name', `%${clean}%`)
              .limit(25);
            if (nameMatches) results = nameMatches;
          }
        }

        if (results && results.length > 0) {
          const mapped: Author[] = results.map((p: any) => ({
            id: p.id,
            name: p.name || 'Builder',
            username: p.username || 'builder',
            avatar: p.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
            bio: p.bio || '',
            followersCount: p.followers_count || 0,
            followingCount: p.following_count || 0,
            accountabilityHubPrivacy: (p.accountability_hub_privacy as 'public' | 'private') || 'public',
            isCurrentUser: false,
          }));
          setSupabaseCreators(mapped);
        } else {
          setSupabaseCreators([]);
        }
      } catch (err) {
        console.warn('Search profiles error:', err);
        setSupabaseCreators([]);
      } finally {
        setIsSearchingProfiles(false);
      }
    }, 150);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Combine local creators, known other users, and Supabase accounts
  const knownLocalCreators: Author[] = [
    ...creators,
    ...Object.values(OTHER_USERS),
  ];

  const filteredLocalCreators = query.trim()
    ? knownLocalCreators.filter(
        (cr) =>
          cr.name.toLowerCase().includes(query.toLowerCase()) ||
          cr.username.toLowerCase().includes(query.toLowerCase()) ||
          (cr.bio && cr.bio.toLowerCase().includes(query.toLowerCase()))
      )
    : [];

  const creatorsMap = new Map<string, Author>();
  filteredLocalCreators.forEach((c) => creatorsMap.set(c.username.toLowerCase(), c));
  supabaseCreators.forEach((c) => {
    if (!creatorsMap.has(c.username.toLowerCase())) {
      creatorsMap.set(c.username.toLowerCase(), c);
    }
  });
  const allFoundCreators = Array.from(creatorsMap.values());

  const filteredPosts = query.trim()
    ? posts.filter(
        (p) =>
          p.content.toLowerCase().includes(query.toLowerCase()) ||
          p.author.username.toLowerCase().includes(query.toLowerCase()) ||
          (p.purpose && p.purpose.toLowerCase().includes(query.toLowerCase()))
      )
    : [];

  const filteredCommunities = query.trim()
    ? communities.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.description.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const filteredChallenges = query.trim()
    ? challenges.filter(
        (ch) =>
          ch.title.toLowerCase().includes(query.toLowerCase()) ||
          ch.description.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-start justify-center p-0 sm:p-4 pt-4 sm:pt-16 animate-fade-in"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[#080B10] border border-[#20242C] rounded-2xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden"
      >
        {/* Search Input Bar */}
        <div className="p-3 border-b border-[#20242C] flex items-center gap-2">
          <Search size={18} className="text-[#9298A3]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && query.trim()) {
                saveRecentSearch(query);
              }
            }}
            placeholder="Search posts, challenges, communities..."
            className="flex-1 bg-transparent text-sm text-white placeholder-[#9298A3] focus:outline-none"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-[#9298A3] hover:text-white p-1"
            >
              <X size={16} />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs font-semibold text-[#3B82FF] hover:underline px-2"
          >
            Cancel
          </button>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!query.trim() ? (
            recentSearches.length > 0 ? (
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-xs font-semibold text-[#8A92A6] uppercase tracking-wider flex items-center gap-1.5">
                    <Clock size={13} className="text-[#3B82FF]" />
                    <span>Recent Searches</span>
                  </p>
                  <button
                    type="button"
                    onClick={clearAllRecentSearches}
                    className="text-[11px] text-[#8A92A6] hover:text-red-400 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 size={11} />
                    <span>Clear all</span>
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((item) => (
                    <div
                      key={item}
                      onClick={() => setQuery(item)}
                      className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-[#10141E] hover:bg-[#1A2234] border border-[#202738] hover:border-[#2166FF]/50 text-white/90 transition-all cursor-pointer"
                    >
                      <Clock size={11} className="text-[#8A92A6] group-hover:text-[#3B82FF]" />
                      <span>{item}</span>
                      <button
                        type="button"
                        onClick={(e) => removeRecentSearch(e, item)}
                        className="text-[#8A92A6] hover:text-white ml-0.5 p-0.5 rounded-full hover:bg-white/10"
                        title="Remove search"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-10 text-center text-[#8A92A6] space-y-2">
                <div className="w-10 h-10 rounded-full bg-[#121622] border border-[#202738] flex items-center justify-center mx-auto text-[#3B82FF]">
                  <Search size={18} />
                </div>
                <p className="text-xs font-medium text-white/80">No recent searches</p>
                <p className="text-[11px] text-[#8A92A6] max-w-xs mx-auto">
                  Search for builders, challenges, squads, posts, or tags above.
                </p>
              </div>
            )
          ) : (
            <>
              {/* Creators & Builders */}
              {isSearchingProfiles && allFoundCreators.length === 0 && (
                <div className="py-3 px-2 flex items-center gap-2 text-xs text-[#9298A3]">
                  <Loader2 size={13} className="animate-spin text-[#3B82FF]" />
                  <span>Searching accounts & builders...</span>
                </div>
              )}

              {allFoundCreators.length > 0 && (
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-[#9298A3] mb-2">
                    <div className="flex items-center gap-1.5">
                      <Users size={14} className="text-[#3B82FF]" />
                      <span>Accounts & Builders ({allFoundCreators.length})</span>
                    </div>
                    {isSearchingProfiles && (
                      <Loader2 size={12} className="animate-spin text-[#3B82FF]" />
                    )}
                  </div>
                  <div className="space-y-1.5">
                    {allFoundCreators.map((creator) => (
                      <div
                        key={creator.id || creator.username}
                        onClick={() => {
                          saveRecentSearch(creator.name || creator.username);
                          onNavigateAuthorProfile?.(creator);
                          onClose();
                        }}
                        className="p-2.5 rounded-xl bg-[#101010] hover:bg-[#1a1f29] border border-[#20242C] cursor-pointer flex items-center justify-between transition-colors group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={creator.avatar}
                            alt={creator.name}
                            className="w-8 h-8 rounded-full object-cover border border-[#20242C] group-hover:border-[#3B82FF]"
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0">
                            <span className="text-xs font-semibold text-white block truncate">{creator.name}</span>
                            <span className="text-[11px] text-[#3B82FF] font-mono block">@{creator.username}</span>
                            {creator.bio && (
                              <p className="text-[10px] text-[#9298A3] line-clamp-1">{creator.bio}</p>
                            )}
                          </div>
                        </div>
                        <span className="text-[11px] text-[#3B82FF] font-semibold px-2.5 py-1 rounded-lg bg-[#2166FF]/10 border border-[#2166FF]/20 group-hover:bg-[#2166FF] group-hover:text-white transition-all">
                          View
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Communities */}
              {filteredCommunities.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#9298A3] mb-2">
                    <Users size={14} className="text-[#3B82FF]" />
                    <span>Communities</span>
                  </div>
                  <div className="space-y-1.5">
                    {filteredCommunities.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          saveRecentSearch(c.name);
                          onSelectCommunity(c);
                          onClose();
                        }}
                        className="p-2.5 rounded-xl bg-[#101010] hover:bg-[#1a1f29] border border-[#20242C] cursor-pointer flex items-center justify-between"
                      >
                        <span className="text-xs font-semibold text-white">{c.name}</span>
                        <span className="text-[11px] text-[#9298A3]">
                          {(c.membersCount / 1000).toFixed(1)}k members
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Challenges */}
              {filteredChallenges.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#9298A3] mb-2">
                    <Trophy size={14} className="text-[#3B82FF]" />
                    <span>Challenges</span>
                  </div>
                  <div className="space-y-1.5">
                    {filteredChallenges.map((ch) => (
                      <div
                        key={ch.id}
                        onClick={() => {
                          saveRecentSearch(ch.title);
                          onSelectChallenge(ch);
                          onClose();
                        }}
                        className="p-2.5 rounded-xl bg-[#101010] hover:bg-[#1a1f29] border border-[#20242C] cursor-pointer flex items-center justify-between"
                      >
                        <span className="text-xs font-semibold text-white">{ch.title}</span>
                        <span className="text-[11px] text-[#9298A3]">{ch.current}/{ch.target}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Posts */}
              {filteredPosts.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#9298A3] mb-2">
                    <TrendingUp size={14} className="text-[#3B82FF]" />
                    <span>Posts</span>
                  </div>
                  <div className="space-y-1.5">
                    {filteredPosts.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          saveRecentSearch(query || p.content.slice(0, 30));
                          onSelectPost(p);
                          onClose();
                        }}
                        className="p-2.5 rounded-xl bg-[#101010] hover:bg-[#1a1f29] border border-[#20242C] cursor-pointer"
                      >
                        <div className="flex items-center justify-between text-[11px] text-[#9298A3] mb-1">
                          <span className="font-semibold text-white">{p.author.username}</span>
                          <span>{p.timestamp}</span>
                        </div>
                        <p className="text-xs text-white/90 line-clamp-1">{p.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {allFoundCreators.length === 0 &&
                filteredCommunities.length === 0 &&
                filteredChallenges.length === 0 &&
                filteredPosts.length === 0 &&
                !isSearchingProfiles && (
                  <div className="py-12 text-center text-xs text-[#9298A3]">
                    No accounts, posts, or communities found for "{query}".
                  </div>
                )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
