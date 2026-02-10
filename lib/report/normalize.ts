import type { JournalRow, NormalizedPayload } from "./types";
import { normalizeDate, normalizeKelompok, safeText, toBoolLoose, toNumber } from "./utils";

export function normalizePayload(payload: any): NormalizedPayload {
  let p: any = payload;
  if (typeof p === "string") {
    try { p = JSON.parse(p); } catch { /* ignore */ }
  }

  const company = safeText(p?.company).trim() || "Optivuz Business";
  const logo = safeText(p?.logo).trim() || "";
  const address = safeText(p?.address).trim() || "";
  const contact = safeText(p?.contact).trim() || "";
  const periodFrom = normalizeDate(p?.period?.from);
  const periodTo = normalizeDate(p?.period?.to);

  let rowsValue: unknown = p?.journals;
  if (typeof rowsValue === "string") {
    try {
      const parsed = JSON.parse(rowsValue);
      rowsValue = parsed;
      if (typeof rowsValue === "string") {
        try { rowsValue = JSON.parse(rowsValue); } catch { /* ignore */ }
      }
    } catch { /* ignore */ }
  }
  const rows = Array.isArray(rowsValue) ? rowsValue : [];

  const journals: JournalRow[] = rows.map((r: any) => {
    const debit = toNumber(r.debit);
    const credit = toNumber(r.credit);

    return {
      row_id: safeText(r.row_id),
      journal_header_id: safeText(r.journal_header_id),
      account_id: safeText(r.account_id),
      account_name: safeText(r.account_name),
      account_category: safeText(r.account_category),
      account_type: safeText(r.account_type),
      kelompok_neraca: normalizeKelompok(r.kelompok_neraca),
      is_cash_account: toBoolLoose(r.is_cash_account),
      cashflow_activity: safeText(r.cashflow_activity).trim() || null,
      debit,
      credit,
      amount_raw: toNumber(r.amount_raw),
      currency: safeText(r.currency || "IDR"),
      description: safeText(r.description),
      transaction_date: normalizeDate(r.transaction_date),
      status: safeText(r.status),
    };
  });

  return { company, logo, address, contact, periodFrom, periodTo, journals };
}
