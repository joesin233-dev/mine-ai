// Stage 9 — Economic Impact screen.
//
// On opening, it checks the column automatically:
//   - a MONEY column (already in the file's currency) shows its result at
//     once, with no value-per-unit box;
//   - a QUANTITY column asks for the value per unit, then calculates.
// The currency shown is always the file's own; nothing is hardcoded.
"use client";

import { useEffect, useState } from "react";
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
  const [autoChecking, setAutoChecking] = useState(true);

  async function calculate(inputs: Record<string, number>, quiet: boolean) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/economic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ findingId: params.findingId, inputs }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (!quiet) setError(data.error ?? "Calculation failed.");
        setLoading(false);
        return;
      }
      // On the automatic first check, keep only a complete result.
      if (quiet && data.result === null) {
        setLoading(false);
        return;
      }
      setResult(data);
    } catch {
      if (!quiet) setError("Something went wrong calculating economic impact.");
    }
    setLoading(false);
  }

  useEffect(() => {
    calculate({}, true).then(() => setAutoChecking(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleCalculate() {
    calculate(valuePerUnit ? { valuePerUnit: Number(valuePerUnit) } : {}, false);
  }

  const symbol = result?.currency ? result.currency.trim() : "";
  const isMoney =
    result !== null &&
    result.result !== null &&
    result.inputs.valuePerUnit === undefined;
  const showForm = !autoChecking && !isMoney;

  return (
    <main style={{ padding: 24, maxWidth: 480, margin: "0 auto" }}>
      <h1>Economic Impact</h1>

      {autoChecking && (
        <p style={{ marginTop: 16, color: "#666" }}>Checking your data...</p>
      )}

      {isMoney && (
        <p style={{ marginTop: 16, fontSize: 14, color: "#666" }}>
          This column is already money, so no value per unit is needed.
        </p>
      )}

      {showForm && (
        <>
          <label style={{ display: "block", marginTop: 16, fontSize: 14 }}>
            Value per unit (in the same currency as your file)
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
        </>
      )}

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
            {symbol ? `${symbol} ` : ""}
            {result.result.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
          <p style={{ fontSize: 13, color: "#666" }}>
            {result.result > 0
              ? "A gain compared with the earlier period."
              : result.result < 0
              ? "A loss compared with the earlier period."
              : "No change compared with the earlier period."}
          </p>
          {!symbol && (
            <p style={{ fontSize: 13, color: "#666" }}>
              in the currency used in your file
            </p>
          )}
          <p style={{ fontSize: 13, color: "#666", marginTop: 8 }}>{result.formula}</p>
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
