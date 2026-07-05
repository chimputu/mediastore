// app/api/test/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const envStatus = {
    supabaseUrl: supabaseUrl ? '✅ Present' : '❌ Missing',
    supabaseKey: supabaseAnonKey ? '✅ Present' : '❌ Missing',
    clerkKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? '✅ Present' : '❌ Missing',
    cloudinary: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ? '✅ Present' : '❌ Missing',
  };

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({
      status: 'error',
      message: 'Supabase environment variables are missing on the server',
      env: envStatus,
    }, { status: 500 });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabase.from('files').select('count').limit(1);

    if (error) {
      return NextResponse.json({
        status: 'error',
        message: 'Failed to connect to Supabase',
        error: error.message,
        env: envStatus,
      }, { status: 500 });
    }

    return NextResponse.json({
      status: 'success',
      message: 'Supabase connected successfully!',
      env: envStatus,
      data: data,
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: 'Error connecting to Supabase',
      error: error.message,
      env: envStatus,
    }, { status: 500 });
  }
}