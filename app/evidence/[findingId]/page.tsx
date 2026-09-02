// Stage 9 — Evidence screen, now real: shows the full auditable evidence
// record and scored contributors for a finding.
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Contributor, EvidenceRecord } from "@/models/types";

export default function EvidencePage({
  params,
}: {
  params: { findingId: string };
}) {
  const [contributors, setContributors] = useState<Contributor[] | null>(null);
  const [evidence, setEvidence] = useState<EvidenceRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/evidence?findingId=${params.findingId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setContributors(data.contributors);
          setEvidence(data.evidence);
        }
      })
      .catch(() => setError("Failed to load evidence."));
  }, [params.findingId]);

  if (error) {
    return (
      <main style={{ padding: 24, maxWidth: 480, margin: "0 auto" }}>
        <h1>Evidence</h1>
        <p style={{ color: "#c00" }}>{error}</p>
      </main>
    );
  }

  if (!evidence) {
    return (
      <main style={{ padding: 24, maxWidth: 480, margin: "0 auto" }}>
        <h1>Evidence</h1>
        <p>Loading...</p>
      </main>
    );
  }

  const confidenceColor =
    evidence.confidence === "high"
      ? "#1a7f37"
      : evidence.confidence === "medium"
      ? "#a66a00"
      : "#c00";

  return (
    <main style={{ padding: 24, maxWidth: 480, margin: "0 auto" }}>
      <h1>Evidence</h1>

      <p>
        <strong style={{ color: confidenceColor }}>
          Confidence: {evidence.confidence.toUpperCase()}
        </strong>
      </p>
      <ul style={{ paddingLeft: 20 }}>
        {evidence.confidenceReasons.map((reason, i) => (
          <li key={i} style={{ fontSize: 14 }}>{reason}</li>
        ))}
      </ul>

      <h2 style={{ fontSize: 18, marginTop: 20 }}>Contributors</h2>
      {contributors?.map((c) => (
        <div
          key={c.variableName}
          style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, marginBottom: 10 }}
        >
          <strong>{c.variableName}</strong>{" "}
          <span style={{ color: "#666" }}>({c.evidenceStrength} evidence)</span>
          <p style={{ margin: "4px 0", fontSize: 14 }}>{c.observedChange}</p>
        </div>
      ))}

      {evidence.supportingEvidence.length > 0 && (
        <>
          <h2 style={{ fontSize: 18, marginTop: 20 }}>Supporting Evidence</h2>
          <ul style={{ paddingLeft: 20, fontSize: 14 }}>
            {evidence.supportingEvidence.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </>
      )}

      {evidence.contradictingEvidence.length > 0 && (
        <>
          <h2 style={{ fontSize: 18, marginTop: 20 }}>Contradicting Evidence</h2>
          <ul style={{ paddingLeft: 20, fontSize: 14 }}>
            {evidence.contradictingEvidence.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </>
      )}

      <h2 style={{ fontSize: 18, marginTop: 20 }}>Limitations</h2>
      <ul style={{ paddingLeft: 20, fontSize: 14, color: "#666" }}>
        {evidence.limitations.map((l, i) => (
          <li key={i}>{l}</li>
        ))}
      </ul>

      <Link href={`/economic/${params.findingId}`}>
        <button style={{ padding: "12px 20px", fontSize: 16, marginTop: 16, borderRadius: 8 }}>
          View Economic Impact →
        </button>
      </Link>
    </main>
  );
}
