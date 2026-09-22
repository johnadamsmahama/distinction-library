import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const NOTIFY_BASE_URL = "https://onlinesmsnotifygh.com";
const PLANS_PATH = "/api/reseller/plans";
const INITIALIZE_PAYMENT_PATH = "/api/reseller/initialize-payment";

// Notify/markup tables use "AT"/"TELECEL"; data_orders' check constraint
// expects "AirtelTigo"/"Telecel". Map between them here, once, in one place.
const DATA_ORDERS_NETWORK: Record<string, string> = {
  MTN: "MTN",
  TELECEL: "Telecel",
  AT: "AirtelTigo",
};

interface InitializePaymentBody {
  network: "MTN" | "TELECEL" | "AT";
  packageId: number;
  phone: string;
  email: string;
}

export async function POST(req: NextRequest) {
  let body: InitializePaymentBody;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { network, packageId, phone, email } = body;

  if (!network || !packageId || !phone || !email) {
    return NextResponse.json(
      { error: "Missing required fields: network, packageId, phone, email" },
      { status: 400 }
    );
  }

  const apiKey = process.env.NOTIFY_API_KEY;
  const userId = process.env.NOTIFY_USER_ID;

  if (!apiKey || !userId) {
    return NextResponse.json(
      { error: "Server misconfigured: missing NOTIFY_API_KEY or NOTIFY_USER_ID" },
      { status: 500 }
    );
  }

  // Who is buying? Required for data_orders.user_id (not nullable).
  const sessionClient = createClient();
  const { data: authData } = await sessionClient.auth.getUser();
  if (!authData.user) {
    return NextResponse.json({ error: "You must be logged in to buy data." }, { status: 401 });
  }
  const buyerId = authData.user.id;

  const supabase = createAdminClient();

  try {
    // 1. Fetch the real wholesale price for this package directly from Notify —
    //    never trust a price sent by the client.
    const plansUrl = new URL(`${NOTIFY_BASE_URL}${PLANS_PATH}`);
    plansUrl.searchParams.set("network", network.toLowerCase());

    const plansRes = await fetch(plansUrl.toString(), {
      headers: { "x-api-key": apiKey, Accept: "application/json" },
      cache: "no-store",
    });
    const plansData = await plansRes.json();

    if (!plansRes.ok || plansData.status !== "success") {
      return NextResponse.json(
        { error: "Could not verify plan price", details: plansData },
        { status: 502 }
      );
    }

    const plan = plansData.data.find((p: any) => p.package_id === packageId);
    if (!plan) {
      return NextResponse.json({ error: "Invalid packageId for this network" }, { status: 400 });
    }
    const wholesalePrice = Number(plan.price);

    // 2. Look up this network's markup from Supabase — editable any time,
    //    no code change or redeploy needed.
    const { data: markupRow, error: markupError } = await supabase
      .from("data_markup_rules")
      .select("markup")
      .eq("network", network)
      .single();

    if (markupError || !markupRow) {
      return NextResponse.json(
        { error: "No markup rule configured for this network" },
        { status: 500 }
      );
    }

    const clientPrice = Number((wholesalePrice + Number(markupRow.markup)).toFixed(2));

    // TEMPORARY DEBUG — remove once we confirm the price issue
    console.log("DEBUG price calc:", {
      wholesalePrice,
      markupRaw: markupRow.markup,
      clientPrice,
      packageId,
      network,
    });

    // 3. Initialize payment with Notify Data's Pay & Order flow.
    //    Only the fields in their documented schema.
    const notifyRequestBody = {
      email,
      package_id: packageId,
      phone_number: phone,
      network,
      client_price: clientPrice,
      user_id: Number(userId),
    };

    // TEMPORARY DEBUG — remove once we confirm the price issue
    console.log("DEBUG notify request body:", notifyRequestBody);

    const notifyRes = await fetch(`${NOTIFY_BASE_URL}${INITIALIZE_PAYMENT_PATH}`, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(notifyRequestBody),
    });

    const data = await notifyRes.json();

    // TEMPORARY DEBUG — remove once we confirm the price issue
    console.log("DEBUG notify response:", { ok: notifyRes.ok, status: notifyRes.status, data });

    if (!notifyRes.ok || data.status !== true) {
      return NextResponse.json(
        { error: "Notify Data initialize-payment failed", details: data },
        { status: notifyRes.ok ? 502 : notifyRes.status }
      );
    }

    // 4. Log this order as "pending" before responding, so it's tracked
    //    from the moment payment starts. Status is later confirmed via
    //    POST /api/reseller/payment-status/{reference}.
    const { error: insertError } = await supabase.from("data_orders").insert({
      user_id: buyerId,
      network: DATA_ORDERS_NETWORK[network],
      phone_number: phone,
      email,
      plan_id: String(packageId),
      plan_label: plan.gig_size ? String(plan.gig_size) : null,
      amount: clientPrice,
      status: "pending",
      paystack_reference: data.reference,
    });

    if (insertError) {
      // Don't fail the whole request over a logging issue — the payment flow
      // already succeeded with Notify. Just log it so it's visible.
      console.error("Failed to log data_orders row:", insertError);
    }

    return NextResponse.json({
      clientPrice,
      reference: data.reference,
      authorizationUrl: data.authorization_url,
    });
  } catch (err) {
    console.error("initialize-payment error:", err);
    return NextResponse.json({ error: "Failed to reach Notify Data API" }, { status: 502 });
  }
}
