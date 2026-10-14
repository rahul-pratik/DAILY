import React, { useState } from 'react';
import { X, Trophy, Flame, BookOpen, Code, Camera, Plus, Users, Target } from 'lucide-react';
import { Challenge } from '../../types';

interface CreateChallengeModalProps {
  onClose: () => void;
  onCreate: (newChallenge: Partial<Challenge>) => void;
  creatorName: string;
  creatorUsername: string;
}

export const CreateChallengeModal: React.FC<CreateChallengeModalProps> = ({
  onClose,
  onCreate,
  creatorName,
  creatorUsername,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [whatYouPerform, setWhatYouPerform] = useState('');
  const [category, setCategory] = useState<'reading' | 'fitness' | 'building' | 'creativity' | 'habits'>('reading');
  const [type, setType] = useState<'solo' | 'squad'>('solo');
  const [maxSquadSize, setMaxSquadSize] = useState('5');
  const [durationDays, setDurationDays] = useState('30');
  const [selectedTag, setSelectedTag] = useState('#Reading');
  const [icon, setIcon] = useState('book');

  const tagOptions = ['#Reading', '#Coding', '#Fitness', '#Habits', '#Building', '#Creativity'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const days = parseInt(durationDays) || 30;

    onCreate({
      title: title.trim(),
      description: description.trim() || whatYouPerform.trim() || 'Daily consistency sprint',
      whatYouPerform: whatYouPerform.trim() || description.trim(),
      current: 1, // Whenever someone starts/creates a challenge, mark it as day 1
      target: days,
      unit: 'days',
      category,
      type,
      tags: [selectedTag],
      icon,
      status: 'active',
      joined: true,
      durationDays: days,
      maxSquadSize: type === 'squad' ? (parseInt(maxSquadSize) || 5) : undefined,
      participantsCount: 1,
      squadMembers: [
        {
          id: `u_${Date.now()}`,
          name: creatorName,
          username: creatorUsername,
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
          dayReached: 1,
          role: 'creator',
        }
      ],
      creator: {
        name: creatorName,
        username: creatorUsername,
      },
    });
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[#080B10] border border-[#20242C] rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#20242C] mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#2166FF]/15 border border-[#2166FF]/30 flex items-center justify-center text-[#3B82FF]">
              <Plus size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">Create New Challenge</h3>
              <p className="text-[11px] text-[#9298A3]">Start a solo focus sprint or team squad</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#9298A3] hover:text-white hover:bg-[#101010] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Challenge Type Segmented Control */}
          <div>
            <label className="block text-[11px] font-semibold text-[#9298A3] uppercase tracking-wider mb-1.5">
              Sprint Format
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#101010] border border-[#20242C] rounded-xl mb-2">
              <button
                type="button"
                onClick={() => setType('solo')}
                className={`py-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  type === 'solo'
                    ? 'bg-[#2166FF] text-white shadow-sm'
                    : 'text-[#9298A3] hover:text-white'
                }`}
              >
                <Target size={14} />
                <span>Solo Focus</span>
              </button>
              <button
                type="button"
                onClick={() => setType('squad')}
                className={`py-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  type === 'squad'
                    ? 'bg-[#2166FF] text-white shadow-sm'
                    : 'text-[#9298A3] hover:text-white'
                }`}
              >
                <Users size={14} />
                <span>Team Squad</span>
              </button>
            </div>

            {/* Option under Team Squad to set how many users are allowed in a squad */}
            {type === 'squad' && (
              <div className="p-3 rounded-2xl bg-[#101010] border border-[#2166FF]/30 space-y-2 animate-fade-in">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-white flex items-center gap-1.5">
                    <Users size={13} className="text-[#3B82FF]" />
                    <span>Squad Member Limit (Max Allowed)</span>
                  </label>
                  <span className="text-xs font-mono font-bold text-[#3B82FF]">
                    {maxSquadSize} Members Max
                  </span>
                </div>
                <p className="text-[11px] text-[#9298A3]">
                  Set how many users can join this team squad to keep accountability focused.
                </p>
                <div className="flex items-center gap-2">
                  {['3', '5', '8', '12', '20'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setMaxSquadSize(preset)}
                      className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        maxSquadSize === preset
                          ? 'bg-[#2166FF] text-white shadow-sm'
                          : 'bg-[#080B10] text-[#9298A3] hover:text-white border border-[#20242C]'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                  <div className="flex items-center gap-1 ml-auto">
                    <span className="text-[10px] text-[#9298A3]">Custom:</span>
                    <input
                      type="number"
                      min="2"
                      max="100"
                      value={maxSquadSize}
                      onChange={(e) => setMaxSquadSize(e.target.value)}
                      className="w-16 bg-[#080B10] border border-[#20242C] rounded-lg px-2 py-1 text-center text-xs text-white focus:outline-none focus:border-[#2166FF]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-[11px] font-semibold text-[#9298A3] uppercase tracking-wider mb-1.5">
              Challenge Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 30 Days of Deep Reading, 100 Days of Code"
              className="w-full bg-[#101010] border border-[#20242C] rounded-xl px-3.5 py-2.5 text-white placeholder-[#9298A3] focus:outline-none focus:border-[#2166FF]"
              required
            />
          </div>

          {/* What You Perform */}
          <div>
            <label className="block text-[11px] font-semibold text-[#9298A3] uppercase tracking-wider mb-1.5">
              What You Perform (Daily Goal & Evidence)
            </label>
            <textarea
              value={whatYouPerform}
              onChange={(e) => setWhatYouPerform(e.target.value)}
              rows={2}
              placeholder="e.g. Read 25+ pages daily and photograph key margin notes or book highlights."
              className="w-full bg-[#101010] border border-[#20242C] rounded-xl px-3.5 py-2 text-white placeholder-[#9298A3] focus:outline-none focus:border-[#2166FF] resize-none"
            />
          </div>

          {/* Primary Tag */}
          <div>
            <label className="block text-[11px] font-semibold text-[#9298A3] uppercase tracking-wider mb-1.5">
              Tag / Discipline
            </label>
            <div className="flex flex-wrap gap-1.5">
              {tagOptions.map((tag) => (
                <button
                  type="button"
                  key={tag}
                  onClick={() => {
                    setSelectedTag(tag);
                    if (tag === '#Reading') {
                      setCategory('reading');
                      setIcon('book');
                    } else if (tag === '#Fitness') {
                      setCategory('fitness');
                      setIcon('runner');
                    } else if (tag === '#Coding') {
                      setCategory('building');
                      setIcon('code');
                    } else if (tag === '#Creativity') {
                      setCategory('creativity');
                      setIcon('camera');
                    } else {
                      setCategory('habits');
                      setIcon('trophy');
                    }
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    selectedTag === tag
                      ? 'bg-[#2166FF] text-white shadow-sm'
                      : 'bg-[#101010] text-[#9298A3] hover:text-white border border-[#20242C]'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Duration (Days) Only - Target Units deleted per requirement */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-semibold text-[#9298A3] uppercase tracking-wider">
                Duration (Days) *
              </label>
              <span className="text-[11px] text-[#3B82FF] font-medium font-mono">
                {durationDays} Days Total
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="365"
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                className="flex-1 bg-[#101010] border border-[#20242C] rounded-xl px-3.5 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-[#2166FF]"
                required
              />
              <div className="flex gap-1.5">
                {['7', '14', '30', '60', '100'].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setDurationDays(days)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      durationDays === days
                        ? 'bg-[#2166FF] text-white shadow-sm'
                        : 'bg-[#101010] text-[#9298A3] hover:text-white border border-[#20242C]'
                    }`}
                  >
                    {days}d
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[11px] text-[#9298A3] mt-1.5">
              Challenge targets daily consistency for {durationDays} consecutive days.
            </p>
          </div>

          {/* Submit */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-[#2166FF] hover:bg-[#3B82FF] active:scale-95 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-[#2166FF]/30 transition-all cursor-pointer"
            >
              <Plus size={16} />
              <span>Launch Challenge</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-[#101010] hover:bg-[#20242C] text-[#9298A3] hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
