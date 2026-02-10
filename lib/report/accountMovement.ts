import type { AccountMovementReport, AccountMovementRow, JournalRow } from "./types";
import { addDays } from "./utils";
import { filterAsOf, filterByPeriod } from "./accounting";
import { accountFromRow, balanceFromRows, mergeTraces, normalSideForType, traceFromRows } from "./accountingLogic";
import { isBalanced } from "./validations";

export function calcAccountMovementSummary(journals: JournalRow[], periodFrom: string | null, periodTo: string | null): AccountMovementReport {
  const current = filterByPeriod(journals, periodFrom, periodTo);
  const openingRows = periodFrom ? filterAsOf(journals, addDays(periodFrom, -1)) : [];

  const map = new Map<string, AccountMovementRow>();
  for (const r of journals) {
    const key = r.account_id || "(unknown)";
    if (!map.has(key)) {
      map.set(key, {
        account: accountFromRow(r),
        opening_balance: 0,
        debit: 0,
        credit: 0,
        net_movement: 0,
        closing_balance: 0,
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
    acc.net_movement = normal === "debit" ? (acc.debit - acc.credit) : (acc.credit - acc.debit);
    acc.closing_balance = acc.opening_balance + acc.net_movement;
    acc.trace = mergeTraces([acc.trace, traceFromRows(rows)]);
  }

  const rows = Array.from(map.values()).sort((a, b) => a.account.account_name.localeCompare(b.account.account_name));
  const totals = rows.reduce(
    (s, r) => {
      s.opening_balance += r.opening_balance;
      s.debit += r.debit;
      s.credit += r.credit;
      s.closing_balance += r.closing_balance;
      return s;
    },
    { opening_balance: 0, debit: 0, credit: 0, closing_balance: 0 }
  );

  const balanced = isBalanced(totals.debit, totals.credit);

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
