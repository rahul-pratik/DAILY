/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { OTHER_USERS } from './data/initialData';
import { Author, Challenge, CohortProof, Community, JoinRequest, NotificationItem, Post, PurposeLabel, ScreenType, Squad, ToDoItem } from './types';
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
import { supabase } from './lib/supabase';
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
  const [posts, setPosts] = useState<Post[]>(() => StorageService.getPosts() ?? []);
  const [challenges, setChallenges] = useState<Challenge[]>(() => StorageService.getChallenges() ?? []);
  const [communities, setCommunities] = useState<Community[]>(() => StorageService.getCommunities() ?? []);
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => StorageService.getNotifications() ?? []);
  const [allCreators, setAllCreators] = useState<Author[]>(() => StorageService.getCreators() ?? []);
  const [toDoList, setToDoList] = useState<ToDoItem[]>(() => StorageService.getTodos() ?? []);
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  const [activeCommunity, setActiveCommunity] = useState<Community | null>(null);
  const [squads, setSquads] = useState<Squad[]>(() => StorageService.getSquads() ?? []);
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

  // Fetch initial empty or saved states from Supabase upon authentication
  const fetchSupabaseData = async (userAuthId: string) => {
    setIsLoadingSupabase(true);
    try {
      // 1. Fetch user profile from public.profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userAuthId)
        .maybeSingle();

      if (profile) {
        const syncedUser: Author = {
          id: profile.id,
          name: profile.name || 'Daily Builder',
          username: profile.username || 'builder',
          avatar: profile.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
          bio: profile.bio || '',
          followersCount: profile.followers_count || 0,
          followingCount: profile.following_count || 0,
          accountabilityHubPrivacy: (profile.accountability_hub_privacy as 'public' | 'private') || 'public',
          isCurrentUser: true,
        };
        setCurrentUser(syncedUser);
        setViewingUser(syncedUser);
        StorageService.saveCurrentUser(syncedUser);
      }

      // 2. Fetch posts from public.posts
      const { data: dbPosts, error: postsErr } = await supabase
        .from('posts')
        .select('*, author:profiles(*)')
        .order('created_at', { ascending: false });

      if (!postsErr && dbPosts) {
        const mappedPosts: Post[] = dbPosts.map((p: any) => ({
          id: p.id,
          author: {
            id: p.author?.id || p.author_id,
            name: p.author?.name || 'Creator',
            username: p.author?.username || 'creator',
            avatar: p.author?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
            isCurrentUser: p.author?.id === userAuthId,
          },
          content: p.content,
          purpose: p.purpose,
          timestamp: new Date(p.created_at).toLocaleDateString(),
          likesCount: p.likes_count || 0,
          commentsCount: p.comments_count || 0,
          isLiked: false,
          isSaved: false,
          mediaUrls: p.media_urls || [],
          mediaUrl: p.media_urls?.[0],
          mediaType: p.media_type === 'none' ? undefined : p.media_type,
        }));
        setPosts(mappedPosts);
        StorageService.savePosts(mappedPosts);
      } else if (!postsErr && !dbPosts) {
        setPosts([]);
        StorageService.savePosts([]);
      }

      // 3. Fetch challenges from public.challenges
      const { data: dbChallenges, error: chErr } = await supabase
        .from('challenges')
        .select('*')
        .order('created_at', { ascending: false });

      if (!chErr && dbChallenges) {
        const mappedChallenges: Challenge[] = dbChallenges.map((c: any) => ({
          id: c.id,
          title: c.title,
          description: c.description,
          whatYouPerform: c.what_you_perform,
          category: c.category,
          type: c.type,
          current: 0,
          target: c.target,
          unit: c.unit,
          durationDays: c.duration_days,
          maxSquadSize: c.max_squad_size,
          tags: c.tags || [],
          icon: c.icon,
          status: c.status,
          joined: false,
        }));
        setChallenges(mappedChallenges);
        StorageService.saveChallenges(mappedChallenges);
      } else if (!chErr && !dbChallenges) {
        setChallenges([]);
        StorageService.saveChallenges([]);
      }

      // 4. Fetch communities from public.communities
      const { data: dbCommunities, error: commErr } = await supabase
        .from('communities')
        .select('*')
        .order('created_at', { ascending: false });

      if (!commErr && dbCommunities) {
        const mappedCommunities: Community[] = dbCommunities.map((cm: any) => ({
          id: cm.id,
          name: cm.name,
          description: cm.description,
          icon: cm.icon || 'code',
          accentColor: cm.accent_color || '#2166FF',
          membersCount: cm.members_count || 1,
          isJoined: false,
          category: cm.category,
          isPublic: cm.is_public ?? true,
          tags: cm.tags || [],
          creator: {
            id: cm.creator_id || 'creator',
            name: 'Community Founder',
            username: 'founder',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
          },
          coverUrl: cm.cover_url,
          guidelines: cm.guidelines || [],
        }));
        setCommunities(mappedCommunities);
        StorageService.saveCommunities(mappedCommunities);
      } else if (!commErr && !dbCommunities) {
        setCommunities([]);
        StorageService.saveCommunities([]);
      }

      // 5. Fetch todos for this user
      const { data: dbTodos, error: todosErr } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', userAuthId)
        .order('created_at', { ascending: false });

      if (!todosErr && dbTodos) {
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
      } else if (!todosErr && !dbTodos) {
        setToDoList([]);
        StorageService.saveTodos([]);
      }
    } catch (e) {
      console.warn('Supabase query exception (proceeding with clean local state):', e);
    } finally {
      setIsLoadingSupabase(false);
    }
  };

  // Listen for Supabase session and auth state changes
  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const u = session.user;
        const meta = u.user_metadata || {};
        const derivedName = meta.name || meta.full_name || u.email?.split('@')[0] || 'Daily Builder';
        const derivedUsername = meta.username || u.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9_.]/g, '') || 'builder';
        const derivedAvatar = meta.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80';

        const authUser: Author = {
          ...currentUser,
          id: u.id,
          name: derivedName,
          username: derivedUsername,
          avatar: derivedAvatar,
          isCurrentUser: true,
        };

        setCurrentUser(authUser);
        setViewingUser(authUser);
        StorageService.saveCurrentUser(authUser);
        StorageService.setAuthSession({
          provider: (u.app_metadata?.provider as any) || 'email',
          email: u.email,
        });

        // Check if user has already completed onboarding profile setup
        const hasCompletedOnboarding = StorageService.isOnboardingCompleted() || meta.onboarding_completed === true;
        if (hasCompletedOnboarding) {
          StorageService.setOnboardingCompleted(true);
          setIsOnboardingDone(true);
          fetchSupabaseData(u.id);
        } else {
          // Keep onboarding active so Google login presents Screen 2 for choosing name & unique handle
          StorageService.setOnboardingCompleted(false);
          setIsOnboardingDone(false);
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user) {
        const u = session.user;
        const meta = u.user_metadata || {};
        const derivedName = meta.name || meta.full_name || u.email?.split('@')[0] || 'Daily Builder';
        const derivedUsername = meta.username || u.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9_.]/g, '') || 'builder';
        const derivedAvatar = meta.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80';

        const authUser: Author = {
          ...currentUser,
          id: u.id,
          name: derivedName,
          username: derivedUsername,
          avatar: derivedAvatar,
          isCurrentUser: true,
        };

        setCurrentUser(authUser);
        setViewingUser(authUser);
        StorageService.saveCurrentUser(authUser);
        StorageService.setAuthSession({
          provider: (u.app_metadata?.provider as any) || 'email',
          email: u.email,
        });

        const hasCompletedOnboarding = StorageService.isOnboardingCompleted() || meta.onboarding_completed === true;
        if (hasCompletedOnboarding) {
          StorageService.setOnboardingCompleted(true);
          setIsOnboardingDone(true);
          fetchSupabaseData(u.id);
          showToast(`Authenticated with Supabase as ${derivedName}!`);
        } else {
          // Keep onboarding active so user completes Screen 2 (name, handle, bio)
          StorageService.setOnboardingCompleted(false);
          setIsOnboardingDone(false);
          showToast(`Signed in with Google! Set your unique handle to finalize.`);
        }
      } else if (event === 'SIGNED_OUT') {
        StorageService.setOnboardingCompleted(false);
        setIsOnboardingDone(false);
        showToast('Signed out of Supabase session.');
      }
    });

    return () => {
      subscription.unsubscribe();
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
        followersCount: 120,
        followingCount: 45,
      });
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
  const handleToggleLike = (postId: string) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const isLiked = !post.isLiked;
          return {
            ...post,
            isLiked,
            likesCount: isLiked ? post.likesCount + 1 : Math.max(0, post.likesCount - 1),
          };
        }
        return post;
      })
    );
  };

  // Interactions: Save Post
  const handleToggleSave = (postId: string) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const isSaved = !post.isSaved;
          showToast(isSaved ? 'Post saved to your profile' : 'Post removed from saved');
          return {
            ...post,
            isSaved,
          };
        }
        return post;
      })
    );
  };

  // Interactions: Add Comment
  const handleAddComment = (postId: string, text: string) => {
    const newComment = {
      id: `c_${Date.now()}`,
      author: currentUser,
      text,
      timestamp: 'Just now',
      likes: 0,
    };

    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const updatedComments = [newComment, ...(post.comments || [])];
          return {
            ...post,
            commentsCount: post.commentsCount + 1,
            comments: updatedComments,
          };
        }
        return post;
      })
    );

    // Update active modal reference
    setSelectedPostForComments((prev) =>
      prev && prev.id === postId
        ? {
            ...prev,
            commentsCount: prev.commentsCount + 1,
            comments: [newComment, ...(prev.comments || [])],
          }
        : prev
    );

    showToast('Comment posted');
  };

  // Interactions: Create Post
  const handleCreatePost = (data: {
    content: string;
    purpose?: PurposeLabel;
    mediaUrls?: string[];
    audience?: string;
  }) => {
    const newPost: Post = {
      id: `post_${Date.now()}`,
      author: currentUser,
      timestamp: 'Just now',
      purpose: data.purpose,
      content: data.content,
      mediaUrls: data.mediaUrls,
      likesCount: 1,
      commentsCount: 0,
      isLiked: true,
      isSaved: false,
    };

    setPosts([newPost, ...posts]);
    setCurrentScreen('home');
    showToast('Your work has been shared to Daily');
  };

  // Interactions: Share Post to Community as a post
  const handleSharePostToCommunity = ({
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

    const newPost: Post = {
      id: `post_shared_${Date.now()}`,
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
      imageUrl: originalPost.imageUrl || (originalPost.mediaUrls && originalPost.mediaUrls[0]),
      mediaUrls: originalPost.mediaUrls,
    };

    setPosts((prev) => [newPost, ...prev]);
    showToast(`Shared to ${targetCommunity.name} as a post!`);
    setSelectedPostForShare(null);
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
  const handleToggleJoinChallenge = (challengeId: string) => {
    let starting = false;

    setChallenges((prev) =>
      prev.map((ch) => {
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
      })
    );

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
  };

  // Interactions: Restart Challenge (Resets to Day 1)
  const handleRestartChallenge = (challengeId: string) => {
    setChallenges((prev) =>
      prev.map((ch) => {
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
      })
    );

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
  const handleCreateChallenge = (data: Partial<Challenge>) => {
    const newChallenge: Challenge = {
      id: `ch_${Date.now()}`,
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

    setChallenges([newChallenge, ...challenges]);
    showToast(`🎉 New Challenge created: "${newChallenge.title}" (Day 1)`);
  };

  // Interactions: Add Cohort Proof & update challenge progress
  const handleAddCohortProof = (challengeId: string, proof: CohortProof) => {
    setChallenges((prev) =>
      prev.map((ch) => {
        if (ch.id === challengeId) {
          const existing = ch.squadProofs || [];
          return {
            ...ch,
            squadProofs: [proof, ...existing],
            current: Math.min((ch.current || 0) + 1, ch.target),
          };
        }
        return ch;
      })
    );
    showToast(`✓ Photo proof recorded for ${proof.author.name}!`);
  };

  // Squad Management Handlers
  const handleCreateSquad = (data: Partial<Squad>) => {
    const newSquad: Squad = {
      id: `squad_${Date.now()}`,
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
      members: data.members || [
        {
          id: currentUser.id,
          name: currentUser.name,
          username: currentUser.username,
          avatar: currentUser.avatar,
          dayReached: 1,
          role: 'creator',
        }
      ],
    };

    setSquads(prev => [newSquad, ...prev]);

    // Send invitations to invited members
    (data.members || []).forEach(m => {
      if (m.username !== currentUser.username) {
        const notif: NotificationItem = {
          id: `notif_sq_${Date.now()}_${m.username}`,
          user: currentUser,
          action: `invited you to join squad "${newSquad.name}"`,
          target: `For ${newSquad.challengeTitle || 'Sprint'} (${newSquad.members.length}/${newSquad.requiredSize} members)`,
          time: 'Just now',
          read: false,
          type: 'squad_invitation',
          squadInvitation: {
            squadId: newSquad.id,
            squadName: newSquad.name,
            challengeTitle: newSquad.challengeTitle || 'Squad Sprint',
            requiredMembers: newSquad.requiredSize,
            status: 'pending',
          }
        };
        setNotifications(prev => [notif, ...prev]);
      }
    });

    showToast(`🎉 Squad "${newSquad.name}" created! Invitations sent.`);
  };

  const handleInviteMemberToSquad = (squadId: string, username: string) => {
    const targetSquad = squads.find(s => s.id === squadId);
    if (!targetSquad) return;

    const foundUser = allCreators.find(u => u.username === username);
    const newMember: Author = foundUser || {
      id: `u_${username}`,
      name: username,
      username: username,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    };

    // Send squad invitation notification
    const newNotif: NotificationItem = {
      id: `notif_invite_${Date.now()}`,
      user: currentUser,
      action: `invited you to join squad "${targetSquad.name}"`,
      target: `For ${targetSquad.challengeTitle || 'Challenge Sprint'} (${targetSquad.members.length + 1}/${targetSquad.requiredSize} members)`,
      time: 'Just now',
      read: false,
      type: 'squad_invitation',
      squadInvitation: {
        squadId: targetSquad.id,
        squadName: targetSquad.name,
        challengeTitle: targetSquad.challengeTitle || 'Squad Sprint',
        requiredMembers: targetSquad.requiredSize,
        status: 'pending',
      }
    };
    setNotifications(prev => [newNotif, ...prev]);

    // Add to squad roster
    setSquads(prev => prev.map(sq => {
      if (sq.id === squadId && !sq.members.some(m => m.username === username)) {
        return {
          ...sq,
          members: [
            ...sq.members,
            {
              id: newMember.id,
              name: newMember.name,
              username: newMember.username,
              avatar: newMember.avatar,
              dayReached: 1,
              role: 'member',
            }
          ]
        };
      }
      return sq;
    }));

    showToast(`✉️ Squad invitation sent to @${username}!`);
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

  const handleAcceptSquadInvite = (squadId: string, notifId: string) => {
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

    setSquads(prev => prev.map(sq => {
      if (sq.id === squadId && !sq.members.some(m => m.username === currentUser.username)) {
        return {
          ...sq,
          members: [
            ...sq.members,
            {
              id: currentUser.id,
              name: currentUser.name,
              username: currentUser.username,
              avatar: currentUser.avatar,
              dayReached: 1,
              role: 'member',
            }
          ]
        };
      }
      return sq;
    }));

    showToast(`✓ Accepted squad invitation! You joined the roster.`);
  };

  const handleDeclineSquadInvite = (squadId: string, notifId: string) => {
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
  };

  // Interactions: Toggle Community Join
  const handleToggleJoinCommunity = (communityId: string) => {
    setCommunities((prev) =>
      prev.map((c) => {
        if (c.id === communityId) {
          const isJoined = !c.isJoined;
          showToast(isJoined ? `Joined ${c.name}` : `Left ${c.name}`);
          return {
            ...c,
            isJoined,
            membersCount: isJoined ? c.membersCount + 1 : Math.max(0, c.membersCount - 1),
          };
        }
        return c;
      })
    );
  };

  // Create Community handler
  const handleCreateCommunity = (data: Partial<Community>) => {
    const newCommunity: Community = {
      id: `comm_${Date.now()}`,
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

    setCommunities([newCommunity, ...communities]);
    showToast(`🎉 Community created: "${newCommunity.name}"`);
  };

  // Profile Save
  const handleSaveProfile = (updated: { 
    name: string; 
    username: string; 
    bio: string; 
    avatar?: string; 
    bannerUrl?: string; 
    accountabilityHubPrivacy?: 'public' | 'private' 
  }) => {
    const updatedUser: Author = {
      ...currentUser,
      name: updated.name,
      username: updated.username,
      bio: updated.bio,
      ...(updated.avatar ? { avatar: updated.avatar } : {}),
      ...(updated.bannerUrl ? { bannerUrl: updated.bannerUrl } : {}),
      ...(updated.accountabilityHubPrivacy ? { accountabilityHubPrivacy: updated.accountabilityHubPrivacy } : {}),
    };
    setCurrentUser(updatedUser);
    setViewingUser(updatedUser);
    setPosts((prev) =>
      prev.map((p) =>
        p.author.username === currentUser.username || p.author.id === currentUser.id
          ? { ...p, author: { ...p.author, ...updatedUser } }
          : p
      )
    );
    showToast('Profile, avatar & banner updated');
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

  const handleCheckInWithProof = (challengeId: string, note: string, photoUrl?: string) => {
    handleIncrementChallenge(challengeId);
    if (note || photoUrl) {
      showToast(`Proof logged with ${photoUrl ? 'photo' : 'note'}!`);
    }
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

    // Check if the user is authenticated with Supabase to fetch initial data or start fresh immediately
    if (newUser.id && !newUser.id.startsWith('user_')) {
      fetchSupabaseData(newUser.id);
    } else {
      // Start fresh with clean empty state immediately
      setPosts([]);
      setChallenges([]);
      setCommunities([]);
      setToDoList([]);
      setNotifications([]);
      setSquads([]);
      setActiveChallenge(null);
      setActiveCommunity(null);
      StorageService.savePosts([]);
      StorageService.saveChallenges([]);
      StorageService.saveCommunities([]);
      StorageService.saveTodos([]);
      StorageService.saveNotifications([]);
      StorageService.saveSquads([]);
    }
    showToast(`Welcome, ${newUser.name}! Fresh account ready.`);
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
        onClose={() => setSelectedPostForMenu(null)}
        onToggleSave={handleToggleSave}
        onCopyLink={() => {
          navigator.clipboard?.writeText(window.location.href);
          showToast('Link copied to clipboard');
        }}
        onOpenShareToCommunity={(post) => setSelectedPostForShare(post)}
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
