import { Author, Challenge, Community, NotificationItem, Post, Squad, ToDoItem } from '../types';

const KEYS = {
  USER: 'daily_app_current_user',
  ONBOARDING_DONE: 'daily_app_onboarding_done',
  AUTH_SESSION: 'daily_app_auth_session',
  POSTS: 'daily_app_posts',
  CHALLENGES: 'daily_app_challenges',
  COMMUNITIES: 'daily_app_communities',
  TODOS: 'daily_app_todos',
  NOTIFICATIONS: 'daily_app_notifications',
  CREATORS: 'daily_app_creators',
  SQUADS: 'daily_app_squads',
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

  // User Likes & Bookmarks
  getUserLikes(): string[] {
    return safeParse<string[]>('daily_app_user_likes', []);
  },

  saveUserLikes(likedPostIds: string[]): void {
    safeSet('daily_app_user_likes', likedPostIds);
  },

  getUserBookmarks(): string[] {
    return safeParse<string[]>('daily_app_user_bookmarks', []);
  },

  saveUserBookmarks(bookmarkedPostIds: string[]): void {
    safeSet('daily_app_user_bookmarks', bookmarkedPostIds);
  },

  // Reset entire application data
  clearAll(): void {
    try {
      localStorage.removeItem(KEYS.USER);
      localStorage.removeItem(KEYS.ONBOARDING_DONE);
      localStorage.removeItem(KEYS.AUTH_SESSION);
      localStorage.removeItem(KEYS.POSTS);
      localStorage.removeItem(KEYS.CHALLENGES);
      localStorage.removeItem(KEYS.COMMUNITIES);
      localStorage.removeItem(KEYS.TODOS);
      localStorage.removeItem(KEYS.NOTIFICATIONS);
      localStorage.removeItem(KEYS.CREATORS);
      localStorage.removeItem(KEYS.SQUADS);
      localStorage.removeItem('daily_app_user_likes');
      localStorage.removeItem('daily_app_user_bookmarks');
    } catch (e) {
      console.error('Error clearing storage:', e);
    }
  }
};
