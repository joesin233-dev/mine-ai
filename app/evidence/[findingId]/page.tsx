// Stage 1 placeholder — Evidence screen.
export default function EvidencePage({ params }: { params: { findingId: string } }) {
  return (
    <main style={{ padding: 24, maxWidth: 480, margin: "0 auto" }}>
      <h1>Evidence</h1>
      <p>Finding: {params.findingId}</p>
      <p style={{ color: "#666" }}>Evidence engine not built yet (Stage 7).</p>
    </main>
  );
}
