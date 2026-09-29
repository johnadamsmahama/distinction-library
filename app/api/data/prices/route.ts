import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Public, read-only: exposes each package's exact selling price, nested by
// network then package_id, for the buy-data page to display real totals
// before payment starts. Not sensitive — just pricing facts.
//
// Shape: { prices: { "MTN": { "16": 4.8, "17": 9.5 }, "TELECEL": { ... }, "AT": { ... } } }
export async function GET() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("data_package_prices")
    .select("network, package_id, selling_price");

  if (error || !data) {
    return NextResponse.json({ error: "Could not fetch prices" }, { status: 500 });
  }

  const prices: Record<string, Record<number, number>> = {};
  for (const row of data) {
    if (!prices[row.network]) prices[row.network] = {};
    prices[row.network][row.package_id] = Number(row.selling_price);
  }

  return NextResponse.json({ prices });
}
