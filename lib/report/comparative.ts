import type {
  ComparativeBalanceSheetReport,
  ComparativeProfitLossReport,
  ComparativeRow,
  ComparativeSection,
  JournalRow,
} from "./types";
import { variancePct } from "./utils";
import { calcProfitLoss } from "./profitLoss";
import { calcBalanceSheet } from "./balanceSheet";

export function calcComparativeProfitLoss(
  currentJournals: JournalRow[],
  previousJournals: JournalRow[],
  currentPeriod: { from: string | null; to: string | null },
  previousPeriod: { from: string | null; to: string | null }
): ComparativeProfitLossReport {
  const current = calcProfitLoss(currentJournals);
  const previous = calcProfitLoss(previousJournals);

  const incomeSection = buildPLSection("Income", current, previous, "income");
  const expenseSection = buildPLSection("Expense", current, previous, "expense");

  const netProfitRow: ComparativeRow = {
    key: "net_profit",
    label: "Net Profit",
    current: current.totals.net_profit,
    previous: previous.totals.net_profit,
    variance: current.totals.net_profit - previous.totals.net_profit,
    variance_pct: variancePct(current.totals.net_profit, previous.totals.net_profit),
  };

  return {
    income: incomeSection,
    expense: expenseSection,
    net_profit: netProfitRow,
    current_period: currentPeriod,
    previous_period: previousPeriod,
  };
}

function buildPLSection(label: string, current: ReturnType<typeof calcProfitLoss>, previous: ReturnType<typeof calcProfitLoss>, type: "income" | "expense"): ComparativeSection {
  const currentGroup = current.grouped[type];
  const previousGroup = previous.grouped[type];

  const catMap = new Map<string, { current: number; previous: number }>();

  for (const c of currentGroup.categories || []) {
    catMap.set(c.category, { current: c.amount, previous: 0 });
  }
  for (const c of previousGroup.categories || []) {
    if (!catMap.has(c.category)) catMap.set(c.category, { current: 0, previous: c.amount });
    else catMap.get(c.category)!.previous = c.amount;
  }

  const rows: ComparativeRow[] = [];
  for (const [key, v] of catMap.entries()) {
    rows.push({
      key,
      label: key,
      current: v.current,
      previous: v.previous,
      variance: v.current - v.previous,
      variance_pct: variancePct(v.current, v.previous),
    });
  }

  rows.sort((a, b) => a.label.localeCompare(b.label));

  const totalCurrent = currentGroup.total || 0;
  const totalPrevious = previousGroup.total || 0;

  return {
    label,
    rows,
    total: {
      key: `${type}_total`,
      label: `Total ${label}`,
      current: totalCurrent,
      previous: totalPrevious,
      variance: totalCurrent - totalPrevious,
      variance_pct: variancePct(totalCurrent, totalPrevious),
    },
  };
}

export function calcComparativeBalanceSheet(
  journals: JournalRow[],
  currentAsOf: string | null,
  previousAsOf: string | null
): ComparativeBalanceSheetReport {
  const current = calcBalanceSheet(journals, currentAsOf);
  const previous = calcBalanceSheet(journals, previousAsOf);

  const assets = buildBSSection("Assets", current, previous, "assets");
  const liabilities = buildBSSection("Liabilities", current, previous, "liabilities");
  const equity = buildBSSection("Equity", current, previous, "equity");

  return {
    assets,
    liabilities,
    equity,
    totals: {
      assets: buildTotalRow("Total Assets", current.totals.assets, previous.totals.assets),
      liabilities: buildTotalRow("Total Liabilities", current.totals.liabilities, previous.totals.liabilities),
      equity: buildTotalRow("Total Equity", current.totals.equity, previous.totals.equity),
      liabilities_plus_equity: buildTotalRow(
        "Liabilities + Equity",
        current.totals.liabilities_plus_equity,
        previous.totals.liabilities_plus_equity
      ),
    },
    current_as_of: currentAsOf,
    previous_as_of: previousAsOf,
  };
}

function buildBSSection(
  label: string,
  current: ReturnType<typeof calcBalanceSheet>,
  previous: ReturnType<typeof calcBalanceSheet>,
  type: "assets" | "liabilities" | "equity"
): ComparativeSection {
  const currentRows = getBSRows(current, type);
  const previousRows = getBSRows(previous, type);

  const map = new Map<string, { current: number; previous: number }>();

  for (const r of currentRows) {
    map.set(r.account.account_name, { current: r.balance, previous: 0 });
  }
  for (const r of previousRows) {
    if (!map.has(r.account.account_name)) map.set(r.account.account_name, { current: 0, previous: r.balance });
    else map.get(r.account.account_name)!.previous = r.balance;
  }

  const rows: ComparativeRow[] = [];
  for (const [key, v] of map.entries()) {
    rows.push({
      key,
      label: key,
      current: v.current,
      previous: v.previous,
      variance: v.current - v.previous,
      variance_pct: variancePct(v.current, v.previous),
    });
  }
  rows.sort((a, b) => a.label.localeCompare(b.label));

  const totalCurrent = sumBS(current, type);
  const totalPrevious = sumBS(previous, type);

  return {
    label,
    rows,
    total: {
      key: `${type}_total`,
      label: `Total ${label}`,
      current: totalCurrent,
      previous: totalPrevious,
      variance: totalCurrent - totalPrevious,
      variance_pct: variancePct(totalCurrent, totalPrevious),
    },
  };
}

function getBSRows(bs: ReturnType<typeof calcBalanceSheet>, type: "assets" | "liabilities" | "equity") {
  if (type === "assets") return [...bs.grouped.assets_current, ...bs.grouped.assets_noncurrent, ...bs.grouped.assets_uncategorized];
  if (type === "liabilities") return [...bs.grouped.liabilities_short, ...bs.grouped.liabilities_long, ...bs.grouped.liabilities_uncategorized];
  return bs.grouped.equity;
}

function sumBS(bs: ReturnType<typeof calcBalanceSheet>, type: "assets" | "liabilities" | "equity") {
  const rows = getBSRows(bs, type);
  return rows.reduce((s, x) => s + (x.balance || 0), 0);
}

function buildTotalRow(label: string, current: number, previous: number): ComparativeRow {
  return {
    key: label,
    label,
    current,
    previous,
    variance: current - previous,
    variance_pct: variancePct(current, previous),
  };
}
