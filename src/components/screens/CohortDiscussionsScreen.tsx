import React, { useState, useRef, useEffect } from 'react';
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
  Sparkles, 
  ChevronRight, 
  BookOpen, 
  Code, 
  Check, 
  Upload, 
  X, 
  AlertTriangle, 
  Maximize2,
  Link as LinkIcon
} from 'lucide-react';
import { Author, Challenge, CohortProof } from '../../types';
import { getSafeUUID } from '../../lib/supabase';

interface CohortDiscussionsScreenProps {
  challenge: Challenge;
  challenges?: Challenge[];
  currentUser: Author;
  initialViewMode?: 'list' | 'detail';
  onBack: () => void;
  onSelectChallengeCohort?: (challenge: Challenge) => void;
  onNavigateUser?: (user: { name: string; username: string }) => void;
  onToggleFollow?: (userId: string) => void;
  onAddProof?: (challengeId: string, proof: CohortProof) => void;
}

const DEFAULT_COHORT_PROOFS: Record<string, CohortProof[]> = {
  default: [
    {
      id: 'cp_sarah',
      challengeId: 'ch_run5k',
      author: {
        id: 'u2',
        name: 'Sarah Jenkins',
        username: 'runwithme',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        isFollowing: true,
      },
      dayNumber: 3,
      note: 'Day 3 sprint verified: 5.2 km logged in 24:12 pace along morning waterfront trail. Split intervals recorded.',
      photoUrl: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&auto=format&fit=crop&q=80',
      timestamp: '2h ago',
      likesCount: 24,
      isLiked: true,
    },
    {
      id: 'cp_elena',
      challengeId: 'ch_reading30',
      author: {
        id: 'u3',
        name: 'Elena Rostova',
        username: 'elena.ai',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
        isFollowing: false,
      },
      dayNumber: 3,
      note: 'Day 3 proof: 34 pages read from The Design of Everyday Things. Annotated mental model ergonomics in margin.',
      photoUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
      timestamp: '3h ago',
      likesCount: 19,
      isLiked: false,
    },
    {
      id: 'cp_devin',
      challengeId: 'ch_software',
      author: {
        id: 'u4',
        name: 'Devin Cole',
        username: 'devin.creates',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        isFollowing: true,
      },
      dayNumber: 2,
      note: 'Day 2 progress: Database schema migrations written and full test suite green. Terminal screenshot attached!',
      photoUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
      timestamp: 'Yesterday',
      likesCount: 15,
      isLiked: false,
    },
    {
      id: 'cp_alex',
      challengeId: 'ch_buildsomething',
      author: {
        id: 'u5',
        name: 'Alex Morgan',
        username: 'creator',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        isFollowing: true,
      },
      dayNumber: 2,
      note: 'Day 2 documentation and architecture diagram verified. Squad open-source repository updated.',
      photoUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
      timestamp: 'Yesterday',
      likesCount: 12,
      isLiked: true,
    },
    {
      id: 'cp_aarav',
      challengeId: 'ch_software',
      author: {
        id: 'user_aarav',
        name: 'Aarav Sharma',
        username: 'aarav.codes',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        isCurrentUser: true,
      },
      dayNumber: 1,
      note: 'Day 1 sprint: Built auth modal and verified token refresh pipeline. Live testing passing.',
      photoUrl: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&auto=format&fit=crop&q=80',
      timestamp: '2d ago',
      likesCount: 32,
      isLiked: true,
    }
  ]
};

export const CohortDiscussionsScreen: React.FC<CohortDiscussionsScreenProps> = ({
  challenge,
  challenges = [],
  currentUser,
  initialViewMode = 'list',
  onBack,
  onSelectChallengeCohort,
  onNavigateUser,
  onToggleFollow,
  onAddProof,
}) => {
  const [selectedCohort, setSelectedCohort] = useState<Challenge>(challenge);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>(initialViewMode);
  
  // Photo proof form state
  const [proofNote, setProofNote] = useState('');
  const [selectedProofPhoto, setSelectedProofPhoto] = useState<string | null>(null);
  const [proofPhotoName, setProofPhotoName] = useState<string>('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [customPhotoUrl, setCustomPhotoUrl] = useState('');
  
  // Real file input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lightbox modal for viewing anyone's photo proof full size
  const [activeLightboxProof, setActiveLightboxProof] = useState<CohortProof | null>(null);

  // Sorting/filtering: 'squad' vs 'all' (if solo challenge, only 'all')
  const [feedFilter, setFeedFilter] = useState<'squad' | 'all'>('squad');

  // Squad missed photo proof tracking (If someone fails to upload a photo in a single day, progress returns to 0)
  const [missedMemberUsernames, setMissedMemberUsernames] = useState<string[]>([]);

  // Proofs state: initialized from challenge or default proofs
  const [proofs, setProofs] = useState<CohortProof[]>(() => {
    if (challenge.squadProofs && challenge.squadProofs.length > 0) {
      return challenge.squadProofs;
    }
    return DEFAULT_COHORT_PROOFS.default;
  });

  useEffect(() => {
    if (initialViewMode) {
      setViewMode(initialViewMode);
    }
  }, [initialViewMode]);

  useEffect(() => {
    if (challenge) {
      setSelectedCohort(challenge);
      if (challenge.type === 'solo') {
        setFeedFilter('all');
      }
      if (challenge.squadProofs && challenge.squadProofs.length > 0) {
        setProofs(challenge.squadProofs);
      } else {
        setProofs(DEFAULT_COHORT_PROOFS.default);
      }
    }
  }, [challenge]);

  const activeCohorts = challenges.length > 0 
    ? challenges.filter((c) => c.joined || c.type === 'squad')
    : [challenge];

  // Handle Real File Selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProofPhotoName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setSelectedProofPhoto(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Quick Photo Presets
  const handleQuickPreset = (url: string, label: string) => {
    setSelectedProofPhoto(url);
    setProofPhotoName(label);
    setShowUrlInput(false);
  };

  // Handle URL photo entry
  const handleApplyPhotoUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPhotoUrl.trim()) return;
    setSelectedProofPhoto(customPhotoUrl.trim());
    setProofPhotoName('Linked Photo Proof');
    setCustomPhotoUrl('');
    setShowUrlInput(false);
  };

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

  // Handle proof submission
  const handleSubmitProof = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofNote.trim() && !selectedProofPhoto) return;

    const newProof: CohortProof = {
      id: getSafeUUID(),
      challengeId: selectedCohort.id,
      author: currentUser,
      dayNumber: (selectedCohort.current || 0) + 1,
      note: proofNote.trim() || 'Daily photo proof uploaded and verified.',
      photoUrl: selectedProofPhoto || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
      timestamp: 'Just now',
      likesCount: 1,
      isLiked: true,
    };

    setProofs([newProof, ...proofs]);
    setProofNote('');
    setSelectedProofPhoto(null);
    setProofPhotoName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    onAddProof?.(selectedCohort.id, newProof);
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

  // Squad Members Set for filtering
  const squadMemberUsernames = new Set(
    (selectedCohort.squadMembers || []).map(m => m.username)
      .concat(selectedCohort.creator ? [selectedCohort.creator.username] : [])
      .concat([currentUser.username, 'aarav.codes', 'runwithme', 'elena.ai', 'devin.creates'])
  );

  // Filter proofs according to user selection:
  // "In squad daily proofs and discussions , make sure to sort posts in squads and all , if solo challenge only all."
  const filteredProofs = proofs.filter((p) => {
    if (selectedCohort.type === 'solo') {
      return true; // Solo challenge only displays 'all'
    }
    if (feedFilter === 'squad') {
      return squadMemberUsernames.has(p.author.username) || p.author.id === currentUser.id;
    }
    return true; // 'all' displays everything
  });

  const squadProofsCount = proofs.filter(p => squadMemberUsernames.has(p.author.username) || p.author.id === currentUser.id).length;
  const allProofsCount = proofs.length;

  // Squad failure check: If someone fails to upload a photo in a single day, progress returns to 0
  const isSquadChallenge = selectedCohort.type === 'squad';
  const hasSquadMemberMissed = isSquadChallenge && missedMemberUsernames.length > 0;
  const effectiveCurrentDay = hasSquadMemberMissed ? 0 : (selectedCohort.current || 1);

  const toggleSimulateMissedProof = (username: string) => {
    setMissedMemberUsernames(prev => 
      prev.includes(username) ? prev.filter(u => u !== username) : [...prev, username]
    );
  };

  // ================= VIEW MODE: ALL COHORTS LIST =================
  if (viewMode === 'list') {
    return (
      <div className="pb-24 pt-2 px-4 animate-fade-in bg-black min-h-screen text-white">
        {/* Header */}
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
              <h1 className="text-base font-bold text-white flex items-center gap-2">
                <MessageSquare size={17} className="text-[#3B82FF]" />
                <span>Cohort Discussions & Proofs</span>
              </h1>
              <p className="text-xs text-[#9298A3]">
                Daily photo proofs, squad accountability chats, and shared sprints
              </p>
            </div>
          </div>
        </div>

        {/* Cohorts Directory List */}
        <div className="space-y-3">
          {activeCohorts.map((cohort) => {
            const isSquad = cohort.type === 'squad';
            return (
              <div
                key={cohort.id}
                onClick={() => {
                  setSelectedCohort(cohort);
                  if (cohort.type === 'solo') setFeedFilter('all');
                  setViewMode('detail');
                }}
                className="p-4 rounded-3xl bg-[#080B10] hover:bg-[#101010] border border-[#20242C] hover:border-[#2166FF]/40 transition-all cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-[#101010] border border-[#20242C] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    {getChallengeIcon(cohort.icon)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-sm font-bold text-white group-hover:text-[#3B82FF] transition-colors truncate">
                        {cohort.title}
                      </h3>
                      <span className="text-[10px] font-bold text-[#3B82FF] bg-[#2166FF]/15 px-2 py-0.5 rounded-full border border-[#2166FF]/20">
                        {isSquad ? 'Squad' : 'Solo'}
                      </span>
                    </div>
                    <p className="text-xs text-[#9298A3] truncate">
                      {cohort.whatYouPerform || cohort.description}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-[#9298A3] font-mono mt-1">
                      <span>Day {cohort.current} of {cohort.target}</span>
                      <span>•</span>
                      <span className="text-emerald-400 font-semibold">Active Daily Proofs</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-semibold text-[#3B82FF] group-hover:text-white transition-colors">
                    Open Chat
                  </span>
                  <ChevronRight size={16} className="text-[#9298A3] group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ================= VIEW MODE: DETAIL COHORT CHAT & PROOFS =================
  return (
    <div className="pb-24 pt-2 px-3 sm:px-4 animate-fade-in bg-black min-h-screen text-white">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 pt-1 border-b border-[#20242C]/70 mb-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={() => setViewMode('list')}
            className="w-9 h-9 rounded-full bg-[#101010] hover:bg-[#1f242e] border border-[#20242C] flex items-center justify-center text-[#9298A3] hover:text-white transition-colors cursor-pointer shrink-0"
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white truncate">
                {selectedCohort.title} Cohort
              </h1>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                isSquadChallenge ? 'bg-[#2166FF]/20 text-[#3B82FF] border border-[#2166FF]/30' : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
              }`}>
                {isSquadChallenge ? 'Squad Sprint' : 'Solo Focus'}
              </span>
            </div>
            <p className="text-xs text-[#9298A3] flex items-center gap-1.5 font-mono">
              <span className={hasSquadMemberMissed ? 'text-red-400 font-bold' : 'text-emerald-400 font-medium'}>
                Day {effectiveCurrentDay} of {selectedCohort.target}
              </span>
              <span>•</span>
              <span>{isSquadChallenge ? `${selectedCohort.participantsCount || 4} Squad Members` : 'Solo Participant'}</span>
            </p>
          </div>
        </div>

        {/* Switch cohort button */}
        <button
          onClick={() => setViewMode('list')}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#101010] hover:bg-[#1f242e] border border-[#20242C] text-[#9298A3] hover:text-white transition-colors cursor-pointer shrink-0"
        >
          <span>All Cohorts</span>
        </button>
      </div>

      {/* SQUAD RULE BANNER: If someone among the squad fails to upload a photo in a single day, then their progress returns to 0 */}
      {isSquadChallenge && (
        <div className={`p-3.5 rounded-2xl border mb-4 transition-all ${
          hasSquadMemberMissed ? 'bg-red-500/10 border-red-500/30' : 'bg-[#090D15] border-[#1E232F]'
        }`}>
          <div className="flex items-start gap-2.5">
            <AlertTriangle size={16} className={`shrink-0 mt-0.5 ${hasSquadMemberMissed ? 'text-red-400' : 'text-amber-400'}`} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className={`text-xs font-bold ${hasSquadMemberMissed ? 'text-red-400' : 'text-amber-300'}`}>
                  {hasSquadMemberMissed ? '❌ Squad Streak Broken: Progress Returned to 0' : '⚡ Squad Accountability Rule'}
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                  hasSquadMemberMissed ? 'bg-red-500/20 text-red-300 font-bold' : 'bg-[#2166FF]/20 text-[#3B82FF]'
                }`}>
                  {hasSquadMemberMissed ? 'Reset: Day 0' : 'Zero Missed Photos Allowed'}
                </span>
              </div>
              <p className="text-[11px] text-[#9298A3] mt-1 leading-relaxed">
                {hasSquadMemberMissed ? (
                  <span className="text-red-200">
                    <strong>{missedMemberUsernames.join(', ')}</strong> missed today\'s daily photo proof. The squad progress has returned to Day 0.
                  </span>
                ) : (
                  'In squad challenges, if anyone among the squad fails to upload a photo proof in a single day, the squad\'s progress returns to 0.'
                )}
              </p>

              {/* Simulation control for testing the rule */}
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#20242C]/60 flex-wrap">
                <span className="text-[10px] text-[#8A92A6]">Simulate missed photo proof:</span>
                {['devin.creates', 'elena.ai'].map((username) => {
                  const isMissed = missedMemberUsernames.includes(username);
                  return (
                    <button
                      key={username}
                      type="button"
                      onClick={() => toggleSimulateMissedProof(username)}
                      className={`text-[10px] px-2 py-0.5 rounded-lg border font-mono transition-colors cursor-pointer ${
                        isMissed 
                          ? 'bg-red-500/20 text-red-300 border-red-500/40 hover:bg-red-500/30' 
                          : 'bg-[#121620] text-[#9298A3] border-[#202738] hover:text-white'
                      }`}
                    >
                      {isMissed ? `Restore @${username}` : `Fail @${username}`}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DAILY PHOTO PROOF SUBMISSION CARD */}
      <form onSubmit={handleSubmitProof} className="p-3.5 sm:p-4 rounded-3xl bg-[#080B10] border border-[#20242C] mb-5 space-y-3 shadow-lg">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <Flame size={14} className="text-[#F59E0B]" />
            <span>Submit Today's Photo Proof & Check In</span>
          </span>
          <span className="text-[10px] font-mono text-[#9298A3]">
            Day {effectiveCurrentDay + 1} of {selectedCohort.target}
          </span>
        </div>

        {/* Note Textarea */}
        <textarea
          value={proofNote}
          onChange={(e) => setProofNote(e.target.value)}
          placeholder="Share today's progress, notes, or verified sprint insights with your squad..."
          rows={2}
          className="w-full bg-[#101010] border border-[#20242C] rounded-2xl p-3 text-xs text-white placeholder-[#9298A3] focus:outline-none focus:border-[#2166FF] resize-none"
        />

        {/* PHOTO ATTACHMENT PREVIEW IF ATTACHED */}
        {selectedProofPhoto && (
          <div className="relative rounded-2xl overflow-hidden border border-[#2166FF]/60 bg-[#101422] p-2.5 flex items-center gap-3">
            <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-black border border-[#20242C]">
              <img
                src={selectedProofPhoto}
                alt="Selected Proof"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">
                {proofPhotoName || 'Photo Proof Attached'}
              </p>
              <p className="text-[11px] text-emerald-400 flex items-center gap-1 mt-0.5 font-medium">
                <Check size={12} className="stroke-[3]" /> Photo Attached: Ready to Post Evidence
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedProofPhoto(null);
                setProofPhotoName('');
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="px-2 py-1 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1"
              title="Remove photo"
            >
              <X size={12} />
              <span>Remove</span>
            </button>
          </div>
        )}

        {/* Hidden Real File Input */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Custom Image URL Drawer */}
        {showUrlInput && (
          <div className="p-2.5 rounded-2xl bg-[#101010] border border-[#20242C] space-y-2">
            <div className="flex items-center justify-between text-xs text-[#9298A3]">
              <span>Paste direct photo URL:</span>
              <button
                type="button"
                onClick={() => setShowUrlInput(false)}
                className="text-[#9298A3] hover:text-white"
              >
                <X size={14} />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={customPhotoUrl}
                onChange={(e) => setCustomPhotoUrl(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="flex-1 bg-black border border-[#20242C] rounded-xl px-3 py-1.5 text-xs text-white placeholder-[#9298A3] focus:outline-none focus:border-[#2166FF]"
              />
              <button
                type="button"
                onClick={handleApplyPhotoUrl}
                className="px-3 py-1.5 rounded-xl bg-[#2166FF] hover:bg-[#3B82FF] text-white text-xs font-semibold cursor-pointer"
              >
                Attach
              </button>
            </div>
          </div>
        )}

        {/* Photo Attachment Options: File Pick, URL, and Presets */}
        <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Real File Attachment Trigger */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                selectedProofPhoto
                  ? 'bg-[#2166FF]/20 border-[#2166FF] text-white'
                  : 'bg-[#101010] hover:bg-[#1a1f29] border-[#20242C] text-white hover:border-[#2166FF]/50'
              }`}
            >
              <Upload size={13} className="text-[#3B82FF]" />
              <span>{selectedProofPhoto ? 'Change Photo' : '+ Attach Photo'}</span>
            </button>

            {/* Paste URL Button */}
            <button
              type="button"
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#101010] hover:bg-[#1a1f29] border border-[#20242C] text-[#8A92A6] hover:text-white text-xs transition-colors cursor-pointer"
              title="Paste image link"
            >
              <LinkIcon size={12} />
              <span className="hidden sm:inline">URL</span>
            </button>

            {/* Realistic Quick Presets */}
            <div className="flex items-center gap-1 text-[10px] text-[#9298A3] overflow-x-auto no-scrollbar">
              <span className="hidden sm:inline">Presets:</span>
              <button
                type="button"
                onClick={() => handleQuickPreset('https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80', 'Code_Terminal_Proof.png')}
                className="px-2 py-1 rounded-lg bg-[#101010] hover:bg-[#1a1f29] border border-[#20242C] text-[#8A92A6] hover:text-white cursor-pointer whitespace-nowrap"
              >
                Code
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset('https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&auto=format&fit=crop&q=80', 'Run_GPS_Proof.png')}
                className="px-2 py-1 rounded-lg bg-[#101010] hover:bg-[#1a1f29] border border-[#20242C] text-[#8A92A6] hover:text-white cursor-pointer whitespace-nowrap"
              >
                Run
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset('https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80', 'Deep_Reading_Notes.png')}
                className="px-2 py-1 rounded-lg bg-[#101010] hover:bg-[#1a1f29] border border-[#20242C] text-[#8A92A6] hover:text-white cursor-pointer whitespace-nowrap"
              >
                Notes
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={!proofNote.trim() && !selectedProofPhoto}
            className="px-4 py-2 rounded-xl bg-[#2166FF] hover:bg-[#3B82FF] disabled:bg-[#101010] text-white disabled:text-[#9298A3]/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-[#2166FF]/20 cursor-pointer shrink-0"
          >
            <Send size={13} />
            <span>Post Proof</span>
          </button>
        </div>
      </form>

      {/* FEED FILTER TABS: SQUADS AND ALL (IF SOLO CHALLENGE ONLY ALL) */}
      <div className="flex items-center justify-between pb-2 mb-3">
        <div className="flex items-center gap-2">
          {/* If squad challenge: allow toggling between Squad and All. If solo: only All */}
          {isSquadChallenge ? (
            <div className="flex items-center p-1 bg-[#080B10] border border-[#20242C] rounded-2xl">
              <button
                type="button"
                onClick={() => setFeedFilter('squad')}
                className={`py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  feedFilter === 'squad'
                    ? 'bg-[#2166FF] text-white shadow-sm'
                    : 'text-[#9298A3] hover:text-white'
                }`}
              >
                <Users size={13} />
                <span>Squad Posts ({squadProofsCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setFeedFilter('all')}
                className={`py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  feedFilter === 'all'
                    ? 'bg-[#2166FF] text-white shadow-sm'
                    : 'text-[#9298A3] hover:text-white'
                }`}
              >
                <Sparkles size={13} />
                <span>All Cohort Posts ({allProofsCount})</span>
              </button>
            </div>
          ) : (
            <div className="px-3 py-1.5 rounded-xl bg-[#080B10] border border-[#20242C] text-xs font-semibold text-white flex items-center gap-1.5">
              <Sparkles size={13} className="text-[#3B82FF]" />
              <span>All Daily Proofs ({allProofsCount})</span>
            </div>
          )}
        </div>

        <span className="text-[11px] font-mono text-[#9298A3]">
          {filteredProofs.length} {filteredProofs.length === 1 ? 'Proof' : 'Proofs'}
        </span>
      </div>

      {/* PROOF & DISCUSSION FEED - ALL PEOPLE'S PROOFS DISPLAYED CLEARLY */}
      <div className="space-y-4">
        {filteredProofs.map((proof) => (
          <div key={proof.id} className="p-4 rounded-3xl bg-[#080B10] border border-[#20242C] space-y-3">
            {/* Author row with Follow button */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={proof.author.avatar}
                  alt={proof.author.name}
                  onClick={() => onNavigateUser?.(proof.author)}
                  className="w-9 h-9 rounded-full object-cover border border-[#20242C] cursor-pointer hover:border-[#2166FF] transition-colors shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => onNavigateUser?.(proof.author)}
                      className="text-xs font-bold text-white hover:text-[#3B82FF] transition-colors cursor-pointer truncate"
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
                  <div className="flex items-center gap-1.5 text-[10px] text-[#9298A3] font-mono">
                    <span>@{proof.author.username}</span>
                    <span>·</span>
                    <span>{proof.timestamp}</span>
                  </div>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-[#2166FF]/15 text-[#3B82FF] border border-[#2166FF]/30 whitespace-nowrap shrink-0">
                Day {proof.dayNumber} Proof
              </span>
            </div>

            {/* Proof Note */}
            <p className="text-xs text-white/95 leading-relaxed">
              {proof.note}
            </p>

            {/* Proof Photo - Prominently Displayed & Click to Expand in Lightbox */}
            {proof.photoUrl && (
              <div className="space-y-1.5">
                <div 
                  onClick={() => setActiveLightboxProof(proof)}
                  className="relative rounded-2xl overflow-hidden border border-[#20242C] group cursor-pointer aspect-video bg-[#101010]"
                >
                  <img
                    src={proof.photoUrl}
                    alt="Proof"
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-1.5 text-xs font-semibold">
                    <Maximize2 size={16} />
                    <span>Click to View Full Photo Proof</span>
                  </div>
                </div>

                <div className="flex items-center justify-between px-1">
                  <button
                    type="button"
                    onClick={() => setActiveLightboxProof(proof)}
                    className="text-[11px] text-[#3B82FF] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <Maximize2 size={12} />
                    <span>View Full Photo</span>
                  </button>

                  <span className="text-[10px] font-mono text-[#9298A3]">
                    ✓ Verified Evidence
                  </span>
                </div>
              </div>
            )}

            {/* Engagement Row */}
            <div className="flex items-center justify-between pt-2 border-t border-[#20242C]/40 text-xs text-[#9298A3]">
              <button
                type="button"
                onClick={() => handleToggleLikeProof(proof.id)}
                className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
                  proof.isLiked ? 'text-[#2166FF]' : 'hover:text-white'
                }`}
              >
                <Heart size={14} className={proof.isLiked ? 'fill-[#2166FF]' : ''} />
                <span className="font-mono tabular-nums">{proof.likesCount}</span>
              </button>

              <span className="text-[11px] text-[#9298A3] font-mono">
                Day {proof.dayNumber} Check-In
              </span>
            </div>
          </div>
        ))}

        {filteredProofs.length === 0 && (
          <div className="py-14 text-center text-[#9298A3] bg-[#080B10] rounded-3xl border border-[#20242C]">
            <Camera size={30} className="mx-auto text-[#2166FF] mb-2 opacity-60" />
            <p className="text-xs font-semibold text-white mb-1">No proofs found in this view</p>
            <p className="text-[11px] text-[#9298A3]">Attach a photo and be the first to submit today's sprint proof!</p>
          </div>
        )}
      </div>

      {/* FULL-SIZE PHOTO LIGHTBOX MODAL */}
      {activeLightboxProof && (
        <div 
          onClick={() => setActiveLightboxProof(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-center items-center p-4 animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-[#080B10] border border-[#20242C] rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
          >
            <div className="p-3.5 border-b border-[#20242C] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img
                  src={activeLightboxProof.author.avatar}
                  alt={activeLightboxProof.author.name}
                  className="w-8 h-8 rounded-full object-cover border border-[#20242C]"
                />
                <div>
                  <h4 className="text-xs font-bold text-white">
                    {activeLightboxProof.author.name}
                  </h4>
                  <p className="text-[10px] text-[#9298A3] font-mono">
                    @{activeLightboxProof.author.username} • Day {activeLightboxProof.dayNumber} Proof • {activeLightboxProof.timestamp}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveLightboxProof(null)}
                className="w-8 h-8 rounded-full bg-[#101010] hover:bg-[#20242C] text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-auto bg-black flex items-center justify-center p-2">
              <img
                src={activeLightboxProof.photoUrl}
                alt="Full Proof"
                className="max-h-[60vh] w-auto object-contain rounded-xl"
              />
            </div>

            <div className="p-4 border-t border-[#20242C] bg-[#080B10]">
              <p className="text-xs text-white/95 leading-relaxed">
                {activeLightboxProof.note}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
