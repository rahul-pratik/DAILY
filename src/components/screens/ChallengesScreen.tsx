import React, { useState } from 'react';
import { 
  ChevronRight, 
  Plus, 
  Trophy, 
  BookOpen, 
  Code, 
  Camera, 
  Flame, 
  MessageSquare, 
  Search, 
  Users, 
  Target, 
  Check, 
  Clock,
  Calendar
} from 'lucide-react';
import { Author, Challenge } from '../../types';

interface ChallengesScreenProps {
  challenges: Challenge[];
  currentUser?: Author;
  onSelectChallenge: (challenge: Challenge) => void;
  onOpenCreateChallenge: () => void;
  onCheckIn: (challengeId: string) => void;
  onNavigateUser: (user: { name: string; username: string }) => void;
  onOpenCohortDiscussions: (challenge?: Challenge, mode?: 'list' | 'detail') => void;
  onAddToTodoList: (challenge: Challenge) => void;
  onToggleFollow?: (userId: string) => void;
  toDoChallengeIds?: string[];
}

export const ChallengesScreen: React.FC<ChallengesScreenProps> = ({
  challenges,
  currentUser,
  onSelectChallenge,
  onOpenCreateChallenge,
  onCheckIn,
  onNavigateUser,
  onOpenCohortDiscussions,
  onAddToTodoList,
  onToggleFollow,
  toDoChallengeIds = [],
}) => {
  const [viewMode, setViewMode] = useState<'challenges' | 'manage_squads'>('challenges');
  const [activeFilter, setActiveFilter] = useState<'all' | 'squads' | 'solo' | 'joined'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('#All Tags');

  const tags = ['#All Tags', '#Reading', '#Coding', '#Fitness', '#Habits', '#Building'];

  // Filter challenges
  const filteredChallenges = challenges.filter((ch) => {
    // Filter by type / joined
    if (activeFilter === 'squads' && ch.type !== 'squad') return false;
    if (activeFilter === 'solo' && ch.type !== 'solo') return false;
    if (activeFilter === 'joined' && !ch.joined) return false;

    // Filter by tag
    if (selectedTag !== '#All Tags') {
      const matchTag = ch.tags?.some(t => t.toLowerCase() === selectedTag.toLowerCase()) || 
        (selectedTag === '#Reading' && ch.category === 'reading') ||
        (selectedTag === '#Fitness' && ch.category === 'fitness') ||
        (selectedTag === '#Coding' && (ch.category === 'building' || ch.category === 'learning'));
      if (!matchTag) return false;
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = ch.title.toLowerCase().includes(q) ||
        ch.description.toLowerCase().includes(q) ||
        (ch.whatYouPerform && ch.whatYouPerform.toLowerCase().includes(q)) ||
        (ch.creator?.name.toLowerCase().includes(q));
      if (!match) return false;
    }

    return true;
  });

  const getChallengeIcon = (iconName: string) => {
    switch (iconName) {
      case 'runner':
        return <Flame size={22} className="text-[#F59E0B]" />;
      case 'book':
        return <BookOpen size={22} className="text-[#3B82FF]" />;
      case 'code':
        return <Code size={22} className="text-[#06B6D4]" />;
      case 'camera':
        return <Camera size={22} className="text-[#EC4899]" />;
      default:
        return <Trophy size={22} className="text-[#3B82FF]" />;
    }
  };

  return (
    <div className="pb-24 pt-2 px-4 animate-fade-in">
      {/* Title & New Challenge Button */}
      <div className="flex items-start justify-between mb-3 pt-1">
        <div>
          <div className="flex items-center gap-2">
            <Trophy size={22} className="text-[#2166FF]" />
            <h1 className="text-xl font-extrabold tracking-tight text-white">Challenges & Squads</h1>
          </div>
          <p className="text-xs text-[#9298A3] mt-0.5">
            Join daily accountability sprints & team squads
          </p>
        </div>

        <button
          onClick={onOpenCreateChallenge}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#2166FF] hover:bg-[#3B82FF] active:scale-95 text-white shadow-md shadow-[#2166FF]/25 transition-all cursor-pointer shrink-0"
        >
          <Plus size={15} className="stroke-[2.5]" />
          <span>New Challenge</span>
        </button>
      </div>

      {/* Top View Selector: All Challenges vs Manage Squads */}
      <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#080B10] border border-[#20242C] rounded-2xl mb-4">
        <button
          onClick={() => setViewMode('challenges')}
          className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            viewMode === 'challenges'
              ? 'bg-[#2166FF] text-white shadow-sm shadow-[#2166FF]/25'
              : 'text-[#9298A3] hover:text-white'
          }`}
        >
          <Trophy size={14} />
          <span>All Challenges</span>
        </button>

        <button
          onClick={() => setViewMode('manage_squads')}
          className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            viewMode === 'manage_squads'
              ? 'bg-[#2166FF] text-white shadow-sm shadow-[#2166FF]/25'
              : 'text-[#9298A3] hover:text-white'
          }`}
        >
          <Users size={14} />
          <span>Manage Squads</span>
        </button>
      </div>

      {viewMode === 'manage_squads' ? (
        /* MANAGE SQUADS SECTION (Team members & recorded proofs and posts) */
        <div className="space-y-5 animate-fade-in">
          <div className="flex items-center justify-between pb-1 border-b border-[#20242C]">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Users size={16} className="text-[#3B82FF]" />
                <span>Manage Squads & Team Members</span>
              </h2>
              <p className="text-[11px] text-[#9298A3]">
                Monitor squad capacities, team members, and all recorded proofs & check-ins
              </p>
            </div>
          </div>

          {challenges.filter(c => c.type === 'squad' || (c.squadMembers && c.squadMembers.length > 0)).map((squadCh) => {
            const members = squadCh.squadMembers || [
              {
                id: 'u2',
                name: squadCh.creator?.name || 'Sarah Jenkins',
                username: squadCh.creator?.username || 'runwithme',
                avatar: squadCh.creator?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                dayReached: squadCh.current || 1,
                role: 'creator' as const,
                isFollowing: true,
              },
              {
                id: 'user_aarav',
                name: 'Aarav Sharma',
                username: 'aarav.codes',
                avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
                dayReached: squadCh.current || 1,
                role: 'member' as const,
              }
            ];

            const proofs = squadCh.squadProofs || [
              {
                id: `sp_def_${squadCh.id}`,
                challengeId: squadCh.id,
                author: {
                  id: 'u2',
                  name: squadCh.creator?.name || 'Sarah Jenkins',
                  username: squadCh.creator?.username || 'runwithme',
                  avatar: squadCh.creator?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                  isFollowing: true,
                },
                dayNumber: squadCh.current || 1,
                note: `Day ${squadCh.current || 1} proof recorded for ${squadCh.title}. Verification complete!`,
                photoUrl: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&auto=format&fit=crop&q=80',
                timestamp: '2h ago',
                likesCount: 12,
                isLiked: true,
              }
            ];

            return (
              <div key={squadCh.id} className="p-4 rounded-3xl bg-[#080B10] border border-[#20242C] space-y-4">
                {/* Squad Header */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#20242C]/70">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-[#101010] border border-[#20242C] flex items-center justify-center shrink-0">
                      {getChallengeIcon(squadCh.icon)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-sm font-bold text-white truncate">
                          {squadCh.title} Squad
                        </h3>
                        <span className="text-[10px] font-bold text-[#3B82FF] bg-[#2166FF]/15 px-2 py-0.5 rounded-full border border-[#2166FF]/20 whitespace-nowrap">
                          {squadCh.category}
                        </span>
                      </div>
                      <p className="text-xs text-[#9298A3] flex items-center gap-1.5 font-mono">
                        <span className="text-emerald-400 font-semibold">
                          {members.length} / {squadCh.maxSquadSize || 5} members allowed
                        </span>
                        <span>•</span>
                        <span>Day {squadCh.current} of {squadCh.target}</span>
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenCohortDiscussions(squadCh)}
                    className="px-3 py-1.5 rounded-xl bg-[#2166FF] hover:bg-[#3B82FF] text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-[#2166FF]/20 transition-all cursor-pointer shrink-0"
                  >
                    <MessageSquare size={13} />
                    <span>Cohort Chat</span>
                  </button>
                </div>

                {/* Team Members Mentioned */}
                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#9298A3] uppercase tracking-wider mb-2.5">
                    <span>Team Members ({members.length})</span>
                    <span className="text-[#3B82FF]">Squad Capacity: {squadCh.maxSquadSize || 5} max</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="p-2.5 rounded-2xl bg-[#101010] border border-[#20242C] flex items-center justify-between gap-2.5"
                      >
                        <div 
                          onClick={() => onNavigateUser({ name: member.name, username: member.username })}
                          className="flex items-center gap-2.5 min-w-0 cursor-pointer group"
                        >
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-9 h-9 rounded-full object-cover border border-[#20242C] group-hover:border-[#2166FF] transition-colors shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-white group-hover:text-[#3B82FF] transition-colors truncate">
                              {member.name}
                            </h4>
                            <div className="flex items-center gap-1.5 text-[10px] text-[#9298A3] font-mono">
                              <span>@{member.username}</span>
                              <span>·</span>
                              <span className="text-[#3B82FF]">Day {member.dayReached || squadCh.current}</span>
                            </div>
                          </div>
                        </div>

                        {/* Follow Button for Squad Member */}
                        {member.username !== currentUser?.username && onToggleFollow && (
                          <button
                            type="button"
                            onClick={() => onToggleFollow(member.id || member.username)}
                            className={`px-2 py-1 rounded-full text-[10px] font-semibold transition-all shrink-0 cursor-pointer ${
                              member.isFollowing
                                ? 'bg-[#1a1f29] text-[#9298A3] border border-[#20242C] hover:text-white'
                                : 'bg-[#2166FF]/20 hover:bg-[#2166FF] text-[#3B82FF] hover:text-white border border-[#2166FF]/30'
                            }`}
                          >
                            {member.isFollowing ? 'Following' : '+ Follow'}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recorded Proofs and Posts */}
                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#9298A3] uppercase tracking-wider mb-2">
                    <span>Recorded Team Proofs & Posts</span>
                    <span className="text-xs text-emerald-400 font-mono">{proofs.length} Verified</span>
                  </div>

                  <div className="space-y-2">
                    {proofs.map((proof) => (
                      <div
                        key={proof.id}
                        className="p-3 rounded-2xl bg-[#101010]/80 border border-[#20242C] flex items-start gap-3"
                      >
                        {proof.photoUrl && (
                          <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-[#20242C] bg-[#080B10]">
                            <img
                              src={proof.photoUrl}
                              alt="Proof"
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span 
                              onClick={() => onNavigateUser(proof.author)}
                              className="text-xs font-bold text-white hover:text-[#3B82FF] cursor-pointer truncate"
                            >
                              {proof.author.name}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#2166FF]/15 text-[#3B82FF] border border-[#2166FF]/20 whitespace-nowrap">
                              Day {proof.dayNumber}
                            </span>
                          </div>

                          <p className="text-xs text-white/90 line-clamp-2 mb-1 leading-relaxed">
                            {proof.note}
                          </p>

                          <div className="flex items-center gap-3 text-[10px] text-[#9298A3] font-mono">
                            <span>{proof.timestamp}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-[#3B82FF]">
                              <Flame size={11} /> {proof.likesCount} check-in cheers
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ALL CHALLENGES VIEW */
        <>
          {/* Cohort Discussions Banner */}
          <div 
            onClick={() => onOpenCohortDiscussions(undefined, 'list')}
            className="mb-4 p-3.5 rounded-2xl bg-[#080B10] hover:bg-[#101010] border border-[#20242C] transition-all flex items-center justify-between gap-3 cursor-pointer group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#101010] border border-[#20242C] flex items-center justify-center text-[#3B82FF] shrink-0 group-hover:border-[#2166FF]/40 transition-colors">
                <MessageSquare size={19} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-bold text-white group-hover:text-[#3B82FF] transition-colors truncate">
                    Challenge Cohort Discussions
                  </span>
                  <span className="text-[10px] font-bold text-[#3B82FF] bg-[#2166FF]/15 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                    1 Active
                  </span>
                </div>
                <p className="text-[11px] text-[#9298A3] truncate">
                  Tap to view challenge cohorts, proofs & squad chat
                </p>
              </div>
            </div>
            <ChevronRight size={18} className="text-[#9298A3] group-hover:text-white shrink-0 transition-colors" />
          </div>

      {/* Search Input Bar */}
      <div className="relative mb-3">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9298A3]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search challenges by title, tag, or goal..."
          className="w-full bg-[#080B10] border border-[#20242C] rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-[#9298A3] focus:outline-none focus:border-[#2166FF] transition-colors"
        />
      </div>

      {/* Segmented Filter Control */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-[#080B10] border border-[#20242C] rounded-xl mb-3">
        <button
          onClick={() => setActiveFilter('all')}
          className={`py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeFilter === 'all'
              ? 'bg-[#2166FF] text-white shadow-sm'
              : 'text-[#9298A3] hover:text-white'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setActiveFilter('squads')}
          className={`py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
            activeFilter === 'squads'
              ? 'bg-[#2166FF] text-white shadow-sm'
              : 'text-[#9298A3] hover:text-white'
          }`}
        >
          <Users size={12} />
          <span>Squads</span>
        </button>
        <button
          onClick={() => setActiveFilter('solo')}
          className={`py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
            activeFilter === 'solo'
              ? 'bg-[#2166FF] text-white shadow-sm'
              : 'text-[#9298A3] hover:text-white'
          }`}
        >
          <Target size={12} />
          <span>Solo</span>
        </button>
        <button
          onClick={() => setActiveFilter('joined')}
          className={`py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
            activeFilter === 'joined'
              ? 'bg-[#2166FF] text-white shadow-sm'
              : 'text-[#9298A3] hover:text-white'
          }`}
        >
          <Check size={12} />
          <span>Joined</span>
        </button>
      </div>

      {/* Tag Filter Pills */}
      <div className="flex items-center gap-1.5 mb-4 overflow-x-auto no-scrollbar pb-1">
        {tags.map((tag) => (
          <button
            key={tag}
            onClick={() => setSelectedTag(tag)}
            className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all whitespace-nowrap cursor-pointer ${
              selectedTag === tag
                ? 'bg-white text-black font-semibold'
                : 'bg-[#080B10] hover:bg-[#101010] text-[#9298A3] hover:text-white border border-[#20242C]'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Challenge Cards List */}
      <div className="space-y-4">
        {filteredChallenges.map((challenge) => {
          const isFinished = challenge.current >= challenge.target;
          const progressPercent = Math.min(
            100,
            Math.round((challenge.current / challenge.target) * 100)
          );
          const isInToDo = toDoChallengeIds.includes(challenge.id);

          return (
            <div
              key={challenge.id}
              className="p-4 rounded-3xl bg-[#080B10] border border-[#20242C] transition-all flex flex-col gap-3 group"
            >
              {/* Card Meta Badges Row */}
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#2166FF]/15 text-[#3B82FF] font-semibold border border-[#2166FF]/20">
                    {challenge.type === 'squad' ? <Users size={11} /> : <Target size={11} />}
                    <span>{challenge.type === 'squad' ? 'Squad Sprint' : 'Solo Focus'}</span>
                  </span>

                  {challenge.tags && challenge.tags[0] && (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#101010] text-[#9298A3] font-medium border border-[#20242C]">
                      {challenge.tags[0]}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-[#9298A3] font-mono">
                  <Clock size={12} />
                  <span>{challenge.durationDays || challenge.target}d</span>
                  <span>•</span>
                  <Users size={12} />
                  <span>{challenge.participantsCount || 3} joined</span>
                </div>
              </div>

              {/* Title & Creator Row */}
              <div className="flex items-start gap-3">
                <div 
                  onClick={() => onSelectChallenge(challenge)}
                  className="w-12 h-12 rounded-2xl bg-[#101010] border border-[#20242C] flex items-center justify-center shrink-0 cursor-pointer hover:border-[#2166FF]/50 transition-colors"
                >
                  {getChallengeIcon(challenge.icon)}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 
                    onClick={() => onSelectChallenge(challenge)}
                    className="text-base font-bold text-white hover:text-[#3B82FF] transition-colors cursor-pointer truncate"
                  >
                    {challenge.title}
                  </h3>

                  {challenge.creator && (
                    <div className="flex items-center gap-1.5 text-xs text-[#9298A3] mt-0.5 flex-wrap">
                      <span>Created by</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigateUser(challenge.creator!);
                        }}
                        className="text-white hover:text-[#3B82FF] font-medium hover:underline transition-colors cursor-pointer"
                      >
                        {challenge.creator.name}
                      </button>

                      {/* Follow Button for Challenge Creator */}
                      {challenge.creator.username !== currentUser?.username && onToggleFollow && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFollow(challenge.creator?.username || '');
                          }}
                          className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#2166FF]/20 hover:bg-[#2166FF] text-[#3B82FF] hover:text-white border border-[#2166FF]/30 transition-all cursor-pointer"
                        >
                          + Follow
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Add to To-Do List Option in Every Challenge */}
                <button
                  type="button"
                  onClick={() => onAddToTodoList(challenge)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all shrink-0 cursor-pointer ${
                    isInToDo
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-[#101010] hover:bg-[#1a1f29] text-[#9298A3] hover:text-white border border-[#20242C]'
                  }`}
                  title="Add this challenge to your accountability to-do list"
                >
                  {isInToDo ? <Check size={11} /> : <Calendar size={11} className="text-[#3B82FF]" />}
                  <span>{isInToDo ? 'In To-Do' : '+ To-Do'}</span>
                </button>
              </div>

              {/* WHAT YOU PERFORM Container */}
              {challenge.whatYouPerform && (
                <div 
                  onClick={() => onSelectChallenge(challenge)}
                  className="p-3 rounded-2xl bg-[#101010]/80 border border-[#20242C]/80 cursor-pointer hover:border-[#20242C] transition-colors"
                >
                  <div className="flex items-center gap-1 text-[11px] font-bold text-[#3B82FF] uppercase tracking-wider mb-1">
                    <Target size={13} />
                    <span>WHAT YOU PERFORM</span>
                  </div>
                  <p className="text-xs text-white/95 leading-relaxed">
                    {challenge.whatYouPerform}
                  </p>
                </div>
              )}

              {/* Progress Bar & Counter */}
              <div>
                <div className="flex items-center justify-between text-xs text-[#9298A3] font-mono mb-1.5">
                  <span className="text-white font-medium">
                    Day {challenge.current} of {challenge.target} completed
                  </span>
                  <span className="text-[#3B82FF] font-bold">{progressPercent}%</span>
                </div>

                <div className="w-full h-1.5 bg-[#101010] rounded-full overflow-hidden border border-[#20242C]">
                  <div
                    className="h-full bg-[#2166FF] transition-all duration-500 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Bottom Actions Row */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onOpenCohortDiscussions(challenge)}
                  className="flex-1 py-2 px-3 rounded-xl bg-[#101010] hover:bg-[#1f242e] border border-[#20242C] text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <MessageSquare size={14} className="text-[#9298A3]" />
                  <span>Cohort Chat</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectChallenge(challenge)}
                  className="flex-1 py-2 px-3 rounded-xl bg-[#2166FF] hover:bg-[#3B82FF] active:scale-95 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-[#2166FF]/25 transition-all cursor-pointer"
                >
                  <Flame size={14} />
                  <span>{isFinished ? 'View Details' : '🔥 Enter & Check In'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectChallenge(challenge)}
                  className="w-9 h-9 rounded-xl bg-[#101010] hover:bg-[#20242C] border border-[#20242C] text-[#9298A3] hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  aria-label="View challenge details"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          );
        })}

        {filteredChallenges.length === 0 && (
          <div className="py-16 text-center text-[#9298A3]">
            <Trophy size={32} className="mx-auto text-[#2166FF] mb-2 opacity-60" />
            <p className="text-sm font-medium text-white mb-1">No challenges found</p>
            <p className="text-xs text-[#9298A3]">Create a new challenge to kick off a sprint!</p>
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
};
