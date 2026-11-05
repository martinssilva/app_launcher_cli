import { act } from '@testing-library/react-native';

/**
 * FlashList finishes its first layout in a `requestAnimationFrame` after it
 * mounts. Await this after a grid (re)mounts, so that update happens inside
 * act() instead of during the next user event.
 */
export async function settleLists() {
  await act(() => new Promise<void>(resolve => setTimeout(resolve, 50)));
}
