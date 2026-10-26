// Turns the plain text of a Word/PDF question paper into quiz questions.
// No AI involved: it follows a simple, forgiving pattern.
//
//   1. Question text (can run over several lines)
//   A. option      (also A) or (A) )
//   B. option
//   Answer: B      (also "Ans - B", "Correct answer: B")
//   Explanation: why B is right        (optional)
//
// An answer key at the end ("Answers: 1. B  2. C ...") is also understood.

export type ParsedQuestion = {
  id: string;
  text: string;
  options: string[];
  answer: number | null; // null = not found, admin must tick one
  explanation: string | null;
};

export type ParseResult = { questions: ParsedQuestion[]; warnings: string[] };

const LETTERS = 'ABCDEFGH';

const QUESTION_START = /^\s*(?:question\s*|q\s*)?(\d{1,3})\s*[.):\-]\s*(.*)$/i;
const OPTION_START = /^\s*\(?([A-Ha-h])\s*[.)]\s+(.*)$/;
const ANSWER_LINE = /^\s*(?:correct\s+)?(?:answer|ans)\s*[:.\-–]?\s*\(?([A-Ha-h])\b\)?/i;
const EXPLANATION_LINE = /^\s*(?:explanation|reason|rationale)\s*[:\-–]\s*(.*)$/i;
const KEY_HEADING = /^\s*(?:answers?|answer\s*key|marking\s*scheme|key)\s*[:\-–]?\s*$/i;

function clean(s: string) {
  return s.replace(/\s+/g, ' ').trim();
}

// "A. foo B. bar" on one line -> two lines (only when letters run in order).
function splitInlineOptions(line: string): string[] {
  const m = line.match(OPTION_START);
  if (!m || m[1].toUpperCase() !== 'A') return [line];
  const parts: string[] = [];
  let rest = line;
  for (let i = 1; i < LETTERS.length; i++) {
    const re = new RegExp(`\\s+\\(?${LETTERS[i]}[.)]\\s+`);
    const idx = rest.search(re);
    if (idx === -1) break;
    parts.push(rest.slice(0, idx));
    rest = rest.slice(idx).trimStart();
  }
  parts.push(rest);
  return parts;
}

export function parseQuestions(rawText: string): ParseResult {
  const warnings: string[] = [];
  const lines = rawText
    .replace(/\r/g, '')
    .split('\n')
    .map((l) => l.replace(/ /g, ' ').trimEnd())
    .flatMap((l) => splitInlineOptions(l))
    .filter((l) => l.trim() !== '');

  // Everything after an "Answers" heading is treated as an answer key.
  let keyStart = lines.findIndex((l) => KEY_HEADING.test(l));
  const keyLines = keyStart >= 0 ? lines.slice(keyStart + 1) : [];
  const body = keyStart >= 0 ? lines.slice(0, keyStart) : lines;

  type Draft = { text: string[]; options: string[]; answer: number | null; expl: string[]; mode: 'q' | 'o' | 'e' };
  const drafts: Draft[] = [];
  let cur: Draft | null = null;

  for (const line of body) {
    const qm = line.match(QUESTION_START);
    const om = line.match(OPTION_START);
    const am = line.match(ANSWER_LINE);
    const em = line.match(EXPLANATION_LINE);

    if (am && cur) {
      cur.answer = LETTERS.indexOf(am[1].toUpperCase());
      cur.mode = 'q';
      const tail = line.replace(ANSWER_LINE, '').replace(/^[\s).:\-–]+/, '').trim();
      if (tail) cur.expl.push(tail);
      if (tail) cur.mode = 'e';
      continue;
    }
    if (em && cur) {
      cur.mode = 'e';
      if (em[1]) cur.expl.push(em[1]);
      continue;
    }
    // A new numbered line starts a new question unless we are mid-options and it
    // could only be a wrapped option line (it never starts with a letter marker).
    if (qm && !om) {
      cur = { text: [qm[2]], options: [], answer: null, expl: [], mode: 'q' };
      drafts.push(cur);
      continue;
    }
    if (!cur) continue;
    if (om && cur.mode !== 'e') {
      const idx = LETTERS.indexOf(om[1].toUpperCase());
      // Only accept options in order (A, B, C ...) so "a. " inside a sentence is not mistaken.
      if (idx === cur.options.length) {
        cur.options.push(om[2]);
        cur.mode = 'o';
        continue;
      }
    }
    // continuation of the current part
    if (cur.mode === 'q') cur.text.push(line);
    else if (cur.mode === 'o' && cur.options.length) cur.options[cur.options.length - 1] += ' ' + line;
    else if (cur.mode === 'e') cur.expl.push(line);
  }

  // Answer key at the end of the document.
  const key = new Map<number, number>();
  const keyText = keyLines.join(' ');
  for (const m of keyText.matchAll(/(\d{1,3})\s*[.):\-–]?\s*\(?([A-Ha-h])\)?(?![A-Za-z])/g)) {
    key.set(parseInt(m[1], 10), LETTERS.indexOf(m[2].toUpperCase()));
  }

  const questions: ParsedQuestion[] = [];
  drafts.forEach((d, i) => {
    const text = clean(d.text.join(' '));
    const options = d.options.map(clean).filter(Boolean);
    if (!text) return;
    if (options.length < 2) {
      warnings.push(`Question ${i + 1} ("${text.slice(0, 40)}...") has fewer than 2 options and was skipped.`);
      return;
    }
    let answer = d.answer;
    if (answer === null && key.has(i + 1)) answer = key.get(i + 1)!;
    if (answer !== null && answer >= options.length) {
      warnings.push(`Question ${i + 1}: the answer letter does not match any option. Please tick the right one.`);
      answer = null;
    }
    questions.push({
      id: `q${questions.length + 1}`,
      text,
      options,
      answer,
      explanation: clean(d.expl.join(' ')) || null,
    });
  });

  if (questions.length === 0) {
    warnings.push(
      'No questions were found. Number each question (1. 2. 3.) and put options on their own lines starting A. B. C. D.'
    );
  }
  return { questions, warnings };
}

// Marks a submission. answers: { [questionId]: chosenIndex }
export function markAttempt(
  questions: { id: string; answer: number; options: string[]; text: string; explanation: string | null }[],
  answers: Record<string, unknown>
) {
  let score = 0;
  const review = questions.map((q) => {
    const chosen = typeof answers[q.id] === 'number' ? (answers[q.id] as number) : null;
    const correct = chosen === q.answer;
    if (correct) score++;
    return {
      id: q.id,
      text: q.text,
      options: q.options,
      chosen,
      answer: q.answer,
      correct,
      explanation: q.explanation,
    };
  });
  return { score, total: questions.length, review };
}
