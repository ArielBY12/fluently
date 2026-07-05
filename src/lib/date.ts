/** Small date helpers working in whole local days (YYYY-MM-DD strings). */

/** Local calendar day as "YYYY-MM-DD". */
export function todayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Add `days` to a YYYY-MM-DD key and return a new key. */
export function addDays(key: string, days: number): string {
  const d = new Date(key + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return todayKey(d);
}

/** Whole-day difference b - a (both YYYY-MM-DD). */
export function dayDiff(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00').getTime();
  const db = new Date(b + 'T00:00:00').getTime();
  return Math.round((db - da) / 86400000);
}
