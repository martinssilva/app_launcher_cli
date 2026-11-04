import { Alert } from 'react-native';

import { renderSignedInApp } from '@/test-utils/session';
import { screen, userEvent, waitFor } from '@/test-utils';
import { toDateString } from '@/utils/dates';
import { testIDs } from '@/utils/testIDs';

async function openAgenda() {
  const user = userEvent.setup();
  await renderSignedInApp();
  await user.press(await screen.findByTestId(testIDs.officeTabs.agenda));
  return user;
}

describe('agenda', () => {
  it("shows today's events and creates a new one", async () => {
    const user = await openAgenda();

    expect(await screen.findByText('Daily stand-up')).toBeOnTheScreen();
    expect(screen.getByText('Client presentation')).toBeOnTheScreen();

    await user.press(screen.getByTestId(testIDs.agenda.newEventButton));
    await user.type(
      await screen.findByTestId(testIDs.eventForm.titleInput),
      'Weekly review',
    );
    await user.clear(screen.getByTestId(testIDs.eventForm.startTimeInput));
    await user.type(
      screen.getByTestId(testIDs.eventForm.startTimeInput),
      '17:00',
    );
    await user.press(screen.getByTestId(testIDs.eventForm.saveButton));

    // The default end (10:00) is now before the start.
    expect(
      await screen.findByText('The end must be after the start.'),
    ).toBeOnTheScreen();

    await user.clear(screen.getByTestId(testIDs.eventForm.endTimeInput));
    await user.type(
      screen.getByTestId(testIDs.eventForm.endTimeInput),
      '18:00',
    );
    await user.press(screen.getByTestId(testIDs.eventForm.saveButton));

    expect(await screen.findByText('Weekly review')).toBeOnTheScreen();
    expect(screen.getByText('17:00 – 18:00')).toBeOnTheScreen();
  });

  it('creates an event on a date picked from the calendar', async () => {
    const today = new Date();
    // A day of the current month, so it is visible without changing months.
    const target = toDateString(
      new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() === 15 ? 16 : 15,
      ),
    );
    const user = await openAgenda();

    await user.press(await screen.findByTestId(testIDs.agenda.newEventButton));
    await user.type(
      await screen.findByTestId(testIDs.eventForm.titleInput),
      'Quarterly planning',
    );
    await user.press(screen.getByTestId(testIDs.eventForm.dateField));
    await user.press(
      await screen.findByTestId(
        `${testIDs.eventForm.dateField}.calendar.day_${target}`,
      ),
    );
    await user.press(screen.getByTestId(testIDs.eventForm.saveButton));

    // Back on the agenda (today selected): the event is on another day.
    expect(await screen.findByText('Daily stand-up')).toBeOnTheScreen();
    expect(screen.queryByText('Quarterly planning')).not.toBeOnTheScreen();

    await user.press(
      screen.getByTestId(`${testIDs.agenda.calendar}.day_${target}`),
    );
    expect(await screen.findByText('Quarterly planning')).toBeOnTheScreen();
  });

  it('edits and deletes an event', async () => {
    jest
      .spyOn(Alert, 'alert')
      .mockImplementation((_title, _message, buttons) => {
        buttons?.find(button => button.style === 'destructive')?.onPress?.();
      });
    const user = await openAgenda();

    await user.press(await screen.findByTestId(testIDs.agenda.event('e1')));
    const title = await screen.findByTestId(testIDs.eventForm.titleInput);
    await waitFor(() => expect(title).toHaveDisplayValue('Daily stand-up'));
    await user.clear(title);
    await user.type(title, 'Team stand-up');
    await user.press(screen.getByTestId(testIDs.eventForm.saveButton));
    expect(await screen.findByText('Team stand-up')).toBeOnTheScreen();

    await user.press(screen.getByTestId(testIDs.agenda.event('e1')));
    await user.press(await screen.findByTestId(testIDs.eventForm.deleteButton));

    expect(Alert.alert).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('Client presentation')).toBeOnTheScreen();
    expect(screen.queryByText('Team stand-up')).not.toBeOnTheScreen();
  });
});
