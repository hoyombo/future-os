'use client';

import { useState } from 'react';
import {
  FileText, TrendingUp, DollarSign, Calculator, Download,
} from 'lucide-react';
import { useAppStore, formatPrice } from '@/lib/store';

type ReportType = 'pnl' | 'balance' | 'cashflow' | 'tax' | 'csv';

interface ReportCard {
  id: ReportType;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const REPORTS: ReportCard[] = [
  { id: 'pnl', label: 'P&L Statement', description: 'Profit & Loss overview for the current period', icon: <FileText className="h-5 w-5 text-gold" /> },
  { id: 'balance', label: 'Balance Sheet', description: 'Assets, liabilities, and equity summary', icon: <Calculator className="h-5 w-5 text-sky-500" /> },
  { id: 'cashflow', label: 'Cash Flow Report', description: 'Inflow and outflow analysis', icon: <TrendingUp className="h-5 w-5 text-emerald-500" /> },
  { id: 'tax', label: 'Tax Summary', description: 'VAT and corporate tax estimates', icon: <DollarSign className="h-5 w-5 text-amber-500" /> },
  { id: 'csv', label: 'Export CSV', description: 'Download all data as CSV', icon: <Download className="h-5 w-5 text-purple-500" /> },
];

export function ReportsView() {
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const expenses = useAppStore((s) => s.expenses);
  const invoices = useAppStore((s) => s.invoices);
  const products = useAppStore((s) => s.products);
  const budgetData = useAppStore((s) => s.budgetData);
  const currency = useAppStore((s) => s.currency);
  const addToast = useAppStore((s) => s.addToast);

  const totalRevenue = invoices.filter((i) => i.status === 'Paid').reduce((s, i) => s + i.paidAmount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const grossProfit = totalRevenue - totalExpenses;
  const opex = totalExpenses;
  const netProfit = grossProfit;
  const totalBudget = Object.values(budgetData).reduce((s, v) => s + v.budget, 0);
  const totalActual = Object.values(budgetData).reduce((s, v) => s + v.actual, 0);
  const inventoryValue = products.reduce((s, p) => s + p.price * p.inStock, 0);

  function getReportContent(): React.ReactNode {
    switch (selectedReport) {
      case 'pnl':
        return (
          <div className="space-y-3">
            <h3 className="text-base font-bold text-foreground">Profit & Loss Statement</h3>
            <div className="space-y-2">
              <ReportLine label="Total Revenue" value={totalRevenue} bold />
              <ReportLine label="Cost of Goods Sold" value={Math.round(totalExpenses * 0.6)} indent />
              <ReportLine label="Gross Profit" value={grossProfit} bold separator />
              <ReportLine label="Operating Expenses" value={opex} indent />
              <ReportLine label="Net Profit" value={netProfit} bold highlight />
            </div>
          </div>
        );
      case 'balance':
        return (
          <div className="space-y-3">
            <h3 className="text-base font-bold text-foreground">Balance Sheet</h3>
            <div className="space-y-2">
              <ReportLine label="Inventory Value" value={inventoryValue} bold />
              <ReportLine label="Accounts Receivable" value={invoices.filter(i => i.status !== 'Paid').reduce((s, i) => s + (i.amount - i.paidAmount), 0)} bold />
              <ReportLine label="Total Assets" value={inventoryValue + invoices.filter(i => i.status !== 'Paid').reduce((s, i) => s + (i.amount - i.paidAmount), 0)} bold separator />
              <ReportLine label="Accounts Payable" value={totalExpenses} bold />
              <ReportLine label="Total Budget Allocated" value={totalBudget} bold />
            </div>
          </div>
        );
      case 'cashflow':
        return (
          <div className="space-y-3">
            <h3 className="text-base font-bold text-foreground">Cash Flow Report</h3>
            <div className="space-y-2">
              <ReportLine label="Cash Inflow (Paid Invoices)" value={totalRevenue} bold positive />
              <ReportLine label="Cash Outflow (Expenses)" value={totalExpenses} bold negative />
              <ReportLine label="Net Cash Flow" value={totalRevenue - totalExpenses} bold highlight separator />
              <div className="mt-3">
                <p className="text-xs text-muted-foreground mb-1">Budget Utilization</p>
                <div className="h-3 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-gold transition-all duration-700" style={{ width: `${totalBudget > 0 ? Math.min(Math.round((totalActual / totalBudget) * 100), 100) : 0}%` }} />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">{formatPrice(totalActual, currency)} of {formatPrice(totalBudget, currency)} ({totalBudget > 0 ? Math.round((totalActual / totalBudget) * 100) : 0}%)</p>
              </div>
            </div>
          </div>
        );
      case 'tax':
        return (
          <div className="space-y-3">
            <h3 className="text-base font-bold text-foreground">Tax Summary</h3>
            <div className="space-y-2">
              <ReportLine label="Gross Revenue" value={totalRevenue} bold />
              <ReportLine label="Est. VAT Collected (18%)" value={Math.round(totalRevenue * 0.18)} indent />
              <ReportLine label="Est. Corporate Tax (15%)" value={Math.max(0, Math.round(netProfit * 0.15))} indent />
              <ReportLine label="Total Tax Estimate" value={Math.round(totalRevenue * 0.18) + Math.max(0, Math.round(netProfit * 0.15))} bold separator />
            </div>
            <p className="text-xs text-muted-foreground">* Consult a tax advisor for actual obligations.</p>
          </div>
        );
      case 'csv':
        return (
          <div className="space-y-3">
            <h3 className="text-base font-bold text-foreground">Export Data</h3>
            <p className="text-sm text-muted-foreground">Click below to download all current data as CSV files.</p>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => downloadCSV('products', ['Name,Supplier,Category,Cost,Price,InStock,TotalStock', ...products.map(p => `"${p.name}","${p.supplier}","${p.category}",${p.cost},${p.price},${p.inStock},${p.stock}`)])} className="rounded-lg bg-muted px-3 py-2 text-xs font-medium hover:bg-secondary transition-colors">Products</button>
              <button onClick={() => downloadCSV('projects', ['Name,Client,Budget,Spent,Status', ...useAppStore.getState().projects.map(p => `"${p.name}","${p.client}",${p.budget},${p.spent},"${p.status}"`)])} className="rounded-lg bg-muted px-3 py-2 text-xs font-medium hover:bg-secondary transition-colors">Projects</button>
              <button onClick={() => downloadCSV('expenses', ['Title,Amount,Category,Status,Date', ...expenses.map(e => `"${e.title}",${e.amount},"${e.category}","${e.status}","${e.date}"`)])} className="rounded-lg bg-muted px-3 py-2 text-xs font-medium hover:bg-secondary transition-colors">Expenses</button>
              <button onClick={() => downloadCSV('invoices', ['Client,Amount,Status,DueDate', ...invoices.map(i => `"${i.client}",${i.amount},"${i.status}","${i.dueDate}"`)])} className="rounded-lg bg-muted px-3 py-2 text-xs font-medium hover:bg-secondary transition-colors">Invoices</button>
            </div>
          </div>
        );
      default:
        return null;
    }
  }

  return (
    <div className="animate-fade-up space-y-4">
      <h2 className="text-lg font-bold text-foreground">Reports & Analytics</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {REPORTS.map((r) => (
          <button
            key={r.id}
            onClick={() => setSelectedReport(selectedReport === r.id ? null : r.id)}
            className={`text-left rounded-xl border p-4 hover:shadow-md transition-all ${selectedReport === r.id ? 'border-gold bg-gold/5' : 'border-border bg-card'}`}
          >
            <div className="mb-3">{r.icon}</div>
            <h3 className="text-sm font-semibold text-foreground">{r.label}</h3>
            <p className="text-xs text-muted-foreground mt-1">{r.description}</p>
          </button>
        ))}
      </div>

      {selectedReport && (
        <div className="rounded-xl border border-border bg-card p-5 animate-fade-up">
          {getReportContent()}
        </div>
      )}
    </div>
  );
}

function ReportLine({ label, value, bold, indent, separator, highlight, positive, negative }: {
  label: string; value: number; bold?: boolean; indent?: boolean; separator?: boolean; highlight?: boolean; positive?: boolean; negative?: boolean;
}) {
  const currency = useAppStore((s) => s.currency);
  return (
    <div className={`flex items-center justify-between ${indent ? 'pl-6' : ''} ${separator ? 'pt-2 border-t border-border mt-2' : 'py-0.5'}`}>
      <span className={`text-sm ${bold ? 'font-semibold' : ''} text-foreground`}>{label}</span>
      <span className={`text-sm font-mono ${bold ? 'font-bold' : ''} ${highlight ? 'text-gold' : positive ? 'text-emerald-600 dark:text-emerald-400' : negative ? 'text-red-500' : 'text-foreground'}`}>
        {formatPrice(value, currency)}
      </span>
    </div>
  );
}

function downloadCSV(name: string, rows: string[]) {
  const csv = rows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `future_os_${name}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
