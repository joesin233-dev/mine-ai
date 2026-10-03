// Stage 9 — Investigation question screen, now real.
//
// Update: shows tap-to-ask suggested questions built from the dataset's own
// columns, so users never have to guess what to type. They can still type
// their own question; a hint lists the column names Tarpec understands.
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { SuggestedQuestion } from "@/core/investigation-engine/suggestQuestions";

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
  const [suggestions, setSuggestions] = useState<SuggestedQuestion[]>([]);
  const [columnNames, setColumnNames] = useState<string[]>([]);

  useEffect(() => {
    async function loadSuggestions() {
      try {
        const res = await fetch(
          `/api/suggestions?datasetId=${encodeURIComponent(params.datasetId)}`
        );
        if (!res.ok) return;
        const data = await res.json();
        setSuggestions(data.suggestions ?? []);
        setColumnNames(data.columnNames ?? []);
      } catch {
        // Suggestions are a convenience; the page still works without them.
      }
    }
    loadSuggestions();
  }, [params.datasetId]);

  async function runInvestigation(text: string) {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    setClarification(null);

    try {
      const res = await fetch("/api/investigate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ datasetId: params.datasetId, question: text }),
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

      {suggestions.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <p style={{ color: "#666", fontSize: 14, marginBottom: 8 }}>
            Tap a question to start:
          </p>
          {suggestions.map((s) => (
            <button
              key={s.question}
              onClick={() => runInvestigation(s.question)}
              disabled={loading}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "12px 14px",
                fontSize: 15,
                marginBottom: 8,
                borderRadius: 8,
                border: "1px solid #ddd",
                background: "#fff",
                cursor: "pointer",
              }}
            >
              {s.label}
              <span style={{ display: "block", fontSize: 12, color: "#999", marginTop: 2 }}>
                {s.basedOn}
              </span>
            </button>
          ))}
        </div>
      )}

      <p style={{ color: "#666", marginTop: 20 }}>Or type your own question:</p>

      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        rows={3}
        style={{ width: "100%", padding: 10, fontSize: 16, marginTop: 4 }}
        placeholder="Type your question..."
      />

      {columnNames.length > 0 && (
        <p style={{ fontSize: 12, color: "#999", marginTop: 6 }}>
          Mention one of these in your question: {columnNames.join(", ")}
        </p>
      )}

      <button
        onClick={() => runInvestigation(question)}
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
