import type { GeneralLedgerAccount, GeneralLedgerReport, JournalRow, LedgerDayGroup, LedgerEntry } from "./types";
import { filterAsOf, filterByPeriod, sortJournalRows } from "./accounting";
import { accountFromRow, normalSideForType, signedAmount, traceFromRows, mergeTraces } from "./accountingLogic";
import { isBalanced } from "./validations";
import { addDays } from "./utils";

export function calcGeneralLedger(journals: JournalRow[], periodFrom: string | null, periodTo: string | null): GeneralLedgerReport {
  const current = filterByPeriod(journals, periodFrom, periodTo);
  const openingRows = periodFrom ? filterAsOf(journals, addDays(periodFrom, -1)) : [];

  const map = new Map<string, GeneralLedgerAccount>();

  for (const r of journals) {
    const key = r.account_id || "(unknown)";
    if (!map.has(key)) {
      map.set(key, {
        account: accountFromRow(r),
        opening_balance: 0,
        closing_balance: 0,
        total_debit: 0,
        total_credit: 0,
        days: [],
        trace: { row_ids: [], header_ids: [] },
      });
    }
  }

  const openingByAccount = indexRows(openingRows);
  for (const [key, rows] of openingByAccount.entries()) {
    const acc = map.get(key);
    if (!acc) continue;
    acc.opening_balance = rows.reduce((s, r) => s + signedAmount(r), 0);
  }

  const currentByAccount = indexRows(current);
  for (const [key, rows] of currentByAccount.entries()) {
    const acc = map.get(key);
    if (!acc) continue;
    const normal = normalSideForType(acc.account.account_type);
    let running = acc.opening_balance;
    const sorted = sortJournalRows(rows);
    const dayMap = new Map<string | null, LedgerDayGroup>();

    for (const r of sorted) {
      const delta = signedAmount(r);
      running += delta;
      acc.total_debit += r.debit;
      acc.total_credit += r.credit;

      const entry: LedgerEntry = {
        transaction_date: r.transaction_date,
        journal_header_id: r.journal_header_id,
        row_id: r.row_id,
        description: r.description,
        debit: r.debit,
        credit: r.credit,
        balance: running,
        trace: traceFromRows([r]),
      };

      const dayKey = r.transaction_date || null;
      if (!dayMap.has(dayKey)) {
        dayMap.set(dayKey, {
          date: dayKey,
          entries: [],
          day_debit: 0,
          day_credit: 0,
          day_net: 0,
          trace: { row_ids: [], header_ids: [] },
        });
      }
      const day = dayMap.get(dayKey)!;
      day.entries.push(entry);
      day.day_debit += r.debit;
      day.day_credit += r.credit;
      day.day_net += normal === "debit" ? (r.debit - r.credit) : (r.credit - r.debit);
      day.trace = mergeTraces([day.trace, entry.trace]);
    }

    acc.days = Array.from(dayMap.values()).sort((a, b) => {
      const da = a.date || "";
      const db = b.date || "";
      return da.localeCompare(db);
    });
    acc.closing_balance = running;
    acc.trace = mergeTraces(acc.days.map((d) => d.trace));
  }

  const accounts = Array.from(map.values()).sort((a, b) => a.account.account_name.localeCompare(b.account.account_name));
  const totals = accounts.reduce(
    (s, a) => {
      s.total_debit += a.total_debit;
      s.total_credit += a.total_credit;
      return s;
    },
    { total_debit: 0, total_credit: 0 }
  );

  const balanced = isBalanced(totals.total_debit, totals.total_credit);

  return {
    raw_rows: current,
    grouped: { accounts },
    totals,
    validations: { is_balanced: balanced },
  };
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
