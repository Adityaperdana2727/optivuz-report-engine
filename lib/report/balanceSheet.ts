import type { BalanceSheetReport, BalanceSheetRow, JournalRow } from "./types";
import { filterAsOf } from "./accounting";
import { accountFromRow, balanceFromRows, mergeTraces, traceFromRows } from "./accountingLogic";
import { validateBalanceSheet } from "./validations";

export function calcBalanceSheet(journals: JournalRow[], asOfDate: string | null): BalanceSheetReport {
  const rows = filterAsOf(journals, asOfDate);

  const accMap = new Map<string, { row: BalanceSheetRow; raw: JournalRow[] }>();

  for (const r of rows) {
    const id = r.account_id || "(unknown)";
    if (!accMap.has(id)) {
      accMap.set(id, {
        row: {
          account: accountFromRow(r),
          group: "",
          balance: 0,
          source: "account",
          trace: { row_ids: [], header_ids: [] },
        },
        raw: [],
      });
    }
    accMap.get(id)!.raw.push(r);
  }

  const assets: BalanceSheetRow[] = [];
  const liabilities: BalanceSheetRow[] = [];
  const equity: BalanceSheetRow[] = [];

  for (const { row, raw } of accMap.values()) {
    row.balance = balanceFromRows(raw, row.account.account_type);
    row.trace = traceFromRows(raw);

    const t = String(row.account.account_type || "").toLowerCase();
    if (t === "asset") {
      row.group = classifyAssetGroup(row.account.kelompok_neraca, row.account.account_category);
      assets.push(row);
    } else if (t === "liability") {
      row.group = classifyLiabilityGroup(row.account.kelompok_neraca, row.account.account_category);
      liabilities.push(row);
    } else if (t === "equity") {
      row.group = "Equity";
      equity.push(row);
    }
  }

  const retained = calcRetainedEarnings(rows);
  const retainedRow: BalanceSheetRow = {
    account: {
      account_id: "retained_earnings",
      account_name: "Retained Earnings (Auto)",
      account_category: "Equity",
      account_type: "equity",
      kelompok_neraca: "Retained Earnings",
    },
    group: "Equity",
    balance: retained.amount,
    source: "retained_earnings",
    trace: retained.trace,
  };

  if (retained.amount !== 0) {
    equity.push(retainedRow);
  }

  const sum = (arr: BalanceSheetRow[]) => arr.reduce((s, x) => s + (x.balance || 0), 0);

  const assetsCurrent = assets.filter((r) => r.group === "Current Assets");
  const assetsNoncurrent = assets.filter((r) => r.group === "Non-Current Assets");
  const assetsUncat = assets.filter((r) => r.group === "Unclassified Assets");

  const liabShort = liabilities.filter((r) => r.group === "Short-Term Liabilities");
  const liabLong = liabilities.filter((r) => r.group === "Long-Term Liabilities");
  const liabUncat = liabilities.filter((r) => r.group === "Unclassified Liabilities");

  const totalsAssets = sum(assetsCurrent) + sum(assetsNoncurrent) + sum(assetsUncat);
  const totalsLiabilities = sum(liabShort) + sum(liabLong) + sum(liabUncat);
  const totalsEquity = sum(equity);
  const liabilitiesPlusEquity = totalsLiabilities + totalsEquity;
  const validation = validateBalanceSheet(totalsAssets, totalsLiabilities, totalsEquity);

  return {
    raw_rows: rows,
    grouped: {
      assets_current: assetsCurrent,
      assets_noncurrent: assetsNoncurrent,
      assets_uncategorized: assetsUncat,
      liabilities_short: liabShort,
      liabilities_long: liabLong,
      liabilities_uncategorized: liabUncat,
      equity,
    },
    totals: {
      assets: totalsAssets,
      liabilities: totalsLiabilities,
      equity: totalsEquity,
      liabilities_plus_equity: liabilitiesPlusEquity,
      balance_diff: validation.diff,
    },
    validations: { is_balanced: validation.is_balanced },
    retained_earnings: { amount: retained.amount, trace: retained.trace },
  };
}

function classifyAssetGroup(kelompok: string | null, category: string): string {
  const k = String(kelompok || "").toLowerCase();
  const c = String(category || "").toLowerCase();

  if (k.includes("lancar") || c.includes("current")) return "Current Assets";
  if (k.includes("tidak") || k.includes("tetap") || c.includes("non-current") || c.includes("fixed")) return "Non-Current Assets";
  return "Unclassified Assets";
}

function classifyLiabilityGroup(kelompok: string | null, category: string): string {
  const k = String(kelompok || "").toLowerCase();
  const c = String(category || "").toLowerCase();

  if (k.includes("pendek") || k.includes("short") || c.includes("short")) return "Short-Term Liabilities";
  if (k.includes("panjang") || k.includes("long") || c.includes("long")) return "Long-Term Liabilities";
  return "Unclassified Liabilities";
}

function calcRetainedEarnings(rows: JournalRow[]): { amount: number; trace: ReturnType<typeof traceFromRows> } {
  let income = 0;
  let expense = 0;
  const incomeRows: JournalRow[] = [];
  const expenseRows: JournalRow[] = [];

  for (const r of rows) {
    const t = String(r.account_type || "").toLowerCase();
    if (t === "income") {
      income += r.credit - r.debit;
      incomeRows.push(r);
    }
    if (t === "expense") {
      expense += r.debit - r.credit;
      expenseRows.push(r);
    }
  }

  const amount = income - expense;
  const trace = mergeTraces([traceFromRows(incomeRows), traceFromRows(expenseRows)]);
  return { amount, trace };
}
