import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

const TOOLS = [
  {
    href: '/vault/companion',
    title: 'AI Study Companion',
    desc: 'Ask questions about your own course material and get patient, step-by-step explanations.',
  },
  {
    href: '/vault/quiz-generator',
    title: 'AI Quiz Generator',
    desc: 'Turn your notes or a past paper into a practice quiz in seconds.',
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
            className="bg-white border border-g100 rounded-2xl p-6 hover:border-gold transition-colors"
          >
            <h2 className="font-display font-bold text-lg text-navy mb-1.5">{tool.title}</h2>
            <p className="font-body text-sm text-g600">{tool.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
