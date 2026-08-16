/**
 * Date/time helpers shared by the calendar screen and event form. All week
 * calculations use the European convention (Monday-first), and all
 * start_at/end_at values are built from local wall-clock parts via the
 * `Date(year, month, day, hour, minute)` constructor + `toISOString()`, so
 * they round-trip correctly through Postgres' timestamptz regardless of the
 * device's timezone (reading them back with `new Date(iso).getHours()` etc.
 * converts back to local time automatically).
 */

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Monday-first weekday index: 0=Monday..6=Sunday. */
export function mondayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

export function startOfWeek(date: Date): Date {
  return addDays(startOfDay(date), -mondayIndex(date));
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** 6x7 grid of dates (Monday-first) covering the month that `date` falls in. */
export function buildMonthGrid(date: Date): Date[] {
  const gridStart = startOfWeek(startOfMonth(date));
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
}

export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date
    .getDate()
    .toString()
    .padStart(2, '0')}`;
}

export function isoDateOf(isoString: string): string {
  return toDateKey(new Date(isoString));
}

export function timeOf(isoString: string): string {
  const d = new Date(isoString);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

export function minutesFromMidnight(isoString: string): number {
  const d = new Date(isoString);
  return d.getHours() * 60 + d.getMinutes();
}

function parseDateKey(dateIso: string): { year: number; month: number; day: number } {
  const [year, month, day] = dateIso.split('-').map(Number);
  return { year, month: month - 1, day };
}

export function buildDateTime(dateIso: string, time: string): string {
  const { year, month, day } = parseDateKey(dateIso);
  const [hour, minute] = time.split(':').map(Number);
  return new Date(year, month, day, hour, minute, 0, 0).toISOString();
}

export function buildAllDayStart(dateIso: string): string {
  const { year, month, day } = parseDateKey(dateIso);
  return new Date(year, month, day, 0, 0, 0, 0).toISOString();
}

export function buildAllDayEnd(dateIso: string): string {
  const { year, month, day } = parseDateKey(dateIso);
  return new Date(year, month, day, 23, 59, 59, 999).toISOString();
}
