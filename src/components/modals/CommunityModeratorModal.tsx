import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Users, 
  BookOpen, 
  Check, 
  Trash2, 
  Plus, 
  UserCheck, 
  UserX, 
  Send,
  AlertCircle,
  Lock,
  Sparkles
} from 'lucide-react';
import { Author, Community, JoinRequest } from '../../types';

interface CommunityModeratorModalProps {
  isOpen: boolean;
  community: Community;
  currentUser: Author;
  onClose: () => void;
  onUpdateGuidelines: (communityId: string, guidelines: string[]) => void;
  onApproveRequest: (communityId: string, requestId: string, applicant: Author) => void;
  onDeclineRequest: (communityId: string, requestId: string) => void;
  onSendDirectInvite?: (communityId: string, username: string) => void;
  initialTab?: 'invites' | 'guidelines';
}

export const CommunityModeratorModal: React.FC<CommunityModeratorModalProps> = ({
  isOpen,
  community,
  currentUser,
  onClose,
  onUpdateGuidelines,
  onApproveRequest,
  onDeclineRequest,
  onSendDirectInvite,
  initialTab = 'invites',
}) => {
  const [activeTab, setActiveTab] = useState<'invites' | 'guidelines'>(initialTab);
  
  // Guidelines state
  const defaultGuidelines = [
    'Share verifiable daily progress, architecture notes, and code insights.',
    'Keep discussions constructive, positive, and focused on growth.',
    'No spam, unauthorized commercial solicitation, or low-effort ads.',
    'Celebrate shipping milestones and uphold cohort confidentiality.',
  ];

  const [guidelinesList, setGuidelinesList] = useState<string[]>(
    community.guidelines && community.guidelines.length > 0 
      ? community.guidelines 
      : defaultGuidelines
  );
  const [newRuleInput, setNewRuleInput] = useState('');
  const [inviteUsernameInput, setInviteUsernameInput] = useState('');

  if (!isOpen) return null;

  const pendingRequests = community.pendingJoinRequests || [];

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleInput.trim()) return;
    setGuidelinesList([...guidelinesList, newRuleInput.trim()]);
    setNewRuleInput('');
  };

  const handleDeleteRule = (index: number) => {
    setGuidelinesList(guidelinesList.filter((_, i) => i !== index));
  };

  const handleRuleChange = (index: number, val: string) => {
    const updated = [...guidelinesList];
    updated[index] = val;
    setGuidelinesList(updated);
  };

  const handleSaveGuidelines = () => {
    onUpdateGuidelines(community.id, guidelinesList);
    onClose();
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteUsernameInput.trim()) return;
    onSendDirectInvite?.(community.id, inviteUsernameInput.trim().replace('@', ''));
    setInviteUsernameInput('');
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[#080B10] border border-[#20242C] rounded-3xl shadow-2xl flex flex-col max-h-[92dvh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#20242C] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#2166FF]/15 border border-[#2166FF]/30 flex items-center justify-center text-[#3B82FF]">
              <ShieldCheck size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white">
                  Moderator Console
                </h3>
                <span className="text-[10px] font-semibold text-[#3B82FF] bg-[#2166FF]/15 px-2 py-0.5 rounded-full border border-[#2166FF]/25">
                  {community.name}
                </span>
              </div>
              <p className="text-[11px] text-[#9298A3]">
                Manage pending join invites and community guidelines
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#9298A3] hover:text-white hover:bg-[#101010] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={17} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#20242C] bg-[#05070A] shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('invites')}
            className={`flex-1 py-2.5 px-3 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'invites'
                ? 'border-[#2166FF] text-[#3B82FF] bg-[#2166FF]/5'
                : 'border-transparent text-[#9298A3] hover:text-white'
            }`}
          >
            <Users size={14} />
            <span>Join Invites & Requests</span>
            {pendingRequests.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#2166FF] text-white text-[10px] flex items-center justify-center font-bold">
                {pendingRequests.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('guidelines')}
            className={`flex-1 py-2.5 px-3 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'guidelines'
                ? 'border-[#2166FF] text-[#3B82FF] bg-[#2166FF]/5'
                : 'border-transparent text-[#9298A3] hover:text-white'
            }`}
          >
            <BookOpen size={14} />
            <span>Change Guidelines</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === 'invites' ? (
            /* INVITES & JOIN REQUESTS TAB */
            <div className="space-y-4">
              {/* Privacy badge */}
              {!community.isPublic ? (
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2.5 text-xs text-amber-200">
                  <Lock size={15} className="shrink-0 text-amber-400" />
                  <span>
                    This is a <strong>Private Community</strong>. All prospective members must be approved by a moderator.
                  </span>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-[#101010] border border-[#20242C] flex items-center gap-2.5 text-xs text-[#9298A3]">
                  <ShieldCheck size={15} className="shrink-0 text-[#3B82FF]" />
                  <span>
                    Community is Open. You can invite specific cohort peers or review access.
                  </span>
                </div>
              )}

              {/* Direct Invite by Username */}
              <form onSubmit={handleSendInvite} className="p-3.5 rounded-2xl bg-[#080B10] border border-[#20242C]">
                <label className="block text-[11px] font-semibold text-[#9298A3] uppercase tracking-wider mb-1.5">
                  Direct Member Invite
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center bg-[#101010] border border-[#20242C] rounded-xl px-3 py-1.5 focus-within:border-[#2166FF]">
                    <span className="text-xs text-[#9298A3] mr-1">@</span>
                    <input
                      type="text"
                      value={inviteUsernameInput}
                      onChange={(e) => setInviteUsernameInput(e.target.value)}
                      placeholder="e.g. elena.ai, runwithme, devin.creates"
                      className="w-full bg-transparent text-xs text-white focus:outline-none placeholder-[#9298A3]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3.5 py-2 rounded-xl bg-[#2166FF] hover:bg-[#3B82FF] active:scale-95 text-xs font-semibold text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-[#2166FF]/20 shrink-0"
                  >
                    <Send size={13} />
                    <span>Invite</span>
                  </button>
                </div>
              </form>

              {/* Pending Requests List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-[#9298A3] uppercase tracking-wider">
                    Pending Join Requests ({pendingRequests.length})
                  </h4>
                  {pendingRequests.length > 0 && (
                    <span className="text-[10px] text-amber-400 font-medium">Awaiting Moderator Approval</span>
                  )}
                </div>

                {pendingRequests.length > 0 ? (
                  <div className="space-y-2.5">
                    {pendingRequests.map((req) => (
                      <div
                        key={req.id}
                        className="p-3.5 rounded-2xl bg-[#080B10] border border-[#20242C] flex flex-col gap-2.5 hover:border-[#20242C]/90 transition-all"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={req.user.avatar}
                              alt={req.user.name}
                              className="w-9 h-9 rounded-full object-cover border border-[#20242C] shrink-0"
                              referrerPolicy="no-referrer"
                            />
                            <div className="min-w-0">
                              <h5 className="text-xs font-bold text-white truncate">
                                {req.user.name}
                              </h5>
                              <p className="text-[10px] text-[#9298A3] truncate">
                                @{req.user.username} • {req.timestamp}
                              </p>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => onApproveRequest(community.id, req.id, req.user)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                            >
                              <UserCheck size={13} />
                              <span>Approve</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeclineRequest(community.id, req.id)}
                              className="px-2.5 py-1.5 rounded-xl bg-[#101010] hover:bg-[#1a1f29] text-[#9298A3] hover:text-white border border-[#20242C] text-xs font-medium transition-colors cursor-pointer"
                            >
                              <UserX size={13} />
                              <span>Decline</span>
                            </button>
                          </div>
                        </div>

                        {req.note && (
                          <div className="p-2.5 rounded-xl bg-[#101010] border border-[#20242C]/70 text-[11px] text-[#9298A3] leading-relaxed italic">
                            &quot;{req.note}&quot;
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center rounded-2xl bg-[#080B10] border border-[#20242C] text-[#9298A3]">
                    <UserCheck size={28} className="mx-auto text-emerald-400 mb-1.5 opacity-80" />
                    <p className="text-xs font-medium text-white mb-0.5">All Clear</p>
                    <p className="text-[11px]">No pending join requests waiting for review.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* CHANGE GUIDELINES TAB */
            <div className="space-y-4">
              <div className="p-3 rounded-2xl bg-[#101010] border border-[#20242C] text-xs text-[#9298A3]">
                <p className="text-white font-semibold mb-0.5 flex items-center gap-1.5">
                  <BookOpen size={14} className="text-[#3B82FF]" />
                  Community Rules & Code of Conduct
                </p>
                <p className="text-[11px]">
                  As moderator, you set the expectations for participation, proof verification, and civil discourse.
                </p>
              </div>

              {/* Guidelines List */}
              <div className="space-y-2.5">
                {guidelinesList.map((rule, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-[#080B10] border border-[#20242C] flex items-start gap-2.5 group"
                  >
                    <span className="w-5 h-5 rounded-full bg-[#101010] border border-[#20242C] text-[10px] font-bold text-[#3B82FF] flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <textarea
                      rows={2}
                      value={rule}
                      onChange={(e) => handleRuleChange(idx, e.target.value)}
                      className="flex-1 bg-transparent text-xs text-white placeholder-[#9298A3] focus:outline-none resize-none leading-relaxed"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteRule(idx)}
                      className="w-7 h-7 rounded-lg text-[#9298A3] hover:text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
                      title="Delete guideline"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add New Rule */}
              <form onSubmit={handleAddRule} className="flex items-center gap-2">
                <input
                  type="text"
                  value={newRuleInput}
                  onChange={(e) => setNewRuleInput(e.target.value)}
                  placeholder="Add a new guideline or rule..."
                  className="flex-1 bg-[#101010] border border-[#20242C] rounded-xl px-3 py-2 text-xs text-white placeholder-[#9298A3] focus:outline-none focus:border-[#2166FF]"
                />
                <button
                  type="submit"
                  disabled={!newRuleInput.trim()}
                  className="px-3.5 py-2 rounded-xl bg-[#2166FF] hover:bg-[#3B82FF] disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-white flex items-center gap-1 transition-all cursor-pointer shrink-0"
                >
                  <Plus size={14} />
                  <span>Add Rule</span>
                </button>
              </form>

              {/* Reset to defaults */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setGuidelinesList(defaultGuidelines)}
                  className="text-[11px] text-[#9298A3] hover:text-white underline cursor-pointer"
                >
                  Reset to default guidelines
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#20242C] bg-[#080B10] flex items-center justify-between gap-3 shrink-0">
          <p className="text-[11px] text-[#9298A3]">
            {activeTab === 'guidelines' ? `${guidelinesList.length} rules active` : `${pendingRequests.length} pending requests`}
          </p>

          <div className="flex items-center gap-2">
            {activeTab === 'guidelines' && (
              <button
                type="button"
                onClick={handleSaveGuidelines}
                className="px-4 py-2 rounded-xl bg-[#2166FF] hover:bg-[#3B82FF] active:scale-95 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-[#2166FF]/20 transition-all cursor-pointer"
              >
                <Check size={14} />
                <span>Save Guidelines</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#101010] hover:bg-[#20242C] text-[#9298A3] hover:text-white text-xs font-medium transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
