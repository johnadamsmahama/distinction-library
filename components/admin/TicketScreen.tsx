'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { renderTicket, type TicketData } from '@/lib/photoshootTicket';
import { confirmationMessage } from '@/lib/photoshoot';

export type Ticket = TicketData;

// A clean full-screen page showing just the ticket, with buttons underneath.
// The ticket is a real PNG image, so it can be screenshotted, saved, or sent
// to ANY app or contact from the share sheet (no WhatsApp number needed).
//
// Used as a real page (/admin/photoshoot/ticket/[code]). "Done" goes back to
// the bookings screen. Pass onClose only if you want to use it as an overlay.
export default function TicketScreen({
  ticket,
  onClose,
  backHref = '/admin/photoshoot',
}: {
  ticket: Ticket;
  onClose?: () => void;
  backHref?: string;
}) {
  const router = useRouter();
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let objectUrl = '';
    setBlob(null);
    setUrl('');
    renderTicket(ticket)
      .then((b) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(b);
        setBlob(b);
        setUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setNote('Could not draw the ticket. Use Copy message instead.');
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [ticket.name, ticket.code, ticket.packageName]);

  // Stop the page behind from scrolling while the ticket is open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const fileName = `${ticket.code}-ticket.png`;

  const close = () => {
    if (onClose) {
      onClose();
      return;
    }
    router.push(backHref);
    router.refresh(); // so the new booking shows in the list
  };

  const save = () => {
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const share = async () => {
    if (!blob) return;
    setNote('');
    const file = new File([blob], fileName, { type: 'image/png' });
    const nav = navigator as Navigator & { canShare?: (data: any) => boolean };
    if (nav.canShare && nav.canShare({ files: [file] })) {
      try {
        await nav.share({ files: [file], text: confirmationMessage(ticket.name, ticket.code) });
      } catch (e) {
        if ((e as any)?.name !== 'AbortError') setNote('Could not open the share menu. Use Save image instead.');
      }
    } else {
      save();
      setNote('Sharing is not available here, so the image was saved. Send it from your gallery.');
    }
  };

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(confirmationMessage(ticket.name, ticket.code));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setNote('Could not copy. Select the text manually.');
    }
  };

  const action =
    'font-condensed font-bold text-sm uppercase tracking-wide px-4 py-3 rounded-none border transition-colors';

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#04103A]">
      <div className="min-h-full flex flex-col items-center px-4 py-5">
        <div className="w-full max-w-[420px]">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={`Booking ticket ${ticket.code}`} className="w-full h-auto block" />
          ) : (
            <div className="w-full aspect-[2/3] bg-white/5 animate-pulse" />
          )}

          <div className="grid grid-cols-2 gap-2 mt-4">
            <button
              type="button"
              onClick={share}
              disabled={!blob}
              className={`${action} bg-gold text-navy border-gold disabled:opacity-50`}
            >
              Share ticket
            </button>
            <button
              type="button"
              onClick={save}
              disabled={!blob}
              className={`${action} bg-transparent text-white border-white/40 disabled:opacity-50`}
            >
              Save image
            </button>
            <button type="button" onClick={copyMessage} className={`${action} bg-transparent text-white border-white/40`}>
              {copied ? 'Copied ✓' : 'Copy message'}
            </button>
            <button type="button" onClick={close} className={`${action} bg-white text-navy border-white`}>
              Done
            </button>
          </div>

          {note && <p className="font-body text-xs text-white/80 mt-3 leading-snug">{note}</p>}
        </div>
      </div>
    </div>
  );
}
