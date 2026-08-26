"use client";

import { useState } from "react";

export default function UploadPage() {
  const [status, setStatus] = useState<string>("");
  const [datasetId, setDatasetId] = useState<string | null>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus("Uploading...");
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const json = await res.json();

    if (!res.ok) {
      setStatus(`Error: ${json.error}`);
      return;
    }

    setDatasetId(json.datasetId);
    setStatus(`Uploaded "${json.filename}" successfully.`);
  }

  return (
    <main style={{ padding: 24, maxWidth: 480, margin: "0 auto" }}>
      <h1>Upload a dataset</h1>
      <p>Accepted formats: CSV, XLSX</p>
      <input type="file" accept=".csv,.xlsx,.xls" onChange={handleUpload} />
      {status && <p style={{ marginTop: 16 }}>{status}</p>}
      {datasetId && (
        <p style={{ fontSize: 12, color: "#666" }}>Dataset ID: {datasetId}</p>
      )}
    </main>
  );
}
