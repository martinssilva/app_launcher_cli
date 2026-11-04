import { renderSignedInApp } from '@/test-utils/session';
import { screen, userEvent, waitFor } from '@/test-utils';
import { testIDs } from '@/utils/testIDs';

async function openTasks() {
  const user = userEvent.setup();
  await renderSignedInApp();
  await user.press(await screen.findByTestId(testIDs.officeTabs.tasks));
  expect(await screen.findByText('15 of 40 tasks')).toBeOnTheScreen();
  return user;
}

describe('tasks', () => {
  it('loads the next page at the end of the list', async () => {
    const user = await openTasks();

    // contentSize + layoutMeasurement let VirtualizedList compute the window.
    await user.scrollTo(screen.getByTestId(testIDs.tasks.list), {
      y: 1500,
      contentSize: { width: 400, height: 2000 },
      layoutMeasurement: { width: 400, height: 500 },
    });

    expect(await screen.findByText('30 of 40 tasks')).toBeOnTheScreen();
  });

  it('filters by status and search', async () => {
    const user = await openTasks();

    await user.press(screen.getByTestId(testIDs.tasks.statusFilter('done')));
    expect(await screen.findByText('13 of 13 tasks')).toBeOnTheScreen();

    await user.type(screen.getByTestId(testIDs.tasks.searchInput), 'contract');
    expect(await screen.findByText('1 of 1 tasks')).toBeOnTheScreen();
    expect(screen.getByText('Review supplier contract #18')).toBeOnTheScreen();
  });

  it('shows only my tasks', async () => {
    const user = await openTasks();

    await user.press(screen.getByTestId(testIDs.tasks.assignedToMeFilter));

    expect(await screen.findByText('15 of 20 tasks')).toBeOnTheScreen();
    expect(screen.queryByText('Ana Souza')).not.toBeOnTheScreen();
  });

  it('changes the status of a task', async () => {
    const user = await openTasks();

    await user.press(screen.getByTestId(testIDs.tasks.item('t1')));
    expect(
      await screen.findByTestId(testIDs.taskDetails.title),
    ).toHaveTextContent('Prepare monthly report #1');
    expect(
      screen.getByTestId(testIDs.taskDetails.statusOption('todo')),
    ).toBeChecked();

    await user.press(
      screen.getByTestId(testIDs.taskDetails.statusOption('done')),
    );

    await waitFor(() =>
      expect(
        screen.getByTestId(testIDs.taskDetails.statusOption('done')),
      ).toBeChecked(),
    );
  });
});
