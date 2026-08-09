'use client';

import { useAppStore, formatPrice, stockStatus } from '@/lib/store';
import { StatusBadge } from '@/components/shared/status-badge';
import type { Status } from '@/lib/types';

export function InventoryView() {
  const products = useAppStore((s) => s.products);
  const projects = useAppStore((s) => s.projects);
  const currency = useAppStore((s) => s.currency);

  function findProjectForProduct(productId: string): string {
    for (const proj of projects) {
      if (proj.items.includes(productId)) return proj.name;
    }
    return '—';
  }

  return (
    <div className="animate-fade-up space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Inventory</h2>
        <span className="text-sm text-muted-foreground">{products.length} items</span>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">Item</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs hidden md:table-cell">Supplier</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs hidden lg:table-cell">Project</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground text-xs">Qty</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground text-xs hidden sm:table-cell">Unit Cost</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground text-xs">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map((p) => {
                const st = stockStatus(p.inStock, p.stock);
                const statusKey: Status = st.className.includes('red') ? 'red' : st.className.includes('orange') ? 'orange' : 'green';
                return (
                  <tr key={p.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{p.emoji}</span>
                        <div>
                          <p className="font-medium text-foreground">{p.name}</p>
                          <p className="text-xs text-muted-foreground md:hidden">{p.supplier}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{p.supplier}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{findProjectForProduct(p.id)}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs">
                      {p.inStock}<span className="text-muted-foreground">/{p.stock}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs hidden sm:table-cell">{formatPrice(p.cost, currency)}</td>
                    <td className="px-4 py-3 text-right">
                      <StatusBadge status={statusKey} label={st.label} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
