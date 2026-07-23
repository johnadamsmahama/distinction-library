import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAnthropicClient, CLAUDE_MODEL } from '@/lib/anthropic';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

// POST /api/vault/companion
// Body: { messages: ChatMessage[], notesContext?: string }
// Stateless per call — the client sends the whole conversation each time,
// same pattern as any Claude API integration. Saving to the Study Vault is
// a separate, explicit action (POST /api/vault/companion/save) so students
// aren't forced to keep every casual question.
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const { messages, notesContext } = (await request.json()) as {
    messages: ChatMessage[];
    notesContext?: string;
  };

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'No message provided.' }, { status: 400 });
  }

  const systemPrompt = `You are the Distinction Library AI Study Companion, helping a UPSA student understand their own course material. Be clear, patient, and encouraging — explain concepts step by step rather than just giving answers. Keep responses focused and not overly long unless the student asks for depth.${
    notesContext
      ? `\n\nThe student has shared these notes for context — ground your answers in them where relevant:\n"""\n${notesContext.slice(0, 15000)}\n"""`
      : ''
  }`;

  const anthropic = getAnthropicClient();

  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1200,
      system: systemPrompt,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    const reply = textBlock && 'text' in textBlock ? textBlock.text : '';

    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({ error: 'The AI Companion is unavailable right now — try again shortly.' }, { status: 502 });
  }
}
