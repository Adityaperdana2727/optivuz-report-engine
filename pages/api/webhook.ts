import type { NextApiRequest, NextApiResponse } from "next";
import { getSupabaseServerClient } from "../../lib/supabaseServer";

export const config = {
  api: { bodyParser: { sizeLimit: "10mb" } }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  try {
    const payload = req.body || {};
    const companyId = String(payload?.company_id || "").trim();
    const companyName = String(payload?.company || "").trim();
    const periodFrom = String(payload?.period?.from || "").trim();
    const periodTo = String(payload?.period?.to || "").trim();

    if (!companyId || !periodFrom || !periodTo) {
      return res.status(400).json({ ok: false, error: "company_id, period.from, period.to are required" });
    }

    const reportKey = `${companyId}|${periodFrom}|${periodTo}`;

    const supabase = getSupabaseServerClient();
    const { error } = await supabase
      .from("reports")
      .upsert({
        company_id: companyId,
        company_name: companyName,
        period_from: periodFrom,
        period_to: periodTo,
        report_key: reportKey,
        payload,
      }, { onConflict: "report_key" });

    if (error) {
      return res.status(500).json({ ok: false, error: error.message });
    }

    return res.status(200).json({
      ok: true,
      report_key: reportKey,
      view_url: `/api/report/${encodeURIComponent(reportKey)}`,
    });
  } catch (err: any) {
    return res.status(400).json({ ok: false, error: String(err?.message || err) });
  }
}
