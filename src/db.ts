import { get, set, keys } from 'idb-keyval';
import type { Sale, Expense } from './types';

const PREFIX = 'sales:';

export async function loadDay(dateKey: string): Promise<Sale[]> {
  const data = await get<Sale[]>(PREFIX + dateKey);
  return data ?? [];
}

export async function saveDay(dateKey: string, sales: Sale[]): Promise<void> {
  await set(PREFIX + dateKey, sales);
}

export async function listDays(): Promise<string[]> {
  const allKeys = await keys<string>();
  return (allKeys as string[])
    .filter(k => typeof k === 'string' && k.startsWith(PREFIX))
    .map(k => k.slice(PREFIX.length))
    .sort()
    .reverse();
}

export async function loadAllSales(): Promise<{ dateKey: string; sales: Sale[] }[]> {
  const days = await listDays();
  const results = await Promise.all(
    days.map(async d => ({ dateKey: d, sales: await loadDay(d) }))
  );
  return results;
}

const EXP_PREFIX = 'expenses:';

export async function loadExpenses(dateKey: string): Promise<Expense[]> {
  const data = await get<Expense[]>(EXP_PREFIX + dateKey);
  return data ?? [];
}

export async function saveExpenses(dateKey: string, expenses: Expense[]): Promise<void> {
  await set(EXP_PREFIX + dateKey, expenses);
}
