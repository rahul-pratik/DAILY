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
  Sparkles,
  Trash2
} from 'lucide-react';
import { Author, Challenge, Squad, SquadMember, SquadChatMessage } from '../../types';
import { StorageService } from '../../services/storageService';

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
  onAddToTodoList?: (challenge: Challenge) => void;
  onToggleFollow?: (userId: string) => void;
  toDoChallengeIds?: string[];
  onToggleJoinChallenge?: (challengeId: string) => void;
  onCreateSquad?: (squadData: Partial<Squad>) => void;
  onInviteMemberToSquad?: (squadId: string, username: string) => void;
  onEnterChallengeWithSquad?: (squadId: string, challengeId: string) => void;
  onAcceptSquadEntry?: (squadId: string, username: string) => void;
  onAcceptAllSquadEntry?: (squadId: string) => void;
  onDeleteSquad?: (squadId: string) => void;
  onDeleteChallenge?: (challengeId: string) => void;
  squadChatMessages?: SquadChatMessage[];
  onSendSquadMessage?: (squadId: string, text: string) => void;
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
  onDeleteSquad,
  onDeleteChallenge,
  squadChatMessages: syncedSquadChatMessages,
  onSendSquadMessage,
}) => {
  // Top 3-tab view mode: 'challenges' | 'squad_chat' | 'manage_squads'
  const [viewMode, setViewMode] = useState<'challenges' | 'squad_chat' | 'manage_squads'>('challenges');
  const [activeFilter, setActiveFilter] = useState<'all' | 'squads' | 'solo' | 'joined'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'popularity' | 'difficulty'>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('#All Tags');

  // Squad Accountability Rule Modal state
  const [ruleModalChallenge, setRuleModalChallenge] = useState<Challenge | null>(null);

  // Squad Chat states
  const [selectedSquadIdForChat, setSelectedSquadIdForChat] = useState<string>(squads[0]?.id || '');
  const [squadChatMessages, setSquadChatMessages] = useState<SquadChatMessage[]>([]);
  const [chatInputText, setChatInputText] = useState<string>('');

  React.useEffect(() => {
    if (squads.length > 0 && (!selectedSquadIdForChat || !squads.some(s => s.id === selectedSquadIdForChat))) {
      setSelectedSquadIdForChat(squads[0].id);
    }
  }, [squads, selectedSquadIdForChat]);

  React.useEffect(() => {
    if (selectedSquadIdForChat) {
      const syncedMessages = syncedSquadChatMessages?.filter((message) => message.squadId === selectedSquadIdForChat);
      const localMessages = StorageService.getSquadChatMessages(selectedSquadIdForChat) as SquadChatMessage[];
      const messagesById = new Map(localMessages.map((message) => [message.id, message]));
      (syncedMessages || []).forEach((message) => messagesById.set(message.id, message));
      setSquadChatMessages(Array.from(messagesById.values()));
    }
  }, [selectedSquadIdForChat, syncedSquadChatMessages]);

  const handleSendSquadMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInputText.trim() || !selectedSquadIdForChat || !currentUser) return;
    const newMsg: SquadChatMessage = {
      id: `sqmsg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      squadId: selectedSquadIdForChat,
      author: currentUser,
      text: chatInputText.trim(),
      timestamp: 'Just now',
    };
    if (onSendSquadMessage) {
      onSendSquadMessage(selectedSquadIdForChat, chatInputText.trim());
    } else {
      StorageService.addSquadChatMessage(selectedSquadIdForChat, newMsg);
      setSquadChatMessages((prev) => [...prev, newMsg]);
    }
    setChatInputText('');
  };

  // Deletion confirm states (Creator only)
  const [squadToDelete, setSquadToDelete] = useState<Squad | null>(null);
  const [challengeToDelete, setChallengeToDelete] = useState<Challenge | null>(null);

  // Modal states
  const [isCreateSquadModalOpen, setIsCreateSquadModalOpen] = useState(false);
  const [newSquadName, setNewSquadName] = useState('');
  const [newSquadChallengeId, setNewSquadChallengeId] = useState(challenges[0]?.id || '');
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
      const q = searchQuery.toLowerCase().trim().replace(/^#/, '');
      const match = ch.title.toLowerCase().includes(q) ||
        (ch.tags && ch.tags.some(t => t.toLowerCase().replace(/^#/, '').includes(q))) ||
        ch.category.toLowerCase().includes(q) ||
        ch.description.toLowerCase().includes(q) ||
        (ch.whatYouPerform && ch.whatYouPerform.toLowerCase().includes(q)) ||
        (ch.creator?.name && ch.creator.name.toLowerCase().includes(q)) ||
        (ch.creator?.username && ch.creator.username.toLowerCase().includes(q));
      if (!match) return false;
    }

    return true;
  });

  const getChallengeDifficulty = (challenge: Challenge): NonNullable<Challenge['difficulty']> => {
    if (challenge.difficulty) return challenge.difficulty;
    const duration = challenge.durationDays || challenge.target;
    return duration <= 7 ? 'Easy' : duration <= 21 ? 'Medium' : 'Hard';
  };

  // Sort challenges by Recently Added, Popularity, or Difficulty
  const sortedChallenges = [...filteredChallenges].sort((a, b) => {
    if (sortBy === 'popularity') {
      const popA = a.participantsCount ?? (a.joined ? 1 : 0);
      const popB = b.participantsCount ?? (b.joined ? 1 : 0);
      return popB - popA;
    }
    if (sortBy === 'difficulty') {
      const difficultyRank = { Easy: 0, Medium: 1, Hard: 2 };
      const diffA = difficultyRank[getChallengeDifficulty(a)];
      const diffB = difficultyRank[getChallengeDifficulty(b)];
      return diffB - diffA;
    }
    return (Date.parse(b.createdAt || '') || 0) - (Date.parse(a.createdAt || '') || 0);
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

    selectedInviteUsernames.slice(0, Math.max(0, newSquadRequiredSize - 1)).forEach((uname) => {
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
      <div className="flex items-center justify-between mb-3 pt-1">
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Trophy size={19} className="text-[#2166FF]" />
            <span>Challenges & Squads</span>
          </h1>
        </div>

        <button
          onClick={onOpenCreateChallenge}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#2166FF] hover:bg-[#3B82FF] active:scale-95 text-white shadow-md shadow-[#2166FF]/25 transition-all cursor-pointer shrink-0"
        >
          <Plus size={14} className="stroke-[2.5]" />
          <span>New Challenge</span>
        </button>
      </div>

      {/* Header Search Bar for Quick Challenge & Tag Discovery */}
      <div className="relative mb-3.5">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A92A6]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (e.target.value.trim() && viewMode !== 'challenges') {
              setViewMode('challenges');
            }
          }}
          placeholder="Search challenges by title, #tag, or category..."
          className="w-full bg-[#090C13] border border-[#1C2230] rounded-xl pl-9 pr-9 py-2 text-xs text-white placeholder-[#8A92A6] focus:outline-none focus:border-[#2166FF] transition-colors"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#8A92A6] hover:text-white transition-colors cursor-pointer"
            aria-label="Clear search"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Sleek Minimalist 3-Tab Navigator: Challenges, Squad Chat, Manage Squads */}
      <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-[#090C13] border border-[#1C2230] rounded-2xl mb-4 shadow-sm">
        <button
          type="button"
          onClick={() => setViewMode('challenges')}
          className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
            viewMode === 'challenges'
              ? 'border-[#2166FF] bg-[#2166FF]/20 text-white font-bold shadow-sm shadow-[#2166FF]/30 ring-1 ring-[#2166FF]'
              : 'border-[#1C2230] bg-[#121620]/60 text-[#8A92A6] hover:text-white hover:border-[#2C364D]'
          }`}
        >
          <Trophy size={13} className={viewMode === 'challenges' ? 'text-[#3B82FF]' : 'text-[#8A92A6]'} />
          <span>Challenges</span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode('squad_chat')}
          className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
            viewMode === 'squad_chat'
              ? 'border-[#2166FF] bg-[#2166FF]/20 text-white font-bold shadow-sm shadow-[#2166FF]/30 ring-1 ring-[#2166FF]'
              : 'border-[#1C2230] bg-[#121620]/60 text-[#8A92A6] hover:text-white hover:border-[#2C364D]'
          }`}
        >
          <MessageSquare size={13} className={viewMode === 'squad_chat' ? 'text-[#3B82FF]' : 'text-[#8A92A6]'} />
          <span>Squad Chat</span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode('manage_squads')}
          className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
            viewMode === 'manage_squads'
              ? 'border-[#2166FF] bg-[#2166FF]/20 text-white font-bold shadow-sm shadow-[#2166FF]/30 ring-1 ring-[#2166FF]'
              : 'border-[#1C2230] bg-[#121620]/60 text-[#8A92A6] hover:text-white hover:border-[#2C364D]'
          }`}
        >
          <Users size={13} className={viewMode === 'manage_squads' ? 'text-[#3B82FF]' : 'text-[#8A92A6]'} />
          <span>Manage Squads</span>
        </button>
      </div>

      {/* ================= 1. SQUAD CHAT VIEW ================= */}
      {viewMode === 'squad_chat' ? (
        <div className="space-y-4 animate-fade-in">
          {/* Section Subheader */}
          <div className="flex items-center justify-between pb-1">
            <div>
              <h2 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                <MessageSquare size={14} className="text-[#3B82FF]" />
                <span>Squad Team Chat</span>
              </h2>
              <p className="text-[11px] text-[#8A92A6]">
                Dedicated private discussion rooms for formed squad cohorts to strategize and support each other
              </p>
            </div>
            <span className="text-[10px] font-mono text-[#3B82FF] bg-[#2166FF]/10 px-2 py-0.5 rounded-full border border-[#2166FF]/20">
              Live Squad Chat
            </span>
          </div>

          {squads.length === 0 ? (
            <div className="py-14 text-center text-[#8A92A6] bg-[#090C13] rounded-2xl border border-[#1C2230] p-6 space-y-3">
              <Users size={32} className="mx-auto text-[#2166FF] opacity-70" />
              <p className="text-sm font-bold text-white">No Squads Formed Yet</p>
              <p className="text-xs text-[#8A92A6] max-w-sm mx-auto leading-relaxed">
                Squads provide dedicated team chats to coordinate daily photo check-ins and maintain mutual accountability.
              </p>
              <button
                type="button"
                onClick={() => setViewMode('manage_squads')}
                className="px-4 py-2 rounded-xl bg-[#2166FF] hover:bg-[#1a52cc] text-white text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-md shadow-[#2166FF]/25"
              >
                <Plus size={13} />
                <span>Create or Join a Squad</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Squad Selector Carousel/Pills */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                {squads.map((squad) => {
                  const isSelected = selectedSquadIdForChat === squad.id;
                  const memberCount = (squad.members || []).length + (squad.creator ? 1 : 0);
                  return (
                    <button
                      key={squad.id}
                      type="button"
                      onClick={() => setSelectedSquadIdForChat(squad.id)}
                      className={`px-3 py-2 rounded-xl border text-xs font-semibold whitespace-nowrap flex items-center gap-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#2166FF] text-white border-[#2166FF] shadow-md shadow-[#2166FF]/25'
                          : 'bg-[#090C13] border-[#1C2230] text-[#8A92A6] hover:text-white hover:border-[#2C364D]'
                      }`}
                    >
                      <Users size={12} className={isSelected ? 'text-white' : 'text-[#3B82FF]'} />
                      <span>{squad.name}</span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-[#141926] text-[#8A92A6]'
                      }`}>
                        {memberCount}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Active Squad Chat Window */}
              {(() => {
                const activeSquad = squads.find(s => s.id === selectedSquadIdForChat) || squads[0];
                if (!activeSquad) return null;
                const squadCh = challenges.find(c => c.id === activeSquad.challengeId);
                const activeSquadMembers = (activeSquad.members || []);

                return (
                  <div className="rounded-2xl bg-[#090C13] border border-[#1C2230] overflow-hidden flex flex-col shadow-xl">
                    {/* Squad Chat Header */}
                    <div className="p-3.5 border-b border-[#1C2230] bg-[#0c1017] flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-[#121622] border border-[#202738] flex items-center justify-center text-[#3B82FF] shrink-0">
                          <Users size={16} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-xs font-bold text-white truncate">{activeSquad.name}</h3>
                            <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-[#2166FF]/20 text-[#3B82FF] border border-[#2166FF]/30 uppercase">
                              {activeSquad.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#8A92A6] truncate mt-0.5">
                            Challenge: <span className="text-white font-medium">{activeSquad.challengeTitle || squadCh?.title || 'Daily Sprint'}</span>
                          </p>
                        </div>
                      </div>

                      {/* Members Avatars Row */}
                      <div className="flex items-center -space-x-1.5 overflow-hidden">
                        {activeSquadMembers.slice(0, 5).map((m, idx) => (
                          <img
                            key={idx}
                            src={m.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'}
                            alt={m.name}
                            title={`${m.name} (@${m.username})`}
                            className="w-6 h-6 rounded-full object-cover border-2 border-[#090C13]"
                          />
                        ))}
                      </div>
                    </div>

                    {/* Messages Scroll Area */}
                    <div className="p-4 space-y-3 min-h-[260px] max-h-[380px] overflow-y-auto bg-[#06080D]">
                      {squadChatMessages.length === 0 ? (
                        <div className="py-12 text-center text-[#8A92A6] space-y-2">
                          <Sparkles size={24} className="mx-auto text-[#2166FF] opacity-60" />
                          <p className="text-xs font-semibold text-white">Squad Channel Ready</p>
                          <p className="text-[11px] text-[#8A92A6] max-w-xs mx-auto">
                            Send the first message to coordinate today&apos;s photo check-in, set workout times, or share daily goals!
                          </p>
                        </div>
                      ) : (
                        squadChatMessages.map((msg) => {
                          const author = msg.author || (msg.sender
                            ? {
                                id: msg.sender.id,
                                name: msg.sender.name,
                                username: msg.sender.username,
                                avatar: msg.sender.avatar,
                              }
                            : {
                                id: '',
                                name: 'Unknown member',
                                username: 'unknown',
                                avatar: '',
                              });
                          const isMe = author.username === currentUser?.username;
                          return (
                            <div
                              key={msg.id}
                              className={`flex items-start gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}
                            >
                              <img
                                src={author.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'}
                                alt={author.name}
                                className="w-7 h-7 rounded-full object-cover border border-[#202738] shrink-0 mt-0.5"
                              />
                              <div className={`max-w-[80%] space-y-1 ${isMe ? 'items-end' : ''}`}>
                                <div className={`flex items-center gap-1.5 text-[10px] ${isMe ? 'justify-end' : ''}`}>
                                  <span className="font-bold text-white">{isMe ? 'You' : author.name}</span>
                                  <span className="text-[#8A92A6] font-mono">@{author.username}</span>
                                  <span className="text-[#8A92A6]">·</span>
                                  <span className="text-[#8A92A6] font-mono">{msg.timestamp}</span>
                                </div>
                                <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                                  isMe
                                    ? 'bg-[#2166FF] text-white rounded-tr-sm'
                                    : 'bg-[#121620] text-gray-200 border border-[#1C2230] rounded-tl-sm'
                                }`}>
                                  {msg.text}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Chat Input Bar */}
                    <form
                      onSubmit={handleSendSquadMessage}
                      className="p-3 border-t border-[#1C2230] bg-[#0c1017] flex items-center gap-2"
                    >
                      <input
                        type="text"
                        value={chatInputText}
                        onChange={(e) => setChatInputText(e.target.value)}
                        placeholder={`Message #${activeSquad.name.toLowerCase().replace(/\s+/g, '-')}...`}
                        className="flex-1 bg-[#10141D] border border-[#1C2230] focus:border-[#2166FF] rounded-xl px-3 py-2 text-xs text-white placeholder-[#8A92A6] outline-none transition-colors"
                      />
                      <button
                        type="submit"
                        disabled={!chatInputText.trim()}
                        className="px-3.5 py-2 rounded-xl bg-[#2166FF] hover:bg-[#1a55d6] disabled:opacity-40 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                      >
                        <Send size={13} />
                        <span>Send</span>
                      </button>
                    </form>
                  </div>
                );
              })()}
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
            const requiredSize = squad.requiredSize || 2;
            const rawMembers = squad.members || [];
            const hasCreatorInRoster = rawMembers.some(m =>
              (squad.creator?.username && m.username?.toLowerCase() === squad.creator.username.toLowerCase()) ||
              (squad.creator?.name && m.name === squad.creator.name && m.role === 'creator')
            );
            const members = hasCreatorInRoster ? rawMembers : [
              {
                id: `u_${squad.creator?.username || 'leader'}`,
                name: squad.creator?.name || 'Squad Lead',
                username: squad.creator?.username || 'leader',
                avatar: squad.creator?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
                dayReached: 1,
                role: 'creator' as const,
              },
              ...rawMembers
            ];
            const currentSize = members.length;
            const isEligible = currentSize >= requiredSize;
            const entrySession = squad.entrySession;
            const isEntered = entrySession?.status === 'entered' || squadCh?.joined;
            const acceptedCount = entrySession?.acceptedUsernames.length || 0;

            const currentDay = squadCh?.current || 1;

            return (
              <div key={squad.id} className="p-4 sm:p-5 rounded-2xl bg-[#080B10] border border-[#1C2230] space-y-4 hover:border-[#2166FF]/30 transition-all shadow-sm">
                {/* Squad Header */}
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#1C2230]">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#121622] border border-[#202738] flex items-center justify-center shrink-0 text-[#3B82FF]">
                      {getChallengeIcon(squadCh?.icon || 'runner')}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-white truncate">
                          {squad.name}
                        </h3>
                        <span className="text-[10px] font-semibold text-[#3B82FF] bg-[#2166FF]/15 px-2 py-0.5 rounded-full border border-[#2166FF]/20">
                          {squad.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#8A92A6] mt-0.5 break-words">
                        {squadCh?.title || squad.challengeTitle || 'Challenge'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Creator delete button */}
                    {Boolean(
                      (squad.creator?.username && currentUser?.username && squad.creator.username.toLowerCase().replace(/^@/, '') === currentUser.username.toLowerCase().replace(/^@/, '')) ||
                      (squad.creator as any)?.id === currentUser?.id ||
                      (squad as any)?.creatorId === currentUser?.id ||
                      squad.members?.some(m => m.role === 'creator' && (m.id === currentUser?.id || (m.username && currentUser?.username && m.username.toLowerCase().replace(/^@/, '') === currentUser.username.toLowerCase().replace(/^@/, ''))))
                    ) && onDeleteSquad && (
                      <button
                        type="button"
                        onClick={() => setSquadToDelete(squad)}
                        className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/25 transition-all cursor-pointer"
                        title="Delete Squad (Creator only)"
                        aria-label="Delete Squad"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setInvitingSquadId(squad.id)}
                      className="px-2.5 py-1.5 rounded-xl bg-[#121622] hover:bg-[#1A2234] text-white border border-[#202738] text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
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

                {/* 3 Metric Tiles Grid */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl bg-[#0E121B] border border-[#1C2230] text-center">
                    <span className="text-[10px] text-[#8A92A6] uppercase tracking-wider block font-semibold">ROSTER</span>
                    <span className={`text-xs font-bold font-mono mt-0.5 block ${isEligible ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {currentSize} / {requiredSize}
                    </span>
                    <span className="text-[9px] text-[#8A92A6] block mt-0.5 truncate">
                      {isEligible ? 'Full Squad' : `Need ${requiredSize - currentSize} more`}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#0E121B] border border-[#1C2230] text-center">
                    <span className="text-[10px] text-[#8A92A6] uppercase tracking-wider block font-semibold">DAY</span>
                    <span className="text-xs font-bold font-mono mt-0.5 block text-white">
                      Day {currentDay}
                    </span>
                    <span className="text-[9px] text-[#8A92A6] block mt-0.5 truncate">
                      of {squadCh?.target || 30} Target
                    </span>
                  </div>

                </div>

                {/* Eligibility Callout or Entry Action */}
                {!isEligible ? (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <AlertTriangle size={15} className="text-amber-400 shrink-0" />
                      <p className="text-xs text-amber-300 truncate">
                        Requires <strong className="text-white">{requiredSize} members</strong> to enter sprint ({currentSize}/{requiredSize} joined)
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setInvitingSquadId(squad.id)}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold shrink-0 cursor-pointer"
                    >
                      Invite Now
                    </button>
                  </div>
                ) : !entrySession && !isEntered ? (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-emerald-300">
                          Full Roster Assembled ({currentSize}/{requiredSize})
                        </p>
                        <p className="text-[11px] text-[#A6B2C0]">
                          Ready to enter "{squadCh?.title || squad.name}".
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onEnterChallengeWithSquad?.(squad.id, squadCh?.id || squad.challengeId || '')}
                      className="px-3.5 py-1.5 rounded-xl bg-[#2166FF] hover:bg-[#3B82FF] active:scale-95 text-white text-xs font-bold shadow-md cursor-pointer"
                    >
                      Enter Challenge with Squad
                    </button>
                  </div>
                ) : null}

                {/* Entry In Progress Acceptance Banner */}
                {entrySession && (
                  <div className={`p-3 rounded-xl border ${
                    entrySession.status === 'entered'
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : 'bg-[#0E1424] border-[#2166FF]/40'
                  }`}>
                    <div className="flex items-start gap-2">
                      <ShieldCheck size={16} className="text-[#3B82FF] shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-bold text-white">
                            Entry Session: {entrySession.challengeTitle}
                          </p>
                          <span className="text-[10px] font-mono text-[#3B82FF] bg-[#2166FF]/15 px-2 py-0.5 rounded-full">
                            {acceptedCount}/{requiredSize} Accepted
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mt-2">
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
                          <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-[#202738]">
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

                {/* Clean Members Roster */}
                <div>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-[#8A92A6] uppercase tracking-wider mb-2">
                    <span>Squad Roster ({members.length})</span>
                    <span className="text-[#3B82FF] font-mono">{requiredSize} Members Limit</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {members.map((member) => (
                        <div
                          key={member.id}
                          className="p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-colors bg-[#0E121B] border-[#1C2230]"
                        >
                          <div 
                            onClick={() => onNavigateUser({ name: member.name, username: member.username })}
                            className="flex items-center gap-2 min-w-0 cursor-pointer group flex-1"
                          >
                            <img
                              src={member.avatar}
                              alt={member.name}
                              className="w-7 h-7 rounded-full object-cover border border-[#202738] group-hover:border-[#2166FF] shrink-0"
                              referrerPolicy="no-referrer"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1">
                                <h4 className="text-xs font-semibold text-white group-hover:text-[#3B82FF] transition-colors truncate">
                                  {member.name}
                                </h4>
                                {member.role === 'creator' && (
                                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-[#2166FF]/20 text-[#3B82FF] shrink-0">
                                    Lead
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-[#8A92A6] font-mono truncate">@{member.username}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Member
                            </span>

                            {member.username !== currentUser?.username && !member.isFollowing && onToggleFollow && (
                              <button
                                type="button"
                                onClick={() => onToggleFollow(member.id || member.username)}
                                className="px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all shrink-0 cursor-pointer bg-[#2166FF]/20 text-[#3B82FF] hover:bg-[#2166FF] hover:text-white"
                              >
                                + Follow
                              </button>
                            )}
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



          {/* Segmented Filter Pills & Sort Selector */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pb-0.5">
            <div className="grid grid-cols-4 gap-1 p-1 bg-[#090C13] border border-[#1C2230] rounded-xl flex-1 min-w-[260px]">
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

            {/* Sort Menu: Recently Added | Popularity | Difficulty */}
            <div className="flex items-center gap-1 p-1 bg-[#090C13] border border-[#1C2230] rounded-xl self-end sm:self-auto text-xs">
              <span className="text-[10px] text-[#8A92A6] px-1 font-mono uppercase">Sort:</span>
              {(['recent', 'popularity', 'difficulty'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setSortBy(mode)}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                    sortBy === mode
                      ? 'bg-[#2166FF] text-white font-semibold shadow-sm'
                      : 'text-[#8A92A6] hover:text-white'
                  }`}
                >
                  {mode === 'recent' ? 'Recently Added' : mode === 'popularity' ? 'Popularity' : 'Difficulty'}
                </button>
              ))}
            </div>
          </div>

          {/* Minimalist Challenge Cards */}
          <div className="space-y-3.5">
            {sortedChallenges.map((challenge) => {
              const progressPercent = Math.min(
                100,
                Math.round((challenge.current / challenge.target) * 100)
              );
              const isInToDo = toDoChallengeIds.includes(challenge.id);
              const difficulty = getChallengeDifficulty(challenge);

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
                      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${
                        difficulty === 'Easy'
                          ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                          : difficulty === 'Medium'
                            ? 'bg-amber-500/10 border-amber-500/25 text-amber-300'
                            : 'bg-rose-500/10 border-rose-500/25 text-rose-300'
                      }`}>
                        {difficulty}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[#8A92A6] font-mono text-[10px]">
                      <Clock size={11} />
                      <span>{challenge.durationDays || challenge.target}d</span>
                      <span>•</span>
                      <Users size={11} />
                      <span>{challenge.participantsCount ?? (challenge.joined ? 1 : 0)} joined</span>
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
                        onClick={() => setRuleModalChallenge(challenge)}
                        className="text-sm font-bold text-white hover:text-[#3B82FF] transition-colors cursor-pointer leading-snug"
                        title="Click to view Squad Accountability Rule"
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

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Feature 2: Creator delete button for challenges */}
                      {Boolean(
                        challenge.creator?.username &&
                        currentUser?.username &&
                        challenge.creator.username.toLowerCase() === currentUser.username.toLowerCase()
                      ) && onDeleteChallenge && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setChallengeToDelete(challenge);
                          }}
                          className="p-1.5 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-all cursor-pointer"
                          title="Delete Challenge (Creator only)"
                          aria-label="Delete Challenge"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Minimalist WHAT YOU PERFORM Quote Accent */}
                  {challenge.description && (
                    <p className="text-xs text-[#A8B2C2] leading-relaxed whitespace-pre-wrap break-words">
                      {challenge.description}
                    </p>
                  )}

                  {challenge.whatYouPerform && challenge.whatYouPerform !== challenge.description && (
                    <div 
                      onClick={() => onSelectChallenge(challenge)}
                      className="border-l-2 border-[#2166FF]/60 pl-3 py-0.5 text-xs text-[#A8B2C2] leading-relaxed whitespace-pre-wrap break-words cursor-pointer hover:text-white transition-colors"
                    >
                      {challenge.whatYouPerform}
                    </div>
                  )}

                  {/* Minimalist Progress Bar */}
                  <div>
                    <div className="flex items-center justify-between text-xs text-[#8A92A6] font-mono mb-1">
                      <span className="text-white">
                        Day {challenge.current} of {challenge.target}
                      </span>
                      <span className="text-[#3B82FF] font-bold">
                        {progressPercent}%
                      </span>
                    </div>

                    <div className="w-full h-1.5 bg-[#121622] rounded-full overflow-hidden border border-[#202738]">
                      <div
                        className="h-full transition-all duration-500 rounded-full bg-[#2166FF]"
                        style={{ width: `${progressPercent}%` }}
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

            {filteredChallenges.length === 0 && (
              <div className="py-14 text-center text-[#8A92A6] px-4 bg-[#090C13] rounded-2xl border border-[#1C2230] space-y-3">
                <Target size={28} className="mx-auto text-[#2166FF] mb-1 opacity-70" />
                <div>
                  <p className="text-sm font-semibold text-white mb-0.5">No challenges found</p>
                  <p className="text-xs text-[#8A92A6]">
                    {searchQuery
                      ? `No challenges matching "${searchQuery}".`
                      : selectedTag !== '#All Tags'
                      ? `No challenges tagged under ${selectedTag}.`
                      : 'Be the first to launch a new challenge!'}
                  </p>
                </div>
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="px-4 py-2 rounded-xl bg-[#2166FF] hover:bg-[#3B82FF] text-white text-xs font-semibold cursor-pointer shadow-md transition-colors"
                  >
                    Clear Search
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onOpenCreateChallenge}
                    className="px-4 py-2 rounded-xl bg-[#2166FF] hover:bg-[#3B82FF] text-white text-xs font-semibold cursor-pointer shadow-md transition-colors"
                  >
                    Create New Challenge
                  </button>
                )}
              </div>
            )}
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
                      {c.title} ({c.type === 'squad' ? 'Squad' : 'Solo'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-white">
                    Squad Capacity (Total Members)
                  </label>
                  <span className="text-xs text-[#3B82FF] font-mono font-bold">
                    {newSquadRequiredSize} Members Required
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1.5 mb-2">
                  {[2, 3, 5, 8, 10].map((size) => (
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
                {/* Custom member count input */}
                <div className="flex items-center gap-2 bg-[#121622] border border-[#202738] rounded-xl px-3 py-1.5 focus-within:border-[#2166FF]">
                  <span className="text-[11px] text-[#8A92A6]">Custom total members:</span>
                  <input
                    type="number"
                    min={2}
                    max={100}
                    value={newSquadRequiredSize}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val) && val >= 1) {
                        setNewSquadRequiredSize(val);
                      }
                    }}
                    placeholder="e.g. 4, 6, 7, 12..."
                    className="w-20 bg-transparent text-xs text-white font-mono font-bold outline-none"
                  />
                  <span className="text-[10px] text-[#555E70] ml-auto">Any number</span>
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

      {/* Creator-only Delete Squad Confirmation Modal */}
      {squadToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-[#090C13] border border-red-500/30 p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Delete Squad?</h3>
                <p className="text-xs text-[#8A92A6]">Only the squad creator can delete this squad. This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-xs text-white/80 bg-[#121622] p-3 rounded-xl border border-[#202738]">
              Are you sure you want to delete <strong className="text-white">"{squadToDelete.name}"</strong>?
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setSquadToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-[#141926] hover:bg-[#1E2433] text-xs font-semibold text-[#8A92A6] hover:text-white border border-[#202738] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = squadToDelete.id;
                  setSquadToDelete(null);
                  onDeleteSquad?.(id);
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 text-xs font-semibold text-white transition-all cursor-pointer shadow-md shadow-red-600/30"
              >
                Yes, Delete Squad
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Creator-only Delete Challenge Confirmation Modal */}
      {challengeToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-[#090C13] border border-red-500/30 p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Delete Challenge?</h3>
                <p className="text-xs text-[#8A92A6]">Only you as the creator can delete this challenge.</p>
              </div>
            </div>
            <p className="text-xs text-white/80 bg-[#121622] p-3 rounded-xl border border-[#202738]">
              Are you sure you want to delete <strong className="text-white">"{challengeToDelete.title}"</strong>?
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setChallengeToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-[#141926] hover:bg-[#1E2433] text-xs font-semibold text-[#8A92A6] hover:text-white border border-[#202738] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = challengeToDelete.id;
                  setChallengeToDelete(null);
                  onDeleteChallenge?.(id);
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 text-xs font-semibold text-white transition-all cursor-pointer shadow-md shadow-red-600/30"
              >
                Yes, Delete Challenge
              </button>
            </div>
          </div>
        </div>
      )}
      {/* SQUAD ACCOUNTABILITY RULE MODAL */}
      {ruleModalChallenge && (
        <div 
          onClick={() => setRuleModalChallenge(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#090C13] border border-[#1C2230] rounded-t-3xl sm:rounded-3xl p-5 space-y-4 shadow-2xl animate-slide-up"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#1C2230]">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <ShieldCheck size={18} className="text-[#3B82FF]" />
                <span>{ruleModalChallenge.type === 'squad' ? 'Squad Accountability Rule' : 'Challenge Details'}</span>
              </div>
              <button
                type="button"
                onClick={() => setRuleModalChallenge(null)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-[#8A92A6] hover:text-white hover:bg-[#121622] transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div>
              <h4 className="text-base font-bold text-white mb-1 leading-snug">
                {ruleModalChallenge.title}
              </h4>
              <p className="text-xs text-[#8A92A6]">
                Target: {ruleModalChallenge.target} Days • {ruleModalChallenge.type === 'squad' ? 'Squad Challenge' : 'Solo Challenge'}
              </p>
            </div>

            <p className="text-xs text-[#A8B2C2] leading-relaxed whitespace-pre-wrap break-words">
              {ruleModalChallenge.description}
            </p>

            {ruleModalChallenge.type === 'squad' && (
              <>
                <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/25 space-y-2">
                  <div className="flex items-center gap-2 text-red-400 font-bold text-xs">
                    <AlertTriangle size={15} />
                    <span>THE ZERO-FAILURE PRINCIPLE</span>
                  </div>
                  <p className="text-xs text-red-200/90 leading-relaxed">
                    Every squad member must submit a verified daily photo proof before midnight. If one person misses a day, the squad restarts together.
                  </p>
                </div>

                <div className="space-y-2 text-xs text-[#A8B2C2]">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#2166FF]/20 text-[#3B82FF] flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
                    <span>Challenge moderators verify daily photo evidence before it appears in the cohort feed.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#2166FF]/20 text-[#3B82FF] flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
                    <span>Support your teammates and maintain collective discipline throughout the challenge.</span>
                  </div>
                </div>
              </>
            )}

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const ch = ruleModalChallenge;
                  setRuleModalChallenge(null);
                  onSelectChallenge(ch);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#2166FF] hover:bg-[#1a55d6] text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-[#2166FF]/25 flex items-center justify-center gap-1.5"
              >
                <span>View Full Challenge Details</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
