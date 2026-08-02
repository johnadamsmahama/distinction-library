import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

const TOOLS = [
  {
    href: '/vault/companion',
    title: 'AI Study Companion',
    desc: 'Ask questions about your own course material and get patient, step-by-step explanations.',
    icon: '✦',
  },
  {
    href: '/vault/quiz-generator',
    title: 'AI Quiz Generator',
    desc: 'Turn your notes or a past paper into a practice quiz in seconds.',
    icon: '?',
  },
];

export default async function AiToolsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-navy mb-1">AI Tools</h1>
      <p className="font-body text-sm text-g600 mb-6">
        AI-powered study help, built on your own material.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {TOOLS.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="group bg-navy border border-gold/25 rounded-2xl p-6 hover:border-gold transition-colors"
          >
            <div className="w-11 h-11 rounded-full border border-gold/60 flex items-center justify-center font-display text-gold text-base mb-4 group-hover:bg-gold group-hover:text-navy-deep transition-colors">
              {tool.icon}
            </div>
            <h2 className="font-display font-bold text-lg text-white mb-1.5">{tool.title}</h2>
            <p className="font-body text-sm text-white/60">{tool.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
