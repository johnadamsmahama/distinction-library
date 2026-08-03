import JSZip from 'jszip';

/**
 * Extracts plain text from a .pptx file by reading the slide XML directly
 * out of the zip archive (a .pptx is just a zip of XML files under the hood).
 *
 * Only pulls visible text runs (<a:t> tags) from each slide, in slide order.
 * Speaker notes are intentionally skipped — we only care about what's
 * actually on the slide for matching against the claimed label.
 */
export async function extractPptxText(buffer: Buffer): Promise<string | null> {
  try {
    const zip = await JSZip.loadAsync(buffer);

    const slideFiles = Object.keys(zip.files)
      .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
      .sort((a, b) => {
        const numA = parseInt(a.match(/slide(\d+)\.xml/)?.[1] ?? '0', 10);
        const numB = parseInt(b.match(/slide(\d+)\.xml/)?.[1] ?? '0', 10);
        return numA - numB;
      });

    if (slideFiles.length === 0) return null;

    const slideTexts: string[] = [];

    for (const path of slideFiles) {
      const xml = await zip.files[path].async('text');
      // Pull every <a:t>...</a:t> text run. This is the run-level text node
      // used throughout OOXML slide markup — good enough for a content check
      // without pulling in a full XML parser dependency.
      const matches = [...xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)];
      const slideText = matches
        .map((m) => decodeXmlEntities(m[1]))
        .join(' ')
        .trim();
      if (slideText) slideTexts.push(slideText);
    }

    const fullText = slideTexts.join('\n\n').trim();
    return fullText || null;
  } catch (e) {
    console.error('PPTX text extraction failed:', e);
    return null;
  }
}

function decodeXmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}
