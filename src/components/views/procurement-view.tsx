'use client';

import { useAppStore, formatPrice, formatDate } from '@/lib/store';
import { StatusBadge } from '@/components/shared/status-badge';
import type { Status } from '@/lib/types';

const PO_STATUS_MAP: Record<string, { status: Status; label: string }> = {
  'Delivered': { status: 'green', label: 'Delivered' },
  'In Transit': { status: 'blue', label: 'In Transit' },
  'Processing': { status: 'gold', label: 'Processing' },
  'Pending': { status: 'orange', label: 'Pending' },
};

export function ProcurementView() {
  const purchaseOrders = useAppStore((s) => s.purchaseOrders);
  const currency = useAppStore((s) => s.currency);

  return (
    <div className="animate-fade-up space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Procurement</h2>
        <span className="text-sm text-muted-foreground">{purchaseOrders.length} purchase orders</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {purchaseOrders.map((po) => {
          const sm = PO_STATUS_MAP[po.status] || PO_STATUS_MAP['Pending'];
          return (
            <div key={po.id} className="rounded-xl border border-border bg-card p-4 md:p-5 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-sm font-bold text-foreground">{po.id.toUpperCase()}</h3>
                  <p className="text-xs text-muted-foreground">{po.supplier}</p>
                </div>
                <StatusBadge status={sm.status} label={sm.label} />
              </div>

              <p className="text-xs text-foreground/80 mt-2 mb-3 leading-relaxed">{po.items}</p>

              <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-border">
                <div>
                  <span className="text-muted-foreground">Total Amount</span>
                  <p className="font-mono font-bold text-gold mt-0.5">{formatPrice(po.totalAmount, currency)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Order Date</span>
                  <p className="mt-0.5">{formatDate(po.date)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Expected Delivery</span>
                  <p className="mt-0.5">{formatDate(po.expectedDelivery)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status</span>
                  <p className="mt-0.5 font-medium">{po.status}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
