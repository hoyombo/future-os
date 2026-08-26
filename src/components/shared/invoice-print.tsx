'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer } from 'lucide-react';
import { useAppStore, formatPrice, formatDate } from '@/lib/store';
import { Button } from '@/components/ui/button';
import type { Invoice } from '@/lib/types';

// ── Public types ─────────────────────────────────────────────────

export interface StatementGroup {
  client: string;
  invoices: Invoice[];
}

export type InvoicePrintRequest =
  | { kind: 'single'; invoice: Invoice }
  | { kind: 'multi'; invoices: Invoice[] }
  | { kind: 'statement'; groups: StatementGroup[] };

// ── Aging helpers (shared with finance view) ─────────────────────

const DAY_MS = 86400000;

export function daysOverdue(dueDate: string): number {
  const diff = Math.floor((Date.now() - new Date(dueDate).getTime()) / DAY_MS);
  return diff > 0 ? diff : 0;
}

/** 'current' | 'd30' | 'd60' | 'd60p' — paid invoices bucket to 'current' */
export function agingKey(inv: Invoice): 'current' | 'd30' | 'd60' | 'd60p' {
  if (inv.status === 'paid') return 'current';
  const d = daysOverdue(inv.dueDate);
  if (d <= 0) return 'current';
  if (d <= 30) return 'd30';
  if (d <= 60) return 'd60';
  return 'd60p';
}

export const AGING_LABELS: Record<string, string> = {
  current: 'Current',
  d30: '1–30d',
  d60: '31–60d',
  d60p: '60+d',
};

function balanceOf(inv: Invoice): number {
  return inv.status === 'paid' ? 0 : Math.max(0, inv.amount - inv.paidAmount);
}

// ── Letterhead ───────────────────────────────────────────────────

function Letterhead({ docTitle }: { docTitle: string }) {
  return (
    <div className="print-break-inside-avoid border-b-2 border-[#c8a45c] pb-4 mb-6 flex items-start justify-between">
      <div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-[#c8a45c] flex items-center justify-center text-white font-black text-sm">
            FC
          </div>
          <span className="text-xl font-black tracking-tight text-black">FUTURE CONCEPT</span>
        </div>
        <p className="text-xs text-neutral-500 mt-1">Mobilier de bureau · Aménagement d&apos;espaces · Bamako, Mali</p>
        <p className="text-xs text-neutral-500">Tél: +223 XX XX XX XX · contact@future-concept.net</p>
      </div>
      <div className="text-right">
        <p className="text-lg font-bold uppercase tracking-wide text-[#c8a45c]">{docTitle}</p>
        <p className="text-xs text-neutral-500 mt-1">Émis le {formatDate(new Date().toISOString())}</p>
      </div>
    </div>
  );
}

// ── Single invoice sheet ─────────────────────────────────────────

function InvoiceSheet({ invoice }: { invoice: Invoice }) {
  const currency = useAppStore((s) => s.currency);
  const balance = balanceOf(invoice);
  const hasItems = Array.isArray(invoice.items) && invoice.items.length > 0;

  return (
    <div className={invoiceSheetClass}>
      <Letterhead docTitle="Facture" />
      <div className="grid grid-cols-2 gap-6 mb-6 print-break-inside-avoid">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-neutral-400 mb-1">Client</p>
          <p className="text-base font-bold text-black">{invoice.client}</p>
        </div>
        <div className="text-right text-sm">
          <p className="text-neutral-600">Facture <span className="font-mono font-bold text-black">{invoice.id.toUpperCase()}</span></p>
          <p className="text-neutral-600">Date: <span className="text-black">{formatDate(invoice.date)}</span></p>
          <p className="text-neutral-600">Échéance: <span className="text-black">{formatDate(invoice.dueDate)}</span></p>
        </div>
      </div>

      <table className="w-full text-sm border-collapse mb-6">
        <thead>
          <tr className="bg-neutral-100 text-left">
            <th className="px-3 py-2 font-semibold text-black">Description</th>
            {hasItems && <th className="px-3 py-2 font-semibold text-black text-right">Qté</th>}
            {hasItems && <th className="px-3 py-2 font-semibold text-black text-right">P.U.</th>}
            <th className="px-3 py-2 font-semibold text-black text-right">Montant</th>
          </tr>
        </thead>
        <tbody>
          {hasItems ? (
            <>
              {invoice.items.map((item, i) => (
                <tr key={i} className="border-b border-neutral-200">
                  <td className="px-3 py-2 text-black">{item.description}</td>
                  <td className="px-3 py-2 text-right text-black">{item.qty}</td>
                  <td className="px-3 py-2 text-right font-mono text-black">{formatPrice(item.unitPrice, currency)}</td>
                  <td className="px-3 py-2 text-right font-mono text-black">{formatPrice(item.qty * item.unitPrice, currency)}</td>
                </tr>
              ))}
              <tr className="border-b border-neutral-200">
                <td colSpan={3} className="px-3 py-2 text-right text-neutral-600">Total facturé</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-black">{formatPrice(invoice.amount, currency)}</td>
              </tr>
            </>
          ) : (
            <>
              <tr className="border-b border-neutral-200">
                <td className="px-3 py-3 text-black">Fourniture et aménagement — {invoice.client}</td>
                <td className="px-3 py-3 text-right font-mono text-black">{formatPrice(invoice.amount, currency)}</td>
              </tr>
              <tr className="border-b border-neutral-200">
                <td className="px-3 py-2 text-right text-neutral-600">Total facturé</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-black">{formatPrice(invoice.amount, currency)}</td>
              </tr>
            </>
          )}
          <tr className="border-b border-neutral-200">
            <td colSpan={hasItems ? 3 : 1} className="px-3 py-2 text-right text-neutral-600">Déjà payé</td>
            <td className="px-3 py-2 text-right font-mono text-emerald-700">{formatPrice(invoice.paidAmount, currency)}</td>
          </tr>
          <tr>
            <td colSpan={hasItems ? 3 : 1} className="px-3 py-2 text-right font-bold text-black">Solde dû</td>
            <td className={`px-3 py-2 text-right font-mono font-black ${balance > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
              {formatPrice(balance, currency)}
            </td>
          </tr>
        </tbody>
      </table>

      {balance > 0 && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-black print-break-inside-avoid">
          <span className="font-bold">Vente à crédit.</span> Merci de régler le solde de{' '}
          <span className="font-mono font-bold">{formatPrice(balance, currency)}</span> avant le{' '}
          <span className="font-bold">{formatDate(invoice.dueDate)}</span>.
        </div>
      )}

      <div className="mt-10 pt-4 border-t border-neutral-200 flex justify-between text-[10px] text-neutral-400">
        <span>Future Concept · Bamako, Mali</span>
        <span>Facture {invoice.id.toUpperCase()}</span>
      </div>
    </div>
  );
}

// ── Client statement sheet ───────────────────────────────────────

function StatementSheet({ group }: { group: StatementGroup }) {
  const currency = useAppStore((s) => s.currency);
  const totalInvoiced = group.invoices.reduce((s, i) => s + i.amount, 0);
  const totalPaid = group.invoices.reduce((s, i) => s + i.paidAmount, 0);
  const totalBalance = group.invoices.reduce((s, i) => s + balanceOf(i), 0);

  // Aging summary over unpaid invoices
  const buckets = { current: 0, d30: 0, d60: 0, d60p: 0 };
  for (const inv of group.invoices) buckets[agingKey(inv)] += balanceOf(inv);

  return (
    <div className={invoiceSheetClass}>
      <Letterhead docTitle="Relevé de compte" />
      <div className="mb-5 print-break-inside-avoid">
        <p className="text-[10px] uppercase tracking-wider text-neutral-400 mb-1">Client</p>
        <p className="text-base font-bold text-black">{group.client}</p>
      </div>

      <table className="w-full text-sm border-collapse mb-6">
        <thead>
          <tr className="bg-neutral-100 text-left">
            <th className="px-3 py-2 font-semibold text-black">Facture</th>
            <th className="px-3 py-2 font-semibold text-black">Date</th>
            <th className="px-3 py-2 font-semibold text-black">Échéance</th>
            <th className="px-3 py-2 font-semibold text-black text-right">Montant</th>
            <th className="px-3 py-2 font-semibold text-black text-right">Payé</th>
            <th className="px-3 py-2 font-semibold text-black text-right">Solde</th>
          </tr>
        </thead>
        <tbody>
          {group.invoices.map((inv) => {
            const bal = balanceOf(inv);
            return (
              <tr key={inv.id} className="border-b border-neutral-200">
                <td className="px-3 py-2 font-mono text-black">{inv.id.toUpperCase()}</td>
                <td className="px-3 py-2 text-black">{formatDate(inv.date)}</td>
                <td className="px-3 py-2 text-black">{formatDate(inv.dueDate)}</td>
                <td className="px-3 py-2 text-right font-mono text-black">{formatPrice(inv.amount, currency)}</td>
                <td className="px-3 py-2 text-right font-mono text-emerald-700">{formatPrice(inv.paidAmount, currency)}</td>
                <td className={`px-3 py-2 text-right font-mono font-bold ${bal > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                  {formatPrice(bal, currency)}
                </td>
              </tr>
            );
          })}
          <tr className="bg-neutral-50">
            <td colSpan={3} className="px-3 py-2 text-right font-bold text-black">Totaux</td>
            <td className="px-3 py-2 text-right font-mono font-bold text-black">{formatPrice(totalInvoiced, currency)}</td>
            <td className="px-3 py-2 text-right font-mono font-bold text-emerald-700">{formatPrice(totalPaid, currency)}</td>
            <td className="px-3 py-2 text-right font-mono font-black text-red-700">{formatPrice(totalBalance, currency)}</td>
          </tr>
        </tbody>
      </table>

      {/* Aging summary */}
      <div className="print-break-inside-avoid">
        <p className="text-[10px] uppercase tracking-wider text-neutral-400 mb-2">Ancienneté des créances (solde dû)</p>
        <div className="grid grid-cols-4 gap-2 text-center">
          {(['current', 'd30', 'd60', 'd60p'] as const).map((k) => (
            <div key={k} className="border border-neutral-200 rounded-md px-2 py-2">
              <p className="text-[10px] text-neutral-500">{AGING_LABELS[k]}</p>
              <p className="text-sm font-mono font-bold text-black">{formatPrice(buckets[k], currency)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 pt-4 border-t border-neutral-200 flex justify-between text-[10px] text-neutral-400">
        <span>Future Concept · Bamako, Mali</span>
        <span>Relevé — {group.client}</span>
      </div>
    </div>
  );
}

const invoiceSheetClass =
  'bg-white text-black rounded-lg shadow-xl p-8 mb-6 max-w-[800px] mx-auto';

// ── Preview overlay + print orchestration ────────────────────────

export function InvoicePrintPreview({ request, onClose }: {
  request: InvoicePrintRequest;
  onClose: () => void;
}) {
  const sheets: React.ReactNode[] = [];

  if (request.kind === 'single') {
    sheets.push(<InvoiceSheet key={request.invoice.id} invoice={request.invoice} />);
  } else if (request.kind === 'multi') {
    request.invoices.forEach((inv, idx) => (
      sheets.push(
        <div key={inv.id} className={idx > 0 ? 'print-product-page' : undefined}>
          <InvoiceSheet invoice={inv} />
        </div>,
      )
    ));
  } else {
    request.groups.forEach((g, idx) => (
      sheets.push(
        <div key={g.client} className={idx > 0 ? 'print-product-page' : undefined}>
          <StatementSheet group={g} />
        </div>,
      )
    ));
  }

  // While the browser prints, CSS scopes the page down to .invoice-print-doc only
  useEffect(() => {
    const cls = 'printing-invoice';
    const before = () => document.body.classList.add(cls);
    const after = () => document.body.classList.remove(cls);
    window.addEventListener('beforeprint', before);
    window.addEventListener('afterprint', after);
    return () => {
      window.removeEventListener('beforeprint', before);
      window.removeEventListener('afterprint', after);
      document.body.classList.remove(cls);
    };
  }, []);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="invoice-print-portal fixed inset-0 z-[100] overflow-auto bg-black/60 p-4 md:p-8">
      <div className="invoice-print-toolbar sticky top-0 z-10 flex items-center justify-end gap-2 pb-3">
        <Button variant="outline" size="sm" onClick={onClose} className="bg-white">
          <X className="h-4 w-4" /> Close
        </Button>
        <Button size="sm" className="bg-gold text-os-dark hover:bg-gold-dark" onClick={() => window.print()}>
          <Printer className="h-4 w-4" /> Print
        </Button>
      </div>
      <div className="invoice-print-doc py-2">
        {sheets}
      </div>
    </div>,
    document.body,
  );
}
