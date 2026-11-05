import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { signedOut } from '@/features/auth/authSlice';

import type {
  EntityType,
  Member,
  QueuedMutation,
  SyncConflict,
  TrainingSession,
  Workout,
} from './types';

/**
 * Offline store of the fitness template (persisted with redux-persist).
 *
 * The screens read from here, never from the network: every change is
 * applied locally first (optimistic update) and queued; the sync engine
 * (`sync/syncEngine.ts`) sends the queue in order and downloads fresh data.
 */
export interface FitnessState {
  members: Record<string, Member>;
  workouts: Record<string, Workout>;
  sessions: Record<string, TrainingSession>;
  /** Changes not accepted by the server yet, oldest first. */
  queue: QueuedMutation[];
  /** ISO time of the last successful download (`null`: never synced). */
  lastSyncedAt: string | null;
}

const initialState: FitnessState = {
  members: {},
  workouts: {},
  sessions: {},
  queue: [],
  lastSyncedAt: null,
};

interface Versioned {
  id: string;
  version: number;
}

export type ConflictChoice = 'mine' | 'theirs';

const sameRecord = (a: QueuedMutation, b: QueuedMutation) =>
  a.entity === b.entity && a.entityId === b.entityId;

const recordKey = (entity: EntityType, id: string) => `${entity}:${id}`;

function tableOf(state: FitnessState, entity: EntityType) {
  return state[entity] as Record<string, Versioned>;
}

/** Workouts and sessions cannot outlive their member. */
function removeOrphans(state: FitnessState) {
  for (const entity of ['workouts', 'sessions'] as const) {
    const table = state[entity] as Record<string, { memberId: string }>;
    for (const [id, record] of Object.entries(table)) {
      if (!state.members[record.memberId]) {
        delete table[id];
      }
    }
  }
}

function removeRecord(state: FitnessState, entity: EntityType, id: string) {
  delete tableOf(state, entity)[id];
  if (entity === 'members') {
    removeOrphans(state);
  }
}

/** The optimistic effect of a change on the local data. */
function applyMutation(state: FitnessState, mutation: QueuedMutation) {
  if (mutation.action === 'delete') {
    removeRecord(state, mutation.entity, mutation.entityId);
  } else if (mutation.data) {
    tableOf(state, mutation.entity)[mutation.entityId] = mutation.data;
  }
}

/**
 * Server data wins, except for records with changes still in the queue:
 * those keep their local version (or stay deleted) until the queue is sent.
 */
function mergeTable<T extends Versioned>(
  local: Record<string, T>,
  server: T[],
  isPending: (id: string) => boolean,
): Record<string, T> {
  const next: Record<string, T> = {};
  for (const record of server) {
    const mine = local[record.id];
    if (isPending(record.id)) {
      if (mine) {
        next[record.id] = mine;
      }
    } else {
      next[record.id] = mine && mine.version > record.version ? mine : record;
    }
  }
  for (const [id, record] of Object.entries(local)) {
    if (!next[id] && isPending(id)) {
      next[id] = record; // created offline, not sent yet
    }
  }
  return next;
}

export const fitnessSlice = createSlice({
  name: 'fitness',
  initialState,
  reducers: {
    mutationQueued(state, action: PayloadAction<QueuedMutation>) {
      state.queue.push(action.payload);
      applyMutation(state, action.payload);
    },
    /** The server accepted a change; `record` is its answer (`null` for deletes). */
    mutationSynced(
      state,
      action: PayloadAction<{ mutationId: string; record: Versioned | null }>,
    ) {
      const index = state.queue.findIndex(
        ({ id }) => id === action.payload.mutationId,
      );
      const mutation = state.queue[index];
      if (!mutation) {
        return;
      }
      state.queue.splice(index, 1);
      const { record } = action.payload;
      if (!record) {
        return;
      }
      // Later changes of the same record are now based on the new version.
      const later = state.queue.filter(other => sameRecord(other, mutation));
      later.forEach(other => {
        other.baseVersion = record.version;
      });
      const table = tableOf(state, mutation.entity);
      const current = table[mutation.entityId];
      if (current) {
        table[mutation.entityId] =
          later.length > 0 ? { ...current, version: record.version } : record;
      }
    },
    mutationConflicted(
      state,
      action: PayloadAction<{ mutationId: string; conflict: SyncConflict }>,
    ) {
      const mutation = state.queue.find(
        ({ id }) => id === action.payload.mutationId,
      );
      if (mutation) {
        mutation.conflict = action.payload.conflict as typeof mutation.conflict;
      }
    },
    /**
     * `mine`: send the local change again on top of the server's version
     * (or recreate a record deleted on the server).
     * `theirs`: drop every queued change of the record and keep the server's.
     */
    conflictResolved(
      state,
      action: PayloadAction<{ mutationId: string; choice: ConflictChoice }>,
    ) {
      const mutation = state.queue.find(
        ({ id }) => id === action.payload.mutationId,
      );
      const conflict = mutation?.conflict;
      if (!mutation || !conflict) {
        return;
      }
      if (action.payload.choice === 'theirs') {
        state.queue = state.queue.filter(other => !sameRecord(other, mutation));
        if (conflict.server) {
          tableOf(state, mutation.entity)[mutation.entityId] = conflict.server;
        } else if (
          conflict.kind === 'deleted' ||
          mutation.action === 'create'
        ) {
          removeRecord(state, mutation.entity, mutation.entityId);
        }
        // Otherwise the next download restores the server's record.
        return;
      }
      delete mutation.conflict;
      if (conflict.kind === 'changed' && conflict.server) {
        mutation.baseVersion = conflict.server.version;
      } else if (conflict.kind === 'deleted' && mutation.action === 'update') {
        mutation.action = 'create';
        mutation.baseVersion = 0;
      }
    },
    /** Fresh data downloaded from the server. */
    pulled(
      state,
      action: PayloadAction<{
        members: Member[];
        workouts: Workout[];
        sessions: TrainingSession[];
        syncedAt: string;
      }>,
    ) {
      const pending = new Set(
        state.queue.map(({ entity, entityId }) => recordKey(entity, entityId)),
      );
      const isPending = (entity: EntityType) => (id: string) =>
        pending.has(recordKey(entity, id));
      const { members, workouts, sessions, syncedAt } = action.payload;
      state.members = mergeTable(state.members, members, isPending('members'));
      state.workouts = mergeTable(
        state.workouts,
        workouts,
        isPending('workouts'),
      );
      state.sessions = mergeTable(
        state.sessions,
        sessions,
        isPending('sessions'),
      );
      removeOrphans(state);
      state.lastSyncedAt = syncedAt;
    },
  },
  extraReducers: builder => {
    // Local data and pending changes belong to the signed-in user.
    builder.addCase(signedOut, () => initialState);
  },
});

export const {
  conflictResolved,
  mutationConflicted,
  mutationQueued,
  mutationSynced,
  pulled,
} = fitnessSlice.actions;
export const fitnessReducer = fitnessSlice.reducer;
