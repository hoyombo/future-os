'use client';

import { useAppStore, formatDate } from '@/lib/store';
import { StatusBadge } from '@/components/shared/status-badge';
import type { Status } from '@/lib/types';

const PRIORITY_MAP: Record<string, { status: Status; label: string }> = {
  High: { status: 'red', label: 'High' },
  Medium: { status: 'orange', label: 'Medium' },
  Low: { status: 'green', label: 'Low' },
};

const STATUS_MAP: Record<string, { status: Status; label: string }> = {
  Open: { status: 'red', label: 'Open' },
  'In Progress': { status: 'blue', label: 'In Progress' },
  'Pending Parts': { status: 'gold', label: 'Pending Parts' },
  Resolved: { status: 'green', label: 'Resolved' },
};

export function AftersalesView() {
  const afterSalesTickets = useAppStore((s) => s.afterSalesTickets);

  return (
    <div className="animate-fade-up space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">After-Sales</h2>
        <span className="text-sm text-muted-foreground">{afterSalesTickets.length} tickets</span>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">Ticket</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs hidden md:table-cell">Client</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">Issue</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground text-xs">Priority</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground text-xs">Status</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground text-xs hidden sm:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {afterSalesTickets.map((t) => {
                const pm = PRIORITY_MAP[t.priority] || PRIORITY_MAP['Low'];
                const sm = STATUS_MAP[t.status] || STATUS_MAP['Open'];
                return (
                  <tr key={t.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs font-medium text-foreground">{t.id.toUpperCase()}</p>
                      <p className="text-xs text-muted-foreground md:hidden">{t.client} · {t.project}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="font-medium text-foreground text-xs">{t.client}</p>
                      <p className="text-xs text-muted-foreground">{t.project}</p>
                    </td>
                    <td className="px-4 py-3 text-foreground/80 max-w-xs truncate">{t.issue}</td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={pm.status} label={pm.label} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={sm.status} label={sm.label} />
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-muted-foreground hidden sm:table-cell">{formatDate(t.date)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
