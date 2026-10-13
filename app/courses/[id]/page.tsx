import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import TrackedResourceLink from '@/components/papers/TrackedResourceLink';
import BackLink from '@/components/shared/BackLink';

const CONTENT_TYPE_LABEL: Record<string, string> = {
  lecture_slides: 'Lecture Slides',
};

export default async function CourseDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: course } = await supabase
    .from('courses')
    .select('id, code, name, department, level')
    .eq('id', params.id)
    .single();

  if (!course) notFound();

  // Both lists read through the course link tables (via these database
  // functions), so a file shared by several courses shows up here too, not
  // only on the course it was first uploaded under. The functions already
  // return approved files only; ordering is applied below.
  const [papersRes, materialsRes] = await Promise.all([
    supabase.rpc('search_past_papers', { p_course_id: course.id, p_limit: 200 }),
    supabase.rpc('search_study_materials', { p_course_id: course.id, p_limit: 200 }),
  ]);
  if (papersRes.error) console.error('Course papers load failed:', papersRes.error.message);
  if (materialsRes.error) console.error('Course materials load failed:', materialsRes.error.message);

  type PaperRow = {
    id: string;
    year: number | null;
    exam_type: 'mid_semester' | 'end_of_semester';
    file_url: string;
    watermarked_url: string | null;
  };
  type MaterialRow = {
    id: string;
    title: string;
    content_type: string;
    week_number: number | null;
    file_url: string;
  };

  // Newest year first; papers with an unknown year go last.
  const papers = ((papersRes.data as PaperRow[] | null) ?? []).sort(
    (a, b) => (b.year ?? -Infinity) - (a.year ?? -Infinity)
  );
  // Week 1, 2, 3 … ; materials with no week number go last.
  const materials = ((materialsRes.data as MaterialRow[] | null) ?? []).sort(
    (a, b) => (a.week_number ?? Infinity) - (b.week_number ?? Infinity)
  );

  return (
    <div>
      <BackLink href="/courses" label="All courses" />
      <h1 className="font-display font-bold text-2xl text-navy mt-2 mb-1">
        {course.code} — {course.name}
      </h1>
      <p className="font-body text-sm text-g600 mb-6">
        {course.department} · Level {course.level}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="font-display font-bold text-lg text-navy mb-3">Past Papers</h2>
          {papers.length === 0 ? (
            <p className="font-body text-sm text-g600">No approved papers for this course yet.</p>
          ) : (
            <div className="space-y-2">
              {papers.map((p) => (
                <TrackedResourceLink
                  key={p.id}
                  href={p.watermarked_url ?? p.file_url}
                  resourceType="paper"
                  resourceId={p.id}
                  courseId={course.id}
                  courseCode={course.code}
                  title={`${course.code} — ${p.exam_type === 'mid_semester' ? 'Mid-Semester' : 'End of Semester'} ${p.year}`}
                  className="flex items-center justify-between bg-white border border-g100 rounded-none px-4 py-3 hover:border-gold transition-colors"
                >
                  <span className="font-condensed font-semibold text-sm text-g800">
                    {p.exam_type === 'mid_semester' ? 'Mid-Semester' : 'End of Semester'} {p.year}
                  </span>
                  <span className="font-condensed font-bold text-[10px] uppercase text-gold">Download</span>
                </TrackedResourceLink>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="font-display font-bold text-lg text-navy mb-3">Study Materials</h2>
          {materials.length === 0 ? (
            <p className="font-body text-sm text-g600">No approved materials for this course yet.</p>
          ) : (
            <div className="space-y-2">
              {materials.map((m) => (
                <TrackedResourceLink
                  key={m.id}
                  href={m.file_url}
                  resourceType="material"
                  resourceId={m.id}
                  courseId={course.id}
                  courseCode={course.code}
                  title={`${course.code} — ${m.title}`}
                  className="flex items-center justify-between bg-white border border-g100 rounded-none px-4 py-3 hover:border-gold transition-colors"
                >
                  <div className="min-w-0">
                    <div className="font-condensed font-semibold text-sm text-g800 truncate">{m.title}</div>
                    <div className="font-body text-xs text-g600">
                      {m.week_number ? `Week ${m.week_number} · ` : ''}
                      {CONTENT_TYPE_LABEL[m.content_type] ?? m.content_type}
                    </div>
                  </div>
                  <span className="font-condensed font-bold text-[10px] uppercase text-gold flex-shrink-0 ml-2">
                    Download
                  </span>
                </TrackedResourceLink>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
