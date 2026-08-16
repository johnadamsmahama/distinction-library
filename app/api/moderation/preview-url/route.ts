import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile, isStaffRole } from '@/lib/auth-helpers';

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

  // Confirm the caller is staff before generating a signed URL. Uses the
  // same profiles.role check (getCurrentProfile/isStaffRole) as every other
  // staff-gated route in the app — this used to check nonexistent
  // is_staff/is_admin boolean columns and 403'd everyone, including staff.
  const supabase = createClient();
  const { user, profile } = await getCurrentProfile(supabase);

  if (!user) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  }

  if (!isStaffRole(profile?.role)) {
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
