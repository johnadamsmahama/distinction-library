// supabase/functions/extract-batch/index.ts
//
// This is the robot itself, living inside Supabase.
// It wakes up on a schedule, finds up to 3 approved-but-unread documents,
// reads the text out of them with an AI reading tool, and saves the result.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BATCH_SIZE = 3;

Deno.serve(async (req) => {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== Deno.env.get("CRON_SECRET")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const jobs = await findPendingJobs(supabase);
  if (jobs.length === 0) {
    return new Response(JSON.stringify({ message: "Nothing to process." }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const results = [];
  for (const job of jobs) {
    results.push(await processJob(supabase, job));
  }

  return new Response(JSON.stringify({ processed: results.length, results }), {
    headers: { "Content-Type": "application/json" },
  });
});

type ExtractionJob = {
  table: "past_papers" | "study_materials";
  id: string;
  bucket: "past-papers-final" | "study-materials";
  file_url: string | null;
};

async function findPendingJobs(supabase: any): Promise<ExtractionJob[]> {
  const { data: papers } = await supabase
    .from("past_papers")
    .select("id, watermarked_url")
    .eq("status", "approved")
    .eq("extraction_status", "pending")
    .limit(BATCH_SIZE);

  const { data: materials } = await supabase
    .from("study_materials")
    .select("id, file_url")
    .eq("status", "approved")
    .eq("extraction_status", "pending")
    .limit(BATCH_SIZE);

  const paperJobs: ExtractionJob[] = (papers ?? []).map((p: any) => ({
    table: "past_papers",
    id: p.id,
    bucket: "past-papers-final",
    file_url: p.watermarked_url,
  }));

  const materialJobs: ExtractionJob[] = (materials ?? []).map((m: any) => ({
    table: "study_materials",
    id: m.id,
    bucket: "study-materials",
    file_url: m.file_url,
  }));

  return [...paperJobs, ...materialJobs].slice(0, BATCH_SIZE);
}

async function processJob(supabase: any, job: ExtractionJob) {
  try {
    if (!job.file_url) {
      throw new Error("No file_url/watermarked_url available for this row.");
    }

    const fileBytes = await downloadFile(supabase, job.bucket, job.file_url);
    const { text, confident, debugNote } = await extractTextWithAI(fileBytes);
    const newStatus = confident ? "processed" : "needs_review";

    await supabase
      .from(job.table)
      .update({ raw_text: text, extraction_status: newStatus, ai_review_notes: debugNote })
      .eq("id", job.id);

    return { id: job.id, table: job.table, status: newStatus, debugNote };
  } catch (err) {
    const message = String(err);

    await supabase
      .from(job.table)
      .update({ extraction_status: "needs_review", ai_review_notes: `EXTRACT ERROR: ${message}` })
      .eq("id", job.id);

    return { id: job.id, table: job.table, status: "needs_review", error: message };
  }
}

async function downloadFile(supabase: any, bucket: string, fileUrl: string): Promise<Uint8Array> {
  let path: string | undefined;
  try {
    path = new URL(fileUrl).pathname.split(`/${bucket}/`)[1];
  } catch {
    throw new Error(`file_url is not a valid absolute URL: ${fileUrl}`);
  }

  if (!path) {
    throw new Error(`Could not derive storage path from URL: ${fileUrl}`);
  }

  const { data, error } = await supabase.storage.from(bucket).download(path);
  if (error || !data) throw new Error(`Could not download file: ${error?.message}`);
  const arrayBuffer = await data.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

async function extractTextWithAI(
  fileBytes: Uint8Array
): Promise<{ text: string; confident: boolean; debugNote: string }> {
  const base64 = toBase64(fileBytes);

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": Deno.env.get("ANTHROPIC_API_KEY")!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: { type: "base64", media_type: "application/pdf", data: base64 },
            },
            {
              type: "text",
              text:
                "Extract all readable text from this exam paper or study document, " +
                "preserving question numbers and structure where possible. " +
                "Then, on a new final line, write CONFIDENCE: HIGH or CONFIDENCE: LOW " +
                "depending on how certain you are the text was read correctly " +
                "(LOW if the scan is blurry, handwritten, or hard to read).",
            },
          ],
        },
      ],
    }),
  });

  const rawBody = await response.text();

  if (!response.ok) {
    return {
      text: "",
      confident: false,
      debugNote: `Anthropic API returned ${response.status}: ${rawBody.slice(0, 500)}`,
    };
  }

  let data: any;
  try {
    data = JSON.parse(rawBody);
  } catch {
    return {
      text: "",
      confident: false,
      debugNote: `Anthropic API response was not valid JSON: ${rawBody.slice(0, 500)}`,
    };
  }

  const raw = (data.content ?? [])
    .map((block: any) => (block.type === "text" ? block.text : ""))
    .join("\n");

  if (!raw) {
    return {
      text: "",
      confident: false,
      debugNote: `Anthropic API returned 200 but no usable text block. Raw response: ${rawBody.slice(0, 500)}`,
    };
  }

  const confident = raw.includes("CONFIDENCE: HIGH");
  const text = raw.replace(/CONFIDENCE:\s*(HIGH|LOW)/, "").trim();

  return { text, confident, debugNote: confident ? "OK — high confidence" : "OK — low confidence (AI marked CONFIDENCE: LOW)" };
}
