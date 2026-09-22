"use client";

import { useState } from "react";

export default function TestInitializePage() {
  const [network, setNetwork] = useState("MTN");
  const [packageId, setPackageId] = useState("16");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleTest() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/data/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          network,
          packageId: Number(packageId),
          phone,
          email,
        }),
      });
      const data = await res.json();
      setResult(JSON.stringify({ status: res.status, body: data }, null, 2));
    } catch (err) {
      setResult("Fetch failed: " + String(err));
    }
    setLoading(false);
  }

  return (
    <div style={{ padding: 20, fontFamily: "monospace", maxWidth: 480, margin: "0 auto" }}>
      <h2>Test: initialize-payment</h2>

      <label>Network</label>
      <select value={network} onChange={(e) => setNetwork(e.target.value)} style={{ width: "100%", marginBottom: 10, padding: 8 }}>
        <option value="MTN">MTN</option>
        <option value="TELECEL">TELECEL</option>
        <option value="AT">AT</option>
      </select>

      <label>Package ID</label>
      <input value={packageId} onChange={(e) => setPackageId(e.target.value)} style={{ width: "100%", marginBottom: 10, padding: 8 }} />

      <label>Phone</label>
      <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0240000000" style={{ width: "100%", marginBottom: 10, padding: 8 }} />

      <label>Email</label>
      <input value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: "100%", marginBottom: 10, padding: 8 }} />

      <button onClick={handleTest} disabled={loading} style={{ width: "100%", padding: 12, fontWeight: "bold" }}>
        {loading ? "Sending..." : "Send Test Request"}
      </button>

      {result && (
        <pre style={{ marginTop: 20, background: "#111", color: "#0f0", padding: 12, whiteSpace: "pre-wrap", fontSize: 12 }}>
          {result}
        </pre>
      )}
    </div>
  );
}
