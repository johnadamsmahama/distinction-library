import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Confidence at or above this auto-approves. Tune this after watching the
// spot-check log for a week or two — start conservative, loosen later.
export const AUTO_APPROVE_THRESHOLD = 0.85;

export type AiReviewResult = {
  verdict: 'approve' | 'review';
  confidence: number; // 0-1
  notes: string;
};

export type ReviewInput = {
  kind: 'past_paper' | 'study_material';
  courseName: string;
  courseCode: string;
  // past_paper fields
  year?: number | null;
  examType?: 'mid_semester' | 'end_of_semester' | null;
  // study_material fields
  title?: string | null;
  weekNumber?: number | null;
  contentType?: 'lecture_slides' | 'study_notes' | 'study_guide' | null;
  // shared
  fileName: string;
  extractedText: string | null; // null if extraction failed/unsupported
};

const SYSTEM_PROMPT = `You are a content moderator for Distinction Library, an academic
resource platform for UPSA (University of Professional Studies, Accra) students.

Students and admins upload past exam papers and study materials, labelling each with a
course, and (for study materials) a week number and content type, or (for past papers) a
year and exam type.

Your job: check whether the uploaded file's actual content plausibly matches its label,
and screen out anything inappropriate, blank, corrupted-looking, or off-topic.

Respond with ONLY a JSON object, no other text, no markdown fences:
{
  "verdict": "approve" | "review",
  "confidence": <number 0.0-1.0>,
  "notes": "<one short sentence a moderator can read at a glance>"
}

Guidance:
- "approve" + high confidence: content clearly matches the course/label, is genuine
  academic material (slides, notes, past exam questions, etc.), nothing concerning.
- "review": content doesn't clearly match the label, text couldn't be meaningfully
  extracted, content looks unrelated/spam/inappropriate, or you're simply not sure.
- When extracted text is empty or missing, you cannot verify content — default to
  "review" with low-to-moderate confidence unless the filename alone is a red flag.
- Be reasonably lenient on formatting/typos; strict on subject-matter mismatch and
  inappropriate content.
- confidence should reflect how sure you are the label is accurate, not how good the
  material is.`;

export async function reviewUpload(input: ReviewInput): Promise<AiReviewResult> {
  const labelDescription =
    input.kind === 'past_paper'
      ? `Type: Past exam paper\nCourse: ${input.courseCode} - ${input.courseName}\nYear: ${input.year ?? 'unknown'}\nExam type: ${input.examType ?? 'unknown'}`
      : `Type: Study material\nCourse: ${input.courseCode} - ${input.courseName}\nTitle: ${input.title ?? 'untitled'}\nWeek: ${input.weekNumber ?? 'unknown'}\nContent type: ${input.contentType ?? 'unknown'}`;

  const textExcerpt = input.extractedText
    ? input.extractedText.slice(0, 6000) // keep prompt cost/latency sane
    : '[No text could be extracted from this file]';

  const userMessage = `File name: ${input.fileName}

Claimed label:
${labelDescription}

Extracted content (may be truncated):
"""
${textExcerpt}
"""`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return { verdict: 'review', confidence: 0, notes: 'AI review returned no text output.' };
    }

    const cleaned = textBlock.text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    if (
      (parsed.verdict !== 'approve' && parsed.verdict !== 'review') ||
      typeof parsed.confidence !== 'number' ||
      typeof parsed.notes !== 'string'
    ) {
      return { verdict: 'review', confidence: 0, notes: 'AI review returned an unexpected format.' };
    }

    return {
      verdict: parsed.verdict,
      confidence: Math.max(0, Math.min(1, parsed.confidence)),
      notes: parsed.notes,
    };
  } catch (err) {
    console.error('AI moderation review failed:', err);
    return {
      verdict: 'review',
      confidence: 0,
      notes: 'AI review failed to run — please review manually.',
    };
  }
}
