'use client';

import { MapPin, Calendar, ArrowRight } from 'lucide-react';
import { useAppStore, formatPrice, formatDate, projectBudgetClass } from '@/lib/store';
import { StatusBadge } from '@/components/shared/status-badge';
import type { Status } from '@/lib/types';

const PROJECT_STATUS_MAP: Record<string, { status: Status; label: string }> = {
  active: { status: 'green', label: 'Active' },
  completed: { status: 'blue', label: 'Completed' },
  'on-hold': { status: 'orange', label: 'On Hold' },
};

export function ProjectsView() {
  const projects = useAppStore((s) => s.projects);
  const products = useAppStore((s) => s.products);
  const currency = useAppStore((s) => s.currency);
  const openModal = useAppStore((s) => s.openModal);

  return (
    <div className="animate-fade-up space-y-4">
      <h2 className="text-lg font-bold text-foreground">Projects</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {projects.map((p) => {
          const sm = PROJECT_STATUS_MAP[p.status] || PROJECT_STATUS_MAP.active;
          const pct = p.budget > 0 ? Math.round((p.spent / p.budget) * 100) : 0;
          const barClass = projectBudgetClass(p.spent, p.budget);
          const margin = p.budget > 0 ? Math.round(((p.budget - p.spent) / p.budget) * 100) : 0;
          const itemNames = p.items.map((id) => products.find((pr) => pr.id === id)?.name).filter(Boolean);
          const estimatedRevenue = p.spent + Math.round(p.spent * 0.2);

          return (
            <div key={p.id} className="rounded-xl border border-border bg-card p-5 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-base font-bold text-foreground">{p.name}</h3>
                  <p className="text-xs text-muted-foreground">{p.client}</p>
                </div>
                <StatusBadge status={sm.status} label={sm.label} />
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {p.location}</span>
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDate(p.endDate)}</span>
              </div>

              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-foreground">Budget Burn</span>
                  <span className={`text-xs font-mono ${barClass === 'danger' ? 'text-red-500 font-bold' : barClass === 'warning' ? 'text-amber-500' : 'text-muted-foreground'}`}>
                    {pct}%
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      barClass === 'danger' ? 'bg-red-500' : barClass === 'warning' ? 'bg-amber-500' : 'bg-gold'
                    }`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {formatPrice(p.spent, currency)} of {formatPrice(p.budget, currency)}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border">
                <div>
                  <p className="text-[10px] text-muted-foreground">Phase</p>
                  <p className="text-xs font-medium text-foreground">{p.phase}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Est. Revenue</p>
                  <p className="text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400">{formatPrice(estimatedRevenue, currency)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Margin</p>
                  <p className={`text-xs font-mono font-medium ${margin >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                    {margin}%
                  </p>
                </div>
              </div>

              <button
                onClick={() => openModal(p.name, (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-muted-foreground">Client:</span> {p.client}</div>
                      <div><span className="text-muted-foreground">Status:</span> {p.status}</div>
                      <div><span className="text-muted-foreground">Phase:</span> {p.phase}</div>
                      <div><span className="text-muted-foreground">Location:</span> {p.location}</div>
                      <div><span className="text-muted-foreground">Start:</span> {formatDate(p.startDate)}</div>
                      <div><span className="text-muted-foreground">End:</span> {formatDate(p.endDate)}</div>
                      <div><span className="text-muted-foreground">Budget:</span> <span className="font-mono">{formatPrice(p.budget, currency)}</span></div>
                      <div><span className="text-muted-foreground">Spent:</span> <span className="font-mono">{formatPrice(p.spent, currency)}</span></div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Products ({itemNames.length})</p>
                      <div className="flex flex-wrap gap-1">
                        {itemNames.map((n) => (
                          <span key={n} className="rounded-md bg-muted px-2 py-0.5 text-xs">{n}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                className="mt-3 flex items-center gap-1 text-xs text-gold hover:underline"
              >
                View Details <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
