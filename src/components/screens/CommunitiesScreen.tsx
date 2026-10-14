import React from 'react';
import { Author, Challenge, Community } from '../../types';

interface CommunitiesScreenProps {
  communities: Community[];
  creators: Author[];
  currentUser: Author;
  onToggleJoin: (communityId: string) => void;
  onOpenCreateCommunity: () => void;
  onNavigateUser: (user: Author) => void;
  onOpenJoinedCommunities: () => void;
  onSelectCommunity: (community: Community) => void;
  onToggleFollow: (userId: string) => void;
  onRequestJoin: (communityId: string) => void;
}

export const CommunitiesScreen: React.FC<CommunitiesScreenProps> = () => (
  <div className="flex min-h-[60vh] items-center justify-center p-6 text-center text-white">
    <div>
      <h1 className="text-2xl font-bold text-[#2166FF]">Communities</h1>
      <p className="mt-2 text-[#9298A3]">Communities screen placeholder</p>
    </div>
  </div>
);
