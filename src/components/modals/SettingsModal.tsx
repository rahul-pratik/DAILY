import React, { useState } from 'react';
import { 
  X, 
  Moon, 
  Sun,
  Globe, 
  Lock, 
  Trash2, 
  UserCheck,
  LogOut,
  LogIn,
  AlertTriangle,
  UserX,
  Share2,
  Check,
  Users
} from 'lucide-react';
import { Author } from '../../types';
import { SavedAccount, StorageService } from '../../services/storageService';

interface SettingsModalProps {
  onClose: () => void;
  currentUser?: Author;
  theme?: 'dark' | 'light';
  onChangeTheme?: (theme: 'dark' | 'light') => void;
  savedAccounts?: SavedAccount[];
  onSwitchAccount?: (account: SavedAccount) => void;
  onToggleHubPrivacy?: (newPrivacy: 'public' | 'private') => void;
  onSignOut?: () => void;
  onLogIn?: () => void;
  onDeleteAccount?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  onClose,
  currentUser,
  theme = 'dark',
  onChangeTheme,
  savedAccounts = [],
  onSwitchAccount,
  onToggleHubPrivacy,
  onSignOut,
  onLogIn,
  onDeleteAccount,
}) => {
  const isPrivate = currentUser?.accountabilityHubPrivacy === 'private';
  const [deleteAccountConfirmed, setDeleteAccountConfirmed] = useState(false);
  const [crossPostToFeed, setCrossPostToFeed] = useState<boolean>(() => StorageService.getCrossPostToFeed());

  const otherAccounts = savedAccounts.filter((acc) => {
    const sameId = Boolean(currentUser?.id && acc.user.id && acc.user.id === currentUser.id);
    const sameUsername = Boolean(
      currentUser?.username &&
      acc.user.username &&
      acc.user.username.toLowerCase() === currentUser.username.toLowerCase()
    );
    return !sameId && !sameUsername;
  });

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-[#080B10] border border-[#20242C] rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 overflow-hidden max-h-[92dvh] overflow-y-auto no-scrollbar"
      >
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#20242C]">
          <h3 className="text-base font-bold text-white">Account & App Settings</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#9298A3] hover:text-white cursor-pointer"
            aria-label="Close settings"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3 mb-5">
          {/* Account Profile Card */}
          <div className="p-3.5 rounded-2xl bg-[#101010] border border-[#20242C] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#9298A3] flex items-center gap-1.5">
                <UserCheck size={14} className="text-[#3B82FF]" />
                <span>Account Profile</span>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <img
                src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'}
                alt={currentUser?.name || 'Account'}
                className="w-11 h-11 rounded-xl object-cover border border-[#2166FF]"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">{currentUser?.name || 'Daily Builder'}</p>
                <p className="text-[11px] font-mono text-[#3B82FF] truncate">@{currentUser?.username || 'builder'}</p>
              </div>
            </div>

            {/* Direct Account Switcher list when multiple accounts are logged in */}
            {otherAccounts.length > 0 && onSwitchAccount && (
              <div className="pt-2 border-t border-[#20242C]/70 space-y-1.5">
                <span className="text-[10px] font-semibold text-[#9298A3] uppercase tracking-wider flex items-center gap-1.5">
                  <Users size={11} className="text-[#3B82FF]" />
                  <span>Switch Account</span>
                </span>
                <div className="space-y-1.5">
                  {otherAccounts.map((acc) => (
                    <button
                      key={acc.user.id || acc.user.username}
                      type="button"
                      onClick={() => {
                        onSwitchAccount(acc);
                        onClose();
                      }}
                      className="w-full p-2 rounded-xl bg-[#080B10] hover:bg-[#161B26] border border-[#20242C] hover:border-[#2166FF]/50 flex items-center justify-between gap-2.5 transition-colors cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={acc.user.avatar}
                          alt={acc.user.name}
                          className="w-8 h-8 rounded-lg object-cover border border-[#20242C] shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{acc.user.name}</p>
                          <p className="text-[10px] font-mono text-[#3B82FF] truncate">@{acc.user.username}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-[#2166FF]/15 text-[#3B82FF] border border-[#2166FF]/30 shrink-0">
                        Switch
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Account Quick Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#20242C]/70">
              {onLogIn && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onLogIn();
                  }}
                  className="py-2 px-2.5 rounded-xl bg-[#161B26] hover:bg-[#202738] border border-[#242C3D] text-[11px] font-semibold text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <LogIn size={13} className="text-[#3B82FF]" />
                  <span className="truncate">{otherAccounts.length > 0 ? 'Add / Log In' : 'Switch / Log In'}</span>
                </button>
              )}

              {onSignOut && (
                <button
                  type="button"
                  onClick={() => {
                    onSignOut();
                    onClose();
                  }}
                  className="py-2 px-2.5 rounded-xl bg-[#161B26] hover:bg-amber-500/15 border border-[#242C3D] hover:border-amber-500/30 text-[11px] font-semibold text-[#9298A3] hover:text-amber-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <LogOut size={13} />
                  <span className="truncate">Log Out</span>
                </button>
              )}
            </div>
          </div>

          {/* Accountability Hub Privacy Setting */}
          <div className="p-3.5 rounded-2xl bg-[#101010] border border-[#20242C] flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isPrivate ? (
                <Lock size={18} className="text-amber-400" />
              ) : (
                <Globe size={18} className="text-[#3B82FF]" />
              )}
              <div>
                <p className="text-xs font-semibold text-white">Accountability Hub Visibility</p>
                <p className="text-[11px] text-[#9298A3]">
                  {isPrivate ? 'Private (Hidden from others)' : 'Public (Anyone can view sprints)'}
                </p>
              </div>
            </div>
            {onToggleHubPrivacy ? (
              <button
                type="button"
                onClick={() => onToggleHubPrivacy(isPrivate ? 'public' : 'private')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isPrivate
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-[#2166FF]/20 text-[#3B82FF] border border-[#2166FF]/30'
                }`}
              >
                {isPrivate ? 'Private' : 'Public'}
              </button>
            ) : (
              <span className="text-[11px] font-mono text-[#9298A3]">{isPrivate ? 'Private' : 'Public'}</span>
            )}
          </div>

          {/* Cross-Posting Preferences (Communities & Challenges to Normal Feed) */}
          <div className="p-3.5 rounded-2xl bg-[#101010] border border-[#20242C] flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0 pr-2">
              <Share2 size={18} className="text-[#3B82FF] shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white">Cross-Post to Normal Feed</p>
                <p className="text-[11px] text-[#9298A3] leading-tight mt-0.5">
                  Post items from challenges or communities as normal posts
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const nextVal = !crossPostToFeed;
                StorageService.setCrossPostToFeed(nextVal);
                setCrossPostToFeed(nextVal);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                crossPostToFeed
                  ? 'bg-[#2166FF]/20 text-[#3B82FF] border border-[#2166FF]/35 hover:bg-[#2166FF]/30'
                  : 'bg-[#181D28] text-[#9298A3] border border-[#242C3D] hover:text-white'
              }`}
            >
              {crossPostToFeed ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          {/* Appearance: Dark Theme & Light Theme toggle */}
          <div className="p-3.5 rounded-2xl bg-[#101010] border border-[#20242C] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {theme === 'light' ? (
                  <Sun size={18} className="text-[#3B82FF]" />
                ) : (
                  <Moon size={18} className="text-[#3B82FF]" />
                )}
                <div>
                  <p className="text-xs font-semibold text-white">Appearance</p>
                  <p className="text-[11px] text-[#9298A3]">
                    {theme === 'light' ? 'Light Theme active' : 'Dark Theme active'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => onChangeTheme?.('dark')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-[#2166FF] text-white border-[#2166FF] shadow-sm shadow-[#2166FF]/25'
                    : 'bg-[#080B10] text-[#9298A3] border-[#20242C] hover:text-white'
                }`}
              >
                <Moon size={13} />
                <span>Dark Theme</span>
                {theme === 'dark' && <Check size={12} />}
              </button>

              <button
                type="button"
                onClick={() => onChangeTheme?.('light')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'bg-[#2166FF] text-white border-[#2166FF] shadow-sm shadow-[#2166FF]/25'
                    : 'bg-[#080B10] text-[#9298A3] border-[#20242C] hover:text-white'
                }`}
              >
                <Sun size={13} />
                <span>Light Theme</span>
                {theme === 'light' && <Check size={12} />}
              </button>
            </div>
          </div>
        </div>

        {/* Action Controls & Account Deletion */}
        <div className="space-y-2 pt-2 border-t border-[#20242C]">
          {/* Delete Account Option */}
          {onDeleteAccount && (
            <div className="pt-1">
              {!deleteAccountConfirmed ? (
                <button
                  type="button"
                  onClick={() => setDeleteAccountConfirmed(true)}
                  className="w-full py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-xs font-semibold text-red-400 hover:text-red-300 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <UserX size={14} />
                  <span>Delete Account Permanently</span>
                </button>
              ) : (
                <div className="p-3.5 rounded-2xl bg-red-950/60 border border-red-500/50 space-y-2.5 animate-scale-in">
                  <div className="flex items-center gap-2 text-red-400 justify-center">
                    <AlertTriangle size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">Permanent Deletion</span>
                  </div>
                  <p className="text-[11px] text-red-200 text-center leading-relaxed">
                    This will permanently delete your account, posts, credits, comments, challenge and community activity, and personal data. This cannot be undone.
                  </p>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setDeleteAccountConfirmed(false)}
                      className="flex-1 py-1.5 rounded-xl bg-[#101010] text-xs font-semibold text-[#9298A3] hover:text-white border border-[#20242C] cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteAccount();
                        setDeleteAccountConfirmed(false);
                        onClose();
                      }}
                      className="flex-1 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-xs text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-red-900/30"
                    >
                      <Trash2 size={13} />
                      <span>Delete My Account</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-[#101010] hover:bg-[#1f242e] border border-[#20242C] text-xs font-semibold text-white flex items-center justify-center gap-2 transition-colors cursor-pointer mt-1"
          >
            <span>Close</span>
          </button>
        </div>
      </div>
    </div>
  );
};
