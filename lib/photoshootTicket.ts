// Draws the matriculation photoshoot ticket as a PNG, so what you see on
// screen is exactly the image you save or share — no screenshot needed.
//
// Design: "Noir invitation" — flat deep navy, double gold frame, serif type,
// gold details and code, and a red CONFIRMED stamp.

import { firstName } from '@/lib/photoshoot';

// `phone` is optional so older callers keep working; when it is missing the
// contact is simply left out of the sentence.
export type TicketData = { name: string; code: string; packageName: string; phone?: string };

const BG = '#091540';
const GOLD = '#C9A02C';
const GOLD_LIGHT = '#E2BE5A';
const CREAM = '#F3EAD2';
const MUTED = '#8F98C0';
const RED = '#EE3F47';

const SERIF = '"Cormorant Garamond", Georgia, "Times New Roman", serif';
const SANS = 'Inter, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

// The ticket is laid out in a 360-unit-wide space, then scaled up to a
// 1000px-wide PNG so it stays sharp when shared.
const LW = 360;
const OUT_W = 1000;
const S = OUT_W / LW;

// ── Fonts ──────────────────────────────────────────────────────────────
// Loaded once from Google Fonts. If they can't load (offline, slow), the
// ticket still draws using Georgia.
let fontsReady: Promise<void> | null = null;

function loadFonts(): Promise<void> {
  if (fontsReady) return fontsReady;
  fontsReady = new Promise<void>((resolve) => {
    if (typeof document === 'undefined') return resolve();
    const done = () => resolve();
    const timeout = setTimeout(done, 3500);
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,700;1,500&family=Inter:wght@400;600;700&display=swap';
    link.onload = async () => {
      try {
        await Promise.all([
          document.fonts.load('italic 500 24px "Cormorant Garamond"'),
          document.fonts.load('700 44px "Cormorant Garamond"'),
          document.fonts.load('400 12px Inter'),
          document.fonts.load('700 10px Inter'),
        ]);
      } catch {
        /* fall back to Georgia */
      }
      clearTimeout(timeout);
      done();
    };
    link.onerror = () => {
      clearTimeout(timeout);
      done();
    };
    document.head.appendChild(link);
  });
  return fontsReady;
}

// ── Text helpers ───────────────────────────────────────────────────────
function trackedWidth(ctx: CanvasRenderingContext2D, text: string, spacing: number) {
  const chars = Array.from(text);
  return chars.reduce((a, c) => a + ctx.measureText(c).width, 0) + spacing * Math.max(chars.length - 1, 0);
}

// Draws text with extra letter spacing, centred or left-aligned, without
// relying on ctx.letterSpacing (not available in every browser).
function tracked(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  spacing: number,
  align: 'left' | 'center' = 'center'
) {
  const chars = Array.from(text);
  const widths = chars.map((c) => ctx.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * Math.max(chars.length - 1, 0);
  let cx = align === 'center' ? x - total / 2 : x;
  const prev = ctx.textAlign;
  ctx.textAlign = 'left';
  chars.forEach((c, i) => {
    ctx.fillText(c, cx, y);
    cx += widths[i] + spacing;
  });
  ctx.textAlign = prev;
}

// Splits plain text into lines no wider than maxWidth (font must be set).
function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  words.forEach((w) => {
    const test = line ? `${line} ${w}` : w;
    if (line && ctx.measureText(test).width > maxWidth) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  });
  if (line) lines.push(line);
  return lines;
}

// ── The booking sentence: plain text with gold "detail" words ──────────
type Part = { t: string; d: boolean };
type Seg = { t: string; d: boolean; w: number };
type Word = { segs: Seg[]; w: number };
type Line = { words: Word[]; w: number };

const DETAIL_SPACING = 1.36; // 0.08em of 17px
const SPACE = 4.5;

function setTextFont(ctx: CanvasRenderingContext2D, detail: boolean) {
  ctx.font = detail ? `700 17px ${SERIF}` : `400 12px ${SANS}`;
}

function layoutParts(ctx: CanvasRenderingContext2D, parts: Part[], maxW: number): Line[] {
  // Break into words; pieces with no space between them (like "(" + name)
  // stay glued together on the same word.
  const raw: { t: string; d: boolean }[][] = [[]];
  parts.forEach((p) => {
    p.t.split(/(\s+)/).forEach((piece) => {
      if (!piece) return;
      if (/^\s+$/.test(piece)) raw.push([]);
      else raw[raw.length - 1].push({ t: piece, d: p.d });
    });
  });

  const words: Word[] = raw
    .filter((segs) => segs.length)
    .map((segs) => {
      const measured = segs.map((s) => {
        setTextFont(ctx, s.d);
        return { ...s, w: s.d ? trackedWidth(ctx, s.t, DETAIL_SPACING) : ctx.measureText(s.t).width };
      });
      return { segs: measured, w: measured.reduce((a, s) => a + s.w, 0) };
    });

  const lines: Line[] = [];
  let cur: Line = { words: [], w: 0 };
  words.forEach((w) => {
    const next = cur.words.length ? cur.w + SPACE + w.w : w.w;
    if (cur.words.length && next > maxW) {
      lines.push(cur);
      cur = { words: [w], w: w.w };
    } else {
      cur.words.push(w);
      cur.w = next;
    }
  });
  if (cur.words.length) lines.push(cur);
  return lines;
}

function drawLine(ctx: CanvasRenderingContext2D, line: Line, y: number) {
  let x = (LW - line.w) / 2;
  ctx.textAlign = 'left';
  line.words.forEach((word, wi) => {
    if (wi > 0) x += SPACE;
    word.segs.forEach((s) => {
      setTextFont(ctx, s.d);
      if (s.d) {
        ctx.fillStyle = GOLD_LIGHT;
        tracked(ctx, s.t, x, y, DETAIL_SPACING, 'left');
      } else {
        ctx.fillStyle = MUTED;
        ctx.fillText(s.t, x, y);
      }
      x += s.w;
    });
  });
}

// ── The red CONFIRMED stamp ────────────────────────────────────────────
function drawStamp(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((-11 * Math.PI) / 180);
  const k = size / 120;
  ctx.scale(k, k);
  ctx.translate(-60, -60);

  ctx.strokeStyle = RED;
  ctx.fillStyle = RED;

  // Outer rings
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.arc(60, 60, 56, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.arc(60, 60, 51, 0, Math.PI * 2);
  ctx.stroke();

  // Text around the ring, starting at the left and running clockwise
  const ring = 'MATRICULATION PHOTOSHOOT ★ BOOKING ★';
  const chars = Array.from(ring);
  const rad = 41;
  ctx.font = `700 10.5px ${SANS}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const widths = chars.map((c) => ctx.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0);
  const gap = (2 * Math.PI * rad - total) / chars.length;
  let travelled = 0;
  chars.forEach((c, i) => {
    const mid = travelled + widths[i] / 2;
    const a = Math.PI + mid / rad;
    ctx.save();
    ctx.translate(60 + rad * Math.cos(a), 60 + rad * Math.sin(a));
    ctx.rotate(a + Math.PI / 2);
    ctx.fillText(c, 0, 0);
    ctx.restore();
    travelled += widths[i] + gap;
  });

  // Tick
  ctx.lineWidth = 4.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(47, 48);
  ctx.lineTo(56, 58);
  ctx.lineTo(74, 38);
  ctx.stroke();

  // CONFIRMED
  ctx.font = `700 9.6px ${SANS}`;
  tracked(ctx, 'CONFIRMED', 60, 74, 0.3);
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(46, 81);
  ctx.lineTo(74, 81);
  ctx.stroke();

  ctx.restore();
}

// ── The ticket ─────────────────────────────────────────────────────────
export async function renderTicket(data: TicketData): Promise<Blob> {
  await loadFonts();

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  // 1) Measure everything first, so the card is exactly as tall as it needs.
  const title = 'Thank you for choosing to do business with us.';
  ctx.font = `italic 500 24px ${SERIF}`;
  const titleLines = wrap(ctx, title, 304);

  const details: string[] = [firstName(data.name).toUpperCase(), data.packageName.trim().toUpperCase()];
  if (data.phone && data.phone.trim()) details.push(data.phone.trim());

  const parts: Part[] = [{ t: 'Your booking (', d: false }];
  details.forEach((d, i) => {
    parts.push({ t: d, d: true });
    if (i < details.length - 1) parts.push({ t: ', ', d: false });
  });
  parts.push({ t: ') has been confirmed successfully.', d: false });
  const textLines = layoutParts(ctx, parts, 292);

  ctx.font = `italic 500 14.5px ${SERIF}`;
  const footLines = wrap(ctx, 'Show this to the photographer, or mention your code.', 176);

  ctx.font = `700 44px ${SERIF}`;
  const codeW = trackedWidth(ctx, data.code, 7);
  ctx.font = `500 8.5px ${SANS}`;
  const label = 'YOUR CODE IS';
  const labelW = trackedWidth(ctx, label, 1.9);
  const rowW = labelW + 12 + codeW + 28;

  const titleY0 = 76;
  const titleLH = 26.4;
  const textY0 = titleY0 + (titleLines.length - 1) * titleLH + 34;
  const textLH = 22;
  const textEnd = textY0 + (textLines.length - 1) * textLH + 7;
  const codeTop = textEnd + 22;
  const codeBase = codeTop + 46;
  const codeBottom = codeBase + 8;
  const footY0 = codeBottom + 45;
  const footLH = 19.6;
  const footLast = footY0 + (footLines.length - 1) * footLH;
  const LH = Math.ceil(Math.max(footLast + 38, codeBottom + 106));

  // 2) Draw.
  canvas.width = OUT_W;
  canvas.height = Math.round(LH * S);
  ctx.scale(S, S);
  ctx.textBaseline = 'alphabetic';

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, LW, LH);

  // Double gold frame
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 1;
  ctx.strokeRect(8.5, 8.5, LW - 17, LH - 17);
  ctx.strokeStyle = 'rgba(201,160,44,0.35)';
  ctx.strokeRect(12.5, 12.5, LW - 25, LH - 25);

  // Eyebrow
  ctx.fillStyle = GOLD;
  ctx.font = `500 9px ${SANS}`;
  tracked(ctx, 'MATRICULATION PHOTOSHOOT', LW / 2, 44, 3.06);

  // Thank-you line
  ctx.fillStyle = CREAM;
  ctx.textAlign = 'center';
  ctx.font = `italic 500 24px ${SERIF}`;
  titleLines.forEach((l, i) => ctx.fillText(l, LW / 2, titleY0 + i * titleLH));

  // Booking sentence
  textLines.forEach((l, i) => drawLine(ctx, l, textY0 + i * textLH));

  // Code, between two gold hairlines
  const rx = (LW - rowW) / 2;
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(rx, codeTop);
  ctx.lineTo(rx + rowW, codeTop);
  ctx.moveTo(rx, codeBottom);
  ctx.lineTo(rx + rowW, codeBottom);
  ctx.stroke();

  const contentX = rx + 14;
  ctx.fillStyle = GOLD;
  ctx.font = `500 8.5px ${SANS}`;
  tracked(ctx, label, contentX, codeBase, 1.9, 'left');
  ctx.fillStyle = GOLD_LIGHT;
  ctx.font = `700 44px ${SERIF}`;
  tracked(ctx, data.code, contentX + labelW + 12, codeBase, 7, 'left');

  // Instruction line, centred
  ctx.fillStyle = CREAM;
  ctx.textAlign = 'center';
  ctx.font = `italic 500 14.5px ${SERIF}`;
  footLines.forEach((l, i) => ctx.fillText(l, LW / 2, footY0 + i * footLH));

  // Stamp, bottom-right inside the frame
  drawStamp(ctx, LW - 12 - 45, LH - 10 - 45, 90);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not create image'))), 'image/png');
  });
}
