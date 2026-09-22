import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const NOTIFY_BASE_URL = "https://onlinesmsnotifygh.com";

// Notify's payment-status order.status values vary (e.g. "placed", "delivered",
// "failed"). Map them onto data_orders' own status enum
// (pending/paid/processing/delivered/failed/refunded).
function mapOrderStatus(paymentStatus: string, orderStatus: string): string {
  if (paymentStatus !== "success") return "failed";

  switch (orderStatus) {
    case "delivered":
      return "delivered";
    case "failed":
    case "rejected":
      return "failed";
    case "placed":
    case "processing":
    case "pending":
      return "processing"; // payment succeeded, data delivery still in progress
    default:
      return "processing";
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { reference: string } }
) {
  const { reference } = params;

  if (!reference) {
    return NextResponse.json({ error: "Missing reference" }, { status: 400 });
  }

  const apiKey = process.env.NOTIFY_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server misconfigured: missing NOTIFY_API_KEY" },
      { status: 500 }
    );
  }

  const supabase = createAdminClient();

  try {
    const res = await fetch(`${NOTIFY_BASE_URL}/api/reseller/payment-status/${reference}`, {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
        Accept: "application/json",
      },
    });

    const data = await res.json();

    if (!res.ok || data.status !== "success") {
      return NextResponse.json(
        { error: "Could not fetch payment status", details: data },
        { status: res.ok ? 502 : res.status }
      );
    }

    const newStatus = mapOrderStatus(data.payment?.status, data.order?.status);

    const { error: updateError } = await supabase
      .from("data_orders")
      .update({
        status: newStatus,
        vendor_reference: data.order?.id ? String(data.order.id) : null,
        vendor_response: data,
        updated_at: new Date().toISOString(),
      })
      .eq("paystack_reference", reference);

    if (updateError) {
      console.error("Failed to update data_orders row:", updateError);
      return NextResponse.json(
        { error: "Status fetched but failed to update order record", details: updateError },
        { status: 500 }
      );
    }

    return NextResponse.json({
      reference,
      status: newStatus,
      raw: data,
    });
  } catch (err) {
    console.error("payment-status error:", err);
    return NextResponse.json({ error: "Failed to reach Notify Data API" }, { status: 502 });
  }
}
