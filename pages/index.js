export default function Home() {
  return (
    <main style={{ fontFamily: "Inter, system-ui, Segoe UI, Arial, sans-serif", padding: 24, color: "#0f172a" }}>
      <h1 style={{ margin: 0, fontSize: 20 }}>Optivuz Business — Report Engine</h1>
      <p style={{ color: "#64748b", marginTop: 8, lineHeight: 1.5 }}>
        Service ini menerima payload jurnal dari Glide via webhook, lalu menyediakan URL report (HTML) yang bisa dibuka di WebView.
      </p>

      <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, maxWidth: 920 }}>
        <h2 style={{ margin: "0 0 8px", fontSize: 15 }}>Quick test</h2>
        <ol style={{ margin: 0, paddingLeft: 18, color: "#0f172a" }}>
          <li>POST ke <code>/api/webhook?userId=demo</code> dengan body payload JSON</li>
          <li>Buka <code>/api/report?userId=demo</code> di browser</li>
        </ol>
        <p style={{ marginTop: 10, color: "#64748b" }}>
          Health: <a href="/api/health">/api/health</a>
        </p>
      </div>
    </main>
  );
}
