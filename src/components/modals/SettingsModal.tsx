import React, { useState } from 'react';
import { 
  X, 
  Moon, 
  Shield, 
  Bell, 
  Globe, 
  Lock, 
  Database, 
  Trash2, 
  RefreshCw, 
  Check, 
  Sparkles,
  UserCheck
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
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  onClose,
  currentUser,
  onToggleHubPrivacy,
  onRestartOnboarding,
  onResetToFreshData,
}) => {
  const isPrivate = currentUser?.accountabilityHubPrivacy === 'private';
  const authSession = StorageService.getAuthSession();
  const [resetConfirmed, setResetConfirmed] = useState(false);

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
            <h3 className="text-base font-bold text-white">App Settings</h3>
            <span className="text-[10px] font-mono bg-[#2166FF]/20 text-[#3B82FF] px-2 py-0.5 rounded-full border border-[#2166FF]/30">
              Live
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#9298A3] hover:text-white cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3 mb-5">
          {/* User Account / Session Details */}
          <div className="p-3.5 rounded-2xl bg-[#101010] border border-[#20242C] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#9298A3] flex items-center gap-1.5">
                <UserCheck size={14} className="text-[#3B82FF]" />
                <span>Account Session</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                {authSession ? `${authSession.provider.toUpperCase()} AUTH` : 'ACTIVE PROFILE'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <img
                src={currentUser?.avatar}
                alt={currentUser?.name}
                className="w-10 h-10 rounded-xl object-cover border border-[#2166FF]"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">{currentUser?.name}</p>
                <p className="text-[11px] font-mono text-[#3B82FF] truncate">@{currentUser?.username}</p>
                {authSession?.email && (
                  <p className="text-[10px] text-[#9298A3] truncate">{authSession.email}</p>
                )}
              </div>
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

          {/* Supabase Integration Ready Card */}
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

          {/* Data Protection & Persistence */}
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

        {/* Action Controls */}
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

          {onResetToFreshData && (
            <div>
              {!resetConfirmed ? (
                <button
                  type="button"
                  onClick={() => setResetConfirmed(true)}
                  className="w-full py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-xs font-semibold text-red-400 hover:text-red-300 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Trash2 size={13} />
                  <span>Reset to Blank Slate (Feed Fresh Real Data)</span>
                </button>
              ) : (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 space-y-2">
                  <p className="text-xs text-red-200 text-center font-medium">
                    Clear sample data and start completely fresh?
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setResetConfirmed(false)}
                      className="flex-1 py-1.5 rounded-lg bg-[#101010] text-xs text-[#9298A3] hover:text-white border border-[#20242C]"
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
                      className="flex-1 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-xs text-white font-bold"
                    >
                      Yes, Clear Data
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-[#101010] hover:bg-[#1f242e] border border-[#20242C] text-xs font-semibold text-white flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <span>Close Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};
