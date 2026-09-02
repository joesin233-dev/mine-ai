// Stage 9 — Discover / Investigate selection screen, now real.
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AnalyzeSelectPage({
  params,
}: {
  params: { datasetId: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDiscover() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ datasetId: params.datasetId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Discovery failed.");
        setLoading(false);
        return;
      }
      router.push(`/results/${params.datasetId}`);
    } catch {
      setError("Something went wrong running discovery.");
      setLoading(false);
    }
  }

  function handleInvestigate() {
    router.push(`/investigate/${params.datasetId}`);
  }

  return (
    <main style={{ padding: 24, maxWidth: 480, margin: "0 auto" }}>
      <h1>Discover or Investigate</h1>
      <p style={{ color: "#666" }}>
        Discover scans the whole dataset for important findings. Investigate
        lets you ask about a specific problem.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 24 }}>
        <button
          onClick={handleDiscover}
          disabled={loading}
          style={{ padding: "14px 20px", fontSize: 16, borderRadius: 8 }}
        >
          {loading ? "Scanning..." : "Discover — find important problems"}
        </button>
        <button
          onClick={handleInvestigate}
          disabled={loading}
          style={{ padding: "14px 20px", fontSize: 16, borderRadius: 8 }}
        >
          Investigate — ask a specific question
        </button>
      </div>

      {error && <p style={{ color: "#c00", marginTop: 16 }}>{error}</p>}
    </main>
  );
}

