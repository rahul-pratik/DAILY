import React from 'react';
import { X, Users, LogIn, Check, Plus } from 'lucide-react';
import { Author } from '../../types';
import { SavedAccount } from '../../services/storageService';

interface AccountSwitcherModalProps {
  isOpen: boolean;
  currentUser: Author;
  savedAccounts: SavedAccount[];
  onSwitchAccount: (account: SavedAccount) => void;
  onAddAccount: () => void;
  onClose: () => void;
}

export const AccountSwitcherModal: React.FC<AccountSwitcherModalProps> = ({
  isOpen,
  currentUser,
  savedAccounts,
  onSwitchAccount,
  onAddAccount,
  onClose,
}) => {
  if (!isOpen) return null;

  const isSameAccount = (acc: SavedAccount) =>
    Boolean(
      (currentUser?.id && acc.user.id && acc.user.id === currentUser.id) ||
      (currentUser?.username &&
        acc.user.username &&
        acc.user.username.toLowerCase() === currentUser.username.toLowerCase())
    );

  const otherAccounts = savedAccounts.filter((acc) => !isSameAccount(acc));

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-[#080B10] border border-[#20242C] rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 space-y-4"
      >
        <div className="flex items-center justify-between pb-2.5 border-b border-[#20242C]">
          <div className="flex items-center gap-2">
            <Users size={17} className="text-[#3B82FF]" />
            <h3 className="text-sm font-bold text-white">Switch Account</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#9298A3] hover:text-white cursor-pointer"
            aria-label="Close account switcher"
          >
            <X size={17} />
          </button>
        </div>

        {/* Active Account */}
        <div className="space-y-2">
          <span className="text-[10px] font-semibold text-[#9298A3] uppercase tracking-wider">
            Current Account
          </span>
          <div className="p-3 rounded-2xl bg-[#101010] border border-[#2166FF]/50 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-10 h-10 rounded-full object-cover border border-[#2166FF] shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
                <p className="text-[11px] font-mono text-[#3B82FF] truncate">@{currentUser.username}</p>
              </div>
            </div>
            <span className="w-6 h-6 rounded-full bg-[#2166FF] text-white flex items-center justify-center shrink-0">
              <Check size={13} />
            </span>
          </div>
        </div>

        {/* Other Saved Accounts or Empty Notice */}
        {otherAccounts.length > 0 ? (
          <div className="space-y-2">
            <span className="text-[10px] font-semibold text-[#9298A3] uppercase tracking-wider">
              Logged-In Accounts
            </span>
            <div className="space-y-2 max-h-56 overflow-y-auto no-scrollbar">
              {otherAccounts.map((acc) => (
                <button
                  key={acc.user.id || acc.user.username}
                  type="button"
                  onClick={() => {
                    onSwitchAccount(acc);
                    onClose();
                  }}
                  className="w-full p-3 rounded-2xl bg-[#101010] hover:bg-[#161B26] border border-[#20242C] hover:border-[#2166FF]/50 flex items-center justify-between gap-3 transition-all cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={acc.user.avatar}
                      alt={acc.user.name}
                      className="w-9 h-9 rounded-full object-cover border border-[#20242C] shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{acc.user.name}</p>
                      <p className="text-[11px] font-mono text-[#3B82FF] truncate">@{acc.user.username}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-[#2166FF]/15 text-[#3B82FF] border border-[#2166FF]/30 shrink-0">
                    Switch
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-[#101010] border border-[#20242C] text-center space-y-1.5">
            <p className="text-xs font-semibold text-white">Add another account to switch</p>
            <p className="text-[11px] text-[#9298A3]">
              Only one account is currently logged in on this device.
            </p>
          </div>
        )}

        {/* Log in / Add another account CTA */}
        <button
          type="button"
          onClick={() => {
            onClose();
            onAddAccount();
          }}
          className="w-full py-2.5 px-4 rounded-xl bg-[#2166FF] hover:bg-[#3B82FF] text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md shadow-[#2166FF]/25"
        >
          {otherAccounts.length > 0 ? <Plus size={15} /> : <LogIn size={15} />}
          <span>Add Another Account</span>
        </button>
      </div>
    </div>
  );
};
