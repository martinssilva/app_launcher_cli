import type { Storage } from 'redux-persist';

import { appStorage } from './storage';

/** redux-persist adapter backed by MMKV. */
export const reduxStorage: Storage = {
  setItem: (key: string, value: string) => {
    appStorage.set(key, value);
    return Promise.resolve(true);
  },
  getItem: (key: string) => Promise.resolve(appStorage.getString(key)),
  removeItem: (key: string) => {
    appStorage.remove(key);
    return Promise.resolve();
  },
};
