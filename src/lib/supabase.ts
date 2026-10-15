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
