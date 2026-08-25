'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring service in production
    console.error('[Future OS] Unhandled error:', error);
  }, [error]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-6">
      <div className="max-w-md w-full rounded-2xl border border-border bg-card p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="mb-2 text-xl font-bold text-foreground">Something went wrong</h1>
        <p className="mb-1 text-sm text-muted-foreground">
          Future OS encountered an unexpected error and couldn&apos;t continue.
        </p>
        {error.message && (
          <p className="mb-6 rounded-lg bg-muted px-4 py-2 text-xs font-mono text-muted-foreground break-all">
            {error.message}
          </p>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-gold hover:text-os-dark"
          >
            <RotateCcw className="h-4 w-4" />
            Try Again
          </button>
        </div>
        {error.digest && (
          <p className="mt-4 text-[10px] text-muted-foreground/60">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
