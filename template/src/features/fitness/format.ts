import type { EntityType, FitnessEntities } from './types';

/** `62.5` → `62.5` (en) / `62,5` (pt-BR). */
export function formatNumber(value: number, locale: string): string {
  return value.toLocaleString(locale, { maximumFractionDigits: 1 });
}

/** Parses user input like `62,5` or `62.5`. */
export function parseDecimal(value: string): number {
  return Number(value.trim().replace(',', '.'));
}

/** Name of a record as shown to the user (sync screen, conflicts). */
export function recordLabel<E extends EntityType>(
  entity: E,
  record: FitnessEntities[E],
): string {
  if (entity === 'sessions') {
    const session = record as FitnessEntities['sessions'];
    return `${session.workoutName} · ${session.date}`;
  }
  return (record as { name: string }).name;
}
