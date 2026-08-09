'use client';

import { useAppStore } from '@/lib/store';
import { X } from 'lucide-react';

const TOAST_BORDER: Record<string, string> = {
  info: 'border-l-sky-500',
  success: 'border-l-emerald-500',
  warning: 'border-l-amber-500',
  error: 'border-l-red-500',
};

const TOAST_ICON: Record<string, string> = {
  info: 'text-sky-500',
  success: 'text-emerald-500',
  warning: 'text-amber-500',
  error: 'text-red-500',
};

export function ToastContainer() {
  const toasts = useAppStore((s) => s.toasts);
  const removeToast = useAppStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="os-toast-container fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`animate-slide-up flex items-start gap-3 rounded-lg border border-border border-l-4 ${TOAST_BORDER[t.type] || ''} bg-card px-4 py-3 shadow-lg`}
        >
          <span className={`text-lg ${TOAST_ICON[t.type] || ''}`}>{t.icon}</span>
          <p className="flex-1 text-sm text-foreground">{t.message}</p>
          <button
            onClick={() => removeToast(t.id)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
