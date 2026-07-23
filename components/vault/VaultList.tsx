'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type VaultItem = {
  id: string;
  item_type: 'quiz' | 'companion_session' | 'summary';
  title: string;
  source_material_name: string | null;
  content: any;
  created_at: string;
};

const TYPE_LABEL: Record<string, string> = {
  quiz: 'Quiz',
  companion_session: 'Companion Session',
  summary: 'Summary',
};

export default function VaultList({ items: initialItems }: { items: VaultItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [openId, setOpenId] = useState<string | null>(null);

  const remove = async (id: string) => {
    if (!confirm('Delete this from your Study Vault? This cannot be undone.')) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
    const supabase = createClient();
    await supabase.from('study_vault_items').delete().eq('id', id);
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="font-body text-sm text-g600">
          Nothing here yet. Generate a quiz or save a Study Companion session to see it here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="bg-white border border-g100 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3.5">
            <button
              onClick={() => setOpenId(openId === item.id ? null : item.id)}
              className="min-w-0 text-left flex-1"
            >
              <div className="flex items-center gap-2">
                <span className="font-condensed font-bold text-[10px] uppercase tracking-wide text-gold bg-gold/10 px-2 py-0.5 rounded flex-shrink-0">
                  {TYPE_LABEL[item.item_type]}
                </span>
                <span className="font-condensed font-semibold text-sm text-g800 truncate">{item.title}</span>
              </div>
              <div className="font-body text-xs text-g600 mt-1">
                {new Date(item.created_at).toLocaleDateString()}
              </div>
            </button>
            <button
              onClick={() => remove(item.id)}
              aria-label="Delete"
              className="flex-shrink-0 ml-3 w-7 h-7 flex items-center justify-center rounded-full text-g600 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              ✕
            </button>
          </div>

          {openId === item.id && (
            <div className="px-4 pb-4 border-t border-g100 pt-3">
              {item.item_type === 'quiz' && (
                <div className="space-y-2">
                  {item.content.questions?.map((q: any, i: number) => (
                    <div key={i} className="font-body text-sm text-g800">
                      <span className="font-semibold">{i + 1}. {q.question}</span>
                      <div className="text-g600 text-xs mt-0.5">
                        Answer: {q.correctAnswer} — {q.explanation}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {item.item_type === 'companion_session' && (
                <div className="space-y-2">
                  {item.content.messages?.map((m: any, i: number) => (
                    <div key={i} className="font-body text-sm">
                      <span className="font-semibold text-g800">{m.role === 'user' ? 'You: ' : 'Companion: '}</span>
                      <span className="text-g600">{m.content}</span>
                    </div>
                  ))}
                </div>
              )}
              {item.item_type === 'summary' && (
                <p className="font-body text-sm text-g600 whitespace-pre-wrap">{item.content.text}</p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
