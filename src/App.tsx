/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  OTHER_USERS,
  INITIAL_POSTS,
  INITIAL_CHALLENGES,
  INITIAL_COMMUNITIES,
  INITIAL_NOTIFICATIONS,
  INITIAL_TODOS,
  INITIAL_COMMUNITY_WRITINGS,
  INITIAL_SQUADS
} from './data/initialData';
import { Author, Challenge, CohortProof, Comment, Community, CommunityPost, JoinRequest, NotificationItem, Post, PurposeLabel, ScreenType, Squad, ToDoItem } from './types';
import { TopHeader } from './components/TopHeader';
import { Navigation } from './components/Navigation';
import { HomeScreen } from './components/screens/HomeScreen';
import { ChallengesScreen } from './components/screens/ChallengesScreen';
import { CreatePostScreen } from './components/screens/CreatePostScreen';
import { CommunitiesScreen } from './components/screens/CommunitiesScreen';
import { ProfileScreen } from './components/screens/ProfileScreen';
import { AccountabilityHubScreen } from './components/screens/AccountabilityHubScreen';
import { CohortDiscussionsScreen } from './components/screens/CohortDiscussionsScreen';
import { CommunityHubScreen } from './components/screens/CommunityHubScreen';
import { ChallengeDetailScreen } from './components/screens/ChallengeDetailScreen';
import { JoinedCommunitiesScreen } from './components/screens/JoinedCommunitiesScreen';

import { CommentsModal } from './components/modals/CommentsModal';
import { ChallengeDetailModal } from './components/modals/ChallengeDetailModal';
import { EditProfileModal } from './components/modals/EditProfileModal';
import { SearchModal } from './components/modals/SearchModal';
import { NotificationsModal } from './components/modals/NotificationsModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { PostMenuModal } from './components/modals/PostMenuModal';
import { CreateChallengeModal } from './components/modals/CreateChallengeModal';
import { CreateCommunityModal } from './components/modals/CreateCommunityModal';
import { ShareModal } from './components/modals/ShareModal';
import { OnboardingAuthScreen } from './components/screens/OnboardingAuthScreen';
import { StorageService } from './services/storageService';
import { supabase, isValidUUID, getSafeUUID, toDeterministicUUID, syncProfileToSupabase, uploadMediaToSupabase } from './lib/supabase';
import { Smartphone, Monitor, Columns } from 'lucide-react';

const defaultGuestUser: Author = {
  id: 'u_builder',
  name: 'Daily Builder',
  username: 'builder',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  bio: 'Building daily consistency and verifiable discipline.',
  isCurrentUser: true,
  isFollowing: false,
  followersCount: 0,
  followingCount: 0,
  accountabilityHubPrivacy: 'public',
};

export default function App() {
  // Navigation & Screen state
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('home');
  const [previousScreen, setPreviousScreen] = useState<ScreenType>('home');
  const [cohortViewMode, setCohortViewMode] = useState<'list' | 'detail'>('list');
  const [isOnboardingDone, setIsOnboardingDone] = useState<boolean>(StorageService.isOnboardingCompleted());

  // Application Data States (persisted via StorageService or fetched from Supabase)
  const [currentUser, setCurrentUser] = useState<Author>(() => StorageService.getCurrentUser() ?? defaultGuestUser);
  const [viewingUser, setViewingUser] = useState<Author>(() => StorageService.getCurrentUser() ?? defaultGuestUser);
  const [accountabilityHubUser, setAccountabilityHubUser] = useState<Author>(() => StorageService.getCurrentUser() ?? defaultGuestUser);
  const [posts, setPosts] = useState<Post[]>(() => {
    const s = StorageService.getPosts();
    const raw = s && s.length > 0 ? s : INITIAL_POSTS;
    return raw.map((p) => {
      const extra = StorageService.getCommentsForPost(p.id);
      if (!extra || extra.length === 0) return p;
      const existingIds = new Set((p.comments || []).map((c) => c.id));
      const newComments = extra.filter((c) => !existingIds.has(c.id));
      if (newComments.length === 0) return p;
      const combined = [...(p.comments || []), ...newComments];
      return {
        ...p,
        comments: combined,
        commentsCount: Math.max(p.commentsCount, combined.length),
      };
    });
  });
  const [challenges, setChallenges] = useState<Challenge[]>(() => {
    const s = StorageService.getChallenges();
    return s && s.length > 0 ? s : INITIAL_CHALLENGES;
  });
  const [communities, setCommunities] = useState<Community[]>(() => {
    const s = StorageService.getCommunities();
    return s && s.length > 0 ? s : INITIAL_COMMUNITIES;
  });
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const s = StorageService.getNotifications();
    return s && s.length > 0 ? s : INITIAL_NOTIFICATIONS;
  });
  const [allCreators, setAllCreators] = useState<Author[]>(() => {
    const s = StorageService.getCreators();
    return s && s.length > 0 ? s : Object.values(OTHER_USERS);
  });
  const [toDoList, setToDoList] = useState<ToDoItem[]>(() => {
    const s = StorageService.getTodos();
    return s && s.length > 0 ? s : INITIAL_TODOS;
  });
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  const [activeCommunity, setActiveCommunity] = useState<Community | null>(null);
  const [squads, setSquads] = useState<Squad[]>(() => {
    const s = StorageService.getSquads();
    return s && s.length > 0 ? s : INITIAL_SQUADS;
  });
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>(() => {
    const s = StorageService.getCommunityPosts();
    return s && s.length > 0 ? s : INITIAL_COMMUNITY_WRITINGS;
  });
  const [isLoadingSupabase, setIsLoadingSupabase] = useState<boolean>(false);

  // Modal states
  const [selectedPostForComments, setSelectedPostForComments] = useState<Post | null>(null);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [selectedPostForMenu, setSelectedPostForMenu] = useState<Post | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isCreateChallengeOpen, setIsCreateChallengeOpen] = useState(false);
  const [isCreateCommunityOpen, setIsCreateCommunityOpen] = useState(false);
  const [selectedPostForShare, setSelectedPostForShare] = useState<Post | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Desktop display mode toggle: 'app' (framed mobile view) vs 'fluid' vs 'board' (5-screens showcase)
  const [displayMode, setDisplayMode] = useState<'app' | 'fluid' | 'board'>('app');

  // Sync all mutated state to StorageService for real data feeding & persistence
  React.useEffect(() => {
    StorageService.savePosts(posts);
  }, [posts]);

  React.useEffect(() => {
    StorageService.saveCurrentUser(currentUser);
  }, [currentUser]);

  React.useEffect(() => {
    StorageService.saveChallenges(challenges);
  }, [challenges]);

  React.useEffect(() => {
    StorageService.saveCommunities(communities);
  }, [communities]);

  React.useEffect(() => {
    StorageService.saveTodos(toDoList);
  }, [toDoList]);

  React.useEffect(() => {
    StorageService.saveNotifications(notifications);
  }, [notifications]);

  React.useEffect(() => {
    StorageService.saveCreators(allCreators);
  }, [allCreators]);

  React.useEffect(() => {
    StorageService.saveSquads(squads);
  }, [squads]);

  React.useEffect(() => {
    StorageService.saveCommunityPosts(communityPosts);
  }, [communityPosts]);

  // Fetch live profiles, posts, comments, likes, bookmarks, challenges, cohort proofs, communities, and todos from Supabase
  const fetchSupabaseData = async (userAuthId?: string, isSilent: boolean = false) => {
    if (!isSilent) setIsLoadingSupabase(true);
    try {
      let activeAuthId = userAuthId || (isValidUUID(currentUser?.id) ? currentUser.id : undefined);
      if (!activeAuthId) {
        const { data: sessionData } = await supabase.auth.getSession();
        activeAuthId = sessionData?.session?.user?.id;
      }

      // Parallel concurrent querying across all tables for instant loading (~200ms)
      const [
        profilesRes,
        postsRes,
        postLikesRes,
        postCommentsRes,
        challengesRes,
        cohortProofsRes,
        communitiesRes,
        squadsRes,
        squadMembersRes,
        userLikesRes,
        userBookmarksRes,
        userParticipantsRes,
        userMembershipsRes,
        userTodosRes,
        allNotifsRes,
      ] = await Promise.all([
        supabase.from('profiles').select('*').limit(150),
        supabase.from('posts').select('*').order('created_at', { ascending: false }),
        supabase.from('post_likes').select('post_id, user_id'),
        supabase.from('post_comments').select('*').order('created_at', { ascending: false }),
        supabase.from('challenges').select('*').order('created_at', { ascending: false }),
        supabase.from('cohort_proofs').select('*').order('created_at', { ascending: false }),
        supabase.from('communities').select('*').order('created_at', { ascending: false }),
        supabase.from('squads').select('*').order('created_at', { ascending: false }),
        supabase.from('squad_members').select('*'),
        activeAuthId ? supabase.from('post_likes').select('post_id').eq('user_id', activeAuthId) : Promise.resolve({ data: [] }),
        activeAuthId ? supabase.from('post_bookmarks').select('post_id').eq('user_id', activeAuthId) : Promise.resolve({ data: [] }),
        activeAuthId ? supabase.from('challenge_participants').select('challenge_id, current_progress').eq('user_id', activeAuthId) : Promise.resolve({ data: [] }),
        activeAuthId ? supabase.from('community_members').select('community_id').eq('user_id', activeAuthId) : Promise.resolve({ data: [] }),
        activeAuthId ? supabase.from('todos').select('*').eq('user_id', activeAuthId).order('created_at', { ascending: false }) : Promise.resolve({ data: [] }),
        activeAuthId
          ? supabase.from('notifications').select('*').eq('recipient_id', activeAuthId).order('created_at', { ascending: false }).limit(100)
          : Promise.resolve({ data: [] }),
      ]);

      // 1. Process profiles
      const allDbProfiles = profilesRes.data || [];
      const profileMap = new Map<string, any>();
      allDbProfiles.forEach((p: any) => profileMap.set(p.id, p));

      if (allDbProfiles.length > 0) {
        const mappedCreators: Author[] = allDbProfiles.map((p: any) => ({
          id: p.id,
          name: p.name || 'Builder',
          username: p.username || 'builder',
          avatar: p.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
          bio: p.bio || '',
          followersCount: p.followers_count || 0,
          followingCount: p.following_count || 0,
          accountabilityHubPrivacy: (p.accountability_hub_privacy as 'public' | 'private') || 'public',
          isCurrentUser: p.id === activeAuthId,
        }));
        setAllCreators(mappedCreators);
        StorageService.saveCreators(mappedCreators);
      }

      // 2. Active user profile & relations
      let remoteLikedSet = new Set<string>();
      let remoteBookmarkedSet = new Set<string>();
      const joinedChallengeIds = new Set<string>();
      const participantProgressMap = new Map<string, number>();
      const joinedCommunityIds = new Set<string>();

      if (activeAuthId) {
        const myProfile = profileMap.get(activeAuthId);
        if (myProfile) {
          const syncedUser: Author = {
            id: myProfile.id,
            name: myProfile.name || currentUser.name || 'Daily Builder',
            username: myProfile.username || currentUser.username || 'builder',
            avatar: myProfile.avatar_url || currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
            bio: myProfile.bio ?? (currentUser.bio || ''),
            followersCount: myProfile.followers_count || 0,
            followingCount: myProfile.following_count || 0,
            accountabilityHubPrivacy: (myProfile.accountability_hub_privacy as 'public' | 'private') || 'public',
            isCurrentUser: true,
          };
          setCurrentUser(syncedUser);
          setViewingUser(syncedUser);
          StorageService.saveCurrentUser(syncedUser);
        }

        remoteLikedSet = new Set(((userLikesRes.data as any[]) || []).map((r: any) => r.post_id));
        StorageService.saveUserLikes(Array.from(remoteLikedSet), activeAuthId);

        remoteBookmarkedSet = new Set(((userBookmarksRes.data as any[]) || []).map((r: any) => r.post_id));
        StorageService.saveUserBookmarks(Array.from(remoteBookmarkedSet), activeAuthId);

        ((userParticipantsRes.data as any[]) || []).forEach((row: any) => {
          joinedChallengeIds.add(row.challenge_id);
          participantProgressMap.set(row.challenge_id, row.current_progress);
        });

        ((userMembershipsRes.data as any[]) || []).forEach((row: any) => {
          joinedCommunityIds.add(row.community_id);
        });

        const dbTodos = userTodosRes.data as any[];
        if (dbTodos && dbTodos.length > 0) {
          const mappedTodos: ToDoItem[] = dbTodos.map((t: any) => ({
            id: t.id,
            challengeId: t.challenge_id || '',
            title: t.title,
            targetUnit: t.target_unit,
            scheduledDate: t.scheduled_date,
            completed: t.completed,
            category: t.category,
          }));
          setToDoList(mappedTodos);
          StorageService.saveTodos(mappedTodos);
        }
      }

      const effectiveUserId = activeAuthId || currentUser.id;
      const localLikedSet = new Set(StorageService.getUserLikes(effectiveUserId));
      const localBookmarkedSet = new Set(StorageService.getUserBookmarks(effectiveUserId));

      // 3. Process Comments grouped by post_id
      const commentsByPost = new Map<string, any[]>();
      ((postCommentsRes.data as any[]) || []).forEach((c: any) => {
        const p = profileMap.get(c.author_id);
        const arr = commentsByPost.get(c.post_id) || [];
        arr.push({
          id: c.id,
          author: {
            id: c.author_id,
            name: p?.name || 'Builder',
            username: p?.username || 'builder',
            avatar: p?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
            isCurrentUser: c.author_id === activeAuthId,
          },
          text: c.text,
          timestamp: new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          likes: c.likes_count || 0,
        });
        commentsByPost.set(c.post_id, arr);
      });

      // 4. Process Aggregate Likes
      const trueLikesCountMap = new Map<string, number>();
      ((postLikesRes.data as any[]) || []).forEach((row: any) => {
        trueLikesCountMap.set(row.post_id, (trueLikesCountMap.get(row.post_id) || 0) + 1);
      });

      // 5. Process Posts
      const dbPosts = postsRes.data || [];
      if (dbPosts.length > 0) {
        const mappedRemotePosts: Post[] = dbPosts.map((p: any) => {
          const isLiked = Boolean(
            (activeAuthId && (remoteLikedSet.has(p.id) || remoteLikedSet.has(toDeterministicUUID(p.id)))) ||
            localLikedSet.has(p.id) ||
            localLikedSet.has(toDeterministicUUID(p.id))
          );
          const isSaved = Boolean(
            (activeAuthId && (remoteBookmarkedSet.has(p.id) || remoteBookmarkedSet.has(toDeterministicUUID(p.id)))) ||
            localBookmarkedSet.has(p.id) ||
            localBookmarkedSet.has(toDeterministicUUID(p.id))
          );
          const authorProfile = profileMap.get(p.author_id);
          const totalLikes = postLikesRes.data
            ? trueLikesCountMap.get(p.id) || 0
            : Math.max(p.likes_count || 0, isLiked ? 1 : 0);

          const localExistingPost = (StorageService.getPosts() || []).find((lp) => lp.id === p.id || toDeterministicUUID(lp.id) === p.id);
          const remoteComments = commentsByPost.get(p.id) || (toDeterministicUUID(p.id) ? commentsByPost.get(toDeterministicUUID(p.id)) : undefined) || [];
          const registryComments = StorageService.getCommentsForPost(p.id).concat(
            toDeterministicUUID(p.id) ? StorageService.getCommentsForPost(toDeterministicUUID(p.id)) : []
          );

          // Seed comments registry with remote comments so they survive logout/switching
          remoteComments.forEach((rc: Comment) => {
            StorageService.addCommentToPost(p.id, rc);
          });

          const commentMap = new Map<string, Comment>();
          (localExistingPost?.comments || []).forEach((lc) => commentMap.set(lc.id, lc));
          registryComments.forEach((rc) => commentMap.set(rc.id, rc));
          remoteComments.forEach((rc: Comment) => commentMap.set(rc.id, rc));
          const postComments = Array.from(commentMap.values());

          return {
            id: p.id,
            author: {
              id: p.author_id,
              name: authorProfile?.name || 'Creator',
              username: authorProfile?.username || 'creator',
              avatar: authorProfile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
              isCurrentUser: p.author_id === activeAuthId,
            },
            content: p.content,
            purpose: p.purpose,
            timestamp: new Date(p.created_at).toLocaleDateString(),
            likesCount: totalLikes,
            commentsCount: Math.max(postComments.length, p.comments_count || 0),
            comments: postComments,
            isLiked,
            isSaved,
            communityId: p.community_id || undefined,
            mediaUrls: p.media_urls || [],
            mediaUrl: p.media_urls?.[0],
            mediaType: p.media_type === 'none' ? undefined : p.media_type,
          };
        });

        const localPosts = StorageService.getPosts() || [];
        const remoteIds = new Set(mappedRemotePosts.map((p) => p.id));
        const nonSyncedLocal = localPosts
          .filter((p) => !remoteIds.has(p.id) && !remoteIds.has(toDeterministicUUID(p.id)))
          .map((p) => {
            const reg = StorageService.getCommentsForPost(p.id);
            const existing = new Set((p.comments || []).map((c) => c.id));
            const merged = [...(p.comments || []), ...reg.filter((c) => !existing.has(c.id))];
            return {
              ...p,
              comments: merged,
              commentsCount: Math.max(p.commentsCount, merged.length),
            };
          });
        const finalMergedPosts = [...mappedRemotePosts, ...nonSyncedLocal];

        setPosts(finalMergedPosts);
        StorageService.savePosts(finalMergedPosts);

        // Keep active comments modal reference fully synchronized
        setSelectedPostForComments((prev) => {
          if (!prev) return prev;
          const match = finalMergedPosts.find((p) => p.id === prev.id || toDeterministicUUID(p.id) === prev.id || p.id === toDeterministicUUID(prev.id));
          return match
            ? { ...prev, commentsCount: match.commentsCount, comments: match.comments }
            : prev;
        });

        // Also map community discussions from db into communityPosts
        const commPostsFromDb: CommunityPost[] = dbPosts
          .filter((p: any) => p.community_id)
          .map((p: any) => {
            const authorProfile = profileMap.get(p.author_id);
            const hasSplit = p.content.includes('\n\n');
            const resolvedTitle = hasSplit ? p.content.split('\n\n')[0].slice(0, 80) : p.content.slice(0, 60);
            const resolvedContent = hasSplit ? p.content.split('\n\n').slice(1).join('\n\n') : p.content;

            return {
              id: p.id,
              communityId: p.community_id,
              author: {
                name: authorProfile?.name || 'Builder',
                username: authorProfile?.username || 'builder',
                avatar: authorProfile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
              },
              title: resolvedTitle,
              content: resolvedContent,
              category: (
                p.purpose === 'Question' ? 'Question' :
                p.purpose === 'Insight' ? 'Advice' :
                p.purpose === 'Achievement' ? 'Milestone' :
                p.purpose === 'Motivation' ? 'Story' :
                'Discussion'
              ) as CommunityPost['category'],
              upvotes: p.likes_count || 0,
              userVote: remoteLikedSet.has(p.id) ? 'up' : null,
              timestamp: new Date(p.created_at).toLocaleDateString(),
              commentsCount: p.comments_count || 0,
            };
          });

        const localCommPosts = StorageService.getCommunityPosts() || [];
        const remoteCommPostIds = new Set(commPostsFromDb.map(cp => cp.id));
        const mergedCommPosts = [...commPostsFromDb, ...localCommPosts.filter(cp => !remoteCommPostIds.has(cp.id))];
        setCommunityPosts(mergedCommPosts);
        StorageService.saveCommunityPosts(mergedCommPosts);
      }

      // 6. Process Cohort Proofs
      const proofsByChallenge = new Map<string, CohortProof[]>();
      ((cohortProofsRes.data as any[]) || []).forEach((cp: any) => {
        const p = profileMap.get(cp.author_id);
        const arr = proofsByChallenge.get(cp.challenge_id) || [];
        arr.push({
          id: cp.id,
          challengeId: cp.challenge_id,
          author: {
            id: cp.author_id,
            name: p?.name || 'Builder',
            username: p?.username || 'builder',
            avatar: p?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
            bio: p?.bio || '',
            followersCount: p?.followers_count || 0,
            followingCount: p?.following_count || 0,
            isCurrentUser: cp.author_id === activeAuthId,
          },
          dayNumber: cp.day_number || 1,
          note: cp.note,
          photoUrl: cp.photo_url,
          timestamp: new Date(cp.created_at).toLocaleDateString(),
          likesCount: cp.likes_count || 0,
          isLiked: false,
        });
        proofsByChallenge.set(cp.challenge_id, arr);
      });

      // 7. Process Challenges
      const dbChallenges = challengesRes.data || [];
      if (dbChallenges.length > 0) {
        const localChallenges = StorageService.getChallenges() || [];
        const mappedChallenges: Challenge[] = dbChallenges.map((c: any) => {
          const isJoined = joinedChallengeIds.has(c.id);
          const currentDay = participantProgressMap.get(c.id) ?? (isJoined ? 1 : 0);
          const creatorProfile = profileMap.get(c.creator_id);
          const challengeProofs = proofsByChallenge.get(c.id) || [];
          const localChallenge = localChallenges.find((challenge) => challenge.id === c.id);
          const remoteProofIds = new Set(challengeProofs.map((proof) => proof.id));
          const mergedProofs = [
            ...challengeProofs,
            ...(localChallenge?.squadProofs || []).filter((proof) => !remoteProofIds.has(proof.id)),
          ];

          return {
            id: c.id,
            title: c.title,
            description: c.description,
            whatYouPerform: c.what_you_perform,
            category: c.category,
            type: c.type,
            current: currentDay,
            target: c.target,
            unit: c.unit,
            durationDays: c.duration_days,
            maxSquadSize: c.max_squad_size,
            tags: c.tags || [],
            icon: c.icon,
            status: c.status,
            joined: isJoined,
            squadProofs: mergedProofs,
            creator: creatorProfile ? {
              name: creatorProfile.name,
              username: creatorProfile.username,
              avatar: creatorProfile.avatar_url,
            } : undefined,
          };
        });

        const remoteChIds = new Set(mappedChallenges.map((c) => c.id));
        const nonSyncedChLocal = localChallenges.filter((c) => !remoteChIds.has(c.id));
        const finalMergedChallenges = [...nonSyncedChLocal, ...mappedChallenges];

        setChallenges(finalMergedChallenges);
        StorageService.saveChallenges(finalMergedChallenges);
      }

      // 8. Process Communities
      const dbCommunities = communitiesRes.data || [];
      if (dbCommunities.length > 0) {
        const mappedCommunities: Community[] = dbCommunities.map((cm: any) => {
          const isJoined = joinedCommunityIds.has(cm.id);
          const creatorProfile = profileMap.get(cm.creator_id);

          return {
            id: cm.id,
            name: cm.name,
            description: cm.description,
            icon: cm.icon || 'code',
            accentColor: cm.accent_color || '#2166FF',
            membersCount: cm.members_count || 1,
            isJoined,
            category: cm.category,
            isPublic: cm.is_public ?? true,
            tags: cm.tags || [],
            creator: {
              id: cm.creator_id || 'creator',
              name: creatorProfile?.name || 'Community Founder',
              username: creatorProfile?.username || 'founder',
              avatar: creatorProfile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
            },
            coverUrl: cm.cover_url,
            guidelines: cm.guidelines || [],
          };
        });

        const localCommunities = StorageService.getCommunities() || [];
        const remoteCommIds = new Set(mappedCommunities.map((c) => c.id));
        const nonSyncedCommLocal = localCommunities.filter((c) => !remoteCommIds.has(c.id));
        const finalMergedCommunities = [...nonSyncedCommLocal, ...mappedCommunities];

        setCommunities(finalMergedCommunities);
        StorageService.saveCommunities(finalMergedCommunities);
      }

      // 9. Process Notifications (with sender profile resolution and instant squad invitation formatting)
      const allDbNotifs = (allNotifsRes.data as any[]) || [];
      const userNotifs = allDbNotifs.filter((n: any) => {
        if (activeAuthId && n.recipient_id === activeAuthId) return true;
        if (currentUser?.id && n.recipient_id === currentUser.id) return true;
        if (currentUser?.username) {
          const uLower = currentUser.username.toLowerCase();
          if (n.target?.toLowerCase().includes(`@${uLower}`) || n.action?.toLowerCase().includes(`@${uLower}`)) return true;
        }
        return false;
      });

      const localNotifs = StorageService.getNotifications() || [];
      const mappedNotifs: NotificationItem[] = userNotifs.map((n: any) => {
        const senderProfile = profileMap.get(n.sender_id);
        const localNotification = localNotifs.find((local) => local.id === n.id);
        const invitationDetails = n.target?.match(/^For (.+?) \((\d+)\/(\d+)/);
        return {
          id: n.id,
          user: {
            id: n.sender_id,
            name: senderProfile?.name || 'Builder',
            username: senderProfile?.username || 'builder',
            avatar: senderProfile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
            isCurrentUser: false,
          },
          action: n.action,
          target: n.target,
          time: new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          read: n.read,
          type: (n.type as any) || 'squad_invitation',
          squadInvitation: (n.squad_id || n.type === 'squad_invitation' || n.action?.includes('squad')) ? {
            squadId: n.squad_id || 'squad_live_invite',
            squadName: n.action?.includes('"') ? n.action.split('"')[1] : (n.target?.includes('"') ? n.target.split('"')[1] : 'Squad Sprint'),
            challengeTitle: localNotification?.squadInvitation?.challengeTitle || invitationDetails?.[1] || 'Squad Sprint',
            requiredMembers: localNotification?.squadInvitation?.requiredMembers || Number(invitationDetails?.[3]) || 2,
            status: localNotification?.squadInvitation?.status || 'pending',
          } : undefined,
        };
      });

      const remoteNotifIds = new Set(mappedNotifs.map((n) => n.id));
      const unsyncedLocalNotifs = localNotifs.filter((ln) => !remoteNotifIds.has(ln.id));
      const finalNotifs = [...mappedNotifs, ...unsyncedLocalNotifs];

      setNotifications(finalNotifs);
      StorageService.saveNotifications(finalNotifs);

      // 10. Process Squads & Ensure Squad Owner is ALWAYS in Squad Roster!
      const dbSquads = squadsRes.data || [];
      if (dbSquads.length > 0) {
        const dbMembers = squadMembersRes.data || [];
        const membersBySquad = new Map<string, any[]>();
        dbMembers.forEach((m: any) => {
          const arr = membersBySquad.get(m.squad_id) || [];
          arr.push(m);
          membersBySquad.set(m.squad_id, arr);
        });

        const mappedSquads: Squad[] = dbSquads.map((sq: any) => {
          const creatorProfile = profileMap.get(sq.creator_id);
          const rawMembers = membersBySquad.get(sq.id) || [];
          const squadMembersList = rawMembers.map((rm: any) => {
            const p = profileMap.get(rm.user_id);
            return {
              id: rm.user_id,
              name: p?.name || 'Builder',
              username: p?.username || 'builder',
              avatar: p?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
              dayReached: rm.day_reached || 1,
              role: rm.role || (rm.user_id === sq.creator_id ? 'creator' : 'member'),
            };
          });

          // CRITICAL: Ensure squad creator/owner is ALWAYS in the squad roster as Lead
          const hasCreator = squadMembersList.some(m =>
            m.id === sq.creator_id ||
            Boolean(creatorProfile?.username && m.username?.toLowerCase() === creatorProfile.username.toLowerCase())
          );
          const completeMembers = hasCreator ? squadMembersList : [
            {
              id: sq.creator_id,
              name: creatorProfile?.name || 'Squad Lead',
              username: creatorProfile?.username || 'leader',
              avatar: creatorProfile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
              dayReached: 1,
              role: 'creator',
            },
            ...squadMembersList
          ];

          return {
            id: sq.id,
            name: sq.name,
            category: sq.category,
            requiredSize: sq.required_size || 2,
            challengeId: sq.challenge_id,
            challengeTitle: sq.challenge_id ? (dbChallenges?.find((c: any) => c.id === sq.challenge_id)?.title || 'Squad Sprint') : undefined,
            creator: {
              name: creatorProfile?.name || 'Squad Lead',
              username: creatorProfile?.username || 'leader',
              avatar: creatorProfile?.avatar_url,
            },
            members: completeMembers,
          };
        });

        const localSquads = StorageService.getSquads() || [];
        const remoteSquadIds = new Set(mappedSquads.map((s) => s.id));
        const mergedSquads = mappedSquads;
        const extraLocalSquads = localSquads.filter((s) => !remoteSquadIds.has(s.id));
        const finalSquads = [...mergedSquads, ...extraLocalSquads];
        setSquads(finalSquads);
        StorageService.saveSquads(finalSquads);
      }
    } catch (e) {
      console.warn('Supabase parallel query notice:', e);
    } finally {
      if (!isSilent) setIsLoadingSupabase(false);
    }
  };

  // Listen for Supabase session and auth state changes
  React.useEffect(() => {
    // Immediate initial fetch for all visitors
    fetchSupabaseData();

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const u = session.user;
        const meta = u.user_metadata || {};

        // Look up profile in Supabase to load that specific account
        const { data: dbProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', u.id)
          .maybeSingle();

        const derivedName = dbProfile?.name || meta.name || meta.full_name || u.email?.split('@')[0] || 'Daily Builder';
        const derivedUsername = dbProfile?.username || meta.username || u.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9_.]/g, '') || 'builder';
        const derivedAvatar = dbProfile?.avatar_url || meta.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80';

        const authUser: Author = {
          ...currentUser,
          id: u.id,
          name: derivedName,
          username: derivedUsername,
          avatar: derivedAvatar,
          bio: dbProfile?.bio || meta.bio || '',
          followersCount: dbProfile?.followers_count || 0,
          followingCount: dbProfile?.following_count || 0,
          accountabilityHubPrivacy: (dbProfile?.accountability_hub_privacy as any) || 'public',
          isCurrentUser: true,
        };

        setCurrentUser(authUser);
        setViewingUser(authUser);
        StorageService.saveCurrentUser(authUser);
        StorageService.setAuthSession({
          provider: (u.app_metadata?.provider as any) || 'email',
          email: u.email,
        });

        // If user already has an account, immediately load main app
        const hasExistingAccount = Boolean(dbProfile?.username || meta.onboarding_completed || StorageService.isOnboardingCompleted());
        if (hasExistingAccount) {
          StorageService.setOnboardingCompleted(true);
          setIsOnboardingDone(true);
          fetchSupabaseData(u.id);
        } else {
          StorageService.setOnboardingCompleted(false);
          setIsOnboardingDone(false);
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user) {
        const u = session.user;
        const meta = u.user_metadata || {};

        const { data: dbProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', u.id)
          .maybeSingle();

        const derivedName = dbProfile?.name || meta.name || meta.full_name || u.email?.split('@')[0] || 'Daily Builder';
        const derivedUsername = dbProfile?.username || meta.username || u.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9_.]/g, '') || 'builder';
        const derivedAvatar = dbProfile?.avatar_url || meta.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80';

        const authUser: Author = {
          ...currentUser,
          id: u.id,
          name: derivedName,
          username: derivedUsername,
          avatar: derivedAvatar,
          bio: dbProfile?.bio || meta.bio || '',
          followersCount: dbProfile?.followers_count || 0,
          followingCount: dbProfile?.following_count || 0,
          accountabilityHubPrivacy: (dbProfile?.accountability_hub_privacy as any) || 'public',
          isCurrentUser: true,
        };

        setCurrentUser(authUser);
        setViewingUser(authUser);
        StorageService.saveCurrentUser(authUser);
        StorageService.setAuthSession({
          provider: (u.app_metadata?.provider as any) || 'email',
          email: u.email,
        });

        const hasExistingAccount = Boolean(dbProfile?.username || meta.onboarding_completed || StorageService.isOnboardingCompleted());
        if (hasExistingAccount) {
          StorageService.setOnboardingCompleted(true);
          setIsOnboardingDone(true);
          fetchSupabaseData(u.id);
        }
      } else if (event === 'SIGNED_OUT') {
        StorageService.setOnboardingCompleted(false);
        setIsOnboardingDone(false);
      }
    });

    // Window focus and visibility listener: immediately re-fetch fresh data when switching between tabs/windows
    const handleRefreshOnFocusOrVisibility = () => {
      if (!document.hidden) {
        fetchSupabaseData();
      }
    };
    window.addEventListener('focus', handleRefreshOnFocusOrVisibility);
    document.addEventListener('visibilitychange', handleRefreshOnFocusOrVisibility);

    const refreshNotifications = async () => {
      try {
        const userId = await getActiveAuthUserId();
        if (!userId) return;
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('recipient_id', userId)
          .order('created_at', { ascending: false })
          .limit(100);
        if (error) {
          console.error('Supabase notification refresh failed:', error.message);
          return;
        }

        const localNotifications = StorageService.getNotifications() || [];
        const creators = StorageService.getCreators() || allCreators;
        const mapped: NotificationItem[] = ((data || []) as any[]).map((row) => {
          const sender = creators.find((creator) => creator.id === row.sender_id);
          const local = localNotifications.find((notification) => notification.id === row.id);
          const action = row.action || 'sent you a notification';
          const target = row.target || '';
          const invitationDetails = target.match(/^For (.+?) \((\d+)\/(\d+)/);
          const isSquadInvitation = row.type === 'squad_invitation' || Boolean(row.squad_id) || action.toLowerCase().includes('squad');
          return {
            id: row.id,
            user: {
              id: row.sender_id || '',
              name: sender?.name || 'Builder',
              username: sender?.username || 'builder',
              avatar: sender?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
            },
            action,
            target,
            time: new Date(row.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            read: Boolean(row.read),
            type: row.type || 'squad_invitation',
            squadInvitation: isSquadInvitation ? {
              squadId: row.squad_id || '',
              squadName: action.match(/"([^"]+)"/)?.[1] || 'Squad Sprint',
              challengeTitle: local?.squadInvitation?.challengeTitle || invitationDetails?.[1] || 'Squad Sprint',
              requiredMembers: local?.squadInvitation?.requiredMembers || Number(invitationDetails?.[3]) || 2,
              status: local?.squadInvitation?.status || 'pending',
            } : undefined,
          };
        });
        const remoteIds = new Set(mapped.map((notification) => notification.id));
        const merged = [...mapped, ...localNotifications.filter((notification) => !remoteIds.has(notification.id))];
        setNotifications((previous) => {
          const unchanged = previous.length === merged.length && previous.every((notification, index) => {
            const next = merged[index];
            return notification.id === next.id &&
              notification.read === next.read &&
              notification.action === next.action &&
              notification.squadInvitation?.status === next.squadInvitation?.status;
          });
          return unchanged ? previous : merged;
        });
      } catch (error) {
        console.error('Supabase notification refresh failed:', error);
      }
    };
    void refreshNotifications();
    const notificationSyncInterval = setInterval(() => {
      if (!document.hidden) void refreshNotifications();
    }, 2000);

    // Keep a slower safety refresh; realtime handles interaction updates immediately.
    const liveSyncInterval = setInterval(() => {
      if (!document.hidden) {
        fetchSupabaseData(undefined, true);
      }
    }, 10000);

    // Supabase Realtime channel for live likes, posts, challenges, squads, notifications across all accounts
    const realtimeChannel = supabase
      .channel('daily_realtime_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
        fetchSupabaseData(undefined, true);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_likes' }, (payload: any) => {
        const row = payload.eventType === 'DELETE' ? payload.old : payload.new;
        const postId = row?.post_id;
        if (!postId) return;
        const actingUserId = row.user_id;
        const currentUserId = StorageService.getCurrentUser()?.id;
        const ownOptimisticUpdate = actingUserId && actingUserId === currentUserId;
        if (payload.eventType === 'INSERT' && !ownOptimisticUpdate) {
          setPosts(prev => prev.map(p => (p.id === postId || toDeterministicUUID(p.id) === postId) ? { ...p, likesCount: p.likesCount + 1 } : p));
        } else if (payload.eventType === 'DELETE' && !ownOptimisticUpdate) {
          setPosts(prev => prev.map(p => (p.id === postId || toDeterministicUUID(p.id) === postId) ? { ...p, likesCount: Math.max(0, p.likesCount - 1) } : p));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_comments' }, () => {
        fetchSupabaseData(undefined, true);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_bookmarks' }, () => {
        fetchSupabaseData(undefined, true);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'challenges' }, () => {
        fetchSupabaseData(undefined, true);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'challenge_participants' }, () => {
        fetchSupabaseData(undefined, true);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cohort_proofs' }, () => {
        fetchSupabaseData(undefined, true);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, async (payload: any) => {
        const row = payload.eventType === 'DELETE' ? payload.old : payload.new;
        const currentUserId = StorageService.getCurrentUser()?.id;
        if (!row?.id || !currentUserId || row.recipient_id !== currentUserId) return;

        if (payload.eventType === 'DELETE') {
          setNotifications((prev) => prev.filter((notification) => notification.id !== row.id));
          return;
        }

        if (payload.eventType === 'UPDATE') {
          setNotifications((prev) => prev.map((notification) =>
            notification.id === row.id ? { ...notification, read: Boolean(row.read) } : notification
          ));
          return;
        }

        const { data: senderProfile } = row.sender_id
          ? await supabase.from('profiles').select('id, name, username, avatar_url').eq('id', row.sender_id).maybeSingle()
          : { data: null };
        const sender = allCreators.find((creator) => creator.id === row.sender_id);
        const action = row.action || 'sent you a notification';
        const squadName = action.match(/"([^"]+)"/)?.[1] || 'Squad Sprint';
        const target = row.target || '';
        const requiredMembers = Number(target.match(/\/(\d+)/)?.[1]) || 2;
        const isSquadInvitation = row.type === 'squad_invitation' || Boolean(row.squad_id) || action.toLowerCase().includes('squad');
        const notification: NotificationItem = {
          id: row.id,
          user: {
            id: row.sender_id || '',
            name: senderProfile?.name || sender?.name || 'Builder',
            username: senderProfile?.username || sender?.username || 'builder',
            avatar: senderProfile?.avatar_url || sender?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
          },
          action,
          target,
          time: new Date(row.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          read: Boolean(row.read),
          type: row.type || 'squad_invitation',
          squadInvitation: isSquadInvitation ? {
            squadId: row.squad_id || '',
            squadName,
            challengeTitle: target.match(/^For (.+?) \(/)?.[1] || 'Squad Sprint',
            requiredMembers,
            status: 'pending',
          } : undefined,
        };
        setNotifications((prev) => [notification, ...prev.filter((existing) => existing.id !== notification.id)]);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'squads' }, () => {
        fetchSupabaseData(undefined, true);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'squad_members' }, () => {
        fetchSupabaseData(undefined, true);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'communities' }, () => {
        fetchSupabaseData(undefined, true);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_members' }, () => {
        fetchSupabaseData(undefined, true);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'todos' }, () => {
        fetchSupabaseData(undefined, true);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('focus', handleRefreshOnFocusOrVisibility);
      document.removeEventListener('visibilitychange', handleRefreshOnFocusOrVisibility);
      clearInterval(liveSyncInterval);
      clearInterval(notificationSyncInterval);
      supabase.removeChannel(realtimeChannel);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      // ignore
    }
    StorageService.setOnboardingCompleted(false);
    StorageService.setAuthSession({ provider: 'guest' });
    setIsOnboardingDone(false);
    showToast('Signed out of account session');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 2800);
  };

  const getActiveAuthUserId = async (): Promise<string | undefined> => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    const userId = data.session?.user?.id;
    return isValidUUID(userId) ? userId : undefined;
  };

  const reportCloudSyncError = (action: string, error: { message: string } | null) => {
    if (!error) return;
    console.error(`Supabase ${action} failed:`, error.message);
    showToast(`${action} saved on this device, but cloud sync failed.`);
  };

  // Screen selection
  const handleSelectScreen = (screen: ScreenType) => {
    if (screen === 'create') {
      setPreviousScreen(currentScreen);
    }
    if (screen === 'profile') {
      // Direct click on Profile tab opens current user's profile
      setViewingUser(currentUser);
    }
    setCurrentScreen(screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCloseCreate = () => {
    setCurrentScreen(previousScreen === 'create' ? 'home' : previousScreen);
  };

  // Navigate to any user's profile
  const handleNavigateToUser = (target: { name: string; username: string; avatar?: string; id?: string }) => {
    if (target.username === currentUser.username || target.id === currentUser.id) {
      setViewingUser(currentUser);
      setCurrentScreen('profile');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Look up in known users
    const matched = OTHER_USERS[target.username] || allCreators.find(c => c.username === target.username);
    if (matched) {
      setViewingUser(matched);
    } else {
      setViewingUser({
        id: target.id || `u_${target.username}`,
        name: target.name,
        username: target.username,
        avatar: target.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        bio: `Member and builder on Daily.`,
        isCurrentUser: false,
        isFollowing: false,
        followersCount: 0,
        followingCount: 0,
      });

      // Also query Supabase profiles to ensure live details (avatar, bio, followers) are loaded
      if (target.username) {
        supabase
          .from('profiles')
          .select('*')
          .eq('username', target.username)
          .maybeSingle()
          .then(({ data }) => {
            if (data) {
              setViewingUser({
                id: data.id,
                name: data.name,
                username: data.username,
                avatar: data.avatar_url || target.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
                bio: data.bio || 'Member and builder on Daily.',
                isCurrentUser: false,
                isFollowing: false,
                followersCount: data.followers_count || 0,
                followingCount: data.following_count || 0,
                accountabilityHubPrivacy: data.accountability_hub_privacy || 'public',
              });
            }
          });
      }
    }

    setPreviousScreen(currentScreen);
    setCurrentScreen('profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Toggle follow user
  const handleToggleFollow = (userIdOrUsername: string) => {
    let targetUsername = '';
    let nowFollowing = false;

    setAllCreators((prev) =>
      prev.map((c) => {
        if (c.id === userIdOrUsername || c.username === userIdOrUsername) {
          nowFollowing = !c.isFollowing;
          targetUsername = c.username;
          return {
            ...c,
            isFollowing: nowFollowing,
            followersCount: nowFollowing ? (c.followersCount || 0) + 1 : Math.max(0, (c.followersCount || 1) - 1),
          };
        }
        return c;
      })
    );

    setViewingUser((prev) => {
      if (prev.id === userIdOrUsername || prev.username === userIdOrUsername) {
        const isFollowing = !prev.isFollowing;
        nowFollowing = isFollowing;
        targetUsername = prev.username;
        return {
          ...prev,
          isFollowing,
          followersCount: isFollowing ? (prev.followersCount || 0) + 1 : Math.max(0, (prev.followersCount || 1) - 1),
        };
      }
      return prev;
    });

    // Update posts authored by this user
    setPosts((prev) =>
      prev.map((post) => {
        if (post.author.id === userIdOrUsername || post.author.username === userIdOrUsername) {
          return {
            ...post,
            author: {
              ...post.author,
              isFollowing: nowFollowing,
            },
          };
        }
        return post;
      })
    );

    // Update current user following count
    setCurrentUser((prev) => ({
      ...prev,
      followingCount: nowFollowing
        ? (prev.followingCount || 0) + 1
        : Math.max(0, (prev.followingCount || 1) - 1),
    }));

    showToast(nowFollowing ? `Now following @${targetUsername || userIdOrUsername}` : `Unfollowed @${targetUsername || userIdOrUsername}`);
  };

  // Interactions: Like Post
  const handleToggleLike = async (postId: string) => {
    let nextIsLiked = false;
    let nextLikesCount = 0;

    setPosts((prev) => {
      const updated = prev.map((post) => {
        if (post.id === postId) {
          nextIsLiked = !post.isLiked;
          nextLikesCount = nextIsLiked ? post.likesCount + 1 : Math.max(0, post.likesCount - 1);
          return {
            ...post,
            isLiked: nextIsLiked,
            likesCount: nextLikesCount,
          };
        }
        return post;
      });
      StorageService.savePosts(updated);
      return updated;
    });

    // Persist user likes locally (namespaced by user id)
    const activeUid = currentUser?.id;
    const userLikes = StorageService.getUserLikes(activeUid);
    const updatedLikes = nextIsLiked
      ? Array.from(new Set([...userLikes, postId]))
      : userLikes.filter((id) => id !== postId);
    StorageService.saveUserLikes(updatedLikes, activeUid);

    // Sync with Supabase database
    try {
      const activeUserId = await getActiveAuthUserId();
      const safePostId = toDeterministicUUID(postId);
      const safeUserId = activeUserId;

      if (safeUserId && isValidUUID(safePostId)) {
        await syncProfileToSupabase({ ...currentUser, id: safeUserId });

        const targetPost = posts.find((p) => p.id === postId);
        if (targetPost) {
          const postAuthorId = isValidUUID(targetPost.author.id) ? targetPost.author.id : safeUserId;
          const { error: postError } = await supabase.from('posts').upsert({
            id: safePostId,
            author_id: postAuthorId,
            content: targetPost.content,
            purpose: targetPost.purpose || 'Progress',
            comments_count: targetPost.commentsCount || 0,
          }, { onConflict: 'id', ignoreDuplicates: true });
          if (postError) {
            reportCloudSyncError('like', postError);
            return;
          }
        }

        if (nextIsLiked) {
          const { error } = await supabase.from('post_likes').upsert({
            post_id: safePostId,
            user_id: safeUserId,
          });
          reportCloudSyncError('like', error);
        } else {
          const { error } = await supabase.from('post_likes').delete().match({
            post_id: safePostId,
            user_id: safeUserId,
          });
          reportCloudSyncError('unlike', error);
        }
      }
    } catch (e) {
      console.error('Supabase like sync failed:', e);
      showToast('Like saved on this device, but cloud sync failed.');
    }
  };

  // Interactions: Save Post
  const handleToggleSave = async (postId: string) => {
    let nextIsSaved = false;

    setPosts((prev) => {
      const updated = prev.map((post) => {
        if (post.id === postId) {
          nextIsSaved = !post.isSaved;
          return {
            ...post,
            isSaved: nextIsSaved,
          };
        }
        return post;
      });
      StorageService.savePosts(updated);
      return updated;
    });

    // Persist user bookmarks locally (namespaced by user id)
    const activeUid = currentUser?.id;
    const userBookmarks = StorageService.getUserBookmarks(activeUid);
    const updatedBookmarks = nextIsSaved
      ? Array.from(new Set([...userBookmarks, postId]))
      : userBookmarks.filter((id) => id !== postId);
    StorageService.saveUserBookmarks(updatedBookmarks, activeUid);

    showToast(nextIsSaved ? 'Post saved to your profile' : 'Post removed from saved');

    // Sync with Supabase database
    try {
      const activeUserId = await getActiveAuthUserId();

      const safePostId = toDeterministicUUID(postId);
      const safeUserId = (isValidUUID(activeUserId) ? activeUserId : undefined) || (isValidUUID(currentUser.id) ? currentUser.id : toDeterministicUUID(currentUser.id));

      if (safeUserId && safePostId) {
        await syncProfileToSupabase({ ...currentUser, id: safeUserId });

        if (nextIsSaved) {
          await supabase.from('post_bookmarks').upsert({
            post_id: safePostId,
            user_id: safeUserId,
          });
        } else {
          await supabase.from('post_bookmarks').delete().match({
            post_id: safePostId,
            user_id: safeUserId,
          });
        }
      }
    } catch (e) {
      console.warn('Supabase bookmark sync notice:', e);
    }
  };

  // Interactions: Add Comment
  const handleAddComment = async (postId: string, text: string) => {
    const commentId = getSafeUUID();
    const newComment = {
      id: commentId,
      author: currentUser,
      text,
      timestamp: 'Just now',
      likes: 0,
    };

    // Save immediately to persistent comments registry
    StorageService.addCommentToPost(postId, newComment);
    const safeUuidPost = toDeterministicUUID(postId);
    if (safeUuidPost && safeUuidPost !== postId) {
      StorageService.addCommentToPost(safeUuidPost, newComment);
    }

    const isMatch = (id?: string) => id === postId || toDeterministicUUID(id || '') === postId || id === toDeterministicUUID(postId);

    const sourcePost = posts.find((post) => isMatch(post.id)) ||
      (selectedPostForComments && isMatch(selectedPostForComments.id) ? selectedPostForComments : undefined);
    const commPost = communityPosts.find((post) => isMatch(post.id));
    let foundInPosts = false;
    setPosts((prev) => {
      const updated = prev.map((post) => {
        if (isMatch(post.id)) {
          foundInPosts = true;
          const updatedComments = [newComment, ...(post.comments || [])];
          return {
            ...post,
            commentsCount: (post.commentsCount || 0) + 1,
            comments: updatedComments,
          };
        }
        return post;
      });

      // If this post came from community discussions and wasn't in general feed yet
      if (!foundInPosts) {
        const syntheticPost: Post = {
          id: postId,
          author: sourcePost?.author || (commPost ? {
            ...currentUser,
            name: commPost.author.name,
            username: commPost.author.username,
            avatar: commPost.author.avatar || currentUser.avatar,
          } : currentUser),
          timestamp: sourcePost?.timestamp || 'Just now',
          purpose: 'Insight',
          content: sourcePost?.content || (commPost ? `${commPost.title}\n\n${commPost.content}` : text),
          likesCount: sourcePost?.likesCount ?? commPost?.upvotes ?? 0,
          commentsCount: 1,
          comments: [newComment],
          isLiked: false,
          isSaved: false,
          communityId: sourcePost?.communityId || commPost?.communityId,
          communityName: sourcePost?.communityName || commPost?.communityName,
        };
        const nextList = [syntheticPost, ...prev];
        StorageService.savePosts(nextList);
        return nextList;
      }

      StorageService.savePosts(updated);
      return updated;
    });

    // Also update in communityPosts
    setCommunityPosts((prev) => {
      const updated = prev.map((cp) => {
        if (isMatch(cp.id)) {
          return {
            ...cp,
            commentsCount: (cp.commentsCount || 0) + 1,
          };
        }
        return cp;
      });
      if (!updated.some((post) => isMatch(post.id)) && sourcePost?.communityId) {
        const [title, ...contentParts] = sourcePost.content.split('\n\n');
        updated.unshift({
          id: postId,
          communityId: sourcePost.communityId,
          communityName: sourcePost.communityName,
          author: {
            name: sourcePost.author.name,
            username: sourcePost.author.username,
            avatar: sourcePost.author.avatar,
          },
          title: title || 'Community Discussion',
          content: contentParts.join('\n\n'),
          category: 'Discussion',
          upvotes: sourcePost.likesCount || 0,
          userVote: null,
          timestamp: sourcePost.timestamp,
          commentsCount: 1,
        });
      }
      StorageService.saveCommunityPosts(updated);
      return updated;
    });

    // Update active modal reference
    setSelectedPostForComments((prev) =>
      prev && isMatch(prev.id)
        ? {
            ...prev,
            commentsCount: (prev.commentsCount || 0) + 1,
            comments: [newComment, ...(prev.comments || [])],
          }
        : prev
    );

    showToast('Comment posted');

    // Persist comment to Supabase post_comments
    try {
      const activeUserId = await getActiveAuthUserId();
      const safePostId = toDeterministicUUID(postId);
      const safeAuthorId = activeUserId;

      if (safeAuthorId && isValidUUID(safePostId)) {
        await syncProfileToSupabase({ ...currentUser, id: safeAuthorId });

        // Ensure post exists in public.posts
        const targetPost = posts.find((p) => isMatch(p.id)) || sourcePost;
        const postAuthorId = targetPost?.author.id && isValidUUID(targetPost.author.id)
          ? targetPost.author.id
          : safeAuthorId;
        const safeCommunityId = targetPost?.communityId
          ? toDeterministicUUID(targetPost.communityId)
          : undefined;
        if (safeCommunityId && isValidUUID(safeCommunityId)) {
          const targetCommunity = communities.find((community) => community.id === targetPost?.communityId);
          const { error: communityError } = await supabase.from('communities').upsert({
            id: safeCommunityId,
            name: targetCommunity?.name || targetPost?.communityName || 'Community',
            description: targetCommunity?.description || '',
            category: targetCommunity?.category || 'General',
            icon: targetCommunity?.icon || 'code',
            accent_color: targetCommunity?.accentColor || '#2166FF',
            is_public: targetCommunity?.isPublic ?? true,
            tags: targetCommunity?.tags || [],
            members_count: targetCommunity?.membersCount || 1,
            creator_id: safeAuthorId,
          }, { onConflict: 'id', ignoreDuplicates: true });
          if (communityError) {
            reportCloudSyncError('comment', communityError);
            return;
          }
        }
        const { error: postError } = await supabase.from('posts').upsert({
          id: safePostId,
          author_id: postAuthorId,
          content: targetPost?.content || text,
          purpose: targetPost?.purpose || 'Progress',
          community_id: safeCommunityId || null,
          likes_count: targetPost?.likesCount || 0,
          comments_count: (targetPost?.commentsCount || 0) + 1,
        }, { onConflict: 'id', ignoreDuplicates: true });
        if (postError) {
          reportCloudSyncError('comment', postError);
          return;
        }

        const { error: commentErr } = await supabase.from('post_comments').insert({
          id: commentId,
          post_id: safePostId,
          author_id: safeAuthorId,
          text,
          likes_count: 0,
        });

        if (commentErr) {
          reportCloudSyncError('comment', commentErr);
        } else {
          const { error: countError } = await supabase.from('posts').update({
            comments_count: (targetPost?.commentsCount || 0) + 1,
          }).eq('id', safePostId);
          reportCloudSyncError('comment count update', countError);
        }
      }
    } catch (e) {
      console.error('Supabase comment save failed:', e);
      showToast('Comment saved on this device, but cloud sync failed.');
    }
  };

  // Interactions: Create Post
  const handleCreatePost = async (data: {
    content: string;
    purpose?: PurposeLabel;
    mediaUrls?: string[];
    audience?: string;
    isDailyProof?: boolean;
  }) => {
    const postId = getSafeUUID();

    // If media items are base64, try uploading to Supabase Storage 'posts' bucket
    const rawMedia = data.mediaUrls || [];
    let processedMedia = rawMedia;
    try {
      if (rawMedia.some((m) => m.startsWith('data:'))) {
        processedMedia = await Promise.all(
          rawMedia.map((m, idx) =>
            m.startsWith('data:')
              ? uploadMediaToSupabase('posts', m, `post_${postId}_${idx}`)
              : Promise.resolve(m)
          )
        );
      }
    } catch {
      processedMedia = rawMedia;
    }

    const newPost: Post = {
      id: postId,
      author: currentUser,
      timestamp: 'Just now',
      purpose: data.purpose,
      content: data.content,
      mediaUrls: processedMedia,
      isDailyProof: data.isDailyProof,
      likesCount: 0,
      commentsCount: 0,
      isLiked: false,
      isSaved: false,
    };

    const updatedPosts = [newPost, ...posts];
    setPosts(updatedPosts);
    StorageService.savePosts(updatedPosts);
    setCurrentScreen('home');
    showToast('Your work has been shared to Daily');

    // Persist post and author profile to Supabase
    try {
      let activeAuthorId: string | undefined = currentUser?.id;
      if (!isValidUUID(activeAuthorId)) {
        const { data: sessionData } = await supabase.auth.getSession();
        activeAuthorId = sessionData?.session?.user?.id;
      }

      if (isValidUUID(activeAuthorId)) {
        // Ensure author profile is synced
        await syncProfileToSupabase({ ...currentUser, id: activeAuthorId! });

        // Insert post into public.posts
        const { error: insertErr } = await supabase.from('posts').insert({
          id: postId,
          author_id: activeAuthorId,
          content: data.content,
          purpose: data.purpose || 'Progress',
          media_urls: processedMedia,
          media_type: processedMedia.length > 0 ? 'image' : 'none',
          likes_count: 0,
          comments_count: 0,
        });

        if (insertErr) {
          console.warn('Supabase post insert notice:', insertErr.message);
        }
      }
    } catch (e) {
      console.warn('Supabase post insert exception:', e);
    }
  };

  // Interactions: Share Post to Community as a post
  const handleSharePostToCommunity = async ({
    originalPost,
    targetCommunity,
    caption,
    mentionRealUser,
  }: {
    originalPost: Post;
    targetCommunity: Community;
    caption: string;
    mentionRealUser: boolean;
  }) => {
    const mentionText = `@${originalPost.author.username}`;
    const trimmedCaption = caption.trim();
    let contentWithAttribution = trimmedCaption;

    if (mentionRealUser && !trimmedCaption.includes(mentionText)) {
      contentWithAttribution = trimmedCaption
        ? `${trimmedCaption}\n\nShared post from ${mentionText}`
        : `Shared post from ${mentionText}`;
    } else if (!trimmedCaption) {
      contentWithAttribution = `Shared post from ${mentionText}`;
    }
    contentWithAttribution = `${contentWithAttribution}\n\n${originalPost.content}`;

    const sharedPostId = getSafeUUID();
    const mediaList = originalPost.mediaUrls || (originalPost.imageUrl ? [originalPost.imageUrl] : []);

    const newPost: Post = {
      id: sharedPostId,
      author: currentUser,
      timestamp: 'Just now',
      purpose: originalPost.purpose || 'Progress',
      content: contentWithAttribution,
      communityId: targetCommunity.id,
      communityName: targetCommunity.name,
      sharedPost: originalPost,
      mentionedAuthor: originalPost.author,
      likesCount: 0,
      commentsCount: 0,
      isLiked: false,
      isSaved: false,
      comments: [],
      imageUrl: originalPost.imageUrl || mediaList[0],
      mediaUrls: mediaList,
    };

    const nextPosts = [newPost, ...posts];
    setPosts(nextPosts);
    StorageService.savePosts(nextPosts);

    // Also mirror to community discussions
    const newCommPost: CommunityPost = {
      id: sharedPostId,
      communityId: targetCommunity.id,
      communityName: targetCommunity.name,
      author: {
        name: currentUser.name,
        username: currentUser.username,
        avatar: currentUser.avatar,
      },
      title: contentWithAttribution.slice(0, 60),
      content: contentWithAttribution,
      category: 'Discussion',
      upvotes: 0,
      userVote: null,
      timestamp: 'Just now',
      commentsCount: 0,
    };

    setCommunityPosts((prev) => [newCommPost, ...prev.filter((item) => item.id !== sharedPostId)]);

    showToast(`Shared to ${targetCommunity.name} as a post!`);
    setSelectedPostForShare(null);

    // Persist shared post to Supabase
    try {
      const safeAuthorId = await getActiveAuthUserId();
      const safeCommunityId = toDeterministicUUID(targetCommunity.id);

      if (safeAuthorId && isValidUUID(safeCommunityId)) {
        await syncProfileToSupabase({ ...currentUser, id: safeAuthorId });

        const { error: communityError } = await supabase.from('communities').upsert({
          id: safeCommunityId,
          name: targetCommunity.name,
          description: targetCommunity.description || '',
          category: targetCommunity.category || 'General',
          icon: targetCommunity.icon || 'code',
          accent_color: targetCommunity.accentColor || '#2166FF',
          is_public: targetCommunity.isPublic ?? true,
          tags: targetCommunity.tags || [],
          cover_url: targetCommunity.coverUrl || null,
          members_count: targetCommunity.membersCount || 1,
          creator_id: safeAuthorId,
        }, { onConflict: 'id', ignoreDuplicates: true });
        if (communityError) {
          reportCloudSyncError('community share', communityError);
          return;
        }

        const { error: postError } = await supabase.from('posts').insert({
          id: sharedPostId,
          author_id: safeAuthorId,
          community_id: safeCommunityId,
          content: contentWithAttribution,
          purpose: originalPost.purpose || 'Progress',
          media_urls: mediaList,
          media_type: mediaList.length > 0 ? 'image' : 'none',
          likes_count: 0,
          comments_count: 0,
        });
        reportCloudSyncError('community share', postError);
      }
    } catch (e) {
      console.error('Supabase community share save failed:', e);
      showToast('Share saved on this device, but cloud sync failed.');
    }
  };

  // Interactions: Create Community Discussion / Question / Advice / Story
  const handleCreateCommunityDiscussion = async (post: Partial<CommunityPost>) => {
    const discId = post.id || getSafeUUID();
    const category = post.category || 'Discussion';
    const targetCommId = post.communityId || activeCommunity?.id || communities[0]?.id;
    const targetComm = communities.find(c => c.id === targetCommId) || activeCommunity || communities[0];
    if (!targetCommId || !targetComm) {
      showToast('Choose a community before posting.');
      return;
    }

    const newCommPost: CommunityPost = {
      id: discId,
      communityId: targetCommId,
      communityName: targetComm?.name,
      author: {
        name: currentUser.name,
        username: currentUser.username,
        avatar: currentUser.avatar,
      },
      title: post.title || post.content?.slice(0, 60) || 'Community Discussion',
      content: post.content || '',
      category,
      upvotes: 1,
      userVote: 'up',
      timestamp: 'Just now',
      commentsCount: 0,
    };

    setCommunityPosts((prev) => [newCommPost, ...prev.filter((item) => item.id !== discId)]);

    // Also mirror to general posts feed with community tag
    const mappedPurpose: PurposeLabel = category === 'Question'
      ? 'Question'
      : category === 'Advice'
      ? 'Insight'
      : category === 'Milestone'
      ? 'Achievement'
      : category === 'Story'
      ? 'Motivation'
      : 'Progress';

    const fullContent = post.title ? `${post.title}\n\n${post.content}` : (post.content || '');
    const newPost: Post = {
      id: discId,
      author: currentUser,
      timestamp: 'Just now',
      purpose: post.isDailyProof ? 'Progress' : mappedPurpose,
      content: fullContent,
      communityId: targetCommId,
      communityName: targetComm?.name,
      isDailyProof: post.isDailyProof,
      likesCount: 1,
      commentsCount: 0,
      isLiked: true,
      isSaved: false,
    };

    setPosts((prev) => [newPost, ...prev.filter((item) => item.id !== discId)]);

    showToast(`✓ Posted ${category.toLowerCase()} to ${targetComm?.name || 'Community'}!`);

    // Persist to Supabase
    try {
      const safeAuthorId = await getActiveAuthUserId();
      const safeCommId = toDeterministicUUID(targetCommId);

      if (safeAuthorId && isValidUUID(safeCommId)) {
        await syncProfileToSupabase({ ...currentUser, id: safeAuthorId });

        const { error: communityError } = await supabase.from('communities').upsert({
          id: safeCommId,
          name: targetComm.name,
          description: targetComm.description || '',
          category: targetComm.category || 'General',
          icon: targetComm.icon || 'code',
          accent_color: targetComm.accentColor || '#2166FF',
          is_public: targetComm.isPublic ?? true,
          tags: targetComm.tags || [],
          cover_url: targetComm.coverUrl || null,
          members_count: targetComm.membersCount || 1,
          creator_id: safeAuthorId,
        }, { onConflict: 'id', ignoreDuplicates: true });
        if (communityError) {
          reportCloudSyncError('community post', communityError);
          return;
        }

        const { error: postError } = await supabase.from('posts').insert({
          id: discId,
          author_id: safeAuthorId,
          community_id: safeCommId,
          content: fullContent,
          purpose: mappedPurpose,
          likes_count: 1,
          comments_count: 0,
        });
        if (postError) {
          reportCloudSyncError('community post', postError);
          return;
        }

        const { error: voteError } = await supabase.from('post_likes').upsert({
          post_id: discId,
          user_id: safeAuthorId,
        });
        reportCloudSyncError('community post vote', voteError);
      }
    } catch (e) {
      console.error('Supabase community discussion save failed:', e);
      showToast('Community post saved on this device, but cloud sync failed.');
    }
  };

  // Interactions: Upvote / Downvote Community Discussion
  const handleVoteDiscussion = (postId: string, direction: 'up' | 'down') => {
    setCommunityPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          let delta = 0;
          let newVote: 'up' | 'down' | null = direction;
          if (p.userVote === direction) {
            delta = direction === 'up' ? -1 : 1;
            newVote = null;
          } else if (p.userVote) {
            delta = direction === 'up' ? 2 : -2;
          } else {
            delta = direction === 'up' ? 1 : -1;
          }
          return {
            ...p,
            upvotes: Math.max(0, p.upvotes + delta),
            userVote: newVote,
          };
        }
        return p;
      })
    );
  };

  // Interactions: Challenge Progress Log / Check In
  const handleIncrementChallenge = (challengeId: string) => {
    setChallenges((prev) =>
      prev.map((ch) => {
        if (ch.id === challengeId) {
          const newCurrent = Math.min(ch.target, ch.current + 1);
          const isNowCompleted = newCurrent >= ch.target;
          if (isNowCompleted && ch.current < ch.target) {
            showToast(`🎉 Challenge Completed: ${ch.title}!`);
          } else {
            showToast(`🔥 Checked In: Day ${newCurrent} of ${ch.target}`);
          }
          return {
            ...ch,
            current: newCurrent,
            status: isNowCompleted ? 'completed' : 'active',
          };
        }
        return ch;
      })
    );

    // Keep active modal in sync
    setSelectedChallenge((prev) => {
      if (prev && prev.id === challengeId) {
        const newCurrent = Math.min(prev.target, prev.current + 1);
        return {
          ...prev,
          current: newCurrent,
          status: newCurrent >= prev.target ? 'completed' : 'active',
        };
      }
      return prev;
    });
  };

  // Interactions: Challenge Join/Leave (Day 1 on start, Day 0 on leave)
  const handleToggleJoinChallenge = async (challengeId: string) => {
    let starting = false;

    setChallenges((prev) => {
      const updated = prev.map((ch) => {
        if (ch.id === challengeId) {
          starting = !ch.joined;
          if (starting) {
            showToast(`🔥 Started challenge: ${ch.title}! Marked as Day 1.`);
            return {
              ...ch,
              joined: true,
              current: 1, // Whenever someone starts a challenge, mark it as Day 1
              status: 'active' as const,
            };
          } else {
            showToast(`Left challenge: ${ch.title}. Reset to Day 0.`);
            return {
              ...ch,
              joined: false,
              current: 0, // If he/she leaves the challenge, reset to Day 0
              status: 'explore' as const,
            };
          }
        }
        return ch;
      });
      StorageService.saveChallenges(updated);
      return updated;
    });

    setSelectedChallenge((prev) => {
      if (prev && prev.id === challengeId) {
        const isStarting = !prev.joined;
        return {
          ...prev,
          joined: isStarting,
          current: isStarting ? 1 : 0,
          status: isStarting ? 'active' : 'explore',
        };
      }
      return prev;
    });

    setActiveChallenge((prev) => {
      if (prev && prev.id === challengeId) {
        const isStarting = !prev.joined;
        return {
          ...prev,
          joined: isStarting,
          current: isStarting ? 1 : 0,
          status: isStarting ? 'active' : 'explore',
        };
      }
      return prev;
    });

    // Sync challenge participation to Supabase
    try {
      let activeUserId: string | undefined = currentUser?.id;
      if (!isValidUUID(activeUserId)) {
        const { data: sessionData } = await supabase.auth.getSession();
        activeUserId = sessionData?.session?.user?.id;
      }

      if (isValidUUID(activeUserId) && isValidUUID(challengeId)) {
        await syncProfileToSupabase({ ...currentUser, id: activeUserId! });

        if (starting) {
          await supabase.from('challenge_participants').upsert({
            challenge_id: challengeId,
            user_id: activeUserId,
            current_progress: 1,
          });
        } else {
          await supabase.from('challenge_participants').delete().match({
            challenge_id: challengeId,
            user_id: activeUserId,
          });
        }
      }
    } catch (err) {
      console.warn('Supabase challenge participant sync notice:', err);
    }
  };

  // Interactions: Restart Challenge (Resets to Day 1)
  const handleRestartChallenge = (challengeId: string) => {
    setChallenges((prev) => {
      const updated = prev.map((ch) => {
        if (ch.id === challengeId) {
          showToast(`🎉 Challenge restarted: ${ch.title}! Ready for Day 1.`);
          return {
            ...ch,
            joined: true,
            current: 1,
            status: 'active' as const,
          };
        }
        return ch;
      });
      StorageService.saveChallenges(updated);
      return updated;
    });

    setSelectedChallenge((prev) =>
      prev && prev.id === challengeId
        ? { ...prev, joined: true, current: 1, status: 'active' }
        : prev
    );

    setActiveChallenge((prev) =>
      prev && prev.id === challengeId
        ? { ...prev, joined: true, current: 1, status: 'active' }
        : prev
    );
  };

  // Create Challenge handler
  const handleCreateChallenge = async (data: Partial<Challenge>) => {
    const challengeId = getSafeUUID();
    const newChallenge: Challenge = {
      id: challengeId,
      title: data.title || 'New Challenge',
      description: data.description || '',
      whatYouPerform: data.whatYouPerform || data.description || '',
      current: 1, // When started/created, mark as Day 1
      target: data.target || 30,
      unit: data.unit || 'days',
      category: data.category || 'habits',
      type: data.type || 'solo',
      tags: data.tags || ['#Habits'],
      icon: data.icon || 'trophy',
      status: 'active',
      joined: true,
      durationDays: data.durationDays || 30,
      maxSquadSize: data.maxSquadSize,
      squadMembers: data.squadMembers,
      participantsCount: 1,
      creator: {
        name: currentUser.name,
        username: currentUser.username,
        avatar: currentUser.avatar,
      },
    };

    const nextChallenges = [newChallenge, ...challenges];
    setChallenges(nextChallenges);
    StorageService.saveChallenges(nextChallenges);
    showToast(`🎉 New Challenge created: "${newChallenge.title}" (Day 1)`);

    // Persist to Supabase
    try {
      const activeUserId = await getActiveAuthUserId();

      if (activeUserId) {
        await syncProfileToSupabase({ ...currentUser, id: activeUserId });

        const { error: challengeError } = await supabase.from('challenges').insert({
          id: challengeId,
          title: newChallenge.title,
          description: newChallenge.description,
          what_you_perform: newChallenge.whatYouPerform,
          category: newChallenge.category,
          type: newChallenge.type,
          target: newChallenge.target,
          unit: newChallenge.unit,
          duration_days: newChallenge.durationDays,
          max_squad_size: newChallenge.maxSquadSize || 5,
          tags: newChallenge.tags,
          icon: newChallenge.icon,
          status: 'active',
          creator_id: activeUserId,
          participants_count: 1,
        });
        if (challengeError) {
          reportCloudSyncError('challenge creation', challengeError);
          return;
        }

        const { error: participantError } = await supabase.from('challenge_participants').insert({
          challenge_id: challengeId,
          user_id: activeUserId,
          current_progress: 1,
        });
        reportCloudSyncError('challenge enrollment', participantError);

        // Immediately refresh state
        fetchSupabaseData(activeUserId);
      }
    } catch (err) {
      console.warn('Supabase challenge creation notice:', err);
    }
  };

  // Interactions: Add Cohort Proof & update challenge progress
  const handleAddCohortProof = async (challengeId: string, proof: CohortProof) => {
    const persistProof = async (photoUrl: string | undefined) => {
      const savedProof = { ...proof, photoUrl };
      const addProofToChallenge = (challenge: Challenge): Challenge => ({
        ...challenge,
        squadProofs: [savedProof, ...(challenge.squadProofs || []).filter((item) => item.id !== savedProof.id)],
        current: Math.min((challenge.current || 0) + 1, challenge.target),
      });
      setChallenges((prev) => prev.map((challenge) =>
        challenge.id === challengeId ? addProofToChallenge(challenge) : challenge
      ));
      setActiveChallenge((prev) =>
        prev?.id === challengeId ? addProofToChallenge(prev) : prev
      );
      setSelectedChallenge((prev) =>
        prev?.id === challengeId ? addProofToChallenge(prev) : prev
      );

      try {
        const userId = await getActiveAuthUserId();
        if (!isValidUUID(userId) || !isValidUUID(challengeId)) return;

        const { error } = await supabase.from('cohort_proofs').upsert({
          id: proof.id,
          challenge_id: challengeId,
          author_id: userId,
          day_number: proof.dayNumber,
          note: proof.note,
          photo_url: photoUrl?.startsWith('data:') ? null : photoUrl || null,
          likes_count: proof.likesCount || 0,
        });
        if (error) {
          reportCloudSyncError('challenge proof', error);
          return;
        }

        const challenge = challenges.find((item) => item.id === challengeId);
        const { error: participantError } = await supabase.from('challenge_participants').upsert({
          challenge_id: challengeId,
          user_id: userId,
          current_progress: Math.min((challenge?.current || 0) + 1, challenge?.target || proof.dayNumber),
        });
        reportCloudSyncError('challenge progress', participantError);
      } catch (error) {
        console.error('Supabase challenge proof save failed:', error);
        showToast('Proof saved on this device, but cloud sync failed.');
      }
    };

    let photoUrl = proof.photoUrl;
    let photoUploadFailed = false;
    if (photoUrl?.startsWith('data:')) {
      photoUrl = await uploadMediaToSupabase('proofs', photoUrl, `proof_${proof.id}`);
      if (photoUrl.startsWith('data:')) {
        photoUrl = undefined;
        photoUploadFailed = true;
      }
    }

    await persistProof(photoUrl);
    showToast(photoUploadFailed
      ? 'Proof saved, but its photo could not be uploaded.'
      : `✓ Photo proof recorded for ${proof.author.name}!`);
  };

  // Squad Management Handlers
  const handleCreateSquad = async (data: Partial<Squad>) => {
    const squadId = getSafeUUID();
    const newSquad: Squad = {
      id: squadId,
      name: data.name || 'New Squad',
      category: data.category || 'fitness',
      requiredSize: data.requiredSize || 5,
      challengeId: data.challengeId,
      challengeTitle: data.challengeTitle,
      creator: {
        name: currentUser.name,
        username: currentUser.username,
        avatar: currentUser.avatar,
      },
      members: [{
        id: currentUser.id,
        name: currentUser.name,
        username: currentUser.username,
        avatar: currentUser.avatar,
        dayReached: 1,
        role: 'creator',
      }],
    };

    setSquads(prev => [newSquad, ...prev]);
    showToast(`🎉 Squad "${newSquad.name}" created! Invitations sent.`);

    // Persist to Supabase and send notifications to recipient accounts
    try {
      const activeUserId = await getActiveAuthUserId();

      if (activeUserId) {
        await syncProfileToSupabase({ ...currentUser, id: activeUserId });

        // Insert squad
        const { error: squadError } = await supabase.from('squads').insert({
          id: squadId,
          name: newSquad.name,
          category: newSquad.category,
          challenge_id: isValidUUID(newSquad.challengeId) ? newSquad.challengeId : null,
          required_size: newSquad.requiredSize,
          creator_id: activeUserId,
        });
        if (squadError) {
          reportCloudSyncError('squad creation', squadError);
          return;
        }

        // Insert creator into squad_members
        const { error: ownerError } = await supabase.from('squad_members').upsert({
          squad_id: squadId,
          user_id: activeUserId,
          day_reached: 1,
          role: 'creator',
        });
        if (ownerError) {
          reportCloudSyncError('squad owner membership', ownerError);
          return;
        }

        // Send notifications to each invited member
        const invitees = (data.members || [])
          .filter((member) => member.username.toLowerCase() !== currentUser.username.toLowerCase())
          .slice(0, Math.max(0, newSquad.requiredSize - 1));
        for (const m of invitees) {
          if (m.username && m.username !== currentUser.username) {
            let targetUserId = m.id;
            if (!isValidUUID(targetUserId)) {
              const { data: targetProfile } = await supabase
                .from('profiles')
                .select('id')
                .ilike('username', m.username.replace(/^@/, ''))
                .maybeSingle();
              if (targetProfile?.id) {
                targetUserId = targetProfile.id;
              }
            }

            if (isValidUUID(targetUserId)) {
              const notifPayload = {
                id: getSafeUUID(),
                recipient_id: targetUserId,
                sender_id: activeUserId,
                type: 'squad_invitation',
                action: `invited you to join squad "${newSquad.name}"`,
                target: `For ${newSquad.challengeTitle || 'Sprint'} (${newSquad.members.length}/${newSquad.requiredSize} members; invitation pending)`,
                squad_id: isValidUUID(squadId) ? squadId : null,
                read: false,
              };
              const { error: notifErr } = await supabase.from('notifications').insert(notifPayload);
              reportCloudSyncError('squad invitation', notifErr);
            }
          }
        }
      }
    } catch (err) {
      console.warn('Supabase squad creation notice:', err);
    }
  };

  const handleInviteMemberToSquad = async (squadId: string, username: string) => {
    const targetSquad = squads.find(s => s.id === squadId);
    if (!targetSquad) return;

    const cleanUsername = username.replace(/^@/, '').toLowerCase();
    if (targetSquad.members.some((member) => member.username.toLowerCase() === cleanUsername)) {
      showToast(`@${cleanUsername} is already in this squad.`);
      return;
    }
    if (targetSquad.members.length >= targetSquad.requiredSize) {
      showToast('This squad is already full.');
      return;
    }
    const foundUser = allCreators.find(u => u.username.toLowerCase() === cleanUsername);
    showToast(`✉️ Squad invitation sent to @${cleanUsername}!`);

    // Send squad invitation notification to target recipient in Supabase
    try {
      const activeUserId = await getActiveAuthUserId();

      if (activeUserId && isValidUUID(activeUserId)) {
        let targetRecipientId: string | undefined = (foundUser?.id && isValidUUID(foundUser.id)) ? foundUser.id : undefined;

        if (!targetRecipientId) {
          const { data: recipientProfile } = await supabase
            .from('profiles')
            .select('id')
            .ilike('username', cleanUsername)
            .maybeSingle();

          if (recipientProfile?.id && isValidUUID(recipientProfile.id)) {
            targetRecipientId = recipientProfile.id;
          }
        }

        if (targetRecipientId && isValidUUID(targetRecipientId) && isValidUUID(squadId)) {
          const notifPayload = {
            id: getSafeUUID(),
            recipient_id: targetRecipientId,
            sender_id: activeUserId,
            type: 'squad_invitation',
            action: `invited you to join squad "${targetSquad.name}"`,
            target: `For ${targetSquad.challengeTitle || 'Challenge Sprint'} (${targetSquad.members.length}/${targetSquad.requiredSize} members; invitation pending)`,
            squad_id: squadId,
            read: false,
          };

          const { error: notifErr } = await supabase.from('notifications').insert(notifPayload);
          reportCloudSyncError('squad invitation', notifErr);
        }
      }
    } catch (err) {
      console.warn('Supabase squad invite notification notice:', err);
    }
  };

  const handleEnterChallengeWithSquad = (squadId: string, challengeId: string) => {
    const targetSquad = squads.find(s => s.id === squadId);
    if (!targetSquad) return;
    const targetCh = challenges.find(c => c.id === challengeId) || challenges[0];

    if (targetSquad.members.length !== targetSquad.requiredSize) {
      showToast(`⚠️ Not eligible: Squad requires exactly ${targetSquad.requiredSize} members (currently ${targetSquad.members.length})`);
      return;
    }

    setSquads(prev => prev.map(sq => {
      if (sq.id === squadId) {
        return {
          ...sq,
          challengeId,
          challengeTitle: targetCh.title,
          entrySession: {
            challengeId,
            challengeTitle: targetCh.title,
            initiatedBy: {
              name: currentUser.name,
              username: currentUser.username,
            },
            status: 'pending_acceptance',
            acceptedUsernames: [currentUser.username],
          }
        };
      }
      return sq;
    }));

    showToast(`📢 @${currentUser.username} has taken ${targetSquad.name} for ${targetCh.title}! Awaiting squad acceptance.`);
  };

  const handleAcceptSquadEntry = (squadId: string, username: string) => {
    setSquads(prev => prev.map(sq => {
      if (sq.id === squadId && sq.entrySession) {
        const currentAccepted = sq.entrySession.acceptedUsernames;
        const newAccepted = currentAccepted.includes(username) ? currentAccepted : [...currentAccepted, username];
        const isAllAccepted = newAccepted.length >= sq.requiredSize;

        if (isAllAccepted) {
          setChallenges(prevCh => prevCh.map(c => c.id === sq.entrySession?.challengeId ? { ...c, joined: true } : c));
          showToast(`🎉 All ${sq.requiredSize} members accepted! Squad entered "${sq.entrySession.challengeTitle}"!`);
        }

        return {
          ...sq,
          entrySession: {
            ...sq.entrySession,
            acceptedUsernames: newAccepted,
            status: isAllAccepted ? 'entered' : 'pending_acceptance',
          }
        };
      }
      return sq;
    }));
  };

  const handleAcceptAllSquadEntry = (squadId: string) => {
    setSquads(prev => prev.map(sq => {
      if (sq.id === squadId && sq.entrySession) {
        const allUsernames = sq.members.map(m => m.username);
        setChallenges(prevCh => prevCh.map(c => c.id === sq.entrySession?.challengeId ? { ...c, joined: true } : c));
        showToast(`🎉 All members accepted! Squad has entered "${sq.entrySession.challengeTitle}"!`);

        return {
          ...sq,
          entrySession: {
            ...sq.entrySession,
            acceptedUsernames: allUsernames,
            status: 'entered',
          }
        };
      }
      return sq;
    }));
  };

  const handleAcceptSquadInvite = async (squadId: string, notifId: string) => {
    const targetSquad = squads.find((squad) => squad.id === squadId);
    const invitation = notifications.find((notification) => notification.id === notifId);
    if (!targetSquad && (!invitation?.squadInvitation || !isValidUUID(squadId))) {
      showToast('This squad invitation is no longer available.');
      return;
    }
    const squadToJoin: Squad = targetSquad || {
      id: squadId,
      name: invitation?.squadInvitation?.squadName || 'Squad',
      category: 'General',
      requiredSize: invitation?.squadInvitation?.requiredMembers || 2,
      challengeTitle: invitation?.squadInvitation?.challengeTitle,
      creator: {
        name: invitation?.user.name || 'Squad Lead',
        username: invitation?.user.username || 'leader',
        avatar: invitation?.user.avatar,
      },
      members: [{
        id: invitation?.user.id || `u_${invitation?.user.username || 'leader'}`,
        name: invitation?.user.name || 'Squad Lead',
        username: invitation?.user.username || 'leader',
        avatar: invitation?.user.avatar || '',
        dayReached: 1,
        role: 'creator',
      }],
    };
    if (
      !squadToJoin.members.some((member) => member.username.toLowerCase() === currentUser.username.toLowerCase()) &&
      squadToJoin.members.length >= squadToJoin.requiredSize
    ) {
      showToast('This squad is already full.');
      return;
    }

    setNotifications(prev => prev.map(n => {
      if (n.id === notifId && n.squadInvitation) {
        return {
          ...n,
          read: true,
          squadInvitation: {
            ...n.squadInvitation,
            status: 'accepted',
          }
        };
      }
      return n;
    }));

    setSquads((prev) => {
      const exists = prev.some((squad) => squad.id === squadId);
      const nextSquad = {
        ...squadToJoin,
        members: squadToJoin.members.some((member) => member.username.toLowerCase() === currentUser.username.toLowerCase())
          ? squadToJoin.members
          : [...squadToJoin.members, {
              id: currentUser.id,
              name: currentUser.name,
              username: currentUser.username,
              avatar: currentUser.avatar,
              dayReached: 1,
              role: 'member' as const,
            }],
      };
      return exists
        ? prev.map((squad) => squad.id === squadId ? nextSquad : squad)
        : [nextSquad, ...prev];
    });

    showToast(`✓ Accepted squad invitation! You joined the roster.`);

    try {
      if (isValidUUID(notifId)) {
        const { error } = await supabase.from('notifications').update({ read: true }).eq('id', notifId);
        reportCloudSyncError('squad invitation update', error);
      }
      const activeUserId = await getActiveAuthUserId();
      if (isValidUUID(squadId) && activeUserId) {
        const { error } = await supabase.from('squad_members').upsert({
          squad_id: squadId,
          user_id: activeUserId,
          day_reached: 1,
          role: 'member',
        });
        reportCloudSyncError('squad invitation acceptance', error);
      }
    } catch (err) {
      console.warn('Squad invite acceptance sync notice:', err);
    }
  };

  const handleDeclineSquadInvite = async (squadId: string, notifId: string) => {
    setNotifications(prev => prev.map(n => {
      if (n.id === notifId && n.squadInvitation) {
        return {
          ...n,
          read: true,
          squadInvitation: {
            ...n.squadInvitation,
            status: 'declined',
          }
        };
      }
      return n;
    }));
    showToast(`Squad invitation declined.`);

    try {
      if (isValidUUID(notifId)) {
        await supabase.from('notifications').update({ read: true }).eq('id', notifId);
      }
    } catch (err) {
      console.warn('Squad invite decline sync notice:', err);
    }
  };

  // Interactions: Toggle Community Join
  const handleToggleJoinCommunity = async (communityId: string) => {
    let nowJoined = false;
    setCommunities((prev) => {
      const updated = prev.map((c) => {
        if (c.id === communityId) {
          nowJoined = !c.isJoined;
          showToast(nowJoined ? `Joined ${c.name}` : `Left ${c.name}`);
          return {
            ...c,
            isJoined: nowJoined,
            membersCount: nowJoined ? c.membersCount + 1 : Math.max(0, c.membersCount - 1),
          };
        }
        return c;
      });
      StorageService.saveCommunities(updated);
      return updated;
    });

    try {
      let activeUserId: string | undefined = currentUser?.id;
      if (!isValidUUID(activeUserId)) {
        const { data: sessionData } = await supabase.auth.getSession();
        activeUserId = sessionData?.session?.user?.id;
      }

      if (isValidUUID(activeUserId) && isValidUUID(communityId)) {
        await syncProfileToSupabase({ ...currentUser, id: activeUserId! });

        if (nowJoined) {
          await supabase.from('community_members').upsert({
            community_id: communityId,
            user_id: activeUserId,
            role: 'member',
          });
        } else {
          await supabase.from('community_members').delete().match({
            community_id: communityId,
            user_id: activeUserId,
          });
        }
      }
    } catch (err) {
      console.warn('Supabase community join sync notice:', err);
    }
  };

  // Create Community handler
  const handleCreateCommunity = async (data: Partial<Community>) => {
    const communityId = getSafeUUID();
    const newCommunity: Community = {
      id: communityId,
      name: data.name || 'New Community',
      description: data.description || '',
      icon: data.icon || 'code',
      accentColor: data.accentColor || '#3B82FF',
      membersCount: 1,
      isJoined: true,
      category: data.category || 'Coding',
      isPublic: data.isPublic !== false,
      tags: data.tags || ['#Coding'],
      creator: {
        name: currentUser.name,
        username: currentUser.username,
      },
      coverUrl: data.coverUrl,
    };

    const nextCommunities = [newCommunity, ...communities];
    setCommunities(nextCommunities);
    StorageService.saveCommunities(nextCommunities);
    showToast(`🎉 Community created: "${newCommunity.name}"`);

    try {
      let activeUserId: string | undefined = currentUser?.id;
      if (!isValidUUID(activeUserId)) {
        const { data: sessionData } = await supabase.auth.getSession();
        activeUserId = sessionData?.session?.user?.id;
      }

      if (isValidUUID(activeUserId)) {
        await syncProfileToSupabase({ ...currentUser, id: activeUserId! });

        await supabase.from('communities').insert({
          id: communityId,
          name: newCommunity.name,
          description: newCommunity.description,
          category: newCommunity.category,
          is_public: newCommunity.isPublic,
          icon: newCommunity.icon,
          accent_color: newCommunity.accentColor,
          cover_url: newCommunity.coverUrl || null,
          tags: newCommunity.tags,
          creator_id: activeUserId,
          members_count: 1,
        });

        await supabase.from('community_members').insert({
          community_id: communityId,
          user_id: activeUserId,
          role: 'admin',
        });
      }
    } catch (err) {
      console.warn('Supabase community creation notice:', err);
    }
  };

  // Profile Save
  const handleSaveProfile = async (updated: { 
    name: string; 
    username: string; 
    bio: string; 
    avatar?: string; 
    bannerUrl?: string; 
    accountabilityHubPrivacy?: 'public' | 'private' 
  }) => {
    let nextAvatar = updated.avatar || currentUser.avatar;
    if (nextAvatar && nextAvatar.startsWith('data:')) {
      try {
        const hosted = await uploadMediaToSupabase('avatars', nextAvatar, updated.username);
        if (hosted) nextAvatar = hosted;
      } catch {
        // graceful fallback to dataUrl
      }
    }

    const updatedUser: Author = {
      ...currentUser,
      name: updated.name,
      username: updated.username,
      bio: updated.bio,
      avatar: nextAvatar,
      ...(updated.bannerUrl ? { bannerUrl: updated.bannerUrl } : {}),
      ...(updated.accountabilityHubPrivacy ? { accountabilityHubPrivacy: updated.accountabilityHubPrivacy } : {}),
    };

    setCurrentUser(updatedUser);
    setViewingUser(updatedUser);
    StorageService.saveCurrentUser(updatedUser);

    setPosts((prev) => {
      const updatedPosts = prev.map((p) => {
        const isPostAuthor = p.author.username === currentUser.username || p.author.id === currentUser.id;
        const updatedAuthor = isPostAuthor ? { ...p.author, ...updatedUser } : p.author;
        const updatedComments = (p.comments || []).map((c) =>
          c.author.username === currentUser.username || c.author.id === currentUser.id
            ? { ...c, author: { ...c.author, ...updatedUser } }
            : c
        );
        return {
          ...p,
          author: updatedAuthor,
          comments: updatedComments,
        };
      });
      StorageService.savePosts(updatedPosts);
      return updatedPosts;
    });

    // Update community posts authored by user
    setCommunityPosts((prev) => {
      const updated = prev.map((cp) =>
        cp.author.username === currentUser.username
          ? {
              ...cp,
              author: {
                ...cp.author,
                name: updatedUser.name,
                username: updatedUser.username,
                avatar: updatedUser.avatar,
              },
            }
          : cp
      );
      StorageService.saveCommunityPosts(updated);
      return updated;
    });

    // Update challenges created by user
    setChallenges((prev) => {
      const updated = prev.map((ch) =>
        ch.creator && (ch.creator.username === currentUser.username || (ch.creator as any)?.id === currentUser.id)
          ? { ...ch, creator: { ...ch.creator, ...updatedUser } }
          : ch
      );
      StorageService.saveChallenges(updated);
      return updated;
    });

    // Update squads where user is creator or member
    setSquads((prev) => {
      const updated = prev.map((sq) => {
        const isCreator = sq.creator && (sq.creator.username === currentUser.username || (sq.creator as any)?.id === currentUser.id);
        const updatedCreator = isCreator ? { ...sq.creator, ...updatedUser } : sq.creator;
        const updatedMembers = (sq.members || []).map((m) =>
          m.username === currentUser.username || m.id === currentUser.id
            ? { ...m, name: updatedUser.name, username: updatedUser.username, avatar: updatedUser.avatar }
            : m
        );
        return {
          ...sq,
          creator: updatedCreator,
          members: updatedMembers,
        };
      });
      StorageService.saveSquads(updated);
      return updated;
    });

    // Update persistent comments registry
    StorageService.updateCommentAuthor(currentUser.username, updatedUser);

    // Also update allCreators so search and user lists immediately reflect new avatar and details
    setAllCreators((prev) => {
      const exists = prev.some((c) => c.id === updatedUser.id || c.username === updatedUser.username);
      const nextCreators = exists
        ? prev.map((c) => (c.id === updatedUser.id || c.username === updatedUser.username ? { ...c, ...updatedUser } : c))
        : [updatedUser, ...prev];
      StorageService.saveCreators(nextCreators);
      return nextCreators;
    });

    showToast('Profile picture & details updated');

    // Persist to Supabase database profiles table and Auth user_metadata
    try {
      let activeUserId: string | undefined = currentUser?.id;
      if (!isValidUUID(activeUserId)) {
        const { data: sessionData } = await supabase.auth.getSession();
        activeUserId = sessionData?.session?.user?.id;
      }

      if (isValidUUID(activeUserId)) {
        await syncProfileToSupabase({
          id: activeUserId!,
          name: updated.name,
          username: updated.username,
          bio: updated.bio,
          avatar: nextAvatar,
          accountabilityHubPrivacy: updated.accountabilityHubPrivacy || currentUser.accountabilityHubPrivacy || 'public',
        });

        const metaUpdate: any = {
          name: updated.name,
          username: updated.username,
          bio: updated.bio,
        };
        if (nextAvatar.startsWith('http')) {
          metaUpdate.avatar_url = nextAvatar;
        }

        await supabase.auth.updateUser({
          data: metaUpdate,
        });
      }
    } catch (err) {
      console.warn('Supabase profile update notice:', err);
    }
  };

  // Community Guidelines & Join Requests Handlers
  const handleUpdateCommunityGuidelines = (communityId: string, guidelines: string[]) => {
    setCommunities((prev) =>
      prev.map((c) => (c.id === communityId ? { ...c, guidelines } : c))
    );
    if (activeCommunity?.id === communityId) {
      setActiveCommunity((prev) => (prev ? { ...prev, guidelines } : prev));
    }
    showToast('Community guidelines updated by moderator');
  };

  const handleApproveJoinRequest = (communityId: string, requestId: string, applicant: Author) => {
    setCommunities((prev) =>
      prev.map((c) => {
        if (c.id === communityId) {
          const remaining = (c.pendingJoinRequests || []).filter((r) => r.id !== requestId);
          return {
            ...c,
            membersCount: c.membersCount + 1,
            pendingJoinRequests: remaining,
          };
        }
        return c;
      })
    );
    if (activeCommunity?.id === communityId) {
      setActiveCommunity((prev) =>
        prev
          ? {
              ...prev,
              membersCount: prev.membersCount + 1,
              pendingJoinRequests: (prev.pendingJoinRequests || []).filter((r) => r.id !== requestId),
            }
          : prev
      );
    }
    showToast(`Approved @${applicant.username}! Welcomed into ${activeCommunity?.name || 'community'}.`);
  };

  const handleDeclineJoinRequest = (communityId: string, requestId: string) => {
    setCommunities((prev) =>
      prev.map((c) => {
        if (c.id === communityId) {
          return {
            ...c,
            pendingJoinRequests: (c.pendingJoinRequests || []).filter((r) => r.id !== requestId),
          };
        }
        return c;
      })
    );
    if (activeCommunity?.id === communityId) {
      setActiveCommunity((prev) =>
        prev
          ? {
              ...prev,
              pendingJoinRequests: (prev.pendingJoinRequests || []).filter((r) => r.id !== requestId),
            }
          : prev
      );
    }
    showToast('Join request declined');
  };

  const handleRequestJoinCommunity = (communityId: string) => {
    const targetCommunity = communities.find((c) => c.id === communityId);
    const newRequest: JoinRequest = {
      id: `req_${Date.now()}`,
      user: currentUser,
      timestamp: 'Just now',
      note: 'Hi! I want to join the private accountability syndicate and share daily progress.',
      status: 'pending',
    };
    setCommunities((prev) =>
      prev.map((c) => {
        if (c.id === communityId) {
          const existing = c.pendingJoinRequests || [];
          if (existing.some((r) => r.user.username === currentUser.username)) {
            return c;
          }
          return {
            ...c,
            pendingJoinRequests: [...existing, newRequest],
          };
        }
        return c;
      })
    );
    if (activeCommunity?.id === communityId) {
      setActiveCommunity((prev) =>
        prev
          ? {
              ...prev,
              pendingJoinRequests: [...(prev.pendingJoinRequests || []), newRequest],
            }
          : prev
      );
    }
    showToast(`Join request sent to ${targetCommunity?.name || 'community'} moderators!`);
  };

  // Mark notifications read
  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    showToast('All notifications marked as read');
  };

  const joinedCommunitiesCount = communities.filter((c) => c.isJoined).length;

  // To-Do list handlers
  const handleAddToTodoList = (challenge: Challenge) => {
    const existing = toDoList.find((t) => t.challengeId === challenge.id);
    if (existing) {
      showToast(`Already in your To-Do list: "${challenge.title}"`);
      return;
    }
    const todayStr = new Date().toISOString().split('T')[0];
    const newTodo: ToDoItem = {
      id: `todo_${Date.now()}`,
      challengeId: challenge.id,
      title: `Daily Check-In: ${challenge.title}`,
      targetUnit: challenge.unit || '1 daily entry',
      scheduledDate: todayStr,
      completed: false,
      category: challenge.category.charAt(0).toUpperCase() + challenge.category.slice(1),
      notes: challenge.whatYouPerform || challenge.description,
    };
    setToDoList([newTodo, ...toDoList]);
    showToast(`Added "${challenge.title}" to your To-Do list!`);
  };

  const handleToggleToDo = (id: string) => {
    setToDoList((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const completed = !t.completed;
          showToast(completed ? `Completed: "${t.title}"` : `Marked incomplete`);
          return { ...t, completed };
        }
        return t;
      })
    );
  };

  const handleAddCustomToDo = (title: string, date: string, category: string) => {
    const newTodo: ToDoItem = {
      id: `todo_${Date.now()}`,
      title,
      scheduledDate: date || new Date().toISOString().split('T')[0],
      completed: false,
      category: category || 'General',
    };
    setToDoList([newTodo, ...toDoList]);
    showToast(`Added to-do: "${title}"`);
  };

  const handleDeleteToDo = (id: string) => {
    setToDoList((prev) => prev.filter((t) => t.id !== id));
    showToast('To-Do item removed');
  };

  const handleDeletePost = async (postId: string) => {
    const isMatch = (id?: string) => id === postId || toDeterministicUUID(id || '') === postId || id === toDeterministicUUID(postId);

    setPosts((prev) => {
      const filtered = prev.filter((p) => !isMatch(p.id));
      StorageService.savePosts(filtered);
      return filtered;
    });

    setCommunityPosts((prev) => {
      const filtered = prev.filter((cp) => !isMatch(cp.id));
      StorageService.saveCommunityPosts(filtered);
      return filtered;
    });

    setSelectedPostForComments((prev) => (prev && isMatch(prev.id) ? null : prev));
    setSelectedPostForMenu((prev) => (prev && isMatch(prev.id) ? null : prev));
    setSelectedPostForShare((prev) => (prev && isMatch(prev.id) ? null : prev));

    showToast('Post deleted');

    try {
      const activeUserId = await getActiveAuthUserId();
      if (activeUserId) {
        const safeId = toDeterministicUUID(postId);
        await supabase.from('posts').delete().eq('id', safeId);
      }
    } catch (e) {
      console.warn('Supabase post deletion error:', e);
    }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    const isMatch = (id?: string) => id === postId || toDeterministicUUID(id || '') === postId || id === toDeterministicUUID(postId);

    setPosts((prev) => {
      const updated = prev.map((post) => {
        if (isMatch(post.id)) {
          const updatedComments = (post.comments || []).filter((c) => c.id !== commentId);
          return {
            ...post,
            comments: updatedComments,
            commentsCount: Math.max(0, (post.commentsCount || 1) - 1),
          };
        }
        return post;
      });
      StorageService.savePosts(updated);
      return updated;
    });

    // Also remove from StorageService comments registry
    StorageService.removeCommentFromPost(postId, commentId);
    const safePostUuid = toDeterministicUUID(postId);
    if (safePostUuid && safePostUuid !== postId) {
      StorageService.removeCommentFromPost(safePostUuid, commentId);
    }

    setSelectedPostForComments((prev) => {
      if (!prev || !isMatch(prev.id)) return prev;
      const updatedComments = (prev.comments || []).filter((c) => c.id !== commentId);
      return {
        ...prev,
        comments: updatedComments,
        commentsCount: Math.max(0, (prev.commentsCount || 1) - 1),
      };
    });

    showToast('Comment deleted');

    try {
      const activeUserId = await getActiveAuthUserId();
      if (activeUserId) {
        await supabase.from('post_comments').delete().eq('id', commentId);
      }
    } catch (e) {
      console.warn('Supabase comment deletion error:', e);
    }
  };

  const handleDeleteChallenge = async (challengeId: string) => {
    setChallenges((prev) => {
      const filtered = prev.filter((c) => c.id !== challengeId);
      StorageService.saveChallenges(filtered);
      return filtered;
    });

    setToDoList((prev) => prev.filter((t) => t.challengeId !== challengeId));

    if (currentScreen === 'challenge_detail' && activeChallenge?.id === challengeId) {
      setCurrentScreen('challenges');
    }
    if (selectedChallenge?.id === challengeId) {
      setSelectedChallenge(null);
    }

    showToast('Challenge deleted');

    try {
      const activeUserId = await getActiveAuthUserId();
      if (activeUserId) {
        const safeId = toDeterministicUUID(challengeId);
        await supabase.from('challenges').delete().eq('id', safeId);
      }
    } catch (e) {
      console.warn('Supabase challenge delete error:', e);
    }
  };

  const handleDeleteSquad = async (squadId: string) => {
    setSquads((prev) => {
      const filtered = prev.filter((sq) => sq.id !== squadId);
      StorageService.saveSquads(filtered);
      return filtered;
    });

    showToast('Squad deleted');

    try {
      const activeUserId = await getActiveAuthUserId();
      if (activeUserId) {
        const safeId = toDeterministicUUID(squadId);
        await supabase.from('squads').delete().eq('id', safeId);
      }
    } catch (e) {
      console.warn('Supabase squad delete error:', e);
    }
  };

  const handleCheckInWithProof = (
    challengeId: string,
    note: string,
    photoUrl?: string,
    addAsDailyProof: boolean = true
  ) => {
    handleIncrementChallenge(challengeId);
    const targetCh = challenges.find((c) => c.id === challengeId);
    const dayNumber = (targetCh?.current || 0) + 1;

    if (addAsDailyProof) {
      const proofPostId = getSafeUUID();
      const contentText = note.trim()
        ? `${note.trim()}\n\n[Verified Daily Proof • Day ${dayNumber} of ${targetCh?.title || 'Challenge'}]`
        : `Completed Day ${dayNumber} check-in for ${targetCh?.title || 'Challenge'}! 🎯`;

      const proofPost: Post = {
        id: proofPostId,
        author: currentUser,
        timestamp: 'Just now',
        purpose: 'Progress',
        content: contentText,
        mediaUrls: photoUrl ? [photoUrl] : undefined,
        imageUrl: photoUrl,
        mediaType: photoUrl ? 'image' : undefined,
        likesCount: 0,
        commentsCount: 0,
        isLiked: false,
        isSaved: false,
        isDailyProof: true,
        proofDay: dayNumber,
        challengeTitle: targetCh?.title,
      };

      setPosts((prev) => {
        const next = [proofPost, ...prev];
        StorageService.savePosts(next);
        return next;
      });

      // Also sync to Supabase if authenticated
      getActiveAuthUserId().then(async (safeAuthorId) => {
        if (safeAuthorId) {
          try {
            await syncProfileToSupabase({ ...currentUser, id: safeAuthorId });
            await supabase.from('posts').insert({
              id: toDeterministicUUID(proofPostId),
              author_id: safeAuthorId,
              content: contentText,
              purpose: 'Progress',
              media_urls: photoUrl ? [photoUrl] : [],
              media_type: photoUrl ? 'image' : 'none',
              likes_count: 0,
              comments_count: 0,
            });
          } catch (err) {
            console.warn('Supabase daily proof insert error:', err);
          }
        }
      }).catch(() => {});
    }

    showToast(`Day ${dayNumber} proof logged${photoUrl ? ' with photo' : ''}!`);
  };

  const handleOpenChallengeDetail = (challenge: Challenge) => {
    setActiveChallenge(challenge);
    setPreviousScreen(currentScreen);
    setCurrentScreen('challenge_detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenCohortDiscussions = (challenge?: Challenge, mode?: 'list' | 'detail') => {
    if (challenge) {
      setActiveChallenge(challenge);
      setCohortViewMode(mode || 'detail');
    } else {
      setCohortViewMode('list');
    }
    setPreviousScreen(currentScreen);
    setCurrentScreen('cohort_discussions');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenCommunityHub = (community: Community) => {
    setActiveCommunity(community);
    setPreviousScreen(currentScreen);
    setCurrentScreen('community_hub');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenJoinedCommunities = () => {
    setPreviousScreen(currentScreen);
    setCurrentScreen('my_joined_communities');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAccountabilityHub = (targetUser?: Author) => {
    setAccountabilityHubUser(targetUser || currentUser);
    setPreviousScreen(currentScreen);
    setCurrentScreen('accountability_hub');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleHubPrivacy = (targetPrivacy?: 'public' | 'private') => {
    const nextPrivacy = targetPrivacy || (currentUser.accountabilityHubPrivacy === 'private' ? 'public' : 'private');
    setCurrentUser((prev) => ({
      ...prev,
      accountabilityHubPrivacy: nextPrivacy,
    }));
    if (viewingUser.id === currentUser.id || viewingUser.username === currentUser.username) {
      setViewingUser((prev) => ({
        ...prev,
        accountabilityHubPrivacy: nextPrivacy,
      }));
    }
    showToast(`Accountability Hub visibility set to ${nextPrivacy.toUpperCase()}`);
  };

  const handleOnboardingComplete = (
    newUser: Author,
    selectedInterests: string[],
    authSession?: { provider: 'google' | 'email' | 'guest'; email?: string }
  ) => {
    setCurrentUser(newUser);
    setViewingUser(newUser);
    StorageService.saveCurrentUser(newUser);
    StorageService.setOnboardingCompleted(true);
    if (authSession) {
      StorageService.setAuthSession(authSession);
    }
    setIsOnboardingDone(true);

    // Sync profile to Supabase and load live data
    syncProfileToSupabase(newUser).finally(() => {
      fetchSupabaseData(newUser.id);
    });

    showToast(`Welcome, ${newUser.name}! Your account is ready.`);
  };

  const handleResetToFreshData = () => {
    StorageService.clearAll();
    const cleanUser: Author = {
      ...currentUser,
      followersCount: 0,
      followingCount: 0,
    };
    setCurrentUser(cleanUser);
    setViewingUser(cleanUser);
    setPosts([]);
    setChallenges([]);
    setCommunities([]);
    setToDoList([]);
    setNotifications([]);
    setSquads([]);
    setActiveChallenge(null);
    setActiveCommunity(null);
    showToast('Clean slate active! You can now feed and save fresh real data.');
  };

  // Render current screen contents
  const renderScreenContent = (screen: ScreenType) => {
    switch (screen) {
      case 'home':
        return (
          <HomeScreen
            posts={posts}
            currentUser={currentUser}
            onOpenCreate={() => handleSelectScreen('create')}
            onToggleLike={handleToggleLike}
            onToggleSave={handleToggleSave}
            onOpenComments={(post) => setSelectedPostForComments(post)}
            onOpenPostMenu={(post) => setSelectedPostForMenu(post)}
            onOpenShare={(post) => setSelectedPostForShare(post)}
            onNavigateAuthorProfile={(author) => handleNavigateToUser(author)}
            onToggleFollow={handleToggleFollow}
            onRefresh={() => fetchSupabaseData(currentUser.id)}
            isRefreshingSupabase={isLoadingSupabase}
          />
        );
      case 'challenges':
        return (
          <ChallengesScreen
            challenges={challenges}
            currentUser={currentUser}
            squads={squads}
            allUsers={allCreators}
            onSelectChallenge={handleOpenChallengeDetail}
            onOpenCreateChallenge={() => setIsCreateChallengeOpen(true)}
            onCheckIn={handleIncrementChallenge}
            onNavigateUser={(user) => handleNavigateToUser(user)}
            onOpenCohortDiscussions={handleOpenCohortDiscussions}
            onAddToTodoList={handleAddToTodoList}
            onToggleFollow={handleToggleFollow}
            toDoChallengeIds={toDoList.filter(t => t.challengeId).map(t => t.challengeId!)}
            onToggleJoinChallenge={handleToggleJoinChallenge}
            onCreateSquad={handleCreateSquad}
            onInviteMemberToSquad={handleInviteMemberToSquad}
            onEnterChallengeWithSquad={handleEnterChallengeWithSquad}
            onAcceptSquadEntry={handleAcceptSquadEntry}
            onAcceptAllSquadEntry={handleAcceptAllSquadEntry}
            onDeleteSquad={handleDeleteSquad}
            onDeleteChallenge={handleDeleteChallenge}
          />
        );
      case 'create':
        return (
          <CreatePostScreen
            currentUser={currentUser}
            onClose={handleCloseCreate}
            onSubmitPost={handleCreatePost}
          />
        );
      case 'communities':
        return (
          <CommunitiesScreen
            communities={communities}
            creators={allCreators}
            currentUser={currentUser}
            onToggleJoin={handleToggleJoinCommunity}
            onOpenCreateCommunity={() => setIsCreateCommunityOpen(true)}
            onNavigateUser={(user) => handleNavigateToUser(user)}
            onOpenJoinedCommunities={handleOpenJoinedCommunities}
            onSelectCommunity={handleOpenCommunityHub}
            onToggleFollow={handleToggleFollow}
            onRequestJoin={handleRequestJoinCommunity}
          />
        );
      case 'profile':
        return (
          <ProfileScreen
            user={viewingUser}
            posts={posts}
            challenges={challenges}
            joinedCommunitiesCount={joinedCommunitiesCount}
            allUsers={allCreators}
            allCommunities={communities}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenEditProfile={() => setIsEditProfileOpen(true)}
            onSelectPost={(post) => setSelectedPostForComments(post)}
            onSelectChallenge={handleOpenChallengeDetail}
            onBack={viewingUser.id !== currentUser.id ? () => handleSelectScreen(previousScreen === 'profile' ? 'home' : previousScreen) : undefined}
            onToggleFollow={handleToggleFollow}
            onSelectUser={(u) => handleNavigateToUser(u)}
            onOpenAccountabilityHub={(targetUser) => handleOpenAccountabilityHub(targetUser)}
            onToggleHubPrivacy={handleToggleHubPrivacy}
            onSelectCommunity={(comm) => handleOpenCommunityHub(comm)}
            onOpenShare={(post) => setSelectedPostForShare(post)}
            onToggleSave={handleToggleSave}
            onDeletePost={handleDeletePost}
          />
        );
      case 'accountability_hub':
        return (
          <AccountabilityHubScreen
            currentUser={currentUser}
            hubUser={accountabilityHubUser}
            toDoList={toDoList}
            completedChallenges={challenges.filter((c) => c.status === 'completed' || c.current >= c.target)}
            allChallenges={challenges}
            joinedCommunities={communities.filter((c) => c.isJoined)}
            allCommunities={communities}
            onBack={() => handleSelectScreen(previousScreen === 'accountability_hub' ? 'home' : previousScreen)}
            onToggleToDo={handleToggleToDo}
            onAddCustomToDo={handleAddCustomToDo}
            onDeleteToDo={handleDeleteToDo}
            onSelectCommunity={(comm) => handleOpenCommunityHub(comm)}
            onSelectChallenge={(ch) => handleOpenChallengeDetail(ch)}
            onNavigateUser={(user) => handleNavigateToUser(user)}
            onToggleHubPrivacy={handleToggleHubPrivacy}
          />
        );
      case 'cohort_discussions': {
        const targetCohort = activeChallenge || challenges[0];
        if (!targetCohort) {
          return (
            <div className="py-20 text-center px-4">
              <p className="text-sm font-semibold text-white mb-2">No Challenges Active</p>
              <button
                onClick={() => handleSelectScreen('challenges')}
                className="px-4 py-2 rounded-xl bg-[#2166FF] text-white text-xs font-semibold cursor-pointer"
              >
                Explore Challenges
              </button>
            </div>
          );
        }
        return (
          <CohortDiscussionsScreen
            challenge={targetCohort}
            challenges={challenges}
            currentUser={currentUser}
            initialViewMode={cohortViewMode}
            onBack={() => handleSelectScreen(previousScreen === 'cohort_discussions' ? 'challenges' : previousScreen)}
            onSelectChallengeCohort={(ch) => setActiveChallenge(ch)}
            onNavigateUser={(user) => handleNavigateToUser(user)}
            onToggleFollow={handleToggleFollow}
            onAddProof={handleAddCohortProof}
          />
        );
      }
      case 'community_hub': {
        const targetCommunity = activeCommunity || communities[0];
        if (!targetCommunity) {
          return (
            <div className="py-20 text-center px-4">
              <p className="text-sm font-semibold text-white mb-2">No Communities Found</p>
              <button
                onClick={() => handleSelectScreen('communities')}
                className="px-4 py-2 rounded-xl bg-[#2166FF] text-white text-xs font-semibold cursor-pointer"
              >
                Browse Communities
              </button>
            </div>
          );
        }
        return (
          <CommunityHubScreen
            community={targetCommunity}
            currentUser={currentUser}
            onBack={() => handleSelectScreen(previousScreen === 'community_hub' ? 'communities' : previousScreen)}
            onNavigateUser={(user) => handleNavigateToUser(user)}
            onToggleFollow={handleToggleFollow}
            onUpdateGuidelines={handleUpdateCommunityGuidelines}
            onApproveJoinRequest={handleApproveJoinRequest}
            onDeclineJoinRequest={handleDeclineJoinRequest}
            onRequestJoin={handleRequestJoinCommunity}
            communityPosts={communityPosts}
            onCreateDiscussion={handleCreateCommunityDiscussion}
            onVoteDiscussion={handleVoteDiscussion}
            onOpenComments={(post) => {
              const postWithComments = posts.find((item) => item.id === post.id);
              setSelectedPostForComments(postWithComments || post);
            }}
            onOpenShare={(post) => setSelectedPostForShare(post)}
          />
        );
      }
      case 'challenge_detail': {
        const targetCh = activeChallenge || challenges[0];
        if (!targetCh) {
          return (
            <div className="py-20 text-center px-4">
              <p className="text-sm font-semibold text-white mb-2">Challenge Not Found</p>
              <button
                onClick={() => handleSelectScreen('challenges')}
                className="px-4 py-2 rounded-xl bg-[#2166FF] text-white text-xs font-semibold cursor-pointer"
              >
                Back to Challenges
              </button>
            </div>
          );
        }
        return (
          <ChallengeDetailScreen
            challenge={targetCh}
            currentUser={currentUser}
            onBack={() => handleSelectScreen(previousScreen === 'challenge_detail' ? 'challenges' : previousScreen)}
            onCheckInWithProof={handleCheckInWithProof}
            onAddToTodoList={handleAddToTodoList}
            onOpenCohortChat={() => handleOpenCohortDiscussions(targetCh)}
            onToggleJoin={handleToggleJoinChallenge}
            onRestartChallenge={handleRestartChallenge}
            onDeleteChallenge={handleDeleteChallenge}
            isInTodoList={toDoList.some((t) => t.challengeId === targetCh.id)}
          />
        );
      }
      case 'my_joined_communities':
        return (
          <JoinedCommunitiesScreen
            communities={communities}
            onBack={() => handleSelectScreen(previousScreen === 'my_joined_communities' ? 'communities' : previousScreen)}
            onSelectCommunity={(comm) => handleOpenCommunityHub(comm)}
            onExploreMore={() => handleSelectScreen('communities')}
          />
        );
      default:
        return null;
    }
  };

  // Render Onboarding Screen if onboarding has not been completed
  if (!isOnboardingDone) {
    return (
      <OnboardingAuthScreen
        onComplete={handleOnboardingComplete}
        initialUser={currentUser}
        allCommunities={communities}
      />
    );
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#2166FF] selection:text-white flex flex-col font-sans">
      {/* Top Banner on Desktop allowing view switching and showcasing the design */}
      <div className="hidden lg:flex items-center justify-between px-6 py-2.5 bg-[#080B10] border-b border-[#20242C] text-xs text-[#9298A3] z-50">
        <div className="flex items-center gap-3">
          <span className="font-extrabold text-white tracking-wider">
            DAILY<span className="text-[#2166FF]">.</span>
          </span>
          <span className="text-[#20242C]">|</span>
          <span className="font-medium tracking-wide text-white/80">
            SHOW UP. SHOW THE WORK.
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setDisplayMode('app')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              displayMode === 'app'
                ? 'bg-[#2166FF] text-white'
                : 'bg-[#101010] text-[#9298A3] hover:text-white border border-[#20242C]'
            }`}
          >
            <Smartphone size={14} />
            <span>Mobile Device View</span>
          </button>

          <button
            onClick={() => setDisplayMode('board')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              displayMode === 'board'
                ? 'bg-[#2166FF] text-white'
                : 'bg-[#101010] text-[#9298A3] hover:text-white border border-[#20242C]'
            }`}
          >
            <Columns size={14} />
            <span>5 Screens Concept Board</span>
          </button>

          <button
            onClick={() => setDisplayMode('fluid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              displayMode === 'fluid'
                ? 'bg-[#2166FF] text-white'
                : 'bg-[#101010] text-[#9298A3] hover:text-white border border-[#20242C]'
            }`}
          >
            <Monitor size={14} />
            <span>Expanded Desktop</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-1 flex justify-center items-start w-full bg-black">
        {displayMode === 'board' ? (
          /* 5 Screens Concept Board Showcase */
          <div className="w-full py-8 px-4 overflow-x-auto">
            <div className="max-w-7xl mx-auto mb-6 text-center">
              <h2 className="text-2xl font-extrabold text-white tracking-tight mb-1">
                DAILY<span className="text-[#2166FF]">.</span> UI Concept Sheet
              </h2>
              <p className="text-xs text-[#9298A3]">
                Full 5-Screen Interactive Suite: Home · Challenges · Create Post · Communities · Profile
              </p>
            </div>

            <div className="flex items-start justify-center gap-6 pb-12 min-w-[1700px]">
              {/* Screen 1: Home */}
              <div className="w-[340px] shrink-0 flex flex-col items-center">
                <span className="text-xs font-semibold text-[#9298A3] mb-2 uppercase tracking-wider">
                  1. Home
                </span>
                <div className="w-full bg-black rounded-2xl border border-[#20242C] shadow-2xl overflow-hidden h-[740px] flex flex-col relative">
                  <TopHeader
                    currentScreen="home"
                    currentUser={currentUser}
                    onOpenSearch={() => setIsSearchOpen(true)}
                    onOpenSettings={() => setIsSettingsOpen(true)}
                    onOpenNotifications={() => setIsNotificationsOpen(true)}
                    onNavigateProfile={() => handleSelectScreen('profile')}
                    onOpenAccountabilityHub={handleOpenAccountabilityHub}
                  />
                  <div className="flex-1 overflow-y-auto no-scrollbar">
                    {renderScreenContent('home')}
                  </div>
                  <Navigation
                    currentScreen="home"
                    onSelectScreen={handleSelectScreen}
                  />
                </div>
              </div>

              {/* Screen 2: Challenges */}
              <div className="w-[340px] shrink-0 flex flex-col items-center">
                <span className="text-xs font-semibold text-[#9298A3] mb-2 uppercase tracking-wider">
                  2. Challenges
                </span>
                <div className="w-full bg-black rounded-2xl border border-[#20242C] shadow-2xl overflow-hidden h-[740px] flex flex-col relative">
                  <TopHeader
                    currentScreen="challenges"
                    currentUser={currentUser}
                    onOpenSearch={() => setIsSearchOpen(true)}
                    onOpenSettings={() => setIsSettingsOpen(true)}
                    onOpenNotifications={() => setIsNotificationsOpen(true)}
                    onNavigateProfile={() => handleSelectScreen('profile')}
                    onOpenAccountabilityHub={handleOpenAccountabilityHub}
                  />
                  <div className="flex-1 overflow-y-auto no-scrollbar">
                    {renderScreenContent('challenges')}
                  </div>
                  <Navigation
                    currentScreen="challenges"
                    onSelectScreen={handleSelectScreen}
                  />
                </div>
              </div>

              {/* Screen 3: Create Post */}
              <div className="w-[340px] shrink-0 flex flex-col items-center">
                <span className="text-xs font-semibold text-[#9298A3] mb-2 uppercase tracking-wider">
                  3. Create Post
                </span>
                <div className="w-full bg-black rounded-2xl border border-[#20242C] shadow-2xl overflow-hidden h-[740px] flex flex-col relative">
                  <div className="flex-1 overflow-y-auto no-scrollbar">
                    {renderScreenContent('create')}
                  </div>
                </div>
              </div>

              {/* Screen 4: Communities */}
              <div className="w-[340px] shrink-0 flex flex-col items-center">
                <span className="text-xs font-semibold text-[#9298A3] mb-2 uppercase tracking-wider">
                  4. Communities
                </span>
                <div className="w-full bg-black rounded-2xl border border-[#20242C] shadow-2xl overflow-hidden h-[740px] flex flex-col relative">
                  <TopHeader
                    currentScreen="communities"
                    currentUser={currentUser}
                    onOpenSearch={() => setIsSearchOpen(true)}
                    onOpenSettings={() => setIsSettingsOpen(true)}
                    onOpenNotifications={() => setIsNotificationsOpen(true)}
                    onNavigateProfile={() => handleSelectScreen('profile')}
                    onOpenAccountabilityHub={handleOpenAccountabilityHub}
                  />
                  <div className="flex-1 overflow-y-auto no-scrollbar">
                    {renderScreenContent('communities')}
                  </div>
                  <Navigation
                    currentScreen="communities"
                    onSelectScreen={handleSelectScreen}
                  />
                </div>
              </div>

              {/* Screen 5: Profile */}
              <div className="w-[340px] shrink-0 flex flex-col items-center">
                <span className="text-xs font-semibold text-[#9298A3] mb-2 uppercase tracking-wider">
                  5. Profile
                </span>
                <div className="w-full bg-black rounded-2xl border border-[#20242C] shadow-2xl overflow-hidden h-[740px] flex flex-col relative">
                  <TopHeader
                    currentScreen="profile"
                    currentUser={currentUser}
                    onOpenSearch={() => setIsSearchOpen(true)}
                    onOpenSettings={() => setIsSettingsOpen(true)}
                    onOpenNotifications={() => setIsNotificationsOpen(true)}
                    onNavigateProfile={() => handleSelectScreen('profile')}
                    onOpenAccountabilityHub={handleOpenAccountabilityHub}
                  />
                  <div className="flex-1 overflow-y-auto no-scrollbar">
                    {renderScreenContent('profile')}
                  </div>
                  <Navigation
                    currentScreen="profile"
                    onSelectScreen={handleSelectScreen}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Clean Modern Web App View with Fixed Sticky Bottom Navigation */
          <div
            className={`w-full flex flex-col relative bg-black transition-all ${
              displayMode === 'app'
                ? 'max-w-md w-full h-[100dvh] max-h-[100dvh] sm:h-[94vh] sm:my-auto sm:rounded-2xl sm:border sm:border-[#20242C]/70 shadow-2xl overflow-hidden'
                : 'max-w-2xl w-full h-[100dvh] max-h-[100dvh] sm:h-[94vh] sm:my-auto sm:rounded-2xl sm:border sm:border-[#20242C]/70 shadow-2xl overflow-hidden'
            }`}
          >
            {/* Top Bar on primary browsing screens */}
            {['home', 'challenges', 'communities', 'profile'].includes(currentScreen) && (
              <TopHeader
                currentScreen={currentScreen}
                currentUser={currentUser}
                onOpenSearch={() => setIsSearchOpen(true)}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onOpenNotifications={() => setIsNotificationsOpen(true)}
                onNavigateProfile={() => handleSelectScreen('profile')}
                onOpenAccountabilityHub={handleOpenAccountabilityHub}
              />
            )}

            {/* Screen Content - Internal Inertia Scrollable Container */}
            <div className="flex-1 w-full bg-black overflow-y-auto overscroll-contain">
              {renderScreenContent(currentScreen)}
            </div>

            {/* Bottom Tab Bar (Pinned & Always Visible at Bottom on browsing screens) */}
            {currentScreen !== 'create' && (
              <div className="shrink-0 w-full z-40 bg-black">
                <Navigation
                  currentScreen={currentScreen}
                  onSelectScreen={handleSelectScreen}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Interactive Modals */}
      <CommentsModal
        post={selectedPostForComments}
        currentUser={currentUser}
        onClose={() => setSelectedPostForComments(null)}
        onAddComment={handleAddComment}
        onDeleteComment={handleDeleteComment}
        onNavigateAuthorProfile={(author) => handleNavigateToUser(author)}
      />

      <ChallengeDetailModal
        challenge={selectedChallenge}
        onClose={() => setSelectedChallenge(null)}
        onIncrementProgress={handleIncrementChallenge}
        onToggleJoin={handleToggleJoinChallenge}
      />

      {isEditProfileOpen && (
        <EditProfileModal
          user={currentUser}
          existingUsernames={allCreators.map((c) => c.username).concat(posts.map((p) => p.author.username))}
          onClose={() => setIsEditProfileOpen(false)}
          onSave={handleSaveProfile}
        />
      )}

      {isSearchOpen && (
        <SearchModal
          posts={posts}
          communities={communities}
          challenges={challenges}
          creators={allCreators}
          onClose={() => setIsSearchOpen(false)}
          onSelectPost={(post) => setSelectedPostForComments(post)}
          onSelectCommunity={(comm) => handleOpenCommunityHub(comm)}
          onSelectChallenge={(ch) => handleOpenChallengeDetail(ch)}
          onNavigateAuthorProfile={(author) => handleNavigateToUser(author)}
        />
      )}

      {isCreateChallengeOpen && (
        <CreateChallengeModal
          onClose={() => setIsCreateChallengeOpen(false)}
          onCreate={handleCreateChallenge}
          creatorName={currentUser.name}
          creatorUsername={currentUser.username}
        />
      )}

      {isCreateCommunityOpen && (
        <CreateCommunityModal
          onClose={() => setIsCreateCommunityOpen(false)}
          onCreate={handleCreateCommunity}
          creatorName={currentUser.name}
          creatorUsername={currentUser.username}
        />
      )}

      {isNotificationsOpen && (
        <NotificationsModal
          notifications={notifications}
          onClose={() => setIsNotificationsOpen(false)}
          onMarkAllRead={handleMarkAllNotificationsRead}
          onAcceptSquadInvite={handleAcceptSquadInvite}
          onDeclineSquadInvite={handleDeclineSquadInvite}
        />
      )}

      {isSettingsOpen && (
        <SettingsModal
          currentUser={currentUser}
          onToggleHubPrivacy={handleToggleHubPrivacy}
          onRestartOnboarding={() => {
            setIsSettingsOpen(false);
            setIsOnboardingDone(false);
          }}
          onResetToFreshData={handleResetToFreshData}
          onSignOut={handleSignOut}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      <PostMenuModal
        post={selectedPostForMenu}
        currentUser={currentUser}
        onClose={() => setSelectedPostForMenu(null)}
        onToggleSave={handleToggleSave}
        onCopyLink={() => {
          navigator.clipboard?.writeText(window.location.href);
          showToast('Link copied to clipboard');
        }}
        onOpenShareToCommunity={(post) => setSelectedPostForShare(post)}
        onDeletePost={handleDeletePost}
      />

      {/* Share to Community & Quick Share Modal */}
      <ShareModal
        isOpen={!!selectedPostForShare}
        post={selectedPostForShare}
        currentUser={currentUser}
        joinedCommunities={communities.filter((c) => c.isJoined)}
        onClose={() => setSelectedPostForShare(null)}
        onShareToCommunity={handleSharePostToCommunity}
        onCopyLink={() => {
          navigator.clipboard?.writeText(window.location.href);
          showToast('Post link copied to clipboard');
        }}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-[#101010] border border-[#20242C] text-white px-4 py-2 rounded-full text-xs font-semibold shadow-2xl flex items-center gap-2 animate-bounce">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2166FF]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
