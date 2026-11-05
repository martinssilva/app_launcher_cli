import { screen, waitFor, within } from '@/test-utils';
import { confirmAlerts, openMembersTab, remote } from '@/test-utils/fitness';
import { addDays, todayString } from '@/utils/dates';
import { testIDs } from '@/utils/testIDs';

// react-native-wagmi-charts passes dependency arrays to Reanimated hooks,
// which makes Reanimated warn (harmless: they are ignored on native). Any
// other warning fails the test.
let warnSpy: jest.SpyInstance;
beforeEach(() => {
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
});
afterEach(() => {
  const unexpected = warnSpy.mock.calls.filter(
    ([message]) =>
      !String(message).includes('Dependencies should only be used'),
  );
  warnSpy.mockRestore();
  expect(unexpected).toEqual([]);
});

async function openProgress(memberId: string) {
  const app = await openMembersTab();
  await app.user.press(screen.getByTestId(testIDs.members.item(memberId)));
  await app.user.press(
    await screen.findByTestId(testIDs.memberDetails.progressButton),
  );
  await screen.findByTestId(testIDs.progress.screen);
  return app;
}

describe('progress', () => {
  it('summarizes attendance and charts the load evolution', async () => {
    const { user } = await openProgress('m1');

    // Seed: 16 sessions, 9 of them in the last 30 days.
    expect(screen.getByTestId(testIDs.progress.total)).toHaveTextContent(/^16/);
    expect(screen.getByTestId(testIDs.progress.last30Days)).toHaveTextContent(
      /^9/,
    );

    // Most frequent exercise first (ties by name); the latest load is shown.
    const chartValue = screen.getByTestId(testIDs.progress.chartValue);
    expect(chartValue).toHaveTextContent(/55 kg/);
    expect(
      screen.getByText(/Best: 55 kg · \+17\.5 kg since/),
    ).toBeOnTheScreen();

    await user.press(
      screen.getByTestId(testIDs.progress.exerciseOption('Squat')),
    );
    expect(screen.getByTestId(testIDs.progress.chartValue)).toHaveTextContent(
      /90 kg/,
    );
    expect(screen.getByTestId(testIDs.progress.chart)).toBeOnTheScreen();
  });

  it('lists the sessions of the day picked in the calendar', async () => {
    const { user } = await openProgress('m1');
    const latest = addDays(todayString(), -1);

    // The most recent session day is selected.
    expect(screen.getByText('Lower body B · 55 min')).toBeOnTheScreen();

    // Another day of the same month without sessions.
    const sessionDays = new Set(remote.sessionsOf('m1').map(s => s.date));
    const month = latest.slice(0, 8);
    const freeDay = Array.from(
      { length: 28 },
      (_, index) => `${month}${String(index + 1).padStart(2, '0')}`,
    ).find(date => !sessionDays.has(date));
    await user.press(
      screen.getByTestId(`${testIDs.progress.calendar}.day_${freeDay}`),
    );
    expect(
      await screen.findByText('No sessions on this day.'),
    ).toBeOnTheScreen();

    await user.press(
      screen.getByTestId(`${testIDs.progress.calendar}.day_${latest}`),
    );
    expect(await screen.findByText('Lower body B · 55 min')).toBeOnTheScreen();
  });

  it('deletes a session', async () => {
    confirmAlerts();
    const { user } = await openProgress('m1');
    const session = remote
      .sessionsOf('m1')
      .find(item => item.date === addDays(todayString(), -1))!;

    const card = screen.getByTestId(testIDs.progress.session(session.id));
    await user.press(
      within(card).getByTestId(testIDs.progress.deleteSession(session.id)),
    );

    expect(
      await screen.findByText('No sessions on this day.'),
    ).toBeOnTheScreen();
    expect(screen.getByTestId(testIDs.progress.total)).toHaveTextContent(/^15/);
    await waitFor(() => expect(remote.sessionsOf('m1')).toHaveLength(15));
  });

  it('shows an empty state without sessions', async () => {
    await openProgress('m4');

    expect(screen.getByTestId(testIDs.progress.empty)).toHaveTextContent(
      'No sessions yet. Log the first one to follow the progress.',
    );
  });
});
