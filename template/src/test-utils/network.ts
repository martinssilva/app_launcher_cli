import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { act } from '@testing-library/react-native';

/**
 * Simulates a connectivity change: calls the most recent NetInfo listener
 * (NetInfo's Jest mock records them but never calls them).
 */
export async function setNetworkState(online: boolean) {
  const calls = jest.mocked(NetInfo.addEventListener).mock.calls;
  const listener = calls[calls.length - 1]?.[0];
  if (!listener) {
    throw new Error('No NetInfo listener: render the app first.');
  }
  const state = {
    type: online ? 'wifi' : 'none',
    isConnected: online,
    isInternetReachable: online,
    details: null,
  } as NetInfoState;
  await act(async () => {
    listener(state);
  });
}
