// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Supabase URL:', supabaseUrl ? '✅ Found' : '❌ Missing');
console.log('🔍 Supabase Key:', supabaseAnonKey ? '✅ Found' : '❌ Missing');

// Create mock client for build time
const createMockClient = () => {
  console.warn('⚠️ Using mock Supabase client. Data will not be saved!');
  
  // Helper to create a mock response that matches Supabase structure
  const mockResponse = (data: any[] = []) => ({
    data: data,
    error: null,
    count: data.length,
    status: 200,
    statusText: 'OK',
  });

  // Helper for single response
  const mockSingleResponse = (data: any = null) => ({
    data: data,
    error: null,
    status: 200,
    statusText: 'OK',
  });

  // Create the query builder
  const createQueryBuilder = (table: string) => {
    const builder = {
      select: (columns: string = '*') => {
        console.warn(`⚠️ Mock: select ${columns} from ${table}`);
        return {
          eq: (column: string, value: any) => {
            console.warn(`⚠️ Mock: eq ${column}=${value}`);
            return {
              order: (orderColumn: string, options: any = { ascending: true }) => {
                console.warn(`⚠️ Mock: order by ${orderColumn}`);
                return Promise.resolve(mockResponse([]));
              },
              limit: (count: number) => {
                console.warn(`⚠️ Mock: limit ${count}`);
                return Promise.resolve(mockResponse([]));
              },
              range: (start: number, end: number) => {
                console.warn(`⚠️ Mock: range ${start}-${end}`);
                return Promise.resolve(mockResponse([]));
              },
              single: () => {
                console.warn(`⚠️ Mock: single`);
                return Promise.resolve(mockSingleResponse(null));
              }
            };
          },
          limit: (count: number) => {
            console.warn(`⚠️ Mock: limit ${count}`);
            return Promise.resolve(mockResponse([]));
          },
          range: (start: number, end: number) => {
            console.warn(`⚠️ Mock: range ${start}-${end}`);
            return Promise.resolve(mockResponse([]));
          },
          single: () => {
            console.warn(`⚠️ Mock: single`);
            return Promise.resolve(mockSingleResponse(null));
          },
          order: (orderColumn: string, options: any = { ascending: true }) => {
            console.warn(`⚠️ Mock: order by ${orderColumn}`);
            return Promise.resolve(mockResponse([]));
          }
        };
      },
      insert: (data: any) => {
        console.warn(`⚠️ Mock: insert into ${table}`, data);
        return {
          select: (columns: string = '*') => {
            console.warn(`⚠️ Mock: select after insert`);
            return {
              single: () => {
                console.warn(`⚠️ Mock: single after insert`);
                return Promise.resolve(mockSingleResponse({ 
                  id: 'mock-id-' + Date.now(), 
                  ...data 
                }));
              }
            };
          }
        };
      },
      update: (data: any) => {
        console.warn(`⚠️ Mock: update ${table}`, data);
        return {
          eq: (column: string, value: any) => {
            console.warn(`⚠️ Mock: eq ${column}=${value}`);
            return Promise.resolve({ data: null, error: null });
          }
        };
      },
      delete: () => {
        console.warn(`⚠️ Mock: delete from ${table}`);
        return {
          eq: (column: string, value: any) => {
            console.warn(`⚠️ Mock: eq ${column}=${value}`);
            return Promise.resolve({ data: null, error: null });
          }
        };
      }
    };

    // Add promise-like behavior for the builder itself
    return Object.assign(builder, {
      then: (resolve: any, reject: any) => {
        console.warn(`⚠️ Mock: then called on builder for ${table}`);
        return Promise.resolve(mockResponse([])).then(resolve, reject);
      }
    });
  };

  return {
    from: (table: string) => createQueryBuilder(table)
  };
};

// Create the supabase client (real or mock)
const supabaseClient = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createMockClient();

// Export the client and helper function
export const supabase = supabaseClient;
export const isSupabaseAvailable = () => !!(supabaseUrl && supabaseAnonKey);