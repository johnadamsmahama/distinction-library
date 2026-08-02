import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAnthropicClient, CLAUDE_MODEL } from '@/lib/anthropic';
import mammoth from 'mammoth';

type EducationEntry = { institution: string; qualification: string; dates: string };
type ExperienceEntry = { role: string; organisation: string; dates: string; bullets: string };
type AttachedFile = { name: string; type: string; data: string }; // data = base64

// POST /api/career/cv-builder
// Body: { fullName, targetRole, contactInfo, education, experience, skills, existingCv?, attachedFile? }
// Stateless per call, same pattern as /api/vault/companion. If existingCv or
// attachedFile is provided, Claude revises/improves it instead of building
// from scratch. PDF/images are sent directly to Claude (native support);
// .docx is converted to plain text via mammoth first.
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
    attachedFile,
  } = (await request.json()) as {
    fullName: string;
    targetRole: string;
    contactInfo: string;
    education: EducationEntry[];
    experience: ExperienceEntry[];
    skills: string;
    existingCv?: string;
    attachedFile?: AttachedFile;
  };

  if (!fullName?.trim() && !attachedFile && !existingCv?.trim()) {
    return NextResponse.json({ error: 'Full name is required.' }, { status: 400 });
  }

  let effectiveExistingCv = existingCv?.trim() ?? '';
  let filePart: { type: 'document' | 'image'; media_type: string; data: string } | null = null;

  if (attachedFile) {
    const buffer = Buffer.from(attachedFile.data, 'base64');
    const isPdf = attachedFile.type === 'application/pdf';
    const isImage = attachedFile.type.startsWith('image/');
    const isDocx =
      attachedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      attachedFile.name.toLowerCase().endsWith('.docx');

    try {
      if (isPdf || isImage) {
        filePart = { type: isPdf ? 'document' : 'image', media_type: attachedFile.type, data: attachedFile.data };
      } else if (isDocx) {
        const result = await mammoth.extractRawText({ buffer });
        effectiveExistingCv = result.value;
      } else {
        return NextResponse.json(
          { error: 'Unsupported file type. Please upload a PDF, Word doc, or image.' },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: `Could not read "${attachedFile.name}" — the file may be corrupted or in an unexpected format.` },
        { status: 422 }
      );
    }
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

  let userContent: any;

  if (filePart) {
    const instructionText = `Here is the student's existing CV (attached as a file). Improve its structure, phrasing, and impact while keeping all the facts as given. Tailor it toward this target role/field: "${targetRole || 'not specified'}".`;
    userContent = [
      {
        type: filePart.type,
        source: { type: 'base64', media_type: filePart.media_type, data: filePart.data },
      },
      { type: 'text', text: instructionText },
    ];
  } else if (effectiveExistingCv) {
    userContent = `Here is the student's existing CV. Improve its structure, phrasing, and impact while keeping all the facts as given. Tailor it toward this target role/field: "${targetRole || 'not specified'}".\n\nExisting CV:\n"""\n${effectiveExistingCv.slice(0, 15000)}\n"""`;
  } else {
    userContent = `Build a CV from scratch using these details.

Full name: ${fullName}
Contact info: ${contactInfo || 'not provided'}
Target role/field: ${targetRole || 'not specified'}

Education:
${educationBlock || 'not provided'}

Experience:
${experienceBlock || 'not provided'}

Skills: ${skills || 'not provided'}`;
  }

  const anthropic = getAnthropicClient();

  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    const cv = textBlock && 'text' in textBlock ? textBlock.text : '';

    return NextResponse.json({ cv });
  } catch {
    return NextResponse.json({ error: 'The CV Builder is unavailable right now — try again shortly.' }, { status: 502 });
  }
}
