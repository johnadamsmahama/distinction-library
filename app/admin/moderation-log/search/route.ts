import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const course = searchParams.get('course')?.trim() ?? '';
  const status = searchParams.get('status') ?? 'all';

  const supabase = createClient();

  let courseIds: string[] | null = null;
  if (course) {
    const [{ data: matchedCourses }, { data: matchedAliases }] = await Promise.all([
      supabase.from('courses').select('id').or(`code.ilike.%${course}%,name.ilike.%${course}%`),
      supabase.from('course_code_aliases').select('course_id').ilike('alias_code', `%${course}%`),
    ]);

    const idsFromCourses = (matchedCourses ?? []).map((c: any) => c.id);
    const idsFromAliases = (matchedAliases ?? []).map((a: any) => a.course_id);
    courseIds = Array.from(new Set([...idsFromCourses, ...idsFromAliases]));

    if (courseIds.length === 0) {
      return NextResponse.json({ rows: [] });
    }
  }

  const statusFilter = status === 'all' ? ['approved', 'rejected', 'needs_revision'] : [status];

  let papersQuery = supabase
    .from('past_papers')
    .select(
      'id, year, exam_type, status, rejection_reason, reviewed_at, courses(code), uploader:profiles!uploaded_by(full_name, student_id), reviewer:profiles!reviewed_by(full_name)'
    )
    .in('status', statusFilter)
    .order('reviewed_at', { ascending: false })
    .limit(200);

  let materialsQuery = supabase
    .from('study_materials')
    .select(
      'id, title, status, rejection_reason, reviewed_at, courses(code), uploader:profiles!uploaded_by(full_name, student_id), reviewer:profiles!reviewed_by(full_name)'
    )
    .in('status', statusFilter)
    .order('reviewed_at', { ascending: false })
    .limit(200);

  if (courseIds) {
    papersQuery = papersQuery.in('course_id', courseIds);
    materialsQuery = materialsQuery.in('course_id', courseIds);
  }

  const [{ data: papers, error: papersError }, { data: materials, error: materialsError }] = await Promise.all([
    papersQuery,
    materialsQuery,
  ]);

  if (papersError || materialsError) {
    return NextResponse.json({ error: 'Search failed.' }, { status: 500 });
  }

  const rows = [
    ...(papers ?? []).map((p: any) => ({
      id: p.id,
      label: `${p.courses?.code ?? 'Unknown'} — ${
        p.exam_type === 'mid_semester' ? 'Mid-Semester' : 'End of Semester'
      } ${p.year}`,
      kind: 'Paper' as const,
      status: p.status,
      rejection_reason: p.rejection_reason,
      reviewed_at: p.reviewed_at,
      courses: p.courses,
      uploader: p.uploader,
      reviewer: p.reviewer,
    })),
    ...(materials ?? []).map((m: any) => ({
      id: m.id,
      label: `${m.courses?.code ?? 'Unknown'} — ${m.title}`,
      kind: 'Material' as const,
      status: m.status,
      rejection_reason: m.rejection_reason,
      reviewed_at: m.reviewed_at,
      courses: m.courses,
      uploader: m.uploader,
      reviewer: m.reviewer,
    })),
  ].sort((a, b) => new Date(b.reviewed_at ?? 0).getTime() - new Date(a.reviewed_at ?? 0).getTime());

  return NextResponse.json({ rows });
}
