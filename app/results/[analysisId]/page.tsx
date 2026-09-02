// Stage 9 — Results screen, now real: runs Discover for the dataset and
// shows the ranked findings list.
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Finding } from "@/models/types";

export default function ResultsPage({
  params,
}: {
  params: { analysisId: string };
}) {
  const [findings, setFindings] = useState<Finding[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/discover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ datasetId: params.analysisId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setFindings(data.findings);
        }
      })
      .catch(() => setError("Failed to load findings."));
  }, [params.analysisId]);

  return (
    <main style={{ padding: 24, maxWidth: 480, margin: "0 auto" }}>
      <h1>Results</h1>

      {error && <p style={{ color: "#c00" }}>{error}</p>}

      {!error && !findings && <p>Scanning for findings...</p>}

      {findings && findings.length === 0 && (
        <p style={{ color: "#666" }}>
          No significant findings were detected in this dataset.
        </p>
      )}

      {findings &&
        findings.map((finding) => (
          <Link
            key={finding.id}
            href={`/evidence/${finding.id}`}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div
              style={{
                border: "1px solid #ddd",
                borderRadius: 8,
                padding: 14,
                marginBottom: 12,
              }}
            >
              <strong style={{ textTransform: "capitalize" }}>{finding.type}</strong>{" "}
              <span style={{ color: "#666" }}>
                ({finding.variablesInvolved.join(", ")})
              </span>
              <p style={{ margin: "6px 0 0" }}>{finding.description}</p>
            </div>
          </Link>
        ))}
    </main>
  );
}

