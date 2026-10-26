import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminId } from '@/lib/quiz/server';

export const runtime = 'nodejs';

function cell(v: string | number | null) {
  let s = v === null ? '' : String(v);
  // Stops spreadsheet apps from running a name like "=SUM(...)" as a formula.
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
}

// GET — scores for one quiz as a CSV file.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  if (!(await requireAdminId())) return NextResponse.json({ error: 'Admins only.' }, { status: 403 });
  const db = createAdminClient();
  const { data: quiz } = await db.from('quizzes').select('title').eq('id', params.id).single();
  if (!quiz) return NextResponse.json({ error: 'Quiz not found.' }, { status: 404 });
  const { data: attempts } = await db
    .from('quiz_attempts')
    .select('participant_name, score, total, started_at, submitted_at, tab_switches, submit_reason')
    .eq('quiz_id', params.id)
    .not('submitted_at', 'is', null)
    .order('score', { ascending: false });

  const rows = [['Name', 'Score', 'Out of', 'Percent', 'Minutes taken', 'Submitted at', 'Times left quiz', 'Submission note']];
  for (const a of attempts ?? []) {
    const mins = Math.round(((new Date(a.submitted_at).getTime() - new Date(a.started_at).getTime()) / 60000) * 10) / 10;
    rows.push([
      a.participant_name,
      a.score,
      a.total,
      a.total ? Math.round((a.score / a.total) * 100) : 0,
      mins,
      a.submitted_at,
      a.tab_switches ?? 0,
      a.submit_reason === 'cheating' ? 'Attempted cheating' : a.submit_reason === 'time' ? 'Time ran out' : '',
    ] as unknown as string[]);
  }
  const csv = rows.map((r) => r.map((c) => cell(c as string)).join(',')).join('\r\n');
  const safeName = quiz.title.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'quiz';
  return new NextResponse('﻿' + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${safeName}-scores.csv"`,
    },
  });
}
