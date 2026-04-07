import { createClient } from '@supabase/supabase-js';

// TODO: These should come from environment variables
// Set in .env.local:
// NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
// NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhb...

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
