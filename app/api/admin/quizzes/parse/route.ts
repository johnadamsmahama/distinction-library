import { NextResponse } from 'next/server';
import mammoth from 'mammoth';
// @ts-ignore -- pdf-parse has no types for this subpath; same import as lib/trusted-upload/extract-pdf-metadata.ts
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import { requireAdminId } from '@/lib/quiz/server';
import { parseQuestions } from '@/lib/quiz/parser';

export const runtime = 'nodejs';

const MAX_BYTES = 4 * 1024 * 1024; // stays under the host's request size limit

// POST /api/admin/quizzes/parse  (multipart: file) or JSON { text }
// Reads a .docx / .pdf / pasted text and returns the questions it found.
// Nothing is saved here — the admin reviews the result first.
export async function POST(request: Request) {
  if (!(await requireAdminId())) {
    return NextResponse.json({ error: 'Admins only.' }, { status: 403 });
  }

  let text = '';
  let filename: string | null = null;

  try {
    const contentType = request.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      const body = (await request.json()) as { text?: string };
      text = body.text ?? '';
    } else {
      const form = await request.formData();
      const file = form.get('file');
      if (!(file instanceof File)) {
        return NextResponse.json({ error: 'Choose a file first.' }, { status: 400 });
      }
      if (file.size > MAX_BYTES) {
        return NextResponse.json({ error: 'That file is over 4 MB. Please use a smaller file.' }, { status: 400 });
      }
      filename = file.name;
      const buffer = Buffer.from(await file.arrayBuffer());
      const lower = file.name.toLowerCase();
      if (lower.endsWith('.docx')) {
        text = (await mammoth.extractRawText({ buffer })).value;
      } else if (lower.endsWith('.pdf') || file.type === 'application/pdf') {
        text = (await pdfParse(buffer)).text;
      } else if (lower.endsWith('.txt')) {
        text = buffer.toString('utf8');
      } else {
        return NextResponse.json(
          { error: 'Please upload a .docx (Word) or .pdf file. Older .doc files: open in Word and Save As .docx.' },
          { status: 400 }
        );
      }
    }
  } catch (e) {
    console.error('quiz parse failed', e);
    return NextResponse.json({ error: 'Could not read that file. Try a different copy, or paste the text instead.' }, { status: 422 });
  }

  if (!text.trim()) {
    return NextResponse.json(
      { error: 'No text found. If the PDF is a scan or photo, it cannot be read. Use a typed copy.' },
      { status: 422 }
    );
  }

  const { questions, theory, warnings } = parseQuestions(text);
  return NextResponse.json({ questions, theory, warnings, filename });
}
