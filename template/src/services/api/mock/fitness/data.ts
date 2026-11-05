import { addDays, todayString } from '@/utils/dates';

/**
 * In-memory data of the fitness mock routes (members, workouts, sessions).
 * Every record has a `version` that the server increments on each change:
 * clients send the version their change is based on, and a stale version is
 * answered with `409 Conflict`.
 */
export type MockGoal = 'strength' | 'hypertrophy' | 'weightLoss' | 'endurance';

export interface MockExercise {
  name: string;
  sets: number;
  reps: number;
  weightKg: number;
}

export interface MockMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  goal: MockGoal;
  notes: string;
  version: number;
}

export interface MockWorkout {
  id: string;
  memberId: string;
  name: string;
  notes: string;
  exercises: MockExercise[];
  version: number;
}

export interface MockSession {
  id: string;
  memberId: string;
  workoutId: string | null;
  workoutName: string;
  date: string;
  durationMinutes: number;
  exercises: MockExercise[];
  version: number;
}

/**
 * Saving a member whose notes contain this tag makes the mock behave as if
 * another device had edited the member first (once per member): the request
 * gets `409 Conflict`, so the conflict screen can be tried without a backend.
 */
export const MOCK_CONFLICT_TAG = '#conflict';

export const fitnessMockConfig = {
  /** When true, every fitness route answers `503` (to try failed syncs). */
  outage: false,
};

const exercise = (
  name: string,
  sets: number,
  reps: number,
  weightKg: number,
): MockExercise => ({ name, sets, reps, weightKg });

function seedMembers(): MockMember[] {
  return [
    {
      id: 'm1',
      name: 'Lucas Pereira',
      email: 'lucas@example.com',
      phone: '+55 11 91234-5678',
      goal: 'hypertrophy',
      notes: 'Prefers training in the morning.',
      version: 1,
    },
    {
      id: 'm2',
      name: 'Mariana Costa',
      email: 'mariana@example.com',
      phone: '+55 21 99876-5432',
      goal: 'weightLoss',
      notes: '',
      version: 1,
    },
    {
      id: 'm3',
      name: 'Rafael Gomes',
      email: 'rafael@example.com',
      phone: '',
      goal: 'strength',
      notes: 'Old shoulder injury: avoid overhead work.',
      version: 1,
    },
    {
      id: 'm4',
      name: 'Beatriz Alves',
      email: 'beatriz@example.com',
      phone: '',
      goal: 'endurance',
      notes: '',
      version: 1,
    },
  ];
}

function seedWorkouts(): MockWorkout[] {
  return [
    {
      id: 'w1',
      memberId: 'm1',
      name: 'Upper body A',
      notes: '90 s rest between sets.',
      exercises: [
        exercise('Bench press', 4, 8, 62.5),
        exercise('Barbell row', 4, 8, 55),
        exercise('Overhead press', 3, 10, 32.5),
      ],
      version: 1,
    },
    {
      id: 'w2',
      memberId: 'm1',
      name: 'Lower body B',
      notes: '',
      exercises: [
        exercise('Squat', 4, 8, 90),
        exercise('Romanian deadlift', 3, 10, 70),
        exercise('Leg press', 3, 12, 140),
      ],
      version: 1,
    },
    {
      id: 'w3',
      memberId: 'm2',
      name: 'Full body circuit',
      notes: 'Three rounds, minimal rest.',
      exercises: [
        exercise('Goblet squat', 3, 15, 16),
        exercise('Push-up', 3, 12, 0),
        exercise('Kettlebell swing', 3, 15, 12),
      ],
      version: 1,
    },
    {
      id: 'w4',
      memberId: 'm3',
      name: 'Strength 5x5',
      notes: '',
      exercises: [
        exercise('Squat', 5, 5, 110),
        exercise('Bench press', 5, 5, 85),
        exercise('Deadlift', 1, 5, 140),
      ],
      version: 1,
    },
  ];
}

/** Sessions of the last weeks, with loads that go up over time (for the charts). */
function seedSessions(workouts: MockWorkout[]): MockSession[] {
  const today = todayString();
  const plan: { memberId: string; daysAgo: number[] }[] = [
    {
      memberId: 'm1',
      daysAgo: [53, 50, 46, 43, 39, 36, 32, 29, 25, 22, 18, 15, 11, 8, 4, 1],
    },
    { memberId: 'm2', daysAgo: [26, 19, 12, 9, 5, 2] },
    { memberId: 'm3', daysAgo: [20, 13, 6] },
  ];
  const sessions: MockSession[] = [];
  for (const { memberId, daysAgo } of plan) {
    const memberWorkouts = workouts.filter(w => w.memberId === memberId);
    daysAgo.forEach((ago, index) => {
      const workout = memberWorkouts[index % memberWorkouts.length];
      if (!workout) {
        return;
      }
      // Each round of the member's workouts is 2.5 kg heavier, up to today's plan.
      const rounds = Math.ceil(daysAgo.length / memberWorkouts.length);
      const round = Math.floor(index / memberWorkouts.length);
      const lighterBy = (rounds - 1 - round) * 2.5;
      sessions.push({
        id: `s-${memberId}-${index + 1}`,
        memberId,
        workoutId: workout.id,
        workoutName: workout.name,
        date: addDays(today, -ago),
        durationMinutes: 50 + ((index * 7) % 25),
        exercises: workout.exercises.map(item => ({
          ...item,
          weightKg:
            item.weightKg > 0 ? Math.max(item.weightKg - lighterBy, 0) : 0,
        })),
        version: 1,
      });
    });
  }
  return sessions;
}

function seed() {
  const workouts = seedWorkouts();
  return {
    members: seedMembers(),
    workouts,
    sessions: seedSessions(workouts),
    /** Members that already returned the simulated `#conflict` (one-shot). */
    conflictsServed: new Set<string>(),
  };
}

export const fitnessDb = seed();

export function resetFitnessData(): void {
  Object.assign(fitnessDb, seed());
  fitnessMockConfig.outage = false;
}
