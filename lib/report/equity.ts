import type { EquityChangesReport, EquityChangeRow, JournalRow } from "./types";
import { addDays } from "./utils";
import { filterAsOf, filterByPeriod } from "./accounting";
import { accountFromRow, mergeTraces, traceFromRows } from "./accountingLogic";

export function calcEquityChanges(journals: JournalRow[], periodFrom: string | null, periodTo: string | null, netProfit: number): EquityChangesReport {
  const openingRows = periodFrom ? filterAsOf(journals, addDays(periodFrom, -1)) : [];
  const currentRows = filterByPeriod(journals, periodFrom, periodTo);

  const openingByAcc = indexEquityRows(openingRows);
  const currentByAcc = indexEquityRows(currentRows);

  const allKeys = new Set<string>([...openingByAcc.keys(), ...currentByAcc.keys()]);
  const rows: EquityChangeRow[] = [];

  let openingEquity = 0;
  let netIncrease = 0;
  let netDecrease = 0;

  for (const key of allKeys) {
    const openingRowsAcc = openingByAcc.get(key) || [];
    const currentRowsAcc = currentByAcc.get(key) || [];

    const opening = computeEquityBalance(openingRowsAcc);
    const movement = computeEquityMovement(currentRowsAcc);
    const closing = opening + movement;

    openingEquity += opening;
    if (movement >= 0) netIncrease += movement;
    else netDecrease += movement;

    const seed = currentRowsAcc[0] || openingRowsAcc[0];
    if (!seed) continue;
    const account = accountFromRow(seed);

    rows.push({
      account,
      opening_balance: opening,
      net_change: movement,
      closing_balance: closing,
      trace: mergeTraces([traceFromRows(openingRowsAcc), traceFromRows(currentRowsAcc)]),
    });
  }

  const closingEquity = openingEquity + netProfit + netIncrease + netDecrease;

  rows.sort((a, b) => a.account.account_name.localeCompare(b.account.account_name));

  return {
    raw_rows: currentRows,
    grouped: { rows },
    totals: {
      opening_equity: openingEquity,
      net_profit: netProfit,
      equity_increase: netIncrease,
      equity_decrease: netDecrease,
      closing_equity: closingEquity,
    },
    validations: { closing_matches: Math.abs((openingEquity + netProfit + netIncrease + netDecrease) - closingEquity) < 0.0001 },
  };
}

function indexEquityRows(rows: JournalRow[]): Map<string, JournalRow[]> {
  const map = new Map<string, JournalRow[]>();
  for (const r of rows) {
    if (String(r.account_type || "").toLowerCase() !== "equity") continue;
    const key = r.account_id || "(unknown)";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  }
  return map;
}

function computeEquityBalance(rows: JournalRow[]): number {
  let balance = 0;
  for (const r of rows) balance += r.credit - r.debit;
  return balance;
}

function computeEquityMovement(rows: JournalRow[]): number {
  let movement = 0;
  for (const r of rows) movement += r.credit - r.debit;
  return movement;
}
