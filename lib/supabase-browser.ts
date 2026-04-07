// Browser-side Supabase client — re-exports the shared client.
// The server and browser use the same anon key + RLS config,
// so a single createClient instance is sufficient.
export { supabase } from './supabase';
