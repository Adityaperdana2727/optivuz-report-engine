import { addDays } from "./utils";

export type PeriodRange = { from: string | null; to: string | null };

export function derivePreviousPeriod(from: string | null, to: string | null): PeriodRange | null {
  if (!from || !to) return null;
  if (to < from) return null;

  const prevTo = addDays(from, -1);
  const days = dayDiffInclusive(from, to);
  const prevFrom = addDays(prevTo, -(days - 1));

  return { from: prevFrom, to: prevTo };
}

export function dayDiffInclusive(from: string, to: string): number {
  const [y1, m1, d1] = from.split("-").map(Number);
  const [y2, m2, d2] = to.split("-").map(Number);
  const a = Date.UTC(y1, (m1 || 1) - 1, d1 || 1);
  const b = Date.UTC(y2, (m2 || 1) - 1, d2 || 1);
  const diff = Math.floor((b - a) / (24 * 3600 * 1000));
  return diff + 1;
}
