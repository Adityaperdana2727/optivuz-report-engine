import type { CashflowActivityRow, CashflowReport, JournalRow } from "./types";
import { mergeTraces, traceFromRows } from "./accountingLogic";
import { validateCashflow } from "./validations";

export function calcCashflowDirect(journals: JournalRow[]): CashflowReport {
  const cashRows = journals.filter((r) => r.is_cash_account);

  const operating = new Map<string, CashflowActivityRow>();
  const investing = new Map<string, CashflowActivityRow>();
  const financing = new Map<string, CashflowActivityRow>();
  const uncategorized = new Map<string, CashflowActivityRow>();

  let netChange = 0;

  for (const r of cashRows) {
    const delta = r.debit - r.credit;
    netChange += delta;

    const activity = normalizeActivity(r.cashflow_activity);
    const target = pickBucket(activity, { operating, investing, financing, uncategorized });
    if (!target.has(activity)) target.set(activity, { activity, amount: 0, trace: { row_ids: [], header_ids: [] } });
    const row = target.get(activity)!;
    row.amount += delta;
    row.trace = mergeTraces([row.trace, traceFromRows([r])]);
  }

  const toList = (m: Map<string, CashflowActivityRow>) =>
    Array.from(m.values()).sort((a, b) => a.activity.localeCompare(b.activity));

  const operatingList = toList(operating);
  const investingList = toList(investing);
  const financingList = toList(financing);
  const uncategorizedList = toList(uncategorized);

  const sum = (arr: CashflowActivityRow[]) => arr.reduce((s, x) => s + (x.amount || 0), 0);
  const totals = {
    net_change: netChange,
    operating: sum(operatingList),
    investing: sum(investingList),
    financing: sum(financingList),
    uncategorized: sum(uncategorizedList),
  };

  const validation = validateCashflow(totals.net_change, totals.operating + totals.investing + totals.financing + totals.uncategorized);

  return {
    raw_rows: cashRows,
    grouped: {
      operating: operatingList,
      investing: investingList,
      financing: financingList,
      uncategorized: uncategorizedList,
    },
    totals,
    validations: { net_matches: validation.net_matches },
  };
}

function normalizeActivity(activity: string | null): string {
  const a = String(activity || "").trim();
  if (!a) return "Uncategorized";
  return a;
}

function pickBucket(
  activity: string,
  buckets: {
    operating: Map<string, CashflowActivityRow>;
    investing: Map<string, CashflowActivityRow>;
    financing: Map<string, CashflowActivityRow>;
    uncategorized: Map<string, CashflowActivityRow>;
  }
): Map<string, CashflowActivityRow> {
  const a = activity.toLowerCase();
  if (a.includes("operat")) return buckets.operating;
  if (a.includes("invest")) return buckets.investing;
  if (a.includes("financ") || a.includes("fund")) return buckets.financing;
  if (a === "uncategorized" || a === "unknown") return buckets.uncategorized;
  return buckets.uncategorized;
}
