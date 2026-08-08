'use client';

type SlideOutlineItem = {
  title: string;
  bullets: string[];
};

type Outline = {
  deckTitle: string;
  slides: SlideOutlineItem[];
};

const NAVY = '0D2B5E';
const GOLD = 'C9A02C';
const OFF_WHITE = 'F7F8FC';
const WHITE = 'FFFFFF';
const GREY_TEXT = '3A3F4B';

function resolveStyle(styleId: string) {
  switch (styleId) {
    case 'academic':
      return { bg: WHITE, accent: NAVY, titleColor: NAVY, bodyColor: GREY_TEXT, bandColor: NAVY };
    case 'bold':
      return { bg: NAVY, accent: GOLD, titleColor: WHITE, bodyColor: OFF_WHITE, bandColor: GOLD };
    case 'distinction':
    default:
      // custom free-text styles fall back to the brand default at render time
      return { bg: OFF_WHITE, accent: GOLD, titleColor: NAVY, bodyColor: GREY_TEXT, bandColor: NAVY };
  }
}

function resolveLayout(positionId: string): 'centered' | 'split' | 'titlelist' {
  if (positionId === 'split' || positionId === 'titlelist') return positionId;
  return 'centered';
}

export async function renderOutlineToPptx(outline: Outline, styleId: string, positionId: string) {
  const PptxGenJS = (await import('pptxgenjs')).default;
  const pptx = new PptxGenJS();

  pptx.defineLayout({ name: 'WIDE', width: 13.33, height: 7.5 });
  pptx.layout = 'WIDE';

  const colors = resolveStyle(styleId);
  const layout = resolveLayout(positionId);

  const title = pptx.addSlide();
  title.background = { color: colors.bg };
  title.addShape('rect', { x: 0, y: 0, w: 13.33, h: 1.2, fill: { color: colors.bandColor } });
  title.addText(outline.deckTitle, {
    x: 0.7,
    y: 2.6,
    w: 11.9,
    h: 1.8,
    fontFace: 'Playfair Display',
    fontSize: 40,
    bold: true,
    color: colors.titleColor,
  });
  title.addShape('rect', { x: 0.7, y: 4.3, w: 1.4, h: 0.06, fill: { color: colors.accent } });
  title.addText('Distinction is not accidental. It is built.', {
    x: 0.7,
    y: 4.55,
    w: 11.9,
    h: 0.5,
    fontFace: 'Barlow',
    fontSize: 14,
    italic: true,
    color: colors.accent,
  });

  outline.slides.forEach((slide, i) => {
    const s = pptx.addSlide();
    s.background = { color: colors.bg };

    if (layout === 'split') {
      s.addShape('rect', { x: 0, y: 0, w: 4.2, h: 7.5, fill: { color: colors.bandColor } });
      s.addText(String(i + 1).padStart(2, '0'), {
        x: 0.5, y: 0.5, w: 3.2, h: 1,
        fontFace: 'Playfair Display', fontSize: 48, bold: true, color: colors.accent,
      });
      s.addText(slide.title, {
        x: 0.5, y: 1.6, w: 3.2, h: 2.5,
        fontFace: 'Barlow Condensed', fontSize: 22, bold: true, color: WHITE,
      });
      s.addText(
        slide.bullets.map((b) => ({ text: b, options: { bullet: true, breakLine: true } })),
        { x: 4.7, y: 0.9, w: 8.0, h: 5.8, fontFace: 'Barlow', fontSize: 18, color: colors.bodyColor, valign: 'top', lineSpacingMultiple: 1.4 }
      );
    } else if (layout === 'titlelist') {
      s.addShape('rect', { x: 0, y: 0, w: 13.33, h: 1.0, fill: { color: colors.bandColor } });
      s.addText(slide.title, {
        x: 0.6, y: 0.15, w: 12.1, h: 0.7,
        fontFace: 'Barlow Condensed', fontSize: 26, bold: true, color: WHITE,
      });
      s.addText(
        slide.bullets.map((b) => ({ text: b, options: { bullet: true, breakLine: true } })),
        { x: 0.9, y: 1.5, w: 11.5, h: 5.5, fontFace: 'Barlow', fontSize: 20, color: colors.bodyColor, valign: 'top', lineSpacingMultiple: 1.5 }
      );
    } else {
      s.addText(slide.title, {
        x: 0.9, y: 0.6, w: 11.5, h: 1.0,
        fontFace: 'Barlow Condensed', fontSize: 28, bold: true, color: colors.titleColor, align: 'center',
      });
      s.addShape('rect', { x: 5.8, y: 1.55, w: 1.7, h: 0.05, fill: { color: colors.accent } });
      s.addText(
        slide.bullets.map((b) => ({ text: b, options: { bullet: true, breakLine: true } })),
        { x: 1.8, y: 2.0, w: 9.7, h: 5.0, fontFace: 'Barlow', fontSize: 19, color: colors.bodyColor, valign: 'top', align: 'left', lineSpacingMultiple: 1.5 }
      );
    }

    s.addText(`${i + 1}`, {
      x: 12.6, y: 7.05, w: 0.6, h: 0.35,
      fontFace: 'Barlow', fontSize: 10, color: colors.accent, align: 'right',
    });
  });

  const safeTitle =
    outline.deckTitle.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_') || 'presentation';
  await pptx.writeFile({ fileName: `${safeTitle}.pptx` });
}
