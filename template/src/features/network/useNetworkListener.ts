import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { useEffect } from 'react';

import { useAppDispatch } from '@/app/store/hooks';
import { baseApi } from '@/services/api';

import { connectivityChanged } from './networkSlice';

/** `isInternetReachable` is `null` while unknown: only `false` means offline. */
export function isOnlineState(
  state: Pick<NetInfoState, 'isConnected' | 'isInternetReachable'>,
): boolean {
  return state.isConnected !== false && state.isInternetReachable !== false;
}

/**
 * Keeps `state.network.isOnline` in sync with NetInfo and tells RTK Query about
 * it (`refetchOnReconnect`). Mount it once, in a component that lives as long
 * as the screens that need it.
 */
export function useNetworkListener() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    let last: boolean | undefined;
    return NetInfo.addEventListener(state => {
      const online = isOnlineState(state);
      if (online === last) {
        return;
      }
      last = online;
      dispatch(connectivityChanged(online));
      dispatch(
        online
          ? baseApi.internalActions.onOnline()
          : baseApi.internalActions.onOffline(),
      );
    });
  }, [dispatch]);
}
