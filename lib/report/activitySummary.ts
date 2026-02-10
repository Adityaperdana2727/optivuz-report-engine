import type { ActivitySummary, JournalRow } from "./types";

export function calcAccountActivitySummary(journals: JournalRow[]): ActivitySummary {
  const uniqueAccounts = new Set<string>();
  const byType = new Map<string, { type: string; debit: number; credit: number; lines: number }>();
  const byCategory = new Map<string, { category: string; debit: number; credit: number; lines: number; sample_type: string }>();
  const topLines: (JournalRow & { magnitude: number })[] = [];

  for (const r of journals) {
    uniqueAccounts.add(r.account_id || "(unknown)");

    const t = r.account_type || "(unknown)";
    if (!byType.has(t)) byType.set(t, { type: t, debit: 0, credit: 0, lines: 0 });
    const bt = byType.get(t)!;
    bt.debit += r.debit;
    bt.credit += r.credit;
    bt.lines += 1;

    const c = r.account_category || "(Uncategorized)";
    if (!byCategory.has(c)) byCategory.set(c, { category: c, debit: 0, credit: 0, lines: 0, sample_type: t });
    const bc = byCategory.get(c)!;
    bc.debit += r.debit;
    bc.credit += r.credit;
    bc.lines += 1;

    const magnitude = Math.max(r.debit, r.credit);
    topLines.push({ magnitude, ...r });
  }

  topLines.sort((a, b) => b.magnitude - a.magnitude);
  const top10 = topLines.slice(0, 10);

  return {
    unique_accounts: uniqueAccounts.size,
    by_type: Array.from(byType.values()).sort((a, b) => a.type.localeCompare(b.type)),
    by_category: Array.from(byCategory.values()).sort((a, b) => a.category.localeCompare(b.category)),
    top10_lines: top10,
  };
}
