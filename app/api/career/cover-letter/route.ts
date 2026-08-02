import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAnthropicClient, CLAUDE_MODEL } from '@/lib/anthropic';

// POST /api/career/cover-letter
// Body: { fullName, contactInfo, companyName, roleTitle, jobDescription?, background, tone }
// Stateless per call, same pattern as /api/career/cv-builder.
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const {
    fullName,
    contactInfo,
    companyName,
    roleTitle,
    jobDescription,
    background,
    tone,
  } = (await request.json()) as {
    fullName: string;
    contactInfo: string;
    companyName: string;
    roleTitle: string;
    jobDescription?: string;
    background: string;
    tone: 'professional' | 'enthusiastic' | 'concise';
  };

  if (!fullName?.trim()) {
    return NextResponse.json({ error: 'Full name is required.' }, { status: 400 });
  }
  if (!roleTitle?.trim()) {
    return NextResponse.json({ error: 'The role you\'re applying for is required.' }, { status: 400 });
  }
  if (!background?.trim()) {
    return NextResponse.json({ error: 'Add a few relevant points about your background.' }, { status: 400 });
  }

  const toneInstruction =
    tone === 'enthusiastic'
      ? 'Write in a warm, enthusiastic tone that shows genuine interest, while staying professional.'
      : tone === 'concise'
        ? 'Write concisely — short paragraphs, no filler, get to the point fast.'
        : 'Write in a clear, professional, confident tone.';

  const systemPrompt = `You are a career advisor helping a university student or recent graduate write a strong cover letter. Write in clean Markdown, addressed properly, 3-4 short paragraphs plus a sign-off. Draw only on the background details the student actually gives you — never invent experience, skills, or achievements they didn't mention. ${toneInstruction} If a job description is provided, tailor the letter to the specific requirements and language used in it.`;

  const userPrompt = `Applicant name: ${fullName}
Contact info: ${contactInfo || 'not provided'}
Applying for: ${roleTitle} at ${companyName || 'the company'}

${jobDescription?.trim() ? `Job description:\n"""\n${jobDescription.slice(0, 8000)}\n"""\n` : ''}
Relevant background, experience, and skills (in the student's own words):
"""
${background.slice(0, 6000)}
"""`;

  const anthropic = getAnthropicClient();

  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1200,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    const letter = textBlock && 'text' in textBlock ? textBlock.text : '';

    return NextResponse.json({ letter });
  } catch {
    return NextResponse.json(
      { error: 'The Cover Letter Generator is unavailable right now — try again shortly.' },
      { status: 502 }
    );
  }
}
