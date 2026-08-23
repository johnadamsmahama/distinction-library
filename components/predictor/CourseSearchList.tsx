'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

type Course = {
  id: string;
  code: string;
  name: string;
  department: string;
  level: string;
};

export default function CourseSearchList({ courses }: { courses: Course[] }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter(
      (course) =>
        course.name.toLowerCase().includes(q) ||
        course.code.toLowerCase().includes(q) ||
        course.department.toLowerCase().includes(q)
    );
  }, [courses, query]);

  return (
    <>
      <div className="mt-8 relative">
        <svg
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by course code or name..."
          className="w-full rounded-none border border-white/10 bg-white/5 py-3 pl-11 pr-4 font-body text-sm text-white placeholder:text-white/40 focus:border-gold/50 focus:outline-none"
        />
      </div>

      {filtered.length === 0 && (
        <div className="mt-8 rounded-none border border-white/10 bg-white/5 p-8 text-center">
          <p className="font-condensed text-lg text-gold">No courses match your search</p>
          <p className="font-body mt-2 text-sm text-white/70">Try a different course code or name.</p>
        </div>
      )}

      {filtered.length > 0 && (
        <ul className="mt-6 space-y-3">
          {filtered.map((course) => (
            <li key={course.id}>
              <Link
                href={`/predictor/${course.id}`}
                className="group flex items-center justify-between rounded-none border border-white/10 bg-white/5 p-4 transition-colors hover:border-gold/50 hover:bg-white/10"
              >
                <div>
                  <p className="font-condensed text-base">{course.name}</p>
                  <p className="font-body mt-0.5 text-xs text-white/50">
                    {course.code} · {course.department} · {course.level}
                  </p>
                </div>
                <span className="font-body text-gold opacity-0 transition-opacity group-hover:opacity-100">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
