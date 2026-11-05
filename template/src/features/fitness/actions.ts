import { nanoid } from '@reduxjs/toolkit';

import type { AppThunk } from '@/app/store/types';

import {
  type ConflictChoice,
  conflictResolved,
  mutationQueued,
} from './fitnessSlice';
import { recordLabel } from './format';
import { syncFitness } from './sync/syncEngine';
import type {
  EntityType,
  FitnessEntities,
  MemberInput,
  QueuedMutation,
  SessionInput,
  WorkoutInput,
} from './types';

type Input<E extends EntityType> = Omit<FitnessEntities[E], 'id' | 'version'>;

/**
 * Applies a change locally right away (optimistic update), queues it and asks
 * for a sync. Offline, the change waits in the persisted queue.
 */
function queueChange(
  mutation: Omit<QueuedMutation, 'id' | 'queuedAt'>,
): AppThunk {
  return dispatch => {
    dispatch(
      mutationQueued({
        ...mutation,
        id: nanoid(),
        queuedAt: new Date().toISOString(),
      } as QueuedMutation),
    );
    dispatch(syncFitness());
  };
}

/** Creates a record (no `id`) or updates one. Returns `null` if it no longer exists. */
function upsert<E extends EntityType>(
  entity: E,
  input: Input<E>,
  id?: string,
): AppThunk<FitnessEntities[E] | null> {
  return (dispatch, getState) => {
    const table = getState().fitness[entity] as Record<
      string,
      FitnessEntities[E]
    >;
    const existing = id ? table[id] : undefined;
    if (id && !existing) {
      return null;
    }
    // Ids are created on the device, so records work offline (the API accepts them).
    const record = {
      ...input,
      id: existing?.id ?? nanoid(),
      version: existing?.version ?? 0,
    } as FitnessEntities[E];
    dispatch(
      queueChange({
        entity,
        action: existing ? 'update' : 'create',
        entityId: record.id,
        data: record,
        baseVersion: record.version,
        label: recordLabel(entity, record),
      } as Omit<QueuedMutation, 'id' | 'queuedAt'>),
    );
    return record;
  };
}

function remove<E extends EntityType>(entity: E, id: string): AppThunk {
  return (dispatch, getState) => {
    const record = (
      getState().fitness[entity] as Record<string, FitnessEntities[E]>
    )[id];
    if (record) {
      dispatch(
        queueChange({
          entity,
          action: 'delete',
          entityId: id,
          baseVersion: record.version,
          label: recordLabel(entity, record),
        } as Omit<QueuedMutation, 'id' | 'queuedAt'>),
      );
    }
  };
}

export const saveMember = (input: MemberInput, id?: string) =>
  upsert('members', input, id);
export const deleteMember = (id: string) => remove('members', id);

export const saveWorkout = (input: WorkoutInput, id?: string) =>
  upsert('workouts', input, id);
export const deleteWorkout = (id: string) => remove('workouts', id);

export const logSession = (input: SessionInput) => upsert('sessions', input);
export const deleteSession = (id: string) => remove('sessions', id);

export const resolveConflict =
  (mutationId: string, choice: ConflictChoice): AppThunk =>
  dispatch => {
    dispatch(conflictResolved({ mutationId, choice }));
    dispatch(syncFitness());
  };
