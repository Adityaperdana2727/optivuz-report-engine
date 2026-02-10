import type { JournalRow, PnLGroup, ProfitLossReport, PnLCategoryGroup, PnLRow } from "./types";
import { accountFromRow, mergeTraces, traceFromRows } from "./accountingLogic";

export function calcProfitLoss(journals: JournalRow[]): ProfitLossReport {
  const incomeGroup: PnLGroup = { type: "income", total: 0, categories: [], trace: { row_ids: [], header_ids: [] } };
  const expenseGroup: PnLGroup = { type: "expense", total: 0, categories: [], trace: { row_ids: [], header_ids: [] } };

  const categoryMap = new Map<string, { type: "income" | "expense"; category: string; amount: number; accounts: Map<string, PnLRow>; trace: ReturnType<typeof traceFromRows> }>();

  let income = 0;
  let expense = 0;

  for (const r of journals) {
    const t = String(r.account_type || "").toLowerCase();
    if (t !== "income" && t !== "expense") continue;

    const net = t === "income" ? (r.credit - r.debit) : (r.debit - r.credit);
    const catKey = r.account_category || "(Uncategorized)";
    const mapKey = `${t}|${catKey}`;

    if (!categoryMap.has(mapKey)) {
      categoryMap.set(mapKey, {
        type: t,
        category: catKey,
        amount: 0,
        accounts: new Map(),
        trace: { row_ids: [], header_ids: [] },
      });
    }

    const cat = categoryMap.get(mapKey)!;
    cat.amount += net;
    cat.trace = mergeTraces([cat.trace, traceFromRows([r])]);

    const accKey = r.account_id || "(unknown)";
    if (!cat.accounts.has(accKey)) {
      cat.accounts.set(accKey, {
        account: accountFromRow(r),
        amount: 0,
        trace: { row_ids: [], header_ids: [] },
      });
    }
    const acc = cat.accounts.get(accKey)!;
    acc.amount += net;
    acc.trace = mergeTraces([acc.trace, traceFromRows([r])]);

    if (t === "income") income += net;
    if (t === "expense") expense += net;
  }

  const byType: Record<"income" | "expense", PnLCategoryGroup[]> = { income: [], expense: [] };
  for (const cat of categoryMap.values()) {
    byType[cat.type].push({
      category: cat.category,
      amount: cat.amount,
      accounts: Array.from(cat.accounts.values()).sort((a, b) => a.account.account_name.localeCompare(b.account.account_name)),
      trace: cat.trace,
    });
  }

  for (const t of ["income", "expense"] as const) {
    const categories = byType[t].sort((a, b) => a.category.localeCompare(b.category));
    const group = t === "income" ? incomeGroup : expenseGroup;
    group.categories = categories;
    group.total = categories.reduce((s, x) => s + x.amount, 0);
    group.trace = mergeTraces(categories.map((c) => c.trace));
  }

  const netProfit = income - expense;

  return {
    raw_rows: journals,
    grouped: { income: incomeGroup, expense: expenseGroup },
    totals: { income, expense, net_profit: netProfit },
    validations: { is_balanced: Math.abs((income - expense) - netProfit) < 0.0001 },
  };
}
