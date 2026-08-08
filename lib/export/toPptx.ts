// lib/export/toPptx.ts
// Client-side only — turns an AI-generated slide outline into a real, downloadable
// .pptx file using pptxgenjs. No backend involved; runs entirely in the browser.

import type PptxGenJS from 'pptxgenjs';

type SlideOutlineItem = {
  title: string;
  bullets: string[];
};

type Outline = {
  deckTitle: string;
  slides: SlideOutlineItem[];
};

// Brand tokens, mirrored from tailwind.config.js
const NAVY = '0D2B5E';
const NAVY_DEEP = '060F1E';
const GOLD = 'C9A02C';
const GOLD_LIGHT = 'E2BE5A';
const OFF_WHITE = 'F7F8FC';

type ThemeColors = {
  background: string;
  titleColor: string;
  bodyColor: string;
  accent: string;
  titleFont: string;
  bodyFont: string;
};

const THEMES: Record<string, ThemeColors> = {
  distinction: {
    background: NAVY,
    titleColor: OFF_WHITE,
    bodyColor: 'D7DCEA',
    accent: GOLD_LIGHT,
    titleFont: 'Playfair Display',
    bodyFont: 'Barlow',
  },
  academic: {
    background: OFF_WHITE,
    titleColor: NAVY,
    bodyColor: '3C4457',
    accent: GOLD,
    titleFont: 'Playfair Display',
    bodyFont: 'Barlow',
  },
  bold: {
    background: NAVY_DEEP,
    titleColor: GOLD_LIGHT,
    bodyColor: 'F7F8FC',
    accent: GOLD,
    titleFont: 'Barlow Condensed',
    bodyFont: 'Barlow',
  },
};

// Fallback theme used for a freeform "custom" style description — defaults to
// the brand theme so output still looks intentional rather than generic black-on-white.
function resolveTheme(styleId: string): ThemeColors {
  return THEMES[styleId] ?? THEMES.distinction;
}

export async function renderOutlineToPptx(
  outline: Outline,
  styleId: string,
  positionId: string = 'centered'
) {
  const PptxGenJSModule = (await import('pptxgenjs')).default;
  const pptx = new PptxGenJSModule() as PptxGenJS;

  pptx.defineLayout({ name: 'WIDE', width: 13.33, height: 7.5 });
  pptx.layout = 'WIDE';

  const theme = resolveTheme(styleId);

  // ===== Title slide =====
  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: theme.background };
  titleSlide.addShape('rect', {
    x: 0,
    y: 3.55,
    w: 1.4,
    h: 0.06,
    fill: { color: theme.accent },
    line: { color: theme.accent },
  });
  titleSlide.addText(outline.deckTitle, {
    x: 0.8,
    y: 2.9,
    w: 11.7,
    h: 1.4,
    fontFace: theme.titleFont,
    fontSize: 40,
    bold: true,
    color: theme.titleColor,
    align: 'left',
  });
  titleSlide.addText('Distinction Library', {
    x: 0.8,
    y: 6.7,
    w: 6,
    h: 0.4,
    fontFace: theme.bodyFont,
    fontSize: 12,
    color: theme.accent,
    align: 'left',
  });

  // ===== Content slides =====
  outline.slides.forEach((slide) => {
    const s = pptx.addSlide();
    s.background = { color: theme.background };

    if (positionId === 'split') {
      // Image + Text: text block on one side, placeholder visual block on the other
      s.addShape('rect', {
        x: 8.3,
        y: 0,
        w: 5.03,
        h: 7.5,
        fill: { color: theme.accent, transparency: 88 },
        line: { color: theme.accent, width: 1 },
      });
      s.addText(slide.title, {
        x: 0.7,
        y: 0.6,
        w: 7.2,
        h: 1,
        fontFace: theme.titleFont,
        fontSize: 28,
        bold: true,
        color: theme.titleColor,
      });
      s.addText(
        slide.bullets.map((b) => ({ text: b, options: { bullet: true, breakLine: true } })),
        {
          x: 0.7,
          y: 1.8,
          w: 7.2,
          h: 5,
          fontFace: theme.bodyFont,
          fontSize: 16,
          color: theme.bodyColor,
          valign: 'top',
          lineSpacingMultiple: 1.3,
        }
      );
    } else if (positionId === 'titlelist') {
      // Title + List: title bar at top, numbered/bulleted list filling the rest
      s.addShape('rect', {
        x: 0,
        y: 0,
        w: 13.33,
        h: 1.4,
        fill: { color: theme.accent, transparency: 90 },
      });
      s.addText(slide.title, {
        x: 0.7,
        y: 0.35,
        w: 11.9,
        h: 0.8,
        fontFace: theme.titleFont,
        fontSize: 28,
        bold: true,
        color: theme.titleColor,
      });
      s.addText(
        slide.bullets.map((b) => ({ text: b, options: { bullet: true, breakLine: true } })),
        {
          x: 0.9,
          y: 1.8,
          w: 11.5,
          h: 5.2,
          fontFace: theme.bodyFont,
          fontSize: 17,
          color: theme.bodyColor,
          valign: 'top',
          lineSpacingMultiple: 1.35,
        }
      );
    } else {
      // Centered (default): title and bullets centered on the slide
      s.addText(slide.title, {
        x: 0.9,
        y: 0.8,
        w: 11.5,
        h: 1,
        fontFace: theme.titleFont,
        fontSize: 28,
        bold: true,
        color: theme.titleColor,
        align: 'center',
      });
      s.addText(
        slide.bullets.map((b) => ({ text: b, options: { bullet: true, breakLine: true } })),
        {
          x: 2.2,
          y: 2.1,
          w: 8.9,
          h: 4.8,
          fontFace: theme.bodyFont,
          fontSize: 16,
          color: theme.bodyColor,
          valign: 'top',
          align: 'left',
          lineSpacingMultiple: 1.3,
        }
      );
    }

    s.addShape('rect', {
      x: 0,
      y: 7.32,
      w: 13.33,
      h: 0.04,
      fill: { color: theme.accent },
    });
  });

  const safeName = outline.deckTitle.replace(/[^\w\s-]/g, '').trim().slice(0, 60) || 'Presentation';
  await pptx.writeFile({ fileName: `${safeName}.pptx` });
}
