'use client';

import { useState, useMemo } from 'react';
import { MapPin, Calendar, Search, Trash2, Plus } from 'lucide-react';
import Image from 'next/image';
import { useAppStore, formatPrice, formatDate, projectBudgetClass } from '@/lib/store';
import { StatusBadge } from '@/components/shared/status-badge';
import { ProjectBuilder } from '@/components/shared/project-builder';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Status } from '@/lib/types';

const PROJECT_STATUS_MAP: Record<string, { status: Status; label: string }> = {
  active: { status: 'green', label: 'Active' },
  completed: { status: 'blue', label: 'Completed' },
  'on-hold': { status: 'orange', label: 'On Hold' },
};

const PROJECT_STATUSES: string[] = ['all', 'active', 'completed', 'on-hold'];
const PROJECT_STATUS_LABELS: Record<string, string> = {
  all: 'All',
  active: 'Active',
  completed: 'Completed',
  'on-hold': 'On Hold',
};

export function ProjectsView() {
  const projects = useAppStore((s) => s.projects);
  const products = useAppStore((s) => s.products);
  const currency = useAppStore((s) => s.currency);
  const openModal = useAppStore((s) => s.openModal);
  const deleteProject = useAppStore((s) => s.deleteProject);
  const addToast = useAppStore((s) => s.addToast);

  const [projectSearch, setProjectSearch] = useState('');
  const [projectStatusFilter, setProjectStatusFilter] = useState<string>('all');
  const [builderOpen, setBuilderOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (projectStatusFilter !== 'all' && p.status !== projectStatusFilter) return false;
      if (projectSearch) {
        const q = projectSearch.toLowerCase();
        if (!p.name.toLowerCase().includes(q) && !p.client.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [projects, projectStatusFilter, projectSearch]);

  function confirmDelete(id: string, name: string, e: React.MouseEvent) {
    e.stopPropagation();
    setDeleteTarget({ id, name });
  }

  function executeDelete() {
    if (!deleteTarget) return;
    deleteProject(deleteTarget.id);
    addToast('info', '🗑️', `${deleteTarget.name} deleted`);
    setDeleteTarget(null);
  }

  return (
    <div className="animate-fade-up space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Projects</h2>
        <Button
          onClick={() => setBuilderOpen(true)}
          className="bg-gold text-os-dark hover:bg-gold-dark"
        >
          <Plus className="h-4 w-4" /> New Project
        </Button>
      </div>

      {projects.length > 0 && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by project or client..."
              value={projectSearch}
              onChange={(e) => setProjectSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            {PROJECT_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setProjectStatusFilter(s)}
                className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-all ${projectStatusFilter === s ? 'bg-gold text-os-dark' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
              >
                {PROJECT_STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center space-y-3">
          <p className="text-muted-foreground">No projects yet.</p>
          <Button onClick={() => setBuilderOpen(true)} className="bg-gold text-os-dark hover:bg-gold-dark">
            <Plus className="h-4 w-4" /> Create your first project
          </Button>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">No projects match your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredProjects.map((p) => {
            const sm = PROJECT_STATUS_MAP[p.status] || PROJECT_STATUS_MAP.active;
            const pct = p.budget > 0 ? Math.round((p.spent / p.budget) * 100) : 0;
            const barClass = projectBudgetClass(p.spent, p.budget);
            const margin = p.budget > 0 ? Math.round(((p.budget - p.spent) / p.budget) * 100) : 0;
            const itemNames = p.items.map((id) => products.find((pr) => pr.id === id)?.name).filter(Boolean);
            const estimatedRevenue = p.spent + Math.round(p.spent * 0.2);

            const cardProducts = p.items
              .map((id) => products.find((pr) => pr.id === id))
              .filter(Boolean)
              .slice(0, 3);
            const remaining = p.items.length - cardProducts.length;

            return (
              <div
                key={p.id}
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
                className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-md hover:shadow-xl hover:border-gold/30 transition-all duration-300 group cursor-pointer"
              >
                {/* Thumbnail strip */}
                <div className="flex h-28 bg-muted relative overflow-hidden">
                  {cardProducts.map((prod) =>
                    prod?.imageUrl ? (
                      <div key={prod.id} className="relative flex-1 first:rounded-tl-xl overflow-hidden">
                        <Image
                          src={prod.imageUrl}
                          alt={prod.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                          sizes="200px"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                    ) : (
                      <div key={prod!.id} className="flex-1 flex items-center justify-center text-2xl bg-muted">
                        {prod!.emoji}
                      </div>
                    )
                  )}
                  {remaining > 0 && (
                    <div className="flex items-center justify-center flex-1 bg-muted text-xs font-medium text-muted-foreground">
                      +{remaining} more
                    </div>
                  )}
                  {cardProducts.length === 0 && (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground text-xs">
                      No items
                    </div>
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition-all duration-300 pointer-events-none">
                    <span className="opacity-100 md:opacity-0 md:group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 text-xs font-medium text-white bg-black/40 backdrop-blur-sm rounded-full px-3 py-1">
                      View Project
                    </span>
                  </div>
                </div>

                {/* Card body */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-foreground text-sm group-hover:text-gold transition-colors duration-200">{p.client}</p>
                      <p className="text-xs text-muted-foreground">{p.name}</p>
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

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-border/50">
                    <div className="grid grid-cols-3 gap-2 flex-1 min-w-0">
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground">Phase</p>
                        <p className="text-xs font-medium text-foreground truncate">{p.phase}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground">Revenue</p>
                        <p className="text-[10px] sm:text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400 truncate">{formatPrice(estimatedRevenue, currency)}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground">Margin</p>
                        <p className={`text-xs font-mono font-medium ${margin >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                          {margin}%
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => confirmDelete(p.id, p.name, e)}
                      className="rounded-lg p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 ml-2"
                      aria-label="Delete project"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ProjectBuilder open={builderOpen} onOpenChange={setBuilderOpen} />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &ldquo;{deleteTarget?.name}&rdquo;. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="bg-destructive text-white hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
