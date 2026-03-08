import { supabase } from '../lib/supabaseClient';

export { supabase };

// Save token to localStorage on auth state change
supabase.auth.onAuthStateChange((event, session) => {
  if (session?.access_token) {
    localStorage.setItem('supabase_token', session.access_token);
  } else {
    localStorage.removeItem('supabase_token');
  }
});
