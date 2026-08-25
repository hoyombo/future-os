'use client';

import {
  DollarSign, FolderKanban, FileText, AlertTriangle,
  TrendingUp, TrendingDown, Package, TicketCheck,
  Ship, Clock, ArrowRight,
} from 'lucide-react';
import { useAppStore, formatPrice, formatDate, stockStatus, projectBudgetClass } from '@/lib/store';
import Image from 'next/image';
import { StatusBadge } from '@/components/shared/status-badge';
import type { Status } from '@/lib/types';

export function DashboardView() {
  const products = useAppStore((s) => s.products);
  const projects = useAppStore((s) => s.projects);
  const proposals = useAppStore((s) => s.proposals);
  const afterSalesTickets = useAppStore((s) => s.afterSalesTickets);
  const expenses = useAppStore((s) => s.expenses);
  const invoices = useAppStore((s) => s.invoices);
  const logisticsEvents = useAppStore((s) => s.logisticsEvents);
  const activityLog = useAppStore((s) => s.activityLog);
  const currency = useAppStore((s) => s.currency);
  const openModal = useAppStore((s) => s.openModal);

  // Stats
  const totalInventoryValue = products.reduce((sum, p) => sum + p.price * p.inStock, 0);
  const activeProjects = projects.filter((p) => p.status === 'active').length;
  const openProposals = proposals.filter((p) => p.status === 'draft' || p.status === 'sent').length;
  const criticalAlerts = products.filter((p) => p.inStock / p.stock <= 0.2).length + afterSalesTickets.filter((t) => t.priority === 'High' && t.status !== 'Resolved').length;

  // Widgets
  const revenueMTD = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.paidAmount, 0);
  const expensesMTD = expenses.reduce((s, e) => s + e.amount, 0);
  const openTickets = afterSalesTickets.filter((t) => t.status === 'Open' || t.status === 'In Progress').length;

  // Project inventory table
  const projectInventory = products.filter((p) => {
    const st = stockStatus(p.inStock, p.stock);
    return st.className.includes('red') || st.className.includes('orange');
  });

  // Logistics dot colors
  const dotColors: Record<string, string> = {
    green: 'bg-emerald-500',
    gold: 'bg-amber-500',
    '': 'bg-muted-foreground/40',
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<DollarSign className="h-5 w-5 text-gold" />}
          label="Total Inventory Value"
          value={formatPrice(totalInventoryValue, currency)}
          sub={`${products.length} products tracked`}
        />
        <StatCard
          icon={<FolderKanban className="h-5 w-5 text-sky-500" />}
          label="Active Projects"
          value={String(activeProjects)}
          sub={`of ${projects.length} total projects`}
        />
        <StatCard
          icon={<FileText className="h-5 w-5 text-amber-500" />}
          label="Open Proposals"
          value={String(openProposals)}
          sub={`${proposals.length} total proposals`}
        />
        <StatCard
          icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
          label="Critical Alerts"
          value={String(criticalAlerts)}
          sub={criticalAlerts > 0 ? 'Action required' : 'All clear'}
          alert={criticalAlerts > 0}
        />
      </div>

      {/* Widget Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <WidgetCard
          label="Revenue MTD"
          value={formatPrice(revenueMTD, currency)}
          trend="up"
          icon={<TrendingUp className="h-4 w-4 text-emerald-500" />}
        />
        <WidgetCard
          label="Expenses MTD"
          value={formatPrice(expensesMTD, currency)}
          trend="down"
          icon={<TrendingDown className="h-4 w-4 text-red-500" />}
        />
        <WidgetCard
          label="Active Projects"
          value={String(activeProjects)}
          trend="neutral"
          icon={<Package className="h-4 w-4 text-sky-500" />}
        />
        <WidgetCard
          label="Open Tickets"
          value={String(openTickets)}
          trend={openTickets > 3 ? 'down' : 'neutral'}
          icon={<TicketCheck className="h-4 w-4 text-amber-500" />}
        />
      </div>

      {/* Two-column: Project Inventory + Supply Chain */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Project Inventory Table */}
        <div className="rounded-xl border border-border bg-card p-4 md:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Stock Alerts</h3>
            <span className="text-xs text-muted-foreground">Items needing attention</span>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {projectInventory.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">All stock levels healthy</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-xs">
                    <th className="text-left pb-2 font-medium">Item</th>
                    <th className="text-right pb-2 font-medium">In Stock</th>
                    <th className="text-right pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {projectInventory.map((p) => {
                    const st = stockStatus(p.inStock, p.stock);
                    const statusKey: Status = st.className.includes('red') ? 'red' : 'orange';
                    return (
                      <tr key={p.id} className="hover:bg-muted/50 transition-colors">
                        <td className="py-2">
                          <div className="flex items-center gap-1.5">
                            {p.imageUrl ? (
                              <div className="relative h-5 w-5 rounded overflow-hidden bg-muted flex-shrink-0">
                                <Image src={p.imageUrl} alt={p.name} fill className="object-cover" sizes="20px" />
                              </div>
                            ) : (
                              <span className="text-sm">{p.emoji}</span>
                            )}
                            <span className="font-medium">{p.name}</span>
                          </div>
                        </td>
                        <td className="py-2 text-right font-mono text-xs">
                          {p.inStock}/{p.stock}
                        </td>
                        <td className="py-2 text-right">
                          <StatusBadge status={statusKey} label={st.label} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Supply Chain Pulse */}
        <div className="rounded-xl border border-border bg-card p-4 md:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Ship className="h-4 w-4 text-gold" />
              Supply Chain Pulse
            </h3>
          </div>
          <div className="space-y-3">
            {logisticsEvents.map((evt, idx) => (
              <div key={idx} className="flex items-start gap-3 animate-fade-up" style={{ animationDelay: `${idx * 60}ms` }}>
                <div className="mt-1.5 flex flex-col items-center">
                  <span className={`h-2.5 w-2.5 rounded-full ${dotColors[evt.dot] || dotColors['']}`} />
                  {idx < logisticsEvents.length - 1 && <span className="w-px h-8 bg-border mt-1" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{evt.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{evt.desc}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {evt.eta}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{evt.timestamp}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two-column: Budget Burn + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Budget Burn Chart */}
        <div className="rounded-xl border border-border bg-card p-4 md:p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Project Budget Burn</h3>
          <div className="space-y-4">
            {projects.map((p) => {
              const pct = p.budget > 0 ? Math.round((p.spent / p.budget) * 100) : 0;
              const barClass = projectBudgetClass(p.spent, p.budget);
              return (
                <div key={p.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-foreground">{p.name}</span>
                    <span className={`text-[11px] font-mono ${barClass === 'danger' ? 'text-red-500 font-bold' : barClass === 'warning' ? 'text-amber-500' : 'text-muted-foreground'}`}>
                      {pct}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        barClass === 'danger'
                          ? 'bg-red-500'
                          : barClass === 'warning'
                          ? 'bg-amber-500'
                          : 'bg-gold'
                      }`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {formatPrice(p.spent, currency)} / {formatPrice(p.budget, currency)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl border border-border bg-card p-4 md:p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Recent Activity</h3>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {activityLog.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No recent activity</p>
            ) : (
              activityLog.slice(0, 15).map((entry) => (
                <div key={entry.id} className="flex items-start gap-2.5 py-1.5">
                  <span className="text-base mt-0.5">{entry.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{entry.text}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{entry.detail}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">{formatDate(entry.timestamp)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, alert }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  alert?: boolean;
}) {
  return (
    <div className={`rounded-xl border bg-card p-4 md:p-5 transition-all hover:shadow-md ${alert ? 'border-red-300 dark:border-red-800' : 'border-border'}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`rounded-lg p-2 ${alert ? 'bg-red-100 dark:bg-red-900/20' : 'bg-muted'}`}>{icon}</div>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
      <p className={`text-[11px] mt-1 ${alert ? 'text-red-500 font-medium animate-pulse-red' : 'text-muted-foreground'}`}>{sub}</p>
    </div>
  );
}

function WidgetCard({ label, value, trend, icon }: {
  label: string;
  value: string;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        {icon}
      </div>
      <p className="text-xl font-bold text-foreground">{value}</p>
    </div>
  );
}
