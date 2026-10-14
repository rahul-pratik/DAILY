import { Author, Challenge, Community, NotificationItem, Post, ToDoItem } from '../types';
import { 
  CURRENT_USER, 
  INITIAL_POSTS, 
  INITIAL_CHALLENGES, 
  INITIAL_COMMUNITIES, 
  INITIAL_NOTIFICATIONS, 
  INITIAL_TODOS,
  OTHER_USERS
} from '../data/initialData';

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
  getCurrentUser(): Author {
    return safeParse<Author>(KEYS.USER, CURRENT_USER);
  },

  saveCurrentUser(user: Author): void {
    safeSet(KEYS.USER, user);
  },

  // Posts Feed
  getPosts(): Post[] {
    return safeParse<Post[]>(KEYS.POSTS, INITIAL_POSTS);
  },

  savePosts(posts: Post[]): void {
    safeSet(KEYS.POSTS, posts);
  },

  addPost(post: Post): Post[] {
    const current = this.getPosts();
    const updated = [post, ...current];
    this.savePosts(updated);
    return updated;
  },

  // Challenges
  getChallenges(): Challenge[] {
    return safeParse<Challenge[]>(KEYS.CHALLENGES, INITIAL_CHALLENGES);
  },

  saveChallenges(challenges: Challenge[]): void {
    safeSet(KEYS.CHALLENGES, challenges);
  },

  // Communities
  getCommunities(): Community[] {
    return safeParse<Community[]>(KEYS.COMMUNITIES, INITIAL_COMMUNITIES);
  },

  saveCommunities(communities: Community[]): void {
    safeSet(KEYS.COMMUNITIES, communities);
  },

  // Todos
  getTodos(): ToDoItem[] {
    return safeParse<ToDoItem[]>(KEYS.TODOS, INITIAL_TODOS);
  },

  saveTodos(todos: ToDoItem[]): void {
    safeSet(KEYS.TODOS, todos);
  },

  // Notifications
  getNotifications(): NotificationItem[] {
    return safeParse<NotificationItem[]>(KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  },

  saveNotifications(notifications: NotificationItem[]): void {
    safeSet(KEYS.NOTIFICATIONS, notifications);
  },

  // Creators / Other Users
  getCreators(): Author[] {
    return safeParse<Author[]>(KEYS.CREATORS, Object.values(OTHER_USERS));
  },

  saveCreators(creators: Author[]): void {
    safeSet(KEYS.CREATORS, creators);
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
    } catch (e) {
      console.error('Error clearing storage:', e);
    }
  }
};
