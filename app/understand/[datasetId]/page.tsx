// Stage 3 update — Data Understanding screen now shows the real profile
// (column types, stats, quality flags) fetched from /api/understand.
"use client";

import { useEffect, useState } from "react";
import type { Dataset } from "@/models/types";

export default function UnderstandPage({
  params,
}: {
  params: { datasetId: string };
}) {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/understand?datasetId=${params.datasetId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setDataset(data);
        }
      })
      .catch(() => setError("Failed to load dataset profile."));
  }, [params.datasetId]);

  if (error) {
    return (
      <main style={{ padding: 24, maxWidth: 480, margin: "0 auto" }}>
        <h1>Data Understanding</h1>
        <p style={{ color: "#c00" }}>{error}</p>
      </main>
    );
  }

  if (!dataset) {
    return (
      <main style={{ padding: 24, maxWidth: 480, margin: "0 auto" }}>
        <h1>Data Understanding</h1>
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main style={{ padding: 24, maxWidth: 480, margin: "0 auto" }}>
      <h1>Data Understanding</h1>
      <p>
        <strong>{dataset.filename}</strong> — {dataset.rowCount} rows
      </p>

      <h2 style={{ fontSize: 18, marginTop: 24 }}>Columns</h2>
      {dataset.columns.map((col) => (
        <div
          key={col.name}
          style={{
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: 12,
            marginBottom: 12,
          }}
        >
          <strong>{col.name}</strong>{" "}
          <span style={{ color: "#666" }}>({col.type})</span>
          {col.missingCount > 0 && (
            <p style={{ color: "#a60", margin: "4px 0" }}>
              {col.missingCount} missing value(s)
            </p>
          )}
          {col.stats && (
            <ul style={{ margin: "4px 0", paddingLeft: 20, fontSize: 14 }}>
              <li>Mean: {col.stats.mean.toFixed(2)}</li>
              <li>Median: {col.stats.median.toFixed(2)}</li>
              <li>
                Min / Max: {col.stats.min} / {col.stats.max}
              </li>
              <li>Std Dev: {col.stats.stdDev.toFixed(2)}</li>
            </ul>
          )}
        </div>
      ))}
    </main>
  );
}
