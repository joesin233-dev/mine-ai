// Stage 1 placeholder — Discover / Investigate selection screen.
export default function AnalyzeSelectPage({ params }: { params: { datasetId: string } }) {
  return (
    <main style={{ padding: 24, maxWidth: 480, margin: "0 auto" }}>
      <h1>Discover or Investigate</h1>
      <p>Dataset: {params.datasetId}</p>
      <p style={{ color: "#666" }}>
        Discovery engine (Stage 4) and Investigation engine (Stage 5) not built yet.
      </p>
    </main>
  );
}
