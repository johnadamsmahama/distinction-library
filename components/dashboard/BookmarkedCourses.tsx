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
    <div className="bg-white border border-g100 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display font-bold text-lg text-navy">Your courses</h2>
        <Link href="/papers" className="font-condensed font-bold text-xs uppercase tracking-wide text-gold hover:underline">
          Browse all →
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="text-center py-8">
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
              className="flex items-center justify-between border border-g100 rounded-xl px-4 py-3 hover:border-gold transition-colors"
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
  );
}
