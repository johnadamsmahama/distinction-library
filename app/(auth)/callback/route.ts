import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const tokenHash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type') as EmailOtpType | null

  const cookieStore = cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ nimport { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const tokenHash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type') as EmailOtpType | null

  const cookieStore = cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )

  // Invite links and password-recovery links should land the user on the
  // "set a password" screen instead of going straight into the app —
  // otherwise invited students end up with a live session but no password
  // they can actually log in with next time.
  const destination = type === 'invite' || type === 'recovery' ? '/reset-password' : '/dashboard'

  // Preferred path: token_hash + type, verified via verifyOtp.
  // This works regardless of which browser/device opens the link,
  // since it doesn't depend on a code_verifier cookie set during signup.
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    })

    if (!error) {
      return NextResponse.redirect(new URL(destination, requestUrl.origin))
    }
  }

  // Fallback path: legacy PKCE code exchange, kept only so any
  // already-sent confirmation emails using the old link format
  // still work. New emails will use the token_hash format above.
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(new URL(destination, requestUrl.origin))
    }
  }

  // Something went wrong — send to login with a message
  return NextResponse.redirect(
    new URL('/login?message=Could not confirm email. Try signing in.', requestUrl.origin)
  )
}ame, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )

  // Invite links and password-recovery links should land the user on the
  // "set a password" screen instead of going straight into the app —
  // otherwise invited students end up with a live session but no password
  // they can actually log in with next time.
  const destination = type === 'invite' || type === 'recovery' ? '/reset-password' : '/dashboard'

  // Preferred path: token_hash + type, verified via verifyOtp.
  // This works regardless of which browser/device opens the link,
  // since it doesn't depend on a code_verifier cookie set during signup.
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    })

    if (!error) {
      return NextResponse.redirect(new URL(destination, requestUrl.origin))
    }
  }

  // Fallback path: legacy PKCE code exchange, kept only so any
  // already-sent confirmation emails using the old link format
  // still work. New emails will use the token_hash format above.
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(new URL(destination, requestUrl.origin))
    }
  }

  // Something went wrong — send to login with a message
  return NextResponse.redirect(
    new URL('/login?message=Could not confirm email. Try signing in.', requestUrl.origin)
  )
}
