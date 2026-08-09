'use client';

import { useState, useMemo } from 'react';
import {
  Plus, Trash2, TrendingUp, TrendingDown, DollarSign,
  Receipt, FileText, ArrowUpRight, ArrowDownRight, Repeat, Calculator,
} from 'lucide-react';
import { useAppStore, formatPrice, formatDate, generateId, getTimestamp } from '@/lib/store';
import { StatusBadge } from '@/components/shared/status-badge';
import type { Status, Expense, Invoice, Bill, RecurringExpense } from '@/lib/types';

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

const EXPENSE_STATUS_MAP: Record<string, { status: Status; label: string }> = {
  Approved: { status: 'green', label: 'Approved' },
  Pending: { status: 'gold', label: 'Pending' },
  Rejected: { status: 'red', label: 'Rejected' },
};

const INVOICE_STATUS_MAP: Record<string, { status: Status; label: string }> = {
  Paid: { status: 'green', label: 'Paid' },
  Pending: { status: 'gold', label: 'Pending' },
  Overdue: { status: 'red', label: 'Overdue' },
  Draft: { status: 'blue', label: 'Draft' },
};

const BILL_STATUS_MAP: Record<string, { status: Status; label: string }> = {
  Paid: { status: 'green', label: 'Paid' },
  Pending: { status: 'gold', label: 'Pending' },
  Overdue: { status: 'red', label: 'Overdue' },
};

export function FinanceView() {
  const [activeTab, setActiveTab] = useState<FinanceTab>('expenses');
  const expenses = useAppStore((s) => s.expenses);
  const invoices = useAppStore((s) => s.invoices);
  const bills = useAppStore((s) => s.bills);
  const recurringExpenses = useAppStore((s) => s.recurringExpenses);
  const budgetData = useAppStore((s) => s.budgetData);
  const currency = useAppStore((s) => s.currency);
  const setExpenses = useAppStore((s) => s.setExpenses);
  const setInvoices = useAppStore((s) => s.setInvoices);
  const setBills = useAppStore((s) => s.setBills);
  const setRecurringExpenses = useAppStore((s) => s.setRecurringExpenses);
  const addToast = useAppStore((s) => s.addToast);
  const addActivity = useAppStore((s) => s.addActivity);
  const service = useAppStore((s) => s._service);

  // Summary cards
  const totalRevenue = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + i.paidAmount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;
  const arOutstanding = invoices.filter(i => i.status !== 'Paid').reduce((s, i) => s + (i.amount - i.paidAmount), 0);

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
        {activeTab === 'expenses' && (
          <ExpensesTab expenses={expenses} currency={currency} onDelete={(id) => {
            service?.deleteExpense(id);
            setExpenses(expenses.filter(e => e.id !== id));
            addToast('info', '🗑️', 'Expense deleted');
          }} onAdd={(exp) => {
            service?.addExpense(exp);
            setExpenses([...expenses, exp]);
            addActivity({ id: generateId(), text: 'Expense added', detail: exp.title, icon: '💰', timestamp: getTimestamp() });
            addToast('success', '✅', 'Expense added');
          }} />
        )}
        {activeTab === 'invoices' && (
          <InvoicesTab invoices={invoices} currency={currency} onAdd={(inv) => {
            service?.addInvoice(inv);
            setInvoices([...invoices, inv]);
            addToast('success', '✅', 'Invoice added');
          }} />
        )}
        {activeTab === 'bills' && (
          <BillsTab bills={bills} currency={currency} onAdd={(bill) => {
            service?.addBill(bill);
            setBills([...bills, bill]);
            addToast('success', '✅', 'Bill added');
          }} />
        )}
        {activeTab === 'cashflow' && <CashFlowTab invoices={invoices} expenses={expenses} currency={currency} />}
        {activeTab === 'budget' && <BudgetTab budgetData={budgetData} currency={currency} />}
        {activeTab === 'recurring' && (
          <RecurringTab recurringExpenses={recurringExpenses} currency={currency} setRecurringExpenses={setRecurringExpenses} addToast={addToast} />
        )}
        {activeTab === 'tax' && <TaxTab invoices={invoices} expenses={expenses} currency={currency} />}
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

// ── Expenses Tab ──────────────────────────────────────────────────
function ExpensesTab({ expenses, currency, onDelete, onAdd }: {
  expenses: Expense[]; currency: string; onDelete: (id: string) => void; onAdd: (e: Expense) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Operations');

  function handleAdd() {
    if (!title.trim() || !amount) { return; }
    onAdd({
      id: generateId(), title: title.trim(),
      amount: parseInt(amount, 10) || 0, category,
      date: new Date().toISOString().slice(0, 10),
      status: 'Pending', approval: 'Pending', createdBy: 'Moussa',
    });
    setTitle(''); setAmount(''); setShowForm(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Expenses ({expenses.length})</h3>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 rounded-lg bg-gold text-os-dark px-3 py-1.5 text-xs font-medium hover:bg-gold-dark transition-colors">
          <Plus className="h-3.5 w-3.5" /> Add Expense
        </button>
      </div>
      {showForm && (
        <div className="os-inline-form flex flex-col sm:flex-row gap-2 p-3 rounded-lg bg-muted/50 border border-border">
          <input type="text" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          <input type="number" placeholder="Amount (XOF)" value={amount} onChange={e => setAmount(e.target.value)} className="w-40 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          <select value={category} onChange={e => setCategory(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option>Operations</option><option>Logistics</option><option>Installation</option><option>Admin</option><option>Marketing</option>
          </select>
          <button onClick={handleAdd} className="rounded-lg bg-gold text-os-dark px-4 py-2 text-sm font-medium hover:bg-gold-dark transition-colors">Save</button>
        </div>
      )}
      <div className="max-h-80 overflow-y-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground">
              <th className="text-left pb-2 font-medium">Title</th>
              <th className="text-left pb-2 font-medium hidden sm:table-cell">Category</th>
              <th className="text-right pb-2 font-medium">Amount</th>
              <th className="text-center pb-2 font-medium">Status</th>
              <th className="text-right pb-2 font-medium hidden md:table-cell">Date</th>
              <th className="text-right pb-2 font-medium w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {expenses.map((e) => {
              const sm = EXPENSE_STATUS_MAP[e.status] || EXPENSE_STATUS_MAP['Pending'];
              return (
                <tr key={e.id} className="hover:bg-muted/50 transition-colors">
                  <td className="py-2.5 font-medium text-foreground text-xs">{e.title}</td>
                  <td className="py-2.5 text-muted-foreground text-xs hidden sm:table-cell">{e.category}</td>
                  <td className="py-2.5 text-right font-mono text-xs">{formatPrice(e.amount, currency as import('@/lib/types').Currency)}</td>
                  <td className="py-2.5 text-center"><StatusBadge status={sm.status} label={sm.label} /></td>
                  <td className="py-2.5 text-right text-xs text-muted-foreground hidden md:table-cell">{formatDate(e.date)}</td>
                  <td className="py-2.5 text-right">
                    <button onClick={() => onDelete(e.id)} className="p-1 text-muted-foreground hover:text-red-500 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                  </td>
                </tr>
              );
            })}
            {expenses.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-muted-foreground text-xs">No expenses recorded</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Invoices Tab ──────────────────────────────────────────────────
function InvoicesTab({ invoices, currency, onAdd }: {
  invoices: Invoice[]; currency: string; onAdd: (i: Invoice) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [client, setClient] = useState('');
  const [amount, setAmount] = useState('');

  function handleAdd() {
    if (!client.trim() || !amount) return;
    onAdd({
      id: generateId(), client: client.trim(),
      amount: parseInt(amount, 10) || 0,
      date: new Date().toISOString().slice(0, 10),
      status: 'Pending', dueDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      paidAmount: 0,
    });
    setClient(''); setAmount(''); setShowForm(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Invoices ({invoices.length})</h3>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 rounded-lg bg-gold text-os-dark px-3 py-1.5 text-xs font-medium hover:bg-gold-dark transition-colors">
          <Plus className="h-3.5 w-3.5" /> Add Invoice
        </button>
      </div>
      {showForm && (
        <div className="os-inline-form flex flex-col sm:flex-row gap-2 p-3 rounded-lg bg-muted/50 border border-border">
          <input type="text" placeholder="Client" value={client} onChange={e => setClient(e.target.value)} className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          <input type="number" placeholder="Amount (XOF)" value={amount} onChange={e => setAmount(e.target.value)} className="w-40 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          <button onClick={handleAdd} className="rounded-lg bg-gold text-os-dark px-4 py-2 text-sm font-medium hover:bg-gold-dark transition-colors">Save</button>
        </div>
      )}
      <div className="max-h-80 overflow-y-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground">
              <th className="text-left pb-2 font-medium">Client</th>
              <th className="text-right pb-2 font-medium">Amount</th>
              <th className="text-center pb-2 font-medium">Status</th>
              <th className="text-right pb-2 font-medium hidden sm:table-cell">Due</th>
              <th className="text-right pb-2 font-medium hidden md:table-cell">Paid</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {invoices.map((inv) => {
              const sm = INVOICE_STATUS_MAP[inv.status] || INVOICE_STATUS_MAP['Draft'];
              return (
                <tr key={inv.id} className="hover:bg-muted/50 transition-colors">
                  <td className="py-2.5 font-medium text-foreground text-xs">{inv.client}</td>
                  <td className="py-2.5 text-right font-mono text-xs">{formatPrice(inv.amount, currency as import('@/lib/types').Currency)}</td>
                  <td className="py-2.5 text-center"><StatusBadge status={sm.status} label={sm.label} /></td>
                  <td className="py-2.5 text-right text-xs text-muted-foreground hidden sm:table-cell">{formatDate(inv.dueDate)}</td>
                  <td className="py-2.5 text-right font-mono text-xs text-emerald-600 dark:text-emerald-400 hidden md:table-cell">{formatPrice(inv.paidAmount, currency as import('@/lib/types').Currency)}</td>
                </tr>
              );
            })}
            {invoices.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-muted-foreground text-xs">No invoices recorded</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Bills Tab ─────────────────────────────────────────────────────
function BillsTab({ bills, currency, onAdd }: {
  bills: Bill[]; currency: string; onAdd: (b: Bill) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [supplier, setSupplier] = useState('');
  const [amount, setAmount] = useState('');

  function handleAdd() {
    if (!supplier.trim() || !amount) return;
    onAdd({
      id: generateId(), supplier: supplier.trim(),
      amount: parseInt(amount, 10) || 0,
      date: new Date().toISOString().slice(0, 10),
      status: 'Pending', dueDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    });
    setSupplier(''); setAmount(''); setShowForm(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Bills ({bills.length})</h3>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 rounded-lg bg-gold text-os-dark px-3 py-1.5 text-xs font-medium hover:bg-gold-dark transition-colors">
          <Plus className="h-3.5 w-3.5" /> Add Bill
        </button>
      </div>
      {showForm && (
        <div className="os-inline-form flex flex-col sm:flex-row gap-2 p-3 rounded-lg bg-muted/50 border border-border">
          <input type="text" placeholder="Supplier" value={supplier} onChange={e => setSupplier(e.target.value)} className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          <input type="number" placeholder="Amount (XOF)" value={amount} onChange={e => setAmount(e.target.value)} className="w-40 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          <button onClick={handleAdd} className="rounded-lg bg-gold text-os-dark px-4 py-2 text-sm font-medium hover:bg-gold-dark transition-colors">Save</button>
        </div>
      )}
      <div className="max-h-80 overflow-y-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground">
              <th className="text-left pb-2 font-medium">Supplier</th>
              <th className="text-right pb-2 font-medium">Amount</th>
              <th className="text-center pb-2 font-medium">Status</th>
              <th className="text-right pb-2 font-medium hidden sm:table-cell">Due</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {bills.map((b) => {
              const sm = BILL_STATUS_MAP[b.status] || BILL_STATUS_MAP['Pending'];
              return (
                <tr key={b.id} className="hover:bg-muted/50 transition-colors">
                  <td className="py-2.5 font-medium text-foreground text-xs">{b.supplier}</td>
                  <td className="py-2.5 text-right font-mono text-xs">{formatPrice(b.amount, currency as import('@/lib/types').Currency)}</td>
                  <td className="py-2.5 text-center"><StatusBadge status={sm.status} label={sm.label} /></td>
                  <td className="py-2.5 text-right text-xs text-muted-foreground hidden sm:table-cell">{formatDate(b.dueDate)}</td>
                </tr>
              );
            })}
            {bills.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-muted-foreground text-xs">No bills recorded</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Cash Flow Tab ─────────────────────────────────────────────────
function CashFlowTab({ invoices, expenses, currency }: {
  invoices: Invoice[]; expenses: Expense[]; currency: string;
}) {
  const totalInflow = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + i.paidAmount, 0);
  const totalOutflow = expenses.reduce((s, e) => s + e.amount, 0);
  const maxVal = Math.max(totalInflow, totalOutflow, 1);
  const net = totalInflow - totalOutflow;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Cash Flow Overview</h3>
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-foreground flex items-center gap-1.5"><ArrowDownRight className="h-3.5 w-3.5 text-emerald-500" /> Inflow (Paid Invoices)</span>
            <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">{formatPrice(totalInflow, currency as import('@/lib/types').Currency)}</span>
          </div>
          <div className="h-4 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-emerald-500 transition-all duration-700" style={{ width: `${(totalInflow / maxVal) * 100}%` }} />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-foreground flex items-center gap-1.5"><ArrowUpRight className="h-3.5 w-3.5 text-red-500" /> Outflow (Expenses)</span>
            <span className="text-xs font-mono text-red-500">{formatPrice(totalOutflow, currency as import('@/lib/types').Currency)}</span>
          </div>
          <div className="h-4 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-red-500 transition-all duration-700" style={{ width: `${(totalOutflow / maxVal) * 100}%` }} />
          </div>
        </div>
        <div className="pt-2 border-t border-border flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">Net Cash Flow</span>
          <span className={`text-lg font-bold font-mono ${net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>{formatPrice(net, currency as import('@/lib/types').Currency)}</span>
        </div>
      </div>
    </div>
  );
}

// ── Budget vs Actual Tab ──────────────────────────────────────────
function BudgetTab({ budgetData, currency }: {
  budgetData: Record<string, import('@/lib/types').BudgetItem>; currency: string;
}) {
  const entries = Object.entries(budgetData);
  const totalBudget = entries.reduce((s, [, v]) => s + v.budget, 0);
  const totalActual = entries.reduce((s, [, v]) => s + v.actual, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Budget vs Actual</h3>
        <div className="text-xs text-muted-foreground">
          Total: {formatPrice(totalActual, currency as import('@/lib/types').Currency)} / {formatPrice(totalBudget, currency as import('@/lib/types').Currency)}
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
                <span>Actual: {formatPrice(data.actual, currency as import('@/lib/types').Currency)}</span>
                <span>Budget: {formatPrice(data.budget, currency as import('@/lib/types').Currency)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Recurring Tab ─────────────────────────────────────────────────
function RecurringTab({ recurringExpenses, currency, setRecurringExpenses, addToast }: {
  recurringExpenses: RecurringExpense[]; currency: string;
  setRecurringExpenses: (r: RecurringExpense[]) => void;
  addToast: (t: import('@/lib/types').ToastType, i: string, m: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<'Monthly' | 'Quarterly' | 'Yearly'>('Monthly');

  function handleAdd() {
    if (!title.trim() || !amount) return;
    const re: RecurringExpense = {
      id: generateId(), title: title.trim(),
      amount: parseInt(amount, 10) || 0, frequency,
      nextDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    };
    setRecurringExpenses([...recurringExpenses, re]);
    addToast('success', '✅', 'Recurring expense added');
    setTitle(''); setAmount(''); setShowForm(false);
  }

  const totalMonthly = recurringExpenses.reduce((s, r) => {
    const mult = r.frequency === 'Monthly' ? 1 : r.frequency === 'Quarterly' ? 1 / 3 : 1 / 12;
    return s + r.amount * mult;
  }, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Recurring Expenses ({recurringExpenses.length})</h3>
          <p className="text-[11px] text-muted-foreground">Est. monthly: {formatPrice(Math.round(totalMonthly), currency as import('@/lib/types').Currency)}</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 rounded-lg bg-gold text-os-dark px-3 py-1.5 text-xs font-medium hover:bg-gold-dark transition-colors">
          <Plus className="h-3.5 w-3.5" /> Add
        </button>
      </div>
      {showForm && (
        <div className="os-inline-form flex flex-col sm:flex-row gap-2 p-3 rounded-lg bg-muted/50 border border-border">
          <input type="text" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          <input type="number" placeholder="Amount (XOF)" value={amount} onChange={e => setAmount(e.target.value)} className="w-40 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          <select value={frequency} onChange={e => setFrequency(e.target.value as 'Monthly' | 'Quarterly' | 'Yearly')} className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option>Monthly</option><option>Quarterly</option><option>Yearly</option>
          </select>
          <button onClick={handleAdd} className="rounded-lg bg-gold text-os-dark px-4 py-2 text-sm font-medium hover:bg-gold-dark transition-colors">Save</button>
        </div>
      )}
      <div className="max-h-80 overflow-y-auto space-y-2">
        {recurringExpenses.map((r) => (
          <div key={r.id} className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors">
            <div>
              <p className="text-sm font-medium text-foreground">{r.title}</p>
              <p className="text-xs text-muted-foreground">{r.frequency} · Next: {formatDate(r.nextDate)}</p>
            </div>
            <span className="text-sm font-mono font-bold text-gold">{formatPrice(r.amount, currency as import('@/lib/types').Currency)}</span>
          </div>
        ))}
        {recurringExpenses.length === 0 && <p className="text-center text-muted-foreground text-xs py-8">No recurring expenses</p>}
      </div>
    </div>
  );
}

// ── Tax Tab ───────────────────────────────────────────────────────
function TaxTab({ invoices, expenses, currency }: {
  invoices: Invoice[]; expenses: Expense[]; currency: string;
}) {
  const totalRevenue = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + i.paidAmount, 0);
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
          <p className="text-lg font-bold font-mono text-foreground">{formatPrice(totalRevenue, currency as import('@/lib/types').Currency)}</p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">Est. VAT Collected (18%)</p>
          <p className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400">{formatPrice(estimatedVAT, currency as import('@/lib/types').Currency)}</p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">Est. Corporate Tax (15%)</p>
          <p className={`text-lg font-bold font-mono ${corporateTax > 0 ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>{formatPrice(corporateTax, currency as import('@/lib/types').Currency)}</p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">* Estimates based on current data. Consult a tax advisor for actual obligations.</p>
    </div>
  );
}
