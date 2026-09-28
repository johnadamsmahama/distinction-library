"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

// Same three brand colors used for the border/glow when a network is
// selected AND for its "live" indicator square (MTN yellow, Telecel red,
// AT blue) — one source of truth for both.
const NETWORKS = [
  { key: "MTN", label: "MTN", img: "/mtn.svg.jpeg", color: "#FFCB00" },
  { key: "Telecel", label: "Telecel", img: "/telecel.png.jpeg", color: "#E30613" },
  { key: "AT", label: "AirtelTigo", img: "/airteltigo.jpg.jpeg", color: "#1d3a8a" },
];

const NOTIFY_NETWORK: Record<string, string> = {
  MTN: "MTN",
  Telecel: "TELECEL",
  AT: "AT",
};

type Plan = {
  package_id: number;
  gig_size: string;
  price: string;
  validity?: string;
};

type OrderState =
  | { phase: "idle" }
  | { phase: "starting" }
  | { phase: "waiting"; reference: string }
  | { phase: "success"; reference: string }
  | { phase: "failed"; reference?: string; message: string };

// Teal palette pulled directly from the dashboard's Buy Data tile
// (components/dashboard/CommunityAndToolsSection.tsx), so the tile and the
// page it opens are finally the same product.
const TEAL_MID = "#2F5A6B";
const TEAL_DEEP = "#12333D";
const CREAM = "#F6F1E3";
const LIVE_GREEN = "#4E9C7C";

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  color: CREAM,
  opacity: 0.7,
  letterSpacing: 1.5,
  textTransform: "uppercase",
  display: "block",
  marginBottom: 6,
};

// Every unselected button/border on this page used to be a different,
// barely-visible white opacity (0.03 to 0.2, chosen inconsistently spot by
// spot). One shared value here means a future contrast fix is a one-line
// change instead of hunting through the file again.
const FAINT_BORDER = "rgba(246,241,227,0.35)";
const FAINT_FILL = "rgba(246,241,227,0.08)";

const POLL_INTERVAL_MS = 4000;
const POLL_TIMEOUT_MS = 3 * 60 * 1000; // stop polling after 3 minutes

export default function BuyDataPage() {
  const supabase = createClient();

  const [network, setNetwork] = useState<string | null>(null);
  const [plansByNetwork, setPlansByNetwork] = useState<Record<string, Plan[]>>({});
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [markups, setMarkups] = useState<Record<string, number>>({});
  const [sellingPrices, setSellingPrices] = useState<Record<string, Record<number, number>>>({});
  const [order, setOrder] = useState<OrderState>({ phase: "idle" });

  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollDeadline = useRef<number>(0);

  useEffect(() => {
    fetch("/api/data/markup")
      .then((res) => res.json())
      .then((json) => setMarkups(json.markups || {}))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/data/prices")
      .then((res) => res.json())
      .then((json) => setSellingPrices(json.prices || {}))
      .catch(() => {});
  }, []);

  // Fetch all three networks' plans in parallel as soon as the page loads,
  // instead of waiting for a network tap. Each one updates independently as
  // it resolves, so whichever comes back first is ready first — by the time
  // someone taps a network, its plans are usually already sitting there.
  useEffect(() => {
    NETWORKS.forEach((net) => {
      const notifyNetwork = NOTIFY_NETWORK[net.key];
      fetch(`/api/data/plans?network=${notifyNetwork.toLowerCase()}`)
        .then((res) => res.json())
        .then((json) => {
          const list: Plan[] = Array.isArray(json.data) ? json.data : json.data ? [json.data] : [];
          setPlansByNetwork((prev) => ({ ...prev, [net.key]: list }));
        })
        .catch(() => {
          // Leave this network's list unset — its plan grid will just stay
          // empty rather than blocking the other two networks.
        });
    });
  }, []);

  useEffect(() => {
    setSelectedPlan(null);
  }, [network]);

  // Clean up any running poll when leaving the page.
  useEffect(() => {
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, []);

  const plans = network ? plansByNetwork[network] ?? [] : [];
  const plansPending = !!network && !(network in plansByNetwork);
  const canSubmit = !!network && !!selectedPlan && /^0[2-9]\d{8}$/.test(phone.trim());

  function displayPrice(plan: Plan): number {
    if (!network) return parseFloat(plan.price);
    const notifyNetwork = NOTIFY_NETWORK[network];
    const ours = sellingPrices[notifyNetwork]?.[plan.package_id];
    if (ours !== undefined) return ours;
    // Fallback for a package we haven't priced in data_package_prices yet —
    // better to show something than nothing, but this should be rare.
    const markup = markups[notifyNetwork] ?? 0;
    return parseFloat(plan.price) + markup;
  }

  // Notify's gig_size field is inconsistent about whether it already
  // includes a unit — this guarantees "GB" shows exactly once.
  function formatGigSize(gigSize: string): string {
    const trimmed = gigSize.trim();
    return /gb\s*$/i.test(trimmed) ? trimmed : `${trimmed}GB`;
  }

  function startPolling(reference: string) {
    if (pollTimer.current) clearInterval(pollTimer.current);
    pollDeadline.current = Date.now() + POLL_TIMEOUT_MS;

    pollTimer.current = setInterval(async () => {
      if (Date.now() > pollDeadline.current) {
        if (pollTimer.current) clearInterval(pollTimer.current);
        setOrder({
          phase: "failed",
          reference,
          message: "This is taking longer than expected. Check My Orders shortly, or contact support with your reference.",
        });
        return;
      }

      try {
        const res = await fetch(`/api/data/status/${reference}`);
        const json = await res.json();

        if (!res.ok) return; // transient error, just try again on the next tick

        if (json.status === "delivered" || json.status === "processing") {
          if (pollTimer.current) clearInterval(pollTimer.current);
          setOrder({ phase: "success", reference });
        } else if (json.status === "failed") {
          if (pollTimer.current) clearInterval(pollTimer.current);
          setOrder({
            phase: "failed",
            reference,
            message: "Payment didn't go through. No charge should have been made — please try again.",
          });
        }
        // "pending" — keep polling
      } catch {
        // transient network error, just try again on the next tick
      }
    }, POLL_INTERVAL_MS);
  }

  async function handlePay() {
    if (!canSubmit || !selectedPlan || !network) return;
    setError(null);
    setOrder({ phase: "starting" });

    try {
      const notifyNetwork = NOTIFY_NETWORK[network];
      const res = await fetch("/api/data/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: phone.trim(),
          network: notifyNetwork.toLowerCase(),
          planId: selectedPlan.package_id,
        }),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Something went wrong starting your payment.");
        setOrder({ phase: "idle" });
        return;
      }

      // Open the payment page in a new tab so this page stays alive to
      // track the order — Notify's checkout doesn't redirect back to us.
      const paymentWindow = window.open(json.authorizationUrl, "_blank");

      setOrder({ phase: "waiting", reference: json.reference });
      startPolling(json.reference);

      if (!paymentWindow) {
        // Popup blocked — give the buyer a manual link instead of silently failing.
        setError(
          "Your browser blocked the payment popup. Tap the button below to open it manually."
        );
      }
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      setOrder({ phase: "idle" });
    }
  }

  function handleStartOver() {
    if (pollTimer.current) clearInterval(pollTimer.current);
    setOrder({ phase: "idle" });
    setError(null);
    setSelectedPlan(null);
    setPhone("");
  }

  const showForm = order.phase === "idle" || order.phase === "starting";

  return (
    <>
      <style jsx global>{`
        html, body { background: ${TEAL_MID} !important; margin: 0; padding: 0; min-height: 100%; }
        @keyframes buyDataSpin { to { transform: rotate(360deg); } }
        @keyframes buyDataLivePulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
      `}</style>
      <div
        style={{
          fontFamily: "'Segoe UI', sans-serif",
          background: TEAL_MID,
          minHeight: "auto",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "clamp(8px, 2vh, 20px) 20px",
          boxSizing: "border-box",
        }}
      >
        <div style={{ maxWidth: 420, width: "100%", margin: "0 auto" }}>
          <div style={{ marginBottom: "clamp(10px, 2vh, 20px)" }}>
            <div
              style={{
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 2,
                fontSize: 9,
                color: CREAM,
                opacity: 0.7,
              }}
            >
              Distinction Library
            </div>
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(20px, 3vh, 26px)",
                fontWeight: 900,
                color: CREAM,
                margin: "6px 0 6px",
                WebkitTextStroke: `1px ${TEAL_DEEP}`,
              }}
            >
              Buy Data
            </h2>
            <p style={{ fontSize: 13, color: CREAM, opacity: 0.75, lineHeight: 1.5, margin: 0 }}>
              Get a bundle sent straight to any number in seconds.
            </p>
          </div>

          {order.phase === "waiting" && (
            <div
              style={{
                background: FAINT_FILL,
                border: `1.5px solid ${FAINT_BORDER}`,
                padding: 20,
                textAlign: "center",
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  margin: "0 auto 14px",
                  border: `3px solid rgba(246,241,227,0.25)`,
                  borderTopColor: CREAM,
                  borderRadius: "50%",
                  animation: "buyDataSpin 0.8s linear infinite",
                }}
              />
              <p style={{ color: CREAM, fontWeight: 700, fontSize: 15, margin: "0 0 6px" }}>
                Waiting for your payment...
              </p>
              <p style={{ color: CREAM, opacity: 0.75, fontSize: 12, margin: 0 }}>
                Complete payment in the tab that opened. This page will update automatically.
              </p>
              <p style={{ color: CREAM, opacity: 0.55, fontSize: 11, marginTop: 10 }}>
                Reference: {order.reference}
              </p>
            </div>
          )}

          {order.phase === "success" && (
            <div
              style={{
                background: FAINT_FILL,
                border: `1.5px solid ${LIVE_GREEN}`,
                padding: 20,
                textAlign: "center",
                marginBottom: 16,
              }}
            >
              <p style={{ color: CREAM, fontWeight: 800, fontSize: 17, margin: "0 0 6px" }}>
                Payment confirmed!
              </p>
              <p style={{ color: CREAM, opacity: 0.75, fontSize: 13, margin: "0 0 14px" }}>
                Your data is on its way to {phone.trim()}.
              </p>
              <button
                onClick={handleStartOver}
                style={{
                  background: CREAM,
                  color: TEAL_DEEP,
                  border: "none",
                  padding: "10px 20px",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Buy more data
              </button>
            </div>
          )}

          {order.phase === "failed" && (
            <div
              style={{
                background: "rgba(227,6,19,0.1)",
                border: "1.5px solid #E30613",
                padding: 20,
                textAlign: "center",
                marginBottom: 16,
              }}
            >
              <p style={{ color: CREAM, fontWeight: 800, fontSize: 15, margin: "0 0 6px" }}>
                Something went wrong
              </p>
              <p style={{ color: CREAM, opacity: 0.75, fontSize: 13, margin: "0 0 14px" }}>{order.message}</p>
              <button
                onClick={handleStartOver}
                style={{
                  background: "transparent",
                  color: CREAM,
                  border: `1.5px solid ${FAINT_BORDER}`,
                  padding: "10px 20px",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Try again
              </button>
            </div>
          )}

          {showForm && (
            <>
              <p style={labelStyle}>Select network</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "clamp(6px, 1vh, 8px)", marginBottom: "clamp(10px, 2vh, 18px)" }}>
                {NETWORKS.map((net) => {
                  const active = network === net.key;
                  return (
                    <button
                      key={net.key}
                      onClick={() => setNetwork(net.key)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        background: active ? FAINT_FILL : "rgba(246,241,227,0.03)",
                        border: active ? `1.5px solid ${TEAL_DEEP}` : `1.5px solid ${FAINT_BORDER}`,
                        borderRadius: 0,
                        padding: "clamp(7px, 1.4vh, 11px) 16px",
                        cursor: "pointer",
                        boxShadow: active ? `0 0 0 3px rgba(18,51,61,0.15)` : "none",
                      }}
                    >
                      <div
                        style={{
                          width: 46,
                          height: 46,
                          background: "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          overflow: "hidden",
                          padding: 6,
                          boxSizing: "border-box",
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={net.img} alt={net.label} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                      </div>
                      <div style={{ flex: 1, textAlign: "left" }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: active ? TEAL_DEEP : CREAM }}>{net.label}</div>
                        <div style={{ fontSize: 11, color: active ? TEAL_DEEP : CREAM, opacity: active ? 0.6 : 0.55 }}>
                          Mobile data bundles
                        </div>
                      </div>
                      {/* The "live" indicator: a small square in the network's own
                          brand color, pulsing, instead of a generic checkmark circle. */}
                      <div
                        style={{
                          width: 14,
                          height: 14,
                          flexShrink: 0,
                          background: active ? net.color : "transparent",
                          border: active ? "none" : `1.5px solid ${FAINT_BORDER}`,
                          animation: active ? "buyDataLivePulse 1.4s ease-in-out infinite" : "none",
                        }}
                      />
                    </button>
                  );
                })}
              </div>

              {network && (
                <>
                  <p style={labelStyle}>Select plan</p>
                  {plansPending && plans.length === 0 && (
                    <p style={{ color: CREAM, opacity: 0.7, fontSize: 12, marginBottom: 12 }}>
                      Fetching {NETWORKS.find((n) => n.key === network)?.label}'s plans...
                    </p>
                  )}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, marginBottom: "clamp(10px, 2vh, 18px)" }}>
                    {plans.map((plan) => {
                      const active = selectedPlan?.package_id === plan.package_id;
                      const netMeta = NETWORKS.find((n) => n.key === network)!;
                      return (
                        <button
                          key={plan.package_id}
                          onClick={() => setSelectedPlan(plan)}
                          style={{
                            textAlign: "center",
                            background: active ? CREAM : "rgba(246,241,227,0.03)",
                            border: active ? `1.5px solid ${TEAL_DEEP}` : `1.5px solid ${FAINT_BORDER}`,
                            borderRadius: 0,
                            padding: "9px 5px",
                            cursor: "pointer",
                          }}
                        >
                          <div style={{ fontSize: 11.5, fontWeight: 700, color: active ? TEAL_DEEP : CREAM }}>{formatGigSize(plan.gig_size)}</div>
                          <div style={{ fontSize: 7.5, color: active ? TEAL_DEEP : CREAM, opacity: active ? 0.6 : 0.6, marginTop: 2 }}>
                            GH₵{displayPrice(plan).toFixed(2)}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {selectedPlan && (
                <div style={{ marginBottom: 6 }}>
                  <label style={labelStyle}>Enter recipient number</label>
                  <div style={{ display: "flex", border: `1.5px solid ${FAINT_BORDER}`, borderRadius: 0, overflow: "hidden" }}>
                    <span
                      style={{
                        background: "rgba(246,241,227,0.06)",
                        padding: "10px 12px",
                        fontSize: 13,
                        color: CREAM,
                        opacity: 0.75,
                        borderRight: `1.5px solid ${FAINT_BORDER}`,
                        whiteSpace: "nowrap",
                      }}
                    >
                      🇬🇭 +233
                    </span>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="024 000 0000"
                      style={{ flex: 1, border: "none", outline: "none", padding: "10px 14px", fontSize: 14, color: CREAM, background: "transparent" }}
                    />
                  </div>
                  <p style={{ fontSize: 10.5, color: CREAM, opacity: 0.6, marginTop: 8, marginBottom: 16 }}>
                    Mobile data will be sent to this number.
                  </p>
                </div>
              )}

              {selectedPlan && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    borderTop: `1.5px solid ${FAINT_BORDER}`,
                    paddingTop: 12,
                    marginBottom: 16,
                  }}
                >
                  <span style={{ fontSize: 12, color: CREAM, opacity: 0.7, textTransform: "uppercase", letterSpacing: 1.5 }}>Total</span>
                  <span style={{ fontSize: 20, fontWeight: 800, color: CREAM }}>
                    GH₵{displayPrice(selectedPlan).toFixed(2)}
                  </span>
                </div>
              )}

              {error && (
                <p style={{ color: "#ffb4b4", fontSize: 12, marginBottom: 10, textAlign: "center" }}>{error}</p>
              )}

              <button
                onClick={handlePay}
                disabled={!canSubmit || order.phase === "starting"}
                style={{
                  width: "100%",
                  background: canSubmit && order.phase !== "starting" ? CREAM : "rgba(246,241,227,0.12)",
                  color: canSubmit && order.phase !== "starting" ? TEAL_DEEP : CREAM,
                  border: canSubmit && order.phase !== "starting" ? "none" : `1.5px solid ${FAINT_BORDER}`,
                  borderRadius: 0,
                  padding: "clamp(10px, 1.6vh, 14px)",
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: canSubmit && order.phase !== "starting" ? "pointer" : "default",
                  letterSpacing: 0.3,
                }}
              >
                {order.phase === "starting" ? "Starting payment..." : "Pay by Mobile Money or card"}
              </button>

              <p style={{ textAlign: "center", fontSize: 11, color: CREAM, opacity: 0.5, marginTop: 10, marginBottom: 0 }}>
                Data is sent to the number automatically after payment.
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
