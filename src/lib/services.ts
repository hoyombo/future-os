// ──────────────────────────────────────────────────────────────
//  Future OS · Vision & Cost — Service Factory
//  ═══════════════════════════════════════════════════════════
//  HOW TO REMOVE MOCK AND GO LIVE:
//    1. Delete mock-service.ts and mock-data.ts
//    2. Create a new real-service.ts implementing IAppService
//    3. Change USE_MOCK to false below
//    4. Update the import to point to real-service.ts
//    5. That's it — no other code changes needed.
// ──────────────────────────────────────────────────────────────

import type { IAppService } from './types';

// ╔══════════════════════════════════════════════════════════════╗
// ║  MOCK SWITCH — Set to false to use a real backend service   ║
// ║  You can also drive this via NEXT_PUBLIC_USE_MOCK env var  ║
// ╚══════════════════════════════════════════════════════════════╝
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== 'false';

export function createAppService(): IAppService {
  if (USE_MOCK) {
    // Dynamic import to keep mock code out of production bundle analysis
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { mockService } = require('./mock-service');
    return mockService();
  } else {
    throw new Error(
      'Real service not configured. Set USE_MOCK=true or implement real-service.ts ' +
      'and update the import in services.ts.'
    );
  }
}
