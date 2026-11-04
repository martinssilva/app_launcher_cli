import { act, cleanup } from '@testing-library/react-native';

import { mockApiConfig, resetMockApi } from '@/services/api/mock';
import { clearAllStorage } from '@/services/storage';
import { resetTestStores } from '@/test-utils';
import { logger } from '@/utils/logger';

// No artificial latency in tests.
mockApiConfig.delayMs = 0;

// Expected API errors (401s in auth tests...) would flood the output.
jest.spyOn(logger, 'warn').mockImplementation(() => undefined);

afterEach(async () => {
  // Let timer-based UI work (FlatList batching, tab transitions) finish inside
  // act(), otherwise it may log "not wrapped in act(...)" after the test body.
  await act(() => new Promise<void>(resolve => setTimeout(resolve, 100)));
  // Unmount first, then drop RTK Query caches so no timers outlive the test.
  await cleanup();
  resetTestStores();
  resetMockApi();
  clearAllStorage();
});
