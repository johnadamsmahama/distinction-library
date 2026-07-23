import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAnthropicClient, CLAUDE_MODEL } from '@/lib/anthropic';

// POST /api/vault/generate-quiz
// Accepts multipart/form-data: either a `file` (PDF) or `text`, plus
// `sourceName` and `questionCount`. Extracts text if needed, asks Claude
// for a strictly-JSON quiz, saves it to the student's private Study Vault,
// and returns it. Nothing here is visible to anyone but the student —
// enforced by RLS on study_vault_items (see supabase/rls_policies.sql).
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const pastedText = (formData.get('text') as string | null)?.trim();
  const sourceName = (formData.get('sourceName') as string | null) || file?.name || 'Pasted notes';
  const questionCount = Math.min(Math.max(Number(formData.get('questionCount')) || 8, 3), 15);

  let sourceText = pastedText ?? '';

  if (file) {
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      if (file.name.toLowerCase().endsWith('.pdf')) {
        // Lazy import — pdf-parse touches the filesystem on import in some
        // versions, so keep it out of the module's top-level scope.
        const pdfParse = (await import('pdf-parse')).default;
        const parsed = await pdfParse(buffer);
        sourceText = parsed.text;
      } else {
        sourceText = buffer.toString('utf-8');
      }
    } catch {
      return NextResponse.json({ error: 'Could not read that file. Try a PDF or plain text.' }, { status: 400 });
    }
  }

  if (!sourceText || sourceText.trim().length < 100) {
    return NextResponse.json(
      { error: 'Not enough text to work with — paste more content or upload a fuller document.' },
      { status: 400 }
    );
  }

  // Cap input size to keep costs/latency predictable.
  const trimmedText = sourceText.slice(0, 20000);

  const prompt = `You are generating a study quiz for a UPSA student from their own notes below. Create exactly ${questionCount} questions, mixing multiple-choice, true/false, and short-answer types, covering the material's most important, testable points.

Return ONLY valid JSON — no markdown fences, no commentary — matching exactly this shape:
{
  "questions": [
    {
      "type": "mcq" | "true_false" | "short_answer",
      "question": "string",
      "options": ["string", ...]  // present only for "mcq", 4 options
      "correctAnswer": "string",   // for mcq: exact text of the correct option; for true_false: "True" or "False"; for short_answer: a model answer
      "explanation": "string"      // why this is correct, 1-2 sentences
    }
  ]
}

NOTES:
"""
${trimmedText}
"""`;

  const anthropic = getAnthropicClient();
  let quiz: any;

  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    const raw = textBlock && 'text' in textBlock ? textBlock.text : '';
    const cleaned = raw.replace(/^```json\s*|```$/g, '').trim();
    quiz = JSON.parse(cleaned);

    if (!Array.isArray(quiz.questions) || quiz.questions.length === 0) {
      throw new Error('Empty quiz returned.');
    }
  } catch (err) {
    return NextResponse.json(
      { error: 'The AI could not generate a valid quiz from this content. Try different material.' },
      { status: 502 }
    );
  }

  const title = `Quiz — ${sourceName}`.slice(0, 120);

  const { data: vaultItem, error: insertErr } = await supabase
    .from('study_vault_items')
    .insert({
      user_id: user.id,
      item_type: 'quiz',
      title,
      source_material_name: sourceName,
      content: quiz,
    })
    .select()
    .single();

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  return NextResponse.json({ vaultItem });
}
