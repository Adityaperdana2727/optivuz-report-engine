export function toNumber(v: unknown): number {
  if (v === null || v === undefined || v === "") return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function toBoolLoose(v: unknown): boolean {
  if (v === true) return true;
  if (v === false) return false;
  if (typeof v === "string") return v.trim().toLowerCase() === "true";
  return Boolean(v);
}

export function normalizeKelompok(v: unknown): string | null {
  const s = (v ?? "").toString().trim();
  return s ? s : null;
}

export function normalizeDate(s: unknown): string | null {
  if (!s) return null;
  const str = String(s).trim();
  if (str.length >= 10 && /\d{4}-\d{2}-\d{2}/.test(str.slice(0, 10))) return str.slice(0, 10);
  const match = str.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  const t = Date.parse(str);
  if (!Number.isNaN(t)) {
    const d = new Date(t);
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }
  return null;
}

export function formatIDR(n: number): string {
  const x = Math.round(n || 0);
  return x.toLocaleString("id-ID");
}

export function compareDate(a: string | null, b: string | null): number {
  const da = a || "";
  const db = b || "";
  if (da === db) return 0;
  return da.localeCompare(db);
}

export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, (m || 1) - 1, d || 1));
  dt.setUTCDate(dt.getUTCDate() + days);
  const yyyy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function inRange(date: string | null, from: string | null, to: string | null): boolean {
  if (!date) return false;
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

export function asOf(date: string | null, cutoff: string | null): boolean {
  if (!date || !cutoff) return false;
  return date <= cutoff;
}

export function safeText(v: unknown): string {
  return String(v ?? "");
}

export function sum(arr: number[]): number {
  return arr.reduce((s, x) => s + (x || 0), 0);
}

export function variancePct(current: number, previous: number): number | null {
  if (!previous) return null;
  return (current - previous) / Math.abs(previous);
}
