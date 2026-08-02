import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAnthropicClient, CLAUDE_MODEL } from '@/lib/anthropic';

type EducationEntry = { institution: string; qualification: string; dates: string };
type ExperienceEntry = { role: string; organisation: string; dates: string; bullets: string };

// POST /api/career/cv-builder
// Body: { fullName, targetRole, contactInfo, education, experience, skills, existingCv? }
// Stateless per call, same pattern as /api/vault/companion. If existingCv is
// provided, Claude revises/improves it instead of building from scratch.
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
    targetRole,
    contactInfo,
    education,
    experience,
    skills,
    existingCv,
  } = (await request.json()) as {
    fullName: string;
    targetRole: string;
    contactInfo: string;
    education: EducationEntry[];
    experience: ExperienceEntry[];
    skills: string;
    existingCv?: string;
  };

  if (!fullName?.trim()) {
    return NextResponse.json({ error: 'Full name is required.' }, { status: 400 });
  }

  const educationBlock = (education ?? [])
    .filter((e) => e.institution?.trim())
    .map((e) => `- ${e.qualification} — ${e.institution} (${e.dates})`)
    .join('\n');

  const experienceBlock = (experience ?? [])
    .filter((e) => e.role?.trim() || e.organisation?.trim())
    .map(
      (e) =>
        `- ${e.role} at ${e.organisation} (${e.dates})\n  Notes: ${e.bullets.replace(/\n/g, '; ')}`
    )
    .join('\n');

  const systemPrompt = `You are a professional CV writer helping a university student or recent graduate build a strong, ATS-friendly CV/resume. Write in clean Markdown using headings (##), bullet points, and bold for section titles. Turn plain notes into polished, achievement-focused bullet points (use strong action verbs, quantify impact where the student's notes allow it — never invent numbers or facts they didn't provide). Keep it to a realistic one-page length for an early-career candidate unless the experience provided clearly needs more. Do not fabricate any experience, dates, or qualifications beyond what is given.`;

  const userPrompt = existingCv?.trim()
    ? `Here is the student's existing CV. Improve its structure, phrasing, and impact while keeping all the facts as given. Tailor it toward this target role/field: "${targetRole || 'not specified'}".\n\nExisting CV:\n"""\n${existingCv.slice(0, 15000)}\n"""`
    : `Build a CV from scratch using these details.

Full name: ${fullName}
Contact info: ${contactInfo || 'not provided'}
Target role/field: ${targetRole || 'not specified'}

Education:
${educationBlock || 'not provided'}

Experience:
${experienceBlock || 'not provided'}

Skills: ${skills || 'not provided'}`;

  const anthropic = getAnthropicClient();

  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    const cv = textBlock && 'text' in textBlock ? textBlock.text : '';

    return NextResponse.json({ cv });
  } catch {
    return NextResponse.json({ error: 'The CV Builder is unavailable right now — try again shortly.' }, { status: 502 });
  }
}
