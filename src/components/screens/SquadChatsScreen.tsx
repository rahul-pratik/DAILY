import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, 
  MessageSquare, 
  Send, 
  Smile, 
  Check, 
  CheckCheck, 
  Users, 
  Trophy, 
  Search, 
  Sparkles, 
  ChevronRight, 
  X,
  Target,
  Flame,
  Plus,
  Info
} from 'lucide-react';
import { Author, Challenge, MessageReaction, Squad, SquadChatMessage } from '../../types';

interface SquadChatsScreenProps {
  squads: Squad[];
  challenges?: Challenge[];
  currentUser: Author;
  initialSquad?: Squad | null;
  initialViewMode?: 'list' | 'detail';
  messages: SquadChatMessage[];
  onBack: () => void;
  onSendMessage: (squadId: string, text: string) => void;
  onToggleReaction: (squadId: string, messageId: string, emoji: string) => void;
  onMarkMessagesAsRead?: (squadId: string) => void;
  onNavigateUser?: (user: { name: string; username: string }) => void;
  onOpenCreateSquad?: () => void;
}

const QUICK_EMOJIS = ['🔥', '✅', '🎉', '❤️', '🚀', '👏', '💡', '🎯'];

const EMOJI_KEYBOARD_CATEGORIES = [
  {
    name: 'Motivation & Fire',
    emojis: ['🔥', '🚀', '⚡', '💪', '🏆', '🥇', '🎯', '💯', '👑', '⭐', '🌟', '💥'],
  },
  {
    name: 'Done & Progress',
    emojis: ['✅', '✔️', '👏', '🙌', '🤝', '📈', '🛠️', '📌', '💡', '🧠', '🏃', '📚'],
  },
  {
    name: 'Hype & Celebration',
    emojis: ['🎉', '🥳', '🎊', '🍻', '❤️', '💖', '😎', '🤩', '☕', '🍕', '✨', '🕺'],
  },
  {
    name: 'Reactions & Gestures',
    emojis: ['👍', '👊', '🫡', '🙏', '👀', '🔥', '💯', '🦾', '🧘', '🥊', '🔋', '🚀'],
  },
];

export const SquadChatsScreen: React.FC<SquadChatsScreenProps> = ({
  squads,
  challenges = [],
  currentUser,
  initialSquad,
  initialViewMode = 'list',
  messages,
  onBack,
  onSendMessage,
  onToggleReaction,
  onMarkMessagesAsRead,
  onNavigateUser,
  onOpenCreateSquad,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'detail'>(initialViewMode);
  const [selectedSquad, setSelectedSquad] = useState<Squad | null>(() => {
    if (initialSquad) return initialSquad;
    return squads.length > 0 ? squads[0] : null;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('All');
  const [inputText, setInputText] = useState('');
  const [activeReactionPickerMessageId, setActiveReactionPickerMessageId] = useState<string | null>(null);
  const [showFullEmojiKeyboard, setShowFullEmojiKeyboard] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync initialSquad prop if it changes
  useEffect(() => {
    if (initialSquad) {
      setSelectedSquad(initialSquad);
      setViewMode(initialViewMode);
    }
  }, [initialSquad?.id, initialViewMode]);

  // Mark messages as read when entering or viewing a squad chat
  useEffect(() => {
    if (viewMode === 'detail' && selectedSquad) {
      onMarkMessagesAsRead?.(selectedSquad.id);
    }
  }, [viewMode, selectedSquad?.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (viewMode === 'detail') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, viewMode, selectedSquad?.id]);

  const handleSelectSquad = (sq: Squad) => {
    setSelectedSquad(sq);
    setViewMode('detail');
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedSquad) return;
    onSendMessage(selectedSquad.id, inputText.trim());
    setInputText('');
  };

  const handleEmojiClick = (messageId: string, emoji: string) => {
    if (!selectedSquad) return;
    onToggleReaction(selectedSquad.id, messageId, emoji);
    setActiveReactionPickerMessageId(null);
    setShowFullEmojiKeyboard(false);
  };

  // Filter squads for list view
  const filteredSquads = squads.filter((sq) => {
    if (activeCategoryFilter !== 'All' && sq.category.toLowerCase() !== activeCategoryFilter.toLowerCase()) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = sq.name.toLowerCase().includes(q);
      const matchCh = sq.challengeTitle?.toLowerCase().includes(q) || false;
      return matchName || matchCh;
    }
    return true;
  });

  const activeSquadMessages = selectedSquad
    ? messages.filter((m) => m.squadId === selectedSquad.id)
    : [];

  const categories = ['All', 'Fitness', 'Learning', 'Building', 'Habits'];

  // Resolve associated challenge for active squad
  const associatedChallenge = selectedSquad
    ? challenges.find((c) => c.id === selectedSquad.challengeId)
    : null;

  return (
    <div className="pb-20 pt-2 px-3 sm:px-4 animate-fade-in bg-black min-h-screen text-white">
      {/* ================= 1. SQUAD LIST VIEW ================= */}
      {viewMode === 'list' && (
        <div className="space-y-4 max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 pt-1 border-b border-[#20242C]">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onBack}
                className="w-9 h-9 rounded-full bg-[#101010] hover:bg-[#1a1f29] border border-[#20242C] flex items-center justify-center text-[#9298A3] hover:text-white transition-colors cursor-pointer"
                aria-label="Back"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <MessageSquare size={18} className="text-[#3B82FF]" />
                  <span>Squad Team Chats</span>
                </h1>
                <p className="text-xs text-[#8A92A6]">
                  Dedicated strategy rooms for formed squad cohorts
                </p>
              </div>
            </div>

            {onOpenCreateSquad && (
              <button
                type="button"
                onClick={onOpenCreateSquad}
                className="px-3 py-1.5 rounded-xl bg-[#2166FF] hover:bg-[#3B82FF] text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <Plus size={14} />
                <span className="hidden sm:inline">New Squad</span>
              </button>
            )}
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A92A6]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search squads or challenges..."
              className="w-full bg-[#080B10] border border-[#1C2230] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-[#8A92A6] focus:outline-none focus:border-[#2166FF] transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A92A6] hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategoryFilter(cat)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap border ${
                  activeCategoryFilter === cat
                    ? 'bg-[#2166FF] text-white border-[#2166FF] shadow-sm'
                    : 'bg-[#080B10] text-[#8A92A6] border-[#1C2230] hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Squad List */}
          <div className="space-y-3 pt-1">
            {filteredSquads.length === 0 ? (
              <div className="py-14 text-center px-4 rounded-3xl bg-[#080B10] border border-[#1C2230] space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#2166FF]/15 border border-[#2166FF]/30 flex items-center justify-center text-[#3B82FF] mx-auto">
                  <Users size={22} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">No Squads Found</h3>
                  <p className="text-xs text-[#8A92A6] max-w-xs mx-auto mt-1">
                    {searchQuery
                      ? 'No squads match your search criteria.'
                      : 'Join a squad challenge or create your own squad to start team chats!'}
                  </p>
                </div>
                {onOpenCreateSquad && (
                  <button
                    type="button"
                    onClick={onOpenCreateSquad}
                    className="px-4 py-2 rounded-xl bg-[#2166FF] text-white text-xs font-semibold hover:bg-[#3B82FF] transition-colors cursor-pointer"
                  >
                    Create Squad
                  </button>
                )}
              </div>
            ) : (
              filteredSquads.map((squad) => {
                const sqMessages = messages.filter((m) => m.squadId === squad.id);
                const lastMsg = sqMessages[sqMessages.length - 1];
                const rawMembers = squad.members || [];
                const membersCount = rawMembers.length;
                const ch = challenges.find((c) => c.id === squad.challengeId);

                return (
                  <div
                    key={squad.id}
                    onClick={() => handleSelectSquad(squad)}
                    className="p-4 rounded-2xl bg-[#080B10] hover:bg-[#0E121B] border border-[#1C2230] hover:border-[#2166FF]/40 transition-all flex items-center justify-between gap-3 cursor-pointer group shadow-sm"
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      {/* Squad Icon */}
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#121622] to-[#1C2333] border border-[#202738] flex items-center justify-center text-[#3B82FF] shrink-0 group-hover:scale-105 transition-transform shadow-inner">
                        <Users size={20} />
                      </div>

                      {/* Squad Details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="text-sm font-bold text-white group-hover:text-[#3B82FF] transition-colors truncate">
                            {squad.name}
                          </h3>
                          <span className="text-[10px] font-semibold text-[#3B82FF] bg-[#2166FF]/15 px-2 py-0.5 rounded-full border border-[#2166FF]/25">
                            {squad.category}
                          </span>
                        </div>

                        {/* Challenge association */}
                        <div className="flex items-center gap-1.5 text-[11px] text-[#8A92A6] mb-1.5 truncate">
                          <Target size={11} className="text-[#3B82FF] shrink-0" />
                          <span className="truncate">
                            Challenge: <strong className="text-white font-medium">{squad.challengeTitle || ch?.title || 'Daily Sprint'}</strong>
                          </span>
                        </div>

                        {/* Last message preview */}
                        {lastMsg ? (
                          <div className="flex items-center gap-1.5 text-xs text-[#8A92A6] truncate">
                            <span className="text-white/80 font-medium shrink-0">
                              {lastMsg.author?.name || lastMsg.sender?.name || 'Member'}:
                            </span>
                            <span className="truncate text-[#9298A3]">{lastMsg.text}</span>
                            <span className="text-[10px] text-[#8A92A6]/70 shrink-0">· {lastMsg.timestamp}</span>
                          </div>
                        ) : (
                          <p className="text-[11px] text-[#8A92A6]/70 italic">
                            No messages yet. Tap to start the strategy room!
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Member Avatars & Enter Chevron */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="hidden sm:flex items-center -space-x-1.5">
                        {rawMembers.slice(0, 3).map((m, idx) => (
                          <img
                            key={idx}
                            src={m.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'}
                            alt={m.name}
                            className="w-6 h-6 rounded-full object-cover border-2 border-[#080B10]"
                          />
                        ))}
                        {membersCount > 3 && (
                          <span className="w-6 h-6 rounded-full bg-[#1C2230] text-[9px] font-bold text-white flex items-center justify-center border-2 border-[#080B10]">
                            +{membersCount - 3}
                          </span>
                        )}
                      </div>

                      <div className="w-8 h-8 rounded-full bg-[#10141D] flex items-center justify-center text-[#8A92A6] group-hover:text-white group-hover:bg-[#2166FF] transition-all">
                        <ChevronRight size={16} />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ================= 2. COMPLETE SQUAD CHAT ROOM VIEW ================= */}
      {viewMode === 'detail' && selectedSquad && (
        <div className="flex flex-col h-[calc(100dvh-5.5rem)] max-w-3xl mx-auto rounded-3xl bg-[#06080D] border border-[#1C2230] overflow-hidden shadow-2xl">
          {/* Room Top Header */}
          <div className="p-3.5 bg-[#0A0D15] border-b border-[#1C2230] flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className="w-8 h-8 rounded-full bg-[#121620] hover:bg-[#1C2230] border border-[#202738] flex items-center justify-center text-[#8A92A6] hover:text-white transition-colors cursor-pointer shrink-0"
                aria-label="Back to squad chats"
                title="Back to squad chats list"
              >
                <ArrowLeft size={16} />
              </button>

              <div className="w-9 h-9 rounded-xl bg-[#2166FF]/15 border border-[#2166FF]/30 flex items-center justify-center text-[#3B82FF] shrink-0">
                <Users size={18} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 truncate">
                  <h2 className="text-sm font-bold text-white truncate">{selectedSquad.name}</h2>
                  <span className="text-[10px] font-semibold text-[#3B82FF] bg-[#2166FF]/20 px-1.5 py-0.2 rounded-full border border-[#2166FF]/30 shrink-0">
                    {selectedSquad.category}
                  </span>
                </div>
                <p className="text-[11px] text-[#8A92A6] truncate flex items-center gap-1.5">
                  <span className="truncate">
                    Challenge: <strong className="text-white font-medium">{selectedSquad.challengeTitle || associatedChallenge?.title || 'Daily Sprint'}</strong>
                  </span>
                </p>
              </div>
            </div>

            {/* Roster & Info Button */}
            <button
              type="button"
              onClick={() => setShowMembersModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#121620] hover:bg-[#1C2230] border border-[#202738] text-xs font-semibold text-[#8A92A6] hover:text-white transition-colors cursor-pointer shrink-0"
              title="View Squad Members"
            >
              <Users size={13} className="text-[#3B82FF]" />
              <span>{selectedSquad.members?.length || 1} Members</span>
            </button>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 p-4 space-y-3.5 overflow-y-auto bg-[#06080D]">
            {activeSquadMessages.length === 0 ? (
              <div className="py-20 text-center text-[#8A92A6] space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#2166FF]/15 border border-[#2166FF]/30 flex items-center justify-center text-[#3B82FF] mx-auto shadow-inner">
                  <Sparkles size={22} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Squad Strategy Room Ready</h3>
                  <p className="text-xs text-[#8A92A6] max-w-sm mx-auto mt-1">
                    Send the first message to discuss today&apos;s photo proof check-in, set targets, or cheer each other on!
                  </p>
                </div>
              </div>
            ) : (
              activeSquadMessages.map((msg) => {
                const author = msg.author || (msg.sender
                  ? {
                      id: msg.sender.id,
                      name: msg.sender.name,
                      username: msg.sender.username,
                      avatar: msg.sender.avatar,
                    }
                  : {
                      id: '',
                      name: 'Squad Member',
                      username: 'member',
                      avatar: '',
                    });
                
                const isMe = Boolean(
                  (author.username && currentUser?.username && author.username.toLowerCase() === currentUser.username.toLowerCase()) ||
                  (author.id && currentUser?.id && author.id === currentUser.id)
                );

                const isRead = Boolean(msg.read_at || (msg.readBy && msg.readBy.length > 0));
                const reactions = msg.reactions || [];

                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2.5 group relative ${isMe ? 'flex-row-reverse' : ''}`}
                  >
                    <img
                      src={author.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'}
                      alt={author.name}
                      onClick={() => onNavigateUser?.(author)}
                      className="w-8 h-8 rounded-full object-cover border border-[#202738] shrink-0 mt-0.5 cursor-pointer hover:border-[#2166FF] transition-colors"
                      referrerPolicy="no-referrer"
                    />

                    <div className={`max-w-[78%] sm:max-w-[70%] space-y-1 ${isMe ? 'items-end' : ''}`}>
                      {/* Name and timestamp */}
                      <div className={`flex items-center gap-1.5 text-[10px] ${isMe ? 'justify-end' : ''}`}>
                        <button
                          type="button"
                          onClick={() => onNavigateUser?.(author)}
                          className="font-bold text-white hover:text-[#3B82FF] transition-colors cursor-pointer"
                        >
                          {isMe ? 'You' : author.name}
                        </button>
                        <span className="text-[#8A92A6] font-mono">@{author.username}</span>
                        <span className="text-[#8A92A6]">·</span>
                        <span className="text-[#8A92A6] font-mono">{msg.timestamp}</span>
                      </div>

                      {/* Bubble */}
                      <div className="relative group/bubble">
                        <div
                          className={`p-3 rounded-2xl text-xs leading-relaxed break-words shadow-sm ${
                            isMe
                              ? 'bg-[#2166FF] text-white rounded-tr-sm'
                              : 'bg-[#121620] text-gray-100 border border-[#1C2230] rounded-tl-sm'
                          }`}
                        >
                          {msg.text}

                          {/* Read Receipts for own messages */}
                          {isMe && (
                            <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-white/70">
                              {isRead ? (
                                <span className="flex items-center gap-0.5 text-cyan-300 font-medium" title="Read by squad members">
                                  <CheckCheck size={13} className="text-cyan-300 inline" />
                                  <span>Read</span>
                                </span>
                              ) : (
                                <span className="flex items-center gap-0.5 text-white/60" title="Delivered">
                                  <Check size={13} className="inline" />
                                  <span>Sent</span>
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Quick reaction trigger hover/tap button */}
                        <div
                          className={`absolute -top-3 ${
                            isMe ? 'left-0 -translate-x-full pr-1.5' : 'right-0 translate-x-full pl-1.5'
                          } opacity-100 sm:opacity-0 sm:group-hover/bubble:opacity-100 transition-opacity flex items-center gap-1 z-10`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setActiveReactionPickerMessageId(
                                activeReactionPickerMessageId === msg.id ? null : msg.id
                              );
                              setShowFullEmojiKeyboard(false);
                            }}
                            className="w-7 h-7 rounded-full bg-[#161B26] border border-[#202738] hover:border-[#3B82FF] flex items-center justify-center text-[#8A92A6] hover:text-white transition-all shadow-md cursor-pointer"
                            title="React to message"
                          >
                            <Smile size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Quick Reaction Bar popover if active for this message */}
                      {activeReactionPickerMessageId === msg.id && (
                        <div className={`flex flex-col gap-1.5 p-2 bg-[#0E131E] border border-[#2166FF]/40 rounded-2xl shadow-xl z-20 animate-fade-in ${isMe ? 'items-end' : 'items-start'}`}>
                          <div className="flex items-center gap-1 flex-wrap">
                            {QUICK_EMOJIS.map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => handleEmojiClick(msg.id, emoji)}
                                className="w-7 h-7 rounded-lg hover:bg-[#1A2233] flex items-center justify-center text-sm transition-transform hover:scale-125 cursor-pointer"
                              >
                                {emoji}
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={() => setShowFullEmojiKeyboard(!showFullEmojiKeyboard)}
                              className="px-2 py-1 rounded-lg bg-[#161C28] hover:bg-[#202738] text-[10px] text-[#3B82FF] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                              title="Open emoji keyboard"
                            >
                              <Plus size={11} />
                              <span>More</span>
                            </button>
                          </div>

                          {/* Full Emoji Keyboard Accordion */}
                          {showFullEmojiKeyboard && (
                            <div className="w-64 max-h-48 overflow-y-auto p-2 bg-[#080B10] border border-[#202738] rounded-xl space-y-2 text-xs no-scrollbar">
                              {EMOJI_KEYBOARD_CATEGORIES.map((cat) => (
                                <div key={cat.name} className="space-y-1">
                                  <span className="text-[10px] font-bold text-[#8A92A6] uppercase tracking-wider block">
                                    {cat.name}
                                  </span>
                                  <div className="grid grid-cols-6 gap-1">
                                    {cat.emojis.map((em) => (
                                      <button
                                        key={em}
                                        type="button"
                                        onClick={() => handleEmojiClick(msg.id, em)}
                                        className="h-7 rounded hover:bg-[#161C28] flex items-center justify-center text-base hover:scale-125 transition-transform cursor-pointer"
                                      >
                                        {em}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Displayed Reaction Chips under message */}
                      {reactions.length > 0 && (
                        <div className={`flex items-center gap-1.5 flex-wrap pt-0.5 ${isMe ? 'justify-end' : ''}`}>
                          {reactions.map((r) => {
                            const hasMyVote = Boolean(
                              (currentUser?.username && r.users.includes(currentUser.username)) ||
                              (currentUser?.id && r.users.includes(currentUser.id))
                            );
                            return (
                              <button
                                key={r.emoji}
                                type="button"
                                onClick={() => handleEmojiClick(msg.id, r.emoji)}
                                className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 border transition-all cursor-pointer ${
                                  hasMyVote
                                    ? 'bg-[#2166FF]/25 border-[#2166FF] text-white shadow-xs font-bold'
                                    : 'bg-[#10141D] hover:bg-[#161D29] border-[#1C2230] text-[#8A92A6] hover:text-white'
                                }`}
                                title={`${r.users.join(', ')}`}
                              >
                                <span>{r.emoji}</span>
                                <span className="font-mono text-[10px] tabular-nums">{r.count}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Chat Input Bar */}
          <form
            onSubmit={handleSend}
            className="p-3 bg-[#0A0D15] border-t border-[#1C2230] flex items-center gap-2 shrink-0"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Message #${selectedSquad.name.toLowerCase().replace(/\s+/g, '-')}...`}
              className="flex-1 bg-[#10141D] border border-[#1C2230] focus:border-[#2166FF] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#8A92A6] outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="px-4 py-2.5 rounded-xl bg-[#2166FF] hover:bg-[#3B82FF] disabled:opacity-40 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-[#2166FF]/20 shrink-0"
              aria-label="Send message"
            >
              <Send size={14} />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>
      )}

      {/* Squad Members Modal Drawer */}
      {showMembersModal && selectedSquad && (
        <div
          onClick={() => setShowMembersModal(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-[#080B10] border border-[#20242C] rounded-3xl p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#20242C]">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-[#3B82FF]" />
                <h3 className="text-sm font-bold text-white">Squad Members</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowMembersModal(false)}
                className="w-7 h-7 rounded-full bg-[#121620] flex items-center justify-center text-[#8A92A6] hover:text-white"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1 no-scrollbar">
              {(selectedSquad.members || []).map((m) => (
                <div
                  key={m.id || m.username}
                  className="flex items-center justify-between p-2 rounded-xl bg-[#10141D] border border-[#1C2230]"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={m.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'}
                      alt={m.name}
                      className="w-8 h-8 rounded-full object-cover border border-[#202738]"
                    />
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-white block truncate">{m.name}</span>
                      <span className="text-[10px] text-[#3B82FF] font-mono block truncate">@{m.username}</span>
                    </div>
                  </div>
                  {m.role === 'creator' && (
                    <span className="text-[9px] font-bold text-[#3B82FF] bg-[#2166FF]/20 px-2 py-0.5 rounded-full border border-[#2166FF]/30 shrink-0">
                      Lead
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
