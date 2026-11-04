import { cleanup } from '@testing-library/react-native';

import { mockApiConfig, resetMockApi } from '@/services/api/mock';
import { clearAllStorage } from '@/services/storage';
import { resetTestStores } from '@/test-utils';
import { logger } from '@/utils/logger';

// No artificial latency in tests.
mockApiConfig.delayMs = 0;

// Expected API errors (401s in auth tests...) would flood the output.
jest.spyOn(logger, 'warn').mockImplementation(() => undefined);

afterEach(async () => {
  // Unmount first, then drop RTK Query caches so no timers outlive the test.
  await cleanup();
  resetTestStores();
  resetMockApi();
  clearAllStorage();
});
