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
.jn-bg{--paper:#FBF6E8;--rule:#D9CDA8;--red:#8A2E2E;--ink:#2A2418;--mut:#8A7A5C;min-height:100vh;background:var(--paper) linear-gradient(transparent 27px,var(--rule) 27px) 0 3px/100% 28px;color:var(--ink);font:15px/28px Georgia,'Times New Roman',serif}
.jn{position:relative;max-width:560px;margin:0 auto;min-height:100vh;padding:28px 40px 56px}
.jn::before,.jn::after{content:'';position:absolute;top:0;bottom:0;width:2px;background:#C0504D;opacity:.8;pointer-events:none}
.jn::before{left:28px}.jn::after{right:28px}
.jn *{box-sizing:border-box;border-radius:0}
.jn-hd{position:relative;text-align:center}.jn-hd::after{content:'';position:absolute;left:0;right:0;top:100%;height:4px;border-top:3px double var(--red)}
.jn-org{position:relative;font-size:15px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#1B1710}
.jn-x{position:absolute;left:50%;top:28px;transform:translate(-50%,-50%);font-size:18px;line-height:16px;font-weight:700;letter-spacing:0;background:var(--paper);padding:0 6px}
.jn-title{font:800 21px/28px Georgia,serif;color:#1B1710;text-transform:uppercase;letter-spacing:.05em}
.jn-sub{text-align:center;font-style:italic;font-size:14px;color:#6B5D3F}
.jn-ask{margin-top:28px;font-size:13px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:var(--red);text-align:center}
.jn-btn{display:block;height:112px;margin:14px 0;padding:6px 20px;background:var(--red);color:#F6EFDC;text-decoration:none;text-align:center;border:0}
.jn-btn b{display:block;font:800 22px/44px Georgia,serif;letter-spacing:.12em;text-transform:uppercase}
.jn-btn span{display:block;font:italic 17px/28px Georgia,serif}
.jn-btn small{display:block;font-size:11px;line-height:28px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;opacity:.85}
.jn-btn.off{background:var(--paper);color:var(--mut);border:1px dashed var(--mut);pointer-events:none}
.jn-fine{margin-top:14px;text-align:center;font-size:13px;font-style:italic;color:#6B5D3F}
`;

export default function JoinPage() {
  return (
    <div className="jn-bg">
      <style>{JOIN_CSS}</style>
      <main className="jn">
        <div className="jn-hd">
          <p className="jn-org">
            The Distinction Library<span className="jn-x">×</span>
            <br />
            Distinction Programme
          </p>
          <h1 className="jn-title">Peer-led extra classes</h1>
        </div>
        <p className="jn-sub">
          Assessment-driven extra classes for UPSA students,
          <br />
          led by fellow students.
        </p>

        <h2 className="jn-ask">Which level are you in?</h2>
        {GROUPS.map((g) =>
          isReal(g.href) ? (
            <a key={g.level} href={g.href} target="_blank" rel="noopener noreferrer" className="jn-btn">
              <b>{g.level}</b>
              <span>{g.name}</span>
              <small>Tap to join on WhatsApp</small>
            </a>
          ) : (
            <div key={g.level} className="jn-btn off" aria-disabled="true">
              <b>{g.level}</b>
              <span>{g.name}</span>
              <small>Link coming soon</small>
            </div>
          )
        )}
        <p className="jn-fine">Tap your level and WhatsApp opens the group for you.</p>
      </main>
    </div>
  );
}
