import type { JournalRow, TrialBalanceReport, TrialBalanceRow } from "./types";
import { addDays } from "./utils";
import { filterAsOf, filterByPeriod } from "./accounting";
import { accountFromRow, balanceFromRows, normalSideForType, splitDebitCredit, traceFromRows, mergeTraces } from "./accountingLogic";
import { isBalanced } from "./validations";

export function calcTrialBalance(journals: JournalRow[], periodFrom: string | null, periodTo: string | null): TrialBalanceReport {
  const current = filterByPeriod(journals, periodFrom, periodTo);
  const openingRows = periodFrom ? filterAsOf(journals, addDays(periodFrom, -1)) : [];

  const map = new Map<string, TrialBalanceRow>();

  for (const r of journals) {
    const key = r.account_id || "(unknown)";
    if (!map.has(key)) {
      map.set(key, {
        account: accountFromRow(r),
        opening_balance: 0,
        debit: 0,
        credit: 0,
        closing_balance: 0,
        closing_debit: 0,
        closing_credit: 0,
        journal_lines: 0,
        trace: { row_ids: [], header_ids: [] },
      });
    }
  }

  const openingByAccount = indexRows(openingRows);
  for (const [key, rows] of openingByAccount.entries()) {
    const acc = map.get(key);
    if (!acc) continue;
    acc.opening_balance = balanceFromRows(rows, acc.account.account_type);
  }

  const currentByAccount = indexRows(current);
  for (const [key, rows] of currentByAccount.entries()) {
    const acc = map.get(key);
    if (!acc) continue;
    for (const r of rows) {
      acc.debit += r.debit;
      acc.credit += r.credit;
      acc.journal_lines += 1;
    }
    const normal = normalSideForType(acc.account.account_type);
    const movement = normal === "debit" ? (acc.debit - acc.credit) : (acc.credit - acc.debit);
    acc.closing_balance = acc.opening_balance + movement;
    const closingSplit = splitDebitCredit(acc.closing_balance, normal);
    acc.closing_debit = closingSplit.debit;
    acc.closing_credit = closingSplit.credit;
    acc.trace = mergeTraces([acc.trace, traceFromRows(rows)]);
  }

  const rows = Array.from(map.values()).sort((a, b) => a.account.account_name.localeCompare(b.account.account_name));
  const totals = rows.reduce(
    (s, r) => {
      s.opening_balance += r.opening_balance;
      s.debit += r.debit;
      s.credit += r.credit;
      s.closing_balance += r.closing_balance;
      s.closing_debit += r.closing_debit;
      s.closing_credit += r.closing_credit;
      return s;
    },
    { opening_balance: 0, debit: 0, credit: 0, closing_balance: 0, closing_debit: 0, closing_credit: 0 }
  );

  const balanced = isBalanced(totals.closing_debit, totals.closing_credit);

  return { raw_rows: current, grouped: { rows }, totals, validations: { is_balanced: balanced } };
}

function indexRows(rows: JournalRow[]): Map<string, JournalRow[]> {
  const map = new Map<string, JournalRow[]>();
  for (const r of rows) {
    const key = r.account_id || "(unknown)";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  }
  return map;
}
