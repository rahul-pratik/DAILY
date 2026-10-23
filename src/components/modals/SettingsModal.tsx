import React, { useState } from 'react';
import { 
  X, 
  Moon, 
  Shield, 
  Globe, 
  Lock, 
  Database, 
  Trash2, 
  RefreshCw, 
  UserCheck,
  LogOut,
  LogIn,
  AlertTriangle,
  UserX
} from 'lucide-react';
import { Author } from '../../types';
import { isSupabaseConfigured } from '../../lib/supabase';
import { StorageService } from '../../services/storageService';

interface SettingsModalProps {
  onClose: () => void;
  currentUser?: Author;
  onToggleHubPrivacy?: (newPrivacy: 'public' | 'private') => void;
  onRestartOnboarding?: () => void;
  onResetToFreshData?: () => void;
  onSignOut?: () => void;
  onLogIn?: () => void;
  onDeleteAccount?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  onClose,
  currentUser,
  onToggleHubPrivacy,
  onRestartOnboarding,
  onResetToFreshData,
  onSignOut,
  onLogIn,
  onDeleteAccount,
}) => {
  const isPrivate = currentUser?.accountabilityHubPrivacy === 'private';
  const authSession = StorageService.getAuthSession();
  const [resetConfirmed, setResetConfirmed] = useState(false);
  const [deleteAccountConfirmed, setDeleteAccountConfirmed] = useState(false);

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
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white">Account & App Settings</h3>
            <span className="text-[10px] font-mono bg-[#2166FF]/20 text-[#3B82FF] px-2 py-0.5 rounded-full border border-[#2166FF]/30">
              Live
            </span>
          </div>
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
              <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                {authSession?.provider ? `${authSession.provider.toUpperCase()} SESSION` : 'ACTIVE PROFILE'}
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
                {authSession?.email && (
                  <p className="text-[10px] text-[#9298A3] truncate">{authSession.email}</p>
                )}
              </div>
            </div>

            {/* Account Quick Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#20242C]/70">
              {onLogIn && (
                <button
                  type="button"
                  onClick={() => {
                    onLogIn();
                    onClose();
                  }}
                  className="py-2 px-2.5 rounded-xl bg-[#161B26] hover:bg-[#202738] border border-[#242C3D] text-[11px] font-semibold text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <LogIn size={13} className="text-[#3B82FF]" />
                  <span className="truncate">Switch / Log In</span>
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

          {/* Supabase Schema Status */}
          <div className="p-3.5 rounded-2xl bg-[#0b1220] border border-[#2166FF]/30 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database size={16} className="text-[#3B82FF]" />
                <span className="text-xs font-bold text-white">Supabase Schema Status</span>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                isSupabaseConfigured
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-[#2166FF]/20 text-[#3B82FF] border border-[#2166FF]/30'
              }`}>
                {isSupabaseConfigured ? 'CONNECTED' : 'READY TO CONNECT'}
              </span>
            </div>
            <p className="text-[11px] text-[#9298A3] leading-relaxed">
              Target tables configured for instant sync: <span className="font-mono text-white/90">profiles, posts, challenges, proofs, communities</span>.
            </p>
          </div>

          {/* Data Persistence */}
          <div className="p-3.5 rounded-2xl bg-[#101010] border border-[#20242C] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield size={18} className="text-[#3B82FF]" />
              <div>
                <p className="text-xs font-semibold text-white">Genuine Data Persistence</p>
                <p className="text-[11px] text-[#9298A3]">All created posts, proofs & challenges saved</p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Active
            </span>
          </div>

          {/* Appearance */}
          <div className="p-3.5 rounded-2xl bg-[#101010] border border-[#20242C] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Moon size={18} className="text-[#3B82FF]" />
              <div>
                <p className="text-xs font-semibold text-white">Appearance</p>
                <p className="text-[11px] text-[#9298A3]">Pure Black Minimal Dark Mode</p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold text-[#3B82FF] bg-[#2166FF]/10 px-2 py-0.5 rounded">
              Default
            </span>
          </div>
        </div>

        {/* Action Controls & Account Deletion */}
        <div className="space-y-2 pt-2 border-t border-[#20242C]">
          {onRestartOnboarding && (
            <button
              onClick={() => {
                onRestartOnboarding();
                onClose();
              }}
              className="w-full py-2.5 rounded-xl bg-[#2166FF]/15 hover:bg-[#2166FF]/25 border border-[#2166FF]/30 text-xs font-semibold text-[#3B82FF] hover:text-white flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <RefreshCw size={13} />
              <span>Revisit Onboarding Screen</span>
            </button>
          )}

          {/* Reset sample data */}
          {onResetToFreshData && (
            <div>
              {!resetConfirmed ? (
                <button
                  type="button"
                  onClick={() => setResetConfirmed(true)}
                  className="w-full py-2 rounded-xl bg-[#121620] hover:bg-[#1a2130] border border-[#202738] text-xs font-semibold text-[#9298A3] hover:text-white flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <RefreshCw size={13} />
                  <span>Reset Demo Content to Blank Slate</span>
                </button>
              ) : (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 space-y-2 animate-scale-in">
                  <p className="text-xs text-red-200 text-center font-medium">
                    Clear sample demo data and start fresh?
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setResetConfirmed(false)}
                      className="flex-1 py-1.5 rounded-lg bg-[#101010] text-xs text-[#9298A3] hover:text-white border border-[#20242C] cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onResetToFreshData();
                        setResetConfirmed(false);
                        onClose();
                      }}
                      className="flex-1 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-xs text-white font-bold cursor-pointer"
                    >
                      Yes, Reset
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Delete Account Option (User Request 7) */}
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
                    This will permanently delete your account, posts, daily check-in proofs, and personal data. This cannot be undone.
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
