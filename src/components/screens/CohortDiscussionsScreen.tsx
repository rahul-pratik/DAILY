import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, 
  MessageSquare, 
  Flame, 
  Camera, 
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
  Maximize2,
  Bell,
  BellOff,
  Trash2,
  Crop,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { Author, Challenge, CohortProof } from '../../types';
import { getSafeUUID } from '../../lib/supabase';
import { CreditIcon } from '../CreditIcon';
import { StorageService } from '../../services/storageService';
import { ImageCropModal } from '../modals/ImageCropModal';

interface CohortDiscussionsScreenProps {
  challenge: Challenge;
  challenges?: Challenge[];
  currentUser: Author;
  initialViewMode?: 'list' | 'detail';
  onBack: () => void;
  onViewModeChange?: (mode: 'list' | 'detail') => void;
  onSelectChallengeCohort?: (challenge: Challenge) => void;
  onNavigateUser?: (user: { name: string; username: string }) => void;
  onToggleFollow?: (userId: string) => void;
  onAddProof?: (challengeId: string, proof: CohortProof) => void;
  onVerifyProof?: (challengeId: string, proofId: string) => Promise<boolean>;
  onDeleteProof?: (challengeId: string, proofId: string) => Promise<boolean>;
  onToggleLikeProof?: (challengeId: string, proofId: string) => Promise<void> | void;
}

const DEFAULT_COHORT_PROOFS: Record<string, CohortProof[]> = {
  default: [],
};

export const CohortDiscussionsScreen: React.FC<CohortDiscussionsScreenProps> = ({
  challenge,
  challenges = [],
  currentUser,
  initialViewMode = 'list',
  onBack,
  onViewModeChange,
  onSelectChallengeCohort,
  onNavigateUser,
  onToggleFollow,
  onAddProof,
  onVerifyProof,
  onDeleteProof,
  onToggleLikeProof,
}) => {
  const [selectedCohort, setSelectedCohort] = useState<Challenge>(challenge);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>(initialViewMode);
  const [isCohortMuted, setIsCohortMuted] = useState<boolean>(() => StorageService.isChallengeMuted(challenge.id));

  const changeViewMode = (nextMode: 'list' | 'detail') => {
    setViewMode(nextMode);
    onViewModeChange?.(nextMode);
  };

  useEffect(() => {
    setIsCohortMuted(StorageService.isChallengeMuted(selectedCohort.id));
  }, [selectedCohort.id]);
  
  // Photo proof form state
  const [proofNote, setProofNote] = useState('');
  const [selectedProofPhoto, setSelectedProofPhoto] = useState<string | null>(null);
  const [proofPhotoName, setProofPhotoName] = useState<string>('');
  const [rawImageToCrop, setRawImageToCrop] = useState<string>('');
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  
  // Real file input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lightbox modal for viewing anyone's photo proof full size
  const [activeLightboxProof, setActiveLightboxProof] = useState<CohortProof | null>(null);

  // Sorting/filtering: 'squad' vs 'all' vs 'verify' (Photo Verify for moderators)
  const [feedFilter, setFeedFilter] = useState<'squad' | 'all' | 'verify'>(
    challenge.type === 'solo' ? 'all' : 'squad'
  );

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
      setFeedFilter((prev) => {
        if (prev === 'verify') return prev;
        return challenge.type === 'solo' ? 'all' : prev;
      });
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

  // Handle Real File Selection -> opens Crop Modal
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProofPhotoName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setRawImageToCrop(reader.result);
        setIsCropModalOpen(true);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleToggleLikeProof = (id: string) => {
    setProofs(prev => prev.map(p => {
      if (p.id === id) {
        return {
          ...p,
          isLiked: !p.isLiked,
          likesCount: Math.max(0, p.isLiked ? p.likesCount - 1 : p.likesCount + 1),
        };
      }
      return p;
    }));
    onToggleLikeProof?.(selectedCohort.id, id);
  };

  // Handle proof submission (unverified until moderator approves)
  const handleSubmitProof = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProofPhoto) return;

    const newProof: CohortProof = {
      id: getSafeUUID(),
      challengeId: selectedCohort.id,
      author: currentUser,
      dayNumber: (selectedCohort.current || 0) + 1,
      note: proofNote.trim(),
      photoUrl: selectedProofPhoto,
      timestamp: 'Just now',
      likesCount: 0,
      isLiked: false,
      verified: false,
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
    .concat([currentUser.username])
  );

  // Determine if current user is moderator / creator of this challenge
  const isModerator = Boolean(
    (selectedCohort.creator?.username && currentUser?.username && selectedCohort.creator.username.toLowerCase() === currentUser.username.toLowerCase()) ||
    (selectedCohort.creator?.id && selectedCohort.creator.id === currentUser?.id)
  );

  const handleVerifyProof = async (proofId: string) => {
    if (!isModerator) return;
    const saved = await onVerifyProof?.(selectedCohort.id, proofId);
    if (onVerifyProof && !saved) return;
    setProofs(prev => prev.map(p => p.id === proofId ? { ...p, verified: true } : p));
  };

  const handleRejectProof = async (proofId: string) => {
    if (!isModerator) return;
    const deleted = onDeleteProof
      ? await onDeleteProof(selectedCohort.id, proofId)
      : true;
    if (deleted) {
      setProofs(prev => prev.filter(p => p.id !== proofId));
    }
  };

  // Pending proofs awaiting moderator photo verification
  const pendingVerifyProofs = proofs.filter((p) => p.verified !== true);
  const myPendingProofs = pendingVerifyProofs.filter(
    (p) =>
      (p.author.id && currentUser.id && p.author.id === currentUser.id) ||
      (p.author.username && currentUser.username && p.author.username.toLowerCase() === currentUser.username.toLowerCase())
  );

  // Strict challenge feed gating: ONLY verified photos appear in the challenge feed
  const filteredProofs = proofs.filter((p) => {
    if (p.verified !== true) return false;
    if (selectedCohort.type === 'solo') return true;
    if (feedFilter === 'squad') {
      return squadMemberUsernames.has(p.author.username) || p.author.id === currentUser.id;
    }
    return true;
  });

  const isSquadChallenge = selectedCohort.type === 'squad';
  const effectiveCurrentDay = selectedCohort.current || 0;

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
                Photo updates and conversations with your challenge cohort
              </p>
            </div>
          </div>
        </div>

        {/* Cohorts Directory List */}
        <div className="space-y-3">
          {activeCohorts.map((cohort) => {
            const isSquad = cohort.type === 'squad';
            const isModForCohort = Boolean(
              (cohort.creator?.username && currentUser?.username && cohort.creator.username.toLowerCase() === currentUser.username.toLowerCase()) ||
              (cohort.creator?.id && cohort.creator.id === currentUser?.id)
            );
            const pendingCount = (cohort.squadProofs || []).filter((p) => p.verified !== true).length;
            return (
              <div
                key={cohort.id}
                onClick={() => {
                  setSelectedCohort(cohort);
                  onSelectChallengeCohort?.(cohort);
                  setFeedFilter(cohort.type === 'solo' ? 'all' : 'squad');
                  changeViewMode('detail');
                }}
                className="p-4 rounded-3xl bg-[#080B10] hover:bg-[#101010] border border-[#20242C] hover:border-[#2166FF]/40 transition-all cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-[#101010] border border-[#20242C] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    {getChallengeIcon(cohort.icon)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <h3 className="text-sm font-bold text-white group-hover:text-[#3B82FF] transition-colors break-words">
                        {cohort.title}
                      </h3>
                      <span className="text-[10px] font-bold text-[#3B82FF] bg-[#2166FF]/15 px-2 py-0.5 rounded-full border border-[#2166FF]/20">
                        {isSquad ? 'Squad' : 'Solo'}
                      </span>
                      {isModForCohort && pendingCount > 0 && (
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30">
                          {pendingCount} to verify
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#9298A3] whitespace-pre-wrap break-words">
                      {cohort.whatYouPerform || cohort.description}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-[#9298A3] font-mono mt-1">
                      <span>Day {cohort.current} of {cohort.target}</span>
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
            onClick={() => changeViewMode('list')}
            className="w-9 h-9 rounded-full bg-[#101010] hover:bg-[#1f242e] border border-[#20242C] flex items-center justify-center text-[#9298A3] hover:text-white transition-colors cursor-pointer shrink-0"
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white truncate">
                {selectedCohort.title} Cohort
              </h1>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 ${
                isSquadChallenge ? 'bg-[#2166FF]/20 text-[#3B82FF] border border-[#2166FF]/30' : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
              }`}>
                {isSquadChallenge ? 'Squad' : 'Solo'}
              </span>
            </div>
            <p className="text-xs text-[#9298A3] flex items-center gap-1.5 font-mono truncate">
              <span className="text-emerald-400 font-medium">
                Day {effectiveCurrentDay} of {selectedCohort.target}
              </span>
              <span>•</span>
              <span className="truncate">{isSquadChallenge ? `${selectedCohort.participantsCount ?? selectedCohort.squadMembers?.length ?? 0} Squad Members` : 'Solo Participant'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Mute Cohort Notifications Toggle */}
          <button
            type="button"
            onClick={() => {
              const nowMuted = StorageService.toggleMuteChallenge(selectedCohort.id);
              setIsCohortMuted(nowMuted);
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors cursor-pointer ${
              isCohortMuted
                ? 'bg-red-500/15 border-red-500/30 text-red-400 hover:bg-red-500/25'
                : 'bg-[#2166FF]/20 border-[#2166FF]/40 text-[#3B82FF] hover:bg-[#2166FF]/30'
            }`}
            title={isCohortMuted ? "Cohort notifications muted. Click to unmute" : "Cohort notifications active. Click to mute"}
          >
            {isCohortMuted ? <BellOff size={13} /> : <Bell size={13} />}
            <span>{isCohortMuted ? 'Muted' : 'Mute'}</span>
          </button>
        </div>
      </div>

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
          placeholder="Add a note about your photo (optional)..."
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
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setRawImageToCrop(selectedProofPhoto);
                  setIsCropModalOpen(true);
                }}
                className="px-2 py-1 rounded-xl bg-[#2166FF]/15 hover:bg-[#2166FF]/25 border border-[#2166FF]/35 text-[#3B82FF] text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1"
                title="Crop photo"
              >
                <Crop size={12} />
                <span>Crop</span>
              </button>
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

        {/* Photo Attachment Options: ONLY Attach Photo and submit */}
        <div className="flex items-center justify-between gap-2 pt-1">
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

          <button
            type="submit"
            disabled={!selectedProofPhoto}
            className="px-4 py-2 rounded-xl bg-[#2166FF] hover:bg-[#3B82FF] disabled:bg-[#101010] text-white disabled:text-[#9298A3]/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-[#2166FF]/20 cursor-pointer shrink-0"
          >
            <Send size={13} />
            <span>Post Proof</span>
          </button>
        </div>
      </form>

      {/* FEED FILTER TABS + MODERATOR PHOTO VERIFY TAB */}
      <div className="flex items-center justify-between pb-2 mb-3 gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 p-1 bg-[#080B10] border border-[#20242C] rounded-2xl flex-wrap">
          {isSquadChallenge ? (
            <>
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
                <span>Squad Posts</span>
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
                <span>All Cohort Posts</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setFeedFilter('all')}
              className={`py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                feedFilter !== 'verify'
                  ? 'bg-[#2166FF] text-white shadow-sm'
                  : 'text-[#9298A3] hover:text-white'
              }`}
            >
              <Sparkles size={13} />
              <span>All Daily Proofs</span>
            </button>
          )}

          {isModerator && (
            <button
              type="button"
              onClick={() => setFeedFilter('verify')}
              className={`py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                feedFilter === 'verify'
                  ? 'bg-[#2166FF] text-white shadow-sm'
                  : 'text-[#9298A3] hover:text-white'
              }`}
            >
              <ShieldCheck size={13} />
              <span>Photo Verify</span>
              {pendingVerifyProofs.length > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                  feedFilter === 'verify'
                    ? 'bg-black/25 text-white'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {pendingVerifyProofs.length}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Pending notice for uploader when not in Moderator Photo Verify view */}
      {feedFilter !== 'verify' && myPendingProofs.length > 0 && (
        <div className="mb-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-2.5 text-xs text-amber-300">
          <div className="flex items-center gap-2 min-w-0">
            <Clock size={15} className="shrink-0 text-amber-400" />
            <span>
              {myPendingProofs.length} uploaded {myPendingProofs.length === 1 ? 'photo is' : 'photos are'} awaiting moderator verification before appearing in the challenge feed.
            </span>
          </div>
          {isModerator && (
            <button
              type="button"
              onClick={() => setFeedFilter('verify')}
              className="px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-[11px] font-semibold shrink-0 cursor-pointer"
            >
              Review
            </button>
          )}
        </div>
      )}

      {/* ================= MODERATOR PHOTO VERIFY QUEUE ================= */}
      {feedFilter === 'verify' && isModerator ? (
        <div className="space-y-4">
          <div className="p-3.5 rounded-2xl bg-[#080B10] border border-[#20242C] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#2166FF]/15 border border-[#2166FF]/30 text-[#3B82FF] flex items-center justify-center shrink-0">
                <ShieldCheck size={17} />
              </div>
              <div className="min-w-0">
                <h2 className="text-xs font-bold text-white">Moderator Photo Verify</h2>
                <p className="text-[11px] text-[#9298A3]">
                  Inspect uploaded photos. Mark Good to publish to the challenge feed, or Bad to reject.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono text-amber-400 bg-amber-500/15 border border-amber-500/25 px-2.5 py-1 rounded-full shrink-0">
              {pendingVerifyProofs.length} pending
            </span>
          </div>

          {pendingVerifyProofs.map((proof) => (
            <div key={proof.id} className="p-4 rounded-3xl bg-[#080B10] border border-[#20242C] space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={proof.author.avatar}
                    alt={proof.author.name}
                    onClick={() => onNavigateUser?.(proof.author)}
                    className="w-9 h-9 rounded-full object-cover border border-[#20242C] cursor-pointer shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => onNavigateUser?.(proof.author)}
                      className="text-xs font-bold text-white hover:text-[#3B82FF] transition-colors cursor-pointer truncate block"
                    >
                      {proof.author.name}
                    </button>
                    <div className="flex items-center gap-1.5 text-[10px] text-[#9298A3] font-mono">
                      <span>@{proof.author.username}</span>
                      <span>·</span>
                      <span>{proof.timestamp}</span>
                    </div>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 whitespace-nowrap">
                  Day {proof.dayNumber} · Pending
                </span>
              </div>

              {proof.note && (
                <p className="text-xs text-white/95 leading-relaxed">
                  {proof.note}
                </p>
              )}

              {proof.photoUrl && (
                <div
                  onClick={() => setActiveLightboxProof(proof)}
                  className="relative rounded-2xl overflow-hidden border border-[#20242C] group cursor-pointer aspect-video bg-[#101010]"
                >
                  <img
                    src={proof.photoUrl}
                    alt="Pending verification proof"
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-1.5 text-xs font-semibold">
                    <Maximize2 size={16} />
                    <span>Inspect Full Photo</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-[#20242C]/50">
                <button
                  type="button"
                  onClick={() => handleVerifyProof(proof.id)}
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-emerald-600/20"
                >
                  <CheckCircle size={14} />
                  <span>Good · Verify</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRejectProof(proof.id)}
                  className="py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-red-600/20"
                >
                  <X size={14} />
                  <span>Bad · Reject</span>
                </button>
              </div>
            </div>
          ))}

          {pendingVerifyProofs.length === 0 && (
            <div className="py-14 text-center text-[#9298A3] bg-[#080B10] rounded-3xl border border-[#20242C]">
              <ShieldCheck size={30} className="mx-auto text-emerald-400 mb-2 opacity-75" />
              <p className="text-xs font-semibold text-white mb-1">All caught up</p>
              <p className="text-[11px] text-[#9298A3]">
                No pending photos to verify right now.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* VERIFIED CHALLENGE FEED - ONLY VERIFIED PROOFS ARE DISPLAYED */
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
                      {!proof.author.isCurrentUser && proof.author.username !== currentUser.username && !proof.author.isFollowing && onToggleFollow && (
                        <button
                          type="button"
                          onClick={() => onToggleFollow(proof.author.id || proof.author.username)}
                          className="px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all cursor-pointer bg-[#2166FF]/20 hover:bg-[#2166FF] text-[#3B82FF] hover:text-white border border-[#2166FF]/30"
                        >
                          + Follow
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

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-[#2166FF]/15 text-[#3B82FF] border border-[#2166FF]/30 whitespace-nowrap">
                    Day {proof.dayNumber} Proof
                  </span>
                  {Boolean(
                    isModerator ||
                    (proof.author.username && currentUser?.username && proof.author.username.toLowerCase() === currentUser.username.toLowerCase()) ||
                    (proof.author.id && currentUser?.id && proof.author.id === currentUser.id)
                  ) && (
                    <button
                      type="button"
                      onClick={async () => {
                        const deleted = onDeleteProof
                          ? await onDeleteProof(selectedCohort.id, proof.id)
                          : true;
                        if (deleted) setProofs(prev => prev.filter(p => p.id !== proof.id));
                      }}
                      className="text-[#9298A3] hover:text-red-400 p-1 cursor-pointer transition-colors"
                      title={isModerator && proof.author.username !== currentUser.username ? "Moderator: Delete proof from challenge" : "Delete your proof"}
                      aria-label="Delete proof"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Proof Note */}
              {proof.note && (
                <p className="text-xs text-white/95 leading-relaxed">
                  {proof.note}
                </p>
              )}

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

                  <div className="flex items-center justify-between px-1 flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveLightboxProof(proof)}
                      className="text-[11px] text-[#3B82FF] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <Maximize2 size={12} />
                      <span>View Full Photo</span>
                    </button>

                    <span className="text-[10px] font-mono text-[#22C55E] flex items-center gap-1 bg-[#22C55E]/10 px-2 py-0.5 rounded-full border border-[#22C55E]/20">
                      <Check size={11} />
                      Verified by Moderator
                    </span>
                  </div>
                </div>
              )}

              {/* Engagement Row */}
              <div className="flex items-center justify-between pt-2 border-t border-[#20242C]/40 text-xs text-[#9298A3]">
                <button
                  type="button"
                  onClick={() => handleToggleLikeProof(proof.id)}
                  className={`flex items-center gap-1.5 transition-colors cursor-pointer group ${
                    proof.isLiked ? 'text-amber-400 font-semibold' : 'hover:text-amber-300'
                  }`}
                  aria-label={proof.isLiked ? 'Remove golden credit' : 'Give golden credit (C)'}
                  title={proof.isLiked ? 'Credited (Golden)' : 'Give golden credit (C)'}
                >
                  <CreditIcon
                    size={15}
                    credited={proof.isLiked}
                    variant="challenge"
                    className={proof.isLiked ? 'text-amber-400' : 'text-[#9298A3] group-hover:text-amber-300'}
                  />
                  <span className="font-mono tabular-nums font-semibold text-white">{proof.likesCount}</span>
                  <span className="text-[10px] text-amber-400/90 font-medium">credits</span>
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
              <p className="text-xs font-semibold text-white mb-1">No verified proofs yet</p>
              <p className="text-[11px] text-[#9298A3]">
                Uploaded photos appear here after the challenge moderator verifies them.
              </p>
            </div>
          )}
        </div>
      )}

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

      {isCropModalOpen && (
        <ImageCropModal
          isOpen={isCropModalOpen}
          imageUrl={rawImageToCrop}
          mode="square"
          title="Crop Photo"
          onCropComplete={(croppedDataUrl) => {
            setSelectedProofPhoto(croppedDataUrl);
            setIsCropModalOpen(false);
          }}
          onClose={() => setIsCropModalOpen(false)}
        />
      )}
    </div>
  );
};
