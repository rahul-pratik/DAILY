export type ScreenType = 
  | 'home' 
  | 'challenges' 
  | 'create' 
  | 'communities' 
  | 'profile' 
  | 'accountability_hub' 
  | 'cohort_discussions' 
  | 'community_hub' 
  | 'challenge_detail' 
  | 'my_joined_communities';

export type PurposeLabel = 
  | 'Insight'
  | 'Progress'
  | 'Achievement'
  | 'Opinion'
  | 'Motivation'
  | 'Question';

export interface ToDoItem {
  id: string;
  challengeId?: string;
  title: string;
  targetUnit?: string;
  scheduledDate: string; // YYYY-MM-DD
  completed: boolean;
  category: string;
  notes?: string;
}

export interface CommunityPost {
  id: string;
  communityId: string;
  communityName?: string;
  author: {
    id?: string;
    name: string;
    username: string;
    avatar?: string;
    isMod?: boolean;
  };
  title: string;
  content: string;
  category: 'Discussion' | 'Question' | 'Advice' | 'Story' | 'Milestone';
  badges?: string[];
  upvotes: number;
  credits?: number;
  userVote?: 'credit' | 'discredit' | 'up' | 'down' | null;
  timestamp: string;
  commentsCount: number;
  isPinned?: boolean;
  isDailyProof?: boolean;
  photoUrl?: string;
}

export interface CohortProof {
  id: string;
  challengeId: string;
  author: Author;
  dayNumber: number;
  note: string;
  photoUrl?: string;
  timestamp: string;
  likesCount: number;
  isLiked?: boolean;
  verified?: boolean;
}

export interface SquadChatMessage {
  id: string;
  squadId: string;
  author?: Author;
  sender?: {
    id: string;
    name: string;
    username: string;
    avatar: string;
  };
  text: string;
  timestamp: string;
}

export interface Author {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio?: string;
  isCurrentUser?: boolean;
  isFollowing?: boolean;
  followersCount?: number;
  followingCount?: number;
  bannerUrl?: string;
  accountabilityHubPrivacy?: 'public' | 'private';
}

export interface Comment {
  id: string;
  author: Author;
  text: string;
  timestamp: string;
  likes: number;
}

export interface Post {
  id: string;
  author: Author;
  timestamp: string;
  purpose?: PurposeLabel;
  content: string;
  mediaUrls?: string[];
  imageUrl?: string;
  mediaType?: 'image' | 'video' | 'code';
  likesCount: number;
  creditsCount?: number;
  commentsCount: number;
  isLiked?: boolean;
  userVote?: 'credit' | 'discredit' | null;
  isSaved?: boolean;
  comments?: Comment[];
  communityId?: string;
  communityName?: string;
  sharedPost?: Post;
  mentionedAuthor?: Author;
  isDailyProof?: boolean;
  proofDay?: number;
  challengeTitle?: string;
}

export interface SquadMember {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio?: string;
  dayReached: number;
  role?: 'creator' | 'member';
  isFollowing?: boolean;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  whatYouPerform?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  createdAt?: string;
  current: number;
  target: number;
  unit?: string;
  category: 'fitness' | 'learning' | 'building' | 'creativity' | 'habits' | 'reading';
  type?: 'squad' | 'solo';
  tags?: string[];
  icon: string;
  status: 'active' | 'completed' | 'explore';
  joined: boolean;
  durationDays?: number;
  maxSquadSize?: number;
  squadMembers?: SquadMember[];
  squadProofs?: CohortProof[];
  creator?: {
    id?: string;
    name: string;
    username: string;
    avatar?: string;
  };
  participantsCount?: number;
}

export interface JoinRequest {
  id: string;
  user: Author;
  timestamp: string;
  note?: string;
  status: 'pending' | 'approved' | 'declined';
}

export interface Community {
  id: string;
  name: string;
  description: string;
  icon: string;
  accentColor: string;
  membersCount: number;
  isJoined: boolean;
  category: string;
  isPublic?: boolean;
  tags?: string[];
  creator?: {
    name: string;
    username: string;
    avatar?: string;
  };
  coverUrl?: string;
  guidelines?: string[];
  pendingJoinRequests?: JoinRequest[];
  moderators?: {
    name: string;
    username: string;
    avatar?: string;
  }[];
}

export interface SquadEntrySession {
  challengeId: string;
  challengeTitle: string;
  initiatedBy: {
    name: string;
    username: string;
  };
  status: 'pending_acceptance' | 'entered';
  acceptedUsernames: string[];
}

export interface Squad {
  id: string;
  name: string;
  category: string;
  requiredSize: number;
  challengeId?: string;
  challengeTitle?: string;
  creator: {
    name: string;
    username: string;
    avatar?: string;
  };
  members: SquadMember[];
  entrySession?: SquadEntrySession;
}

export interface NotificationItem {
  id: string;
  user: Author;
  action: string;
  target: string;
  time: string;
  read: boolean;
  type?: 'like' | 'comment' | 'follow' | 'squad_invitation' | 'squad_entry';
  squadInvitation?: {
    squadId: string;
    squadName: string;
    challengeTitle: string;
    requiredMembers: number;
    status: 'pending' | 'accepted' | 'declined';
  };
}
