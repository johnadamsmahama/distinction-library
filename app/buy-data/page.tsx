"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const NETWORKS = [
  { key: "MTN", label: "MTN", img: "/mtn.svg.jpeg", color: "#FFCB00", checkColor: "#1a1a1a" },
  { key: "Telecel", label: "Telecel", img: "/telecel.png.jpeg", color: "#E30613", checkColor: "#fff" },
  { key: "AT", label: "AirtelTigo", img: "/airteltigo.jpg.jpeg", color: "#1d3a8a", checkColor: "#fff" },
];

export default function BuyDataPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const supabase = createClient();
  const canSubmit = phone.trim().length > 5 && selected;

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id);
        if (data.user.email) setEmail(data.user.email);
      }
    });
  }, []);

  async function handleSubmit() {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);

    const { error: insertError } = await supabase.from("data_waitlist").insert({
      network: selected,
      phone: phone.trim(),
      email: email.trim() || null,
      user_id: userId,
    });

    setLoading(false);

    if (insertError) {
      setError("Something went wrong. Please try again.");
      console.error(insertError);
    } else {
      setSubmitted(true);
    }
  }

  if (submitted) {
    return (
      <>
        <style jsx global>{`
          html, body { background: #0f1f45 !important; margin: 0; padding: 0; min-height: 100%; }
        `}</style>
        <div
          style={{
            fontFamily: "'Segoe UI', sans-serif",
            background: "#0f1f45",
            minHeight: "100dvh",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            boxSizing: "border-box",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
            <h2 style={{ color: "#C9A843", fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
              You&apos;re on the list!
            </h2>
            <p style={{ color: "#8fa0c8", fontSize: 14, lineHeight: 1.6 }}>
              We&apos;ll notify you the moment data bundles go live.
            </p>
            <button
              onClick={() => {
                setSubmitted(false);
                setSelected(null);
                setPhone("");
              }}
              style={{
                marginTop: 24,
                background: "transparent",
                border: "1.5px solid #C9A843",
                color: "#C9A843",
                borderRadius: 0,
                padding: "10px 24px",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              Go Back
            </button>
          </div>
        </div>
      </>
    );
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
          justifyContent: "flex-start",
          padding: "clamp(8px, 2vh, 20px) 20px",
          boxSizing: "border-box",
        }}
      >
        <div style={{ maxWidth: 420, width: "100%", margin: "0 auto" }}>

          {/* Header */}
          <div style={{ marginBottom: "clamp(10px, 2vh, 20px)" }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 2,
                color: "#C9A843",
                textTransform: "uppercase",
              }}
            >
              Coming Soon
            </span>
            <h2
              style={{
                fontSize: "clamp(20px, 3vh, 26px)",
                fontWeight: 800,
                color: "#ffffff",
                margin: "4px 0 6px",
                letterSpacing: -0.5,
              }}
            >
              Buy Data
            </h2>
            <p style={{ fontSize: 13, color: "#8fa0c8", lineHeight: 1.5, margin: 0 }}>
              Affordable bundles for UPSA students. Reserve your spot — no payment needed.
            </p>
          </div>

          {/* Network Selection */}
          <p
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "#5a6f9a",
              letterSpacing: 1.5,
              textTransform: "uppercase",
              marginBottom: "clamp(6px, 1.2vh, 10px)",
            }}
          >
            Select Network
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "clamp(6px, 1vh, 8px)", marginBottom: "clamp(10px, 2vh, 18px)" }}>
            {NETWORKS.map((net) => (
              <button
                key={net.key}
                onClick={() => setSelected(net.key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  background:
                    selected === net.key ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
                  border:
                    selected === net.key
                      ? `1.5px solid ${net.color}`
                      : "1.5px solid rgba(255,255,255,0.07)",
                  borderRadius: 0,
                  padding: "clamp(7px, 1.4vh, 11px) 16px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  boxShadow: selected === net.key ? `0 0 0 3px ${net.color}22` : "none",
                }}
              >
                {/* Logo */}
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 0,
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
                  <img
                    src={net.img}
                    alt={net.label}
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  />
                </div>

                <div style={{ flex: 1, textAlign: "left" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{net.label}</div>
                  <div style={{ fontSize: 11, color: "#5a6f9a" }}>Mobile data bundles</div>
                </div>

                {/* Radio dot */}
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    flexShrink: 0,
                    border:
                      selected === net.key ? "none" : "1.5px solid rgba(255,255,255,0.2)",
                    background: selected === net.key ? net.color : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s",
                  }}
                >
                  {selected === net.key && (
                    <span
                      style={{
                        color: net.checkColor,
                        fontSize: 11,
                        fontWeight: 900,
                        lineHeight: 1,
                      }}
                    >
                      ✓
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Inputs */}
          <div
            style={{
              background: "rgba(255,255,255,0.04)",
              borderRadius: 0,
              padding: "clamp(10px, 1.8vh, 14px) 16px",
              marginBottom: "clamp(10px, 1.8vh, 16px)",
            }}
          >
            <div style={{ marginBottom: 12 }}>
              <label
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#5a6f9a",
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Phone Number
              </label>
              <div
                style={{
                  display: "flex",
                  border: "1.5px solid rgba(255,255,255,0.08)",
                  borderRadius: 0,
                  overflow: "hidden",
                }}
              >
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
                  style={{
                    flex: 1,
                    border: "none",
                    outline: "none",
                    padding: "10px 14px",
                    fontSize: 14,
                    color: "#fff",
                    background: "transparent",
                  }}
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#5a6f9a",
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Email{" "}
                <span
                  style={{ color: "#3d5078", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}
                >
                  (optional)
                </span>
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="10347621@upsamail.edu.gh"
                style={{
                  width: "100%",
                  border: "1.5px solid rgba(255,255,255,0.08)",
                  borderRadius: 0,
                  padding: "10px 14px",
                  fontSize: 14,
                  color: "#fff",
                  background: "transparent",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <p style={{ color: "#E30613", fontSize: 12, marginBottom: 10, textAlign: "center" }}>
              {error}
            </p>
          )}

          {/* CTA */}
          <button
            onClick={handleSubmit}
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
              transition: "all 0.2s",
              letterSpacing: 0.3,
            }}
          >
            {loading ? "Saving your spot..." : "Notify Me When It Launches"}
          </button>

          <p style={{ textAlign: "center", fontSize: 11, color: "#3d5078", marginTop: 10, marginBottom: 4 }}>
            No payment required — just your spot in line.
          </p>
          <p style={{ textAlign: "center", fontSize: 11, color: "#5a6f9a", margin: 0 }}>
            Signing up as{" "}
            <strong style={{ color: "#8fa0c8" }}>
              {email ? email.split("@")[0] : "Guest"}
            </strong>
          </p>
        </div>
      </div>
    </>
  );
}
