import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminId } from '@/lib/quiz/server';

export const runtime = 'nodejs';

// PATCH { published: boolean, hours?: number | null }
//  - { published: false }                  closes the quiz.
//  - { published: true, hours: 24 }        reactivates it for 24 more hours from now.
//  - { published: true, hours: null }      reactivates it with no deadline.
//  - { published: true }                   reopens it, but only if its old deadline has not passed.
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!(await requireAdminId())) return NextResponse.json({ error: 'Admins only.' }, { status: 403 });
  const body = (await request.json()) as { published?: boolean; hours?: number | null };
  if (typeof body.published !== 'boolean') return NextResponse.json({ error: 'Missing value.' }, { status: 400 });

  const db = createAdminClient();
  const update: { published: boolean; closes_at?: string | null } = { published: body.published };

  if (body.published && 'hours' in body) {
    if (body.hours === null) {
      update.closes_at = null;
    } else if (typeof body.hours === 'number' && Number.isFinite(body.hours) && body.hours >= 0.5 && body.hours <= 24 * 365) {
      update.closes_at = new Date(Date.now() + body.hours * 3600 * 1000).toISOString();
    } else {
      return NextResponse.json({ error: 'Choose a valid time.' }, { status: 400 });
    }
  } else if (body.published) {
    // Reopening with no new deadline: refuse if the old deadline is already behind us,
    // otherwise the quiz would look open here but still reject students.
    const { data: quiz } = await db.from('quizzes').select('closes_at').eq('id', params.id).single();
    if (quiz?.closes_at && new Date(quiz.closes_at).getTime() < Date.now()) {
      return NextResponse.json({ error: 'The deadline has passed. Choose a new one.' }, { status: 400 });
    }
  }

  const { error } = await db.from('quizzes').update(update).eq('id', params.id);
  if (error) return NextResponse.json({ error: 'Could not update the quiz.' }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE — removes the quiz and all its attempts.
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  if (!(await requireAdminId())) return NextResponse.json({ error: 'Admins only.' }, { status: 403 });
  const { error } = await createAdminClient().from('quizzes').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: 'Could not delete the quiz.' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
