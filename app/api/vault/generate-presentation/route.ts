import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

type Source = 'topic' | 'vault' | 'file';

type AttachedFile = {
  name: string;
  type: string;
  data: string; // base64
};

type RequestBody = {
  source: Source;
  topic?: string;
  vaultItemId?: string;
  attachedFile?: AttachedFile;
  numSlides: number;
  style: string;
  position: string;
  instructions?: string;
};

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_MODEL = 'claude-haiku-4-5-20251001';

const anthropic = ANTHROPIC_API_KEY ? new Anthropic({ apiKey: ANTHROPIC_API_KEY }) : null;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RequestBody;
    const { source, numSlides, style, position, instructions } = body;

    if (!anthropic) {
      return NextResponse.json(
        { error: 'Server is missing ANTHROPIC_API_KEY.' },
        { status: 500 }
      );
    }

    if (!source || !numSlides || numSlides < 1) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    let sourceContent = '';
    let sourceLabel = '';

    if (source === 'topic') {
      if (!body.topic?.trim()) {
        return NextResponse.json({ error: 'Topic is required.' }, { status: 400 });
      }
      sourceContent = body.topic.trim();
      sourceLabel = 'topic';
    } else if (source === 'vault') {
      if (!body.vaultItemId) {
        return NextResponse.json({ error: 'No Vault item selected.' }, { status: 400 });
      }

      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
      }

      const { data: vaultItem, error: vaultError } = await supabase
        .from('study_vault_items')
        .select('id, title, content, item_type, user_id')
        .eq('id', body.vaultItemId)
        .single();

      if (vaultError || !vaultItem) {
        return NextResponse.json({ error: 'Vault item not found.' }, { status: 404 });
      }

      if (vaultItem.user_id !== user.id) {
        return NextResponse.json(
          { error: 'Not authorized to use that Vault item.' },
          { status: 403 }
        );
      }

      sourceContent =
        typeof vaultItem.content === 'string'
          ? vaultItem.content
          : JSON.stringify(vaultItem.content ?? vaultItem.title);
      sourceLabel = `saved ${vaultItem.item_type ?? 'Vault item'} titled "${vaultItem.title}"`;
    } else if (source === 'file') {
      if (!body.attachedFile) {
        return NextResponse.json({ error: 'No file attached.' }, { status: 400 });
      }

      const { name, type, data } = body.attachedFile;
      const lowerName = name.toLowerCase();
      const isPdf = type === 'application/pdf' || lowerName.endsWith('.pdf');
      const isDocx =
        type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        lowerName.endsWith('.docx');

      const buffer = Buffer.from(data, 'base64');

      if (isPdf) {
        try {
          const pdfParse = (await import('pdf-parse')).default;
          const parsed = await pdfParse(buffer);
          sourceContent = parsed.text.slice(0, 20000);
        } catch (err) {
          console.error('PDF parse error:', err);
          return NextResponse.json(
            { error: 'Could not read that PDF. Try a different file.' },
            { status: 400 }
          );
        }
        sourceLabel = `uploaded PDF "${name}"`;
      } else if (isDocx) {
        try {
          const mammoth = await import('mammoth');
          const result = await mammoth.extractRawText({ buffer });
          sourceContent = result.value.slice(0, 20000);
        } catch (err) {
          console.error('DOCX parse error:', err);
          return NextResponse.json(
            { error: 'Could not read that Word document. Try a different file.' },
            { status: 400 }
          );
        }
        sourceLabel = `uploaded Word document "${name}"`;
      } else {
        return NextResponse.json(
          { error: 'Unsupported file type. Upload a PDF or DOCX.' },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json({ error: 'Invalid source.' }, { status: 400 });
    }

    if (!sourceContent.trim()) {
      return NextResponse.json(
        { error: 'Could not extract any content to build slides from.' },
        { status: 400 }
      );
    }

    const prompt = `You are building a slide outline for a university-level PowerPoint presentation.

Source material (${sourceLabel}):
"""
${sourceContent.slice(0, 12000)}
"""

Requirements:
- Exactly ${numSlides} slides.
- Visual style intent: ${style || 'distinction'}
- Layout intent: ${position || 'centered'}
${instructions ? `- Additional instructions: ${instructions}` : ''}

Return ONLY valid JSON, no markdown fences, no commentary, matching exactly this shape:
{
  "deckTitle": "string",
  "slides": [
    { "title": "string", "bullets": ["string", "string"] }
  ]
}

Each slide should have 3-5 concise bullets. The first slide should function as a title/intro slide. Keep language clear and exam-relevant for a Ghanaian university student.`;

    let rawText = '';
    try {
      const msg = await anthropic.messages.create({
        model: ANTHROPIC_MODEL,
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
      });
      const textBlock = msg.content.find((b) => b.type === 'text');
      rawText = textBlock && 'text' in textBlock ? textBlock.text : '';
    } catch (err) {
      console.error('Anthropic API error:', err);
      return NextResponse.json(
        { error: 'The AI service failed to generate an outline.' },
        { status: 502 }
      );
    }

    const cleaned = rawText.replace(/```json\s*|\s*```/g, '').trim();

    let outline;
    try {
      outline = JSON.parse(cleaned);
    } catch (err) {
      console.error('Failed to parse outline JSON:', rawText);
      return NextResponse.json(
        { error: 'The AI returned an unexpected format. Try again.' },
        { status: 502 }
      );
    }

    if (!outline?.deckTitle || !Array.isArray(outline?.slides)) {
      return NextResponse.json(
        { error: 'The AI returned an incomplete outline. Try again.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ outline });
  } catch (err) {
    console.error('generate-presentation error:', err);
    return NextResponse.json(
      { error: 'Something went wrong generating the outline.' },
      { status: 500 }
    );
  }
}
