import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Public, read-only: exposes each network's markup so the frontend can show
// the true total (wholesale + markup) before payment starts. Not sensitive —
// just a pricing fact — so no auth required here.
export async function GET(req: NextRequest) {
  const supabase = createAdminClient();

  const { data, error } = await supabase.from("data_markup_rules").select("network, markup");

  if (error || !data) {
    return NextResponse.json({ error: "Could not fetch markup rules" }, { status: 500 });
  }

  const markups: Record<string, number> = {};
  for (const row of data) {
    markups[row.network] = Number(row.markup);
  }

  return NextResponse.json({ markups });
}
