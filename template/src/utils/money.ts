/**
 * Prices travel as integer amounts in cents, which avoids floating-point
 * rounding in totals. Change `CURRENCY` to the currency of your store.
 */
export const CURRENCY = 'USD';

export function formatMoney(
  cents: number,
  locale: string,
  currency: string = CURRENCY,
): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(
    cents / 100,
  );
}
