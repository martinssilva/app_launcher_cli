import { screen, waitFor, within } from '@/test-utils';
import { confirmAlerts, openMembersTab, remote } from '@/test-utils/fitness';
import { testIDs } from '@/utils/testIDs';

describe('members', () => {
  it('lists the members and searches them', async () => {
    const { user } = await openMembersTab();

    expect(screen.getByText('Mariana Costa')).toBeOnTheScreen();
    expect(
      within(screen.getByTestId(testIDs.members.item('m1'))).getByText(
        'Hypertrophy · Workouts: 2',
      ),
    ).toBeOnTheScreen();

    await user.type(screen.getByTestId(testIDs.members.searchInput), 'mari');
    expect(screen.getByText('Mariana Costa')).toBeOnTheScreen();
    expect(screen.queryByText('Lucas Pereira')).not.toBeOnTheScreen();

    await user.clear(screen.getByTestId(testIDs.members.searchInput));
    await user.type(screen.getByTestId(testIDs.members.searchInput), 'nobody');
    expect(
      await screen.findByText('No members match your search.'),
    ).toBeOnTheScreen();
  });

  it('validates and creates a member', async () => {
    const { user } = await openMembersTab();

    await user.press(screen.getByTestId(testIDs.members.newButton));
    await user.press(await screen.findByTestId(testIDs.memberForm.saveButton));
    expect(await screen.findAllByText('This field is required.')).toHaveLength(
      2,
    );

    await user.type(
      screen.getByTestId(testIDs.memberForm.nameInput),
      'Paula Rocha',
    );
    await user.type(screen.getByTestId(testIDs.memberForm.emailInput), 'paula');
    await user.type(screen.getByTestId(testIDs.memberForm.phoneInput), '12');
    await user.press(screen.getByTestId(testIDs.memberForm.saveButton));
    expect(
      await screen.findByText('Enter a valid e-mail address.'),
    ).toBeOnTheScreen();
    expect(screen.getByText('Enter a valid phone number.')).toBeOnTheScreen();

    await user.type(
      screen.getByTestId(testIDs.memberForm.emailInput),
      '@example.com',
    );
    await user.type(
      screen.getByTestId(testIDs.memberForm.phoneInput),
      '345678',
    );
    await user.press(
      screen.getByTestId(testIDs.memberForm.goalOption('strength')),
    );
    await user.press(screen.getByTestId(testIDs.memberForm.saveButton));

    // Shown right away (optimistic), then accepted by the API.
    expect(await screen.findByText('Paula Rocha')).toBeOnTheScreen();
    await waitFor(() =>
      expect(remote.memberByName('Paula Rocha')).toMatchObject({
        email: 'paula@example.com',
        phone: '12345678',
        goal: 'strength',
        version: 1,
      }),
    );
    expect(screen.queryByText('Not synced')).not.toBeOnTheScreen();
  });

  it('shows the details of a member and edits them', async () => {
    const { user } = await openMembersTab();

    await user.press(screen.getByTestId(testIDs.members.item('m1')));
    expect(
      await screen.findByTestId(testIDs.memberDetails.name),
    ).toHaveTextContent('Lucas Pereira');
    expect(
      screen.getByText('Prefers training in the morning.'),
    ).toBeOnTheScreen();
    expect(screen.getByText('Upper body A')).toBeOnTheScreen();
    expect(screen.getByText('Lower body B')).toBeOnTheScreen();

    await user.press(screen.getByTestId(testIDs.memberDetails.editButton));
    const phone = await screen.findByTestId(testIDs.memberForm.phoneInput);
    expect(phone).toHaveDisplayValue('+55 11 91234-5678');
    await user.clear(phone);
    await user.type(phone, '+55 11 98888-7777');
    await user.press(screen.getByTestId(testIDs.memberForm.saveButton));

    expect(await screen.findByText('+55 11 98888-7777')).toBeOnTheScreen();
    await waitFor(() =>
      expect(remote.member('m1')).toMatchObject({
        phone: '+55 11 98888-7777',
        version: 2,
      }),
    );
  });

  it('deletes a member with their workouts and sessions', async () => {
    confirmAlerts();
    const { user } = await openMembersTab();

    await user.press(screen.getByTestId(testIDs.members.item('m2')));
    await user.press(
      await screen.findByTestId(testIDs.memberDetails.deleteButton),
    );

    expect(await screen.findByText('Lucas Pereira')).toBeOnTheScreen();
    expect(screen.queryByText('Mariana Costa')).not.toBeOnTheScreen();
    await waitFor(() => expect(remote.member('m2')).toBeUndefined());
    expect(remote.sessionsOf('m2')).toEqual([]);
    expect(remote.workoutByName('Full body circuit')).toBeUndefined();
  });
});
