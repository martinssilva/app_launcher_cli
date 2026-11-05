import { addDays, monthRange, todayString } from '@/utils/dates';

import type { TrainingSession } from './types';

export interface ProgressPoint {
  /** `YYYY-MM-DD`. */
  date: string;
  value: number;
}

export interface AttendanceSummary {
  thisMonth: number;
  last30Days: number;
  total: number;
}

/** Number of distinct days with sessions (two sessions on a day = one visit). */
function countDays(sessions: TrainingSession[], from: string, to: string) {
  return new Set(
    sessions
      .filter(session => session.date >= from && session.date <= to)
      .map(session => session.date),
  ).size;
}

export function summarizeAttendance(
  sessions: TrainingSession[],
  today = todayString(),
): AttendanceSummary {
  const month = monthRange(today);
  return {
    thisMonth: countDays(sessions, month.from, month.to),
    last30Days: countDays(sessions, addDays(today, -29), today),
    total: countDays(sessions, '0000-00-00', '9999-12-31'),
  };
}

/** Exercises found in the sessions, most frequent first. */
export function exerciseNames(sessions: TrainingSession[]): string[] {
  const counts = new Map<string, number>();
  for (const session of sessions) {
    for (const { name } of session.exercises) {
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([name]) => name);
}

/** Heaviest load of an exercise per day, oldest first. */
export function loadSeries(
  sessions: TrainingSession[],
  exercise: string,
): ProgressPoint[] {
  const byDate = new Map<string, number>();
  for (const session of sessions) {
    for (const entry of session.exercises) {
      if (entry.name === exercise) {
        byDate.set(
          session.date,
          Math.max(byDate.get(session.date) ?? 0, entry.weightKg),
        );
      }
    }
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, value }));
}
