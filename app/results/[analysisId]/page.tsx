// Stage 9 — Results screen: runs Discover for the dataset and shows the
// ranked findings list. Large files are scanned in a fast, capped pass
// by default, with an option to run a full scan on request.
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
  const [truncated, setTruncated] = useState(false);
  const [totalRows, setTotalRows] = useState(0);
  const [scannedRows, setScannedRows] = useState(0);
  const [fullScanLoading, setFullScanLoading] = useState(false);

  function runDiscover(fullScan: boolean) {
    if (fullScan) setFullScanLoading(true);
    fetch("/api/discover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ datasetId: params.analysisId, fullScan }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setFindings(data.findings);
          setTruncated(data.truncated);
          setTotalRows(data.totalRows);
          setScannedRows(data.scannedRows);
        }
      })
      .catch(() => setError("Failed to load findings."))
      .finally(() => setFullScanLoading(false));
  }

  useEffect(() => {
    runDiscover(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      {truncated && (
        <div
          style={{
            background: "#fff8e1",
            padding: 12,
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 14,
          }}
        >
          <p style={{ margin: 0 }}>
            This file has {totalRows} rows — for speed, we scanned the first{" "}
            {scannedRows}.
          </p>
          <button
            onClick={() => runDiscover(true)}
            disabled={fullScanLoading}
            style={{ marginTop: 8, padding: "8px 14px", fontSize: 14, borderRadius: 8 }}
          >
            {fullScanLoading ? "Scanning everything..." : "Continue — scan everything"}
          </button>
        </div>
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
