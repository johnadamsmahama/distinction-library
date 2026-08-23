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
      <div className="relative mb-4">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          className="absolute left-4 top-1/2 -translate-y-1/2 text-g600 pointer-events-none"
        >
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Search by name, course, or keyword…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-none border border-g100 font-body text-[15px] text-g800 outline-none focus:border-gold transition-colors"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
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
        <div className="bg-amber-50 border border-amber-100 rounded-none p-10 text-center">
          <p className="font-body text-sm text-g600">
            {tutors.length === 0
              ? 'No peer tutors are listed yet — check back soon.'
              : 'No tutors match your filters. Try clearing them.'}
          </p>
        </div>
      ) : (
        // The catalog "drawer" — one continuous surface with perforated
        // tear-lines between entries, rather than separately boxed cards.
        // This only reads correctly as a single column, so unlike the old
        // grid this stays one-wide at every breakpoint.
        <div className="max-w-2xl mx-auto bg-amber-50 border border-amber-100 rounded-none shadow-inner overflow-hidden">
          {visible.map((t, i) => {
            const isRevealed = revealed.has(t.id);
            const primaryCourse = t.peer_tutor_courses[0]?.courses.code;
            return (
              <div key={t.id}>
                <div className="relative px-5 pt-9 pb-6">
                  {primaryCourse && (
                    <span className="absolute -top-px left-5 -translate-y-full bg-gold text-navy font-condensed font-bold text-[11px] tracking-wide px-3 py-1.5 rounded-none">
                      {primaryCourse}
                    </span>
                  )}
                  <span className="absolute top-3.5 right-5 font-mono text-[10px] text-g600 tracking-wide">
                    REC. {String(i + 1).padStart(3, '0')}
                  </span>

                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-[46px] h-[46px] flex-shrink-0 rounded-none bg-navy overflow-hidden flex items-center justify-center">
                      {t.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={t.photo_url} alt={t.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-display font-bold text-lg text-gold-light">
                          {t.full_name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-display font-bold text-[19px] text-navy leading-tight truncate">
                        {t.full_name}
                      </h3>
                      <p className="font-condensed font-semibold text-[11.5px] uppercase tracking-wide text-g600 mt-0.5">
                        {t.department} · Level {t.level}
                      </p>
                    </div>
                  </div>

                  {t.peer_tutor_courses.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {t.peer_tutor_courses.map((pc) => (
                        <span
                          key={pc.courses.id}
                          className="font-condensed font-bold text-[11px] uppercase tracking-wide text-navy bg-white border border-g100 rounded px-2 py-1"
                        >
                          {pc.courses.code}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-3 mb-4">
                    <span className="w-0.5 flex-shrink-0 rounded-none bg-gold" />
                    <p className="font-body text-sm leading-relaxed text-g800">{t.bio}</p>
                  </div>

                  <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
                    <span className="inline-flex items-center gap-1.5 -rotate-2 border border-dashed border-emerald-600 text-emerald-700 font-condensed font-bold text-[10.5px] uppercase tracking-wide px-2.5 py-1.5 rounded-none">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="flex-shrink-0">
                        <circle cx="12" cy="12" r="9" />
                        <path d="M8 12l2.5 2.5L16 9" />
                      </svg>
                      {t.availability}
                    </span>

                    {isRevealed ? (
                      <div className="flex flex-col items-end gap-1.5">
                        {t.whatsapp_number && (
                          <a
                            href={`https://wa.me/${t.whatsapp_number.replace(/[^\d]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 font-condensed font-semibold text-[13px] text-g800 hover:text-navy transition-colors"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0 text-g600">
                              <path d="M12 2a10 10 0 00-8.6 15L2 22l5.1-1.3A10 10 0 1012 2z" />
                            </svg>
                            {t.whatsapp_number}
                          </a>
                        )}
                        {t.email && (
                          <a
                            href={`mailto:${t.email}`}
                            className="flex items-center gap-1.5 font-condensed font-semibold text-[13px] text-g800 hover:text-navy transition-colors break-all"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="flex-shrink-0 text-g600">
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
                        className="bg-gold text-navy font-condensed font-bold text-[13px] uppercase tracking-wide px-5 py-2.5 rounded-none hover:bg-gold-light transition-colors"
                      >
                        Contact
                      </button>
                    )}
                  </div>
                </div>

                {/* Perforated tear-line between entries — omitted after the last one */}
                {i < visible.length - 1 && (
                  <div className="relative mx-5 border-t-[1.5px] border-dashed border-g100">
                    <span className="absolute -top-[5px] -left-[25px] w-2.5 h-2.5 rounded-none bg-off-white" />
                    <span className="absolute -top-[5px] -right-[25px] w-2.5 h-2.5 rounded-none bg-off-white" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
