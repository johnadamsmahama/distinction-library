import { createClient } from '@supabase/supabase-js';
import SolvePaperView from '@/components/papers/SolvePaperView';

export default async function SolutionsPage({
  params,
}: {
  params: { paperId: string };
}) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: paper } = await supabase
    .from('past_papers')
    .select('id, year, exam_type, courses(code, name)')
    .eq('id', params.paperId)
    .single();

  const { data: questions } = await supabase
    .from('predictor_questions')
    .select('id, canonical_text, question_type, solution')
    .eq('past_paper_id', params.paperId)
    .order('created_at', { ascending: true });

  if (!paper) {
    return (
      <div
        style={{
          backgroundImage:
            'radial-gradient(120% 60% at 50% 0%, #0F2244 0%, #0D2B5E 45%, #060F1E 100%)',
          minHeight: '100vh',
        }}
        className="px-4 sm:px-6 lg:px-8 pt-10"
      >
        <div className="text-white/60 font-body text-sm">Paper not found.</div>
      </div>
    );
  }

  const courses = paper.courses as unknown as { code: string; name: string } | null;

  return (
    <SolvePaperView
      paperId={params.paperId}
      courseCode={courses?.code ?? ''}
      courseName={courses?.name ?? ''}
      examType={paper.exam_type}
      year={paper.year}
      initialQuestions={questions ?? []}
    />
  );
}
