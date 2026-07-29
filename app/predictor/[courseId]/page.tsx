// app/predictor/[courseId]/page.tsx
//
// This is the actual page a student opens to see exam predictions for
// one course. It's a server-rendered page: it fetches the latest
// prediction directly from the database before the page is sent to
// the browser, so it's fast and works without extra client-side code.

import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";

// Server-side Supabase client — safe to use the service role key here
// because this code only ever runs on the server, never in the browser.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type RankedItem = {
  prediction: string;
  confidence: number;
  rationale: string;
};

type PageProps = {
  params: { courseId: string };
};

export default async function PredictorPage({ params }: PageProps) {
  const { courseId } = params;

  const { data: course } = await supabase
    .from("courses")
    .select("code, name, department, level")
    .eq("id", courseId)
    .single();

  if (!course) {
    notFound();
  }

  // Get the most recent successful prediction for this course.
  const { data: prediction } = await supabase
    .from("predictor_predictions")
    .select("generated_at, ranked_items, signals_used, generation_status")
    .eq("course_id", courseId)
    .eq("generation_status", "success")
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const items: RankedItem[] = prediction?.ranked_items ?? [];

  return (
    <main className="min-h-screen bg-navy-deep text-white">
      <div className="mx-auto max-w-2xl px-6 py-16">
        {/* Header */}
        <p className="font-condensed text-sm uppercase tracking-widest text-gold">
          Exam Predictor
        </p>
        <h1 className="font-display mt-2 text-3xl leading-tight">
          {course.name}
        </h1>
        <p className="font-body mt-1 text-sm text-white/60">
          {course.code} · {course.department} · {course.level}
        </p>

        {/* Empty state — no prediction yet */}
        {items.length === 0 && (
          <div className="mt-12 rounded-lg border border-white/10 bg-white/5 p-8 text-center">
            <p className="font-condensed text-lg text-gold">
              No prediction yet for this course
            </p>
            <p className="font-body mt-2 text-sm text-white/70">
              We build predictions from past papers and course materials as
              they're added. Check back once more of those have been
              uploaded and reviewed.
            </p>
          </div>
        )}

        {/* Ranked prediction list — the signature element */}
        {items.length > 0 && (
          <>
            <p className="font-body mt-8 text-sm text-white/60">
              Ranked by likelihood, based on past papers and course
              materials.
            </p>

            <ol className="mt-6 space-y-4">
              {items.map((item, i) => (
                <li
                  key={i}
                  className="rounded-lg border border-white/10 bg-white/5 p-5"
                >
                  <div className="flex items-start gap-4">
                    <span className="font-display shrink-0 text-2xl text-gold/70">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="flex-1">
                      <p className="font-condensed text-base leading-snug">
                        {item.prediction}
                      </p>
                      <p className="font-body mt-1 text-sm text-white/60">
                        {item.rationale}
                      </p>

                      {/* Confidence bar */}
                      <div className="mt-3 flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-gold"
                            style={{
                              width: `${Math.round(
                                Math.max(0, Math.min(1, item.confidence)) * 100
                              )}%`,
                            }}
                          />
                        </div>
                        <span className="font-body text-xs text-white/50">
                          {Math.round(
                            Math.max(0, Math.min(1, item.confidence)) * 100
                          )}
                          % confidence
                        </span>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ol>

            {/* Transparency footer */}
            <div className="mt-10 border-t border-white/10 pt-6">
              <p className="font-body text-xs text-white/40">
                Based on {prediction?.signals_used?.questions_count ?? 0} past
                questions, {prediction?.signals_used?.topic_signals_count ?? 0}{" "}
                topic signals, and{" "}
                {prediction?.signals_used?.examiner_patterns_count ?? 0}{" "}
                examiner patterns. Last updated{" "}
                {prediction?.generated_at
                  ? new Date(prediction.generated_at).toLocaleDateString(
                      "en-US",
                      { month: "short", day: "numeric", year: "numeric" }
                    )
                  : "recently"}
                .
              </p>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
