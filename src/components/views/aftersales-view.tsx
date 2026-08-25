'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Search, Trash2, Plus, Loader2, Clock, CircleDot, Wrench, AlertTriangle } from 'lucide-react';
import { useAppStore, formatDate, generateId, getTimestamp } from '@/lib/store';
import { StatusBadge } from '@/components/shared/status-badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage,
} from '@/components/ui/form';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { afterSalesTicketSchema } from '@/lib/validations';
import type { AfterSalesTicket, TicketPriority, TicketStatus, Status } from '@/lib/types';

const PRIORITY_MAP: Record<TicketPriority, Status> = {
  High: 'red',
  Medium: 'orange',
  Low: 'green',
};

const STATUS_MAP: Record<TicketStatus, Status> = {
  Open: 'red',
  'In Progress': 'blue',
  'Pending Parts': 'gold',
  Resolved: 'green',
};

const STATUS_FLOW: TicketStatus[] = ['Open', 'In Progress', 'Pending Parts', 'Resolved'];
const PRIORITIES: TicketPriority[] = ['High', 'Medium', 'Low'];

type TicketFormData = {
  client: string;
  project: string;
  issue: string;
  priority: TicketPriority;
  date: string;
};

export function AftersalesView() {
  const tickets = useAppStore((s) => s.afterSalesTickets);
  const proposals = useAppStore((s) => s.proposals);
  const projects = useAppStore((s) => s.projects);
  const openModal = useAppStore((s) => s.openModal);
  const saveTicket = useAppStore((s) => s.saveTicket);
  const deleteTicket = useAppStore((s) => s.deleteTicket);
  const addToast = useAppStore((s) => s.addToast);
  const addActivity = useAppStore((s) => s.addActivity);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteTarget, setDeleteTarget] = useState<AfterSalesTicket | null>(null);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  const clientRef = useRef<HTMLDivElement>(null);

  const form = useForm<TicketFormData>({
    resolver: zodResolver(afterSalesTicketSchema.omit({ status: true })) as any,
    defaultValues: { client: '', project: '', issue: '', priority: 'Medium', date: '' },
  });

  // Client auto-suggest from existing clients
  const existingClients = useMemo(() => {
    const clientSet = new Set<string>();
    projects.forEach((p) => clientSet.add(p.client));
    proposals.forEach((p) => clientSet.add(p.client));
    tickets.forEach((t) => clientSet.add(t.client));
    return Array.from(clientSet).sort();
  }, [projects, proposals, tickets]);

  const filteredClientSuggestions = useMemo(() => {
    if (!clientSearch) return existingClients.slice(0, 8);
    const q = clientSearch.toLowerCase();
    return existingClients.filter((c) => c.toLowerCase().includes(q)).slice(0, 8);
  }, [clientSearch, existingClients]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (clientRef.current && !clientRef.current.contains(e.target as Node)) {
        setShowClientSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !t.client.toLowerCase().includes(q) &&
          !t.project.toLowerCase().includes(q) &&
          !t.issue.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [tickets, statusFilter, search]);

  const stats = useMemo(() => {
    const agingDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    return {
      open: tickets.filter((t) => t.status === 'Open').length,
      inProgress: tickets.filter((t) => t.status === 'In Progress').length,
      pendingParts: tickets.filter((t) => t.status === 'Pending Parts').length,
      aging: tickets.filter((t) => t.status !== 'Resolved' && t.date < agingDate).length,
    };
  }, [tickets]);

  function isAging(t: AfterSalesTicket): boolean {
    const agingDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    return t.status !== 'Resolved' && t.date < agingDate;
  }

  function openDetail(t: AfterSalesTicket) {
    openModal(`Ticket ${t.id.toUpperCase()}`, (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <StatusBadge status={STATUS_MAP[t.status]} label={t.status} />
          <StatusBadge status={PRIORITY_MAP[t.priority]} label={`${t.priority} priority`} />
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><span className="text-muted-foreground">Client:</span> {t.client}</div>
          <div><span className="text-muted-foreground">Project:</span> {t.project}</div>
          <div className="col-span-2"><span className="text-muted-foreground">Logged:</span> {formatDate(t.date)}</div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Issue</p>
          <p className="text-sm text-foreground leading-relaxed">{t.issue}</p>
        </div>
      </div>
    ));
  }

  function handleFieldChange(ticket: AfterSalesTicket, patch: Partial<AfterSalesTicket>, icon: string, message: string) {
    saveTicket({ ...ticket, ...patch });
    addToast('success', icon, message);
    addActivity({
      id: generateId(),
      text: 'Ticket updated',
      detail: `${ticket.id.toUpperCase()} · ${ticket.client} · ${message}`,
      icon,
      timestamp: getTimestamp(),
    });
  }

  async function onSubmit(data: TicketFormData) {
    setIsSaving(true);
    try {
      const ticket: AfterSalesTicket = {
        id: generateId(),
        client: data.client.trim(),
        project: data.project.trim(),
        issue: data.issue.trim(),
        priority: data.priority,
        status: 'Open',
        date: data.date,
      };
      saveTicket(ticket);
      addToast('success', '✅', `Ticket logged for ${ticket.client}`);
      addActivity({
        id: generateId(),
        text: 'After-sales ticket created',
        detail: `${ticket.client} · ${ticket.project}`,
        icon: '🎧',
        timestamp: getTimestamp(),
      });
      form.reset({ client: '', project: '', issue: '', priority: 'Medium', date: '' });
      setBuilderOpen(false);
    } catch {
      addToast('error', '❌', 'Failed to log ticket. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  function executeDelete() {
    if (!deleteTarget) return;
    deleteTicket(deleteTarget.id);
    addToast('info', '🗑️', `Ticket ${deleteTarget.id.toUpperCase()} deleted`);
    setDeleteTarget(null);
  }

  return (
    <div className="animate-fade-up space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">After-Sales</h2>
        <Button onClick={() => setBuilderOpen(true)} className="bg-gold text-os-dark hover:bg-gold-dark">
          <Plus className="h-4 w-4" /> New Ticket
        </Button>
      </div>

      {/* Summary strip */}
      {tickets.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
              <CircleDot className="h-4 w-4 text-red-500" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Open</p>
              <p className="text-sm font-bold text-foreground">{stats.open}</p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
              <Wrench className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">In Progress</p>
              <p className="text-sm font-bold text-foreground">{stats.inProgress}</p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0">
              <Clock className="h-4 w-4 text-gold" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Pending Parts</p>
              <p className="text-sm font-bold text-foreground">{stats.pendingParts}</p>
            </div>
          </div>
          <div className={`rounded-xl border bg-card p-4 flex items-center gap-3 ${stats.aging > 0 ? 'border-red-500/30' : 'border-border'}`}>
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${stats.aging > 0 ? 'bg-red-500/10' : 'bg-muted'}`}>
              <AlertTriangle className={`h-4 w-4 ${stats.aging > 0 ? 'text-red-500' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Aging &gt;7d</p>
              <p className={`text-sm font-bold ${stats.aging > 0 ? 'text-red-500' : 'text-foreground'}`}>{stats.aging}</p>
            </div>
          </div>
        </div>
      )}

      {tickets.length > 0 && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by client, project, or issue..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            <button
              onClick={() => setStatusFilter('all')}
              className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-all ${statusFilter === 'all' ? 'bg-gold text-os-dark' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
            >
              All
            </button>
            {STATUS_FLOW.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-all ${statusFilter === s ? 'bg-gold text-os-dark' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {tickets.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center space-y-3">
          <p className="text-muted-foreground">No after-sales tickets yet.</p>
          <Button onClick={() => setBuilderOpen(true)} className="bg-gold text-os-dark hover:bg-gold-dark">
            <Plus className="h-4 w-4" /> Log your first ticket
          </Button>
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">No tickets match your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredTickets.map((t) => {
            const aging = isAging(t);
            return (
              <div
                key={t.id}
                onClick={() => openDetail(t)}
                className={`rounded-xl border bg-card overflow-hidden shadow-md hover:shadow-xl hover:border-gold/30 transition-all duration-300 group cursor-pointer p-4 md:p-5 ${aging ? 'border-red-500/30' : 'border-border/60'}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-sm text-foreground group-hover:text-gold transition-colors duration-200 font-mono">
                      {t.id.toUpperCase()}
                    </p>
                    <p className="text-xs text-muted-foreground">{t.client} · {t.project}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(t); }}
                    className="rounded-lg p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100"
                    aria-label={`Delete ticket ${t.id.toUpperCase()}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{t.issue}</p>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Select value={t.status} onValueChange={(v) => handleFieldChange(t, { status: v as TicketStatus }, '🔧', `${t.id.toUpperCase()} → ${v}`)}>
                      <SelectTrigger size="sm" aria-label="Update status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_FLOW.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={t.priority} onValueChange={(v) => handleFieldChange(t, { priority: v as TicketPriority }, '⚡', `${t.id.toUpperCase()} priority → ${v}`)}>
                      <SelectTrigger size="sm" className="w-[104px]" aria-label="Update priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITIES.map((p) => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <span className={`text-[10px] text-muted-foreground whitespace-nowrap ${aging ? 'text-red-500 font-medium' : ''}`}>
                    {aging ? 'Aging · ' : ''}{formatDate(t.date)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Ticket Dialog */}
      <Dialog open={builderOpen} onOpenChange={(open) => { if (!open) form.reset(); setBuilderOpen(open); }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New After-Sales Ticket</DialogTitle>
            <DialogDescription>Log a client issue for follow-up</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div ref={clientRef} className="relative">
                <FormField control={form.control} name="client" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Client name"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          setClientSearch(e.target.value);
                          setShowClientSuggestions(true);
                        }}
                        onFocus={() => setShowClientSuggestions(true)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                {showClientSuggestions && filteredClientSuggestions.length > 0 && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-lg border border-border bg-popover shadow-md max-h-40 overflow-y-auto">
                    {filteredClientSuggestions.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          form.setValue('client', c, { shouldValidate: true });
                          setClientSearch(c);
                          setShowClientSuggestions(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <FormField control={form.control} name="project" render={({ field }) => (
                <FormItem>
                  <FormLabel>Project *</FormLabel>
                  <FormControl><Input placeholder="e.g. BCG Tower" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="issue" render={({ field }) => (
                <FormItem>
                  <FormLabel>Issue *</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe the issue..." rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-2">
                <FormField control={form.control} name="priority" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PRIORITIES.map((p) => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="date" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date *</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setBuilderOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving} className="flex-1 bg-gold text-os-dark hover:bg-gold-dark">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {isSaving ? 'Logging...' : 'Log Ticket'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete ticket?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete ticket {deleteTarget?.id.toUpperCase()} for {deleteTarget?.client}. This action cannot be undone.
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
