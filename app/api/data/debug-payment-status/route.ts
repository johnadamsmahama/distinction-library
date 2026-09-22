import { NextRequest, NextResponse } from "next/server";

const NOTIFY_BASE_URL = "https://onlinesmsnotifygh.com";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const reference = searchParams.get("reference");

  if (!reference) {
    return NextResponse.json({ error: "Missing ?reference= query param" }, { status: 400 });
  }

  const apiKey = process.env.NOTIFY_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing NOTIFY_API_KEY" }, { status: 500 });
  }

  try {
    const res = await fetch(`${NOTIFY_BASE_URL}/api/reseller/payment-status/${reference}`, {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
        Accept: "application/json",
      },
    });

    const data = await res.json();
    return NextResponse.json({ status: res.status, data });
  } catch (err) {
    return NextResponse.json({ error: "Failed to reach Notify Data API", details: String(err) }, { status: 502 });
  }
}
