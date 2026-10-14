import React, { useState } from 'react';
import { 
  ArrowLeft, 
  MessageSquare, 
  Flame, 
  Camera, 
  Heart, 
  Trophy, 
  Users, 
  CheckCircle, 
  Send, 
  Image as ImageIcon,
  Sparkles,
  Plus,
  ChevronRight,
  BookOpen,
  Code,
  Check
} from 'lucide-react';
import { Author, Challenge, CohortProof } from '../../types';

interface CohortDiscussionsScreenProps {
  challenge: Challenge;
  challenges?: Challenge[];
  currentUser: Author;
  initialViewMode?: 'list' | 'detail';
  onBack: () => void;
  onSelectChallengeCohort?: (challenge: Challenge) => void;
  onNavigateUser?: (user: { name: string; username: string }) => void;
  onToggleFollow?: (userId: string) => void;
}

export const CohortDiscussionsScreen: React.FC<CohortDiscussionsScreenProps> = ({
  challenge,
  challenges = [],
  currentUser,
  initialViewMode = 'list',
  onBack,
  onSelectChallengeCohort,
  onNavigateUser,
  onToggleFollow,
}) => {
  // If the user hasn't selected a specific cohort or clicked "View All Cohorts", show cohort selection
  const [selectedCohort, setSelectedCohort] = useState<Challenge>(challenge);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>(initialViewMode);
  const [proofNote, setProofNote] = useState('');
  const [selectedProofPhoto, setSelectedProofPhoto] = useState<string | null>(null);

  React.useEffect(() => {
    if (initialViewMode) {
      setViewMode(initialViewMode);
    }
  }, [initialViewMode]);

  React.useEffect(() => {
    if (challenge) {
      setSelectedCohort(challenge);
    }
  }, [challenge]);

  // Filter cohorts from challenges that are squad or active/joined
  const activeCohorts = challenges.length > 0 
    ? challenges.filter((c) => c.joined || c.type === 'squad')
    : [challenge];

  // Initial cohort proofs seed
  const [proofs, setProofs] = useState<CohortProof[]>([
    {
      id: 'cp_1',
      challengeId: selectedCohort.id,
      author: {
        id: 'u3',
        name: 'Elena Rostova',
        username: 'elena.ai',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
        isFollowing: false,
      },
      dayNumber: 1,
      note: 'Day 1 completed: Read 32 pages of "The Design of Everyday Things". Key takeaway: Affordances should communicate themselves without documentation.',
      photoUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
      timestamp: '2h ago',
      likesCount: 14,
      isLiked: true,
    },
    {
      id: 'cp_2',
      challengeId: selectedCohort.id,
      author: {
        id: 'u2',
        name: 'Sarah Jenkins',
        username: 'runwithme',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        isFollowing: true,
      },
      dayNumber: 1,
      note: 'Day 1: Read chapter 2 on cardiovascular recovery protocols. Notes highlighted in green ink!',
      photoUrl: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&auto=format&fit=crop&q=80',
      timestamp: '5h ago',
      likesCount: 9,
      isLiked: false,
    }
  ]);

  const handleToggleLikeProof = (id: string) => {
    setProofs(prev => prev.map(p => {
      if (p.id === id) {
        return {
          ...p,
          isLiked: !p.isLiked,
          likesCount: p.isLiked ? p.likesCount - 1 : p.likesCount + 1,
        };
      }
      return p;
    }));
  };

  const handleSubmitProof = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofNote.trim() && !selectedProofPhoto) return;

    const newProof: CohortProof = {
      id: `proof_${Date.now()}`,
      challengeId: selectedCohort.id,
      author: currentUser,
      dayNumber: (selectedCohort.current || 0) + 1,
      note: proofNote.trim(),
      photoUrl: selectedProofPhoto || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
      timestamp: 'Just now',
      likesCount: 1,
      isLiked: true,
    };

    setProofs([newProof, ...proofs]);
    setProofNote('');
    setSelectedProofPhoto(null);
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

  // If in List View: Options like the Joined Communities Screen!
  if (viewMode === 'list') {
    return (
      <div className="pb-24 pt-2 px-4 animate-fade-in bg-black min-h-screen text-white">
        {/* Header like Joined Communities Screen */}
        <div className="flex items-center justify-between pb-3 pt-1 border-b border-[#20242C]/70 mb-4">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onBack}
              className="w-9 h-9 rounded-full bg-[#101010] hover:bg-[#1f242e] border border-[#20242C] flex items-center justify-center text-[#9298A3] hover:text-white transition-colors cursor-pointer"
              aria-label="Back"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-lg font-bold text-white">Challenge Cohort Discussions</h1>
              <p className="text-xs text-[#9298A3]">
                {activeCohorts.length} Active squad discussions
              </p>
            </div>
          </div>

          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#2166FF] hover:bg-[#3B82FF] text-white shadow-sm transition-all cursor-pointer"
          >
            <Plus size={14} />
            <span>Explore Challenges</span>
          </button>
        </div>

        {/* Cohort List like Joined Communities Screen */}
        <div className="space-y-3">
          {activeCohorts.map((cohort) => (
            <div
              key={cohort.id}
              onClick={() => {
                setSelectedCohort(cohort);
                setViewMode('detail');
                onSelectChallengeCohort?.(cohort);
              }}
              className="p-4 rounded-3xl bg-[#080B10] hover:bg-[#101010] border border-[#20242C] transition-all cursor-pointer group flex items-center justify-between gap-3.5"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-[#101010] border border-[#20242C] flex items-center justify-center shrink-0 group-hover:border-[#2166FF]/40 transition-colors">
                  {getChallengeIcon(cohort.icon)}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-sm font-bold text-white group-hover:text-[#3B82FF] transition-colors truncate">
                      {cohort.title} Cohort
                    </h3>
                    <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Check size={10} /> Active Squad
                    </span>
                  </div>
                  <p className="text-xs text-[#9298A3] truncate mb-1">
                    {cohort.whatYouPerform || cohort.description}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-[#9298A3] font-mono">
                    <span>{cohort.participantsCount || cohort.squadMembers?.length || 4} Squad Members</span>
                    <span>•</span>
                    <span>Day {cohort.current} of {cohort.target}</span>
                  </div>
                </div>
              </div>

              <ChevronRight size={18} className="text-[#9298A3] group-hover:text-white shrink-0 transition-colors" />
            </div>
          ))}

          {activeCohorts.length === 0 && (
            <div className="py-16 text-center text-[#9298A3]">
              <MessageSquare size={32} className="mx-auto text-[#2166FF] mb-2 opacity-60" />
              <p className="text-sm font-medium text-white mb-1">No active cohort discussions</p>
              <p className="text-xs text-[#9298A3]">Join or create a team squad challenge to start discussing.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Detail View of the Selected Cohort
  return (
    <div className="pb-24 pt-2 px-4 animate-fade-in bg-black min-h-screen text-white">
      {/* Top Header with Cohort Options Switcher */}
      <div className="flex items-center justify-between pb-3 pt-1 border-b border-[#20242C]/70 mb-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={() => setViewMode('list')}
            className="w-9 h-9 rounded-full bg-[#101010] hover:bg-[#1f242e] border border-[#20242C] flex items-center justify-center text-[#9298A3] hover:text-white transition-colors cursor-pointer shrink-0"
            aria-label="Back to Cohort Discussions List"
            title="View all cohort options"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <h1 className="text-base font-bold text-white truncate">
              {selectedCohort.title} Cohort
            </h1>
            <p className="text-xs text-[#9298A3] flex items-center gap-1.5">
              <span>{selectedCohort.participantsCount || selectedCohort.squadMembers?.length || 4} Squad members</span>
              <span>•</span>
              <span className="text-[#3B82FF] font-medium">Daily Proofs & Chat</span>
            </p>
          </div>
        </div>

        {/* Switch cohort button */}
        <button
          onClick={() => setViewMode('list')}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#101010] hover:bg-[#1f242e] border border-[#20242C] text-[#9298A3] hover:text-white transition-colors cursor-pointer shrink-0"
        >
          <span>All Cohorts ({activeCohorts.length})</span>
        </button>
      </div>

      {/* Daily Proof Submission Card */}
      <form onSubmit={handleSubmitProof} className="p-3.5 rounded-2xl bg-[#080B10] border border-[#20242C] mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <Flame size={14} className="text-[#F59E0B]" />
            Submit Today's Proof & Check In
          </span>
          <span className="text-[10px] font-mono text-[#9298A3]">
            Day {(selectedCohort.current || 0) + 1} of {selectedCohort.target}
          </span>
        </div>

        <textarea
          value={proofNote}
          onChange={(e) => setProofNote(e.target.value)}
          placeholder="Share today's progress, notes, or sprint insights with your squad..."
          rows={2}
          className="w-full bg-[#101010] border border-[#20242C] rounded-xl p-2.5 text-xs text-white placeholder-[#9298A3] focus:outline-none focus:border-[#2166FF] resize-none mb-2"
        />

        {/* Quick Photo attachment sample */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedProofPhoto('https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
                selectedProofPhoto
                  ? 'bg-[#2166FF]/20 border-[#2166FF] text-white'
                  : 'bg-[#101010] border-[#20242C] text-[#9298A3] hover:text-white'
              }`}
            >
              <ImageIcon size={13} />
              <span>{selectedProofPhoto ? 'Proof Photo Attached' : '+ Attach Proof'}</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={!proofNote.trim() && !selectedProofPhoto}
            className="px-4 py-1.5 rounded-xl bg-[#2166FF] hover:bg-[#3B82FF] disabled:bg-[#101010] text-white disabled:text-[#9298A3]/40 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-[#2166FF]/20 cursor-pointer"
          >
            <Flame size={13} />
            <span>Post Proof</span>
          </button>
        </div>
      </form>

      {/* Proof & Discussion Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-[11px] font-bold text-[#9298A3] uppercase tracking-wider">
          <span>Squad Daily Proofs & Discussions</span>
          <span className="font-mono text-[#3B82FF]">{proofs.length} Posts</span>
        </div>

        {proofs.map((proof) => (
          <div key={proof.id} className="p-4 rounded-3xl bg-[#080B10] border border-[#20242C]">
            {/* Author row with Follow button */}
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2.5">
                <img
                  src={proof.author.avatar}
                  alt={proof.author.name}
                  className="w-8 h-8 rounded-full object-cover border border-[#20242C]"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onNavigateUser?.(proof.author)}
                      className="text-xs font-bold text-white hover:text-[#3B82FF] transition-colors cursor-pointer block text-left"
                    >
                      {proof.author.name}
                    </button>
                    {!proof.author.isCurrentUser && proof.author.username !== currentUser.username && onToggleFollow && (
                      <button
                        type="button"
                        onClick={() => onToggleFollow(proof.author.id)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all cursor-pointer ${
                          proof.author.isFollowing
                            ? 'bg-[#101010] text-[#9298A3] border border-[#20242C] hover:text-white'
                            : 'bg-[#2166FF]/20 hover:bg-[#2166FF] text-[#3B82FF] hover:text-white border border-[#2166FF]/30'
                        }`}
                      >
                        {proof.author.isFollowing ? 'Following' : '+ Follow'}
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-[#9298A3]">{proof.timestamp}</span>
                </div>
              </div>

              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#2166FF]/15 text-[#3B82FF] border border-[#2166FF]/30">
                Day {proof.dayNumber} Proof
              </span>
            </div>

            {/* Proof Note */}
            <p className="text-xs text-white/95 leading-relaxed mb-3">
              {proof.note}
            </p>

            {/* Proof Photo */}
            {proof.photoUrl && (
              <div className="rounded-2xl overflow-hidden border border-[#20242C] mb-3 aspect-video bg-[#101010]">
                <img
                  src={proof.photoUrl}
                  alt="Proof"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}

            {/* Engagement */}
            <div className="flex items-center justify-between pt-1 border-t border-[#20242C]/40 text-xs text-[#9298A3]">
              <button
                onClick={() => handleToggleLikeProof(proof.id)}
                className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
                  proof.isLiked ? 'text-[#2166FF]' : 'hover:text-white'
                }`}
              >
                <Heart size={14} className={proof.isLiked ? 'fill-[#2166FF]' : ''} />
                <span className="font-mono tabular-nums">{proof.likesCount}</span>
              </button>

              <span className="text-[11px] text-[#9298A3]">Verified Day {proof.dayNumber} Evidence</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
