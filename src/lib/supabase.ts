import { createClient } from '@supabase/supabase-js';

const SUPABASE_PROJECT_URL = 'https://lcnjpxmrpfqknegsujdc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjbmpweG1ycGZxa25lZ3N1amRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5NzgyMjYsImV4cCI6MjEwNzU1NDIyNn0._xuGrBgzBByEOBbH0CSkLTxwQcJbIo6VLncGfC5iOFw';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || SUPABASE_PROJECT_URL;
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey &&
  supabaseUrl !== 'https://placeholder.supabase.co'
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const isValidUUID = (str?: string | null): boolean => {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
};

export const getSafeUUID = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch {
      // Fallback below
    }
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const syncProfileToSupabase = async (profile: {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  bio?: string;
  accountabilityHubPrivacy?: 'public' | 'private';
}): Promise<boolean> => {
  let targetId = profile.id;

  // If provided ID is not a valid UUID, see if there is an active Supabase auth session
  if (!isValidUUID(targetId)) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id && isValidUUID(session.user.id)) {
        targetId = session.user.id;
      } else {
        return false;
      }
    } catch {
      return false;
    }
  }

  const profilePayload = {
    username: profile.username.trim().toLowerCase().replace(/^@/, ''),
    name: profile.name.trim(),
    avatar_url: profile.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    bio: profile.bio || '',
    accountability_hub_privacy: profile.accountabilityHubPrivacy || 'public',
    updated_at: new Date().toISOString(),
  };

  try {
    // 1. Try updating existing row
    const { data: updateData, error: updateErr } = await supabase
      .from('profiles')
      .update(profilePayload)
      .eq('id', targetId)
      .select('id');

    if (!updateErr && updateData && updateData.length > 0) {
      return true;
    }

    // 2. If update didn't match any row or errored, try upsert/insert
    const { error: insertErr } = await supabase
      .from('profiles')
      .upsert({
        id: targetId,
        ...profilePayload,
      });

    if (insertErr) {
      console.warn('Supabase profile upsert warning:', insertErr.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase profile sync exception:', err);
    return false;
  }
};

