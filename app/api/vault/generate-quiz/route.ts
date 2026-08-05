import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAnthropicClient, CLAUDE_MODEL } from '@/lib/anthropic';
import mammoth from 'mammoth';
import officeParser from 'officeparser';

type AttachedFile = { name: string; type: string; data: string }; // data = base64

// POST /api/vault/generate-quiz
// Body: { notesContext?: string, attachedFile?: AttachedFile, topic?: string, numQuestions: number }
// Same file-handling pattern as the Companion route: PDFs/images go to Claude natively,
// .docx/.pptx are extracted to text and folded into notesContext.
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const { notesContext, attachedFile, topic, numQuestions } = (await request.json()) as {
    notesContext?: string;
    attachedFile?: AttachedFile;
    topic?: string;
    numQuestions: number;
  };

  if (!notesContext?.trim() && !attachedFile) {
    return NextResponse.json({ error: 'Paste some notes or attach a file first.' }, { status: 400 });
  }

  const count = [5, 10, 15].includes(numQuestions) ? numQuestions : 5;

  let effectiveNotesContext = notesContext ?? '';
  let filePart: { type: 'document' | 'image'; media_type: string; data: string } | null = null;

  if (attachedFile) {
    const buffer = Buffer.from(attachedFile.data, 'base64');
    const isPdf = attachedFile.type === 'application/pdf';
    const isImage = attachedFile.type.startsWith('image/');
    const isDocx =
      attachedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      attachedFile.name.toLowerCase().endsWith('.docx');
    const isPptx =
      attachedFile.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
      attachedFile.name.toLowerCase().endsWith('.pptx');

    try {
      if (isPdf || isImage) {
        filePart = { type: isPdf ? 'document' : 'image', media_type: attachedFile.type, data: attachedFile.data };
      } else if (isDocx) {
        const result = await mammoth.extractRawText({ buffer });
        effectiveNotesContext = `${effectiveNotesContext}\n\n[From uploaded file: ${attachedFile.name}]\n${result.value}`.trim();
      } else if (isPptx) {
        const text = await officeParser.parseOfficeAsync(buffer);
        effectiveNotesContext = `${effectiveNotesContext}\n\n[From uploaded file: ${attachedFile.name}]\n${text}`.trim();
      } else {
        return NextResponse.json(
          { error: 'Unsupported file type. Please upload a PDF, Word doc, PowerPoint, or image.' },
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

  const systemPrompt = `You are the Distinction Library AI Quiz Generator, creating a practice quiz for a UPSA student from their own course material.

Generate exactly ${count} questions with a mix of types: multiple choice ("mcq"), true/false ("true_false"), and short answer ("short"). Base every question strictly on the material provided — do not invent facts outside it.${
    topic ? `\n\nFocus specifically on: "${topic}"` : ''
  }

Respond with ONLY a raw JSON array, no markdown fences, no preamble, no commentary. Each item must match this exact shape:
{
  "type": "mcq" | "true_false" | "short",
  "question": string,
  "options": string[] (ONLY for "mcq", exactly 4 options),
  "answer": string (for mcq: must exactly match one of the options; for true_false: "True" or "False"; for short: the expected answer, kept brief),
  "explanation": string (1-2 sentences, why this is the answer)
}

Material to base the quiz on:
"""
${effectiveNotesContext.slice(0, 15000)}
"""`;

  const anthropic = getAnthropicClient();

  const userContent: any[] = filePart
    ? [
        { type: filePart.type, source: { type: 'base64', media_type: filePart.media_type, data: filePart.data } },
        { type: 'text', text: 'Generate the quiz from this material.' },
      ]
    : [{ type: 'text', text: 'Generate the quiz from the material above.' }];

  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 3000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }] as any,
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    const raw = textBlock && 'text' in textBlock ? textBlock.text : '';

    let quiz;
    try {
      const cleaned = raw.trim().replace(/^```json\s*/i, '').replace(/```$/, '');
      quiz = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: 'The AI returned an unexpected format — try generating again.' },
        { status: 502 }
      );
    }

    if (!Array.isArray(quiz) || quiz.length === 0) {
      return NextResponse.json({ error: 'No questions were generated — try again.' }, { status: 502 });
    }

    return NextResponse.json({ quiz });
  } catch {
    return NextResponse.json({ error: 'The AI Quiz Generator is unavailable right now — try again shortly.' }, { status: 502 });
  }
}
