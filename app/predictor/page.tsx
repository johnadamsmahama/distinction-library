// app/predictor/page.tsx
//
// This is the "landing spot" for Exam Predictor. A student arrives here
// first, picks their course from a list, and gets taken to that course's
// specific predictions page.

import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function PredictorLandingPage() {
  const { data: courses } = await supabase
    .from("courses")
    .select("id, code, name, department, level")
    .order("code", { ascending: true });

  return (
    <main className="min-h-screen bg-navy-deep text-white">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <p className="font-condensed text-sm uppercase tracking-widest text-gold">
          Exam Predictor
        </p>
        <h1 className="font-display mt-2 text-3xl leading-tight">
          Choose your course
        </h1>
        <p className="font-body mt-2 text-sm text-white/60">
          Pick a course to see AI-ranked predictions built from past papers
          and course materials.
        </p>

        {(!courses || courses.length === 0) && (
          <div className="mt-12 rounded-lg border border-white/10 bg-white/5 p-8 text-center">
            <p className="font-condensed text-lg text-gold">
              No courses available yet
            </p>
            <p className="font-body mt-2 text-sm text-white/70">
              Check back once courses have been added to the library.
            </p>
          </div>
        )}

        {courses && courses.length > 0 && (
          <ul className="mt-8 space-y-3">
            {courses.map((course) => (
              <li key={course.id}>
                <Link
                  href={`/predictor/${course.id}`}
                  className="group flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4 transition-colors hover:border-gold/50 hover:bg-white/10"
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
      </div>
    </main>
  );
}