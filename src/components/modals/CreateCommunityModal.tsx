import React, { useEffect, useState } from 'react';
import { X, Users, Globe, Lock, Plus, Sparkles, Tag } from 'lucide-react';
import { Community } from '../../types';
import { StorageService } from '../../services/storageService';
import { addKnownHashtag, loadKnownHashtags } from '../../services/hashtagService';

interface CreateCommunityModalProps {
  onClose: () => void;
  onCreate: (newCommunity: Partial<Community>) => void;
  creatorName: string;
  creatorUsername: string;
}

export const CreateCommunityModal: React.FC<CreateCommunityModalProps> = ({
  onClose,
  onCreate,
  creatorName,
  creatorUsername,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Coding');
  const [isPublic, setIsPublic] = useState(true);
  const [selectedTag, setSelectedTag] = useState('#Coding');
  const [customTagInput, setCustomTagInput] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [tagFeedback, setTagFeedback] = useState<string | null>(null);
  const [availableTags, setAvailableTags] = useState<string[]>(() => StorageService.getAllKnownHashtags());

  useEffect(() => {
    loadKnownHashtags().then(setAvailableTags).catch((error: unknown) => {
      console.error('Hashtag list could not be loaded:', error);
      setTagFeedback('Shared hashtags could not be loaded. Please try again later.');
    });
  }, []);

  const handleCreateCustomTag = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const clean = customTagInput.trim();
    if (!clean) return;

    try {
      const result = await addKnownHashtag(clean);
      setSelectedTag(result.canonicalTag);
      setCategory(result.canonicalTag.replace('#', ''));
      setAvailableTags(await loadKnownHashtags());
      setCustomTagInput('');
      setIsAddingTag(false);
      setTagFeedback(
        result.isNew
          ? result.shared
            ? `Created shared hashtag "${result.canonicalTag}"!`
            : `Created local hashtag "${result.canonicalTag}". Sign in to share it.`
          : `"${result.canonicalTag}" already exists and was selected.`
      );
    } catch (error) {
      console.error('Hashtag creation failed:', error);
      setTagFeedback('Hashtag could not be created. Please try again.');
    }
    setTimeout(() => setTagFeedback(null), 3000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onCreate({
      name: name.trim(),
      description: description.trim() || `Daily community for ${category} enthusiasts`,
      category,
      isPublic,
      tags: [selectedTag],
      membersCount: 1,
      isJoined: true,
      icon: category === 'Fitness' ? 'runner' : category === 'Design' ? 'palette' : 'code',
      accentColor: '#3B82FF',
      creator: {
        name: creatorName,
        username: creatorUsername,
      },
      coverUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80',
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
        className="w-full max-w-[420px] bg-[#080B10] border-t sm:border border-[#20242C] rounded-t-3xl sm:rounded-3xl shadow-2xl p-4 sm:p-5 max-h-[92dvh] sm:max-h-[85vh] flex flex-col overscroll-contain"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#20242C] mb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#2166FF]/15 border border-[#2166FF]/30 flex items-center justify-center text-[#3B82FF] shrink-0">
              <Users size={16} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white leading-tight">Create Community</h3>
              <p className="text-[10px] sm:text-[11px] text-[#9298A3]">Gather builders & fellow practitioners</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#9298A3] hover:text-white hover:bg-[#101010] transition-colors cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X size={17} />
          </button>
        </div>

        {/* Scrollable Form Body with Sticky Footer */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto space-y-3 text-xs pr-1">
            {/* Community Name */}
            <div>
              <label className="block text-[10px] sm:text-[11px] font-semibold text-[#9298A3] uppercase tracking-wider mb-1">
                Community Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Growingup, AI Founders, Sunset Runners"
                className="w-full bg-[#101010] border border-[#20242C] rounded-xl px-3 py-2 text-xs text-white placeholder-[#9298A3] focus:outline-none focus:border-[#2166FF]"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-[10px] sm:text-[11px] font-semibold text-[#9298A3] uppercase tracking-wider mb-1">
                Description / Mission
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="e.g. Daily community for Coding enthusiasts sharing architecture and real shipments."
                className="w-full bg-[#101010] border border-[#20242C] rounded-xl px-3 py-2 text-xs text-white placeholder-[#9298A3] focus:outline-none focus:border-[#2166FF] resize-none"
              />
            </div>

            {/* Topic / Discipline with Custom Hashtags */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[10px] sm:text-[11px] font-semibold text-[#9298A3] uppercase tracking-wider">
                  Topic / Discipline
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddingTag(!isAddingTag)}
                  className="text-[10px] font-semibold text-[#3B82FF] hover:text-[#2166FF] flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus size={12} />
                  <span>{isAddingTag ? 'Cancel' : 'New Hashtag'}</span>
                </button>
              </div>

              {/* Tag creation input bar */}
              {isAddingTag && (
                <div className="mb-2 p-2 bg-[#10141D] border border-[#2166FF]/40 rounded-xl space-y-1.5 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={customTagInput}
                      onChange={(e) => setCustomTagInput(e.target.value)}
                      placeholder="e.g. #Web3, #Cybersecurity"
                      className="flex-1 bg-[#080B10] border border-[#202738] rounded-lg px-2.5 py-1 text-xs text-white placeholder-[#8A92A6] focus:outline-none focus:border-[#2166FF]"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleCreateCustomTag(e);
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleCreateCustomTag}
                      disabled={!customTagInput.trim()}
                      className="px-2.5 py-1 rounded-lg bg-[#2166FF] hover:bg-[#3B82FF] disabled:opacity-40 text-white text-xs font-semibold cursor-pointer shrink-0"
                    >
                      Add
                    </button>
                  </div>
                  <p className="text-[10px] text-[#8A92A6]">
                    Hashtags are shared platform-wide. Existing hashtags will not be duplicated.
                  </p>
                </div>
              )}

              {tagFeedback && (
                <div className="mb-2 text-[10px] text-[#3B82FF] bg-[#2166FF]/10 px-2 py-1 rounded-lg border border-[#2166FF]/20">
                  {tagFeedback}
                </div>
              )}

              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-0.5 no-scrollbar">
                {availableTags.map((topic) => (
                  <button
                    type="button"
                    key={topic}
                    onClick={() => {
                      setSelectedTag(topic);
                      setCategory(topic.replace('#', ''));
                    }}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                      selectedTag.toLowerCase() === topic.toLowerCase()
                        ? 'bg-[#2166FF] text-white shadow-sm'
                        : 'bg-[#101010] text-[#9298A3] hover:text-white border border-[#20242C]'
                    }`}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>

            {/* Access Mode */}
            <div>
              <label className="block text-[10px] sm:text-[11px] font-semibold text-[#9298A3] uppercase tracking-wider mb-1">
                Access Type
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-[#101010] border border-[#20242C] rounded-xl">
                <button
                  type="button"
                  onClick={() => setIsPublic(true)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isPublic
                      ? 'bg-[#2166FF] text-white shadow-sm'
                      : 'text-[#9298A3] hover:text-white'
                  }`}
                >
                  <Globe size={13} />
                  <span>Public (Open)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPublic(false)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    !isPublic
                      ? 'bg-[#2166FF] text-white shadow-sm'
                      : 'text-[#9298A3] hover:text-white'
                  }`}
                >
                  <Lock size={13} />
                  <span>Invite Only</span>
                </button>
              </div>
            </div>
          </div>

          {/* Fixed Bottom Submit Actions */}
          <div className="pt-3 mt-2 border-t border-[#20242C]/60 flex items-center gap-2 shrink-0">
            <button
              type="submit"
              className="flex-1 py-2.5 px-3 rounded-xl bg-[#2166FF] hover:bg-[#3B82FF] active:scale-95 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-lg shadow-[#2166FF]/30 transition-all cursor-pointer"
            >
              <Plus size={15} />
              <span>Launch Community</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2.5 rounded-xl bg-[#101010] hover:bg-[#20242C] text-[#9298A3] hover:text-white text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
