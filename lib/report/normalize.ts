import type { JournalRow, NormalizedPayload } from "./types";
import { normalizeDate, normalizeKelompok, safeText, toBoolLoose, toNumber } from "./utils";

function tryParseJSON(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const raw = value.trim();
  if (!raw) return value;
  try { return JSON.parse(raw); } catch { /* ignore */ }
  if (raw.includes("%7B") || raw.includes("%5B")) {
    try { return JSON.parse(decodeURIComponent(raw)); } catch { /* ignore */ }
  }
  return value;
}

export function normalizePayload(payload: any): NormalizedPayload {
  let p: any = tryParseJSON(payload);

  const company = safeText(p?.company).trim() || "Optivuz Business";
  const logo = safeText(p?.logo).trim() || "";
  const address = safeText(p?.address).trim() || "";
  const contact = safeText(p?.contact).trim() || "";
  const periodFrom = normalizeDate(p?.period?.from);
  const periodTo = normalizeDate(p?.period?.to);

  let rowsValue: unknown = tryParseJSON(p?.journals);
  if (typeof rowsValue === "string") {
    rowsValue = tryParseJSON(rowsValue);
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
      posted_by: safeText(r.posted_by),
    };
  });

  return { company, logo, address, contact, periodFrom, periodTo, journals };
}
