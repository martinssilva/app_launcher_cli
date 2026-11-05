import { apiClient } from '@/services/api';

import type {
  EntityType,
  FitnessEntities,
  Member,
  QueuedMutation,
  TrainingSession,
  Workout,
} from '../types';

/**
 * HTTP contract of the fitness API. The screens never call it directly: they
 * read the offline store, and the sync engine uses these functions to send
 * queued changes and download fresh data.
 *
 * - `POST /{entity}` with a client-generated `id` (a repeated POST returns the
 *   stored record, so retries are safe);
 * - `PATCH /{entity}/:id` and `DELETE /{entity}/:id` carry the `version` the
 *   change is based on; a stale version gets `409 Conflict`;
 * - every queued request sends `Idempotency-Key: <mutation id>`, so a backend
 *   can answer retries of an already applied change with the stored response.
 */
const pathOf = (entity: EntityType, id?: string) =>
  id ? `/${entity}/${encodeURIComponent(id)}` : `/${entity}`;

export async function sendMutation(
  mutation: QueuedMutation,
): Promise<FitnessEntities[EntityType] | null> {
  const config = { headers: { 'Idempotency-Key': mutation.id } };
  const { entity, entityId, baseVersion } = mutation;
  switch (mutation.action) {
    case 'create': {
      const response = await apiClient.post<FitnessEntities[EntityType]>(
        pathOf(entity),
        mutation.data,
        config,
      );
      return response.data;
    }
    case 'update': {
      const response = await apiClient.patch<FitnessEntities[EntityType]>(
        pathOf(entity, entityId),
        { ...mutation.data, version: baseVersion },
        config,
      );
      return response.data;
    }
    case 'delete':
      await apiClient.delete(pathOf(entity, entityId), {
        ...config,
        params: { version: baseVersion },
      });
      return null;
  }
}

export async function fetchRecord<E extends EntityType>(
  entity: E,
  id: string,
): Promise<FitnessEntities[E]> {
  const response = await apiClient.get<FitnessEntities[E]>(pathOf(entity, id));
  return response.data;
}

export async function fetchAll() {
  const [members, workouts, sessions] = await Promise.all([
    apiClient.get<Member[]>(pathOf('members')),
    apiClient.get<Workout[]>(pathOf('workouts')),
    apiClient.get<TrainingSession[]>(pathOf('sessions')),
  ]);
  return {
    members: members.data,
    workouts: workouts.data,
    sessions: sessions.data,
  };
}
