// Stage 1 placeholder — Results screen (ranked findings list).
export default function ResultsPage({ params }: { params: { analysisId: string } }) {
  return (
    <main style={{ padding: 24, maxWidth: 480, margin: "0 auto" }}>
      <h1>Results</h1>
      <p>Analysis: {params.analysisId}</p>
      <p style={{ color: "#666" }}>Findings not available yet (Stages 4-6).</p>
    </main>
  );
}
