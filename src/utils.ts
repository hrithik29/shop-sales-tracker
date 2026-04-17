import { LOCALE, CURRENCY_SYMBOL } from './config';

export function fmt(n: number): string {
  return CURRENCY_SYMBOL + Math.round(n).toLocaleString(LOCALE);
}

export function todayKey(): string {
  const d = new Date();
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
}

export function prettyDate(k: string): string {
  const [y, m, d] = k.split('-');
  return new Date(+y, +m - 1, +d).toLocaleDateString(LOCALE, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
