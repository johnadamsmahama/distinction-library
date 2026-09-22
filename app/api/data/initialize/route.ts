// app/api/data/initialize/route.ts
//
// Computes client_price (wholesale + flat markup) and calls Notify Data's
// Pay & Order flow. Notify handles the Paystack charge, webhook, order
// fulfillment, and profit payout to your Paystack subaccount automatically —
// this route just kicks that off and hands back a checkout URL.

import { NextRequest, NextResponse } from "next/server";

const NOTIFY_BASE_URL = "https://onlinesmsnotifygh.com";
const INITIALIZE_PAYMENT_PATH = "/api/reseller/initialize-payment";
const MARKUP = 0.4; // flat GHS 0.40 markup per plan

interface InitializePaymentBody {
  network: "MTN" | "TELECEL" | "AT"; // AirtelTigo is "AT", not "AIRTELTIGO"
  packageId: number; // from GET /api/reseller/plans
  wholesalePrice: number; // pulled fresh from /api/reseller/plans, never cached client-side
  phone: string; // e.g. "0240000000"
  email: string; // customer's email, for their Paystack receipt
}

export async function POST(req: NextRequest) {
  let body: InitializePaymentBody;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { network, packageId, wholesalePrice, phone, email } = body;

  if (!network || !packageId || !wholesalePrice || !phone || !email) {
    return NextResponse.json(
      { error: "Missing required fields: network, packageId, wholesalePrice, phone, email" },
      { status: 400 }
    );
  }

  // Compute the price the student actually pays. Notify requires
  // client_price >= wholesale price, so this markup can never go negative.
  const clientPrice = Number((wholesalePrice + MARKUP).toFixed(2));

  const apiKey = process.env.NOTIFY_API_KEY;
  const userId = process.env.NOTIFY_USER_ID; // numeric Reseller User ID from your dashboard (e.g. 763)

  if (!apiKey || !userId) {
    return NextResponse.json(
      { error: "Server misconfigured: missing NOTIFY_API_KEY or NOTIFY_USER_ID" },
      { status: 500 }
    );
  }

  try {
    const notifyRes = await fetch(`${NOTIFY_BASE_URL}${INITIALIZE_PAYMENT_PATH}`, {
      method: "POST",
      headers: {
        // This specific endpoint uses Bearer auth, unlike /plans and /order which use x-api-key.
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
        type: "inline", // popup on-site, no page redirect (defaults to "redirect" if omitted)
      }),
    });

    const data = await notifyRes.json();

    if (!notifyRes.ok || data.status !== true) {
      return NextResponse.json(
        { error: "Notify Data initialize-payment failed", details: data },
        { status: notifyRes.ok ? 502 : notifyRes.status }
      );
    }

    // TODO (next step): insert a "pending" row into the Supabase order-tracking
    // table here, keyed by data.reference, before responding to the frontend.
    // Then poll/update it via GET /api/reseller/payment-status/{reference}.

    return NextResponse.json({
      clientPrice,
      reference: data.reference,
      authorizationUrl: data.authorization_url, // frontend passes this to the Paystack inline popup
    });
  } catch (err) {
    console.error("initialize-payment error:", err);
    return NextResponse.json({ error: "Failed to reach Notify Data API" }, { status: 502 });
  }
}
