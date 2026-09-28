export default function HomePage() {
  return (
    <main
      style={{
        padding: 24,
        maxWidth: 480,
        margin: "0 auto",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: 16,
        }}
      >
        <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
          <circle
            cx="24"
            cy="24"
            r="14"
            stroke="#1a2332"
            strokeWidth="3"
          />
          <path
            d="M34 34L46 46"
            stroke="#1a2332"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M16 26L21 20L26 24L32 16"
            stroke="#d4a017"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>

      <h1
        style={{
          textAlign: "center",
          color: "#1a2332",
          fontSize: 32,
          marginBottom: 4,
        }}
      >
        Tarpec AI
      </h1>

      <p
        style={{
          textAlign: "center",
          color: "#555",
          fontSize: 15,
          lineHeight: 1.5,
          marginBottom: 24,
        }}
      >
        Trends, Anomalies, Relationships, Possible contributors, Evidence, and
        Confidence. Discover it automatically, investigate it on demand, or get
        it all in one report.
      </p>

      <div style={{ textAlign: "center" }}>
        <a
          href="/upload"
          style={{
            display: "inline-block",
            background: "#1a2332",
            color: "#fff",
            padding: "12px 24px",
            borderRadius: 8,
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Upload a dataset →
        </a>
      </div>
    </main>
  );
}
