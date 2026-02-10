export default function handler(req, res) {
  res.status(200).json({ ok: true, name: "optivuz-report-engine", ts: Date.now() });
}
