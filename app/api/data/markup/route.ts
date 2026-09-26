import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Public, read-only: exposes each package's exact selling price so the
// frontend can show the real total before payment starts. Not sensitive —
// just pricing facts — so no auth required here.
//
// Shape: { prices: { "MTN:16": 4.8, "TELECEL:37": 39.5, "AT:52": 59.5, ... } }
export async function GET() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("data_package_prices")
    .select("network, package_id, selling_price");

  if (error || !data) {
    return NextResponse.json({ error: "Could not fetch prices" }, { status: 500 });
  }

  const prices: Record<string, number> = {};
  for (const row of data) {
    prices[`${row.network}:${row.package_id}`] = Number(row.selling_price);
  }

  return NextResponse.json({ prices });
}
