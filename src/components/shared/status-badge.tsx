'use client';

import type { Status } from '@/lib/types';

const STATUS_STYLES: Record<Status, string> = {
  green: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  orange: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  blue: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  gold: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-gold',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

interface StatusBadgeProps {
  status: Status;
  label: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status] || STATUS_STYLES.blue}`}>
      {label}
    </span>
  );
}
