import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const NOTIFY_BASE_URL = "https://onlinesmsnotifygh.com";

// Maps Notify's payment-status order.status values onto data_orders' own
// status enum (pending/paid/processing/delivered/failed/refunded).
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
      return "processing";
    default:
      return "processing";
  }
}

// Notify pings this the moment an order's status changes, instead of us
// having to poll. We don't trust the webhook payload's own `status` field
// directly — anyone could fake a POST to this URL. Instead we treat the
// webhook purely as a trigger: "go check this reference right now" — and
// make our own authenticated call to Notify's payment-status endpoint using
// our own API key, which can't be faked by a third party. Only that
// response is trusted and written to data_orders.
export async function POST(req: NextRequest) {
  let body: { reference?: string };

  try {
    body = await req.json();
  } catch {
    // Malformed body — nothing we can do with it. Acknowledge so Notify
    // doesn't keep retrying a request that will never parse.
    return NextResponse.json({ received: true, error: "Invalid JSON body" }, { status: 200 });
  }

  const reference = body.reference;
  if (!reference) {
    return NextResponse.json({ received: true, error: "Missing reference" }, { status: 200 });
  }

  const apiKey = process.env.NOTIFY_API_KEY;
  if (!apiKey) {
    console.error("Webhook received but NOTIFY_API_KEY is missing");
    // Return non-200 so Notify retries — this is a transient server
    // misconfiguration, not a reason to give up on this order.
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const supabase = createAdminClient();

  try {
    const res = await fetch(`${NOTIFY_BASE_URL}/api/reseller/payment-status/${reference}`, {
      method: "GET",
      headers: { "x-api-key": apiKey, Accept: "application/json" },
    });

    const data = await res.json();

    if (!res.ok || data.status !== "success") {
      console.error("Webhook: payment-status check failed", reference, data);
      // Let Notify's own retry policy (5 min, then 15 min) help us recover
      // from a transient failure on their end.
      return NextResponse.json({ error: "Could not verify status" }, { status: 502 });
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
      console.error("Webhook: failed to update data_orders", reference, updateError);
      return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
    }

    return NextResponse.json({ received: true, status: newStatus }, { status: 200 });
  } catch (err) {
    console.error("Webhook: unexpected error", reference, err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
