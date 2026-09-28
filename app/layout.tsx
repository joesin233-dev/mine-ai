export const metadata = {
  title: "Tarpec AI",
  description: "Discover it automatically, investigate it on demand, or get it all in one report.",
};

const globalCss = [
  "body { background: #ffffff; color: #1a2332; }",
  "h1, h2, h3 { color: #1a2332; }",
  "a { color: #9a6b00; }",
  "button { background: #f5b800; color: #1a2332; border: 2px solid #1a2332; font-weight: 600; cursor: pointer; }",
  "button:disabled { opacity: 0.6; cursor: not-allowed; }",
].join(" ");

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <style>{globalCss}</style>
      </head>
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0 }}>
        {children}
        <footer
          style={{
            textAlign: "center",
            padding: 16,
            fontSize: 12,
            color: "#888",
          }}
        >
          Made by Joe Sin
        </footer>
      </body>
    </html>
  );
}
