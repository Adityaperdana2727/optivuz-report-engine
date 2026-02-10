/**
 * In-memory store (per userId) — sama konsep seperti generator XLSX kamu sebelumnya.
 * NOTE: di serverless, instance bisa restart => data hilang.
 * Untuk production robust: ganti dengan Vercel KV / Supabase / S3.
 */
export const REPORT_STORE: Record<string, any> = Object.create(null);

/** TTL default 2 jam */
export const DEFAULT_TTL_MS = 2 * 60 * 60 * 1000;

export function setReport(userId: string, payload: any): void {
  REPORT_STORE[userId] = {
    ...payload,
    createdAt: Date.now(),
  };
}

export function getReport(userId: string): any | null {
  const item = REPORT_STORE[userId];
  if (!item) return null;
  const ttl = item.ttlMs ?? DEFAULT_TTL_MS;
  if (Date.now() - item.createdAt > ttl) {
    delete REPORT_STORE[userId];
    return null;
  }
  return item;
}
