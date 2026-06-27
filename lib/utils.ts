import { clsx } from 'clsx';

export function cn(...classes: Array<string | false | undefined>) {
  return clsx(classes);
}

export function toCurrency(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
}
