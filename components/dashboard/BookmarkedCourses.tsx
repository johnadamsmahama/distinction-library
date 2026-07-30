'use client';

import Link from 'next/link';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export type BookmarkedCourse = {
  course_id: string;
  code: string;
  name: string;
  department: string;
  level: string;
  past_paper_count: number;
  study_material_count: number;
};

const GRAIN = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E\")";

export default function BookmarkedCourses({ courses }: { courses: BookmarkedCourse[] }) {
  const [list, setList] = useState(courses);
  const supabase = createClient();

  const removeBookmark = async (courseId: string) => {
    setList((prev) => prev.filter((c) => c.course_id !== courseId));
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('bookmarks').delete().eq('user_id', user.id).eq('course_id', courseId);
  };

  return (
    <div className="relative overflow-hidden flex flex-col min-h-[280px] rounded-2xl border border-[#D8D3C6] bg-[#EDEAE2]">
      <div
        className="absolute inset-0 pointer-events-none opacity-[.16]"
        style={{ backgroundImage: GRAIN, mixBlendMode: 'multiply' }}
      />
      <svg
        className="absolute -right-3.5 -bottom-[18px] w-[130px] h-[130px] opacity-10 pointer-events-none"
        viewBox="0 0 24 24" fill="none" stroke="#A45A2A" strokeWidth="1"
      >
        <path d="M6 2h12v20l-6-4-6 4V2z" />
      </svg>

      <div className="relative z-10 flex flex-col flex-1 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-lg text-navy">Your courses</h2>
          <Link href="/papers" className="font-condensed font-bold text-xs uppercase tracking-wide text-[#A45A2A] hover:underline">
            Browse all →
          </Link>
        </div>

        {list.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
            <p className="font-body text-sm text-g600 mb-4">
              You haven&apos;t bookmarked any courses yet. Bookmark the ones you&apos;re taking to
              see their papers and materials here.
            </p>
            <Link
              href="/papers"
              className="inline-block bg-gold text-navy font-condensed font-bold text-xs uppercase px-4 py-2 rounded-lg hover:bg-gold-light transition-colors"
            >
              Browse courses
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map((c) => (
              <div
                key={c.course_id}
                className="flex items-center justify-between bg-white border border-[#D8D3C6] border-l-4 border-l-[#A45A2A] rounded-xl px-4 py-3"
              >
                <Link href={`/papers?course=${c.course_id}`} className="min-w-0">
                  <div className="font-condensed font-bold text-sm text-navy truncate">
                    {c.code} · {c.name}
                  </div>
                  <div className="font-body text-xs text-g600 mt-0.5">
                    {c.past_paper_count} past papers · {c.study_material_count} materials
                  </div>
                </Link>
                <button
                  onClick={() => removeBookmark(c.course_id)}
                  aria-label={`Remove bookmark for ${c.code}`}
                  className="flex-shrink-0 ml-3 w-7 h-7 flex items-center justify-center rounded-full text-g600 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
