import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

// Only these two buckets should ever be signed here.
const ALLOWED_BUCKETS = ['past-papers', 'study-materials'] as const;
type AllowedBucket = (typeof ALLOWED_BUCKETS)[number];

// Signed URL lifetime — long enough to view a full document at a normal
// pace, short enough that a copied link goes stale quickly.
const SIGNED_URL_TTL_SECONDS = 300;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const bucket: string | undefined = body.bucket;
  const path: string | undefined = body.path;

  if (!bucket || !path || !ALLOWED_BUCKETS.includes(bucket as AllowedBucket)) {
    return NextResponse.json({ error: 'Invalid bucket or path.' }, { status: 400 });
  }

  // Confirm the caller is staff before generating a signed URL.
  // NOTE: adjust the column names below (is_staff / is_admin) if your
  // profiles table uses different ones — match whatever ModerationQueue's
  // parent page.tsx already checks to gate access to this page.
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_staff, is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_staff && !profile?.is_admin) {
    return NextResponse.json({ error: 'Staff access only.' }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(bucket as AllowedBucket)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: 'Could not generate preview link.' }, { status: 500 });
  }

  return NextResponse.json({ url: data.signedUrl });
}
