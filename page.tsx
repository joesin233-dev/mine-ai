// Stage 1 placeholder — Investigation question screen.
export default function InvestigateQuestionPage({ params }: { params: { datasetId: string } }) {
  return (
    <main style={{ padding: 24, maxWidth: 480, margin: "0 auto" }}>
      <h1>Investigate</h1>
      <p>Dataset: {params.datasetId}</p>
      <p style={{ color: "#666" }}>Question parsing not built yet (Stage 5).</p>
    </main>
  );
}
