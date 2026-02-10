import type { Account, JournalRow, TraceRef } from "./types";

export type NormalSide = "debit" | "credit";

export function normalSideForType(accountType: string): NormalSide {
  const t = String(accountType || "").toLowerCase();
  if (t === "asset" || t === "expense") return "debit";
  if (t === "liability" || t === "equity" || t === "income") return "credit";
  return "debit";
}

export function signedAmount(row: JournalRow): number {
  const normal = normalSideForType(row.account_type);
  return normal === "debit" ? (row.debit - row.credit) : (row.credit - row.debit);
}

export function balanceFromRows(rows: JournalRow[], accountType: string): number {
  const normal = normalSideForType(accountType);
  let balance = 0;
  for (const r of rows) {
    balance += normal === "debit" ? (r.debit - r.credit) : (r.credit - r.debit);
  }
  return balance;
}

export function splitDebitCredit(balance: number, normal: NormalSide): { debit: number; credit: number } {
  if (normal === "debit") {
    return balance >= 0 ? { debit: balance, credit: 0 } : { debit: 0, credit: Math.abs(balance) };
  }
  return balance >= 0 ? { debit: 0, credit: balance } : { debit: Math.abs(balance), credit: 0 };
}

export function accountFromRow(row: JournalRow): Account {
  return {
    account_id: row.account_id,
    account_name: row.account_name || "(Unknown Account)",
    account_category: row.account_category || "",
    account_type: row.account_type || "",
    kelompok_neraca: row.kelompok_neraca,
  };
}

export function traceFromRows(rows: JournalRow[]): TraceRef {
  const rowIds = new Set<string>();
  const headerIds = new Set<string>();
  for (const r of rows) {
    if (r.row_id) rowIds.add(r.row_id);
    if (r.journal_header_id) headerIds.add(r.journal_header_id);
  }
  return { row_ids: Array.from(rowIds), header_ids: Array.from(headerIds) };
}

export function mergeTraces(traces: TraceRef[]): TraceRef {
  const rowIds = new Set<string>();
  const headerIds = new Set<string>();
  for (const t of traces) {
    for (const id of t.row_ids) rowIds.add(id);
    for (const id of t.header_ids) headerIds.add(id);
  }
  return { row_ids: Array.from(rowIds), header_ids: Array.from(headerIds) };
}
