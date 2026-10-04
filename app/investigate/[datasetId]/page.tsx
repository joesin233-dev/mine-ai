// Stage 9 — Investigation question screen.
//
// Update: tap-to-ask questions are grouped under headings (what changed,
// what looks unusual, what is connected), each with real numbers from the
// user's file, so people can see which question fits what they care about.
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  SuggestedQuestion,
  QuestionGroup,
} from "@/core/investigation-engine/suggestQuestions";

const GROUPS: { id: QuestionGroup; title: string }[] = [
  { id: "changed", title: "What changed" },
  { id: "unusual", title: "What looks unusual" },
  { id: "connected", title: "What is connected" },
];

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

      {GROUPS.map((group) => {
        const items = suggestions.filter((s) => s.group === group.id);
        if (items.length === 0) return null;
        return (
          <div key={group.id} style={{ marginTop: 20 }}>
            <p style={{ color: "#1a2233", fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
              {group.title}
            </p>
            {items.map((s) => (
              <button
                key={s.question}
                onClick={() => runInvestigation(s.question)}
                disabled={loading}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "12px 14px",
                  fontSize: 16,
                  fontWeight: 600,
                  marginBottom: 8,
                  borderRadius: 8,
                  border: "1px solid #ddd",
                  background: "#fff",
                  color: "#1a2233",
                  cursor: "pointer",
                }}
              >
                {s.label}
                <span
                  style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 400,
                    color: "#666",
                    marginTop: 4,
                  }}
                >
                  {s.basedOn}
                </span>
              </button>
            ))}
          </div>
        );
      })}

      <p style={{ color: "#666", marginTop: 24 }}>Or type your own question:</p>

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
