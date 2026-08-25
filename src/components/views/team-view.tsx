'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2, Search, Loader2, Users, UserCheck, UserMinus } from 'lucide-react';
import { useAppStore, generateId, getTimestamp } from '@/lib/store';
import { StatusBadge } from '@/components/shared/status-badge';
import { Input } from '@/components/ui/input';
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
import { teamMemberSchema } from '@/lib/validations';
import type { TeamMember, Status } from '@/lib/types';

const MEMBER_STATUS_MAP: Record<TeamMember['status'], Status> = {
  Active: 'green',
  'On Leave': 'gold',
  Inactive: 'red',
};

const STATUS_FLOW: TeamMember['status'][] = ['Active', 'On Leave', 'Inactive'];

const ROLES = [
  'Managing Director',
  'Project Manager',
  'Procurement Officer',
  'Lead Installer',
  'Installer',
  'Accountant',
  'Designer',
  'Logistics Coordinator',
  'Sales Manager',
  'Admin',
];

function initials(name: string): string {
  return name.split(' ').map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

type MemberFormData = {
  name: string;
  role: string;
  status: TeamMember['status'];
};

export function TeamView() {
  const teamMembers = useAppStore((s) => s.teamMembers);
  const openModal = useAppStore((s) => s.openModal);
  const saveTeamMember = useAppStore((s) => s.saveTeamMember);
  const deleteTeamMember = useAppStore((s) => s.deleteTeamMember);
  const addToast = useAppStore((s) => s.addToast);
  const addActivity = useAppStore((s) => s.addActivity);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState<TeamMember | null>(null);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<MemberFormData>({
    resolver: zodResolver(teamMemberSchema) as any,
    defaultValues: { name: '', role: 'Project Manager', status: 'Active' },
  });

  const stats = useMemo(() => ({
    total: teamMembers.length,
    active: teamMembers.filter((m) => m.status === 'Active').length,
    onLeave: teamMembers.filter((m) => m.status === 'On Leave').length,
  }), [teamMembers]);

  const filtered = useMemo(() => teamMembers.filter((m) => {
    if (statusFilter !== 'all' && m.status !== statusFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q);
  }), [teamMembers, search, statusFilter]);

  function openDetail(m: TeamMember) {
    openModal(m.name, (
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div><span className="text-muted-foreground">Role:</span> {m.role}</div>
        <div><span className="text-muted-foreground">Status:</span> {m.status}</div>
      </div>
    ));
  }

  function handleStatusChange(member: TeamMember, nextRaw: string) {
    const next = nextRaw as TeamMember['status'];
    if (next === member.status) return;
    saveTeamMember({ ...member, status: next });
    addToast('success', '👤', `${member.name} → ${next}`);
    addActivity({
      id: generateId(),
      text: 'Team member status updated',
      detail: `${member.name} · ${member.role} → ${next}`,
      icon: '👤',
      timestamp: getTimestamp(),
    });
  }

  async function onSubmit(data: MemberFormData) {
    setIsSaving(true);
    try {
      const member: TeamMember = {
        id: generateId(),
        name: data.name.trim(),
        role: data.role,
        status: data.status,
      };
      saveTeamMember(member);
      addToast('success', '✅', `${member.name} added to the team`);
      addActivity({
        id: generateId(),
        text: 'Team member added',
        detail: `${member.name} · ${member.role}`,
        icon: '👤',
        timestamp: getTimestamp(),
      });
      form.reset({ name: '', role: 'Project Manager', status: 'Active' });
      setBuilderOpen(false);
    } catch {
      addToast('error', '❌', 'Failed to add team member. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="animate-fade-up space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Team</h2>
        <Button onClick={() => setBuilderOpen(true)} className="bg-gold text-os-dark hover:bg-gold-dark">
          <Plus className="h-4 w-4" /> Add Member
        </Button>
      </div>

      {/* Summary strip */}
      {teamMembers.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              <Users className="h-4 w-4 text-foreground" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total</p>
              <p className="text-sm font-bold text-foreground">{stats.total} member{stats.total === 1 ? '' : 's'}</p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
              <UserCheck className="h-4 w-4 text-green-500" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Active</p>
              <p className="text-sm font-bold text-foreground">{stats.active}</p>
            </div>
          </div>
          <div className={`rounded-xl border bg-card p-4 flex items-center gap-3 ${stats.onLeave > 0 ? 'border-gold/30' : 'border-border'}`}>
            <div className="h-9 w-9 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0">
              <UserMinus className="h-4 w-4 text-gold" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">On Leave</p>
              <p className="text-sm font-bold text-foreground">{stats.onLeave}</p>
            </div>
          </div>
        </div>
      )}

      {teamMembers.length > 0 && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or role..."
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

      {teamMembers.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center space-y-3">
          <p className="text-muted-foreground">No team members yet.</p>
          <Button onClick={() => setBuilderOpen(true)} className="bg-gold text-os-dark hover:bg-gold-dark">
            <Plus className="h-4 w-4" /> Add your first team member
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">No members match your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m) => (
            <div
              key={m.id}
              onClick={() => openDetail(m)}
              className="rounded-xl border border-border/60 bg-card p-4 shadow-md hover:shadow-xl hover:border-gold/30 transition-all duration-300 group cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-full bg-gold/20 text-gold flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {initials(m.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-foreground group-hover:text-gold transition-colors duration-200 truncate">{m.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{m.role}</p>
                  </div>
                </div>
                <StatusBadge status={MEMBER_STATUS_MAP[m.status]} label={m.status} />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/50" onClick={(e) => e.stopPropagation()}>
                <Select value={m.status} onValueChange={(v) => handleStatusChange(m, v)}>
                  <SelectTrigger size="sm" className="w-[120px] h-7 text-xs" aria-label={`Update status for ${m.name}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_FLOW.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <button
                  onClick={() => setDeleteTarget(m)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100"
                  aria-label={`Delete ${m.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Member Dialog */}
      <Dialog open={builderOpen} onOpenChange={(open) => { if (!open) form.reset(); setBuilderOpen(open); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>Add a new member to your team</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name *</FormLabel>
                  <FormControl><Input placeholder="e.g. Moussa Diallo" autoFocus {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="role" render={({ field }) => (
                <FormItem>
                  <FormLabel>Role *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {STATUS_FLOW.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setBuilderOpen(false)} className="flex-1">Cancel</Button>
                <Button type="submit" disabled={isSaving} className="flex-1 bg-gold text-os-dark hover:bg-gold-dark">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {isSaving ? 'Adding...' : 'Add Member'}
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
            <AlertDialogTitle>Remove team member?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {deleteTarget?.name} ({deleteTarget?.role}) from the team. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (!deleteTarget) return;
              deleteTeamMember(deleteTarget.id);
              addToast('info', '🗑️', `${deleteTarget.name} removed`);
              setDeleteTarget(null);
            }} className="bg-destructive text-white hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
