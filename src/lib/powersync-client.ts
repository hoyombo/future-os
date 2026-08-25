import { PowerSyncDatabase } from '@powersync/web';
import { appSchema } from './powersync-schema';

// ── PowerSync client singleton ────────────────────────────────
// Falls back gracefully if no PowerSync URL is configured.
// When configured, provides offline-first SQLite with automatic sync.

let _db: PowerSyncDatabase | null = null;

export function getPowerSyncDB(): PowerSyncDatabase | null {
  if (_db) return _db;

  // Only initialize if PowerSync URL is configured
  const url = process.env.NEXT_PUBLIC_POWERSYNC_URL;
  if (!url) return null;

  _db = new PowerSyncDatabase({
    schema: appSchema,
    database: {
      dbFilename: 'future-os.db',
    },
  });

  return _db;
}

export function isPowerSyncEnabled(): boolean {
  return !!process.env.NEXT_PUBLIC_POWERSYNC_URL;
}
