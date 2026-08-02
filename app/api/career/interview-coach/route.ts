import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAnthropicClient, CLAUDE_MODEL } from '@/lib/anthropic';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

// POST /api/career/interview-coach
// Body: { messages: ChatMessage[], targetRole: string, jobDescription?: string }
// Stateless per call, same pattern as /api/vault/companion. The client sends
// the whole conversation each time. The first "user" message is a hidden
// kickoff prompt the UI sends automatically when the student clicks Start.
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const { messages, targetRole, jobDescription } = (await request.json()) as {
    messages: ChatMessage[];
    targetRole: string;
    jobDescription?: string;
  };

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'No message provided.' }, { status: 400 });
  }
  if (!targetRole?.trim()) {
    return NextResponse.json({ error: 'Target role is required.' }, { status: 400 });
  }

  const systemPrompt = `You are an experienced, encouraging interview coach running a mock interview with a university student or recent graduate for this role/field: "${targetRole}".${
    jobDescription?.trim()
      ? `\n\nHere is the job description to base your questions on:\n"""\n${jobDescription.slice(0, 8000)}\n"""`
      : ''
  }

Rules for how you run this session:
- Ask ONE interview question at a time. Never ask multiple questions in one message.
- After the student answers, give brief, specific, constructive feedback on their answer (what was strong, what to improve — e.g. structure, specificity, confidence, use of examples), then ask the next question.
- Mix question types naturally: some behavioural ("tell me about a time..."), some role-specific/technical, some about motivation/fit.
- Keep your feedback focused — a few sentences, not an essay. This should feel like a real interview conversation, not a lecture.
- Be warm and encouraging, but honest — don't just praise everything. If an answer is weak or vague, say so kindly and explain why.
- If the student asks for overall feedback or says they want to stop, give a short summary of their strengths and 2-3 concrete things to work on across the interview so far.`;

  const anthropic = getAnthropicClient();

  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 800,
      system: systemPrompt,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    const reply = textBlock && 'text' in textBlock ? textBlock.text : '';

    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json(
      { error: 'The Interview Coach is unavailable right now — try again shortly.' },
      { status: 502 }
    );
  }
}
