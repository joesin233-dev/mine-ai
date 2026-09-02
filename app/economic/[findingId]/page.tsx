// Stage 9 — Economic Impact screen, now real: lets the user supply the
// required input (e.g. valuePerUnit) and shows the calculated result, or
// asks for what's missing.
"use client";

import { useState } from "react";
import Link from "next/link";
import type { EconomicResult } from "@/models/types";

export default function EconomicPage({
  params,
}: {
  params: { findingId: string };
}) {
  const [valuePerUnit, setValuePerUnit] = useState("");
  const [result, setResult] = useState<EconomicResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCalculate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/economic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          findingId: params.findingId,
          inputs: valuePerUnit ? { valuePerUnit: Number(valuePerUnit) } : {},
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Calculation failed.");
        setLoading(false);
        return;
      }
      setResult(data);
    } catch {
      setError("Something went wrong calculating economic impact.");
    }
    setLoading(false);
  }

  return (
    <main style={{ padding: 24, maxWidth: 480, margin: "0 auto" }}>
      <h1>Economic Impact</h1>

      <label style={{ display: "block", marginTop: 16, fontSize: 14 }}>
        Value per unit ($)
      </label>
      <input
        type="number"
        value={valuePerUnit}
        onChange={(e) => setValuePerUnit(e.target.value)}
        style={{ width: "100%", padding: 10, fontSize: 16, marginTop: 4 }}
        placeholder="e.g. 50"
      />

      <button
        onClick={handleCalculate}
        disabled={loading}
        style={{ padding: "12px 20px", fontSize: 16, marginTop: 12, borderRadius: 8 }}
      >
        {loading ? "Calculating..." : "Calculate"}
      </button>

      {error && <p style={{ color: "#c00", marginTop: 16 }}>{error}</p>}

      {result && result.result === null && (
        <div style={{ marginTop: 16, padding: 12, background: "#fff8e1", borderRadius: 8 }}>
          <p>Economic impact cannot currently be calculated.</p>
          <p style={{ fontSize: 14, color: "#666" }}>
            Missing: {result.missingInputs?.join(", ")}
          </p>
        </div>
      )}

      {result && result.result !== null && (
        <div style={{ marginTop: 16, padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
          <p style={{ fontSize: 22, fontWeight: "bold" }}>
            {result.currency} {result.result.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
          <p style={{ fontSize: 13, color: "#666" }}>{result.formula}</p>
          <p style={{ fontSize: 12, color: "#999", marginTop: 8 }}>
            Value type: {result.valueType}
          </p>
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        <Link href={`/report/${params.findingId}`}>
          <button style={{ padding: "12px 20px", fontSize: 16, borderRadius: 8 }}>
            Generate Report →
          </button>
        </Link>
      </div>
    </main>
  );
}

