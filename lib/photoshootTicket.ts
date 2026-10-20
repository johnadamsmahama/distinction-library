// Draws the matriculation photoshoot ticket as a PNG, so what you see on
// screen is exactly the image you save or share — no screenshot needed.

export type TicketData = { name: string; code: string; packageName: string };

const NAVY = '#0B1F5C';
const BLUE_TOP = '#0B2A9E';
const BLUE_BOTTOM = '#04103A';
const GOLD = '#F0B429';
const CREAM = '#FBF8F0';
const GRAY = '#7A7F8E';
const GREEN = '#1F9D55';
const SERIF = 'Georgia, "Times New Roman", serif';
const SANS = '-apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

const W = 1000;
const H = 1500;

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
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1);
  let cx = align === 'center' ? x - total / 2 : x;
  const prev = ctx.textAlign;
  ctx.textAlign = 'left';
  chars.forEach((c, i) => {
    ctx.fillText(c, cx, y);
    cx += widths[i] + spacing;
  });
  ctx.textAlign = prev;
}

// Shrinks the font until the text fits, then trims with "…" as a last resort.
function fit(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  startSize: number,
  minSize: number,
  weight: string,
  family: string
) {
  let size = startSize;
  ctx.font = `${weight} ${size}px ${family}`;
  while (ctx.measureText(text).width > maxWidth && size > minSize) {
    size -= 2;
    ctx.font = `${weight} ${size}px ${family}`;
  }
  let out = text;
  while (ctx.measureText(out).width > maxWidth && out.length > 1) {
    out = out.slice(0, -1);
  }
  return out === text ? text : `${out.trimEnd()}…`;
}

export async function renderTicket(data: TicketData): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  // ── Background ──
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, BLUE_TOP);
  bg.addColorStop(1, BLUE_BOTTOM);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Soft camera-lens rings, like the flyer
  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  ctx.lineWidth = 4;
  [120, 200, 290].forEach((r) => {
    ctx.beginPath();
    ctx.arc(880, 120, r, 0, Math.PI * 2);
    ctx.stroke();
  });
  [100, 190].forEach((r) => {
    ctx.beginPath();
    ctx.arc(90, 1420, r, 0, Math.PI * 2);
    ctx.stroke();
  });

  // ── Ticket shape (rounded corners, notches at the tear line) ──
  const L = 70, R = 930, T = 80, B = 1290;
  const PERF = 900;
  const r = 38; // corner radius
  const n = 34; // notch radius

  const ticketPath = () => {
    ctx.beginPath();
    ctx.moveTo(L + r, T);
    ctx.lineTo(R - r, T);
    ctx.arcTo(R, T, R, T + r, r);
    ctx.lineTo(R, PERF - n);
    ctx.arc(R, PERF, n, -Math.PI / 2, Math.PI / 2, true);
    ctx.lineTo(R, B - r);
    ctx.arcTo(R, B, R - r, B, r);
    ctx.lineTo(L + r, B);
    ctx.arcTo(L, B, L, B - r, r);
    ctx.lineTo(L, PERF + n);
    ctx.arc(L, PERF, n, Math.PI / 2, -Math.PI / 2, true);
    ctx.lineTo(L, T + r);
    ctx.arcTo(L, T, L + r, T, r);
    ctx.closePath();
  };

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 16;
  ticketPath();
  ctx.fillStyle = CREAM;
  ctx.fill();
  ctx.restore();

  // ── Header band ──
  ctx.save();
  ticketPath();
  ctx.clip();
  const head = ctx.createLinearGradient(0, T, 0, T + 290);
  head.addColorStop(0, BLUE_TOP);
  head.addColorStop(1, '#071A63');
  ctx.fillStyle = head;
  ctx.fillRect(L, T, R - L, 290);
  ctx.fillStyle = GOLD;
  ctx.fillRect(L, T + 290, R - L, 8);
  ctx.restore();

  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `bold 96px ${SERIF}`;
  ctx.fillText('Matriculation', W / 2, T + 140);
  ctx.fillStyle = GOLD;
  ctx.font = `italic 700 100px ${SERIF}`;
  ctx.fillText('Photoshoot', W / 2, T + 250);

  // ── Confirmed badge ──
  ctx.fillStyle = GREEN;
  ctx.beginPath();
  ctx.arc(W / 2, 480, 40, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(W / 2 - 17, 481);
  ctx.lineTo(W / 2 - 4, 495);
  ctx.lineTo(W / 2 + 19, 466);
  ctx.stroke();

  ctx.fillStyle = GREEN;
  ctx.font = `bold 30px ${SANS}`;
  tracked(ctx, 'BOOKING CONFIRMED', W / 2, 568, 6);

  // ── Details ──
  const textX = L + 70;
  const maxW = R - L - 140;

  ctx.fillStyle = GRAY;
  ctx.font = `bold 22px ${SANS}`;
  tracked(ctx, 'NAME', textX, 650, 5, 'left');
  ctx.fillStyle = NAVY;
  ctx.textAlign = 'left';
  const nameText = fit(ctx, data.name.trim(), maxW, 58, 34, 'bold', SANS);
  ctx.fillText(nameText, textX, 712);

  ctx.fillStyle = GRAY;
  ctx.font = `bold 22px ${SANS}`;
  tracked(ctx, 'PACKAGE', textX, 790, 5, 'left');
  ctx.fillStyle = NAVY;
  ctx.textAlign = 'left';
  const pkgText = fit(ctx, data.packageName, maxW, 58, 34, 'bold', SANS);
  ctx.fillText(pkgText, textX, 852);

  // ── Tear line ──
  ctx.strokeStyle = '#C9C4B4';
  ctx.lineWidth = 3;
  ctx.setLineDash([14, 12]);
  ctx.beginPath();
  ctx.moveTo(L + n + 16, PERF);
  ctx.lineTo(R - n - 16, PERF);
  ctx.stroke();
  ctx.setLineDash([]);

  // ── Code stub ──
  ctx.textAlign = 'center';
  ctx.fillStyle = GRAY;
  ctx.font = `bold 24px ${SANS}`;
  tracked(ctx, 'YOUR CODE', W / 2, 985, 8);

  const bx = L + 70, by = 1010, bw = R - L - 140, bh = 180;
  ctx.fillStyle = '#F2EBD3';
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, 22);
  ctx.fill();
  ctx.strokeStyle = NAVY;
  ctx.lineWidth = 4;
  ctx.setLineDash([16, 12]);
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, 22);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = NAVY;
  ctx.textBaseline = 'middle';
  ctx.font = `bold 150px ${SANS}`;
  tracked(ctx, data.code, W / 2, by + bh / 2 + 6, 14);
  ctx.textBaseline = 'alphabetic';

  ctx.fillStyle = GRAY;
  ctx.textAlign = 'center';
  ctx.font = `24px ${SANS}`;
  ctx.fillText('Present this ticket on the day of your shoot', W / 2, 1250);

  // ── Footer on the blue ──
  ctx.fillStyle = GOLD;
  ctx.font = `bold 22px ${SANS}`;
  tracked(ctx, 'FOR BOOKINGS & ENQUIRIES', W / 2, 1368, 6);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `bold 40px ${SANS}`;
  ctx.fillText('0248111310 / 0596890553', W / 2, 1426);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not create image'))), 'image/png');
  });
}
