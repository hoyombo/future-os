// ──────────────────────────────────────────────────────────────
//  Future OS · Vision & Cost — Service Factory
//  ═══════════════════════════════════════════════════════════
//  HOW TO REMOVE MOCK AND GO LIVE:
//    1. Delete mock-service.ts and mock-data.ts
//    2. Create a new real-service.ts implementing IAppService
//    3. Change createAppService() below to return realService()
//    4. That's it — no other code changes needed.
// ──────────────────────────────────────────────────────────────

import type { IAppService } from './types';

// ╔══════════════════════════════════════════════════════════════╗
// ║  MOCK SWITCH — Set to false to use a real backend service   ║
// ║  When false, make sure real-service.ts exists and exports   ║
// ║  a function realService(): IAppService                      ║
// ╚══════════════════════════════════════════════════════════════╝
const USE_MOCK = true;

export function createAppService(): IAppService {
  if (USE_MOCK) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { mockService } = require('./mock-service');
    return mockService();
  } else {
    // When going live, import your real service:
    // const { realService } = require('./real-service');
    // return realService();
    throw new Error('Real service not configured. Set USE_MOCK=true or implement real-service.ts');
  }
}
