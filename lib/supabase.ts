// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Supabase URL:', supabaseUrl ? '✅ Found' : '❌ Missing');
console.log('🔍 Supabase Key:', supabaseAnonKey ? '✅ Found' : '❌ Missing');

// Create a mock client for when environment variables are missing
const createMockClient = () => {
  console.warn('⚠️ Using mock Supabase client. Data will not be saved!');
  return {
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          order: () => {
            console.warn(`⚠️ Mock: SELECT from ${table}`);
            return Promise.resolve({ data: [], error: null });
          }
        })
      }),
      insert: (data: any) => ({
        select: () => ({
          single: () => {
            console.warn(`⚠️ Mock: INSERT into ${table}`, data);
            return Promise.resolve({ 
              data: { id: 'mock-id-' + Date.now(), ...data }, 
              error: null 
            });
          }
        })
      }),
      delete: () => ({
        eq: () => {
          console.warn(`⚠️ Mock: DELETE from ${table}`);
          return Promise.resolve({ error: null });
        }
      })
    })
  };
};

// Export real or mock client
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createMockClient();

export const isSupabaseAvailable = () => !!(supabaseUrl && supabaseAnonKey);