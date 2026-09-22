// app/api/data/plans/route.ts
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const apiKey = process.env.NOTIFY_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { status: "error", message: "Server is not configured with an API key yet." },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const network = searchParams.get("network"); // "mtn", "telecel", or "at"

  const url = new URL("https://onlinesmsnotifygh.com/api/reseller/plans");
  if (network) {
    url.searchParams.set("network", network);
  }

  try {
    const response = await fetch(url.toString(), {
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      cache: "no-store",
    });

    const rawText = await response.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      data = null;
    }

    if (!response.ok) {
      // TEMPORARY: return the real upstream error so we can see what's wrong.
      return NextResponse.json(
        {
          status: "error",
          message: "Could not fetch data plans.",
          debug_upstream_status: response.status,
          debug_upstream_body: data ?? rawText,
          debug_key_prefix: apiKey.slice(0, 8), // just enough to confirm sandbox vs live, never the full key
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Failed to fetch data plans:", err);
    return NextResponse.json(
      { status: "error", message: "Something went wrong reaching the data provider." },
      { status: 500 }
    );
  }
}
