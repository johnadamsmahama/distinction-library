import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const NOTIFY_BASE_URL = "https://onlinesmsnotifygh.com";
const PLANS_PATH = "/api/reseller/plans";
const INITIALIZE_PAYMENT_PATH = "/api/reseller/initialize-payment";

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

    // 3. Initialize payment with Notify Data.
    const notifyRes = await fetch(`${NOTIFY_BASE_URL}${INITIALIZE_PAYMENT_PATH}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        email,
        package_id: packageId,
        phone_number: phone,
        network,
        client_price: clientPrice,
        user_id: Number(userId),
        type: "inline",
      }),
    });

    const data = await notifyRes.json();

    if (!notifyRes.ok || data.status !== true) {
      return NextResponse.json(
        { error: "Notify Data initialize-payment failed", details: data },
        { status: notifyRes.ok ? 502 : notifyRes.status }
      );
    }

    // TODO (next step): insert a "pending" row into data_orders here,
    // keyed by data.reference, before responding to the frontend.

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
