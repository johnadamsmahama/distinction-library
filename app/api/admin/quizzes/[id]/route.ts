import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminId } from '@/lib/quiz/server';

export const runtime = 'nodejs';

// PATCH { published: boolean } — open or close a quiz.
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!(await requireAdminId())) return NextResponse.json({ error: 'Admins only.' }, { status: 403 });
  const { published } = (await request.json()) as { published?: boolean };
  if (typeof published !== 'boolean') return NextResponse.json({ error: 'Missing value.' }, { status: 400 });
  const { error } = await createAdminClient().from('quizzes').update({ published }).eq('id', params.id);
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
