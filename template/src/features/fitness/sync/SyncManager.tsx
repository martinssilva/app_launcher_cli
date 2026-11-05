import { useEffect } from 'react';
import { AppState } from 'react-native';

import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { selectIsOnline, useNetworkListener } from '@/features/network';

import { syncFitness } from './syncEngine';

/**
 * Starts syncing when the signed-in app mounts, whenever the connection comes
 * back and when the app returns to the foreground. Renders nothing; mounted
 * once by `MainTabs`.
 */
export function SyncManager() {
  const dispatch = useAppDispatch();
  const isOnline = useAppSelector(selectIsOnline);
  useNetworkListener();

  useEffect(() => {
    if (isOnline) {
      dispatch(syncFitness());
    }
  }, [dispatch, isOnline]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        dispatch(syncFitness());
      }
    });
    return () => subscription.remove();
  }, [dispatch]);

  return null;
}
