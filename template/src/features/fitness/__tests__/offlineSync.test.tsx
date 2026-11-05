import React from 'react';

import { NavigationRoot } from '@/app/navigation/NavigationRoot';
import { makePersistedStore } from '@/app/store/store';
import { signedIn } from '@/features/auth/authSlice';
import { issueTokens } from '@/services/api/mock/db';
import {
  fitnessMockConfig,
  MOCK_CONFLICT_TAG,
} from '@/services/api/mock/fitness/data';
import { tokenStorage } from '@/services/storage';
import { renderWithProviders, screen, userEvent, waitFor } from '@/test-utils';
import { openMembersTab, remote } from '@/test-utils/fitness';
import { setNetworkState } from '@/test-utils/network';
import { testUser } from '@/test-utils/session';
import { testIDs } from '@/utils/testIDs';

type User = ReturnType<typeof userEvent.setup>;

async function createMember(user: User, name: string, email: string) {
  await user.press(screen.getByTestId(testIDs.members.newButton));
  await user.type(
    await screen.findByTestId(testIDs.memberForm.nameInput),
    name,
  );
  await user.type(screen.getByTestId(testIDs.memberForm.emailInput), email);
  await user.press(screen.getByTestId(testIDs.memberForm.saveButton));
  await screen.findByTestId(testIDs.members.screen);
}

/** From the members list: opens a member and edits a field. */
async function editMember(
  user: User,
  memberId: string,
  field: 'nameInput' | 'phoneInput' | 'notesInput',
  value: string,
) {
  await user.press(screen.getByTestId(testIDs.members.item(memberId)));
  await user.press(await screen.findByTestId(testIDs.memberDetails.editButton));
  const input = await screen.findByTestId(testIDs.memberForm[field]);
  await user.clear(input);
  await user.type(input, value);
  await user.press(screen.getByTestId(testIDs.memberForm.saveButton));
  await screen.findByTestId(testIDs.memberDetails.screen);
}

describe('offline mode', () => {
  it('saves changes offline and syncs them in order when back online', async () => {
    const { user } = await openMembersTab();

    await setNetworkState(false);
    expect(
      await screen.findByText(
        "You're offline. Changes are saved on this device.",
      ),
    ).toBeOnTheScreen();

    await createMember(user, 'Paula Rocha', 'paula@example.com');
    expect(screen.getByText('Paula Rocha')).toBeOnTheScreen();
    expect(screen.getByText('Not synced')).toBeOnTheScreen();

    await editMember(user, 'm1', 'nameInput', 'Lucas P. Pereira');
    expect(screen.getByTestId(testIDs.memberDetails.name)).toHaveTextContent(
      'Lucas P. Pereira',
    );
    expect(
      screen.getByText("You're offline. Changes waiting to sync: 2."),
    ).toBeOnTheScreen();

    // Nothing reached the API yet.
    expect(remote.memberByName('Paula Rocha')).toBeUndefined();
    expect(remote.member('m1')?.name).toBe('Lucas Pereira');

    await user.press(screen.getByTestId(testIDs.sync.banner));
    expect(
      await screen.findByTestId(testIDs.sync.connection),
    ).toHaveTextContent('Offline');
    expect(screen.getByText('New member')).toBeOnTheScreen();
    expect(screen.getByText('Member edited')).toBeOnTheScreen();
    expect(screen.getByTestId(testIDs.sync.syncNowButton)).toBeDisabled();

    await setNetworkState(true);

    expect(
      await screen.findByTestId(testIDs.sync.queueEmpty),
    ).toHaveTextContent('Everything is synced.');
    expect(screen.getByTestId(testIDs.sync.status)).toHaveTextContent(
      'Up to date',
    );
    expect(remote.memberByName('Paula Rocha')).toMatchObject({ version: 1 });
    expect(remote.member('m1')).toMatchObject({
      name: 'Lucas P. Pereira',
      version: 2,
    });
  });

  it('lets the user keep their version when someone else changed the record', async () => {
    const { user } = await openMembersTab();

    await setNetworkState(false);
    await editMember(user, 'm1', 'phoneInput', '+55 11 97777-6666');
    // Meanwhile, another device changes the same member.
    Object.assign(remote.member('m1')!, {
      notes: 'Changed at the front desk.',
      version: 2,
    });
    await setNetworkState(true);

    await user.press(
      await screen.findByText(
        'A change needs your attention. Tap to review it.',
      ),
    );
    expect(
      await screen.findByText('Changed on another device'),
    ).toBeOnTheScreen();
    expect(screen.getByText('Phone: +55 11 97777-6666')).toBeOnTheScreen();
    expect(
      screen.getByText('Notes: Changed at the front desk.'),
    ).toBeOnTheScreen();
    expect(remote.member('m1')?.phone).toBe('+55 11 91234-5678');

    await user.press(screen.getByTestId(testIDs.sync.keepMineButton));

    expect(
      await screen.findByTestId(testIDs.sync.queueEmpty),
    ).toBeOnTheScreen();
    expect(screen.queryByTestId(testIDs.sync.conflict)).not.toBeOnTheScreen();
    expect(remote.member('m1')).toMatchObject({
      phone: '+55 11 97777-6666',
      notes: 'Prefers training in the morning.',
      version: 3,
    });
  });

  it("lets the user take the server's version", async () => {
    const { user, store } = await openMembersTab();

    // The mock answers 409 once for notes with this tag (another device's edit).
    await editMember(user, 'm1', 'notesInput', `New plan ${MOCK_CONFLICT_TAG}`);
    await user.press(await screen.findByTestId(testIDs.sync.banner));
    expect(await screen.findByTestId(testIDs.sync.conflict)).toBeOnTheScreen();

    await user.press(screen.getByTestId(testIDs.sync.keepTheirsButton));

    expect(
      await screen.findByTestId(testIDs.sync.queueEmpty),
    ).toBeOnTheScreen();
    expect(store.getState().fitness.members.m1).toMatchObject({
      phone: '+55 11 90000-0000',
      notes: 'Phone updated at the front desk.',
    });
    expect(remote.member('m1')?.notes).toBe('Phone updated at the front desk.');
  });

  it('reports a failed sync and retries it', async () => {
    const { user } = await openMembersTab();
    fitnessMockConfig.outage = true;

    await editMember(user, 'm1', 'nameInput', 'Lucas P.');
    await user.press(
      await screen.findByText("Couldn't sync. Tap for details."),
    );
    expect(await screen.findByTestId(testIDs.sync.status)).toHaveTextContent(
      'Something went wrong on our side. Please try again later.',
    );
    expect(screen.getByText('Member edited')).toBeOnTheScreen();

    fitnessMockConfig.outage = false;
    await user.press(screen.getByTestId(testIDs.sync.syncNowButton));

    expect(
      await screen.findByTestId(testIDs.sync.queueEmpty),
    ).toBeOnTheScreen();
    expect(remote.member('m1')?.name).toBe('Lucas P.');
  });
});

describe('members before the first download', () => {
  async function renderApp(preloaded: { isOnline: boolean }) {
    await tokenStorage.setTokens(issueTokens({ ...testUser }));
    const user = userEvent.setup();
    await renderWithProviders(<NavigationRoot />, {
      preloadedState: {
        auth: { user: testUser },
        network: { isOnline: preloaded.isOnline },
      },
    });
    await user.press(await screen.findByTestId(testIDs.fitnessTabs.members));
    return user;
  }

  it('explains that the data needs a connection', async () => {
    await renderApp({ isOnline: false });

    expect(
      screen.getByText("You're offline. Members will appear once you connect."),
    ).toBeOnTheScreen();

    await setNetworkState(true);
    expect(await screen.findByText('Lucas Pereira')).toBeOnTheScreen();
  });

  it('shows the error and retries', async () => {
    fitnessMockConfig.outage = true;
    const user = await renderApp({ isOnline: true });

    expect(
      await screen.findByText(
        'Something went wrong on our side. Please try again later.',
      ),
    ).toBeOnTheScreen();

    fitnessMockConfig.outage = false;
    await user.press(screen.getByTestId(testIDs.stateView.retryButton));
    expect(await screen.findByText('Lucas Pereira')).toBeOnTheScreen();
  });
});

describe('persistence', () => {
  async function startApp() {
    const app = makePersistedStore();
    await waitFor(() =>
      expect(app.persistor.getState().bootstrapped).toBe(true),
    );
    return app;
  }

  it('keeps the data and the queue when the app restarts offline', async () => {
    await tokenStorage.setTokens(issueTokens({ ...testUser }));
    const first = await startApp();
    first.store.dispatch(signedIn(testUser));
    const user = userEvent.setup();
    const view = await renderWithProviders(<NavigationRoot />, {
      store: first.store,
    });
    await user.press(await screen.findByTestId(testIDs.fitnessTabs.members));
    await screen.findByText('Lucas Pereira');

    await setNetworkState(false);
    await createMember(user, 'Paula Rocha', 'paula@example.com');
    await first.persistor.flush();
    await view.unmount();

    // "Restart": a new store rehydrated from MMKV.
    const second = await startApp();
    const state = second.store.getState();
    expect(state.auth.user).toEqual(testUser);
    expect(state.fitness.members.m1?.name).toBe('Lucas Pereira');
    expect(state.fitness.queue).toMatchObject([
      { action: 'create', entity: 'members', label: 'Paula Rocha' },
    ]);
    expect(remote.memberByName('Paula Rocha')).toBeUndefined();

    // Back online, the restarted app sends the queued change.
    await renderWithProviders(<NavigationRoot />, { store: second.store });
    await waitFor(() =>
      expect(remote.memberByName('Paula Rocha')).toBeDefined(),
    );
    await waitFor(() =>
      expect(second.store.getState().fitness.queue).toEqual([]),
    );
  });
});
