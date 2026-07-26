'use client';

import { useMemo, useState } from 'react';
import type { Tutor } from '@/lib/tutors-data';
import type { CourseOption } from '@/lib/papers-data';
import CustomSelect from '@/components/ui/CustomSelect';

export default function TutorBrowser({
  tutors,
  departments,
  courses,
}: {
  tutors: Tutor[];
  departments: string[];
  courses: CourseOption[];
}) {
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [courseId, setCourseId] = useState('');
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  const filteredCourses = useMemo(
    () => (department ? courses.filter((c) => c.department === department) : courses),
    [courses, department]
  );

  const term = search.trim().toLowerCase();

  const visible = useMemo(() => {
    return tutors.filter((t) => {
      if (department && t.department !== department) return false;
      if (courseId && !t.peer_tutor_courses.some((pc) => pc.courses.id === courseId)) return false;
      if (
        term &&
        !t.full_name.toLowerCase().includes(term) &&
        !t.bio.toLowerCase().includes(term) &&
        !t.peer_tutor_courses.some(
          (pc) =>
            pc.courses.code.toLowerCase().includes(term) || pc.courses.name.toLowerCase().includes(term)
        )
      ) {
        return false;
      }
      return true;
    });
  }, [tutors, department, courseId, term]);

  const toggleReveal = (id: string) => {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div>
      {/* Search */}
      <input
        type="text"
        placeholder="Search by name, course, or keyword…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-4 py-3 mb-4 rounded-lg border border-g100 font-body text-[15px] text-g800 outline-none focus:border-gold transition-colors"
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-8">
        <CustomSelect
          value={department}
          onChange={(v) => {
            setDepartment(v);
            setCourseId('');
          }}
          placeholder="All departments"
          className="w-full sm:w-56"
          options={[
            { value: '', label: 'All departments' },
            ...departments.map((d) => ({ value: d, label: d })),
          ]}
        />
        <CustomSelect
          value={courseId}
          onChange={setCourseId}
          placeholder="All courses"
          className="w-full sm:w-64"
          options={[
            { value: '', label: 'All courses' },
            ...filteredCourses.map((c) => ({ value: c.id, label: `${c.code} — ${c.name}` })),
          ]}
        />
      </div>

      {visible.length === 0 ? (
        <div className="bg-white border border-g100 rounded-2xl p-10 text-center">
          <p className="font-body text-sm text-g600">
            {tutors.length === 0
              ? 'No peer tutors are listed yet — check back soon.'
              : 'No tutors match your filters. Try clearing them.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {visible.map((t) => {
            const isRevealed = revealed.has(t.id);
            return (
              <div
                key={t.id}
                className="relative bg-white border border-g100 rounded-[14px] p-6 group hover:border-gold transition-colors overflow-hidden flex flex-col"
              >
                <span className="absolute left-0 right-0 bottom-0 h-[3px] bg-gold scale-x-0 origin-left group-hover:scale-x-100 transition-transform" />

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 flex-shrink-0 rounded-full bg-navy overflow-hidden flex items-center justify-center">
                    {t.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={t.photo_url} alt={t.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-display font-bold text-lg text-gold">
                        {t.full_name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display font-bold text-[16px] text-navy truncate">
                      {t.full_name}
                    </h3>
                    <p className="font-condensed font-semibold text-[11px] uppercase tracking-wide text-g600">
                      {t.department} · Level {t.level}
                    </p>
                  </div>
                </div>

                {t.peer_tutor_courses.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {t.peer_tutor_courses.map((pc) => (
                      <span
                        key={pc.courses.id}
                        className="font-condensed font-bold text-[10px] uppercase tracking-wide text-navy bg-off-white border border-g100 rounded-full px-2.5 py-1"
                      >
                        {pc.courses.code}
                      </span>
                    ))}
                  </div>
                )}

                <p className="font-body text-[13px] leading-[1.6] text-g600 mb-3 flex-1">{t.bio}</p>

                <p className="font-condensed font-semibold text-[11px] uppercase tracking-wide text-gold mb-4">
                  {t.availability}
                </p>

                {isRevealed ? (
                  <div className="space-y-2 pt-3 border-t border-g100">
                    {t.whatsapp_number && (
                      <a
                        href={`https://wa.me/${t.whatsapp_number.replace(/[^\d]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 font-condensed font-semibold text-[13px] text-g800 hover:text-navy transition-colors"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0 text-g600">
                          <path d="M12 2a10 10 0 00-8.6 15L2 22l5.1-1.3A10 10 0 1012 2z" />
                        </svg>
                        {t.whatsapp_number}
                      </a>
                    )}
                    {t.email && (
                      <a
                        href={`mailto:${t.email}`}
                        className="flex items-center gap-2 font-condensed font-semibold text-[13px] text-g800 hover:text-navy transition-colors break-all"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="flex-shrink-0 text-g600">
                          <rect x="3" y="5" width="18" height="14" rx="2" />
                          <path d="M3 7l9 6 9-6" />
                        </svg>
                        {t.email}
                      </a>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => toggleReveal(t.id)}
                    className="w-full bg-gold text-navy font-condensed font-bold text-xs uppercase tracking-wide py-2.5 rounded-lg hover:bg-gold-light transition-colors"
                  >
                    Contact
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
