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

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { status: "error", message: "Could not fetch data plans." },
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
