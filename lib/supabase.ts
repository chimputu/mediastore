// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create a mock client for when environment variables are missing (during build)
const createMockClient = () => {
  console.warn('⚠️ Supabase environment variables are missing. Using mock client.');
  return {
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({ data: [], error: null })
        })
      }),
      insert: (data: any) => ({
        select: () => ({
          single: () => Promise.resolve({ data: { id: 'mock-id', ...data }, error: null })
        })
      }),
      delete: () => ({
        eq: () => Promise.resolve({ error: null })
      })
    })
  };
};

// Export the supabase client - use real client if env vars exist, otherwise mock
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createMockClient();

export const isSupabaseAvailable = () => !!(supabaseUrl && supabaseAnonKey);