import React, { useState } from 'react';
import { 
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
  Calendar, 
  AlertTriangle, 
  UserPlus, 
  CheckCircle2, 
  X, 
  ChevronRight, 
  ShieldCheck, 
  Send,
  BarChart3,
  Activity,
  Sparkles
} from 'lucide-react';
import { Author, Challenge, Squad, SquadMember } from '../../types';

interface ChallengesScreenProps {
  challenges: Challenge[];
  currentUser?: Author;
  squads?: Squad[];
  allUsers?: Author[];
  onSelectChallenge: (challenge: Challenge) => void;
  onOpenCreateChallenge: () => void;
  onCheckIn?: (challengeId: string) => void;
  onNavigateUser: (user: { name: string; username: string }) => void;
  onOpenCohortDiscussions: (challenge?: Challenge, mode?: 'list' | 'detail') => void;
  onAddToTodoList: (challenge: Challenge) => void;
  onToggleFollow?: (userId: string) => void;
  toDoChallengeIds?: string[];
  onToggleJoinChallenge?: (challengeId: string) => void;
  onCreateSquad?: (squadData: Partial<Squad>) => void;
  onInviteMemberToSquad?: (squadId: string, username: string) => void;
  onEnterChallengeWithSquad?: (squadId: string, challengeId: string) => void;
  onAcceptSquadEntry?: (squadId: string, username: string) => void;
  onAcceptAllSquadEntry?: (squadId: string) => void;
}

export const ChallengesScreen: React.FC<ChallengesScreenProps> = ({
  challenges,
  currentUser,
  squads = [],
  allUsers = [],
  onSelectChallenge,
  onOpenCreateChallenge,
  onNavigateUser,
  onOpenCohortDiscussions,
  onAddToTodoList,
  onToggleFollow,
  toDoChallengeIds = [],
  onToggleJoinChallenge,
  onCreateSquad,
  onInviteMemberToSquad,
  onEnterChallengeWithSquad,
  onAcceptSquadEntry,
  onAcceptAllSquadEntry,
}) => {
  // Top 3-tab view mode: 'challenges' | 'squad_status' | 'manage_squads'
  const [viewMode, setViewMode] = useState<'challenges' | 'squad_status' | 'manage_squads'>('challenges');
  const [activeFilter, setActiveFilter] = useState<'all' | 'squads' | 'solo' | 'joined'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('#All Tags');

  // Track which members missed their daily photo proof / check-in
  // Map of squadId/challengeId -> list of usernames who missed
  const [squadFailedMembers, setSquadFailedMembers] = useState<Record<string, string[]>>({});

  // Track daily check-in completion for Squad Status progress tracking
  // Map of squadId -> set of usernames who completed today's check-in
  const [squadCheckedInMap, setSquadCheckedInMap] = useState<Record<string, string[]>>({
    squad_run5k: ['runwithme', 'aarav.codes', 'devin.creates'], // 3 of 4 checked in initially
    squad_code_obsidian: ['aarav.codes', 'runwithme', 'elena.ai', 'devin.creates', 'creator'], // 5 of 5 checked in initially
  });

  // Modal states
  const [isCreateSquadModalOpen, setIsCreateSquadModalOpen] = useState(false);
  const [newSquadName, setNewSquadName] = useState('');
  const [newSquadChallengeId, setNewSquadChallengeId] = useState(challenges[0]?.id || 'ch_run5k');
  const [newSquadRequiredSize, setNewSquadRequiredSize] = useState<number>(5);
  const [selectedInviteUsernames, setSelectedInviteUsernames] = useState<string[]>([]);

  // Invite modal for existing squad
  const [invitingSquadId, setInvitingSquadId] = useState<string | null>(null);
  const [inviteModalUsername, setInviteModalUsername] = useState('');

  const tags = [
    '#All Tags',
    '#Gardening',
    '#Medicine',
    '#Reading',
    '#Coding',
    '#Fitness',
    '#Habits',
    '#Building',
    '#Science',
    '#Art',
    '#Startups',
    '#Nutrition'
  ];

  // Toggle member check-in status in Squad Status view
  const handleToggleMemberCheckIn = (squadId: string, username: string) => {
    setSquadCheckedInMap(prev => {
      const currentList = prev[squadId] || [];
      const isAlreadyCheckedIn = currentList.includes(username);
      const updated = isAlreadyCheckedIn 
        ? currentList.filter(u => u !== username) 
        : [...currentList, username];
      return { ...prev, [squadId]: updated };
    });

    // If marked as not checked in, also register in squadFailedMembers for streak simulation
    setSquadFailedMembers(prev => {
      const currentFailed = prev[squadId] || [];
      const currentCheckedIn = squadCheckedInMap[squadId] || [];
      const isNowCheckedIn = !currentCheckedIn.includes(username);
      
      if (isNowCheckedIn) {
        return { ...prev, [squadId]: currentFailed.filter(u => u !== username) };
      } else {
        return { ...prev, [squadId]: [...new Set([...currentFailed, username])] };
      }
    });
  };

  // Toggle member failed photo proof status
  const handleToggleMemberProofStatus = (squadId: string, username: string) => {
    setSquadFailedMembers(prev => {
      const currentList = prev[squadId] || [];
      const hasFailed = currentList.includes(username);
      const updated = hasFailed ? currentList.filter(u => u !== username) : [...currentList, username];
      return { ...prev, [squadId]: updated };
    });

    // Keep check-in map aligned
    setSquadCheckedInMap(prev => {
      const currentCheckedIn = prev[squadId] || [];
      const hasFailed = (squadFailedMembers[squadId] || []).includes(username);
      if (hasFailed) {
        // Restoring
        return { ...prev, [squadId]: [...new Set([...currentCheckedIn, username])] };
      } else {
        // Failing
        return { ...prev, [squadId]: currentCheckedIn.filter(u => u !== username) };
      }
    });
  };

  // Filter challenges for the All Challenges view
  const filteredChallenges = challenges.filter((ch) => {
    if (activeFilter === 'squads' && ch.type !== 'squad') return false;
    if (activeFilter === 'solo' && ch.type !== 'solo') return false;
    if (activeFilter === 'joined' && !ch.joined) return false;

    if (selectedTag !== '#All Tags') {
      const cleanTag = selectedTag.toLowerCase().replace('#', '');
      const matchTag = 
        ch.tags?.some(t => t.toLowerCase().includes(cleanTag)) || 
        ch.category.toLowerCase().includes(cleanTag) ||
        ch.title.toLowerCase().includes(cleanTag) ||
        (selectedTag === '#Reading' && (ch.category === 'reading' || ch.category === 'learning')) ||
        (selectedTag === '#Fitness' && (ch.category === 'fitness' || ch.tags?.includes('#Fitness'))) ||
        (selectedTag === '#Coding' && (ch.category === 'building' || ch.tags?.includes('#Coding') || ch.title.toLowerCase().includes('code'))) ||
        (selectedTag === '#Gardening' && (ch.tags?.some(t => t.toLowerCase().includes('garden') || t.toLowerCase().includes('plant')) || ch.title.toLowerCase().includes('garden'))) ||
        (selectedTag === '#Medicine' && (ch.tags?.some(t => t.toLowerCase().includes('med') || t.toLowerCase().includes('health')) || ch.title.toLowerCase().includes('medicine')));
      if (!matchTag) return false;
    }

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

  const handleCreateSquadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSquadName.trim()) return;

    const targetCh = challenges.find(c => c.id === newSquadChallengeId) || challenges[0];
    
    const initialMembers: SquadMember[] = [
      {
        id: currentUser?.id || 'user_aarav',
        name: currentUser?.name || 'Aarav Sharma',
        username: currentUser?.username || 'aarav.codes',
        avatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        dayReached: 1,
        role: 'creator',
      }
    ];

    selectedInviteUsernames.forEach((uname) => {
      const foundUser = allUsers.find(u => u.username === uname);
      if (foundUser) {
        initialMembers.push({
          id: foundUser.id,
          name: foundUser.name,
          username: foundUser.username,
          avatar: foundUser.avatar,
          dayReached: 1,
          role: 'member',
          isFollowing: foundUser.isFollowing,
        });
      }
    });

    onCreateSquad?.({
      name: newSquadName.trim(),
      category: targetCh?.category || 'fitness',
      challengeId: targetCh?.id,
      challengeTitle: targetCh?.title,
      requiredSize: newSquadRequiredSize,
      creator: {
        name: currentUser?.name || 'Aarav Sharma',
        username: currentUser?.username || 'aarav.codes',
        avatar: currentUser?.avatar,
      },
      members: initialMembers,
    });

    setNewSquadName('');
    setSelectedInviteUsernames([]);
    setIsCreateSquadModalOpen(false);
  };

  const handleSendInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitingSquadId || !inviteModalUsername.trim()) return;

    onInviteMemberToSquad?.(invitingSquadId, inviteModalUsername.trim().replace(/^@/, ''));
    setInviteModalUsername('');
    setInvitingSquadId(null);
  };

  return (
    <div className="pb-24 pt-2 px-3 sm:px-4 animate-fade-in max-w-2xl mx-auto">
      {/* Minimal Header */}
      <div className="flex items-center justify-between mb-4 pt-1">
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Trophy size={19} className="text-[#2166FF]" />
            <span>Challenges & Squads</span>
          </h1>
          <p className="text-xs text-[#8A92A6]">
            Daily proof sprints & squad accountability
          </p>
        </div>

        <button
          onClick={onOpenCreateChallenge}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#2166FF] hover:bg-[#3B82FF] active:scale-95 text-white shadow-md shadow-[#2166FF]/25 transition-all cursor-pointer shrink-0"
        >
          <Plus size={14} className="stroke-[2.5]" />
          <span>New Challenge</span>
        </button>
      </div>

      {/* Sleek Minimalist 3-Tab Navigator: Challenges, Squad Status, Manage Squads */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-[#090C13] border border-[#1C2230] rounded-2xl mb-4 shadow-sm">
        <button
          type="button"
          onClick={() => setViewMode('challenges')}
          className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            viewMode === 'challenges'
              ? 'bg-[#2166FF] text-white shadow-sm shadow-[#2166FF]/30 font-bold'
              : 'text-[#8A92A6] hover:text-white'
          }`}
        >
          <Trophy size={13} />
          <span>Challenges</span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode('squad_status')}
          className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            viewMode === 'squad_status'
              ? 'bg-[#2166FF] text-white shadow-sm shadow-[#2166FF]/30 font-bold'
              : 'text-[#8A92A6] hover:text-white'
          }`}
        >
          <Activity size={13} />
          <span>Squad Status</span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode('manage_squads')}
          className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            viewMode === 'manage_squads'
              ? 'bg-[#2166FF] text-white shadow-sm shadow-[#2166FF]/30 font-bold'
              : 'text-[#8A92A6] hover:text-white'
          }`}
        >
          <Users size={13} />
          <span>Manage Squads</span>
        </button>
      </div>

      {/* ================= 1. SQUAD STATUS VIEW ================= */}
      {viewMode === 'squad_status' ? (
        <div className="space-y-4 animate-fade-in">
          {/* Section Subheader */}
          <div className="flex items-center justify-between pb-1">
            <div>
              <h2 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                <BarChart3 size={14} className="text-[#3B82FF]" />
                <span>Daily Squad Check-In Progress</span>
              </h2>
              <p className="text-[11px] text-[#8A92A6]">
                Percentage of members in each squad who completed their daily check-in
              </p>
            </div>
            <span className="text-[10px] font-mono text-[#3B82FF] bg-[#2166FF]/10 px-2 py-0.5 rounded-full border border-[#2166FF]/20">
              Live Tracker
            </span>
          </div>

          {squads.map((squad) => {
            const squadCh = challenges.find(c => c.id === squad.challengeId) || challenges[0];
            const members = squad.members;
            const checkedInList = squadCheckedInMap[squad.id] || members.slice(0, Math.max(1, members.length - 1)).map(m => m.username);
            const checkedInCount = members.filter(m => checkedInList.includes(m.username)).length;
            const totalMembers = members.length;
            const checkInPercent = totalMembers > 0 ? Math.round((checkedInCount / totalMembers) * 100) : 0;
            
            const failedList = squadFailedMembers[squad.id] || [];
            const hasStreakBroken = failedList.length > 0;
            const isFullCheckIn = checkInPercent === 100 && !hasStreakBroken;

            return (
              <div 
                key={squad.id}
                className="p-4 rounded-2xl bg-[#090C13] border border-[#1C2230] hover:border-[#2166FF]/30 transition-all space-y-3.5"
              >
                {/* Squad Meta Top Row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#121622] border border-[#202738] flex items-center justify-center shrink-0">
                      {getChallengeIcon(squadCh?.icon || 'runner')}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white truncate">
                          {squad.name}
                        </h3>
                        <span className="text-[10px] font-semibold text-[#3B82FF] bg-[#2166FF]/15 px-2 py-0.5 rounded-full border border-[#2166FF]/20">
                          {squad.category}
                        </span>
                      </div>
                      <p className="text-xs text-[#8A92A6] truncate mt-0.5">
                        Sprint: <span className="text-white font-medium">{squad.challengeTitle || squadCh?.title}</span>
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenCohortDiscussions(squadCh, 'detail')}
                    className="px-3 py-1.5 rounded-xl bg-[#141926] hover:bg-[#2166FF] text-[#8A92A6] hover:text-white text-xs font-semibold flex items-center gap-1.5 border border-[#202738] hover:border-transparent transition-all cursor-pointer shrink-0"
                  >
                    <MessageSquare size={13} className="text-[#3B82FF]" />
                    <span>Chat</span>
                  </button>
                </div>

                {/* SQUAD DAILY CHECK-IN PROGRESS BAR */}
                <div className="p-3 rounded-xl bg-[#0E121B] border border-[#1A202C] space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-white font-semibold flex items-center gap-1.5">
                      <span className={isFullCheckIn ? 'text-emerald-400' : hasStreakBroken ? 'text-red-400' : 'text-[#3B82FF]'}>
                        {checkedInCount} / {totalMembers} Members Checked In
                      </span>
                    </span>
                    <span className={`font-bold text-xs ${
                      hasStreakBroken 
                        ? 'text-red-400' 
                        : isFullCheckIn 
                        ? 'text-emerald-400' 
                        : 'text-[#3B82FF]'
                    }`}>
                      {checkInPercent}%
                    </span>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full h-2.5 bg-[#080B10] rounded-full overflow-hidden border border-[#202738]/80">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        hasStreakBroken 
                          ? 'bg-red-500' 
                          : isFullCheckIn 
                          ? 'bg-gradient-to-r from-[#2166FF] to-emerald-400' 
                          : 'bg-gradient-to-r from-[#2166FF] to-[#3B82FF]'
                      }`}
                      style={{ width: `${checkInPercent}%` }}
                    />
                  </div>

                  {/* Status Indicator text */}
                  <div className="flex items-center justify-between text-[11px] pt-0.5">
                    {hasStreakBroken ? (
                      <span className="text-red-400 flex items-center gap-1 font-medium">
                        <AlertTriangle size={12} /> Missed check-in detected! Day returned to 0
                      </span>
                    ) : isFullCheckIn ? (
                      <span className="text-emerald-400 flex items-center gap-1 font-medium">
                        <CheckCircle2 size={12} /> 100% check-in achieved! Squad streak safe
                      </span>
                    ) : (
                      <span className="text-[#8A92A6] flex items-center gap-1">
                        <Clock size={12} className="text-[#3B82FF]" />
                        {totalMembers - checkedInCount} member{totalMembers - checkedInCount > 1 ? 's' : ''} pending check-in today
                      </span>
                    )}

                    <span className="text-[10px] text-[#8A92A6] font-mono">
                      Day {hasStreakBroken ? 0 : (squadCh?.current || 1)} / {squadCh?.target || 30}
                    </span>
                  </div>
                </div>

                {/* Member Check-In Avatars Row & Quick Toggles */}
                <div>
                  <div className="flex items-center justify-between text-[11px] text-[#8A92A6] mb-2 font-medium">
                    <span>Squad Member Check-Ins:</span>
                    <span className="text-[10px] text-[#8A92A6]">Tap to toggle check-in</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {members.map((member) => {
                      const isCheckedIn = checkedInList.includes(member.username);
                      return (
                        <div
                          key={member.id}
                          onClick={() => handleToggleMemberCheckIn(squad.id, member.username)}
                          className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                            isCheckedIn
                              ? 'bg-[#101622] border-emerald-500/30 text-white'
                              : 'bg-[#0E121B] border-[#1C2230] text-[#8A92A6] hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="relative shrink-0">
                              <img
                                src={member.avatar}
                                alt={member.name}
                                className="w-7 h-7 rounded-full object-cover border border-[#202738]"
                              />
                              <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                                isCheckedIn ? 'bg-emerald-500 text-black' : 'bg-[#1C2230] text-[#8A92A6]'
                              }`}>
                                {isCheckedIn ? '✓' : '•'}
                              </div>
                            </div>
                            <div className="min-w-0 text-left">
                              <p className="text-xs font-semibold truncate leading-tight">{member.name}</p>
                              <p className="text-[10px] text-[#8A92A6] font-mono truncate">@{member.username}</p>
                            </div>
                          </div>

                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-medium ${
                            isCheckedIn
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-[#141824] text-[#8A92A6] border border-[#202738]'
                          }`}>
                            {isCheckedIn ? 'Checked In' : 'Pending'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}

          {squads.length === 0 && (
            <div className="py-12 text-center text-[#8A92A6] bg-[#090C13] rounded-2xl border border-[#1C2230]">
              <Users size={28} className="mx-auto text-[#2166FF] mb-2 opacity-60" />
              <p className="text-xs font-semibold text-white mb-1">No Squads Available</p>
              <p className="text-[11px] text-[#8A92A6] mb-3">Create a squad in Manage Squads to track daily team check-in percentages.</p>
              <button
                type="button"
                onClick={() => setViewMode('manage_squads')}
                className="px-3.5 py-1.5 rounded-xl bg-[#2166FF] text-white text-xs font-semibold cursor-pointer"
              >
                Go to Manage Squads
              </button>
            </div>
          )}
        </div>
      ) : viewMode === 'manage_squads' ? (
        /* ================= 2. MANAGE SQUADS VIEW ================= */
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between pb-1">
            <div>
              <h2 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                <Users size={14} className="text-[#3B82FF]" />
                <span>Squads & Challenge Members</span>
              </h2>
              <p className="text-[11px] text-[#8A92A6]">
                Manage team rosters, invite members, and enter 5-member sprints
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsCreateSquadModalOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#2166FF] hover:bg-[#3B82FF] active:scale-95 text-white shadow-md shadow-[#2166FF]/25 transition-all cursor-pointer shrink-0"
            >
              <Plus size={13} />
              <span>Create Squad</span>
            </button>
          </div>

          {squads.map((squad) => {
            const squadCh = challenges.find(c => c.id === squad.challengeId) || challenges[0];
            const requiredSize = squad.requiredSize || 5;
            const currentSize = squad.members.length;
            const isEligible = currentSize === requiredSize;
            const entrySession = squad.entrySession;
            const isEntered = entrySession?.status === 'entered' || squadCh?.joined;
            const acceptedCount = entrySession?.acceptedUsernames.length || 0;

            const failedList = squadFailedMembers[squad.id] || [];
            const hasMissed = failedList.length > 0;
            const currentDay = hasMissed ? 0 : (squadCh?.current || 1);

            return (
              <div key={squad.id} className="p-4 rounded-2xl bg-[#090C13] border border-[#1C2230] space-y-3.5">
                {/* Squad Header */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#1C2230]">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#121622] border border-[#202738] flex items-center justify-center shrink-0">
                      {getChallengeIcon(squadCh?.icon || 'runner')}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white truncate">
                          {squad.name}
                        </h3>
                        <span className="text-[10px] font-semibold text-[#3B82FF] bg-[#2166FF]/15 px-2 py-0.5 rounded-full border border-[#2166FF]/20">
                          {squad.category}
                        </span>
                      </div>
                      <p className="text-xs text-[#8A92A6] flex items-center gap-1.5 font-mono mt-0.5">
                        <span className={isEligible ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                          {currentSize} / {requiredSize} members
                        </span>
                        <span>•</span>
                        <span className={hasMissed ? 'text-red-400 font-bold' : 'text-white'}>
                          Day {currentDay} of {squadCh?.target || 30} {hasMissed ? '(RESET 0)' : ''}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setInvitingSquadId(squad.id)}
                      className="px-2.5 py-1.5 rounded-xl bg-[#141926] hover:bg-[#1E2433] text-white border border-[#202738] text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <UserPlus size={13} className="text-[#3B82FF]" />
                      <span>Invite</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenCohortDiscussions(squadCh, 'detail')}
                      className="px-3 py-1.5 rounded-xl bg-[#2166FF] hover:bg-[#3B82FF] text-white text-xs font-semibold flex items-center gap-1 shadow-md shadow-[#2166FF]/20 cursor-pointer"
                    >
                      <MessageSquare size={13} />
                      <span>Chat</span>
                    </button>
                  </div>
                </div>

                {/* SQUAD CAPACITY & ELIGIBILITY STATUS */}
                {!isEligible ? (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5">
                    <AlertTriangle size={15} className="text-amber-400 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-amber-300">
                        Not Eligible to Enter Challenge
                      </p>
                      <p className="text-[11px] text-[#B0B9C6] mt-0.5">
                        Requires exactly <strong className="text-white">{requiredSize} members</strong> (currently {currentSize}/{requiredSize}). Invite {requiredSize - currentSize} more to enter.
                      </p>
                    </div>
                  </div>
                ) : !entrySession && !isEntered ? (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-emerald-300">
                          Full Squad Ready ({currentSize}/{requiredSize} Members)
                        </p>
                        <p className="text-[11px] text-[#A6B2C0]">
                          Eligible to enter "{squad.challengeTitle || squadCh?.title}".
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onEnterChallengeWithSquad?.(squad.id, squadCh.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-[#2166FF] hover:bg-[#3B82FF] active:scale-95 text-white text-xs font-bold shadow-md cursor-pointer"
                    >
                      Enter Challenge with Squad
                    </button>
                  </div>
                ) : null}

                {/* SQUAD ENTRY IN-PROGRESS ACCEPTANCE MESSAGE BANNER */}
                {entrySession && (
                  <div className={`p-3 rounded-xl border transition-all ${
                    entrySession.status === 'entered'
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : 'bg-[#0E1424] border-[#2166FF]/40'
                  }`}>
                    <div className="flex items-start gap-2">
                      <ShieldCheck size={16} className="text-[#3B82FF] shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white leading-snug">
                          📢 @{entrySession.initiatedBy.username} has taken {squad.name} for "{entrySession.challengeTitle}"
                        </p>
                        <p className="text-[11px] text-[#8A92A6] mt-0.5">
                          {entrySession.status === 'entered' ? (
                            <span className="text-emerald-300 font-semibold">
                              🎉 All {requiredSize} members accepted! Squad entered.
                            </span>
                          ) : (
                            <span>
                              Squad acceptance: <strong className="text-white">{acceptedCount} / {requiredSize} accepted</strong>. Press OK to accept.
                            </span>
                          )}
                        </p>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 mt-2">
                          {squad.members.map((m) => {
                            const hasAccepted = entrySession.acceptedUsernames.includes(m.username);
                            return (
                              <div
                                key={m.id}
                                className={`px-2 py-1 rounded-lg text-[10px] font-mono flex items-center justify-between border ${
                                  hasAccepted
                                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                    : 'bg-[#121622] text-[#8A92A6] border-[#202738]'
                                }`}
                              >
                                <span className="truncate">@{m.username}</span>
                                <span>{hasAccepted ? '✓ OK' : 'Pending'}</span>
                              </div>
                            );
                          })}
                        </div>

                        {entrySession.status !== 'entered' && (
                          <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-[#202738] flex-wrap">
                            <button
                              type="button"
                              onClick={() => onAcceptSquadEntry?.(squad.id, currentUser?.username || 'aarav.codes')}
                              className="px-3 py-1.5 rounded-xl bg-[#2166FF] hover:bg-[#3B82FF] text-white text-xs font-bold shadow-md cursor-pointer"
                            >
                              Press OK to Accept
                            </button>

                            <button
                              type="button"
                              onClick={() => onAcceptAllSquadEntry?.(squad.id)}
                              className="px-3 py-1.5 rounded-xl bg-[#141822] hover:bg-[#1E2433] text-white border border-[#202738] text-xs font-medium cursor-pointer"
                            >
                              Simulate All Accept
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* SQUAD ZERO-FAILURE RULE BANNER */}
                <div className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                  hasMissed ? 'bg-red-500/10 border-red-500/30 text-red-300' : 'bg-[#10141E] border-[#1C2230] text-[#8A92A6]'
                }`}>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <AlertTriangle size={13} className={hasMissed ? 'text-red-400' : 'text-amber-400'} />
                    <span className="truncate">
                      {hasMissed 
                        ? `Streak broken! ${failedList.join(', ')} missed proof. Day reset to 0.`
                        : `Squad Rule: Zero missed photos allowed or progress returns to 0.`}
                    </span>
                  </div>
                  {hasMissed && (
                    <span className="text-[10px] font-bold text-red-400 font-mono shrink-0">
                      DAY 0
                    </span>
                  )}
                </div>

                {/* CHALLENGE MEMBERS ROSTER (NO recorded team proofs or posts) */}
                <div>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-[#8A92A6] uppercase tracking-wider mb-2">
                    <span>Challenge Members ({squad.members.length})</span>
                    <span className="text-[#3B82FF] font-mono">Limit: {requiredSize}</span>
                  </div>

                  <div className="space-y-1.5">
                    {squad.members.map((member) => {
                      const isFailed = failedList.includes(member.username);
                      return (
                        <div
                          key={member.id}
                          className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                            isFailed 
                              ? 'bg-red-950/20 border-red-500/30' 
                              : 'bg-[#0E121B] border-[#1C2230]'
                          }`}
                        >
                          <div 
                            onClick={() => onNavigateUser({ name: member.name, username: member.username })}
                            className="flex items-center gap-2.5 min-w-0 cursor-pointer group flex-1"
                          >
                            <img
                              src={member.avatar}
                              alt={member.name}
                              className={`w-8 h-8 rounded-full object-cover border shrink-0 ${
                                isFailed ? 'border-red-500' : 'border-[#202738] group-hover:border-[#2166FF]'
                              }`}
                              referrerPolicy="no-referrer"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <h4 className="text-xs font-bold text-white group-hover:text-[#3B82FF] transition-colors truncate">
                                  {member.name}
                                </h4>
                                {member.role === 'creator' && (
                                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-[#2166FF]/20 text-[#3B82FF]">
                                    Lead
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px] text-[#8A92A6] font-mono">
                                <span>@{member.username}</span>
                                <span>·</span>
                                <span className={isFailed ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                                  {isFailed ? 'Missed Proof' : 'Uploaded'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleToggleMemberProofStatus(squad.id, member.username)}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-mono transition-colors cursor-pointer border ${
                                isFailed 
                                  ? 'bg-red-500/20 text-red-300 border-red-500/40' 
                                  : 'bg-[#141822] text-[#8A92A6] border-[#222A3A] hover:text-white'
                              }`}
                            >
                              {isFailed ? 'Restore' : 'Simulate Miss'}
                            </button>

                            {member.username !== currentUser?.username && onToggleFollow && (
                              <button
                                type="button"
                                onClick={() => onToggleFollow(member.id || member.username)}
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all shrink-0 cursor-pointer ${
                                  member.isFollowing
                                    ? 'bg-[#141822] text-[#8A92A6] border border-[#202738]'
                                    : 'bg-[#2166FF]/20 text-[#3B82FF] hover:bg-[#2166FF] hover:text-white'
                                }`}
                              >
                                {member.isFollowing ? 'Following' : '+ Follow'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ================= 3. ALL CHALLENGES VIEW (MINIMALIST & CLEAN) ================= */
        <div className="space-y-4 animate-fade-in">
          {/* Cohort Discussions Entry Banner */}
          <div 
            onClick={() => onOpenCohortDiscussions(undefined, 'list')}
            className="p-3.5 rounded-2xl bg-[#090C13] hover:bg-[#0E121B] border border-[#1C2230] hover:border-[#2166FF]/40 transition-all flex items-center justify-between gap-3 cursor-pointer group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#121622] border border-[#202738] flex items-center justify-center text-[#3B82FF] shrink-0 group-hover:scale-105 transition-transform">
                <MessageSquare size={17} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white group-hover:text-[#3B82FF] transition-colors truncate">
                    Challenge Cohort Discussions
                  </span>
                  <span className="text-[10px] font-semibold text-[#3B82FF] bg-[#2166FF]/15 px-1.5 py-0.5 rounded-full">
                    Active
                  </span>
                </div>
                <p className="text-[11px] text-[#8A92A6] truncate">
                  View cohorts, submit daily photo proofs & chat with team
                </p>
              </div>
            </div>
            <ChevronRight size={17} className="text-[#8A92A6] group-hover:text-white shrink-0 transition-colors" />
          </div>

          {/* Minimal Search Bar */}
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A92A6]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search challenges by goal, topic, creator..."
              className="w-full bg-[#090C13] border border-[#1C2230] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-[#8A92A6] focus:outline-none focus:border-[#2166FF] transition-colors"
            />
          </div>

          {/* Segmented Filter Pills */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar pb-0.5">
            <div className="grid grid-cols-4 gap-1 p-1 bg-[#090C13] border border-[#1C2230] rounded-xl flex-1 min-w-[280px]">
              <button
                onClick={() => setActiveFilter('all')}
                className={`py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeFilter === 'all' ? 'bg-[#2166FF] text-white shadow-sm' : 'text-[#8A92A6] hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveFilter('squads')}
                className={`py-1 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  activeFilter === 'squads' ? 'bg-[#2166FF] text-white shadow-sm' : 'text-[#8A92A6] hover:text-white'
                }`}
              >
                <Users size={11} />
                <span>Squads</span>
              </button>
              <button
                onClick={() => setActiveFilter('solo')}
                className={`py-1 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  activeFilter === 'solo' ? 'bg-[#2166FF] text-white shadow-sm' : 'text-[#8A92A6] hover:text-white'
                }`}
              >
                <Target size={11} />
                <span>Solo</span>
              </button>
              <button
                onClick={() => setActiveFilter('joined')}
                className={`py-1 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  activeFilter === 'joined' ? 'bg-[#2166FF] text-white shadow-sm' : 'text-[#8A92A6] hover:text-white'
                }`}
              >
                <Check size={11} />
                <span>Joined</span>
              </button>
            </div>
          </div>

          {/* Minimalist Challenge Cards */}
          <div className="space-y-3.5">
            {filteredChallenges.map((challenge) => {
              const progressPercent = Math.min(
                100,
                Math.round((challenge.current / challenge.target) * 100)
              );
              const isInToDo = toDoChallengeIds.includes(challenge.id);
              const failedMembers = squadFailedMembers[challenge.id] || [];
              const isStreakBroken = challenge.type === 'squad' && failedMembers.length > 0;
              const effectiveCurrent = isStreakBroken ? 0 : challenge.current;

              return (
                <div
                  key={challenge.id}
                  className="p-4 rounded-2xl bg-[#090C13] border border-[#1C2230] hover:border-[#202838] transition-all space-y-3"
                >
                  {/* Top Meta Row */}
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#2166FF]/15 text-[#3B82FF] font-semibold">
                        {challenge.type === 'squad' ? <Users size={11} /> : <Target size={11} />}
                        <span>{challenge.type === 'squad' ? 'Squad' : 'Solo'}</span>
                      </span>

                      {challenge.tags && challenge.tags[0] && (
                        <span className="px-2 py-0.5 rounded-full bg-[#121622] text-[#8A92A6] font-medium border border-[#202738]">
                          {challenge.tags[0]}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-[#8A92A6] font-mono text-[10px]">
                      <Clock size={11} />
                      <span>{challenge.durationDays || challenge.target}d</span>
                      <span>•</span>
                      <Users size={11} />
                      <span>{challenge.participantsCount || 3} joined</span>
                    </div>
                  </div>

                  {/* Title & Creator */}
                  <div className="flex items-start gap-3">
                    <div 
                      onClick={() => onSelectChallenge(challenge)}
                      className="w-10 h-10 rounded-xl bg-[#121622] border border-[#202738] flex items-center justify-center shrink-0 cursor-pointer hover:border-[#2166FF]/50 transition-colors"
                    >
                      {getChallengeIcon(challenge.icon)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 
                        onClick={() => onSelectChallenge(challenge)}
                        className="text-sm font-bold text-white hover:text-[#3B82FF] transition-colors cursor-pointer truncate"
                      >
                        {challenge.title}
                      </h3>

                      {challenge.creator && (
                        <div className="flex items-center gap-1.5 text-xs text-[#8A92A6] mt-0.5">
                          <span>by</span>
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
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onAddToTodoList(challenge)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all shrink-0 cursor-pointer ${
                        isInToDo
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-[#121622] hover:bg-[#1A2234] text-[#8A92A6] hover:text-white border border-[#202738]'
                      }`}
                    >
                      {isInToDo ? <Check size={11} /> : <Calendar size={11} className="text-[#3B82FF]" />}
                      <span>{isInToDo ? 'In To-Do' : '+ To-Do'}</span>
                    </button>
                  </div>

                  {/* Minimalist WHAT YOU PERFORM Quote Accent */}
                  {challenge.whatYouPerform && (
                    <div 
                      onClick={() => onSelectChallenge(challenge)}
                      className="border-l-2 border-[#2166FF]/60 pl-3 py-0.5 text-xs text-[#A8B2C2] leading-relaxed cursor-pointer hover:text-white transition-colors"
                    >
                      {challenge.whatYouPerform}
                    </div>
                  )}

                  {/* Minimalist Progress Bar */}
                  <div>
                    <div className="flex items-center justify-between text-xs text-[#8A92A6] font-mono mb-1">
                      <span className={isStreakBroken ? 'text-red-400 font-semibold' : 'text-white'}>
                        Day {effectiveCurrent} of {challenge.target}
                      </span>
                      <span className={isStreakBroken ? 'text-red-400 font-bold' : 'text-[#3B82FF] font-bold'}>
                        {isStreakBroken ? '0%' : `${progressPercent}%`}
                      </span>
                    </div>

                    <div className="w-full h-1.5 bg-[#121622] rounded-full overflow-hidden border border-[#202738]">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          isStreakBroken ? 'bg-red-500' : 'bg-[#2166FF]'
                        }`}
                        style={{ width: `${isStreakBroken ? 0 : progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Bottom Action Row:
                      - ONLY Cohort Chat if joined
                      - If not joined: BOTH Join Challenge and Cohort Chat
                      - NO enter, NO check-in */}
                  <div className="pt-0.5">
                    {challenge.joined ? (
                      <button
                        type="button"
                        onClick={() => onOpenCohortDiscussions(challenge, 'detail')}
                        className="w-full py-2 px-3 rounded-xl bg-[#2166FF] hover:bg-[#3B82FF] active:scale-95 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-[#2166FF]/20 transition-all cursor-pointer"
                      >
                        <MessageSquare size={13} />
                        <span>Cohort Chat</span>
                      </button>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => onToggleJoinChallenge?.(challenge.id)}
                          className="py-2 px-3 rounded-xl bg-[#2166FF] hover:bg-[#3B82FF] active:scale-95 text-white text-xs font-semibold flex items-center justify-center gap-1 shadow-md shadow-[#2166FF]/20 transition-all cursor-pointer"
                        >
                          <Plus size={13} />
                          <span>Join Challenge</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenCohortDiscussions(challenge, 'detail')}
                          className="py-2 px-3 rounded-xl bg-[#121622] hover:bg-[#1A2234] border border-[#202738] active:scale-95 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <MessageSquare size={13} className="text-[#3B82FF]" />
                          <span>Cohort Chat</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CREATE NEW SQUAD MODAL */}
      {isCreateSquadModalOpen && (
        <div 
          onClick={() => setIsCreateSquadModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#090C13] border border-[#1C2230] rounded-2xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#1C2230]">
              <div className="flex items-center gap-2">
                <Users size={17} className="text-[#3B82FF]" />
                <h3 className="text-sm font-bold text-white">Create New Squad</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateSquadModalOpen(false)}
                className="w-7 h-7 rounded-full bg-[#121622] hover:bg-[#1C2230] text-[#8A92A6] hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleCreateSquadSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-white block mb-1">
                  Squad Name
                </label>
                <input
                  type="text"
                  required
                  value={newSquadName}
                  onChange={(e) => setNewSquadName(e.target.value)}
                  placeholder="e.g. 5AM Fast Builders..."
                  className="w-full bg-[#121622] border border-[#202738] rounded-xl px-3 py-2 text-xs text-white placeholder-[#8A92A6] focus:outline-none focus:border-[#2166FF]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-white block mb-1">
                  Target Challenge Sprint
                </label>
                <select
                  value={newSquadChallengeId}
                  onChange={(e) => setNewSquadChallengeId(e.target.value)}
                  className="w-full bg-[#121622] border border-[#202738] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#2166FF]"
                >
                  {challenges.map((c) => (
                    <option key={c.id} value={c.id} className="bg-[#121622]">
                      {c.title} ({c.type === 'squad' ? 'Squad Sprint' : 'Solo'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-white">
                    Squad Capacity
                  </label>
                  <span className="text-xs text-[#3B82FF] font-mono font-bold">
                    {newSquadRequiredSize} Members Required
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[3, 5, 8, 10].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setNewSquadRequiredSize(size)}
                      className={`py-1.5 rounded-xl text-xs font-mono font-semibold transition-all border cursor-pointer ${
                        newSquadRequiredSize === size
                          ? 'bg-[#2166FF] text-white border-[#2166FF]'
                          : 'bg-[#121622] text-[#8A92A6] border-[#202738] hover:text-white'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-white block mb-1">
                  Invite Initial Members
                </label>
                <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                  {allUsers.map((user) => {
                    const isSelected = selectedInviteUsernames.includes(user.username);
                    return (
                      <div
                        key={user.id}
                        onClick={() => {
                          setSelectedInviteUsernames(prev => 
                            isSelected ? prev.filter(u => u !== user.username) : [...prev, user.username]
                          );
                        }}
                        className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-[#2166FF]/20 border-[#2166FF] text-white'
                            : 'bg-[#121622] border-[#202738] text-[#8A92A6] hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-5 h-5 rounded-full object-cover shrink-0"
                          />
                          <p className="text-xs font-medium truncate">{user.name} (@{user.username})</p>
                        </div>
                        {isSelected && <Check size={13} className="text-[#3B82FF]" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  disabled={!newSquadName.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-[#2166FF] hover:bg-[#3B82FF] disabled:bg-[#121622] disabled:text-[#8A92A6]/40 text-white text-xs font-bold shadow-md cursor-pointer transition-all"
                >
                  Create Squad & Send Invites
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreateSquadModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#121622] hover:bg-[#1C2230] text-[#8A92A6] text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INVITE MODAL FOR EXISTING SQUAD */}
      {invitingSquadId && (
        <div 
          onClick={() => setInvitingSquadId(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-[#090C13] border border-[#1C2230] rounded-2xl p-5 shadow-2xl space-y-3.5"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#1C2230]">
              <div className="flex items-center gap-2">
                <UserPlus size={16} className="text-[#3B82FF]" />
                <h3 className="text-sm font-bold text-white">Invite to Squad</h3>
              </div>
              <button
                type="button"
                onClick={() => setInvitingSquadId(null)}
                className="w-7 h-7 rounded-full bg-[#121622] hover:bg-[#1C2230] text-[#8A92A6] hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <p className="text-xs text-[#8A92A6]">
              Sends an invitation to their notifications tray.
            </p>

            <div className="space-y-1 max-h-40 overflow-y-auto">
              {allUsers.map((user) => (
                <div
                  key={user.id}
                  onClick={() => setInviteModalUsername(user.username)}
                  className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                    inviteModalUsername === user.username
                      ? 'bg-[#2166FF]/20 border-[#2166FF] text-white'
                      : 'bg-[#121622] border-[#202738] text-[#8A92A6] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-5 h-5 rounded-full object-cover shrink-0"
                    />
                    <p className="text-xs font-medium truncate">{user.name} (@{user.username})</p>
                  </div>
                  {inviteModalUsername === user.username && (
                    <Check size={13} className="text-[#3B82FF]" />
                  )}
                </div>
              ))}
            </div>

            <form onSubmit={handleSendInviteSubmit} className="space-y-3 pt-1">
              <input
                type="text"
                required
                value={inviteModalUsername}
                onChange={(e) => setInviteModalUsername(e.target.value)}
                placeholder="@username"
                className="w-full bg-[#121622] border border-[#202738] rounded-xl px-3 py-2 text-xs text-white placeholder-[#8A92A6] focus:outline-none focus:border-[#2166FF]"
              />

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={!inviteModalUsername.trim()}
                  className="flex-1 py-2 rounded-xl bg-[#2166FF] hover:bg-[#3B82FF] disabled:bg-[#121622] disabled:text-[#8A92A6]/40 text-white text-xs font-bold shadow-md cursor-pointer transition-all flex items-center justify-center gap-1.5"
                >
                  <Send size={12} />
                  <span>Send Invitation</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInvitingSquadId(null)}
                  className="px-3 py-2 rounded-xl bg-[#121622] hover:bg-[#1C2230] text-[#8A92A6] text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
