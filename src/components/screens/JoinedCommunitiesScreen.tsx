import React from 'react';
import { Community } from '../../types';

interface JoinedCommunitiesScreenProps {
  communities: Community[];
  onBack: () => void;
  onSelectCommunity: (community: Community) => void;
  onExploreMore: () => void;
}

export const JoinedCommunitiesScreen: React.FC<JoinedCommunitiesScreenProps> = () => (
  <div className="flex min-h-[60vh] items-center justify-center p-6 text-center text-white">
    <div>
      <h1 className="text-2xl font-bold text-[#2166FF]">Joined Communities</h1>
      <p className="mt-2 text-[#9298A3]">Joined communities placeholder</p>
    </div>
  </div>
);
