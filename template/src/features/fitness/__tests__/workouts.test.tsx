import { screen, waitFor } from '@/test-utils';
import { confirmAlerts, openMembersTab, remote } from '@/test-utils/fitness';
import { toDateString } from '@/utils/dates';
import { testIDs } from '@/utils/testIDs';

const ids = testIDs.exerciseFields;

describe('workouts and sessions', () => {
  it('creates a workout with several exercises', async () => {
    const { user } = await openMembersTab();
    await user.press(screen.getByTestId(testIDs.members.item('m4')));
    expect(await screen.findByText('No workouts yet.')).toBeOnTheScreen();

    await user.press(
      screen.getByTestId(testIDs.memberDetails.newWorkoutButton),
    );
    await user.type(
      await screen.findByTestId(testIDs.workoutForm.nameInput),
      'Cardio and core',
    );
    await user.type(screen.getByTestId(ids.name(0)), 'Rowing machine');
    await user.clear(screen.getByTestId(ids.reps(0)));
    await user.type(screen.getByTestId(ids.reps(0)), '0');

    await user.press(screen.getByTestId(ids.addButton));
    await user.type(screen.getByTestId(ids.name(1)), 'Plank');
    await user.clear(screen.getByTestId(ids.weight(1)));
    await user.type(screen.getByTestId(ids.weight(1)), '2,5');

    await user.press(screen.getByTestId(testIDs.workoutForm.saveButton));
    expect(
      await screen.findByText('Enter a number from 1 to 100.'),
    ).toBeOnTheScreen();

    await user.clear(screen.getByTestId(ids.reps(0)));
    await user.type(screen.getByTestId(ids.reps(0)), '12');
    await user.press(screen.getByTestId(testIDs.workoutForm.saveButton));

    expect(await screen.findByText('Cardio and core')).toBeOnTheScreen();
    expect(screen.getByText('Rowing machine · Plank')).toBeOnTheScreen();
    await waitFor(() =>
      expect(remote.workoutByName('Cardio and core')).toMatchObject({
        memberId: 'm4',
        exercises: [
          { name: 'Rowing machine', sets: 3, reps: 12, weightKg: 0 },
          { name: 'Plank', sets: 3, reps: 10, weightKg: 2.5 },
        ],
      }),
    );
  });

  it('edits and deletes a workout', async () => {
    confirmAlerts();
    const { user } = await openMembersTab();
    await user.press(screen.getByTestId(testIDs.members.item('m1')));

    await user.press(
      await screen.findByTestId(testIDs.memberDetails.workout('w1')),
    );
    const name = await screen.findByTestId(testIDs.workoutForm.nameInput);
    expect(name).toHaveDisplayValue('Upper body A');
    expect(screen.getByTestId(ids.name(2))).toHaveDisplayValue(
      'Overhead press',
    );
    await user.clear(name);
    await user.type(name, 'Push day');
    await user.press(screen.getByTestId(ids.remove(2)));
    await user.press(screen.getByTestId(testIDs.workoutForm.saveButton));

    expect(await screen.findByText('Push day')).toBeOnTheScreen();
    expect(screen.getByText('Bench press · Barbell row')).toBeOnTheScreen();
    await waitFor(() =>
      expect(remote.workout('w1')).toMatchObject({
        name: 'Push day',
        version: 2,
      }),
    );
    expect(remote.workout('w1')?.exercises).toHaveLength(2);

    await user.press(screen.getByTestId(testIDs.memberDetails.workout('w1')));
    await user.press(
      await screen.findByTestId(testIDs.workoutForm.deleteButton),
    );
    expect(await screen.findByText('Lower body B')).toBeOnTheScreen();
    expect(screen.queryByText('Push day')).not.toBeOnTheScreen();
    await waitFor(() => expect(remote.workout('w1')).toBeUndefined());
  });

  it('logs a session with the loads of the chosen workout', async () => {
    const { user } = await openMembersTab();
    await user.press(screen.getByTestId(testIDs.members.item('m1')));
    const before = remote.sessionsOf('m1').length;

    await user.press(
      await screen.findByTestId(testIDs.memberDetails.logSessionButton),
    );
    // The first workout (by name) is preselected with its plan.
    expect(await screen.findByTestId(ids.name(0))).toHaveDisplayValue('Squat');
    await user.press(
      screen.getByTestId(testIDs.sessionForm.workoutOption('w1')),
    );
    expect(screen.getByTestId(ids.name(0))).toHaveDisplayValue('Bench press');
    await user.clear(screen.getByTestId(ids.weight(0)));
    await user.type(screen.getByTestId(ids.weight(0)), '65');
    // A day of the current month other than today.
    const now = new Date();
    const day = toDateString(
      new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() === 15 ? 16 : 15,
      ),
    );
    await user.press(screen.getByTestId(testIDs.sessionForm.dateField));
    await user.press(
      await screen.findByTestId(
        `${testIDs.sessionForm.dateField}.calendar.day_${day}`,
      ),
    );
    await user.clear(screen.getByTestId(testIDs.sessionForm.durationInput));
    await user.type(
      screen.getByTestId(testIDs.sessionForm.durationInput),
      '45',
    );
    await user.press(screen.getByTestId(testIDs.sessionForm.saveButton));

    expect(
      await screen.findByTestId(testIDs.memberDetails.screen),
    ).toBeOnTheScreen();
    await waitFor(() =>
      expect(remote.sessionsOf('m1')).toHaveLength(before + 1),
    );
    const logged = remote
      .sessionsOf('m1')
      .find(session => session.durationMinutes === 45);
    expect(logged).toMatchObject({
      date: day,
      workoutId: 'w1',
      workoutName: 'Upper body A',
      exercises: expect.arrayContaining([
        { name: 'Bench press', sets: 4, reps: 8, weightKg: 65 },
      ]),
    });
  });

  it('asks for a workout before logging a session', async () => {
    const { user } = await openMembersTab();
    await user.press(screen.getByTestId(testIDs.members.item('m4')));
    await user.press(
      await screen.findByTestId(testIDs.memberDetails.logSessionButton),
    );

    expect(
      await screen.findByText(
        'Create a workout for this member before logging a session.',
      ),
    ).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: 'New workout' }));
    expect(
      await screen.findByTestId(testIDs.workoutForm.screen),
    ).toBeOnTheScreen();
  });
});
