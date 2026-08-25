// ──────────────────────────────────────────────────────────────
//  Future OS · Vision & Cost — Service Factory
// ──────────────────────────────────────────────────────────────

import type { IAppService } from './types';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

export function createAppService(): IAppService {
  if (USE_MOCK) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { mockService } = require('./mock-service');
    return mockService();
  } else {
    const { apiService } = require('./api-service');
    return apiService();
  }
}
