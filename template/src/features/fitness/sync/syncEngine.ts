import type { AppThunk, RootState } from '@/app/store/types';
import { selectIsAuthenticated } from '@/features/auth/authSlice';
import { selectIsOnline } from '@/features/network/networkSlice';
import { type ApiError, toApiError } from '@/services/api/errors';

import { fetchAll, fetchRecord, sendMutation } from '../api/fitnessRemote';
import { mutationConflicted, mutationSynced, pulled } from '../fitnessSlice';
import { syncFailed, syncFinished, syncStarted } from '../syncSlice';
import type { ConflictKind, QueuedMutation, SyncConflict } from '../types';

type ThunkDispatch = Parameters<AppThunk>[0];
type GetState = () => RootState;
type PushOutcome = 'drained' | 'paused' | 'offline';

/**
 * Client errors mean the server will never accept the change as it is: the
 * change becomes a conflict for the user to resolve. Everything else
 * (network, timeouts, 5xx, 429, expired session) is retried on the next sync.
 */
function conflictKindOf(
  error: ApiError,
  mutation: QueuedMutation,
): ConflictKind | null {
  const { status } = error;
  if (status === null || status < 400 || status >= 500) {
    return null;
  }
  if ([401, 408, 429].includes(status)) {
    return null;
  }
  if (status === 409) {
    return 'changed';
  }
  return status === 404 && mutation.action !== 'create'
    ? 'deleted'
    : 'rejected';
}

async function describeConflict(
  error: ApiError,
  mutation: QueuedMutation,
  kind: ConflictKind,
): Promise<SyncConflict> {
  if (kind !== 'changed') {
    return { kind, error: error.toJSON(), server: null };
  }
  try {
    // Shown next to the local version so the user can choose.
    const server = await fetchRecord(mutation.entity, mutation.entityId);
    return { kind, error: error.toJSON(), server };
  } catch (fetchError) {
    const apiError = toApiError(fetchError);
    if (apiError.status === 404) {
      return { kind: 'deleted', error: apiError.toJSON(), server: null };
    }
    throw apiError; // retried on the next sync
  }
}

/** Sends the queue in order. Stops at the first conflict (strict ordering). */
async function pushQueue(
  dispatch: ThunkDispatch,
  getState: GetState,
): Promise<PushOutcome> {
  for (;;) {
    const state = getState();
    if (!selectIsOnline(state) || !selectIsAuthenticated(state)) {
      return 'offline';
    }
    const next = state.fitness.queue[0];
    if (!next) {
      return 'drained';
    }
    if (next.conflict) {
      return 'paused';
    }
    try {
      const record = await sendMutation(next);
      dispatch(mutationSynced({ mutationId: next.id, record }));
    } catch (error) {
      const apiError = toApiError(error);
      if (next.action === 'delete' && apiError.status === 404) {
        // Already deleted (by someone else or by a lost earlier attempt).
        dispatch(mutationSynced({ mutationId: next.id, record: null }));
        continue;
      }
      const kind = conflictKindOf(apiError, next);
      if (!kind) {
        throw apiError;
      }
      const conflict = await describeConflict(apiError, next, kind);
      dispatch(mutationConflicted({ mutationId: next.id, conflict }));
      return 'paused';
    }
  }
}

const hasChangesToSend = (state: RootState) => {
  const next = state.fitness.queue[0];
  return next !== undefined && !next.conflict;
};

async function runSync(dispatch: ThunkDispatch, getState: GetState) {
  dispatch(syncStarted());
  try {
    for (;;) {
      const outcome = await pushQueue(dispatch, getState);
      if (outcome === 'offline') {
        break;
      }
      const data = await fetchAll();
      if (!selectIsAuthenticated(getState())) {
        break;
      }
      dispatch(pulled({ ...data, syncedAt: new Date().toISOString() }));
      if (outcome === 'paused' || !hasChangesToSend(getState())) {
        break;
      }
    }
    dispatch(syncFinished());
  } catch (error) {
    dispatch(syncFailed(toApiError(error).toJSON()));
  }
}

/** The sync in progress of each store (keyed by its `getState`). */
const running = new WeakMap<GetState, Promise<void>>();

/**
 * Sends the queued changes in order, then downloads fresh data. One sync runs
 * at a time: a call made meanwhile gets the running sync, which also sends
 * the changes queued after it started. Never rejects: failures end up in
 * `state.fitnessSync` and are retried on the next sync.
 */
export const syncFitness =
  (): AppThunk<Promise<void>> => (dispatch, getState) => {
    const current = running.get(getState);
    if (current) {
      return current;
    }
    const state = getState();
    if (!selectIsOnline(state) || !selectIsAuthenticated(state)) {
      return Promise.resolve();
    }
    const promise = runSync(dispatch, getState).finally(() => {
      running.delete(getState);
    });
    running.set(getState, promise);
    return promise;
  };
