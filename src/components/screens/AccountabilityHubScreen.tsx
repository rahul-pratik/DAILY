import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  CheckCircle2, 
  Circle, 
  Trophy, 
  Globe, 
  Plus, 
  ChevronRight, 
  ChevronLeft,
  Check, 
  Flame, 
  ArrowUpDown,
  Filter,
  Trash2,
  Grid,
  List,
  Search,
  MessageSquare,
  ThumbsUp,
  X,
  Share2,
  Sparkles,
  ExternalLink,
  Code,
  BookOpen,
  Camera,
  Layers,
  Send,
  Lock
} from 'lucide-react';
import { Author, Challenge, CohortProof, Community, CommunityPost, ToDoItem } from '../../types';
import { INITIAL_COMMUNITY_WRITINGS } from '../../data/initialData';

interface AccountabilityHubScreenProps {
  currentUser: Author;
  hubUser?: Author;
  toDoList: ToDoItem[];
  completedChallenges: Challenge[];
  allChallenges?: Challenge[];
  joinedCommunities: Community[];
  allCommunities?: Community[];
  communityWritings?: CommunityPost[];
  onBack: () => void;
  onToggleToDo: (id: string) => void;
  onAddCustomToDo: (title: string, date: string, category: string) => void;
  onDeleteToDo: (id: string) => void;
  onSelectCommunity: (community: Community) => void;
  onSelectChallenge: (challenge: Challenge) => void;
  onAddCommunityPost?: (post: Partial<CommunityPost>) => void;
  onNavigateUser?: (user: { name: string; username: string }) => void;
  onToggleHubPrivacy?: (newPrivacy: 'public' | 'private') => void;
}

export const AccountabilityHubScreen: React.FC<AccountabilityHubScreenProps> = ({
  currentUser,
  hubUser,
  toDoList,
  completedChallenges,
  allChallenges = [],
  joinedCommunities,
  allCommunities = [],
  communityWritings = INITIAL_COMMUNITY_WRITINGS,
  onBack,
  onToggleToDo,
  onAddCustomToDo,
  onDeleteToDo,
  onSelectCommunity,
  onSelectChallenge,
  onAddCommunityPost,
  onNavigateUser,
  onToggleHubPrivacy,
}) => {
  const targetUser = hubUser || currentUser;
  const isSelf = targetUser.username === currentUser.username;

  const [activeTab, setActiveTab] = useState<'todo' | 'completed' | 'communities'>('todo');

  // To-Do list state
  const [calendarSort, setCalendarSort] = useState<'asc' | 'desc'>('asc');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'upcoming'>('all');
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAddForm, setShowAddForm] = useState(false);

  // Completed challenges & Proofs Showcase state
  // Prioritize completed challenge with 30 proofs if available
  const allFinished = completedChallenges.length > 0 
    ? completedChallenges 
    : allChallenges.filter(c => c.status === 'completed' || c.current >= c.target);

  const defaultSelectedChallenge = allFinished.find(c => c.id === 'ch_coding30') || allFinished[0] || null;
  const [selectedCompletedChallenge, setSelectedCompletedChallenge] = useState<Challenge | null>(defaultSelectedChallenge);
  const [proofViewMode, setProofViewMode] = useState<'grid' | 'timeline'>('grid');
  const [proofSearchQuery, setProofSearchQuery] = useState('');
  const [selectedProofModal, setSelectedProofModal] = useState<CohortProof | null>(null);

  // Hubs & Stuffs Written in Communities state
  const [hubsSubView, setHubsSubView] = useState<'writings' | 'directories'>('writings');
  const [selectedCommunityFilter, setSelectedCommunityFilter] = useState<string>('all');
  const [writingCategoryFilter, setWritingCategoryFilter] = useState<string>('all');
  const [writingSearchQuery, setWritingSearchQuery] = useState('');
  const [allWritings, setAllWritings] = useState<CommunityPost[]>(communityWritings);
  
  // Quick write in community form
  const [showWriteComposer, setShowWriteComposer] = useState(false);
  const [composerCommunityId, setComposerCommunityId] = useState(joinedCommunities[0]?.id || 'comm_growingup');
  const [composerTitle, setComposerTitle] = useState('');
  const [composerContent, setComposerContent] = useState('');
  const [composerCategory, setComposerCategory] = useState<'Discussion' | 'Question' | 'Advice' | 'Story' | 'Milestone'>('Discussion');

  // Filter and sort ToDo list
  const todayStr = new Date().toISOString().split('T')[0];
  const filteredToDos = toDoList
    .filter((item) => {
      if (dateFilter === 'today') return item.scheduledDate === todayStr;
      if (dateFilter === 'upcoming') return item.scheduledDate >= todayStr;
      return true;
    })
    .sort((a, b) => {
      if (calendarSort === 'asc') {
        return a.scheduledDate.localeCompare(b.scheduledDate);
      }
      return b.scheduledDate.localeCompare(a.scheduledDate);
    });

  const handleCreateToDo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddCustomToDo(newTitle.trim(), newDate, 'General');
    setNewTitle('');
    setShowAddForm(false);
  };

  // Proofs computation for the selected completed challenge
  const activeChallengeProofs: CohortProof[] = selectedCompletedChallenge?.squadProofs || [];
  
  const filteredProofs = activeChallengeProofs.filter((p) => {
    if (!proofSearchQuery.trim()) return true;
    const q = proofSearchQuery.toLowerCase();
    return (
      p.note.toLowerCase().includes(q) ||
      `day ${p.dayNumber}`.includes(q) ||
      p.timestamp.toLowerCase().includes(q)
    );
  });

  // Modal Next/Prev Day Proof navigation
  const handleNavigateModalProof = (direction: 'prev' | 'next') => {
    if (!selectedProofModal || activeChallengeProofs.length === 0) return;
    const currentIndex = activeChallengeProofs.findIndex(p => p.id === selectedProofModal.id);
    if (currentIndex === -1) return;

    if (direction === 'prev' && currentIndex > 0) {
      setSelectedProofModal(activeChallengeProofs[currentIndex - 1]);
    } else if (direction === 'next' && currentIndex < activeChallengeProofs.length - 1) {
      setSelectedProofModal(activeChallengeProofs[currentIndex + 1]);
    }
  };

  // Filter Stuffs Written in Communities
  const filteredWritings = allWritings.filter((w) => {
    if (selectedCommunityFilter !== 'all' && w.communityId !== selectedCommunityFilter) return false;
    if (writingCategoryFilter !== 'all' && w.category.toLowerCase() !== writingCategoryFilter.toLowerCase()) return false;
    if (writingSearchQuery.trim()) {
      const q = writingSearchQuery.toLowerCase();
      return (
        w.title.toLowerCase().includes(q) ||
        w.content.toLowerCase().includes(q) ||
        (w.communityName && w.communityName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Toggle upvote / like on community writing
  const handleToggleVoteWriting = (writingId: string) => {
    setAllWritings(prev => prev.map(w => {
      if (w.id === writingId) {
        const isUp = w.userVote === 'up';
        return {
          ...w,
          upvotes: isUp ? w.upvotes - 1 : w.upvotes + 1,
          userVote: isUp ? null : 'up',
        };
      }
      return w;
    }));
  };

  // Submit new community writing
  const handleSubmitWriting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composerTitle.trim() && !composerContent.trim()) return;

    const targetComm = (joinedCommunities.concat(allCommunities)).find(c => c.id === composerCommunityId);
    const newPost: CommunityPost = {
      id: `cw_custom_${Date.now()}`,
      communityId: composerCommunityId,
      communityName: targetComm?.name || 'Growingup',
      author: {
        name: currentUser.name,
        username: currentUser.username,
        avatar: currentUser.avatar,
        isMod: false,
      },
      title: composerTitle.trim() || composerContent.trim().slice(0, 50),
      content: composerContent.trim() || composerTitle.trim(),
      category: composerCategory,
      badges: ['NEW'],
      upvotes: 1,
      userVote: 'up',
      timestamp: 'Just now',
      commentsCount: 0,
    };

    setAllWritings([newPost, ...allWritings]);
    onAddCommunityPost?.(newPost);
    setComposerTitle('');
    setComposerContent('');
    setShowWriteComposer(false);
  };

  // If viewing someone else's hub and they set it to private
  if (!isSelf && targetUser.accountabilityHubPrivacy === 'private') {
    return (
      <div className="pb-24 pt-2 px-3 sm:px-4 animate-fade-in bg-black min-h-screen text-white flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-2.5 pb-3 pt-1 border-b border-[#20242C]/70 mb-6">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-[#101010] hover:bg-[#1f242e] border border-[#20242C] flex items-center justify-center text-[#9298A3] hover:text-white transition-colors cursor-pointer shrink-0"
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-base font-bold text-white truncate">
              @{targetUser.username}'s Hub
            </h1>
            <p className="text-xs text-[#9298A3]">Accountability & Sprints</p>
          </div>
        </div>

        {/* Private State Notice */}
        <div className="my-auto py-12 px-6 text-center max-w-sm mx-auto bg-[#080B10] border border-[#20242C] rounded-3xl space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
            <Lock size={28} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white mb-1.5">
              Private Accountability Hub
            </h3>
            <p className="text-xs text-[#9298A3] leading-relaxed">
              @{targetUser.username} has chosen to keep their daily sprints, to-do calendar, and verification proof gallery private.
            </p>
          </div>
          <button
            onClick={onBack}
            className="w-full py-2.5 rounded-xl bg-[#2166FF] hover:bg-[#3B82FF] text-white text-xs font-semibold cursor-pointer transition-colors shadow-md shadow-[#2166FF]/25"
          >
            Return to Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 pt-2 px-3 sm:px-4 animate-fade-in bg-black min-h-screen text-white">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 pt-1 border-b border-[#20242C]/70 mb-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-[#101010] hover:bg-[#1f242e] border border-[#20242C] flex items-center justify-center text-[#9298A3] hover:text-white transition-colors cursor-pointer shrink-0"
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <h1 className="text-base font-bold text-white truncate">
              {isSelf ? 'Accountability Hub' : `@${targetUser.username}'s Hub`}
            </h1>
            <p className="text-xs text-[#9298A3] truncate">
              {isSelf ? 'Daily Sprints, Challenge Proofs & Hub Writings' : `Public Sprints & Verification Proofs`}
            </p>
          </div>
        </div>

        <img
          src={targetUser.avatar}
          alt={targetUser.name}
          className="w-8 h-8 rounded-full object-cover border border-[#2166FF]/60 shrink-0"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Visibility Setting indicator / Quick Switch for self */}
      {isSelf && (
        <div className="mb-4 p-2.5 rounded-2xl bg-[#080B10] border border-[#20242C] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${targetUser.accountabilityHubPrivacy === 'private' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
            <span className="text-[#9298A3]">Hub Visibility:</span>
            <span className="font-bold text-white uppercase font-mono text-[11px]">
              {targetUser.accountabilityHubPrivacy || 'public'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onToggleHubPrivacy?.(targetUser.accountabilityHubPrivacy === 'private' ? 'public' : 'private')}
            className="px-2.5 py-1 rounded-xl bg-[#101010] hover:bg-[#1a1f29] text-[11px] font-semibold text-[#9298A3] hover:text-white border border-[#20242C] transition-colors cursor-pointer"
          >
            Make {targetUser.accountabilityHubPrivacy === 'private' ? 'Public' : 'Private'}
          </button>
        </div>
      )}

      {/* Sleek Minimal 3-Tab Navigator */}
      <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-[#090C12] border border-[#1E232F] rounded-2xl mb-5 shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab('todo')}
          className={`py-2.5 px-2 sm:px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'todo'
              ? 'bg-[#2166FF] text-white shadow-md shadow-[#2166FF]/20 font-bold'
              : 'text-[#9298A3] hover:text-white hover:bg-[#121620]'
          }`}
        >
          <Calendar size={14} className={activeTab === 'todo' ? 'text-white' : 'text-[#9298A3]'} />
          <span className="truncate">To-Do</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('completed')}
          className={`py-2.5 px-2 sm:px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'completed'
              ? 'bg-[#2166FF] text-white shadow-md shadow-[#2166FF]/20 font-bold'
              : 'text-[#9298A3] hover:text-white hover:bg-[#121620]'
          }`}
        >
          <Trophy size={14} className={activeTab === 'completed' ? 'text-white' : 'text-[#9298A3]'} />
          <span className="truncate">Challenges Done</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('communities')}
          className={`py-2.5 px-2 sm:px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'communities'
              ? 'bg-[#2166FF] text-white shadow-md shadow-[#2166FF]/20 font-bold'
              : 'text-[#9298A3] hover:text-white hover:bg-[#121620]'
          }`}
        >
          <Globe size={14} className={activeTab === 'communities' ? 'text-white' : 'text-[#9298A3]'} />
          <span className="truncate">Hubs</span>
        </button>
      </div>

      {/* TAB 1: TO-DO PLANNER */}
      {activeTab === 'todo' && (
        <div className="space-y-4">
          {/* Controls: Date Filter & Calendar Sort */}
          <div className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-[#080B10] border border-[#20242C]">
            <div className="flex items-center gap-1.5">
              <Filter size={13} className="text-[#9298A3]" />
              {(['all', 'today', 'upcoming'] as const).map((filterKey) => (
                <button
                  key={filterKey}
                  onClick={() => setDateFilter(filterKey)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize transition-all cursor-pointer ${
                    dateFilter === filterKey
                      ? 'bg-[#2166FF] text-white'
                      : 'bg-[#101010] text-[#9298A3] hover:text-white'
                  }`}
                >
                  {filterKey}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCalendarSort(calendarSort === 'asc' ? 'desc' : 'asc')}
                className="flex items-center gap-1 px-2 py-1 rounded-xl bg-[#101010] border border-[#20242C] text-[11px] text-[#9298A3] hover:text-white transition-colors cursor-pointer"
                title="Sort by Scheduled Date"
              >
                <ArrowUpDown size={12} />
                <span>{calendarSort === 'asc' ? 'Earliest' : 'Latest'}</span>
              </button>

              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="w-7 h-7 rounded-full bg-[#2166FF] hover:bg-[#3B82FF] flex items-center justify-center text-white cursor-pointer shadow-sm"
                title="Schedule custom task"
              >
                <Plus size={15} />
              </button>
            </div>
          </div>

          {/* Quick Schedule Form */}
          {showAddForm && (
            <form onSubmit={handleCreateToDo} className="p-3.5 rounded-2xl bg-[#080B10] border border-[#2166FF]/40 space-y-2.5 animate-scale-in">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Calendar size={13} className="text-[#3B82FF]" />
                <span>Schedule Sprint Action Item</span>
              </h4>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="What sprint milestone will you perform?"
                className="w-full bg-[#101010] border border-[#20242C] rounded-xl px-3 py-2 text-xs text-white placeholder-[#9298A3] focus:outline-none focus:border-[#2166FF]"
                autoFocus
              />
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="bg-[#101010] border border-[#20242C] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                />
                <button
                  type="submit"
                  className="flex-1 py-1.5 rounded-xl bg-[#2166FF] hover:bg-[#3B82FF] text-white font-semibold text-xs cursor-pointer"
                >
                  Save to Calendar
                </button>
              </div>
            </form>
          )}

          {/* To-Do Items List */}
          <div className="space-y-2.5">
            {filteredToDos.map((item) => (
              <div
                key={item.id}
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                  item.completed
                    ? 'bg-[#080B10]/40 border-[#20242C]/40 opacity-60'
                    : 'bg-[#080B10] border-[#20242C] hover:border-[#2166FF]/30'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => onToggleToDo(item.id)}
                    className="cursor-pointer text-[#2166FF] hover:scale-110 transition-transform shrink-0"
                    aria-label="Toggle completed"
                  >
                    {item.completed ? (
                      <CheckCircle2 size={20} className="fill-[#2166FF] text-black" />
                    ) : (
                      <Circle size={20} className="text-[#9298A3]" />
                    )}
                  </button>

                  <div className="min-w-0">
                    <p className={`text-xs font-semibold truncate ${
                      item.completed ? 'line-through text-[#9298A3]' : 'text-white'
                    }`}>
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-[#9298A3] font-mono mt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} className="text-[#3B82FF]" />
                        <span>{item.scheduledDate}</span>
                      </span>
                      <span>•</span>
                      <span>{item.category}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onDeleteToDo(item.id)}
                  className="text-[#9298A3] hover:text-red-400 p-1 cursor-pointer shrink-0 transition-colors"
                  aria-label="Delete item"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}

            {filteredToDos.length === 0 && (
              <div className="py-12 text-center text-[#9298A3] bg-[#080B10] rounded-2xl border border-[#20242C]">
                <Calendar size={28} className="mx-auto text-[#2166FF] mb-2 opacity-60" />
                <p className="text-xs font-medium text-white mb-1">Your planner is clear</p>
                <p className="text-[11px] text-[#9298A3]">Click "Add to To-Do" on any challenge to schedule your sprints!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: COMPLETED CHALLENGES & ALL PROOFS SHOWCASE (eg: 30 Days of Code - All 30 Days Photos) */}
      {activeTab === 'completed' && (
        <div className="space-y-4">
          {/* Completed Sprints Selector Row */}
          <div>
            <div className="flex items-center justify-between text-xs text-[#9298A3] px-1 mb-2">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Trophy size={14} className="text-emerald-400" />
                <span>Finished Sprints</span>
              </span>
              <span className="font-mono text-[#3B82FF] font-bold">{allFinished.length} Completed</span>
            </div>

            {/* Horizontal pill list of completed challenges */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {allFinished.map((ch) => {
                const isSelected = selectedCompletedChallenge?.id === ch.id;
                const totalProofsCount = ch.squadProofs?.length || (ch.durationDays || ch.target || 30);
                return (
                  <button
                    key={ch.id}
                    onClick={() => setSelectedCompletedChallenge(ch)}
                    className={`px-3 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-[#2166FF] text-white shadow-md shadow-[#2166FF]/25 border border-[#2166FF]'
                        : 'bg-[#080B10] hover:bg-[#101010] text-[#9298A3] hover:text-white border border-[#20242C]'
                    }`}
                  >
                    <CheckCircle2 size={13} className={isSelected ? 'text-white' : 'text-emerald-400'} />
                    <span>{ch.title}</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-black/30 text-white' : 'bg-[#101010] text-emerald-400'
                    }`}>
                      {totalProofsCount} proofs
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ACTIVE SELECTED CHALLENGE PROOF SHOWCASE */}
          {selectedCompletedChallenge ? (
            <div className="p-4 rounded-3xl bg-[#080B10] border border-[#20242C] space-y-4">
              {/* Challenge Overview Card */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#20242C]">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <Check size={10} /> 100% DONE
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#2166FF]/15 text-[#3B82FF] border border-[#2166FF]/30 uppercase">
                      {selectedCompletedChallenge.category}
                    </span>
                  </div>

                  <h2 className="text-base font-bold text-white tracking-tight">
                    {selectedCompletedChallenge.title}
                  </h2>
                  <p className="text-xs text-[#9298A3] mt-0.5">
                    {selectedCompletedChallenge.whatYouPerform || selectedCompletedChallenge.description}
                  </p>

                  <div className="flex items-center gap-2 text-[11px] text-[#9298A3] font-mono mt-2">
                    <span className="text-emerald-400 font-bold">
                      All {activeChallengeProofs.length} Daily Verification Photos Logged
                    </span>
                    <span>•</span>
                    <span>Target: {selectedCompletedChallenge.target} {selectedCompletedChallenge.unit || 'days'}</span>
                  </div>
                </div>

                <button
                  onClick={() => onSelectChallenge(selectedCompletedChallenge)}
                  className="px-3 py-1.5 rounded-xl bg-[#101010] hover:bg-[#1f242e] border border-[#20242C] text-xs font-semibold text-white flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <span>Details</span>
                  <ExternalLink size={12} />
                </button>
              </div>

              {/* Showcase Controls: Grid vs Timeline & Proof Search */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-1 bg-[#101010] p-1 rounded-xl border border-[#20242C]">
                  <button
                    onClick={() => setProofViewMode('grid')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      proofViewMode === 'grid'
                        ? 'bg-[#2166FF] text-white shadow-sm'
                        : 'text-[#9298A3] hover:text-white'
                    }`}
                  >
                    <Grid size={13} />
                    <span>Photo Grid</span>
                  </button>

                  <button
                    onClick={() => setProofViewMode('timeline')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      proofViewMode === 'timeline'
                        ? 'bg-[#2166FF] text-white shadow-sm'
                        : 'text-[#9298A3] hover:text-white'
                    }`}
                  >
                    <List size={13} />
                    <span>Timeline Feed</span>
                  </button>
                </div>

                {/* Search notes/day */}
                <div className="relative flex-1 max-w-[160px] sm:max-w-[200px]">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9298A3]" />
                  <input
                    type="text"
                    value={proofSearchQuery}
                    onChange={(e) => setProofSearchQuery(e.target.value)}
                    placeholder="Search day or log..."
                    className="w-full bg-[#101010] border border-[#20242C] rounded-xl pl-7 pr-2.5 py-1 text-xs text-white placeholder-[#9298A3] focus:outline-none focus:border-[#2166FF]"
                  />
                </div>
              </div>

              {/* ALL PROOFS: PHOTO GRID VIEW (Showing all 30 days photos) */}
              {proofViewMode === 'grid' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-[#9298A3]">
                    <span>Showing all daily photos ({filteredProofs.length} of {activeChallengeProofs.length})</span>
                    <span className="text-[#3B82FF] font-mono">Tap any photo to inspect</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {filteredProofs.map((proof) => (
                      <div
                        key={proof.id}
                        onClick={() => setSelectedProofModal(proof)}
                        className="group relative rounded-2xl overflow-hidden border border-[#20242C] bg-[#101010] aspect-square cursor-pointer hover:border-[#2166FF] transition-all hover:scale-[1.02] shadow-md"
                      >
                        <img
                          src={proof.photoUrl || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80'}
                          alt={`Day ${proof.dayNumber} proof`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
                        {/* Overlay gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-2.5 flex flex-col justify-between">
                          {/* Day badge top */}
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#2166FF] text-white shadow-sm font-mono">
                              Day {proof.dayNumber}
                            </span>
                            <span className="w-5 h-5 rounded-full bg-emerald-500/80 text-black flex items-center justify-center">
                              <Check size={11} className="stroke-[3]" />
                            </span>
                          </div>

                          {/* Note preview bottom */}
                          <div>
                            <p className="text-[11px] font-medium text-white line-clamp-2 leading-tight">
                              {proof.note}
                            </p>
                            <span className="text-[9px] text-[#9298A3] font-mono mt-0.5 block">
                              {proof.timestamp}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ALL PROOFS: TIMELINE FEED VIEW (Day-by-day logs) */}
              {proofViewMode === 'timeline' && (
                <div className="space-y-3">
                  {filteredProofs.map((proof) => (
                    <div
                      key={proof.id}
                      onClick={() => setSelectedProofModal(proof)}
                      className="p-3.5 rounded-2xl bg-[#101010] border border-[#20242C] hover:border-[#2166FF]/40 transition-all cursor-pointer flex items-start gap-3.5 group"
                    >
                      <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-[#20242C] bg-black relative group-hover:border-[#2166FF]">
                        <img
                          src={proof.photoUrl || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80'}
                          alt={`Day ${proof.dayNumber}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          referrerPolicy="no-referrer"
                        />
                        <span className="absolute bottom-1 left-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-black/80 text-white font-mono">
                          D{proof.dayNumber}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-bold text-white group-hover:text-[#3B82FF] transition-colors truncate">
                            Day {proof.dayNumber} of {selectedCompletedChallenge.target}
                          </span>
                          <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 shrink-0">
                            <CheckCircle2 size={11} /> Verified
                          </span>
                        </div>

                        <p className="text-xs text-white/90 line-clamp-2 leading-relaxed mb-1.5">
                          {proof.note}
                        </p>

                        <div className="flex items-center gap-3 text-[10px] text-[#9298A3] font-mono">
                          <span>{proof.timestamp}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-[#3B82FF]">
                            <Flame size={11} /> {proof.likesCount} cheers
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-[#9298A3] bg-[#080B10] rounded-2xl border border-[#20242C]">
              <Trophy size={28} className="mx-auto text-[#2166FF] mb-2 opacity-60" />
              <p className="text-xs font-semibold text-white">No completed challenges recorded yet</p>
              <p className="text-[11px] text-[#9298A3]">Complete a challenge to unlock its 30-day proof gallery!</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: HUBS & ALL STUFFS WRITTEN IN COMMUNITIES */}
      {activeTab === 'communities' && (
        <div className="space-y-4">
          {/* Subheader Switcher: All Stuffs Written vs Directory */}
          <div className="flex items-center justify-between gap-2">
            <div className="grid grid-cols-2 gap-1 p-1 bg-[#090C12] border border-[#1E232F] rounded-2xl flex-1">
              <button
                type="button"
                onClick={() => setHubsSubView('writings')}
                className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  hubsSubView === 'writings'
                    ? 'bg-[#2166FF] text-white shadow-sm'
                    : 'text-[#9298A3] hover:text-white hover:bg-[#121620]'
                }`}
              >
                <MessageSquare size={13} />
                <span>All Stuffs Written</span>
              </button>

              <button
                type="button"
                onClick={() => setHubsSubView('directories')}
                className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  hubsSubView === 'directories'
                    ? 'bg-[#2166FF] text-white shadow-sm'
                    : 'text-[#9298A3] hover:text-white hover:bg-[#121620]'
                }`}
              >
                <Globe size={13} />
                <span>Joined Hubs</span>
              </button>
            </div>

            <button
              onClick={() => setShowWriteComposer(!showWriteComposer)}
              className="px-3 py-2 rounded-2xl bg-[#2166FF] hover:bg-[#3B82FF] active:scale-95 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-[#2166FF]/20 transition-all cursor-pointer shrink-0"
            >
              <Plus size={14} className="stroke-[2.5]" />
              <span>Write in Hub</span>
            </button>
          </div>

          {/* Quick Write Composer in Hub */}
          {showWriteComposer && (
            <form onSubmit={handleSubmitWriting} className="p-4 rounded-3xl bg-[#080B10] border border-[#2166FF]/50 space-y-3 animate-scale-in">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <MessageSquare size={14} className="text-[#3B82FF]" />
                  <span>Write in Community Hub</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setShowWriteComposer(false)}
                  className="text-[#9298A3] hover:text-white"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Target Community Selector */}
              <div>
                <label className="block text-[10px] font-bold text-[#9298A3] uppercase tracking-wider mb-1">
                  Select Hub to Post Into
                </label>
                <select
                  value={composerCommunityId}
                  onChange={(e) => setComposerCommunityId(e.target.value)}
                  className="w-full bg-[#101010] border border-[#20242C] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#2166FF]"
                >
                  {joinedCommunities.concat(allCommunities).map((comm) => (
                    <option key={comm.id} value={comm.id}>
                      {comm.name} ({comm.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <input
                  type="text"
                  value={composerTitle}
                  onChange={(e) => setComposerTitle(e.target.value)}
                  placeholder="Discussion Title or Headline..."
                  className="w-full bg-[#101010] border border-[#20242C] rounded-xl px-3 py-2 text-xs text-white placeholder-[#9298A3] focus:outline-none focus:border-[#2166FF]"
                />
              </div>

              <div>
                <textarea
                  value={composerContent}
                  onChange={(e) => setComposerContent(e.target.value)}
                  rows={3}
                  placeholder="Write your advice, milestone, question, or discussion insight here..."
                  className="w-full bg-[#101010] border border-[#20242C] rounded-xl px-3 py-2 text-xs text-white placeholder-[#9298A3] focus:outline-none focus:border-[#2166FF] resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                  {(['Discussion', 'Advice', 'Milestone', 'Question'] as const).map((cat) => (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => setComposerCategory(cat)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                        composerCategory === cat
                          ? 'bg-[#2166FF] text-white'
                          : 'bg-[#101010] text-[#9298A3] hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#2166FF] hover:bg-[#3B82FF] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#2166FF]/25"
                >
                  <Send size={13} />
                  <span>Publish</span>
                </button>
              </div>
            </form>
          )}

          {/* SUBVIEW 1: ALL STUFFS WRITTEN IN COMMUNITIES */}
          {hubsSubView === 'writings' && (
            <div className="space-y-3">
              {/* Filter by Community Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                <button
                  onClick={() => setSelectedCommunityFilter('all')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCommunityFilter === 'all'
                      ? 'bg-[#2166FF] text-white shadow-sm'
                      : 'bg-[#080B10] hover:bg-[#101010] text-[#9298A3] hover:text-white border border-[#20242C]'
                  }`}
                >
                  All Hubs ({allWritings.length})
                </button>

                {joinedCommunities.concat(allCommunities.filter(c => !joinedCommunities.some(j => j.id === c.id))).map((comm) => (
                  <button
                    key={comm.id}
                    onClick={() => setSelectedCommunityFilter(comm.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                      selectedCommunityFilter === comm.id
                        ? 'bg-[#2166FF] text-white shadow-sm'
                        : 'bg-[#080B10] hover:bg-[#101010] text-[#9298A3] hover:text-white border border-[#20242C]'
                    }`}
                  >
                    <span>{comm.name}</span>
                  </button>
                ))}
              </div>

              {/* Search bar for written stuffs */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9298A3]" />
                <input
                  type="text"
                  value={writingSearchQuery}
                  onChange={(e) => setWritingSearchQuery(e.target.value)}
                  placeholder="Search all stuffs written in community hubs..."
                  className="w-full bg-[#080B10] border border-[#20242C] rounded-2xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-[#9298A3] focus:outline-none focus:border-[#2166FF]"
                />
              </div>

              {/* List of All Stuffs Written in Communities */}
              <div className="space-y-3">
                {filteredWritings.map((post) => {
                  const parentCommunity = joinedCommunities.concat(allCommunities).find(c => c.id === post.communityId);
                  return (
                    <div
                      key={post.id}
                      className="p-4 rounded-3xl bg-[#080B10] border border-[#20242C] space-y-3 hover:border-[#20242C]/90 transition-all"
                    >
                      {/* Community Badge & Category */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <button
                          onClick={() => parentCommunity && onSelectCommunity(parentCommunity)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#101010] hover:bg-[#1a1f29] border border-[#20242C] text-[#3B82FF] transition-colors cursor-pointer"
                        >
                          <Globe size={11} />
                          <span>{post.communityName || parentCommunity?.name || 'Community Hub'}</span>
                          <ChevronRight size={11} className="text-[#9298A3]" />
                        </button>

                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#2166FF]/15 text-[#3B82FF] border border-[#2166FF]/20">
                            #{post.category}
                          </span>
                          {post.badges && post.badges[0] && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/20">
                              {post.badges[0]}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Author Header */}
                      <div className="flex items-center gap-2.5">
                        <img
                          src={post.author.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                          alt={post.author.name}
                          className="w-8 h-8 rounded-full object-cover border border-[#20242C]"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span 
                              onClick={() => onNavigateUser?.({ name: post.author.name, username: post.author.username })}
                              className="text-xs font-bold text-white hover:text-[#3B82FF] cursor-pointer truncate"
                            >
                              {post.author.name}
                            </span>
                            {post.author.isMod && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#2166FF] text-white">
                                MOD
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-[#9298A3] font-mono">
                            @{post.author.username} · {post.timestamp}
                          </span>
                        </div>
                      </div>

                      {/* Title & Written Content */}
                      <div>
                        <h3 className="text-sm font-bold text-white mb-1 leading-snug">
                          {post.title}
                        </h3>
                        <p className="text-xs text-white/90 leading-relaxed whitespace-pre-wrap">
                          {post.content}
                        </p>
                      </div>

                      {/* Footer Actions: Upvote & Open in Hub */}
                      <div className="flex items-center justify-between pt-2 border-t border-[#20242C]/60 text-xs">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleToggleVoteWriting(post.id)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                              post.userVote === 'up'
                                ? 'bg-[#2166FF]/20 text-[#3B82FF] border border-[#2166FF]/40'
                                : 'bg-[#101010] text-[#9298A3] hover:text-white border border-[#20242C]'
                            }`}
                          >
                            <ThumbsUp size={12} className={post.userVote === 'up' ? 'fill-[#3B82FF]' : ''} />
                            <span>{post.upvotes}</span>
                          </button>

                          <div className="flex items-center gap-1 text-[#9298A3] font-mono text-[11px]">
                            <MessageSquare size={12} />
                            <span>{post.commentsCount || 0} replies</span>
                          </div>
                        </div>

                        {parentCommunity && (
                          <button
                            type="button"
                            onClick={() => onSelectCommunity(parentCommunity)}
                            className="text-[#3B82FF] hover:text-white font-semibold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <span>Open in Hub</span>
                            <ChevronRight size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {filteredWritings.length === 0 && (
                  <div className="py-12 text-center text-[#9298A3] bg-[#080B10] rounded-2xl border border-[#20242C]">
                    <MessageSquare size={28} className="mx-auto text-[#2166FF] mb-2 opacity-60" />
                    <p className="text-xs font-semibold text-white">No community posts match your filter</p>
                    <p className="text-[11px] text-[#9298A3]">Click "Write in Hub" above to post the first discussion!</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SUBVIEW 2: DIRECTORY OF JOINED COMMUNITIES */}
          {hubsSubView === 'directories' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-[#9298A3] px-1">
                <span>Your Active Communities</span>
                <span className="font-mono text-[#3B82FF] font-bold">{joinedCommunities.length} Joined</span>
              </div>

              {joinedCommunities.map((community) => (
                <div
                  key={community.id}
                  onClick={() => onSelectCommunity(community)}
                  className="p-4 rounded-3xl bg-[#080B10] hover:bg-[#101010] border border-[#20242C] transition-all flex items-center justify-between gap-3 cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-[#101010] border border-[#20242C] flex items-center justify-center text-[#3B82FF] shrink-0">
                      <Globe size={20} />
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-white group-hover:text-[#3B82FF] transition-colors truncate">
                        {community.name}
                      </h3>
                      <p className="text-xs text-[#9298A3] truncate">
                        {community.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-[#3B82FF] font-semibold shrink-0">
                    <span>Enter Hub</span>
                    <ChevronRight size={15} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FULLSCREEN LIGHTBOX MODAL TO INSPECT ANY PROOF PHOTO */}
      {selectedProofModal && (
        <div
          onClick={() => setSelectedProofModal(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-[#080B10] border border-[#20242C] rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] animate-scale-in"
          >
            {/* Modal Top Bar */}
            <div className="p-4 pb-3 flex items-center justify-between border-b border-[#20242C] bg-black/60">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#2166FF] text-white font-mono">
                  Day {selectedProofModal.dayNumber}
                </span>
                <span className="text-xs font-bold text-white truncate">
                  {selectedCompletedChallenge?.title || 'Daily Verification Proof'}
                </span>
              </div>

              <button
                onClick={() => setSelectedProofModal(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#9298A3] hover:text-white hover:bg-[#101010] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* High-res Photo with Navigation Arrows */}
            <div className="relative bg-black flex items-center justify-center min-h-[260px] max-h-[380px] overflow-hidden">
              <img
                src={selectedProofModal.photoUrl || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80'}
                alt={`Day ${selectedProofModal.dayNumber} proof`}
                className="w-full h-full object-contain max-h-[380px]"
                referrerPolicy="no-referrer"
              />

              {/* Prev / Next Arrows */}
              <button
                type="button"
                onClick={() => handleNavigateModalProof('prev')}
                disabled={activeChallengeProofs.findIndex(p => p.id === selectedProofModal.id) <= 0}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer border border-white/10"
                aria-label="Previous Day"
              >
                <ChevronLeft size={20} />
              </button>

              <button
                type="button"
                onClick={() => handleNavigateModalProof('next')}
                disabled={activeChallengeProofs.findIndex(p => p.id === selectedProofModal.id) >= activeChallengeProofs.length - 1}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer border border-white/10"
                aria-label="Next Day"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Modal Bottom: Note & Details */}
            <div className="p-4 space-y-3 bg-[#080B10]">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 size={13} /> Day {selectedProofModal.dayNumber} Verified Proof
                  </span>
                  <span className="text-[#9298A3] font-mono">· {selectedProofModal.timestamp}</span>
                </div>

                <span className="text-[#3B82FF] font-mono text-[11px] flex items-center gap-1">
                  <Flame size={12} /> {selectedProofModal.likesCount} verified cheers
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-[#101010] border border-[#20242C]">
                <p className="text-xs text-white/95 leading-relaxed">
                  {selectedProofModal.note}
                </p>
              </div>

              {/* Day Jumper indicators */}
              <div className="flex items-center justify-between pt-1 text-[11px] text-[#9298A3] font-mono">
                <span>Progress: Day {selectedProofModal.dayNumber} of {activeChallengeProofs.length}</span>
                <span className="text-emerald-400">100% Sprint Proof Logged</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
