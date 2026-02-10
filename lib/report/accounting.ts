import type { JournalRow } from "./types";
import { asOf, compareDate, inRange } from "./utils";

export function filterByPeriod(journals: JournalRow[], from: string | null, to: string | null): JournalRow[] {
  if (!from && !to) return journals.slice();
  return journals.filter((r) => inRange(r.transaction_date, from, to));
}

export function filterAsOf(journals: JournalRow[], asOfDate: string | null): JournalRow[] {
  if (!asOfDate) return [];
  return journals.filter((r) => asOf(r.transaction_date, asOfDate));
}

export function sortJournalRows(rows: JournalRow[]): JournalRow[] {
  return rows.slice().sort((a, b) => {
    const dc = compareDate(a.transaction_date, b.transaction_date);
    if (dc !== 0) return dc;
    if (a.journal_header_id !== b.journal_header_id) return a.journal_header_id.localeCompare(b.journal_header_id);
    return (a.row_id || "").localeCompare(b.row_id || "");
  });
}
