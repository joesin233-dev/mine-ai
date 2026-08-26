// Stage 1 placeholder — Data Understanding screen.
// Real profiling output (Stage 3) will render here. No logic yet.
export default function UnderstandPage({ params }: { params: { datasetId: string } }) {
  return (
    <main style={{ padding: 24, maxWidth: 480, margin: "0 auto" }}>
      <h1>Data Understanding</h1>
      <p>Dataset: {params.datasetId}</p>
      <p style={{ color: "#666" }}>Profiling engine not built yet (Stage 3).</p>
    </main>
  );
}
