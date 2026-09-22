"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const NETWORKS = [
  { key: "MTN", label: "MTN", img: "/mtn.svg.jpeg", color: "#FFCB00", checkColor: "#1a1a1a" },
  { key: "Telecel", label: "Telecel", img: "/telecel.png.jpeg", color: "#E30613", checkColor: "#fff" },
  { key: "AT", label: "AirtelTigo", img: "/airteltigo.jpg.jpeg", color: "#1d3a8a", checkColor: "#fff" },
];

// Maps this page's network keys (used for display + data_orders) to Notify's
// own format (used for /api/data/plans and the data_markup_rules table).
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

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  color: "#5a6f9a",
  letterSpacing: 1.5,
  textTransform: "uppercase",
  display: "block",
  marginBottom: 6,
};

export default function BuyDataPage() {
  const supabase = createClient();

  const [network, setNetwork] = useState<string | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [recipient, setRecipient] = useState<"me" | "other">("me");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [markups, setMarkups] = useState<Record<string, number>>({});

  // Fetch each network's markup once, so displayed totals match what will
  // actually be charged server-side.
  useEffect(() => {
    fetch("/api/data/markup")
      .then((res) => res.json())
      .then((json) => setMarkups(json.markups || {}))
      .catch(() => {
        // Non-fatal: totals will just show wholesale price until this loads.
      });
  }, []);

  useEffect(() => {
    if (!network) return;
    setPlansLoading(true);
    setSelectedPlan(null);
    const notifyNetwork = NOTIFY_NETWORK[network];
    fetch(`/api/data/plans?network=${notifyNetwork.toLowerCase()}`)
      .then((res) => res.json())
      .then((json) => {
        const list: Plan[] = Array.isArray(json.data) ? json.data : json.data ? [json.data] : [];
        setPlans(list);
      })
      .catch(() => setError("Couldn't load plans right now. Try again."))
      .finally(() => setPlansLoading(false));
  }, [network]);

  const canSubmit = !!network && !!selectedPlan && /^0[2-9]\d{8}$/.test(phone.trim());

  function displayPrice(plan: Plan): number {
    if (!network) return parseFloat(plan.price);
    const notifyNetwork = NOTIFY_NETWORK[network];
    const markup = markups[notifyNetwork] ?? 0;
    return parseFloat(plan.price) + markup;
  }

  async function handlePay() {
    if (!canSubmit || !selectedPlan || !network) return;
    setLoading(true);
    setError(null);

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
        setLoading(false);
        return;
      }

      window.location.href = json.authorizationUrl;
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <>
      <style jsx global>{`
        html, body { background: #0f1f45 !important; margin: 0; padding: 0; min-height: 100%; }
      `}</style>
      <div
        style={{
          fontFamily: "'Segoe UI', sans-serif",
          background: "#0f1f45",
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
            <h2
              style={{
                fontSize: "clamp(20px, 3vh, 26px)",
                fontWeight: 800,
                color: "#ffffff",
                margin: "4px 0 6px",
                letterSpacing: -0.5,
              }}
            >
              Buy data
            </h2>
            <p style={{ fontSize: 13, color: "#8fa0c8", lineHeight: 1.5, margin: 0 }}>
              Get a bundle sent straight to any number in seconds.
            </p>
          </div>

          <p style={labelStyle}>Select network</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "clamp(6px, 1vh, 8px)", marginBottom: "clamp(10px, 2vh, 18px)" }}>
            {NETWORKS.map((net) => (
              <button
                key={net.key}
                onClick={() => setNetwork(net.key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  background: network === net.key ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
                  border: network === net.key ? `1.5px solid ${net.color}` : "1.5px solid rgba(255,255,255,0.07)",
                  borderRadius: 0,
                  padding: "clamp(7px, 1.4vh, 11px) 16px",
                  cursor: "pointer",
                  boxShadow: network === net.key ? `0 0 0 3px ${net.color}22` : "none",
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
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{net.label}</div>
                  <div style={{ fontSize: 11, color: "#5a6f9a" }}>Mobile data bundles</div>
                </div>
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    flexShrink: 0,
                    border: network === net.key ? "none" : "1.5px solid rgba(255,255,255,0.2)",
                    background: network === net.key ? net.color : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {network === net.key && (
                    <span style={{ color: net.checkColor, fontSize: 11, fontWeight: 900, lineHeight: 1 }}>✓</span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {network && (
            <>
              <p style={labelStyle}>Select plan</p>
              {plansLoading && (
                <p style={{ color: "#8fa0c8", fontSize: 13, marginBottom: 16 }}>Loading plans...</p>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: "clamp(10px, 2vh, 18px)" }}>
                {plans.map((plan) => {
                  const active = selectedPlan?.package_id === plan.package_id;
                  const netMeta = NETWORKS.find((n) => n.key === network)!;
                  return (
                    <button
                      key={plan.package_id}
                      onClick={() => setSelectedPlan(plan)}
                      style={{
                        textAlign: "left",
                        background: active ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
                        border: active ? `1.5px solid ${netMeta.color}` : "1.5px solid rgba(255,255,255,0.07)",
                        borderRadius: 0,
                        padding: "10px 12px",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{plan.gig_size}</div>
                      <div style={{ fontSize: 11, color: "#8fa0c8" }}>
                        {plan.validity ? `${plan.validity} · ` : ""}GH₵{displayPrice(plan).toFixed(2)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {selectedPlan && (
            <>
              <p style={labelStyle}>Who is this for?</p>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <button
                  onClick={() => setRecipient("me")}
                  style={{
                    flex: 1,
                    background: recipient === "me" ? "rgba(255,255,255,0.08)" : "transparent",
                    border: recipient === "me" ? "1.5px solid #C9A843" : "1.5px solid rgba(255,255,255,0.15)",
                    borderRadius: 0,
                    padding: "10px",
                    color: "#fff",
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  For me
                </button>
                <button
                  onClick={() => setRecipient("other")}
                  style={{
                    flex: 1,
                    background: recipient === "other" ? "rgba(255,255,255,0.08)" : "transparent",
                    border: recipient === "other" ? "1.5px solid #C9A843" : "1.5px solid rgba(255,255,255,0.15)",
                    borderRadius: 0,
                    padding: "10px",
                    color: "#fff",
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Someone else
                </button>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Phone number</label>
                <div style={{ display: "flex", border: "1.5px solid rgba(255,255,255,0.08)", borderRadius: 0, overflow: "hidden" }}>
                  <span
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      padding: "10px 12px",
                      fontSize: 13,
                      color: "#8fa0c8",
                      borderRight: "1.5px solid rgba(255,255,255,0.08)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    🇬🇭 +233
                  </span>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="024 000 0000"
                    style={{ flex: 1, border: "none", outline: "none", padding: "10px 14px", fontSize: 14, color: "#fff", background: "transparent" }}
                  />
                </div>
              </div>
            </>
          )}

          {selectedPlan && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                borderTop: "1px solid rgba(255,255,255,0.1)",
                paddingTop: 12,
                marginBottom: 16,
              }}
            >
              <span style={{ fontSize: 12, color: "#5a6f9a", textTransform: "uppercase", letterSpacing: 1.5 }}>Total</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: "#fff" }}>
                GH₵{displayPrice(selectedPlan).toFixed(2)}
              </span>
            </div>
          )}

          {error && (
            <p style={{ color: "#E30613", fontSize: 12, marginBottom: 10, textAlign: "center" }}>{error}</p>
          )}

          <button
            onClick={handlePay}
            disabled={!canSubmit || loading}
            style={{
              width: "100%",
              background: canSubmit && !loading ? "#C9A843" : "rgba(201,168,67,0.12)",
              color: canSubmit && !loading ? "#0f1f45" : "#C9A843",
              border: canSubmit && !loading ? "none" : "1.5px solid rgba(201,168,67,0.4)",
              borderRadius: 0,
              padding: "clamp(10px, 1.6vh, 14px)",
              fontSize: 14,
              fontWeight: 800,
              cursor: canSubmit && !loading ? "pointer" : "default",
              letterSpacing: 0.3,
            }}
          >
            {loading ? "Starting payment..." : "Pay by Mobile Money or card"}
          </button>

          <p style={{ textAlign: "center", fontSize: 11, color: "#3d5078", marginTop: 10, marginBottom: 0 }}>
            Data is sent to the number automatically after payment.
          </p>
        </div>
      </div>
    </>
  );
}
