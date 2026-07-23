import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Supabase sends students here after they click the link in either the
// signup confirmation email or the password reset email. We exchange the
// one-time code for a real session, then continue to wherever makes sense.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
