import React from 'react';
import { X, Flame, CheckCircle, Plus, BookOpen, Code, Camera, Trophy } from 'lucide-react';
import { Challenge } from '../../types';

interface ChallengeDetailModalProps {
  challenge: Challenge | null;
  onClose: () => void;
  onIncrementProgress: (challengeId: string) => void;
  onToggleJoin: (challengeId: string) => void;
}

export const ChallengeDetailModal: React.FC<ChallengeDetailModalProps> = ({
  challenge,
  onClose,
  onIncrementProgress,
  onToggleJoin,
}) => {
  if (!challenge) return null;

  const isCompleted = challenge.current >= challenge.target;
  const progressPercent = Math.min(
    100,
    Math.round((challenge.current / challenge.target) * 100)
  );

  const getIcon = () => {
    switch (challenge.icon) {
      case 'runner':
        return <Flame size={28} className="text-[#3B82FF]" />;
      case 'book':
        return <BookOpen size={28} className="text-[#3B82FF]" />;
      case 'code':
        return <Code size={28} className="text-[#3B82FF]" />;
      case 'camera':
        return <Camera size={28} className="text-[#3B82FF]" />;
      default:
        return <Trophy size={28} className="text-[#3B82FF]" />;
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-[#080B10] border border-[#20242C] rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#101010] border border-[#20242C] flex items-center justify-center">
              {getIcon()}
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">
                {challenge.title}
              </h3>
              <p className="text-xs text-[#9298A3]">
                {challenge.durationDays ? `${challenge.durationDays} Days Duration` : 'Daily Challenge'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#9298A3] hover:text-white hover:bg-[#101010] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Description */}
        <p className="text-xs text-white/90 leading-relaxed mb-5">
          {challenge.description}
        </p>

        {/* Progress Card */}
        <div className="p-4 rounded-2xl bg-[#101010] border border-[#20242C] mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-white">Current Progress</span>
            <span className="text-xs font-mono text-[#3B82FF] font-bold">
              {challenge.current} / {challenge.target} {challenge.unit || ''}
            </span>
          </div>

          <div className="w-full h-2.5 bg-[#080B10] rounded-full overflow-hidden border border-[#20242C] mb-2">
            <div
              className="h-full bg-[#2166FF] transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#9298A3]">
            <span>{progressPercent}% Complete</span>
            {isCompleted ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle size={12} /> Achieved
              </span>
            ) : (
              <span>{challenge.target - challenge.current} remaining</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          {!isCompleted && (
            <button
              onClick={() => onIncrementProgress(challenge.id)}
              className="w-full py-2.5 rounded-xl bg-[#2166FF] hover:bg-[#3B82FF] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-[#2166FF]/25 active:scale-95 transition-all cursor-pointer"
            >
              <Plus size={16} />
              <span>Log +1 {challenge.unit || 'Progress'}</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleJoin(challenge.id)}
              className="flex-1 py-2 rounded-xl bg-[#101010] hover:bg-[#1a1f29] text-xs font-medium text-white border border-[#20242C] transition-colors cursor-pointer"
            >
              {challenge.joined ? 'Leave Challenge' : 'Join Challenge'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-transparent hover:bg-[#101010] text-xs font-medium text-[#9298A3] hover:text-white transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
