import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/vault/generate-quiz/save
// Explicit save action — a generated quiz is ephemeral until the student
// chooses to keep it, along with their answers and score.
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const { quiz, answers, score, sourceName } = (await request.json()) as {
    quiz: {
      type: 'mcq' | 'true_false' | 'short';
      question: string;
      options?: string[];
      answer: string;
      explanation?: string;
    }[];
    answers: Record<number, string>;
    score?: { correct: number; outOf: number };
    sourceName?: string;
  };

  if (!Array.isArray(quiz) || quiz.length === 0) {
    return NextResponse.json({ error: 'Nothing to save yet.' }, { status: 400 });
  }

  const title = (quiz[0]?.question ?? 'Quiz session').slice(0, 80);

  // Match the shape VaultList.tsx already expects for item_type "quiz":
  // content.questions[]  with  { question, correctAnswer, explanation }
  const questions = quiz.map((q, i) => ({
    question: q.question,
    type: q.type,
    options: q.options ?? null,
    correctAnswer: q.answer,
    studentAnswer: answers[i] ?? null,
    explanation: q.explanation ?? null,
  }));

  const { data: vaultItem, error } = await supabase
    .from('study_vault_items')
    .insert({
      user_id: user.id,
      item_type: 'quiz',
      title,
      source_material_name: sourceName ?? null,
      content: { questions, score: score ?? null },
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ vaultItem });
}
