import { Alert } from 'react-native';

import { fitnessDb } from '@/services/api/mock/fitness/data';
import { testIDs } from '@/utils/testIDs';

import { screen, userEvent } from './index';
import { renderSignedInApp } from './session';

/** Records of the mock fitness API (what the "server" has). */
export const remote = {
  member: (id: string) => fitnessDb.members.find(member => member.id === id),
  memberByName: (name: string) =>
    fitnessDb.members.find(member => member.name === name),
  workout: (id: string) =>
    fitnessDb.workouts.find(workout => workout.id === id),
  workoutByName: (name: string) =>
    fitnessDb.workouts.find(workout => workout.name === name),
  sessionsOf: (memberId: string) =>
    fitnessDb.sessions.filter(session => session.memberId === memberId),
};

/** Signs in, opens the Members tab and waits for the first sync. */
export async function openMembersTab() {
  const user = userEvent.setup();
  const result = await renderSignedInApp();
  await user.press(await screen.findByTestId(testIDs.fitnessTabs.members));
  await screen.findByText('Lucas Pereira');
  return { user, ...result };
}

/** Makes `Alert.alert` press its destructive button (delete confirmations). */
export function confirmAlerts() {
  return jest
    .spyOn(Alert, 'alert')
    .mockImplementation((_title, _message, buttons) => {
      buttons?.find(button => button.style === 'destructive')?.onPress?.();
    });
}
