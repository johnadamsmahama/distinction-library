import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAnthropicClient, CLAUDE_MODEL } from '@/lib/anthropic';

// POST /api/career/linkedin-optimizer
// Body: { targetRole, currentHeadline?, currentAbout?, background }
// Stateless per call, same pattern as the other career tools.
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const { targetRole, currentHeadline, currentAbout, background } = (await request.json()) as {
    targetRole: string;
    currentHeadline?: string;
    currentAbout?: string;
    background: string;
  };

  if (!targetRole?.trim()) {
    return NextResponse.json({ error: 'Target role or field is required.' }, { status: 400 });
  }
  if (!background?.trim()) {
    return NextResponse.json({ error: 'Add a few points about your background and skills.' }, { status: 400 });
  }

  const systemPrompt = `You are a LinkedIn profile optimization expert helping a university student or recent graduate improve their profile for this target role/field: "${targetRole}". Only use facts the student actually gives you — never invent experience, employers, or achievements.

Respond in clean Markdown with these sections, in this order:
## Headline
One optimized LinkedIn headline (under 220 characters), plus one alternative option.

## About section
A rewritten "About" section (3-4 short paragraphs, first person, engaging but professional — not just a list of facts).

## Experience section tips
2-4 concrete, specific tips for how to phrase their experience bullet points on LinkedIn (action verbs, quantifying impact, keywords recruiters search for in this field) — tailored to what they've told you about their background.

## Quick wins
2-3 other fast improvements (e.g. skills to add, profile photo/banner advice, engagement habits) relevant to someone breaking into this field.`;

  const userPrompt = `Target role/field: ${targetRole}
${currentHeadline?.trim() ? `Current headline: ${currentHeadline}\n` : ''}${currentAbout?.trim() ? `Current About section:\n"""\n${currentAbout.slice(0, 4000)}\n"""\n` : ''}
Background, experience, and skills (in the student's own words):
"""
${background.slice(0, 6000)}
"""`;

  const anthropic = getAnthropicClient();

  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    const result = textBlock && 'text' in textBlock ? textBlock.text : '';

    return NextResponse.json({ result });
  } catch {
    return NextResponse.json(
      { error: 'The LinkedIn Optimizer is unavailable right now — try again shortly.' },
      { status: 502 }
    );
  }
}
