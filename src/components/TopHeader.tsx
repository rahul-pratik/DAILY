import React, { useRef } from 'react';
import { Search, Settings, X, Bell } from 'lucide-react';
import { Author, ScreenType } from '../types';

interface TopHeaderProps {
  currentScreen: ScreenType;
  currentUser: Author;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  onOpenNotifications: () => void;
  onNavigateProfile: () => void;
  onLongPressProfile?: () => void;
  onOpenAccountabilityHub?: () => void;
  onCloseCreate?: () => void;
  onSubmitPost?: () => void;
  canSubmitPost?: boolean;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentScreen,
  currentUser,
  onOpenSearch,
  onOpenSettings,
  onOpenNotifications,
  onNavigateProfile,
  onLongPressProfile,
  onCloseCreate,
  onSubmitPost,
  canSubmitPost = false,
}) => {
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggeredRef = useRef(false);

  const clearLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleProfilePointerDown = () => {
    longPressTriggeredRef.current = false;
    clearLongPress();
    longPressTimerRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true;
      onLongPressProfile?.();
    }, 450);
  };

  const handleProfilePointerUpOrCancel = () => {
    clearLongPress();
  };

  const handleProfileClick = (e: React.MouseEvent) => {
    if (longPressTriggeredRef.current) {
      e.preventDefault();
      e.stopPropagation();
      longPressTriggeredRef.current = false;
      return;
    }
    onNavigateProfile();
  };

  if (currentScreen === 'create') {
    return (
      <header className="sticky top-0 z-30 bg-black/95 backdrop-blur-md border-b border-[#20242C] px-4 py-3 flex items-center justify-between">
        <button
          onClick={onCloseCreate}
          className="w-10 h-10 rounded-full flex items-center justify-center text-[#9298A3] hover:text-white hover:bg-[#101010] transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X size={22} />
        </button>

        <button
          onClick={onSubmitPost}
          disabled={!canSubmitPost}
          className={`px-5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all ${
            canSubmitPost
              ? 'bg-[#2166FF] text-white hover:bg-[#3B82FF] active:scale-95 shadow-md shadow-[#2166FF]/25 cursor-pointer'
              : 'bg-[#101010] text-[#9298A3]/50 border border-[#20242C] cursor-not-allowed'
          }`}
        >
          Post
        </button>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-30 bg-black/95 backdrop-blur-md border-b border-[#20242C]/70 px-4 py-3 flex items-center justify-between">
      {/* Brand Wordmark */}
      <div className="flex items-center gap-2">
        <span className="text-xl font-extrabold tracking-tight text-white font-sans flex items-center">
          DAILY<span className="text-[#2166FF]">.</span>
        </span>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        {currentScreen === 'profile' ? (
          <button
            onClick={onOpenSettings}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#9298A3] hover:text-white hover:bg-[#101010] transition-colors cursor-pointer"
            aria-label="Settings"
          >
            <Settings size={20} />
          </button>
        ) : (
          <>
            <button
              onClick={onOpenSearch}
              className="w-9 h-9 rounded-full flex items-center justify-center text-[#9298A3] hover:text-white hover:bg-[#101010] transition-colors cursor-pointer"
              aria-label="Search"
            >
              <Search size={19} />
            </button>

            <button
              onClick={onOpenNotifications}
              className="w-9 h-9 rounded-full flex items-center justify-center text-[#9298A3] hover:text-white hover:bg-[#101010] transition-colors relative cursor-pointer"
              aria-label="Notifications"
            >
              <Bell size={19} />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#2166FF] rounded-full" />
            </button>

            <button
              type="button"
              onClick={handleProfileClick}
              onPointerDown={handleProfilePointerDown}
              onPointerUp={handleProfilePointerUpOrCancel}
              onPointerLeave={handleProfilePointerUpOrCancel}
              onPointerCancel={handleProfilePointerUpOrCancel}
              onContextMenu={(e) => e.preventDefault()}
              className="w-8 h-8 rounded-full overflow-hidden border border-[#2166FF]/60 hover:border-[#2166FF] transition-all ml-1 cursor-pointer focus:outline-none relative group select-none"
              aria-label="Profile (Hold to switch accounts)"
              title="Tap for Profile • Hold to Switch Accounts"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-full h-full object-cover pointer-events-none"
                referrerPolicy="no-referrer"
              />
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-[#2166FF] border border-black" />
            </button>
          </>
        )}
      </div>
    </header>
  );
};
