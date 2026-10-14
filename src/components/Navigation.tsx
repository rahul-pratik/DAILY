import React from 'react';
import { Home, Trophy, Plus, Users, User } from 'lucide-react';
import { ScreenType } from '../types';

interface NavigationProps {
  currentScreen: ScreenType;
  onSelectScreen: (screen: ScreenType) => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentScreen,
  onSelectScreen,
}) => {
  const isChallengesActive = 
    currentScreen === 'challenges' || 
    currentScreen === 'challenge_detail' || 
    currentScreen === 'cohort_discussions';

  const isCommunitiesActive = 
    currentScreen === 'communities' || 
    currentScreen === 'community_hub' || 
    currentScreen === 'my_joined_communities';

  const isProfileActive = currentScreen === 'profile';

  return (
    <nav className="sticky bottom-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-xl border-t border-[#20242C] px-2 pt-1 pb-[max(env(safe-area-inset-bottom),0.5rem)] w-full shrink-0">
      <div className="flex items-center justify-around h-14 sm:h-16 max-w-md mx-auto">
        {/* Home */}
        <button
          onClick={() => onSelectScreen('home')}
          className="flex flex-col items-center justify-center flex-1 h-full min-w-[48px] py-1 transition-colors group cursor-pointer focus:outline-none"
          aria-label="Home"
        >
          <Home
            size={22}
            className={`transition-colors ${
              currentScreen === 'home'
                ? 'text-[#2166FF] fill-[#2166FF]/20 stroke-[2.2]'
                : 'text-[#9298A3] group-hover:text-white'
            }`}
          />
          <span
            className={`text-[10px] font-medium tracking-tight mt-1 transition-colors ${
              currentScreen === 'home' ? 'text-[#2166FF] font-semibold' : 'text-[#9298A3]'
            }`}
          >
            Home
          </span>
        </button>

        {/* Challenges */}
        <button
          onClick={() => onSelectScreen('challenges')}
          className="flex flex-col items-center justify-center flex-1 h-full min-w-[48px] py-1 transition-colors group cursor-pointer focus:outline-none"
          aria-label="Challenges"
        >
          <Trophy
            size={22}
            className={`transition-colors ${
              isChallengesActive
                ? 'text-[#2166FF] fill-[#2166FF]/20 stroke-[2.2]'
                : 'text-[#9298A3] group-hover:text-white'
            }`}
          />
          <span
            className={`text-[10px] font-medium tracking-tight mt-1 transition-colors ${
              isChallengesActive ? 'text-[#2166FF] font-semibold' : 'text-[#9298A3]'
            }`}
          >
            Challenges
          </span>
        </button>

        {/* Create Button (Electric Blue Circle with Plus) */}
        <div className="flex items-center justify-center flex-1">
          <button
            onClick={() => onSelectScreen('create')}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#2166FF] hover:bg-[#3B82FF] active:scale-95 text-white flex items-center justify-center shadow-lg shadow-[#2166FF]/35 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2166FF]/50"
            aria-label="Create Post"
          >
            <Plus size={24} className="stroke-[2.5]" />
          </button>
        </div>

        {/* Communities */}
        <button
          onClick={() => onSelectScreen('communities')}
          className="flex flex-col items-center justify-center flex-1 h-full min-w-[48px] py-1 transition-colors group cursor-pointer focus:outline-none"
          aria-label="Communities"
        >
          <Users
            size={22}
            className={`transition-colors ${
              isCommunitiesActive
                ? 'text-[#2166FF] fill-[#2166FF]/20 stroke-[2.2]'
                : 'text-[#9298A3] group-hover:text-white'
            }`}
          />
          <span
            className={`text-[10px] font-medium tracking-tight mt-1 transition-colors ${
              isCommunitiesActive ? 'text-[#2166FF] font-semibold' : 'text-[#9298A3]'
            }`}
          >
            Communities
          </span>
        </button>

        {/* Profile */}
        <button
          onClick={() => onSelectScreen('profile')}
          className="flex flex-col items-center justify-center flex-1 h-full min-w-[48px] py-1 transition-colors group cursor-pointer focus:outline-none"
          aria-label="Profile"
        >
          <User
            size={22}
            className={`transition-colors ${
              isProfileActive
                ? 'text-[#2166FF] fill-[#2166FF]/20 stroke-[2.2]'
                : 'text-[#9298A3] group-hover:text-white'
            }`}
          />
          <span
            className={`text-[10px] font-medium tracking-tight mt-1 transition-colors ${
              isProfileActive ? 'text-[#2166FF] font-semibold' : 'text-[#9298A3]'
            }`}
          >
            Profile
          </span>
        </button>
      </div>
    </nav>
  );
};
