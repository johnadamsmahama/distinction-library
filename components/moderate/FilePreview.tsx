'use client';

import { useEffect, useState } from 'react';

// Extensions the browser can render natively inside an <iframe>.
const NATIVE_PREVIEW_EXTS = ['pdf', 'jpg', 'jpeg', 'png'];
// Office formats — browsers can't render these inline at all, so they're
// routed through Microsoft's free Office Online viewer instead, which
// fetches the file itself and renders it inline (still no download to
// the moderator's device).
const OFFICE_EXTS = ['ppt', 'pptx', 'doc', 'docx'];

function getExtension(pathOrUrl: string): string {
  const clean = pathOrUrl.split('?')[0];
  const ext = clean.split('.').pop() ?? '';
  return ext.toLowerCase();
}

// Papers store a raw internal storage path in file_url (private bucket).
// Materials already store a full public URL. Papers need a short-lived
// signed URL fetched on demand; materials can render straight away.
//
// Shared by the Moderation Queue (pending items) and Auto-Publish Review
// (already-live items) — both need the identical preview behavior, so this
// lives on its own rather than being duplicated in each screen.
export default function FilePreview({ kind, fileUrl }: { kind: 'paper' | 'material'; fileUrl: string }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(kind === 'material' ? fileUrl : null);
  const [loading, setLoading] = useState(kind === 'paper');
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    if (kind !== 'paper') return;
    let cancelled = false;
    setLoading(true);
    setPreviewError(null);

    fetch('/api/moderation/preview-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bucket: 'past-papers', path: fileUrl }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.url) setPreviewUrl(data.url);
        else setPreviewError(data.error ?? 'Could not load preview.');
      })
      .catch(() => {
        if (!cancelled) setPreviewError('Could not load preview.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [kind, fileUrl]);

  const ext = getExtension(fileUrl);
  const isOffice = OFFICE_EXTS.includes(ext);
  const isNative = NATIVE_PREVIEW_EXTS.includes(ext);

  const displaySrc =
    previewUrl && isOffice
      ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(previewUrl)}`
      : previewUrl;

  return (
    <div className="mt-3 pt-3 border-t border-g100">
      {loading ? (
        <p className="font-body text-xs text-g600 py-6 text-center">Loading preview…</p>
      ) : previewError ? (
        <p className="font-body text-xs text-red-500 py-6 text-center">{previewError}</p>
      ) : displaySrc ? (
        <>
          {!isNative && !isOffice && (
            <p className="font-body text-[11px] text-g600 mb-2">
              This file type can&apos;t be previewed inline — use &ldquo;Open in new tab&rdquo; below.
            </p>
          )}
          <iframe
            src={displaySrc}
            className="w-full h-[60vh] max-h-[420px] rounded-none border border-g100 bg-white"
            title="Document preview"
          />
          {previewUrl && (
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-condensed font-bold text-xs uppercase text-gold hover:underline mt-2 inline-block"
            >
              Open in new tab →
            </a>
          )}
        </>
      ) : null}
    </div>
  );
}
