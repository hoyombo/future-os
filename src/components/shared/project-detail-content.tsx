'use client';

import { useAppStore, formatPrice, formatDate } from '@/lib/store';
import type { Project } from '@/lib/types';

interface ProjectDetailContentProps {
  project: Project;
}

export function ProjectDetailContent({ project: p }: ProjectDetailContentProps) {
  const products = useAppStore((s) => s.products);
  const invoices = useAppStore((s) => s.invoices);
  const expenses = useAppStore((s) => s.expenses);
  const purchaseOrders = useAppStore((s) => s.purchaseOrders);
  const currency = useAppStore((s) => s.currency);

  const itemNames = p.items
    .map((id) => products.find((pr) => pr.id === id)?.name)
    .filter(Boolean);

  // Real financials
  const clientKey = p.client.trim().toLowerCase();
  const clientInvoices = invoices.filter((i) => i.client.trim().toLowerCase() === clientKey);
  const invoicedTotal = clientInvoices.reduce((s, i) => s + i.amount, 0);
  const invoicedPaid = clientInvoices.reduce((s, i) => s + i.paidAmount, 0);
  const trueMargin = invoicedPaid - p.spent;

  // Linked expenses (approved feed the burn; shown separately from seeded baseline)
  const linkedExpenses = expenses.filter((e) => e.projectId === p.id);
  const approvedExpensesTotal = linkedExpenses
    .filter((e) => e.approval === 'approved')
    .reduce((s, e) => s + e.amount, 0);
  const pendingExpensesTotal = linkedExpenses
    .filter((e) => e.approval !== 'approved')
    .reduce((s, e) => s + e.amount, 0);

  // Committed procurement for this project (not yet delivered)
  const committedProcurement = purchaseOrders
    .filter((po) => po.projectId === p.id && po.status !== 'delivered')
    .reduce((s, po) => s + po.totalAmount, 0);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div><span className="text-muted-foreground">Client:</span> {p.client}</div>
        <div><span className="text-muted-foreground">Status:</span> {p.status}</div>
        <div><span className="text-muted-foreground">Phase:</span> {p.phase}</div>
        <div><span className="text-muted-foreground">Location:</span> {p.location}</div>
        <div><span className="text-muted-foreground">Start:</span> {formatDate(p.startDate)}</div>
        <div><span className="text-muted-foreground">End:</span> {formatDate(p.endDate)}</div>
      </div>

      {/* Financials */}
      <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1.5">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Financials</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
          <div className="flex justify-between"><span className="text-muted-foreground">Budget</span><span className="font-mono font-medium">{formatPrice(p.budget, currency)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Spent</span><span className="font-mono font-medium">{formatPrice(p.spent, currency)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Approved expenses</span><span className="font-mono">{formatPrice(approvedExpensesTotal, currency)}</span></div>
          {pendingExpensesTotal > 0 && (
            <div className="flex justify-between"><span className="text-muted-foreground">Pending expenses</span><span className="font-mono text-amber-600 dark:text-amber-400">{formatPrice(pendingExpensesTotal, currency)}</span></div>
          )}
          {committedProcurement > 0 && (
            <div className="flex justify-between"><span className="text-muted-foreground">Committed procurement</span><span className="font-mono text-blue-600 dark:text-blue-400">{formatPrice(committedProcurement, currency)}</span></div>
          )}
          <div className="flex justify-between"><span className="text-muted-foreground">Invoiced</span><span className="font-mono">{formatPrice(invoicedTotal, currency)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Collected</span><span className="font-mono text-emerald-600 dark:text-emerald-400 font-medium">{formatPrice(invoicedPaid, currency)}</span></div>
          <div className="flex justify-between col-span-2 pt-1 border-t border-border">
            <span className="text-muted-foreground">Margin (collected − spent)</span>
            <span className={`font-mono font-bold ${trueMargin >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
              {formatPrice(trueMargin, currency)}
            </span>
          </div>
        </div>
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
