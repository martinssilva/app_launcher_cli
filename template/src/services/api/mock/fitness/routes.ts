import { isValidDateString } from '@/utils/dates';

import { findSession, type MockUser } from '../db';
import type { MockRequest, MockResponse, MockRoute } from '../handlers';
import {
  fitnessDb,
  fitnessMockConfig,
  MOCK_CONFLICT_TAG,
  type MockExercise,
  type MockGoal,
  type MockMember,
  type MockSession,
  type MockWorkout,
} from './data';

const GOALS: MockGoal[] = [
  'strength',
  'hypertrophy',
  'weightLoss',
  'endurance',
];

const unauthorized: MockResponse = {
  status: 401,
  data: { message: 'Unauthorized' },
};
const unavailable: MockResponse = {
  status: 503,
  data: { message: 'Service unavailable' },
};
const invalid = (message: string): MockResponse => ({
  status: 422,
  data: { message },
});

function sessionUser(request: MockRequest): MockUser | undefined {
  const token = request.authorization?.replace(/^Bearer\s+/i, '');
  return token ? findSession(token)?.user : undefined;
}

/** Only signed-in users; every route fails while the simulated outage is on. */
function guarded(
  handler: (request: MockRequest) => MockResponse,
): (request: MockRequest) => MockResponse {
  return request => {
    if (fitnessMockConfig.outage) {
      return unavailable;
    }
    return sessionUser(request) ? handler(request) : unauthorized;
  };
}

function field(body: unknown, name: string): unknown {
  return typeof body === 'object' && body !== null
    ? (body as Record<string, unknown>)[name]
    : undefined;
}

function text(body: unknown, name: string): string {
  const value = field(body, name);
  return typeof value === 'string' ? value.trim() : '';
}

function readExercises(body: unknown): MockExercise[] | null {
  const value = field(body, 'exercises');
  if (!Array.isArray(value) || value.length === 0) {
    return null;
  }
  const exercises: MockExercise[] = [];
  for (const item of value) {
    const entry = {
      name: text(item, 'name'),
      sets: field(item, 'sets'),
      reps: field(item, 'reps'),
      weightKg: field(item, 'weightKg'),
    };
    if (
      !entry.name ||
      !Number.isInteger(entry.sets) ||
      (entry.sets as number) < 1 ||
      !Number.isInteger(entry.reps) ||
      (entry.reps as number) < 1 ||
      typeof entry.weightKg !== 'number' ||
      entry.weightKg < 0
    ) {
      return null;
    }
    exercises.push(entry as MockExercise);
  }
  return exercises;
}

// --------------------------------------------------------- generic CRUD

interface Versioned {
  id: string;
  version: number;
}

type Reader<T extends Versioned> = (
  body: unknown,
) => Omit<T, 'id' | 'version'> | string;

interface CollectionSpec<T extends Versioned> {
  path: string;
  label: string;
  items: () => T[];
  setItems: (items: T[]) => void;
  /** Validates a request body; returns the record fields or an error message. */
  read: Reader<T>;
  matches?: (item: T, query: Record<string, unknown>) => boolean;
  compare: (a: T, b: T) => number;
  /** Called after a record is deleted (cascades). */
  onDelete?: (item: T) => void;
  /** Hook to simulate a concurrent edit before a PATCH (see MOCK_CONFLICT_TAG). */
  beforeUpdate?: (current: T, body: unknown) => void;
  updatable: boolean;
}

const sameFields = <T extends Versioned>(
  current: T,
  fields: Omit<T, 'id' | 'version'>,
) =>
  JSON.stringify({ ...current, version: 0 }) ===
  JSON.stringify({ ...current, ...fields, version: 0 });

function readVersion(value: unknown): number | undefined {
  const version = typeof value === 'string' ? Number(value) : value;
  return typeof version === 'number' && Number.isFinite(version)
    ? version
    : undefined;
}

function crudRoutes<T extends Versioned>(spec: CollectionSpec<T>): MockRoute[] {
  const notFound: MockResponse = {
    status: 404,
    data: { message: `${spec.label} not found` },
  };
  const find = (id: string | undefined) =>
    spec.items().find(item => item.id === id);

  const routes: MockRoute[] = [
    {
      method: 'GET',
      path: spec.path,
      handler: guarded(({ query }) => ({
        status: 200,
        data: spec
          .items()
          .filter(item => spec.matches?.(item, query) ?? true)
          .sort(spec.compare),
      })),
    },
    {
      method: 'GET',
      path: `${spec.path}/:id`,
      handler: guarded(({ params }) => {
        const item = find(params.id);
        return item ? { status: 200, data: item } : notFound;
      }),
    },
    {
      method: 'POST',
      path: spec.path,
      // Clients may send their own `id` (records created offline). A POST
      // with an existing id is a retry: it answers the stored record.
      handler: guarded(({ body }) => {
        const id = text(body, 'id') || `${spec.path.slice(1)}-${Date.now()}`;
        const existing = find(id);
        if (existing) {
          return { status: 200, data: existing };
        }
        const fields = spec.read(body);
        if (typeof fields === 'string') {
          return invalid(fields);
        }
        const item = { ...fields, id, version: 1 } as T;
        spec.setItems([...spec.items(), item]);
        return { status: 201, data: item };
      }),
    },
    {
      method: 'DELETE',
      path: `${spec.path}/:id`,
      handler: guarded(({ params, query }) => {
        const item = find(params.id);
        if (!item) {
          return notFound;
        }
        const version = readVersion(query.version);
        if (version !== undefined && version !== item.version) {
          return {
            status: 409,
            data: { message: `${spec.label} was changed by someone else` },
          };
        }
        spec.setItems(spec.items().filter(other => other.id !== item.id));
        spec.onDelete?.(item);
        return { status: 204 };
      }),
    },
  ];

  if (spec.updatable) {
    routes.push({
      method: 'PATCH',
      path: `${spec.path}/:id`,
      handler: guarded(({ params, body }) => {
        const current = find(params.id);
        if (!current) {
          return notFound;
        }
        const fields = spec.read(body);
        if (typeof fields === 'string') {
          return invalid(fields);
        }
        spec.beforeUpdate?.(current, body);
        if (readVersion(field(body, 'version')) !== current.version) {
          // A retry of a change that was already applied is not a conflict.
          if (sameFields(current, fields)) {
            return { status: 200, data: current };
          }
          return {
            status: 409,
            data: { message: `${spec.label} was changed by someone else` },
          };
        }
        // Mutated in place: the mock adapter serializes every response.
        Object.assign(current, fields, { version: current.version + 1 });
        return { status: 200, data: current };
      }),
    });
  }
  return routes;
}

// ------------------------------------------------------------ readers

const readMember: Reader<MockMember> = body => {
  const member = {
    name: text(body, 'name'),
    email: text(body, 'email').toLowerCase(),
    phone: text(body, 'phone'),
    goal: text(body, 'goal') as MockGoal,
    notes: text(body, 'notes'),
  };
  if (!member.name || !member.email.includes('@')) {
    return 'Name and a valid e-mail are required';
  }
  return GOALS.includes(member.goal) ? member : 'Invalid goal';
};

const memberExists = (id: string) =>
  fitnessDb.members.some(member => member.id === id);

const readWorkout: Reader<MockWorkout> = body => {
  const memberId = text(body, 'memberId');
  if (!memberExists(memberId)) {
    return 'Unknown member';
  }
  const exercises = readExercises(body);
  const name = text(body, 'name');
  if (!name || !exercises) {
    return 'A name and at least one valid exercise are required';
  }
  return { memberId, name, notes: text(body, 'notes'), exercises };
};

const readSession: Reader<MockSession> = body => {
  const memberId = text(body, 'memberId');
  if (!memberExists(memberId)) {
    return 'Unknown member';
  }
  const date = text(body, 'date');
  const durationMinutes = field(body, 'durationMinutes');
  const exercises = readExercises(body);
  if (
    !isValidDateString(date) ||
    !Number.isInteger(durationMinutes) ||
    (durationMinutes as number) < 1 ||
    !exercises
  ) {
    return 'Invalid session';
  }
  const workoutId = text(body, 'workoutId');
  return {
    memberId,
    workoutId: workoutId || null,
    workoutName: text(body, 'workoutName'),
    date,
    durationMinutes: durationMinutes as number,
    exercises,
  };
};

const byMember = (item: { memberId: string }, query: Record<string, unknown>) =>
  typeof query.memberId !== 'string' || item.memberId === query.memberId;

// ------------------------------------------------------------- routes

export const fitnessMockRoutes: MockRoute[] = [
  ...crudRoutes<MockMember>({
    path: '/members',
    label: 'Member',
    items: () => fitnessDb.members,
    setItems: items => {
      fitnessDb.members = items;
    },
    read: readMember,
    compare: (a, b) => a.name.localeCompare(b.name),
    onDelete: member => {
      fitnessDb.workouts = fitnessDb.workouts.filter(
        workout => workout.memberId !== member.id,
      );
      fitnessDb.sessions = fitnessDb.sessions.filter(
        session => session.memberId !== member.id,
      );
    },
    beforeUpdate: (member, body) => {
      if (
        text(body, 'notes').includes(MOCK_CONFLICT_TAG) &&
        !fitnessDb.conflictsServed.has(member.id)
      ) {
        fitnessDb.conflictsServed.add(member.id);
        member.phone = '+55 11 90000-0000';
        member.notes = 'Phone updated at the front desk.';
        member.version += 1;
      }
    },
    updatable: true,
  }),
  ...crudRoutes<MockWorkout>({
    path: '/workouts',
    label: 'Workout',
    items: () => fitnessDb.workouts,
    setItems: items => {
      fitnessDb.workouts = items;
    },
    read: readWorkout,
    matches: byMember,
    compare: (a, b) => a.name.localeCompare(b.name),
    updatable: true,
  }),
  ...crudRoutes<MockSession>({
    path: '/sessions',
    label: 'Session',
    items: () => fitnessDb.sessions,
    setItems: items => {
      fitnessDb.sessions = items;
    },
    read: readSession,
    matches: (session, query) =>
      byMember(session, query) &&
      (typeof query.from !== 'string' || session.date >= query.from) &&
      (typeof query.to !== 'string' || session.date <= query.to),
    compare: (a, b) => b.date.localeCompare(a.date),
    updatable: false,
  }),
];
