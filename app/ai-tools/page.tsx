import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

const TOOLS = [
  {
    href: '/ai-tools/companion',
    title: 'Study Companion',
    desc: 'Ask questions about your own course material and get step-by-step explanations.',
  },
  {
    href: '/ai-tools/quiz-generator',
    title: 'Quiz Generator',
    desc: 'Turn your notes or a past paper into a practice quiz in seconds.',
  },
  {
    href: '/ai-tools/presentation-kit',
    title: 'Presentation Kit',
    desc: 'Turn a topic, a Vault item, or an uploaded document into a PowerPoint (PPTX) ready to present.',
  },
];

function CompanionIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 12 5.5 7.5M12 12l7 -3.8M12 12v7.3M12 12 5 16.2M12 12l7 4.5"
        stroke="#D4A017"
        strokeWidth="1.3"
        strokeLinecap="round"
        opacity="0.75"
      />
      <circle cx="12" cy="12" r="2.5" fill="#D4A017" />
      <circle cx="5.5" cy="7.5" r="1.5" fill="#D4A017" opacity="0.85" />
      <circle cx="19" cy="8.2" r="1.5" fill="#D4A017" opacity="0.85" />
      <circle cx="12" cy="19.3" r="1.5" fill="#D4A017" opacity="0.85" />
      <circle cx="5" cy="16.2" r="1.5" fill="#D4A017" opacity="0.85" />
      <circle cx="19" cy="16.5" r="1.5" fill="#D4A017" opacity="0.85" />
    </svg>
  );
}

function QuizIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="5" y="3" width="14" height="18" rx="1.5" stroke="#D4A017" strokeWidth="1.5" />
      <path d="M8.2 8.3 9.4 9.5l2.1-2.3" stroke="#D4A017" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.6 8.3H16" stroke="#D4A017" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M8.2 13.3 9.4 14.5l2.1-2.3" stroke="#D4A017" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.6 13.3H16" stroke="#D4A017" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M8.2 18h7.8" stroke="rgba(212,160,23,0.4)" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function PresentationIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="13" rx="1.5" stroke="#D4A017" strokeWidth="1.5" />
      <path d="M8 21h8" stroke="#D4A017" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M12 17v4" stroke="#D4A017" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M7 13.2 10 9l2.3 2.6L17 7" stroke="#D4A017" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
    </svg>
  );
}

const ICONS = [CompanionIcon, QuizIcon, PresentationIcon];

export default async function AiToolsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div>
      <div className="font-condensed font-bold text-[10px] uppercase tracking-widest mb-1.5 text-gold">
        Distinction Library Intelligence
      </div>
      <h1 className="font-display font-bold text-2xl text-white mb-1">AI Tools</h1>
      <p className="font-body text-xs text-white/55 mb-5">
        AI-powered study help, built on your own material.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {TOOLS.map((tool, i) => {
          const Icon = ICONS[i];
          return (
            <a key={tool.href} href={tool.href} className="relative block group">
              <div
                className="absolute -top-16 left-1/2 -translate-x-1/2 w-[220px] h-[220px] pointer-events-none"
                style={{
                  background: 'radial-gradient(circle, rgba(212,160,23,0.35) 0%, rgba(212,160,23,0) 70%)',
                  filter: 'blur(2px)',
                }}
              />
              <div
                className="relative rounded-2xl p-4 transition-all backdrop-blur-sm overflow-hidden border border-[rgba(212,160,23,0.25)] group-hover:border-gold group-hover:shadow-[0_0_28px_rgba(212,160,23,0.2)]"
                style={{ backgroundColor: 'rgba(20,33,61,0.55)' }}
              >
                <div
                  className="absolute top-0 left-0 right-0 h-20 pointer-events-none"
                  style={{
                    background: 'linear-gradient(to bottom, rgba(212,160,23,0.12) 0%, rgba(212,160,23,0) 100%)',
                  }}
                />
                <div
                  className="relative w-9 h-9 rounded-full flex items-center justify-center mb-2.5"
                  style={{ border: '1px solid rgba(212,160,23,0.6)', background: 'rgba(212,160,23,0.06)' }}
                >
                  <Icon />
                </div>
                <h2 className="relative font-display font-bold text-base text-white mb-1">{tool.title}</h2>
                <p className="relative font-body text-xs text-white/60 leading-snug">{tool.desc}</p>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
