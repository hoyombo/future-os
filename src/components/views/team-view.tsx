'use client';

import { useState } from 'react';
import { Plus, Trash2, UserCircle } from 'lucide-react';
import { useAppStore, generateId, getTimestamp } from '@/lib/store';
import { StatusBadge } from '@/components/shared/status-badge';
import type { Status, TeamMember } from '@/lib/types';

const MEMBER_STATUS_MAP: Record<string, { status: Status; label: string }> = {
  Active: { status: 'green', label: 'Active' },
  'On Leave': { status: 'gold', label: 'On Leave' },
  Inactive: { status: 'red', label: 'Inactive' },
};

const ROLES = ['Project Manager', 'Procurement Officer', 'Installer', 'Accountant', 'Designer', 'Logistics Coordinator', 'Sales Manager', 'Admin'];

export function TeamView() {
  const teamMembers = useAppStore((s) => s.teamMembers);
  const setTeamMembers = useAppStore((s) => s.setTeamMembers);
  const addToast = useAppStore((s) => s.addToast);
  const addActivity = useAppStore((s) => s.addActivity);
  const service = useAppStore((s) => s._service);

  const [name, setName] = useState('');
  const [role, setRole] = useState(ROLES[0]);
  const [status, setStatus] = useState<'Active' | 'On Leave' | 'Inactive'>('Active');

  function addMember() {
    if (!name.trim()) {
      addToast('warning', '⚠️', 'Name is required');
      return;
    }
    const member: TeamMember = {
      id: generateId(),
      name: name.trim(),
      role,
      status,
    };
    service?.addTeamMember(member);
    setTeamMembers([...teamMembers, member]);
    addActivity({ id: generateId(), text: 'Team member added', detail: `${name.trim()} · ${role}`, icon: '👤', timestamp: getTimestamp() });
    addToast('success', '✅', `${name.trim()} added to team`);
    setName('');
  }

  function deleteMember(id: string, memberName: string) {
    service?.deleteTeamMember(id);
    setTeamMembers(teamMembers.filter((m) => m.id !== id));
    addToast('info', '🗑️', `${memberName} removed`);
  }

  return (
    <div className="animate-fade-up space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Team</h2>
        <span className="text-sm text-muted-foreground">{teamMembers.length} members</span>
      </div>

      {/* Add form */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Add Team Member</h3>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addMember()}
            className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as 'Active' | 'On Leave' | 'Inactive')}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option>Active</option>
            <option>On Leave</option>
            <option>Inactive</option>
          </select>
          <button
            onClick={addMember}
            className="flex items-center gap-1.5 rounded-lg bg-gold text-os-dark px-4 py-2 text-sm font-medium hover:bg-gold-dark transition-colors whitespace-nowrap"
          >
            <Plus className="h-4 w-4" /> Add Member
          </button>
        </div>
      </div>

      {/* Member list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {teamMembers.map((m) => {
          const sm = MEMBER_STATUS_MAP[m.status] || MEMBER_STATUS_MAP['Active'];
          const initials = m.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
          return (
            <div key={m.id} className="rounded-xl border border-border bg-card p-4 hover:shadow-md transition-all">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold text-sm">
                    {initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{m.role}</p>
                  </div>
                </div>
                <StatusBadge status={sm.status} label={sm.label} />
              </div>
              <div className="flex justify-end mt-3">
                <button
                  onClick={() => deleteMember(m.id, m.name)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  aria-label={`Remove ${m.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
        {teamMembers.length === 0 && (
          <div className="col-span-full rounded-xl border border-border bg-card p-12 text-center">
            <UserCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No team members yet. Add your first member above.</p>
          </div>
        )}
      </div>
    </div>
  );
}
