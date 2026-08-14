import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

const TOOLS = [
  {
    step: 1,
    title: 'AI CV Builder',
    description:
      'Build a CV from scratch, or feed in one you already have and let it sharpen the wording, structure, and impact.',
    cta: 'Start building',
    href: '/essentials/career/cv-builder',
    caption: 'then, tailor it to the role',
    icon: (
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M9 13h6 M9 17h6 M9 9h1" />
    ),
  },
  {
    step: 2,
    title: 'Cover Letter Generator',
    description:
      'A tailored letter for one specific role or application — written to match the job, not a generic template.',
    cta: 'Write a letter',
    href: '/essentials/career/cover-letter',
    caption: 'then, rehearse it out loud',
    icon: <path d="M4 4h16v16H4z M4 4l8 8 8-8" />,
  },
  {
    step: 3,
    title: 'Interview Coach',
    description:
      'Practice real interview questions and get honest, specific feedback on how to answer them better.',
    cta: 'Start a session',
    href: '/essentials/career/interview-coach',
    caption: 'then, make yourself findable',
    icon: (
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z M19 10v2a7 7 0 0 1-14 0v-2 M12 19v4 M8 23h8" />
    ),
  },
  {
    step: 4,
    title: 'LinkedIn Optimizer',
    description:
      'Sharper headline, summary, and experience sections — so recruiters searching your field find you first.',
    cta: 'Optimize profile',
    href: '/essentials/career/linkedin-optimizer',
    caption: null,
    icon: (
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z M2 9h4v12H2z M4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
    ),
  },
];

export default async function CareerCentrePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div>
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy to-[#081527] px-6 py-8 mb-6">
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-[radial-gradient(circle,rgba(201,162,75,0.16)_0%,rgba(201,162,75,0)_70%)]" />
        <p className="relative font-body text-[11px] font-semibold tracking-[0.14em] uppercase text-gold mb-3">
          Essentials
        </p>
        <h1 className="relative font-display font-bold text-3xl text-white mb-2 max-w-xs">
          Career Resources
        </h1>
        <p className="relative font-body text-sm text-[#B7C0D4] max-w-sm leading-relaxed">
          Four tools, built for how UPSA students actually apply — from a first CV draft to walking into the interview room ready.
        </p>
      </div>

      {/* Sequence rail */}
      <div className="relative rounded-3xl bg-gradient-to-b from-[#EAF3ED] via-[#DCEDE3] to-[#EAF3ED] px-4 py-5 sm:px-6">
        <div className="absolute left-[34px] top-5 bottom-10 w-px bg-gradient-to-b from-gold to-g100 sm:hidden" />

        <div className="flex flex-col gap-1 sm:grid sm:grid-cols-2 sm:gap-4">
          {TOOLS.map((tool) => (
            <div key={tool.step}>
              <div className="flex gap-4 sm:block">
                <div className="flex flex-col items-center w-6 pt-5 flex-shrink-0 sm:hidden">
                  <div className="w-6 h-6 rounded-full bg-navy border-[1.5px] border-gold flex items-center justify-center font-display font-semibold text-[11px] text-[#E4C878] shadow-sm">
                    {tool.step}
                  </div>
                </div>

                <Link
                  href={tool.href}
                  className="flex-1 block bg-white border border-g100 border-l-[3px] border-l-navy rounded-2xl p-5 hover:border-gold hover:border-l-navy transition-colors"
                >
                  <div className="w-9 h-9 shrink-0 overflow-hidden rounded-[9px] bg-navy flex items-center justify-center mb-3">
                    <svg
                      viewBox="0 0 24 24"
                      width={18}
                      height={18}
                      className="w-[18px] h-[18px] shrink-0 stroke-[#E4C878]"
                      fill="none"
                      strokeWidth={1.8}
                    >
                      {tool.icon}
                    </svg>
                  </div>
                  <h2 className="font-display font-bold text-lg text-navy mb-1.5">{tool.title}</h2>
                  <p className="font-body text-sm text-g600 leading-relaxed">{tool.description}</p>
                  <div className="mt-3.5 flex items-center gap-1.5 font-body text-[12.5px] font-semibold text-gold">
                    {tool.cta}
                    <svg viewBox="0 0 24 24" width={12} height={12} className="w-3 h-3 shrink-0 stroke-gold" fill="none" strokeWidth={2}>
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </div>
                </Link>
              </div>

              {tool.caption && (
                <p className="font-display italic text-[10.5px] text-g600 pl-[38px] mt-2 mb-3 sm:hidden">
                  {tool.caption}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
