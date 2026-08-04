import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export type ClassificationResult = {
  kind: 'past_paper' | 'study_material' | 'unknown';
  courseCode: string | null;
  confidence: number; // 0-1, how sure about BOTH kind and course together
  year: number | null;
  examType: 'mid_semester' | 'end_of_semester' | null;
  title: string | null;
  weekNumber: number | null;
  contentType: 'lecture_slides' | 'study_notes' | 'study_guide' | null;
  notes: string;
};

const SYSTEM_PROMPT = `You are sorting a batch of academic files being bulk-uploaded to
Distinction Library, an academic resource platform for UPSA (University of Professional
Studies, Accra) students. Unlike a normal upload, these files arrive with NO declared
label — you must figure out, purely from the filename and extracted content, which
course each file belongs to and what kind of document it is.

Respond with ONLY a JSON object, no other text, no markdown fences:
{
  "kind": "past_paper" | "study_material" | "unknown",
  "courseCode": "<one of the provided course codes>" | null,
  "confidence": <number 0.0-1.0>,
  "year": <number> | null,
  "examType": "mid_semester" | "end_of_semester" | null,
  "title": "<short descriptive title>" | null,
  "weekNumber": <number 1-14> | null,
  "contentType": "lecture_slides" | "study_notes" | "study_guide" | null,
  "notes": "<one short sentence a moderator can read at a glance>"
}

Guidance:
- "past_paper": contains exam questions, marking schemes, or is clearly framed as a past
  exam/test.
- "study_material": lecture slides, notes, or a study guide — not exam questions.
- "unknown": you genuinely cannot tell which of the two this is.
- courseCode MUST be one of the codes provided to you, or null. Never invent a code that
  wasn't in the list.
- confidence reflects how sure you are about BOTH the course match AND the kind
  together — if you're confident it's a past paper but unsure which course, that's still
  low confidence.
- Be conservative. It is much better to say low confidence / null / unknown than to
  wrongly assign a file to the wrong course.
- For past_paper: guess year and examType from filename/content if possible (e.g.
  "BACS102_endsem_2023.pdf" implies end_of_semester, 2023). Leave null if you can't tell.
- For study_material: title should be short and descriptive (e.g. "Week 5 — Sampling
  Methods"), not just the raw filename. weekNumber only if genuinely inferable.`;

export async function classifyUpload(input: {
  fileName: string;
  extractedText: string | null;
  imageBase64?: string;
  imageMediaType?: 'image/jpeg' | 'image/png';
  courses: { code: string; name: string }[];
}): Promise<ClassificationResult> {
  const courseList = input.courses.map((c) => `${c.code} — ${c.name}`).join('\n');
  const textExcerpt = input.extractedText
    ? input.extractedText.slice(0, 6000)
    : '[No text could be extracted from this file]';

  const userMessage = `File name: ${input.fileName}

Valid course codes:
${courseList}

Extracted content (may be truncated):
"""
${textExcerpt}
"""`;

  // For images (or scanned pages with no text layer), send the image itself
  // to Claude instead of relying on extracted text — Claude can read the
  // page content directly.
  const content: any = input.imageBase64
    ? [
        {
          type: 'image',
          source: { type: 'base64', media_type: input.imageMediaType ?? 'image/jpeg', data: input.imageBase64 },
        },
        {
          type: 'text',
          text: `File name: ${input.fileName}\n\nValid course codes:\n${courseList}\n\nThis file has no extractable text — look at the image above directly to classify it.`,
        },
      ]
    : userMessage;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content }],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return blankResult('AI classification returned no text output.');
    }

    const cleaned = textBlock.text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    if (!['past_paper', 'study_material', 'unknown'].includes(parsed.kind)) {
      return blankResult('AI classification returned an unexpected format.');
    }

    return {
      kind: parsed.kind,
      courseCode: parsed.courseCode ?? null,
      confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0)),
      year: parsed.year ?? null,
      examType: parsed.examType ?? null,
      title: parsed.title ?? null,
      weekNumber: parsed.weekNumber ?? null,
      contentType: parsed.contentType ?? null,
      notes: parsed.notes ?? '',
    };
  } catch (err) {
    console.error('AI classification failed:', err);
    return blankResult('AI classification failed to run — please review manually.');
  }
}

function blankResult(notes: string): ClassificationResult {
  return {
    kind: 'unknown',
    courseCode: null,
    confidence: 0,
    year: null,
    examType: null,
    title: null,
    weekNumber: null,
    contentType: null,
    notes,
  };
}
