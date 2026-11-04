/**
 * Calendar dates are exchanged as `YYYY-MM-DD` strings in the device's local
 * time zone, which avoids UTC shifts for all-day values (events, due dates).
 */
export function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateString(value: string): Date {
  const [year = 1970, month = 1, day = 1] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function todayString(): string {
  return toDateString(new Date());
}

export function addDays(value: string, days: number): string {
  const date = parseDateString(value);
  date.setDate(date.getDate() + days);
  return toDateString(date);
}

export function isValidDateString(value: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    toDateString(parseDateString(value)) === value
  );
}

/** First and last day of the month that contains `value`. */
export function monthRange(value: string): { from: string; to: string } {
  const date = parseDateString(value);
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return { from: toDateString(first), to: toDateString(last) };
}

export function formatDate(
  value: string,
  locale: string,
  options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  },
): string {
  return parseDateString(value).toLocaleDateString(locale, options);
}
