// Turns the run-together text of a solved paper into structure the page can lay out:
// the question, each option on its own line, and the model answer next to the question it belongs to.
//
// The stored text looks like this (one long line):
//   "Section A, Questions 1-20 (BCPC207, December 2015). 1. Which principle ...? a) Honesty b) Justice
//    c) Service d) Respect. 2. One of the key features ... a) ... b) ... c) ... d) ..."
// and the answers are one line per question:
//   "1. a) Honesty: not misrepresenting ...\n2. (c) the leader sells ideas: ..."
// Anything that does not look like multiple choice is returned as null and shown exactly as before.

export type McqOption = { letter: string; text: string };
export type McqItem = { no: number; stem: string; options: McqOption[] };
export type McqBlob = { intro: string; items: McqItem[] };
export type ParsedAnswer = { letter: string | null; text: string };

const LETTERS = 'abcdef';

// Finds "a) ... b) ... c) ..." or "(a) ... (b) ..." in order. Letters must run a, b, c... so a stray "a)" in a sentence is ignored.
export function splitOptions(s: string): { stem: string; options: McqOption[] } | null {
  const re = /(^|\s)\(?([a-fA-F])\)\s*/g;
  const marks: { start: number; end: number; letter: string }[] = [];
  let expect = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) {
    const letter = m[2].toLowerCase();
    if (letter === LETTERS.charAt(expect)) {
      marks.push({ start: m.index + m[1].length, end: m.index + m[0].length, letter });
      expect++;
    }
  }
  if (marks.length < 2) return null;
  const options: McqOption[] = marks.map((mk, i) => ({
    letter: mk.letter,
    text: s.slice(mk.end, i + 1 < marks.length ? marks[i + 1].start : s.length).trim(),
  }));
  return { stem: s.slice(0, marks[0].start).trim(), options };
}

// A whole section stored as one block: "intro. 1. stem a) .. b) .. 2. stem a) .. b) .."
export function parseMcqBlob(text: string): McqBlob | null {
  const re = /(^|\s)(\d{1,3})\.\s+/g;
  const marks: { start: number; end: number; no: number }[] = [];
  let expect = 1;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (parseInt(m[2], 10) === expect) {
      marks.push({ start: m.index + m[1].length, end: m.index + m[0].length, no: expect });
      expect++;
    }
  }
  if (marks.length < 2) return null;

  const items: McqItem[] = [];
  marks.forEach((mk, i) => {
    const body = text.slice(mk.end, i + 1 < marks.length ? marks[i + 1].start : text.length).trim();
    const parts = splitOptions(body);
    items.push(parts ? { no: mk.no, stem: parts.stem, options: parts.options } : { no: mk.no, stem: body, options: [] });
  });

  // Only treat it as multiple choice if most items really have options.
  const withOptions = items.filter((it) => it.options.length >= 2).length;
  if (withOptions < Math.ceil(items.length * 0.6)) return null;
  return { intro: text.slice(0, marks[0].start).trim(), items };
}

// One multiple-choice question with its options in the same line of text.
export function parseSingleMcq(text: string): { stem: string; options: McqOption[] } | null {
  const parts = splitOptions(text);
  return parts && parts.stem ? parts : null;
}

// "1. (c) the answer: why" -> { 1: { letter: 'c', text: '(c) the answer: why' } }
export function parseAnswers(answerText: string): Record<number, ParsedAnswer> {
  const out: Record<number, ParsedAnswer> = {};
  answerText.split('\n').forEach((line) => {
    const m = line.match(/^\s*(\d{1,3})\s*[.)]\s*(.*)$/);
    if (!m) return;
    const rest = m[2].trim();
    const l = rest.match(/^\(?([a-fA-F])\)/);
    out[parseInt(m[1], 10)] = { letter: l ? l[1].toLowerCase() : null, text: rest };
  });
  return out;
}

// Letter of the correct option for a single (unnumbered) question.
export function firstAnswerLetter(answerText: string): string | null {
  const m = answerText.trim().replace(/^\d{1,3}\s*[.)]\s*/, '').match(/^\(?([a-fA-F])\)/);
  return m ? m[1].toLowerCase() : null;
}
