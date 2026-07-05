// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Supabase URL:', supabaseUrl ? '✅ Found' : '❌ Missing');
console.log('🔍 Supabase Key:', supabaseAnonKey ? '✅ Found' : '❌ Missing');

// Create mock client for build time
const createMockClient = () => {
  console.warn('⚠️ Using mock Supabase client. Data will not be saved!');
  
  // Helper to create a mock response
  const mockResponse = (data: any[] = []) => ({
    data: data,
    error: null,
    count: data.length,
    status: 200,
    statusText: 'OK',
  });

  return {
    from: (table: string) => ({
      select: (columns: string = '*') => ({
        eq: (column: string, value: any) => ({
          order: (orderColumn: string, options: any = { ascending: true }) => {
            console.warn(`⚠️ Mock: SELECT from ${table} with eq ${column}=${value}`);
            return Promise.resolve(mockResponse([]));
          },
          limit: (count: number) => {
            console.warn(`⚠️ Mock: SELECT from ${table} with limit ${count}`);
            return Promise.resolve(mockResponse([]));
          },
          range: (start: number, end: number) => {
            console.warn(`⚠️ Mock: SELECT from ${table} with range ${start}-${end}`);
            return Promise.resolve(mockResponse([]));
          },
          single: () => {
            console.warn(`⚠️ Mock: SELECT single from ${table}`);
            return Promise.resolve({ data: null, error: null });
          },
        }),
        limit: (count: number) => {
          console.warn(`⚠️ Mock: SELECT from ${table} with limit ${count}`);
          return Promise.resolve(mockResponse([]));
        },
        range: (start: number, end: number) => {
          console.warn(`⚠️ Mock: SELECT from ${table} with range ${start}-${end}`);
          return Promise.resolve(mockResponse([]));
        },
        single: () => {
          console.warn(`⚠️ Mock: SELECT single from ${table}`);
          return Promise.resolve({ data: null, error: null });
        },
        order: (orderColumn: string, options: any = { ascending: true }) => {
          console.warn(`⚠️ Mock: SELECT from ${table} with order ${orderColumn}`);
          return Promise.resolve(mockResponse([]));
        },
      }),
      insert: (data: any) => ({
        select: (columns: string = '*') => ({
          single: () => {
            console.warn(`⚠️ Mock: INSERT into ${table}`, data);
            return Promise.resolve({ 
              data: { id: 'mock-id-' + Date.now(), ...data }, 
              error: null 
            });
          }
        }),
        // For when .select().single() is used
        then: (callback: any) => {
          console.warn(`⚠️ Mock: INSERT into ${table} (then)`, data);
          return Promise.resolve({ 
            data: { id: 'mock-id-' + Date.now(), ...data }, 
            error: null 
          }).then(callback);
        }
      }),
      update: (data: any) => ({
        eq: (column: string, value: any) => {
          console.warn(`⚠️ Mock: UPDATE ${table} set`, data);
          return Promise.resolve({ data: null, error: null });
        }
      }),
      delete: () => ({
        eq: (column: string, value: any) => {
          console.warn(`⚠️ Mock: DELETE from ${table} where ${column}=${value}`);
          return Promise.resolve({ data: null, error: null });
        }
      })
    })
  };
};

// Create the supabase client (real or mock)
const supabaseClient = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createMockClient();

// Export the client and helper function
export const supabase = supabaseClient;
export const isSupabaseAvailable = () => !!(supabaseUrl && supabaseAnonKey);