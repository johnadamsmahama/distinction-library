import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

// Privileged client — only ever used server-side. Required because
// deleting a person's login is an Auth-admin-only action; no ordinary
// key (even a logged-in admin's own session) is allowed to do this.
const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PLACEHOLDER_STUDENT_ID = 'DELETED-USER';
const PLACEHOLDER_EMAIL = 'deleted-user@distinctionlibrary.internal';

// Finds the standing "Deleted User" placeholder account, creating it
// the very first time this route is ever used. Every future deleted
// user's content gets reassigned to this same one account, so it's
// only ever created once.
async function getOrCreatePlaceholderUserId(): Promise<string> {
  const { data: existing } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('student_id', PLACEHOLDER_STUDENT_ID)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: created, error: createError } =
    await supabaseAdmin.auth.admin.createUser({
      email: PLACEHOLDER_EMAIL,
      email_confirm: true,
      password: crypto.randomUUID(),
    });

  if (createError || !created?.user) {
    throw new Error(`Failed to create placeholder user: ${createError?.message}`);
  }

  const placeholderId = created.user.id;

  // Upsert in case a DB trigger already auto-created a bare profile row
  // for this new auth user (common Supabase pattern) — we just fill in
  // the fields that matter.
  const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
    id: placeholderId,
    student_id: PLACEHOLDER_STUDENT_ID,
    full_name: 'Deleted User',
    role: 'student',
  });

  if (profileError) {
    throw new Error(`Failed to set up placeholder profile: ${profileError.message}`);
  }

  return placeholderId;
}

export async function POST(req: NextRequest) {
  try {
    // Confirm the person calling this is actually an admin, using their
    // real logged-in session (respects RLS) — never trust a client-sent flag.
    const supabaseSession = createServerClient();
    const {
      data: { user: requester },
    } = await supabaseSession.auth.getUser();

    if (!requester) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
    }

    const { data: requesterProfile } = await supabaseSession
      .from('profiles')
      .select('role')
      .eq('id', requester.id)
      .single();

    if (requesterProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { targetUserId, ticketId } = await req.json();

    if (!targetUserId) {
      return NextResponse.json({ error: 'targetUserId is required' }, { status: 400 });
    }

    if (targetUserId === requester.id) {
      return NextResponse.json(
        { error: "You can't delete your own admin account this way" },
        { status: 400 }
      );
    }

    const placeholderId = await getOrCreatePlaceholderUserId();

    // Reassign content + wipe personal-only data in one atomic transaction.
    const { error: cleanupError } = await supabaseAdmin.rpc('admin_delete_user', {
      target_user_id: targetUserId,
      placeholder_user_id: placeholderId,
    });

    if (cleanupError) {
      console.error('admin_delete_user RPC error:', cleanupError);
      return NextResponse.json({ error: cleanupError.message }, { status: 500 });
    }

    // Finally, remove their actual login — this is what frees their
    // email up for a fresh signup later.
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(
      targetUserId
    );

    if (authDeleteError) {
      console.error('Auth delete error:', authDeleteError);
      return NextResponse.json({ error: authDeleteError.message }, { status: 500 });
    }

    // Optional: if this deletion was fulfilling a support ticket, mark it resolved.
    if (ticketId) {
      await supabaseAdmin
        .from('support_tickets')
        .update({ resolved: true })
        .eq('id', ticketId);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Delete user error:', err);
    return NextResponse.json({ error: err.message ?? 'Server error' }, { status: 500 });
  }
}
