import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Join the Distinction Programme',
  description: 'Peer-led, assessment-driven extra classes for UPSA students. Pick your level and join your WhatsApp group.',
  openGraph: {
    title: 'Join the Distinction Programme',
    description: 'Peer-led, assessment-driven extra classes for UPSA students. Pick your level and join your WhatsApp group.',
  },
};

// ---------------------------------------------------------------------------
// THE TWO WHATSAPP INVITE LINKS. To change a link later, replace it here (it must start with
// https://chat.whatsapp.com/). If a link is ever removed, that level's button shows "Link coming soon".
// ---------------------------------------------------------------------------
const GROUPS = [
  { level: 'Level 100', name: 'MahamaCares', href: 'https://chat.whatsapp.com/IMXPTiNqWR496u1bOm0Eoz?s=cl&p=a&mlu=4&ilr=4&iam=2' },
  { level: 'Level 200', name: 'Distinction Programme', href: 'https://chat.whatsapp.com/IbMtGP4aNvY6QGPDUQQDvV?s=cl&p=a&mlu=4&ilr=4&iam=2' },
];

const isReal = (href: string) => href.startsWith('https://chat.whatsapp.com/');

const JOIN_CSS = `
@keyframes jn-pop{from{opacity:0;transform:scale(.6) translateY(8px)}}
@keyframes jn-dot{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-4px);opacity:1}}
@keyframes jn-fade{to{opacity:0;height:0;margin:0;padding:0}}
@media (prefers-reduced-motion:reduce){.jn-bg *{animation:none!important}}

.jn-bg{min-height:100vh;background-color:#EAE0D2;background-image:radial-gradient(rgba(0,0,0,.06) 1.5px,transparent 1.5px);background-size:22px 22px;color:#111B21;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;font-size:15px;line-height:1.4}
.jn-bg *{box-sizing:border-box}
.jn{max-width:480px;margin:0 auto;min-height:100vh;padding-bottom:40px;box-shadow:0 0 40px rgba(0,0,0,.12)}
.jn a{text-decoration:none;color:inherit}

.jn-top{position:sticky;top:0;z-index:2;display:flex;align-items:center;gap:12px;padding:12px 16px;background:#075E54;color:#fff}
.jn-av{flex:none;width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#25D366,#F2B632);display:grid;place-items:center;font-weight:800;color:#075E54}
.jn-top h1{margin:0;font-size:16px;line-height:1.2;font-weight:700}
.jn-top p{margin:2px 0 0;font-size:12px;opacity:.85}
.jn-live{display:inline-block;width:8px;height:8px;border-radius:50%;background:#7CFFA6;margin-right:5px}

.jn-chat{padding:18px 14px 0}
.jn-chip{display:block;width:max-content;max-width:92%;margin:0 auto 16px;background:#FFF3C4;font-size:12px;padding:6px 12px;border-radius:8px;text-align:center;box-shadow:0 1px 1px rgba(0,0,0,.12);animation:jn-pop .5s both}
.jn-bub{position:relative;max-width:84%;margin:0 0 10px;padding:9px 12px 8px;border-radius:0 14px 14px 14px;background:#fff;box-shadow:0 1px 1px rgba(0,0,0,.15);font-size:15.5px;transform-origin:0 0}
.jn-bub em{display:block;margin-bottom:2px;font-style:normal;font-size:11px;font-weight:700;color:#128C7E}
.jn-b1{animation:jn-pop .5s .5s both}
.jn-b2{animation:jn-pop .5s 1.9s both}
.jn-b2 strong{display:block;font-size:19px;font-weight:700}

.jn-typing{display:flex;gap:5px;width:max-content;margin:0 0 10px;padding:13px 14px;border-radius:0 14px 14px 14px;background:#fff;box-shadow:0 1px 1px rgba(0,0,0,.15);overflow:hidden;animation:jn-pop .4s 1.1s both,jn-fade .1s 1.85s forwards}
.jn-typing u{width:7px;height:7px;border-radius:50%;background:#8696A0;animation:jn-dot 1s infinite}
.jn-typing u:nth-child(2){animation-delay:.15s}
.jn-typing u:nth-child(3){animation-delay:.3s}

.jn-reply{display:block;max-width:88%;margin:12px 0 12px auto;padding:12px 14px 9px;border-radius:14px 0 14px 14px;background:#D9FDD3;box-shadow:0 1px 1px rgba(0,0,0,.15),0 0 0 2px #25D366;transform-origin:100% 0;transition:transform .15s}
a.jn-reply:active{transform:scale(.97)}
.jn-r0{animation:jn-pop .5s 2.6s both}
.jn-r1{animation:jn-pop .5s 3.1s both}
.jn-reply b{display:block;font-size:17px}
.jn-reply span{display:block;font-size:15px;font-style:italic;color:#3B5F3A}
.jn-reply small{display:flex;justify-content:space-between;margin-top:6px;font-size:11.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#128C7E}
.jn-reply small::after{content:'\\2713\\2713';letter-spacing:0;color:#34B7F1}

.jn-reply.off{background:#EDEDED;box-shadow:0 0 0 2px #B8B8B8;pointer-events:none}
.jn-reply.off b,.jn-reply.off span,.jn-reply.off small{color:#8A8A8A}
.jn-reply.off small::after{content:''}

.jn-fine{margin-top:20px;animation:jn-pop .5s 3.6s both}
`;

export default function JoinPage() {
  return (
    <div className="jn-bg">
      <style>{JOIN_CSS}</style>
      <main className="jn">
        <header className="jn-top">
          <div className="jn-av" aria-hidden="true">DL</div>
          <div>
            <h1>The Distinction Library × Distinction Programme</h1>
            <p>
              <i className="jn-live" aria-hidden="true" />
              Peer-led extra classes
            </p>
          </div>
        </header>

        <div className="jn-chat">
          <p className="jn-chip">Today</p>

          <div className="jn-bub jn-b1">
            <em>Distinction Programme</em>
            Assessment-driven extra classes for UPSA students, led by fellow students.
          </div>

          <div className="jn-typing" aria-hidden="true">
            <u />
            <u />
            <u />
          </div>

          <div className="jn-bub jn-b2">
            <h2 style={{ margin: 0 }}>
              <strong>Which level are you in?</strong>
            </h2>
          </div>

          {GROUPS.map((g, i) =>
            isReal(g.href) ? (
              <a
                key={g.level}
                href={g.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`jn-reply jn-r${i % 2}`}
              >
                <b>{g.level}</b>
                <span>{g.name}</span>
                <small>Tap to join on WhatsApp</small>
              </a>
            ) : (
              <div key={g.level} className={`jn-reply off jn-r${i % 2}`} aria-disabled="true">
                <b>{g.level}</b>
                <span>{g.name}</span>
                <small>Link coming soon</small>
              </div>
            )
          )}

          <p className="jn-chip jn-fine">Tap your level and WhatsApp opens the group for you.</p>
        </div>
      </main>
    </div>
  );
}
