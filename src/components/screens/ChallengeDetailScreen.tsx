import React, { useState, useRef } from 'react';
import { 
  ArrowLeft, 
  Flame, 
  Target, 
  Clock, 
  Users, 
  Calendar, 
  Check, 
  Image as ImageIcon, 
  Camera,
  X, 
  MessageSquare, 
  CheckCircle, 
  Plus, 
  ChevronRight,
  Trophy 
} from 'lucide-react';
import { Author, Challenge } from '../../types';

interface ChallengeDetailScreenProps {
  challenge: Challenge;
  currentUser: Author;
  onBack: () => void;
  onCheckInWithProof: (challengeId: string, note: string, photoUrl?: string) => void;
  onAddToTodoList: (challenge: Challenge) => void;
  onOpenCohortChat: () => void;
  onToggleJoin?: (challengeId: string) => void;
  onRestartChallenge?: (challengeId: string) => void;
  isInTodoList: boolean;
}

export const ChallengeDetailScreen: React.FC<ChallengeDetailScreenProps> = ({
  challenge,
  currentUser,
  onBack,
  onCheckInWithProof,
  onAddToTodoList,
  onOpenCohortChat,
  onToggleJoin,
  onRestartChallenge,
  isInTodoList,
}) => {
  const [proofNote, setProofNote] = useState('');
  const [proofPhoto, setProofPhoto] = useState<string | null>(null);
  const [showProofForm, setShowProofForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isCompleted = challenge.current >= challenge.target || challenge.status === 'completed';
  const progressPercent = Math.min(100, Math.round((challenge.current / challenge.target) * 100));

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setProofPhoto(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUseSamplePhoto = (type: 'code' | 'runner') => {
    const url = type === 'code' 
      ? 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80' 
      : 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&auto=format&fit=crop&q=80';
    setProofPhoto(url);
  };

  const handleSubmitProof = (e: React.FormEvent) => {
    e.preventDefault();
    onCheckInWithProof(challenge.id, proofNote.trim(), proofPhoto || undefined);
    setProofNote('');
    setProofPhoto(null);
    setShowProofForm(false);
  };

  return (
    <div className="pb-24 pt-2 px-4 animate-fade-in bg-black min-h-screen text-white">
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
              {challenge.title}
            </h1>
            <p className="text-xs text-[#9298A3]">
              {challenge.type === 'squad' ? 'Team Squad Sprint' : 'Solo Focus'} • {challenge.durationDays} Days
            </p>
          </div>
        </div>

        <button
          onClick={() => onAddToTodoList(challenge)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
            isInTodoList
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-[#101010] hover:bg-[#1a1f29] text-white border border-[#20242C]'
          }`}
        >
          {isInTodoList ? <Check size={13} /> : <Calendar size={13} className="text-[#3B82FF]" />}
          <span>{isInTodoList ? 'In To-Do' : 'Add to To-Do'}</span>
        </button>
      </div>

      {/* Main Challenge Card */}
      <div className="p-4 rounded-3xl bg-[#080B10] border border-[#20242C] mb-4 space-y-4">
        {/* Badges Row */}
        <div className="flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-[#2166FF]/15 text-[#3B82FF] font-semibold border border-[#2166FF]/20 flex items-center gap-1">
              <Target size={11} />
              <span>{challenge.type === 'squad' ? 'Squad Sprint' : 'Solo Focus'}</span>
            </span>

            {challenge.tags && challenge.tags[0] && (
              <span className="px-2.5 py-0.5 rounded-full bg-[#101010] text-[#9298A3] font-medium border border-[#20242C]">
                {challenge.tags[0]}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-[#9298A3] font-mono">
            <Users size={12} />
            <span>{challenge.participantsCount || 3} joined</span>
          </div>
        </div>

        {/* WHAT YOU PERFORM Container */}
        <div className="p-3.5 rounded-2xl bg-[#101010] border border-[#20242C]">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#3B82FF] uppercase tracking-wider mb-1.5">
            <Target size={13} />
            <span>WHAT YOU PERFORM</span>
          </div>
          <p className="text-xs text-white/95 leading-relaxed">
            {challenge.whatYouPerform || challenge.description}
          </p>
        </div>

        {/* Progress Tracker */}
        <div>
          <div className="flex items-center justify-between text-xs text-[#9298A3] font-mono mb-2">
            <span className="text-white font-medium">
              {challenge.joined ? `Day ${challenge.current} of ${challenge.target} completed` : `Not Started (0 of ${challenge.target} days)`}
            </span>
            <span className="text-[#3B82FF] font-bold">{progressPercent}%</span>
          </div>

          <div className="w-full h-2 bg-[#101010] rounded-full overflow-hidden border border-[#20242C]">
            <div
              className="h-full bg-[#2166FF] transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Complete Challenge Screen View vs In-Progress Actions */}
        {isCompleted ? (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#2166FF]/20 via-[#080B10] to-[#101010] border border-[#2166FF]/40 text-center space-y-3 animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-[#2166FF]/25 border border-[#2166FF]/50 mx-auto flex items-center justify-center text-[#3B82FF] shadow-lg shadow-[#2166FF]/30">
              <Trophy size={28} className="animate-bounce" />
            </div>

            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mb-1">
                🎉 CHALLENGE COMPLETED
              </span>
              <h2 className="text-base font-extrabold text-white">
                Sprint Milestone Achieved!
              </h2>
              <p className="text-xs text-[#9298A3] mt-1 max-w-xs mx-auto">
                You've successfully completed all {challenge.target} days of "{challenge.title}". All daily photo proofs and squad check-ins are verified.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 py-2 border-y border-[#20242C] text-left text-xs font-mono">
              <div className="bg-[#101010]/80 p-2.5 rounded-xl border border-[#20242C]">
                <span className="text-[10px] text-[#9298A3] block">TOTAL DAYS</span>
                <span className="text-sm font-bold text-white">{challenge.target} Days Logged</span>
              </div>
              <div className="bg-[#101010]/80 p-2.5 rounded-xl border border-[#20242C]">
                <span className="text-[10px] text-[#9298A3] block">SQUAD STATUS</span>
                <span className="text-sm font-bold text-emerald-400">100% Finished</span>
              </div>
            </div>

            {/* Restart Challenge Again Button per Requirement */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => onRestartChallenge?.(challenge.id)}
                className="w-full py-2.5 rounded-xl bg-[#2166FF] hover:bg-[#3B82FF] active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#2166FF]/30 transition-all cursor-pointer"
              >
                <Flame size={15} />
                <span>Restart Challenge Again (Day 1)</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onOpenCohortChat}
                  className="flex-1 py-2 rounded-xl bg-[#101010] hover:bg-[#1a1f29] border border-[#20242C] text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <MessageSquare size={13} className="text-[#3B82FF]" />
                  <span>Squad Proofs & Chat</span>
                </button>
                <button
                  type="button"
                  onClick={onBack}
                  className="px-3.5 py-2 rounded-xl bg-[#101010] hover:bg-[#1a1f29] border border-[#20242C] text-xs font-medium text-[#9298A3] hover:text-white transition-colors cursor-pointer"
                >
                  Back
                </button>
              </div>
            </div>
          </div>
        ) : !challenge.joined ? (
          /* Not Joined Yet - Start Challenge at Day 1 */
          <div className="space-y-2.5 pt-1">
            <button
              onClick={() => onToggleJoin?.(challenge.id)}
              className="w-full py-2.5 rounded-xl bg-[#2166FF] hover:bg-[#3B82FF] active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#2166FF]/25 transition-all cursor-pointer"
            >
              <Flame size={15} />
              <span>Start Challenge (Mark as Day 1)</span>
            </button>
            <p className="text-[11px] text-[#9298A3] text-center">
              Starting this challenge marks your streak as Day 1.
            </p>
          </div>
        ) : (
          /* In Progress - Upload Proof & Cohort Chat & Leave Challenge */
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowProofForm(!showProofForm)}
                className="flex-1 py-2.5 rounded-xl bg-[#2166FF] hover:bg-[#3B82FF] active:scale-95 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-md shadow-[#2166FF]/25 transition-all cursor-pointer"
              >
                <Flame size={15} />
                <span>Upload Photo Proof & Check In</span>
              </button>

              <button
                onClick={onOpenCohortChat}
                className="px-3.5 py-2.5 rounded-xl bg-[#101010] hover:bg-[#1a1f29] border border-[#20242C] text-xs font-semibold text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <MessageSquare size={14} className="text-[#3B82FF]" />
                <span>Cohort Chat</span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle size={12} /> Active sprint in progress
              </span>

              {/* Leave Challenge button resets to Day 0 per requirement */}
              <button
                type="button"
                onClick={() => onToggleJoin?.(challenge.id)}
                className="text-[11px] text-red-400/80 hover:text-red-400 hover:underline cursor-pointer transition-colors"
                title="Leaves challenge and resets progress to Day 0"
              >
                Leave Challenge (Reset to Day 0)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Upload Photo Proof Form Drawer */}
      {showProofForm && (
        <form onSubmit={handleSubmitProof} className="p-4 rounded-3xl bg-[#080B10] border border-[#2166FF]/40 mb-5 animate-fade-in space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#20242C]">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Camera size={14} className="text-[#3B82FF]" />
              Upload Photo Proof for Day {(challenge.current || 0) + 1}
            </h3>
            <button
              type="button"
              onClick={() => setShowProofForm(false)}
              className="text-[#9298A3] hover:text-white"
            >
              <X size={15} />
            </button>
          </div>

          <textarea
            value={proofNote}
            onChange={(e) => setProofNote(e.target.value)}
            placeholder="Add a caption or notes for today's proof (e.g. Read 28 pages, 5.2 km logged, shipped login flow)..."
            rows={2}
            className="w-full bg-[#101010] border border-[#20242C] rounded-xl p-2.5 text-xs text-white placeholder-[#9298A3] focus:outline-none focus:border-[#2166FF] resize-none"
          />

          {/* Photo attachment preview */}
          {proofPhoto ? (
            <div className="relative rounded-2xl overflow-hidden border border-[#20242C] aspect-video bg-[#101010]">
              <img src={proofPhoto} alt="Proof" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setProofPhoto(null)}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/80 text-white flex items-center justify-center cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-4 rounded-2xl bg-[#101010] hover:bg-[#1a1f29] border border-[#20242C] border-dashed text-center cursor-pointer transition-colors"
            >
              <ImageIcon size={22} className="mx-auto text-[#3B82FF] mb-1 opacity-80" />
              <p className="text-xs font-semibold text-white">Tap to upload photo from your device</p>
              <p className="text-[11px] text-[#9298A3]">JPEG, PNG proof screenshot</p>
            </div>
          )}

          {/* Quick presets */}
          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-[#9298A3]">Or sample proof:</span>
            <button
              type="button"
              onClick={() => handleUseSamplePhoto('code')}
              className="px-2 py-0.5 rounded bg-[#101010] hover:bg-[#20242C] text-[#9298A3] hover:text-white border border-[#20242C]"
            >
              + Code Screenshot
            </button>
            <button
              type="button"
              onClick={() => handleUseSamplePhoto('runner')}
              className="px-2 py-0.5 rounded bg-[#101010] hover:bg-[#20242C] text-[#9298A3] hover:text-white border border-[#20242C]"
            >
              + Run GPS
            </button>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-[#2166FF] hover:bg-[#3B82FF] active:scale-95 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-[#2166FF]/25 transition-all cursor-pointer"
          >
            <CheckCircle size={15} />
            <span>Confirm & Check In</span>
          </button>
        </form>
      )}

      {/* Challenge Rules & Cohort Overview */}
      <div className="p-4 rounded-3xl bg-[#080B10] border border-[#20242C] space-y-2.5">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-1">
          Accountability Sprint Guidelines
        </h3>
        <ul className="text-xs text-[#9298A3] space-y-1.5 list-disc list-inside">
          <li>Check in daily before 11:59 PM to maintain your accountability streak.</li>
          <li>Photograph authentic proof: book annotations, git logs, or workout data.</li>
          <li>Support cohort members in the discussion channel to unlock squad momentum.</li>
        </ul>
      </div>
    </div>
  );
};
