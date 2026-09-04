// Stage 10 — Report screen, now real: fetches the full report and lets
// the user download it as a markdown file.
"use client";

import { useEffect, useState } from "react";
import type { Report } from "@/models/types";

export default function ReportPage({
  params,
}: {
  params: { analysisId: string };
}) {
  const [report, setReport] = useState<Report | null>(null);
  const [markdown, setMarkdown] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/report?findingId=${params.analysisId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setReport(data.report);
          setMarkdown(data.markdown);
        }
      })
      .catch(() => setError("Failed to generate report."));
  }, [params.analysisId]);

  function handleDownload() {
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mine-ai-report-${params.analysisId}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (error) {
    return (
      <main style={{ padding: 24, maxWidth: 480, margin: "0 auto" }}>
        <h1>Report</h1>
        <p style={{ color: "#c00" }}>{error}</p>
      </main>
    );
  }

  if (!report) {
    return (
      <main style={{ padding: 24, maxWidth: 480, margin: "0 auto" }}>
        <h1>Report</h1>
        <p>Generating report...</p>
      </main>
    );
  }

  return (
    <main style={{ padding: 24, maxWidth: 480, margin: "0 auto" }}>
      <h1>Report</h1>

      <button
        onClick={handleDownload}
        style={{ padding: "12px 20px", fontSize: 16, borderRadius: 8, marginBottom: 20 }}
      >
        Download as Markdown
      </button>

      <pre
        style={{
          whiteSpace: "pre-wrap",
          fontFamily: "system-ui, sans-serif",
          fontSize: 14,
          background: "#f7f7f7",
          padding: 16,
          borderRadius: 8,
        }}
      >
        {markdown}
      </pre>
    </main>
  );
}
