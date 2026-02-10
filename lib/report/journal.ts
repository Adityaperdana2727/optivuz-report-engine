import type { JournalRegisterEntry, JournalRegisterReport, AuditTrailReport, JournalRow } from "./types";
import { compareDate } from "./utils";
import { traceFromRows } from "./accountingLogic";
import { isBalanced } from "./validations";

export function calcJournalRegister(journals: JournalRow[]): JournalRegisterReport {
  const map = new Map<string, JournalRegisterEntry>();
  for (const r of journals) {
    const key = r.journal_header_id || "(no-header)";
    if (!map.has(key)) {
      map.set(key, {
        journal_header_id: key,
        date: r.transaction_date,
        description: r.description || "",
        lines: [],
        total_debit: 0,
        total_credit: 0,
        is_balanced: true,
        trace: { row_ids: [], header_ids: [key] },
      });
    }
    const entry = map.get(key)!;
    entry.lines.push(r);
    if (!entry.date && r.transaction_date) entry.date = r.transaction_date;
    entry.total_debit += r.debit;
    entry.total_credit += r.credit;
  }

  const entries = Array.from(map.values());
  for (const e of entries) {
    e.is_balanced = isBalanced(e.total_debit, e.total_credit);
    e.trace = traceFromRows(e.lines);
  }

  entries.sort((a, b) => {
    const dc = compareDate(a.date, b.date);
    if (dc !== 0) return dc;
    return a.journal_header_id.localeCompare(b.journal_header_id);
  });

  const totals = entries.reduce(
    (s, e) => {
      s.total_debit += e.total_debit;
      s.total_credit += e.total_credit;
      return s;
    },
    { total_debit: 0, total_credit: 0 }
  );

  const balanced = isBalanced(totals.total_debit, totals.total_credit);

  return {
    raw_rows: journals,
    grouped: { entries },
    totals: { ...totals, entry_count: entries.length },
    validations: { is_balanced: balanced },
  };
}

export function calcAuditTrail(journals: JournalRow[]): AuditTrailReport {
  const register = calcJournalRegister(journals);
  return {
    raw_rows: register.raw_rows,
    grouped: { entries: register.grouped.entries },
    totals: register.totals,
    validations: register.validations,
  };
}
