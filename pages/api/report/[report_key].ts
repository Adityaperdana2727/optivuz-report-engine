import type { NextApiRequest, NextApiResponse } from "next";
import { getSupabaseServerClient } from "../../../lib/supabaseServer";
import { buildAllReportModels } from "../../../lib/report";
import { renderTabbedHTML } from "../../../lib/html";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).send("Method not allowed");

  const reportKey = String(req.query.report_key || "").trim();
  if (!reportKey) return res.status(400).send("report_key required");

  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("reports")
      .select("payload, company_name, period_from, period_to")
      .eq("report_key", reportKey)
      .single();

    if (error || !data) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.status(404).send(`<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Report not found</title>
<style>body{font-family:Source Sans 3,system-ui,Segoe UI,Arial,sans-serif;margin:24px;color:#0f172a} .muted{color:#64748b}</style>
</head>
<body>
  <h2>Report belum tersedia</h2>
  <p class="muted">Generate report dulu dari aplikasi, lalu buka ulang URL ini.</p>
</body></html>`);
    }

    const payload = data.payload || {};
    const report = buildAllReportModels(payload);
    const html = renderTabbedHTML(report);

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(html);
  } catch (err: any) {
    return res.status(400).send(String(err?.message || err));
  }
}
