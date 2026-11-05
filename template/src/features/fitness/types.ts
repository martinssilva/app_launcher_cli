import type { ApiErrorData } from '@/services/api/errors';

export const MEMBER_GOALS = [
  'strength',
  'hypertrophy',
  'weightLoss',
  'endurance',
] as const;

export type MemberGoal = (typeof MEMBER_GOALS)[number];

/**
 * Every record carries the server `version` it is based on. Records created
 * on this device and not synced yet have version `0`.
 */
export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  goal: MemberGoal;
  notes: string;
  version: number;
}

export interface Exercise {
  name: string;
  sets: number;
  reps: number;
  weightKg: number;
}

/** A workout plan of a member. */
export interface Workout {
  id: string;
  memberId: string;
  name: string;
  notes: string;
  exercises: Exercise[];
  version: number;
}

/** A training session a member attended (check-in + loads used). */
export interface TrainingSession {
  id: string;
  memberId: string;
  workoutId: string | null;
  workoutName: string;
  /** `YYYY-MM-DD` (local date). */
  date: string;
  durationMinutes: number;
  exercises: Exercise[];
  version: number;
}

export type MemberInput = Omit<Member, 'id' | 'version'>;
export type WorkoutInput = Omit<Workout, 'id' | 'version'>;
export type SessionInput = Omit<TrainingSession, 'id' | 'version'>;

/** Collections of the offline store; also the API paths (`/members`...). */
export interface FitnessEntities {
  members: Member;
  workouts: Workout;
  sessions: TrainingSession;
}

export type EntityType = keyof FitnessEntities;

export type MutationAction = 'create' | 'update' | 'delete';

/**
 * Why the server did not accept a queued change:
 * - `changed`: someone else changed the record first (`409`);
 * - `deleted`: the record no longer exists on the server (`404`);
 * - `rejected`: any other client error (`400`, `403`, `422`...).
 */
export type ConflictKind = 'changed' | 'deleted' | 'rejected';

export interface SyncConflict<E extends EntityType = EntityType> {
  kind: ConflictKind;
  error: ApiErrorData;
  /** The server's current record, when it could be read. */
  server: FitnessEntities[E] | null;
}

type QueuedMutationOf<E extends EntityType> = {
  /** Client id of the change, sent as the `Idempotency-Key` header. */
  id: string;
  entity: E;
  action: MutationAction;
  entityId: string;
  /** The whole record after the change (create/update). */
  data?: FitnessEntities[E];
  /** Server version the change is based on (`version` sent to the API). */
  baseVersion: number;
  queuedAt: string;
  /** Human-readable name of the record (shown in the sync screen). */
  label: string;
  conflict?: SyncConflict<E>;
};

/** A local change waiting to be sent to the API, in order. */
export type QueuedMutation = {
  [E in EntityType]: QueuedMutationOf<E>;
}[EntityType];
