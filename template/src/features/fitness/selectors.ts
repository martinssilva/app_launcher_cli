import { createSelector } from '@reduxjs/toolkit';

import type { RootState } from '@/app/store/types';

import type { EntityType, QueuedMutation } from './types';

const byName = (a: { name: string }, b: { name: string }) =>
  a.name.localeCompare(b.name);

const selectMemberTable = (state: RootState) => state.fitness.members;
const selectWorkoutTable = (state: RootState) => state.fitness.workouts;
const selectSessionTable = (state: RootState) => state.fitness.sessions;

export const selectQueue = (state: RootState) => state.fitness.queue;
export const selectLastSyncedAt = (state: RootState) =>
  state.fitness.lastSyncedAt;
export const selectSyncState = (state: RootState) => state.fitnessSync;

export const selectMembers = createSelector([selectMemberTable], members =>
  Object.values(members).sort(byName),
);

export const selectMember = (state: RootState, id: string) =>
  state.fitness.members[id];

export const selectWorkout = (state: RootState, id: string) =>
  state.fitness.workouts[id];

export const selectWorkoutsByMember = createSelector(
  [selectWorkoutTable, (_state: RootState, memberId: string) => memberId],
  (workouts, memberId) =>
    Object.values(workouts)
      .filter(workout => workout.memberId === memberId)
      .sort(byName),
);

/** Sessions of a member, most recent first. */
export const selectSessionsByMember = createSelector(
  [selectSessionTable, (_state: RootState, memberId: string) => memberId],
  (sessions, memberId) =>
    Object.values(sessions)
      .filter(session => session.memberId === memberId)
      .sort((a, b) => b.date.localeCompare(a.date)),
);

export const selectWorkoutCountByMember = createSelector(
  [selectWorkoutTable],
  workouts => {
    const counts: Record<string, number> = {};
    for (const { memberId } of Object.values(workouts)) {
      counts[memberId] = (counts[memberId] ?? 0) + 1;
    }
    return counts;
  },
);

/** The change that blocks the queue, if the server did not accept it. */
export const selectConflict = (state: RootState): QueuedMutation | undefined =>
  state.fitness.queue.find(mutation => mutation.conflict);

const selectPendingKeys = createSelector([selectQueue], queue => {
  const keys = new Set<string>();
  for (const { entity, entityId } of queue) {
    keys.add(`${entity}:${entityId}`);
  }
  return keys;
});

/** Whether a record has local changes the server has not accepted yet. */
export const selectIsPending = (
  state: RootState,
  entity: EntityType,
  id: string,
) => selectPendingKeys(state).has(`${entity}:${id}`);
