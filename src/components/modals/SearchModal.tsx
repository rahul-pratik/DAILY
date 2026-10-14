import React, { useState } from 'react';
import { Search, X, TrendingUp, Users, Trophy } from 'lucide-react';
import { Author, Challenge, Community, Post } from '../../types';

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

  const filteredCreators = query.trim()
    ? creators.filter(
        (cr) =>
          cr.name.toLowerCase().includes(query.toLowerCase()) ||
          cr.username.toLowerCase().includes(query.toLowerCase()) ||
          (cr.bio && cr.bio.toLowerCase().includes(query.toLowerCase()))
      )
    : [];

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
            <div>
              <p className="text-xs font-semibold text-[#9298A3] mb-2 uppercase tracking-wider">
                Trending Topics
              </p>
              <div className="flex flex-wrap gap-2">
                {['#BuildInPublic', 'TypeScript', '10K Run', 'Design Systems', 'Indie Hacking'].map(
                  (tag) => (
                    <button
                      key={tag}
                      onClick={() => setQuery(tag.replace('#', ''))}
                      className="px-3 py-1 rounded-full text-xs bg-[#101010] hover:bg-[#20242C] border border-[#20242C] text-white/90 transition-colors"
                    >
                      {tag}
                    </button>
                  )
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Creators & Builders */}
              {filteredCreators.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#9298A3] mb-2">
                    <Users size={14} className="text-[#3B82FF]" />
                    <span>Creators & Builders</span>
                  </div>
                  <div className="space-y-1.5">
                    {filteredCreators.map((creator) => (
                      <div
                        key={creator.id}
                        onClick={() => {
                          onNavigateAuthorProfile?.(creator);
                          onClose();
                        }}
                        className="p-2.5 rounded-xl bg-[#101010] hover:bg-[#1a1f29] border border-[#20242C] cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={creator.avatar}
                            alt={creator.name}
                            className="w-7 h-7 rounded-full object-cover border border-[#20242C]"
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0">
                            <span className="text-xs font-semibold text-white block truncate">{creator.name}</span>
                            <span className="text-[11px] text-[#9298A3] block">@{creator.username}</span>
                          </div>
                        </div>
                        <span className="text-[11px] text-[#3B82FF] font-semibold">View</span>
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

              {filteredCommunities.length === 0 &&
                filteredChallenges.length === 0 &&
                filteredPosts.length === 0 && (
                  <div className="py-12 text-center text-xs text-[#9298A3]">
                    No matches found for "{query}".
                  </div>
                )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
