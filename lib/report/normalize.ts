import type { JournalRow, NormalizedPayload } from "./types";
import { normalizeDate, normalizeKelompok, safeText, toBoolLoose, toNumber } from "./utils";

export function normalizePayload(payload: any): NormalizedPayload {
  const company = safeText(payload?.company).trim() || "Optivuz Business";
  const logo = safeText(payload?.logo).trim() || "";
  const address = safeText(payload?.address).trim() || "";
  const contact = safeText(payload?.contact).trim() || "";
  const periodFrom = normalizeDate(payload?.period?.from);
  const periodTo = normalizeDate(payload?.period?.to);

  const rows = Array.isArray(payload?.journals) ? payload.journals : [];

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
