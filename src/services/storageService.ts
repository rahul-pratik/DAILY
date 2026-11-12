import { Author, Challenge, Comment, Community, CommunityPost, NotificationItem, Post, Squad, ToDoItem } from '../types';

const KEYS = {
  USER: 'daily_app_current_user',
  ONBOARDING_DONE: 'daily_app_onboarding_done',
  AUTH_SESSION: 'daily_app_auth_session',
  POSTS: 'daily_app_posts',
  COMMUNITY_POSTS: 'daily_app_community_posts',
  CHALLENGES: 'daily_app_challenges',
  COMMUNITIES: 'daily_app_communities',
  TODOS: 'daily_app_todos',
  NOTIFICATIONS: 'daily_app_notifications',
  CREATORS: 'daily_app_creators',
  SQUADS: 'daily_app_squads',
  COMMENTS_REGISTRY: 'daily_app_comments_registry',
  MUTED_CHALLENGES: 'daily_app_muted_challenges',
  MUTED_COMMUNITIES: 'daily_app_muted_communities',
  MUTED_USERS: 'daily_app_muted_users',
  DELETED_SQUADS: 'daily_app_deleted_squads',
  CROSS_POST_TO_FEED: 'daily_app_cross_post_to_feed',
  CUSTOM_HASHTAGS: 'daily_app_custom_hashtags',
};

// Safe JSON parser
function safeParse<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item) as T;
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
    return fallback;
  }
}

// Safe JSON setter
function safeSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving ${key} to storage:`, e);
  }
}

export const StorageService = {
  // Onboarding Status
  isOnboardingCompleted(): boolean {
    return safeParse<boolean>(KEYS.ONBOARDING_DONE, false);
  },

  setOnboardingCompleted(completed: boolean): void {
    safeSet(KEYS.ONBOARDING_DONE, completed);
  },

  // Auth Session
  getAuthSession(): { provider: 'google' | 'email' | 'guest'; email?: string } | null {
    return safeParse(KEYS.AUTH_SESSION, null);
  },

  setAuthSession(session: { provider: 'google' | 'email' | 'guest'; email?: string } | null): void {
    if (!session) {
      localStorage.removeItem(KEYS.AUTH_SESSION);
    } else {
      safeSet(KEYS.AUTH_SESSION, session);
    }
  },

  // Current User Profile
  getCurrentUser(): Author | null {
    return safeParse<Author | null>(KEYS.USER, null);
  },

  saveCurrentUser(user: Author): void {
    safeSet(KEYS.USER, user);
  },

  // Posts Feed
  getPosts(): Post[] | null {
    return safeParse<Post[] | null>(KEYS.POSTS, null);
  },

  savePosts(posts: Post[]): void {
    safeSet(KEYS.POSTS, posts);
  },

  addPost(post: Post): Post[] {
    const current = this.getPosts() || [];
    const updated = [post, ...current];
    this.savePosts(updated);
    return updated;
  },

  // Community Discussions & Posts
  getCommunityPosts(): CommunityPost[] | null {
    return safeParse<CommunityPost[] | null>(KEYS.COMMUNITY_POSTS, null);
  },

  saveCommunityPosts(posts: CommunityPost[]): void {
    safeSet(KEYS.COMMUNITY_POSTS, posts);
  },

  // Challenges
  getChallenges(): Challenge[] | null {
    return safeParse<Challenge[] | null>(KEYS.CHALLENGES, null);
  },

  saveChallenges(challenges: Challenge[]): void {
    safeSet(KEYS.CHALLENGES, challenges);
  },

  // Communities
  getCommunities(): Community[] | null {
    return safeParse<Community[] | null>(KEYS.COMMUNITIES, null);
  },

  saveCommunities(communities: Community[]): void {
    safeSet(KEYS.COMMUNITIES, communities);
  },

  // Todos
  getTodos(): ToDoItem[] | null {
    return safeParse<ToDoItem[] | null>(KEYS.TODOS, null);
  },

  saveTodos(todos: ToDoItem[]): void {
    safeSet(KEYS.TODOS, todos);
  },

  // Notifications
  getNotifications(): NotificationItem[] | null {
    return safeParse<NotificationItem[] | null>(KEYS.NOTIFICATIONS, null);
  },

  saveNotifications(notifications: NotificationItem[]): void {
    safeSet(KEYS.NOTIFICATIONS, notifications);
  },

  // Creators / Other Users
  getCreators(): Author[] | null {
    return safeParse<Author[] | null>(KEYS.CREATORS, null);
  },

  saveCreators(creators: Author[]): void {
    safeSet(KEYS.CREATORS, creators);
  },

  // Squads
  getSquads(): Squad[] | null {
    return safeParse<Squad[] | null>(KEYS.SQUADS, null);
  },

  saveSquads(squads: Squad[]): void {
    safeSet(KEYS.SQUADS, squads);
  },

  // User Credits & Community Votes (replacing likes with credits & discredits)
  getUserCredits(userId?: string): string[] {
    const key = userId ? `daily_app_user_credits_${userId}` : 'daily_app_user_credits';
    const stored = safeParse<string[]>(key, []);
    if (stored.length > 0) return stored;
    // Fallback to previous likes if migrating
    return this.getUserLikes(userId);
  },

  saveUserCredits(creditedPostIds: string[], userId?: string): void {
    const key = userId ? `daily_app_user_credits_${userId}` : 'daily_app_user_credits';
    safeSet(key, creditedPostIds);
    safeSet('daily_app_user_credits', creditedPostIds);
    // Mirror to likes for Supabase fallback compatibility
    this.saveUserLikes(creditedPostIds, userId);
  },

  // Community Votes ('credit' | 'discredit')
  getCommunityVotes(userId?: string): Record<string, 'credit' | 'discredit'> {
    const key = userId ? `daily_app_comm_votes_${userId}` : 'daily_app_comm_votes';
    return safeParse<Record<string, 'credit' | 'discredit'>>(key, {});
  },

  saveCommunityVote(postId: string, vote: 'credit' | 'discredit' | null, userId?: string): void {
    const key = userId ? `daily_app_comm_votes_${userId}` : 'daily_app_comm_votes';
    const current = this.getCommunityVotes(userId);
    if (!vote) {
      delete current[postId];
    } else {
      current[postId] = vote;
    }
    safeSet(key, current);
    safeSet('daily_app_comm_votes', current);
  },

  // User Likes & Bookmarks (backward compatibility)
  getUserLikes(userId?: string): string[] {
    const key = userId ? `daily_app_user_likes_${userId}` : 'daily_app_user_likes';
    return safeParse<string[]>(key, []);
  },

  saveUserLikes(likedPostIds: string[], userId?: string): void {
    const key = userId ? `daily_app_user_likes_${userId}` : 'daily_app_user_likes';
    safeSet(key, likedPostIds);
    safeSet('daily_app_user_likes', likedPostIds);
  },

  getUserBookmarks(userId?: string): string[] {
    const key = userId ? `daily_app_user_bookmarks_${userId}` : 'daily_app_user_bookmarks';
    return safeParse<string[]>(key, []);
  },

  saveUserBookmarks(bookmarkedPostIds: string[], userId?: string): void {
    const key = userId ? `daily_app_user_bookmarks_${userId}` : 'daily_app_user_bookmarks';
    safeSet(key, bookmarkedPostIds);
    safeSet('daily_app_user_bookmarks', bookmarkedPostIds);
  },

  // User Follows
  getUserFollows(userId?: string): string[] {
    const key = userId ? `daily_app_user_follows_${userId}` : 'daily_app_user_follows';
    return safeParse<string[]>(key, []);
  },

  saveUserFollows(followedIds: string[], userId?: string): void {
    const key = userId ? `daily_app_user_follows_${userId}` : 'daily_app_user_follows';
    safeSet(key, followedIds);
    safeSet('daily_app_user_follows', followedIds);
  },

  // Squad Chat Messages
  getSquadChatMessages(squadId: string): any[] {
    const key = `daily_app_squad_chat_${squadId}`;
    return safeParse<any[]>(key, []);
  },

  saveSquadChatMessages(squadId: string, messages: any[]): void {
    const key = `daily_app_squad_chat_${squadId}`;
    safeSet(key, messages);
  },

  addSquadChatMessage(squadId: string, message: any): any[] {
    const current = this.getSquadChatMessages(squadId);
    const updated = [...current, message];
    this.saveSquadChatMessages(squadId, updated);
    return updated;
  },

  markSquadMessagesAsRead(squadId: string, readerUsernameOrId: string): any[] {
    const current = this.getSquadChatMessages(squadId);
    let changed = false;
    const nowIso = new Date().toISOString();
    const updated = current.map((msg: any) => {
      const isSender = (msg.author?.username && msg.author.username === readerUsernameOrId) ||
                       (msg.sender?.username && msg.sender.username === readerUsernameOrId) ||
                       (msg.author?.id && msg.author.id === readerUsernameOrId) ||
                       (msg.sender?.id && msg.sender.id === readerUsernameOrId);
      if (!isSender) {
        const readBy = Array.isArray(msg.readBy) ? msg.readBy : [];
        if (!readBy.includes(readerUsernameOrId)) {
          changed = true;
          return {
            ...msg,
            read_at: msg.read_at || nowIso,
            readBy: [...readBy, readerUsernameOrId],
          };
        }
      }
      return msg;
    });
    if (changed) {
      this.saveSquadChatMessages(squadId, updated);
    }
    return updated;
  },

  toggleSquadMessageReaction(squadId: string, messageId: string, emoji: string, usernameOrId: string): any[] {
    const current = this.getSquadChatMessages(squadId);
    const updated = current.map((msg: any) => {
      if (msg.id !== messageId) return msg;
      const reactions = Array.isArray(msg.reactions) ? [...msg.reactions] : [];
      const existingReactionIndex = reactions.findIndex((r) => r.emoji === emoji);
      if (existingReactionIndex > -1) {
        const existing = reactions[existingReactionIndex];
        const hasUser = existing.users.includes(usernameOrId);
        if (hasUser) {
          const newUsers = existing.users.filter((u: string) => u !== usernameOrId);
          if (newUsers.length === 0) {
            reactions.splice(existingReactionIndex, 1);
          } else {
            reactions[existingReactionIndex] = {
              ...existing,
              count: newUsers.length,
              users: newUsers,
            };
          }
        } else {
          reactions[existingReactionIndex] = {
            ...existing,
            count: existing.count + 1,
            users: [...existing.users, usernameOrId],
          };
        }
      } else {
        reactions.push({
          emoji,
          count: 1,
          users: [usernameOrId],
        });
      }
      return {
        ...msg,
        reactions,
      };
    });
    this.saveSquadChatMessages(squadId, updated);
    return updated;
  },

  // Purge any old fake mock challenges or communities stored in localStorage
  purgeMockData(): void {
    try {
      const storedChs = this.getChallenges();
      if (storedChs) {
        const cleanChs = storedChs.filter((c) => !c.id.startsWith('ch_'));
        this.saveChallenges(cleanChs);
      }
      const storedComms = this.getCommunities();
      if (storedComms) {
        const cleanComms = storedComms.filter((c) => !c.id.startsWith('comm_'));
        this.saveCommunities(cleanComms);
      }
    } catch {
      // ignore
    }
  },

  // Cross-account Comments Registry (persists comments across accounts and sessions)
  getCommentsRegistry(): Record<string, Comment[]> {
    return safeParse<Record<string, Comment[]>>(KEYS.COMMENTS_REGISTRY, {});
  },

  getCommentsForPost(postId: string): Comment[] {
    const registry = this.getCommentsRegistry();
    return registry[postId] || [];
  },

  addCommentToPost(postId: string, comment: Comment): Comment[] {
    const registry = this.getCommentsRegistry();
    const current = registry[postId] || [];
    // Avoid duplicate comment IDs
    const exists = current.some((c) => c.id === comment.id);
    const updated = exists ? current.map((c) => (c.id === comment.id ? comment : c)) : [comment, ...current];
    registry[postId] = updated;
    safeSet(KEYS.COMMENTS_REGISTRY, registry);
    return updated;
  },

  removeCommentFromPost(postId: string, commentId: string): void {
    const registry = this.getCommentsRegistry();
    if (registry[postId]) {
      registry[postId] = registry[postId].filter((c) => c.id !== commentId);
      safeSet(KEYS.COMMENTS_REGISTRY, registry);
    }
  },

  updateCommentAuthor(oldUsername: string, updatedAuthor: Partial<Author>): void {
    const registry = this.getCommentsRegistry();
    let changed = false;
    Object.keys(registry).forEach((pId) => {
      registry[pId] = registry[pId].map((c) => {
        if (c.author?.username?.toLowerCase() === oldUsername.toLowerCase()) {
          changed = true;
          return {
            ...c,
            author: {
              ...c.author,
              ...updatedAuthor,
            },
          };
        }
        return c;
      });
    });
    if (changed) {
      safeSet(KEYS.COMMENTS_REGISTRY, registry);
    }
  },

  // Notification Muting Preferences
  getMutedChallenges(): string[] {
    return safeParse<string[]>(KEYS.MUTED_CHALLENGES, []);
  },

  isChallengeMuted(challengeId: string): boolean {
    return this.getMutedChallenges().includes(challengeId);
  },

  toggleMuteChallenge(challengeId: string): boolean {
    const list = this.getMutedChallenges();
    const isMuted = list.includes(challengeId);
    const updated = isMuted ? list.filter((id) => id !== challengeId) : [...list, challengeId];
    safeSet(KEYS.MUTED_CHALLENGES, updated);
    return !isMuted;
  },

  getMutedCommunities(): string[] {
    return safeParse<string[]>(KEYS.MUTED_COMMUNITIES, []);
  },

  isCommunityMuted(communityId: string): boolean {
    return this.getMutedCommunities().includes(communityId);
  },

  toggleMuteCommunity(communityId: string): boolean {
    const list = this.getMutedCommunities();
    const isMuted = list.includes(communityId);
    const updated = isMuted ? list.filter((id) => id !== communityId) : [...list, communityId];
    safeSet(KEYS.MUTED_COMMUNITIES, updated);
    return !isMuted;
  },

  getMutedUsers(): string[] {
    return safeParse<string[]>(KEYS.MUTED_USERS, []);
  },

  isUserMuted(userIdOrUsername: string): boolean {
    const list = this.getMutedUsers().map((u) => u.toLowerCase().replace(/^@/, ''));
    const target = userIdOrUsername.toLowerCase().replace(/^@/, '');
    return list.includes(target);
  },

  toggleMuteUser(userIdOrUsername: string): boolean {
    const target = userIdOrUsername.toLowerCase().replace(/^@/, '');
    const list = this.getMutedUsers().map((u) => u.toLowerCase().replace(/^@/, ''));
    const isMuted = list.includes(target);
    const updated = isMuted ? list.filter((u) => u !== target) : [...list, target];
    safeSet(KEYS.MUTED_USERS, updated);
    return !isMuted;
  },

  // Deleted Squads Registry
  getDeletedSquadIds(): string[] {
    return safeParse<string[]>(KEYS.DELETED_SQUADS, []);
  },

  addDeletedSquadId(squadId: string): void {
    const list = this.getDeletedSquadIds();
    if (!list.includes(squadId)) {
      safeSet(KEYS.DELETED_SQUADS, [...list, squadId]);
    }
  },

  // Cross-Post to Home Feed Setting
  getCrossPostToFeed(): boolean {
    return safeParse<boolean>(KEYS.CROSS_POST_TO_FEED, true);
  },

  setCrossPostToFeed(enabled: boolean): void {
    safeSet(KEYS.CROSS_POST_TO_FEED, enabled);
  },

  // Custom Hashtags Registry
  getCustomHashtags(): string[] {
    return safeParse<string[]>(KEYS.CUSTOM_HASHTAGS, []);
  },

  getAllKnownHashtags(): string[] {
    const custom = this.getCustomHashtags();
    const defaults = ['#Coding', '#Reading', '#Fitness', '#Building', '#AI & Tech', '#Habits', '#Startups', '#Design', '#Writing', '#Creativity'];

    // Also scan all communities & challenges
    const commTags: string[] = [];
    (this.getCommunities() || []).forEach((c) => {
      (c.tags || []).forEach((t) => commTags.push(t.startsWith('#') ? t : `#${t}`));
      if (c.category) commTags.push(c.category.startsWith('#') ? c.category : `#${c.category}`);
    });

    const challengeTags: string[] = [];
    (this.getChallenges() || []).forEach((ch) => {
      (ch.tags || []).forEach((t) => challengeTags.push(t.startsWith('#') ? t : `#${t}`));
      if (ch.category) challengeTags.push(ch.category.startsWith('#') ? ch.category : `#${ch.category}`);
    });

    const combined = [...defaults, ...custom, ...commTags, ...challengeTags];
    const uniqueMap = new Map<string, string>();
    combined.forEach((t) => {
      const clean = t.trim().startsWith('#') ? t.trim() : `#${t.trim()}`;
      if (clean && clean !== '#' && !uniqueMap.has(clean.toLowerCase())) {
        uniqueMap.set(clean.toLowerCase(), clean);
      }
    });

    return Array.from(uniqueMap.values());
  },

  addCustomHashtag(tag: string): { tags: string[]; isNew: boolean; canonicalTag: string } {
    const cleaned = tag.trim().startsWith('#') ? tag.trim() : `#${tag.trim()}`;
    if (!cleaned || cleaned === '#') {
      return { tags: this.getCustomHashtags(), isNew: false, canonicalTag: '#General' };
    }
    const allKnown = this.getAllKnownHashtags();
    const existing = allKnown.find((t) => t.toLowerCase() === cleaned.toLowerCase());
    if (existing) {
      return { tags: this.getCustomHashtags(), isNew: false, canonicalTag: existing };
    }
    const currentCustom = this.getCustomHashtags();
    const updated = [...currentCustom, cleaned];
    safeSet(KEYS.CUSTOM_HASHTAGS, updated);
    return { tags: updated, isNew: true, canonicalTag: cleaned };
  },

  clearDemoContent(): void {
    try {
      [
        KEYS.POSTS,
        KEYS.COMMUNITY_POSTS,
        KEYS.CHALLENGES,
        KEYS.COMMUNITIES,
        KEYS.TODOS,
        KEYS.NOTIFICATIONS,
        KEYS.CREATORS,
        KEYS.SQUADS,
        KEYS.COMMENTS_REGISTRY,
      ].forEach((key) => localStorage.removeItem(key));

      for (let index = localStorage.length - 1; index >= 0; index--) {
        const key = localStorage.key(index);
        if (key && (
          key.startsWith('daily_app_user_') ||
          key.startsWith('daily_app_comm_votes') ||
          key.startsWith('daily_app_squad_chat_')
        )) {
          localStorage.removeItem(key);
        }
      }
    } catch (e) {
      console.error('Error clearing demo content:', e);
    }
  },

  clearAll(): void {
    try {
      this.clearDemoContent();
      localStorage.removeItem(KEYS.USER);
      localStorage.removeItem(KEYS.ONBOARDING_DONE);
      localStorage.removeItem(KEYS.AUTH_SESSION);
    } catch (e) {
      console.error('Error clearing storage:', e);
    }
  }
};
