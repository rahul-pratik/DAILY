import React from 'react';
import { Author, Post } from '../../types';

interface HomeScreenProps {
  posts: Post[];
  currentUser: Author;
  onOpenCreate: () => void;
  onToggleLike: (postId: string) => void;
  onToggleSave: (postId: string) => void;
  onOpenComments: (post: Post) => void;
  onOpenPostMenu: (post: Post) => void;
  onOpenShare: (post: Post) => void;
  onNavigateAuthorProfile: (author: Author) => void;
  onToggleFollow: (userId: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = () => (
  <div className="flex min-h-[60vh] items-center justify-center p-6 text-center text-white">
    <div>
      <h1 className="text-2xl font-bold text-[#2166FF]">Daily</h1>
      <p className="mt-2 text-[#9298A3]">Home screen placeholder</p>
    </div>
  </div>
);
