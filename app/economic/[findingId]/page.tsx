// Stage 1 placeholder — Economic Impact screen.
export default function EconomicPage({ params }: { params: { findingId: string } }) {
  return (
    <main style={{ padding: 24, maxWidth: 480, margin: "0 auto" }}>
      <h1>Economic Impact</h1>
      <p>Finding: {params.findingId}</p>
      <p style={{ color: "#666" }}>Economic engine not built yet (Stage 8).</p>
    </main>
  );
}
