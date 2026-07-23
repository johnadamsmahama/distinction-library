import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/vault/companion/save
// Explicit save action — the companion chat itself is stateless/ephemeral
// until the student chooses to keep it.
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const { messages, sourceName } = (await request.json()) as {
    messages: { role: 'user' | 'assistant'; content: string }[];
    sourceName?: string;
  };

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'Nothing to save yet.' }, { status: 400 });
  }

  const firstQuestion = messages.find((m) => m.role === 'user')?.content ?? 'Study Companion session';
  const title = firstQuestion.slice(0, 80);

  const { data: vaultItem, error } = await supabase
    .from('study_vault_items')
    .insert({
      user_id: user.id,
      item_type: 'companion_session',
      title,
      source_material_name: sourceName ?? null,
      content: { messages },
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ vaultItem });
}
