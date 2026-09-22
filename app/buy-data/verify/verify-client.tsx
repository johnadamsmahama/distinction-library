"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type OrderStatus = "pending" | "paid" | "processing" | "delivered" | "failed" | "refunded";

const TERMINAL_STATUSES: OrderStatus[] = ["delivered", "failed", "refunded"];
const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 40; // ~2 minutes before giving up

export default function VerifyClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reference = searchParams.get("reference");

  const [status, setStatus] = useState<OrderStatus | "checking">("checking");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (!reference) {
      setErrorMsg("Missing payment reference.");
      return;
    }

    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(`/api/data/status/${reference}`);
        const data = await res.json();

        if (cancelled) return;

        if (!res.ok) {
          setErrorMsg(data.error || "Could not check order status.");
          return;
        }

        setStatus(data.status as OrderStatus);

        if (!TERMINAL_STATUSES.includes(data.status)) {
          setAttempts((prev) => {
            const next = prev + 1;
            if (next < MAX_POLL_ATTEMPTS) {
              setTimeout(poll, POLL_INTERVAL_MS);
            } else {
              setErrorMsg(
                "Still processing — this is taking longer than usual. Check back shortly."
              );
            }
            return next;
          });
        }
      } catch {
        if (!cancelled) {
          setErrorMsg("Network error while checking status. Retrying...");
          setTimeout(poll, POLL_INTERVAL_MS);
        }
      }
    }

    poll();
    return () => {
      cancelled = true;
    };
  }, [reference]);

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", padding: 24, textAlign: "center" }}>
      {status === "checking" && <p>Checking your payment...</p>}
      {status === "processing" && <p>Payment confirmed — sending your data bundle now...</p>}
      {status === "delivered" && (
        <>
          <p>✅ Data bundle delivered successfully!</p>
          <button onClick={() => router.push("/dashboard")}>Back to Dashboard</button>
        </>
      )}
      {status === "failed" && (
        <>
          <p>❌ Something went wrong with this order.</p>
          <button onClick={() => router.push("/buy-data")}>Try Again</button>
        </>
      )}
      {status === "refunded" && <p>This order was refunded.</p>}
      {errorMsg && <p style={{ color: "crimson" }}>{errorMsg}</p>}
    </div>
  );
}
