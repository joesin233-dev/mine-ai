// Stage 9 — Investigation question screen, now real.
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function InvestigateQuestionPage({
  params,
}: {
  params: { datasetId: string };
}) {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [clarification, setClarification] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!question.trim()) return;
    setLoading(true);
    setError(null);
    setClarification(null);

    try {
      const res = await fetch("/api/investigate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ datasetId: params.datasetId, question }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Investigation failed.");
        setLoading(false);
        return;
      }

      if (data.needsClarification) {
        setClarification(data.message);
        setLoading(false);
        return;
      }

      router.push(`/evidence/${data.finding.id}`);
    } catch {
      setError("Something went wrong running the investigation.");
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 480, margin: "0 auto" }}>
      <h1>Investigate</h1>
      <p style={{ color: "#666" }}>
        Ask a question about this dataset, e.g. "Why did production drop in
        February?"
      </p>

      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        rows={3}
        style={{ width: "100%", padding: 10, fontSize: 16, marginTop: 12 }}
        placeholder="Type your question..."
      />

      <button
        onClick={handleSubmit}
        disabled={loading || !question.trim()}
        style={{ padding: "12px 20px", fontSize: 16, marginTop: 12, borderRadius: 8 }}
      >
        {loading ? "Investigating..." : "Investigate"}
      </button>

      {clarification && (
        <div style={{ marginTop: 16, padding: 12, background: "#fff8e1", borderRadius: 8 }}>
          <p>{clarification}</p>
        </div>
      )}

      {error && <p style={{ color: "#c00", marginTop: 16 }}>{error}</p>}
    </main>
  );
}
