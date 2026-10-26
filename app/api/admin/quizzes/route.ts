import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminId, makeSlug, validateQuestions } from '@/lib/quiz/server';

export const runtime = 'nodejs';

// POST /api/admin/quizzes  { title, questions, timeLimitMinutes?, closesAt?, shuffle }
export async function POST(request: Request) {
  const adminId = await requireAdminId();
  if (!adminId) return NextResponse.json({ error: 'Admins only.' }, { status: 403 });

  const body = (await request.json()) as {
    title?: string;
    questions?: unknown;
    timeLimitMinutes?: number | null;
    closesAt?: string | null;
    shuffle?: boolean;
  };

  const title = body.title?.trim();
  if (!title || title.length > 120) {
    return NextResponse.json({ error: 'Give the quiz a title (up to 120 characters).' }, { status: 400 });
  }
  const checked = validateQuestions(body.questions);
  if ('error' in checked) return NextResponse.json({ error: checked.error }, { status: 400 });

  let timeLimit: number | null = null;
  if (body.timeLimitMinutes != null) {
    if (!Number.isInteger(body.timeLimitMinutes) || body.timeLimitMinutes < 1 || body.timeLimitMinutes > 300) {
      return NextResponse.json({ error: 'Time limit must be 1 to 300 minutes.' }, { status: 400 });
    }
    timeLimit = body.timeLimitMinutes;
  }
  let closesAt: string | null = null;
  if (body.closesAt) {
    const d = new Date(body.closesAt);
    if (isNaN(d.getTime())) return NextResponse.json({ error: 'Closing date is not valid.' }, { status: 400 });
    closesAt = d.toISOString();
  }

  const db = createAdminClient();
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = makeSlug();
    const { data, error } = await db
      .from('quizzes')
      .insert({
        slug,
        title,
        questions: checked.questions,
        time_limit_minutes: timeLimit,
        closes_at: closesAt,
        shuffle: body.shuffle !== false,
        published: true,
        created_by: adminId,
      })
      .select('id, slug')
      .single();
    if (!error && data) return NextResponse.json({ id: data.id, slug: data.slug });
    if (error && error.code !== '23505') {
      console.error('quiz insert failed', error);
      return NextResponse.json({ error: 'Could not save the quiz. Has the stage13_quizzes.sql file been run?' }, { status: 500 });
    }
  }
  return NextResponse.json({ error: 'Could not create a unique link. Try again.' }, { status: 500 });
}
