import { makeStore } from '@/app/store/store';
import { connectivityChanged } from '@/features/network/networkSlice';
import { issueTokens } from '@/services/api/mock/db';
import { fitnessDb, fitnessMockConfig } from '@/services/api/mock/fitness/data';
import { tokenStorage } from '@/services/storage';
import { testUser } from '@/test-utils/session';

import {
  deleteMember,
  deleteWorkout,
  logSession,
  resolveConflict,
  saveMember,
  saveWorkout,
} from '../actions';
import { selectConflict } from '../selectors';
import { syncFitness } from '../sync/syncEngine';
import type { MemberInput } from '../types';

const newMember: MemberInput = {
  name: 'Paula Rocha',
  email: 'paula@example.com',
  phone: '',
  goal: 'strength',
  notes: '',
};

async function signedInStore() {
  await tokenStorage.setTokens(issueTokens({ ...testUser }));
  const store = makeStore({ auth: { user: testUser } });
  await store.dispatch(syncFitness());
  return store;
}

const remoteMember = (id: string) =>
  fitnessDb.members.find(member => member.id === id);

describe('fitness sync engine', () => {
  it('downloads the data on the first sync', async () => {
    const store = await signedInStore();
    const { fitness, fitnessSync } = store.getState();

    expect(Object.keys(fitness.members)).toHaveLength(4);
    expect(fitness.members.m1?.name).toBe('Lucas Pereira');
    expect(Object.keys(fitness.workouts)).toHaveLength(4);
    expect(fitness.lastSyncedAt).not.toBeNull();
    expect(fitnessSync).toEqual({ status: 'idle', error: null });
  });

  it('queues offline changes and sends them in order when back online', async () => {
    const store = await signedInStore();
    store.dispatch(connectivityChanged(false));

    const member = store.dispatch(saveMember(newMember));
    expect(member).not.toBeNull();
    const memberId = member!.id;
    store.dispatch(
      saveMember({ ...newMember, phone: '+55 11 95555-0000' }, memberId),
    );
    const workout = store.dispatch(
      saveWorkout({
        memberId,
        name: 'Day 1',
        notes: '',
        exercises: [{ name: 'Squat', sets: 3, reps: 10, weightKg: 40 }],
      }),
    );
    store.dispatch(saveMember({ ...newMember, name: 'Lucas P.' }, 'm1'));
    store.dispatch(deleteWorkout('w2'));
    await store.dispatch(syncFitness()); // offline: nothing is sent

    // Optimistic: the local data already shows every change.
    let state = store.getState().fitness;
    expect(state.members[memberId]?.phone).toBe('+55 11 95555-0000');
    expect(state.members.m1?.name).toBe('Lucas P.');
    expect(state.workouts.w2).toBeUndefined();
    expect(state.queue.map(m => `${m.action} ${m.entity}`)).toEqual([
      'create members',
      'update members',
      'create workouts',
      'update members',
      'delete workouts',
    ]);
    expect(remoteMember(memberId)).toBeUndefined();

    store.dispatch(connectivityChanged(true));
    await store.dispatch(syncFitness());

    state = store.getState().fitness;
    expect(state.queue).toEqual([]);
    expect(remoteMember(memberId)).toMatchObject({
      phone: '+55 11 95555-0000',
      version: 2,
    });
    expect(remoteMember('m1')).toMatchObject({ name: 'Lucas P.', version: 2 });
    expect(fitnessDb.workouts.find(w => w.id === workout!.id)).toBeDefined();
    expect(fitnessDb.workouts.find(w => w.id === 'w2')).toBeUndefined();
    // The local copies now carry the server versions.
    expect(state.members[memberId]?.version).toBe(2);
    expect(state.members.m1?.version).toBe(2);
  });

  it('removes a record created and deleted while offline', async () => {
    const store = await signedInStore();
    store.dispatch(connectivityChanged(false));
    const member = store.dispatch(saveMember(newMember))!;
    store.dispatch(
      logSession({
        memberId: member.id,
        workoutId: null,
        workoutName: 'Trial class',
        date: '2026-11-01',
        durationMinutes: 30,
        exercises: [{ name: 'Rowing', sets: 1, reps: 1, weightKg: 0 }],
      }),
    );
    store.dispatch(deleteMember(member.id));
    expect(store.getState().fitness.sessions).not.toHaveProperty(member.id);

    store.dispatch(connectivityChanged(true));
    await store.dispatch(syncFitness());

    expect(store.getState().fitness.queue).toEqual([]);
    expect(remoteMember(member.id)).toBeUndefined();
    expect(fitnessDb.sessions.some(s => s.memberId === member.id)).toBe(false);
  });

  it('keeps the queue and reports the error when the server is down', async () => {
    const store = await signedInStore();
    fitnessMockConfig.outage = true;

    store.dispatch(saveMember({ ...newMember, name: 'Lucas P.' }, 'm1'));
    await store.dispatch(syncFitness());

    expect(store.getState().fitnessSync).toMatchObject({
      status: 'failed',
      error: { code: 'SERVER' },
    });
    expect(store.getState().fitness.queue).toHaveLength(1);

    fitnessMockConfig.outage = false;
    await store.dispatch(syncFitness());
    expect(store.getState().fitnessSync.status).toBe('idle');
    expect(store.getState().fitness.queue).toHaveLength(0);
    expect(remoteMember('m1')?.name).toBe('Lucas P.');
  });

  describe('conflicts', () => {
    /** Edits m1 offline while "another device" changes it on the server. */
    async function conflictingEdit() {
      const store = await signedInStore();
      store.dispatch(connectivityChanged(false));
      store.dispatch(saveMember({ ...newMember, name: 'Lucas (mine)' }, 'm1'));
      // Queued after the conflicting change: must wait for it.
      store.dispatch(
        saveMember({ ...newMember, name: 'Mariana (mine)' }, 'm2'),
      );
      Object.assign(remoteMember('m1')!, {
        name: 'Lucas (theirs)',
        version: 2,
      });
      // An unrelated change on the server.
      Object.assign(remoteMember('m3')!, { name: 'Rafael G.', version: 2 });
      store.dispatch(connectivityChanged(true));
      await store.dispatch(syncFitness());
      return store;
    }

    it('stops at a conflict and shows both versions', async () => {
      const store = await conflictingEdit();
      const conflict = selectConflict(store.getState());

      expect(conflict).toMatchObject({
        entityId: 'm1',
        conflict: {
          kind: 'changed',
          server: { name: 'Lucas (theirs)', version: 2 },
        },
      });
      expect(store.getState().fitness.members.m1?.name).toBe('Lucas (mine)');
      // Strict order: the next change was not sent.
      expect(remoteMember('m2')?.name).toBe('Mariana Costa');
      expect(store.getState().fitness.queue).toHaveLength(2);
      // The download still ran: pending records keep their local version.
      expect(store.getState().fitness.members.m2?.name).toBe('Mariana (mine)');
      expect(store.getState().fitness.members.m3?.name).toBe('Rafael G.');
    });

    it('keeps the local version', async () => {
      const store = await conflictingEdit();
      const conflict = selectConflict(store.getState())!;

      store.dispatch(resolveConflict(conflict.id, 'mine'));
      await store.dispatch(syncFitness());

      expect(store.getState().fitness.queue).toEqual([]);
      expect(remoteMember('m1')).toMatchObject({
        name: 'Lucas (mine)',
        version: 3,
      });
      expect(remoteMember('m2')?.name).toBe('Mariana (mine)');
    });

    it("keeps the server's version", async () => {
      const store = await conflictingEdit();
      const conflict = selectConflict(store.getState())!;

      store.dispatch(resolveConflict(conflict.id, 'theirs'));
      await store.dispatch(syncFitness());

      expect(store.getState().fitness.queue).toEqual([]);
      expect(store.getState().fitness.members.m1).toMatchObject({
        name: 'Lucas (theirs)',
        version: 2,
      });
      expect(remoteMember('m1')?.name).toBe('Lucas (theirs)');
      expect(remoteMember('m2')?.name).toBe('Mariana (mine)');
    });

    it('recreates a record deleted on the server, if the user wants', async () => {
      const store = await signedInStore();
      store.dispatch(connectivityChanged(false));
      store.dispatch(saveMember({ ...newMember, name: 'Beatriz A.' }, 'm4'));
      fitnessDb.members = fitnessDb.members.filter(m => m.id !== 'm4');
      store.dispatch(connectivityChanged(true));
      await store.dispatch(syncFitness());

      const conflict = selectConflict(store.getState())!;
      expect(conflict.conflict?.kind).toBe('deleted');

      store.dispatch(resolveConflict(conflict.id, 'mine'));
      await store.dispatch(syncFitness());
      expect(remoteMember('m4')).toMatchObject({
        name: 'Beatriz A.',
        version: 1,
      });
    });

    it('lets the user discard a change the server rejects', async () => {
      const store = await signedInStore();
      // The local form validates this; a backend may have stricter rules.
      store.dispatch(saveMember({ ...newMember, email: 'invalid' }, 'm2'));
      await store.dispatch(syncFitness());

      const conflict = selectConflict(store.getState())!;
      expect(conflict.conflict).toMatchObject({
        kind: 'rejected',
        error: { status: 422 },
      });

      store.dispatch(resolveConflict(conflict.id, 'theirs'));
      await store.dispatch(syncFitness());
      expect(store.getState().fitness.members.m2?.email).toBe(
        'mariana@example.com',
      );
    });
  });
});
