/**
 * Supabase Client Configuration
 * 
 * Once you create your Supabase project:
 * 1. Add your project URL and Anon Key in your environment or below:
 *    VITE_SUPABASE_URL=https://your-project-id.supabase.co
 *    VITE_SUPABASE_ANON_KEY=your-anon-key
 * 2. Run the SQL schema provided in docs or create tables:
 *    - profiles (id, name, username, bio, avatar, banner_url, hub_privacy, interests)
 *    - posts (id, author_id, content, purpose, media_urls, likes_count, comments_count, community_id)
 *    - challenges (id, title, description, category, target, current, status, type)
 *    - proofs (id, challenge_id, author_id, day_number, note, photo_url, timestamp)
 *    - communities (id, name, description, icon, is_public, members_count)
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && 
  import.meta.env.VITE_SUPABASE_ANON_KEY &&
  import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co'
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
