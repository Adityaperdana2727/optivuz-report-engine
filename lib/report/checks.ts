import type { BasicChecks, JournalRow } from "./types";

export function basicChecks(journals: JournalRow[]): BasicChecks {
  let totalDebit = 0;
  let totalCredit = 0;
  let missingDates = 0;

  for (const r of journals) {
    totalDebit += r.debit;
    totalCredit += r.credit;
    if (!r.transaction_date) missingDates += 1;
  }

  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.0001;

  return { totalDebit, totalCredit, isBalanced, missingDates, rowCount: journals.length };
}
