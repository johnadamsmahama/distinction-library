'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { CourseOption } from '@/lib/papers-data';

type VaultItem = {
  id: string;
  item_type: 'quiz' | 'companion_session' | 'summary';
  title: string;
  source_material_name: string | null;
  content: any;
  created_at: string;
  course_id: string | null;
  folder_name: string | null;
  courses: { code: string } | null;
};

const TYPE_LABEL: Record<string, string> = {
  quiz: 'Quiz',
  companion_session: 'Companion Session',
  summary: 'Summary',
};

type Filter = { kind: 'all' } | { kind: 'unsorted' } | { kind: 'course'; id: string } | { kind: 'folder'; name: string };

export default function VaultList({ items: initialItems, courses }: { items: VaultItem[]; courses: CourseOption[] }) {
  const [items, setItems] = useState(initialItems);
  const [openId, setOpenId] = useState<string | null>(null);
  const [organizingId, setOrganizingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>({ kind: 'all' });

  const courseGroups = useMemo(() => {
    const map = new Map<string, string>();
    items.forEach((i) => {
      if (i.course_id && i.courses?.code) map.set(i.course_id, i.courses.code);
    });
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [items]);

  const folderGroups = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => {
      if (i.folder_name && i.folder_name.trim()) set.add(i.folder_name.trim());
    });
    return Array.from(set).sort();
  }, [items]);

  const unsortedCount = items.filter((i) => !i.course_id && (!i.folder_name || !i.folder_name.trim())).length;

  const filteredItems = items.filter((i) => {
    if (filter.kind === 'all') return true;
    if (filter.kind === 'unsorted') return !i.course_id && (!i.folder_name || !i.folder_name.trim());
    if (filter.kind === 'course') return i.course_id === filter.id;
    if (filter.kind === 'folder') return i.folder_name?.trim() === filter.name;
    return true;
  });

  const remove = async (id: string) => {
    if (!confirm('Delete this from your Study Vault? This cannot be undone.')) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
    const supabase = createClient();
    await supabase.from('study_vault_items').delete().eq('id', id);
  };

  const organize = async (id: string, courseId: string | null, folderName: string | null) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('study_vault_items')
      .update({ course_id: courseId, folder_name: folderName?.trim() || null })
      .eq('id', id);

    if (error) {
      alert(error.message);
      return;
    }

    const courseCode = courseId ? courses.find((c) => c.id === courseId)?.code ?? null : null;
    setItems((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, course_id: courseId, folder_name: folderName?.trim() || null, courses: courseCode ? { code: courseCode } : null }
          : i
      )
    );
    setOrganizingId(null);
  };

  if (items.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-navy px-6 py-6 text-center">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 50% 0%, rgba(226,190,90,0.10), transparent 55%)',
          }}
        />
        <div className="relative">
          <p className="font-condensed font-semibold text-[10px] uppercase tracking-[0.2em] text-gold-light mb-1.5">
            Private · Members Only
          </p>
          <h2 className="font-display font-bold text-xl text-off-white leading-tight mb-2">
            Your Study Vault
          </h2>
          <p className="font-body text-xs text-off-white/70 max-w-xs mx-auto mb-4">
            Quizzes and Companion sessions you&apos;ve saved, organized by course or your own folders.
          </p>

          <div className="flex justify-center mb-4">
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-gold/50">
              <div className="absolute inset-2 rounded-full border border-gold/25" />
              <svg viewBox="0 0 24 24" fill="none" stroke="#E2BE5A" strokeWidth="1.4" className="h-6 w-6">
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                <circle cx="12" cy="15.5" r="1.6" fill="#E2BE5A" stroke="none" />
              </svg>
            </div>
          </div>

          <p className="font-body text-xs text-off-white/80 max-w-[260px] mx-auto mb-4 leading-relaxed">
            The vault is <span className="font-semibold text-off-white">sealed and empty</span>. Generate a
            quiz or save a Companion session to unlock it.
          </p>

          <div className="mx-auto max-w-xs space-y-2">
            <Link
              href="/vault/quiz-generator"
              className="block w-full rounded-xl bg-gradient-to-br from-gold-light to-gold px-4 py-2.5 text-center font-condensed font-bold text-sm uppercase tracking-wide text-navy shadow-lg shadow-gold/20 transition-transform hover:scale-[1.02]"
            >
              Generate a Quiz
            </Link>
            <Link
              href="/vault/companion"
              className="block w-full rounded-xl border border-gold/35 px-4 py-2.5 text-center font-condensed font-semibold text-sm uppercase tracking-wide text-gold-light transition-colors hover:bg-gold/10"
            >
              Open Study Companion
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
        <FilterPill active={filter.kind === 'all'} onClick={() => setFilter({ kind: 'all' })}>
          All ({items.length})
        </FilterPill>
        {unsortedCount > 0 && (
          <FilterPill active={filter.kind === 'unsorted'} onClick={() => setFilter({ kind: 'unsorted' })}>
            Unsorted ({unsortedCount})
          </FilterPill>
        )}
        {courseGroups.map(([id, code]) => (
          <FilterPill
            key={id}
            active={filter.kind === 'course' && filter.id === id}
            onClick={() => setFilter({ kind: 'course', id })}
          >
            {code}
          </FilterPill>
        ))}
        {folderGroups.map((name) => (
          <FilterPill
            key={name}
            active={filter.kind === 'folder' && filter.name === name}
            onClick={() => setFilter({ kind: 'folder', name })}
          >
            📁 {name}
          </FilterPill>
        ))}
      </div>

      <div className="space-y-3">
        {filteredItems.map((item) => (
          <div key={item.id} className="bg-white border border-g100 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3.5 gap-2">
              <button
                onClick={() => setOpenId(openId === item.id ? null : item.id)}
                className="min-w-0 text-left flex-1"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-condensed font-bold text-[10px] uppercase tracking-wide text-gold bg-gold/10 px-2 py-0.5 rounded flex-shrink-0">
                    {TYPE_LABEL[item.item_type]}
                  </span>
                  {item.courses?.code && (
                    <span className="font-condensed font-bold text-[10px] uppercase px-2 py-0.5 rounded bg-navy/10 text-navy flex-shrink-0">
                      {item.courses.code}
                    </span>
                  )}
                  {item.folder_name && (
                    <span className="font-condensed font-bold text-[10px] uppercase px-2 py-0.5 rounded bg-g100 text-g600 flex-shrink-0">
                      📁 {item.folder_name}
                    </span>
                  )}
                  <span className="font-condensed font-semibold text-sm text-g800 truncate">{item.title}</span>
                </div>
                <div className="font-body text-xs text-g600 mt-1">
                  {new Date(item.created_at).toLocaleDateString()}
                </div>
              </button>
              <div className="flex items-center flex-shrink-0">
                <button
                  onClick={() => setOrganizingId(organizingId === item.id ? null : item.id)}
                  className="font-condensed font-bold text-[10px] uppercase px-2.5 py-1.5 rounded-lg border border-g100 text-g600 hover:border-gold hover:text-navy transition-colors"
                >
                  Organize
                </button>
                <button
                  onClick={() => remove(item.id)}
                  aria-label="Delete"
                  className="ml-2 w-7 h-7 flex items-center justify-center rounded-full text-g600 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {organizingId === item.id && (
              <OrganizePanel
                courses={courses}
                initialCourseId={item.course_id}
                initialFolder={item.folder_name}
                onCancel={() => setOrganizingId(null)}
                onSave={(courseId, folderName) => organize(item.id, courseId, folderName)}
              />
            )}

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
        {filteredItems.length === 0 && (
          <p className="font-body text-sm text-g600 text-center py-10">Nothing in this folder yet.</p>
        )}
      </div>
    </div>
  );
}

function FilterPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 font-condensed font-semibold text-xs uppercase tracking-wide px-3 py-2 rounded-full border transition-colors ${
        active ? 'border-gold bg-gold/10 text-navy' : 'border-g100 text-g600'
      }`}
    >
      {children}
    </button>
  );
}

function OrganizePanel({
  courses,
  initialCourseId,
  initialFolder,
  onCancel,
  onSave,
}: {
  courses: CourseOption[];
  initialCourseId: string | null;
  initialFolder: string | null;
  onCancel: () => void;
  onSave: (courseId: string | null, folderName: string | null) => void;
}) {
  const [courseId, setCourseId] = useState(initialCourseId ?? '');
  const [folder, setFolder] = useState(initialFolder ?? '');

  return (
    <div className="px-4 pb-4 border-t border-g100 pt-3 bg-off-white">
      <label className="block font-condensed font-semibold text-xs uppercase tracking-wide text-g800 mb-1.5">
        Course (optional)
      </label>
      <select
        value={courseId}
        onChange={(e) => setCourseId(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-g100 font-body text-sm text-g800 outline-none focus:border-gold transition-colors mb-3"
      >
        <option value="">No course</option>
        {courses.map((c) => (
          <option key={c.id} value={c.id}>
            {c.code} — {c.name}
          </option>
        ))}
      </select>

      <label className="block font-condensed font-semibold text-xs uppercase tracking-wide text-g800 mb-1.5">
        Custom folder (optional)
      </label>
      <input
        type="text"
        value={folder}
        onChange={(e) => setFolder(e.target.value)}
        placeholder="e.g. Midterm Prep"
        className="w-full px-3 py-2 rounded-lg border border-g100 font-body text-sm text-g800 outline-none focus:border-gold transition-colors mb-3"
      />

      <div className="flex gap-2">
        <button
          onClick={() => onSave(courseId || null, folder || null)}
          className="font-condensed font-bold text-xs uppercase px-3.5 py-2 rounded-lg bg-gold text-navy hover:bg-gold-light transition-colors"
        >
          Save
        </button>
        <button
          onClick={onCancel}
          className="font-condensed font-bold text-xs uppercase px-3.5 py-2 rounded-lg border border-g100 text-g600"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
