import type { TFunction } from 'i18next';

/**
 * Number formatting for prices and market data. `Intl.NumberFormat` is slow
 * to create on Hermes, so formatters are cached per locale and options.
 */
const formatters = new Map<string, Intl.NumberFormat>();

function formatter(locale: string, options: Intl.NumberFormatOptions) {
  const key = `${locale}|${JSON.stringify(options)}`;
  let instance = formatters.get(key);
  if (!instance) {
    instance = new Intl.NumberFormat(locale, options);
    formatters.set(key, instance);
  }
  return instance;
}

/** Fraction digits for a price: 4 below 1 (e.g. 0.1642), 2 otherwise. */
export function priceDigits(value: number): number {
  return value !== 0 && Math.abs(value) < 1 ? 4 : 2;
}

/** `$1,234.56` (en) / `US$ 1.234,56` (pt-BR). */
export function formatPrice(value: number, currency: string, locale: string) {
  const digits = priceDigits(value);
  return formatter(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

function sign(value: number) {
  return value > 0 ? '+' : '';
}

/** `+$1.25` / `-$0.40` */
export function formatPriceChange(
  value: number,
  currency: string,
  locale: string,
) {
  return `${sign(value)}${formatPrice(value, currency, locale)}`;
}

/** `+1.23%` / `-0.40%` */
export function formatPercent(value: number, locale: string) {
  const number = formatter(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  return `${sign(value)}${number}%`;
}

/** `1.23B` (en) / `1,23 bi` (pt-BR): suffixes come from the translations. */
export function formatCompact(value: number, locale: string, t: TFunction) {
  const units = [
    { size: 1e12, key: 'numbers.trillion' },
    { size: 1e9, key: 'numbers.billion' },
    { size: 1e6, key: 'numbers.million' },
    { size: 1e3, key: 'numbers.thousand' },
  ] as const;
  const number = (n: number) =>
    formatter(locale, { maximumFractionDigits: 2 }).format(n);
  const unit = units.find(({ size }) => Math.abs(value) >= size);
  return unit
    ? t(unit.key, { value: number(value / unit.size) })
    : number(value);
}
