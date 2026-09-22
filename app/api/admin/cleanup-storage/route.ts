import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ONE-TIME CLEANUP ROUTE — delete after running once.
//
// Frees Supabase Storage quota by removing:
//   1. Every file in 'past-papers' whose past_papers row is already
//      'approved' or 'rejected' (the approved copy already lives safely
//      in 'past-papers-final'; rejected ones serve no purpose).
//   2. Every zip in 'trusted-uploads' whose bulk_upload_jobs row is
//      already 'completed' (the zip's contents are already fully
//      extracted into past_papers / study_materials).
//
// Nothing still 'pending' or 'processing' is touched.
export async function GET() {
  const admin = createAdminClient();
  const report: Record<string, any> = {};

  // 1. Clean up 'past-papers' (raw staging bucket).
  const { data: resolvedPapers, error: papersErr } = await admin
    .from("past_papers")
    .select("file_url")
    .in("status", ["approved", "rejected"]);

  if (papersErr) {
    report.pastPapersError = papersErr.message;
  } else {
    const paths = (resolvedPapers ?? []).map((p) => p.file_url).filter(Boolean);
    if (paths.length > 0) {
      const { data: removed, error: removeErr } = await admin.storage
        .from("past-papers")
        .remove(paths);
      report.pastPapersDeleted = removed?.length ?? 0;
      report.pastPapersAttempted = paths.length;
      if (removeErr) report.pastPapersRemoveError = removeErr.message;
    } else {
      report.pastPapersDeleted = 0;
    }
  }

  // 2. Clean up 'trusted-uploads' (batch zip staging bucket).
  const { data: completedJobs, error: jobsErr } = await admin
    .from("bulk_upload_jobs")
    .select("zip_path")
    .eq("status", "completed");

  if (jobsErr) {
    report.trustedUploadsError = jobsErr.message;
  } else {
    const zipPaths = (completedJobs ?? []).map((j) => j.zip_path).filter(Boolean);
    if (zipPaths.length > 0) {
      const { data: removed, error: removeErr } = await admin.storage
        .from("trusted-uploads")
        .remove(zipPaths);
      report.trustedUploadsDeleted = removed?.length ?? 0;
      report.trustedUploadsAttempted = zipPaths.length;
      if (removeErr) report.trustedUploadsRemoveError = removeErr.message;
    } else {
      report.trustedUploadsDeleted = 0;
    }
  }

  return NextResponse.json({ done: true, report });
}
