import { createBrowserClient } from '@supabase/ssr';

// Used in Client Components ('use client'). Reads the public env vars —
// safe to expose, the anon key is meant to be public and RLS does the
// actual access control (see supabase/rls_policies.sql).
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
