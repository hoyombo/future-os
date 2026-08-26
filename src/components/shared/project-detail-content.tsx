'use client';

import { useAppStore, formatPrice, formatDate } from '@/lib/store';
import type { Project } from '@/lib/types';

interface ProjectDetailContentProps {
  project: Project;
}

export function ProjectDetailContent({ project: p }: ProjectDetailContentProps) {
  const products = useAppStore((s) => s.products);
  const currency = useAppStore((s) => s.currency);

  const itemNames = p.items
    .map((id) => products.find((pr) => pr.id === id)?.name)
    .filter(Boolean);

  return (
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
  );
}
