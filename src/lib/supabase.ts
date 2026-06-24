import { createClient } from '@supabase/supabase-js';
import type { Database } from './types/database';

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const url = SUPABASE_URL || 'https://rpvjqxrdfrphjwncyxkw.supabase.co';
const anon = SUPABASE_ANON || 'sb_publishable_4AgwzXnjEofwQhaGmRfWFg_KLYf6vi-';

export const supabase = createClient<Database>(url, anon, {
  auth: {
    autoRefreshToken:   true,
    persistSession:     true,
    detectSessionInUrl: true,
  },
});
