import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAnthropicClient, CLAUDE_MODEL } from '@/lib/anthropic';
import mammoth from 'mammoth';
import officeParser from 'officeparser';

type ChatMessage = { role: 'user' | 'assistant'; content: string };
type AttachedFile = { name: string; type: string; data: string }; // data = base64

// POST /api/vault/companion
// Body: { messages: ChatMessage[], notesContext?: string, attachedFile?: AttachedFile }
// PDFs and images are sent directly to Claude (native support, no extraction needed).
// .docx is converted to plain text via mammoth; .pptx via officeparser.
// Extracted text is folded into notesContext exactly like pasted notes.
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const { messages, notesContext, attachedFile } = (await request.json()) as {
    messages: ChatMessage[];
    notesContext?: string;
    attachedFile?: AttachedFile;
  };

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'No message provided.' }, { status: 400 });
  }

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
        // Claude can read these natively — pass through as-is.
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

  const systemPrompt = `You are the Distinction Library AI Study Companion, helping a UPSA student understand their own course material. Be clear, patient, and encouraging — explain concepts step by step rather than just giving answers. Keep responses focused and not overly long unless the student asks for depth.${
    effectiveNotesContext
      ? `\n\nThe student has shared these notes for context — ground your answers in them where relevant:\n"""\n${effectiveNotesContext.slice(0, 15000)}\n"""`
      : ''
  }`;

  const anthropic = getAnthropicClient();

  // Build the message list. If a PDF/image is attached, attach it to the last user message
  // as a content block alongside the text, per Claude's multimodal message format.
  const anthropicMessages = messages.map((m, i) => {
    const isLastUserMessage = i === messages.length - 1 && m.role === 'user';
    if (isLastUserMessage && filePart) {
      return {
        role: m.role,
        content: [
          {
            type: filePart.type,
            source: { type: 'base64', media_type: filePart.media_type, data: filePart.data },
          },
          { type: 'text', text: m.content || 'Please look at the attached file.' },
        ],
      };
    }
    return { role: m.role, content: m.content };
  });

  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1200,
      system: systemPrompt,
      messages: anthropicMessages as any,
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    const reply = textBlock && 'text' in textBlock ? textBlock.text : '';

    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({ error: 'The AI Companion is unavailable right now — try again shortly.' }, { status: 502 });
  }
}
