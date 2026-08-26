'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Plus, Trash2, TrendingUp, TrendingDown, DollarSign,
  Receipt, FileText, ArrowUpRight, ArrowDownRight, Repeat, Calculator, Search,
  Loader2, Wallet, Printer, ChevronDown, Users,
} from 'lucide-react';
import { useAppStore, formatPrice, formatDate, generateId, getTimestamp } from '@/lib/store';
import { StatusBadge } from '@/components/shared/status-badge';
import {
  InvoicePrintPreview, daysOverdue, agingKey, AGING_LABELS,
  type StatementGroup, type InvoicePrintRequest,
} from '@/components/shared/invoice-print';
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
import { expenseSchema, invoiceSchema, billSchema, recurringExpenseSchema } from '@/lib/validations';
import type {
  Status, Expense, Invoice, InvoiceItem, Bill, RecurringExpense, Currency,
  ExpenseStatus, InvoiceStatus, BillStatus,
} from '@/lib/types';

type FinanceTab = 'expenses' | 'invoices' | 'bills' | 'cashflow' | 'budget' | 'recurring' | 'tax';

const TABS: { id: FinanceTab; label: string; icon: React.ReactNode }[] = [
  { id: 'expenses', label: 'Expenses', icon: <Receipt className="h-3.5 w-3.5" /> },
  { id: 'invoices', label: 'Invoices', icon: <FileText className="h-3.5 w-3.5" /> },
  { id: 'bills', label: 'Bills', icon: <DollarSign className="h-3.5 w-3.5" /> },
  { id: 'cashflow', label: 'Cash Flow', icon: <TrendingUp className="h-3.5 w-3.5" /> },
  { id: 'budget', label: 'Budget vs Actual', icon: <Calculator className="h-3.5 w-3.5" /> },
  { id: 'recurring', label: 'Recurring', icon: <Repeat className="h-3.5 w-3.5" /> },
  { id: 'tax', label: 'Tax', icon: <ArrowUpRight className="h-3.5 w-3.5" /> },
];

const EXPENSE_STATUS_MAP: Record<ExpenseStatus, Status> = {
  approved: 'green',
  pending: 'gold',
  rejected: 'red',
};

const INVOICE_STATUS_MAP: Record<InvoiceStatus, { status: Status; label: string }> = {
  paid: { status: 'green', label: 'Paid' },
  pending: { status: 'gold', label: 'Pending' },
  partial: { status: 'blue', label: 'Partial' },
  draft: { status: 'blue', label: 'Draft' },
  overdue: { status: 'red', label: 'Overdue' },
};

const BILL_STATUS_MAP: Record<BillStatus, { status: Status; label: string }> = {
  paid: { status: 'green', label: 'Paid' },
  pending: { status: 'gold', label: 'Pending' },
  overdue: { status: 'red', label: 'Overdue' },
};

const CATEGORIES = ['Operations', 'Logistics', 'Installation', 'Admin', 'Marketing', 'Travel'];
const TODAY = () => new Date().toISOString().slice(0, 10);
const PLUS_30_DAYS = () => new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

function isInvoiceOverdue(inv: Invoice): boolean {
  return (inv.status === 'pending' || inv.status === 'partial') && inv.dueDate < TODAY();
}

function effectiveInvoiceStatus(inv: Invoice): InvoiceStatus {
  return inv.status !== 'paid' && inv.dueDate < TODAY() ? 'overdue' : inv.status;
}

export interface ClientInvoiceGroup {
  client: string;
  invoices: Invoice[];
  invoiced: number;
  paid: number;
  balance: number;
  overdueAmount: number;
  oldestOverdueDays: number;
  buckets: Record<'current' | 'd30' | 'd60' | 'd60p', number>;
}

const EMPTY_BUCKETS = (): Record<'current' | 'd30' | 'd60' | 'd60p', number> =>
  ({ current: 0, d30: 0, d60: 0, d60p: 0 });

export function FinanceView() {
  const [activeTab, setActiveTab] = useState<FinanceTab>('expenses');
  const expenses = useAppStore((s) => s.expenses);
  const invoices = useAppStore((s) => s.invoices);
  const bills = useAppStore((s) => s.bills);
  const budgetData = useAppStore((s) => s.budgetData);

  // Summary cards
  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.paidAmount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;
  const arOutstanding = invoices.filter(i => i.status !== 'paid').reduce((s, i) => s + (i.amount - i.paidAmount), 0);

  return (
    <div className="animate-fade-up space-y-4">
      <h2 className="text-lg font-bold text-foreground">Finance</h2>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <FinanceSummaryCard label="Revenue" value={totalRevenue} icon={<TrendingUp className="h-5 w-5 text-emerald-500" />} positive />
        <FinanceSummaryCard label="Expenses" value={totalExpenses} icon={<TrendingDown className="h-5 w-5 text-red-500" />} />
        <FinanceSummaryCard label="Net Profit" value={netProfit} icon={<DollarSign className="h-5 w-5 text-gold" />} positive={netProfit >= 0} highlight />
        <FinanceSummaryCard label="A/R Outstanding" value={arOutstanding} icon={<Receipt className="h-5 w-5 text-amber-500" />} />
      </div>

      {/* Tab bar */}
      <div className="os-finance-tabs flex gap-1 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-gold text-os-dark'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="rounded-xl border border-border bg-card p-4 md:p-5">
        {activeTab === 'expenses' && <ExpensesTab />}
        {activeTab === 'invoices' && <InvoicesTab />}
        {activeTab === 'bills' && <BillsTab />}
        {activeTab === 'cashflow' && <CashFlowTab invoices={invoices} expenses={expenses} bills={bills} />}
        {activeTab === 'budget' && <BudgetTab budgetData={budgetData} />}
        {activeTab === 'recurring' && <RecurringTab />}
        {activeTab === 'tax' && <TaxTab invoices={invoices} expenses={expenses} />}
      </div>
    </div>
  );
}

// ── Summary Card ──────────────────────────────────────────────────
function FinanceSummaryCard({ label, value, icon, positive = false, highlight = false }: {
  label: string; value: number; icon: React.ReactNode; positive?: boolean; highlight?: boolean;
}) {
  const currency = useAppStore((s) => s.currency);
  return (
    <div className={`rounded-xl border bg-card p-4 transition-all hover:shadow-md ${highlight ? 'border-gold' : 'border-border'}`}>
      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-xs text-muted-foreground">{label}</span></div>
      <p className={`text-xl font-bold font-mono ${highlight ? 'text-gold' : positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>
        {formatPrice(value, currency)}
      </p>
    </div>
  );
}

// ── Shared bits ───────────────────────────────────────────────────
function FilterChips({ options, value, onChange }: {
  options: { key: string; label: string }[]; value: string; onChange: (k: string) => void;
}) {
  return (
    <div className="flex gap-1 flex-wrap">
      {options.map((o) => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-all ${value === o.key ? 'bg-gold text-os-dark' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function SearchBar({ placeholder, value, onChange }: { placeholder: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} className="pl-9" />
    </div>
  );
}

function DeleteDialog({ open, onOpenChange, title, description, onConfirm }: {
  open: boolean; onOpenChange: (o: boolean) => void; title: string; description: string; onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive text-white hover:bg-destructive/90">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ── Expenses Tab ──────────────────────────────────────────────────
type ExpenseFormData = { title: string; amount: number; category: string; date: string };

function ExpensesTab() {
  const expenses = useAppStore((s) => s.expenses);
  const currency = useAppStore((s) => s.currency);
  const openModal = useAppStore((s) => s.openModal);
  const saveExpense = useAppStore((s) => s.saveExpense);
  const deleteExpense = useAppStore((s) => s.deleteExpense);
  const addToast = useAppStore((s) => s.addToast);
  const addActivity = useAppStore((s) => s.addActivity);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema.omit({ status: true, approval: true, createdBy: true })) as any,
    defaultValues: { title: '', amount: 0, category: 'Operations', date: '' },
  });

  const filtered = useMemo(() => expenses.filter(e => {
    if (statusFilter !== 'all' && e.status !== statusFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return e.title.toLowerCase().includes(q) || e.category.toLowerCase().includes(q);
  }), [expenses, search, statusFilter]);

  function openDetail(e: Expense) {
    openModal(e.title, (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><span className="text-muted-foreground">Category:</span> {e.category}</div>
          <div><span className="text-muted-foreground">Amount:</span> <span className="font-mono">{formatPrice(e.amount, currency)}</span></div>
          <div><span className="text-muted-foreground">Status:</span> <span className="capitalize">{e.approval}</span></div>
          <div><span className="text-muted-foreground">Date:</span> {formatDate(e.date)}</div>
          <div className="col-span-2"><span className="text-muted-foreground">Requested by:</span> {e.createdBy}</div>
        </div>
      </div>
    ));
  }

  function handleApproval(e: Expense, nextRaw: string) {
    const next = nextRaw as Exclude<ExpenseStatus, 'pending'>;
    if (next === e.approval) return;
    saveExpense({ ...e, status: next, approval: next });
    addToast(next === 'approved' ? 'success' : 'info', next === 'approved' ? '✅' : '🚫', `${e.title} ${next}`);
    addActivity({
      id: generateId(),
      text: `Expense ${next}`,
      detail: `${e.title} · ${formatPrice(e.amount, currency)}`,
      icon: next === 'approved' ? '✅' : '🚫',
      timestamp: getTimestamp(),
    });
  }

  async function onSubmit(data: ExpenseFormData) {
    setIsSaving(true);
    try {
      saveExpense({
        id: generateId(), title: data.title.trim(),
        amount: data.amount, category: data.category, date: data.date,
        status: 'pending', approval: 'pending', createdBy: 'Moussa',
      });
      addToast('success', '✅', 'Expense submitted for approval');
      addActivity({ id: generateId(), text: 'Expense added', detail: data.title.trim(), icon: '💰', timestamp: getTimestamp() });
      form.reset({ title: '', amount: 0, category: 'Operations', date: '' });
      setBuilderOpen(false);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Expenses ({filtered.length})</h3>
        <Button onClick={() => setBuilderOpen(true)} size="sm" className="bg-gold text-os-dark hover:bg-gold-dark">
          <Plus className="h-3.5 w-3.5" /> Add Expense
        </Button>
      </div>

      {expenses.length > 0 && (
        <>
          <SearchBar placeholder="Search by title or category..." value={search} onChange={setSearch} />
          <FilterChips
            options={[
              { key: 'all', label: 'All' },
              { key: 'pending', label: 'Pending' },
              { key: 'approved', label: 'Approved' },
              { key: 'rejected', label: 'Rejected' },
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
          />
        </>
      )}

      {expenses.length === 0 ? (
        <div className="py-12 text-center space-y-3">
          <p className="text-muted-foreground text-sm">No expenses recorded.</p>
          <Button onClick={() => setBuilderOpen(true)} size="sm" className="bg-gold text-os-dark hover:bg-gold-dark">
            <Plus className="h-3.5 w-3.5" /> Add your first expense
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground text-xs">No expenses match your search.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground">
              <th className="text-left pb-2 font-medium">Title</th>
              <th className="text-left pb-2 font-medium hidden sm:table-cell">Category</th>
              <th className="text-right pb-2 font-medium">Amount</th>
              <th className="text-center pb-2 font-medium">Status</th>
              <th className="text-right pb-2 font-medium hidden md:table-cell">Date</th>
              <th className="text-right pb-2 font-medium w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((e) => {
              return (
                <tr key={e.id} onClick={() => openDetail(e)} className="hover:bg-muted/50 cursor-pointer transition-colors group">
                  <td className="py-2.5 font-medium text-foreground text-xs group-hover:text-gold transition-colors">{e.title}</td>
                  <td className="py-2.5 text-muted-foreground text-xs hidden sm:table-cell">{e.category}</td>
                  <td className="py-2.5 text-right font-mono text-xs">{formatPrice(e.amount, currency)}</td>
                  <td className="py-2.5 text-center"><StatusBadge status={EXPENSE_STATUS_MAP[e.status]} label={e.status.charAt(0).toUpperCase() + e.status.slice(1)} /></td>
                  <td className="py-2.5 text-right text-xs text-muted-foreground hidden md:table-cell">{formatDate(e.date)}</td>
                  <td className="py-2.5 text-right" onClick={(ev) => ev.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      {e.status === 'pending' && (
                        <Select value={e.status} onValueChange={(v) => handleApproval(e, v)}>
                          <SelectTrigger size="sm" className="w-[92px] h-7 text-xs" aria-label="Review expense">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="approved">Approve</SelectItem>
                            <SelectItem value="rejected">Reject</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      <button
                        onClick={() => setDeleteTarget(e)}
                        className="p-1 text-muted-foreground hover:text-red-500 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100"
                        aria-label={`Delete ${e.title}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Add Expense Dialog */}
      <Dialog open={builderOpen} onOpenChange={(open) => { if (!open) form.reset(); setBuilderOpen(open); }}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
            <DialogDescription>Submit an expense for approval</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl><Input placeholder="e.g. Site preparation" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-2">
                <FormField control={form.control} name="amount" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (XOF) *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                    </FormControl>
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
              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel>Category *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setBuilderOpen(false)} className="flex-1">Cancel</Button>
                <Button type="submit" disabled={isSaving} className="flex-1 bg-gold text-os-dark hover:bg-gold-dark">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <DeleteDialog
        open={!!deleteTarget}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        title="Delete expense?"
        description={`This will permanently delete "${deleteTarget?.title}". This action cannot be undone.`}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteExpense(deleteTarget.id);
          addToast('info', '🗑️', 'Expense deleted');
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}

// ── Invoices Tab ──────────────────────────────────────────────────
type InvoiceFormData = { client: string; amount: number; date: string; dueDate: string };

function InvoicesTab() {
  const invoices = useAppStore((s) => s.invoices);
  const currency = useAppStore((s) => s.currency);
  const openModal = useAppStore((s) => s.openModal);
  const saveInvoice = useAppStore((s) => s.saveInvoice);
  const deleteInvoice = useAppStore((s) => s.deleteInvoice);
  const addToast = useAppStore((s) => s.addToast);
  const addActivity = useAppStore((s) => s.addActivity);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<Invoice | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema.omit({ status: true, paidAmount: true })) as any,
    defaultValues: { client: '', amount: 0, date: TODAY(), dueDate: PLUS_30_DAYS() },
  });

  const paymentForm = useForm<{ payment: number }>({ defaultValues: { payment: 0 } });

  // ── Invoice line-item builder ──────────────────────────────────
  const [invItems, setInvItems] = useState<InvoiceItem[]>([]);
  const [itemDesc, setItemDesc] = useState('');
  const [itemQty, setItemQty] = useState(1);
  const [itemPrice, setItemPrice] = useState(0);

  function addInvItem() {
    if (!itemDesc.trim() || itemQty < 1 || itemPrice <= 0) return;
    setInvItems((prev) => [...prev, { description: itemDesc.trim(), qty: itemQty, unitPrice: itemPrice }]);
    setItemDesc('');
    setItemQty(1);
    setItemPrice(0);
  }

  const invItemsTotal = useMemo(
    () => invItems.reduce((s, i) => s + i.qty * i.unitPrice, 0),
    [invItems],
  );

  const filtered = useMemo(() => invoices.filter(i => {
    const eff = effectiveInvoiceStatus(i);
    if (statusFilter !== 'all' && eff !== statusFilter) return false;
    if (!search) return true;
    return i.client.toLowerCase().includes(search.toLowerCase());
  }), [invoices, search, statusFilter]);

  // ── Debt management state ──────────────────────────────────────
  const [viewMode, setViewMode] = useState<'grouped' | 'flat'>('grouped');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [printReq, setPrintReq] = useState<InvoicePrintRequest | null>(null);

  const clientGroups = useMemo<ClientInvoiceGroup[]>(() => {
    const map = new Map<string, Invoice[]>();
    for (const inv of filtered) {
      const arr = map.get(inv.client);
      if (arr) arr.push(inv); else map.set(inv.client, [inv]);
    }
    return [...map.entries()].map(([client, invs]) => {
      let invoiced = 0, paid = 0, balance = 0, overdueAmount = 0, oldestOverdueDays = 0;
      const buckets = EMPTY_BUCKETS();
      for (const inv of invs) {
        invoiced += inv.amount;
        paid += inv.paidAmount;
        if (inv.status !== 'paid') {
          const bal = Math.max(0, inv.amount - inv.paidAmount);
          balance += bal;
          buckets[agingKey(inv)] += bal;
          const overdueDays = daysOverdue(inv.dueDate);
          if (overdueDays > 0) {
            overdueAmount += bal;
            oldestOverdueDays = Math.max(oldestOverdueDays, overdueDays);
          }
        }
      }
      return { client, invoices: invs, invoiced, paid, balance, overdueAmount, oldestOverdueDays, buckets };
    }).sort((a, b) => b.balance - a.balance);
  }, [filtered]);

  const receivables = useMemo(() => {
    let outstanding = 0, overdueAmt = 0;
    const debtors = new Set<string>();
    for (const inv of invoices) {
      if (inv.status === 'paid') continue;
      const bal = Math.max(0, inv.amount - inv.paidAmount);
      if (bal <= 0) continue;
      outstanding += bal;
      debtors.add(inv.client);
      if (daysOverdue(inv.dueDate) > 0) overdueAmt += bal;
    }
    return { outstanding, overdueAmt, debtorCount: debtors.size };
  }, [invoices]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleGroupSelection(invs: Invoice[]) {
    const ids = invs.map((i) => i.id);
    const allSelected = ids.every((id) => selected.has(id));
    setSelected((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (allSelected ? next.delete(id) : next.add(id)));
      return next;
    });
  }

  function toggleCollapse(client: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(client)) next.delete(client); else next.add(client);
      return next;
    });
  }

  function printSelectedInvoices() {
    const invs = filtered.filter((i) => selected.has(i.id));
    if (invs.length === 0) return;
    setPrintReq({ kind: 'multi', invoices: invs });
  }

  function printSelectedStatements() {
    const byClient = new Map<string, Invoice[]>();
    for (const inv of filtered) {
      if (!selected.has(inv.id)) continue;
      const arr = byClient.get(inv.client);
      if (arr) arr.push(inv); else byClient.set(inv.client, [inv]);
    }
    const groups: StatementGroup[] = [...byClient.entries()]
      .map(([client, invs]) => ({ client, invoices: invs }));
    if (groups.length === 0) return;
    setPrintReq({ kind: 'statement', groups });
  }

  const AGING_CHIP_CLASSES: Record<string, string> = {
    current: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    d30: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    d60: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    d60p: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  function renderRow(inv: Invoice, showClient: boolean) {
    const eff = effectiveInvoiceStatus(inv);
    const sm = INVOICE_STATUS_MAP[eff] ?? { status: 'gold' as Status, label: eff };
    const isOverdue = eff === 'overdue';
    const fullyPaid = inv.status === 'paid';
    const isSelected = selected.has(inv.id);
    return (
      <tr
        key={inv.id}
        onClick={() => openDetail(inv)}
        className={`hover:bg-muted/50 cursor-pointer transition-colors group ${isSelected ? 'bg-gold/5' : ''}`}
      >
        <td className="pl-3 py-2 w-8" onClick={(ev) => ev.stopPropagation()}>
          <input
            type="checkbox"
            className="h-3.5 w-3.5 accent-gold cursor-pointer"
            checked={isSelected}
            onChange={() => toggleSelect(inv.id)}
            aria-label={`Select invoice ${inv.id.toUpperCase()} for ${inv.client}`}
          />
        </td>
        <td className="py-2">
          {showClient && (
            <p className="font-medium text-foreground text-xs group-hover:text-gold transition-colors leading-tight">{inv.client}</p>
          )}
          <p className="font-mono text-[10px] text-muted-foreground">{inv.id.toUpperCase()} · {formatDate(inv.date)}</p>
        </td>
        <td className="py-2 text-right font-mono text-xs">{formatPrice(inv.amount, currency)}</td>
        <td className="py-2 text-center"><StatusBadge status={sm.status} label={sm.label} /></td>
        <td className={`py-2 text-right text-xs hidden sm:table-cell ${isOverdue ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
          {isOverdue ? `${daysOverdue(inv.dueDate)}d late · ` : ''}{formatDate(inv.dueDate)}
        </td>
        <td className="py-2 text-right font-mono text-xs text-emerald-600 dark:text-emerald-400 hidden md:table-cell">
          {formatPrice(inv.paidAmount, currency)}
        </td>
        <td className="py-2 pr-3 text-right" onClick={(ev) => ev.stopPropagation()}>
          <div className="flex items-center justify-end gap-1">
            {!fullyPaid && (
              <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => openPaymentDialog(inv)}>
                <Wallet className="h-3 w-3" /> Pay
              </Button>
            )}
            <button
              onClick={() => setPrintReq({ kind: 'single', invoice: inv })}
              className="p-1 text-muted-foreground hover:text-gold transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100"
              aria-label={`Print invoice ${inv.id.toUpperCase()}`}
            >
              <Printer className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setDeleteTarget(inv)}
              className="p-1 text-muted-foreground hover:text-red-500 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100"
              aria-label={`Delete invoice for ${inv.client}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  function openDetail(inv: Invoice) {
    const eff = effectiveInvoiceStatus(inv);
    const remaining = inv.amount - inv.paidAmount;
    openModal(`Invoice · ${inv.client}`, (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><span className="text-muted-foreground">Client:</span> {inv.client}</div>
          <div><span className="text-muted-foreground">Status:</span> {INVOICE_STATUS_MAP[eff]?.label ?? eff}</div>
          <div><span className="text-muted-foreground">Issued:</span> {formatDate(inv.date)}</div>
          <div><span className="text-muted-foreground">Due:</span> {formatDate(inv.dueDate)}</div>
          <div><span className="text-muted-foreground">Total:</span> <span className="font-mono">{formatPrice(inv.amount, currency)}</span></div>
          <div><span className="text-muted-foreground">Paid:</span> <span className="font-mono text-emerald-600 dark:text-emerald-400">{formatPrice(inv.paidAmount, currency)}</span></div>
          <div className="col-span-2"><span className="text-muted-foreground">Remaining:</span> <span className="font-mono font-medium">{formatPrice(remaining, currency)}</span></div>
        </div>
        {inv.items.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Items</p>
            <table className="w-full text-xs">
              <tbody className="divide-y divide-border">
                {inv.items.map((item, i) => (
                  <tr key={i}>
                    <td className="py-1.5 text-foreground">{item.description}</td>
                    <td className="py-1.5 text-right text-muted-foreground whitespace-nowrap">×{item.qty}</td>
                    <td className="py-1.5 text-right font-mono whitespace-nowrap">{formatPrice(item.unitPrice, currency)}</td>
                    <td className="py-1.5 text-right font-mono font-medium whitespace-nowrap">{formatPrice(item.qty * item.unitPrice, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    ));
  }

  function openPaymentDialog(inv: Invoice) {
    setPaymentTarget(inv);
    paymentForm.reset({ payment: inv.amount - inv.paidAmount });
  }

  function handleRecordPayment() {
    if (!paymentTarget) return;
    const remaining = paymentTarget.amount - paymentTarget.paidAmount;
    const amt = Math.max(0, Math.min(paymentForm.getValues('payment') || 0, remaining));
    if (amt <= 0) {
      paymentForm.setError('payment', { message: 'Enter a payment amount' });
      return;
    }
    const paidAmount = paymentTarget.paidAmount + amt;
    const updated: Invoice = {
      ...paymentTarget,
      paidAmount,
      status: paidAmount >= paymentTarget.amount ? 'paid' : 'partial',
    };
    saveInvoice(updated);
    addToast('success', '💰', `Payment of ${formatPrice(amt, currency)} recorded`);
    addActivity({
      id: generateId(),
      text: 'Invoice payment recorded',
      detail: `${updated.client} · ${formatPrice(amt, currency)}${updated.status === 'paid' ? ' · Fully paid' : ''}`,
      icon: '💰',
      timestamp: getTimestamp(),
    });
    setPaymentTarget(null);
  }

  async function onSubmit(data: InvoiceFormData) {
    setIsSaving(true);
    try {
      const amount = invItems.length > 0 ? invItemsTotal : data.amount;
      saveInvoice({
        id: generateId(), client: data.client.trim(),
        amount, date: data.date, dueDate: data.dueDate,
        status: 'pending', paidAmount: 0,
        items: invItems,
      });
      addToast('success', '✅', 'Invoice created');
      addActivity({
        id: generateId(), text: 'Invoice created',
        detail: `${data.client.trim()} · ${formatPrice(amount, currency)}`,
        icon: '📄', timestamp: getTimestamp(),
      });
      form.reset({ client: '', amount: 0, date: TODAY(), dueDate: PLUS_30_DAYS() });
      setInvItems([]);
      setBuilderOpen(false);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Invoices ({filtered.length})</h3>
        <Button onClick={() => setBuilderOpen(true)} size="sm" className="bg-gold text-os-dark hover:bg-gold-dark">
          <Plus className="h-3.5 w-3.5" /> Add Invoice
        </Button>
      </div>

      {/* Receivables strip */}
      {invoices.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="rounded-lg border border-border bg-card px-3 py-2.5 flex items-center gap-2.5">
            <Wallet className="h-4 w-4 text-gold flex-shrink-0" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Outstanding</p>
              <p className="text-sm font-mono font-bold text-foreground">{formatPrice(receivables.outstanding, currency)}</p>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card px-3 py-2.5 flex items-center gap-2.5">
            <Users className="h-4 w-4 text-blue-500 flex-shrink-0" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Clients with debt</p>
              <p className="text-sm font-bold text-foreground">{receivables.debtorCount}</p>
            </div>
          </div>
          <div className={`rounded-lg border bg-card px-3 py-2.5 flex items-center gap-2.5 ${receivables.overdueAmt > 0 ? 'border-red-500/30' : 'border-border'}`}>
            <Receipt className={`h-4 w-4 flex-shrink-0 ${receivables.overdueAmt > 0 ? 'text-red-500' : 'text-muted-foreground'}`} />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Overdue</p>
              <p className={`text-sm font-mono font-bold ${receivables.overdueAmt > 0 ? 'text-red-500' : 'text-foreground'}`}>
                {formatPrice(receivables.overdueAmt, currency)}
              </p>
            </div>
          </div>
        </div>
      )}

      {invoices.length > 0 && (
        <>
          <SearchBar placeholder="Search by client..." value={search} onChange={setSearch} />
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <FilterChips
              options={[
                { key: 'all', label: 'All' },
                { key: 'pending', label: 'Pending' },
                { key: 'partial', label: 'Partial' },
                { key: 'overdue', label: 'Overdue' },
                { key: 'paid', label: 'Paid' },
              ]}
              value={statusFilter}
              onChange={setStatusFilter}
            />
            <div className="flex rounded-lg border border-border overflow-hidden">
              {(['grouped', 'flat'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setViewMode(m)}
                  className={`px-2.5 py-1.5 text-xs font-medium transition-all ${
                    viewMode === m
                      ? 'bg-gold text-os-dark'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {m === 'grouped' ? 'By Client' : 'List'}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {invoices.length === 0 ? (
        <div className="py-12 text-center space-y-3">
          <p className="text-muted-foreground text-sm">No invoices recorded.</p>
          <Button onClick={() => setBuilderOpen(true)} size="sm" className="bg-gold text-os-dark hover:bg-gold-dark">
            <Plus className="h-3.5 w-3.5" /> Create your first invoice
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground text-xs">No invoices match your search.</p>
      ) : viewMode === 'grouped' ? (
        <div className="space-y-3">
          {clientGroups.map((g) => {
            const allSelected = g.invoices.every((i) => selected.has(i.id));
            const isCollapsed = collapsed.has(g.client);
            return (
              <div key={g.client} className="rounded-lg border border-border overflow-hidden">
                {/* Group header */}
                <div className="flex items-center gap-2 px-3 py-2 bg-muted/40 flex-wrap">
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 accent-gold cursor-pointer"
                    checked={allSelected}
                    onChange={() => toggleGroupSelection(g.invoices)}
                    aria-label={`Select all invoices for ${g.client}`}
                  />
                  <button
                    onClick={() => toggleCollapse(g.client)}
                    className="flex items-center gap-1 min-w-0"
                    aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} ${g.client}`}
                  >
                    <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                    <span className="font-semibold text-xs text-foreground truncate">{g.client}</span>
                    <span className="text-[10px] text-muted-foreground">({g.invoices.length})</span>
                  </button>

                  {/* Aging chips */}
                  <div className="flex gap-1">
                    {(['current', 'd30', 'd60', 'd60p'] as const).map((k) =>
                      g.buckets[k] > 0 ? (
                        <span key={k} className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${AGING_CHIP_CLASSES[k]}`}>
                          {AGING_LABELS[k]} {formatPrice(g.buckets[k], currency)}
                        </span>
                      ) : null,
                    )}
                  </div>

                  <div className="ml-auto flex items-center gap-2">
                    {g.oldestOverdueDays > 0 && (
                      <span className="text-[10px] text-red-500 font-medium">
                        oldest {g.oldestOverdueDays}d
                      </span>
                    )}
                    <span className="font-mono text-xs text-muted-foreground hidden sm:inline">
                      Balance{' '}
                      <b className={g.balance > 0 ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}>
                        {formatPrice(g.balance, currency)}
                      </b>
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => setPrintReq({ kind: 'statement', groups: [{ client: g.client, invoices: g.invoices }] })}
                    >
                      <Printer className="h-3 w-3" /> Statement
                    </Button>
                  </div>
                </div>

                {/* Rows */}
                {!isCollapsed && (
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-border">
                      {g.invoices.map((inv) => renderRow(inv, false))}
                    </tbody>
                  </table>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground">
              <th className="pl-3 pb-2 w-8"></th>
              <th className="text-left pb-2 font-medium">Client</th>
              <th className="text-right pb-2 font-medium">Amount</th>
              <th className="text-center pb-2 font-medium">Status</th>
              <th className="text-right pb-2 font-medium hidden sm:table-cell">Due</th>
              <th className="text-right pb-2 font-medium hidden md:table-cell">Paid</th>
              <th className="pr-3 pb-2 text-right font-medium w-32"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((inv) => renderRow(inv, true))}
          </tbody>
        </table>
      )}

      {/* Selection action bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 rounded-xl border border-border bg-card shadow-2xl px-4 py-2.5 flex items-center gap-2 animate-fade-up">
          <span className="text-xs text-muted-foreground whitespace-nowrap">{selected.size} invoice{selected.size === 1 ? '' : 's'} selected</span>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={printSelectedInvoices}>
            <Printer className="h-3 w-3" /> Print Invoices
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={printSelectedStatements}>
            <FileText className="h-3 w-3" /> Statements
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setSelected(new Set())}>
            Clear
          </Button>
        </div>
      )}

      {/* Add Invoice Dialog */}
      <Dialog open={builderOpen} onOpenChange={(open) => {
        if (!open) {
          form.reset();
          setInvItems([]);
          setItemDesc('');
          setItemQty(1);
          setItemPrice(0);
        }
        setBuilderOpen(open);
      }}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Invoice</DialogTitle>
            <DialogDescription>Create an invoice for a client</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="client" render={({ field }) => (
                <FormItem>
                  <FormLabel>Client *</FormLabel>
                  <FormControl><Input placeholder="Client name" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Line items builder */}
              <div className="space-y-2">
                <FormLabel>Items</FormLabel>
                <div className="flex gap-1.5">
                  <Input
                    placeholder="Description e.g. Aeron chairs"
                    value={itemDesc}
                    onChange={(e) => setItemDesc(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addInvItem(); } }}
                    className="flex-1"
                  />
                  <Input
                    type="number" min={1} placeholder="Qty"
                    value={itemQty || ''} onChange={(e) => setItemQty(parseInt(e.target.value) || 0)}
                    className="w-16"
                  />
                  <Input
                    type="number" min={0} placeholder="Unit price"
                    value={itemPrice || ''} onChange={(e) => setItemPrice(parseInt(e.target.value) || 0)}
                    className="w-28"
                  />
                  <Button type="button" variant="outline" size="icon" onClick={addInvItem} disabled={!itemDesc.trim() || itemQty < 1 || itemPrice <= 0}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {invItems.length > 0 ? (
                  <div className="space-y-1">
                    {invItems.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-md bg-muted px-3 py-1.5 text-xs">
                        <span className="flex-1 truncate">{item.description}</span>
                        <span className="text-muted-foreground whitespace-nowrap">×{item.qty}</span>
                        <span className="font-mono text-muted-foreground whitespace-nowrap">{formatPrice(item.unitPrice, currency)}</span>
                        <span className="font-mono font-medium whitespace-nowrap">{formatPrice(item.qty * item.unitPrice, currency)}</span>
                        <button
                          type="button"
                          onClick={() => setInvItems(invItems.filter((_, j) => j !== i))}
                          className="text-muted-foreground hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-muted-foreground">Optional — leave empty to bill a single lump-sum amount.</p>
                )}
              </div>

              <FormField control={form.control} name="amount" render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Amount (XOF) *
                    {invItems.length > 0 && (
                      <span className="ml-2 font-mono text-xs text-gold font-bold">{formatPrice(invItemsTotal, currency)}</span>
                    )}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      disabled={invItems.length > 0}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                  {invItems.length > 0 && (
                    <p className="text-[10px] text-muted-foreground">Auto-calculated from items above.</p>
                  )}
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-2">
                <FormField control={form.control} name="date" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issued *</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="dueDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due *</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setBuilderOpen(false)} className="flex-1">Cancel</Button>
                <Button type="submit" disabled={isSaving} className="flex-1 bg-gold text-os-dark hover:bg-gold-dark">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {isSaving ? 'Creating...' : 'Create'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={!!paymentTarget} onOpenChange={(open) => { if (!open) setPaymentTarget(null); }}>
        <DialogContent className="sm:max-w-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              {paymentTarget?.client} · Remaining {paymentTarget ? formatPrice(paymentTarget.amount - paymentTarget.paidAmount, currency) : ''}
            </DialogDescription>
          </DialogHeader>
          <Form {...paymentForm}>
            <form onSubmit={paymentForm.handleSubmit(handleRecordPayment)} className="space-y-4">
              <FormField control={paymentForm.control} name="payment" render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Amount (XOF)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" autoFocus {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setPaymentTarget(null)} className="flex-1">Cancel</Button>
                <Button type="submit" className="flex-1 bg-gold text-os-dark hover:bg-gold-dark">
                  <Wallet className="h-4 w-4" /> Record
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <DeleteDialog
        open={!!deleteTarget}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        title="Delete invoice?"
        description={`This will permanently delete the invoice for ${deleteTarget?.client}. This action cannot be undone.`}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteInvoice(deleteTarget.id);
          addToast('info', '🗑️', 'Invoice deleted');
          setDeleteTarget(null);
        }}
      />

      {printReq && (
        <InvoicePrintPreview request={printReq} onClose={() => setPrintReq(null)} />
      )}
    </div>
  );
}

// ── Bills Tab ─────────────────────────────────────────────────────
type BillFormData = { supplier: string; amount: number; date: string; dueDate: string };

function BillsTab() {
  const bills = useAppStore((s) => s.bills);
  const currency = useAppStore((s) => s.currency);
  const openModal = useAppStore((s) => s.openModal);
  const saveBill = useAppStore((s) => s.saveBill);
  const deleteBill = useAppStore((s) => s.deleteBill);
  const addToast = useAppStore((s) => s.addToast);
  const addActivity = useAppStore((s) => s.addActivity);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState<Bill | null>(null);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<BillFormData>({
    resolver: zodResolver(billSchema.omit({ status: true })) as any,
    defaultValues: { supplier: '', amount: 0, date: TODAY(), dueDate: PLUS_30_DAYS() },
  });

  const effectiveBillStatus = (b: Bill): BillStatus =>
    b.status !== 'paid' && b.dueDate < TODAY() ? 'overdue' : b.status;

  const filtered = useMemo(() => bills.filter(b => {
    const eff = effectiveBillStatus(b);
    if (statusFilter !== 'all' && eff !== statusFilter) return false;
    if (!search) return true;
    return b.supplier.toLowerCase().includes(search.toLowerCase());
  }), [bills, search, statusFilter]);

  function openDetail(b: Bill) {
    openModal(`Bill · ${b.supplier}`, (
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div><span className="text-muted-foreground">Supplier:</span> {b.supplier}</div>
        <div><span className="text-muted-foreground">Status:</span> {BILL_STATUS_MAP[effectiveBillStatus(b)]?.label ?? effectiveBillStatus(b)}</div>
        <div><span className="text-muted-foreground">Amount:</span> <span className="font-mono">{formatPrice(b.amount, currency)}</span></div>
        <div><span className="text-muted-foreground">Due:</span> {formatDate(b.dueDate)}</div>
      </div>
    ));
  }

  function payBill(b: Bill) {
    saveBill({ ...b, status: 'paid' });
    addToast('success', '🧾', `Bill paid · ${b.supplier}`);
    addActivity({
      id: generateId(), text: 'Bill paid',
      detail: `${b.supplier} · ${formatPrice(b.amount, currency)}`,
      icon: '🧾', timestamp: getTimestamp(),
    });
  }

  async function onSubmit(data: BillFormData) {
    setIsSaving(true);
    try {
      saveBill({
        id: generateId(), supplier: data.supplier.trim(),
        amount: data.amount, date: data.date, dueDate: data.dueDate, status: 'pending',
      });
      addToast('success', '✅', 'Bill added');
      addActivity({
        id: generateId(), text: 'Bill added',
        detail: `${data.supplier.trim()} · ${formatPrice(data.amount, currency)}`,
        icon: '🧾', timestamp: getTimestamp(),
      });
      form.reset({ supplier: '', amount: 0, date: TODAY(), dueDate: PLUS_30_DAYS() });
      setBuilderOpen(false);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Bills ({filtered.length})</h3>
        <Button onClick={() => setBuilderOpen(true)} size="sm" className="bg-gold text-os-dark hover:bg-gold-dark">
          <Plus className="h-3.5 w-3.5" /> Add Bill
        </Button>
      </div>

      {bills.length > 0 && (
        <>
          <SearchBar placeholder="Search by supplier..." value={search} onChange={setSearch} />
          <FilterChips
            options={[
              { key: 'all', label: 'All' },
              { key: 'pending', label: 'Pending' },
              { key: 'overdue', label: 'Overdue' },
              { key: 'paid', label: 'Paid' },
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
          />
        </>
      )}

      {bills.length === 0 ? (
        <div className="py-12 text-center space-y-3">
          <p className="text-muted-foreground text-sm">No bills recorded.</p>
          <Button onClick={() => setBuilderOpen(true)} size="sm" className="bg-gold text-os-dark hover:bg-gold-dark">
            <Plus className="h-3.5 w-3.5" /> Add your first bill
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground text-xs">No bills match your search.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground">
              <th className="text-left pb-2 font-medium">Supplier</th>
              <th className="text-right pb-2 font-medium">Amount</th>
              <th className="text-center pb-2 font-medium">Status</th>
              <th className="text-right pb-2 font-medium hidden sm:table-cell">Due</th>
              <th className="text-right pb-2 font-medium w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((b) => {
              const eff = effectiveBillStatus(b);
              const sm = BILL_STATUS_MAP[eff] ?? { status: 'gold' as Status, label: eff };
              return (
                <tr key={b.id} onClick={() => openDetail(b)} className="hover:bg-muted/50 cursor-pointer transition-colors group">
                  <td className="py-2.5 font-medium text-foreground text-xs group-hover:text-gold transition-colors">{b.supplier}</td>
                  <td className="py-2.5 text-right font-mono text-xs">{formatPrice(b.amount, currency)}</td>
                  <td className="py-2.5 text-center"><StatusBadge status={sm.status} label={sm.label} /></td>
                  <td className={`py-2.5 text-right text-xs hidden sm:table-cell ${eff === 'overdue' ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                    {eff === 'overdue' ? 'Overdue · ' : ''}{formatDate(b.dueDate)}
                  </td>
                  <td className="py-2.5 text-right" onClick={(ev) => ev.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      {b.status !== 'paid' && (
                        <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => payBill(b)}>
                          <Wallet className="h-3 w-3" /> Pay
                        </Button>
                      )}
                      <button
                        onClick={() => setDeleteTarget(b)}
                        className="p-1 text-muted-foreground hover:text-red-500 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100"
                        aria-label={`Delete bill from ${b.supplier}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Add Bill Dialog */}
      <Dialog open={builderOpen} onOpenChange={(open) => { if (!open) form.reset(); setBuilderOpen(open); }}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Bill</DialogTitle>
            <DialogDescription>Record a supplier bill</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="supplier" render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier *</FormLabel>
                  <FormControl><Input placeholder="Supplier name" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="amount" render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (XOF) *</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-2">
                <FormField control={form.control} name="date" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Received *</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="dueDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due *</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setBuilderOpen(false)} className="flex-1">Cancel</Button>
                <Button type="submit" disabled={isSaving} className="flex-1 bg-gold text-os-dark hover:bg-gold-dark">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <DeleteDialog
        open={!!deleteTarget}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        title="Delete bill?"
        description={`This will permanently delete the bill from ${deleteTarget?.supplier}. This action cannot be undone.`}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteBill(deleteTarget.id);
          addToast('info', '🗑️', 'Bill deleted');
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}

// ── Cash Flow Tab ─────────────────────────────────────────────────
function CashFlowTab({ invoices, expenses, bills }: {
  invoices: Invoice[]; expenses: Expense[]; bills: Bill[];
}) {
  const currency = useAppStore((s) => s.currency);
  const totalInflow = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.paidAmount, 0);
  const unpaidBills = bills.filter(b => b.status !== 'paid').reduce((s, b) => s + b.amount, 0);
  const totalOutflow = expenses.reduce((s, e) => s + e.amount, 0) + unpaidBills;
  const maxVal = Math.max(totalInflow, totalOutflow, 1);
  const net = totalInflow - totalOutflow;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Cash Flow Overview</h3>
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-foreground flex items-center gap-1.5"><ArrowDownRight className="h-3.5 w-3.5 text-emerald-500" /> Inflow (Paid Invoices)</span>
            <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">{formatPrice(totalInflow, currency)}</span>
          </div>
          <div className="h-4 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-emerald-500 transition-all duration-700" style={{ width: `${(totalInflow / maxVal) * 100}%` }} />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-foreground flex items-center gap-1.5"><ArrowUpRight className="h-3.5 w-3.5 text-red-500" /> Outflow (Expenses + Unpaid Bills)</span>
            <span className="text-xs font-mono text-red-500">{formatPrice(totalOutflow, currency)}</span>
          </div>
          <div className="h-4 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-red-500 transition-all duration-700" style={{ width: `${(totalOutflow / maxVal) * 100}%` }} />
          </div>
        </div>
        <div className="pt-2 border-t border-border flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">Net Cash Flow</span>
          <span className={`text-lg font-bold font-mono ${net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>{formatPrice(net, currency)}</span>
        </div>
      </div>
    </div>
  );
}

// ── Budget vs Actual Tab ──────────────────────────────────────────
function BudgetTab({ budgetData }: {
  budgetData: Record<string, import('@/lib/types').BudgetItem>;
}) {
  const currency = useAppStore((s) => s.currency);
  const entries = Object.entries(budgetData);
  const totalBudget = entries.reduce((s, [, v]) => s + v.budget, 0);
  const totalActual = entries.reduce((s, [, v]) => s + v.actual, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Budget vs Actual</h3>
        <div className="text-xs text-muted-foreground">
          Total: {formatPrice(totalActual, currency)} / {formatPrice(totalBudget, currency)}
        </div>
      </div>
      <div className="space-y-4">
        {entries.map(([label, data]) => {
          const pct = data.budget > 0 ? Math.round((data.actual / data.budget) * 100) : 0;
          const over = pct > 100;
          return (
            <div key={label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-foreground">{label}</span>
                <span className={`text-[11px] font-mono ${over ? 'text-red-500 font-bold' : 'text-muted-foreground'}`}>{pct}%</span>
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden relative">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${over ? 'bg-red-500' : 'bg-gold'}`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
              <div className="flex justify-between mt-0.5 text-[10px] text-muted-foreground">
                <span>Actual: {formatPrice(data.actual, currency)}</span>
                <span>Budget: {formatPrice(data.budget, currency)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Recurring Tab ─────────────────────────────────────────────────
type RecurringFormData = { title: string; amount: number; frequency: 'Monthly' | 'Quarterly' | 'Yearly'; nextDate: string };

function advanceNextDate(dateStr: string, frequency: RecurringExpense['frequency']): string {
  const days = frequency === 'Monthly' ? 30 : frequency === 'Quarterly' ? 91 : 365;
  return new Date(new Date(dateStr).getTime() + days * 86400000).toISOString().slice(0, 10);
}

function RecurringTab() {
  const recurringExpenses = useAppStore((s) => s.recurringExpenses);
  const currency = useAppStore((s) => s.currency);
  const saveRecurring = useAppStore((s) => s.saveRecurring);
  const deleteRecurring = useAppStore((s) => s.deleteRecurring);
  const addToast = useAppStore((s) => s.addToast);
  const addActivity = useAppStore((s) => s.addActivity);

  const [builderOpen, setBuilderOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RecurringExpense | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<RecurringFormData>({
    resolver: zodResolver(recurringExpenseSchema) as any,
    defaultValues: { title: '', amount: 0, frequency: 'Monthly', nextDate: PLUS_30_DAYS() },
  });

  const totalMonthly = recurringExpenses.reduce((s, r) => {
    const mult = r.frequency === 'Monthly' ? 1 : r.frequency === 'Quarterly' ? 1 / 3 : 1 / 12;
    return s + r.amount * mult;
  }, 0);

  function postExpense(r: RecurringExpense) {
    const nextDate = advanceNextDate(r.nextDate, r.frequency);
    saveRecurring({ ...r, nextDate });
    addToast('success', '🔁', `${r.title} posted · next ${formatDate(nextDate)}`);
    addActivity({
      id: generateId(), text: 'Recurring expense posted',
      detail: `${r.title} · ${formatPrice(r.amount, currency)}`,
      icon: '🔁', timestamp: getTimestamp(),
    });
  }

  async function onSubmit(data: RecurringFormData) {
    setIsSaving(true);
    try {
      saveRecurring({
        id: generateId(), title: data.title.trim(),
        amount: data.amount, frequency: data.frequency, nextDate: data.nextDate,
      });
      addToast('success', '✅', 'Recurring expense added');
      addActivity({
        id: generateId(), text: 'Recurring expense created',
        detail: `${data.title.trim()} · ${formatPrice(data.amount, currency)} ${data.frequency.toLowerCase()}`,
        icon: '🔁', timestamp: getTimestamp(),
      });
      form.reset({ title: '', amount: 0, frequency: 'Monthly', nextDate: PLUS_30_DAYS() });
      setBuilderOpen(false);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Recurring Expenses ({recurringExpenses.length})</h3>
          <p className="text-[11px] text-muted-foreground">Est. monthly: {formatPrice(Math.round(totalMonthly), currency)}</p>
        </div>
        <Button onClick={() => setBuilderOpen(true)} size="sm" className="bg-gold text-os-dark hover:bg-gold-dark">
          <Plus className="h-3.5 w-3.5" /> Add
        </Button>
      </div>

      {recurringExpenses.length === 0 ? (
        <div className="py-12 text-center space-y-3">
          <p className="text-muted-foreground text-sm">No recurring expenses.</p>
          <Button onClick={() => setBuilderOpen(true)} size="sm" className="bg-gold text-os-dark hover:bg-gold-dark">
            <Plus className="h-3.5 w-3.5" /> Add your first recurring expense
          </Button>
        </div>
      ) : (
        <div className="max-h-80 overflow-y-auto space-y-2">
          {recurringExpenses.map((r) => (
            <div key={r.id} className="group flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors">
              <div>
                <p className="text-sm font-medium text-foreground">{r.title}</p>
                <p className="text-xs text-muted-foreground">{r.frequency} · Next: {formatDate(r.nextDate)}</p>
              </div>
              <div className="flex items-center gap-2" >
                <span className="text-sm font-mono font-bold text-gold">{formatPrice(r.amount, currency)}</span>
                <Button variant="outline" size="sm" className="h-7 px-2 text-xs opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity" onClick={() => postExpense(r)} aria-label={`Post ${r.title}`}>
                  <Repeat className="h-3 w-3" /> Post
                </Button>
                <button
                  onClick={() => setDeleteTarget(r)}
                  className="p-1 text-muted-foreground hover:text-red-500 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100"
                  aria-label={`Delete ${r.title}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Recurring Dialog */}
      <Dialog open={builderOpen} onOpenChange={(open) => { if (!open) form.reset(); setBuilderOpen(open); }}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Recurring Expense</DialogTitle>
            <DialogDescription>Set up a repeating expense</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl><Input placeholder="e.g. Office rent" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-2">
                <FormField control={form.control} name="amount" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (XOF) *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="nextDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Next Date *</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="frequency" render={({ field }) => (
                <FormItem>
                  <FormLabel>Frequency *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                      <SelectItem value="Quarterly">Quarterly</SelectItem>
                      <SelectItem value="Yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setBuilderOpen(false)} className="flex-1">Cancel</Button>
                <Button type="submit" disabled={isSaving} className="flex-1 bg-gold text-os-dark hover:bg-gold-dark">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <DeleteDialog
        open={!!deleteTarget}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        title="Delete recurring expense?"
        description={`This will permanently delete "${deleteTarget?.title}". This action cannot be undone.`}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteRecurring(deleteTarget.id);
          addToast('info', '🗑️', 'Recurring expense deleted');
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}

// ── Tax Tab ───────────────────────────────────────────────────────
function TaxTab({ invoices, expenses }: {
  invoices: Invoice[]; expenses: Expense[];
}) {
  const currency = useAppStore((s) => s.currency);
  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.paidAmount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const vatRate = 0.18;
  const estimatedVAT = Math.round(totalRevenue * vatRate);
  const corporateTax = Math.max(0, Math.round((totalRevenue - totalExpenses) * 0.15));

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Tax Estimates</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">Revenue (Gross)</p>
          <p className="text-lg font-bold font-mono text-foreground">{formatPrice(totalRevenue, currency)}</p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">Est. VAT Collected (18%)</p>
          <p className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400">{formatPrice(estimatedVAT, currency)}</p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">Est. Corporate Tax (15%)</p>
          <p className={`text-lg font-bold font-mono ${corporateTax > 0 ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>{formatPrice(corporateTax, currency)}</p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">* Estimates based on current data. Consult a tax advisor for actual obligations.</p>
    </div>
  );
}
