import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// SERVER-ONLY. Uses the service role key, which bypasses RLS entirely.
// Never import this into a Client Component or anywhere that reaches the
// browser bundle — it belongs strictly in Route Handlers / Server Actions.
// Used for the one operation regular RLS-scoped clients can't do safely:
// moving a raw upload from the private 'past-papers' bucket into the public
// 'past-papers-final' bucket after stamping a watermark on it.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
