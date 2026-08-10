'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { Search } from 'lucide-react';
import { useAppStore, formatPrice, stockStatus } from '@/lib/store';
import { StatusBadge } from '@/components/shared/status-badge';
import type { ProductCategory, Status } from '@/lib/types';

const CATEGORIES: (ProductCategory | 'all')[] = ['all', 'seating', 'desks', 'walls', 'lighting', 'storage'];

export function CatalogView() {
  const products = useAppStore((s) => s.products);
  const currency = useAppStore((s) => s.currency);
  const openModal = useAppStore((s) => s.openModal);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ProductCategory | 'all'>('all');

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.supplier.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase());
      const matchCat = category === 'all' || p.category === category;
      return matchSearch && matchCat;
    });
  }, [products, search, category]);

  function showDetail(p: typeof products[0]) {
    const st = stockStatus(p.inStock, p.stock);
    const statusKey: Status = st.className.includes('red') ? 'red' : st.className.includes('orange') ? 'orange' : 'green';
    openModal(p.name, (
      <div className="space-y-3">
        {p.imageUrl ? (
          <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-muted">
            <Image src={p.imageUrl} alt={p.name} fill className="object-cover" sizes="400px" />
          </div>
        ) : null}
        <div className="flex items-center gap-3">
          <span className="text-4xl">{p.emoji}</span>
          <div>
            <p className="text-sm text-muted-foreground">{p.supplier}</p>
            <p className="text-xs text-muted-foreground capitalize">{p.category}</p>
          </div>
        </div>
        <p className="text-sm text-foreground/90">{p.description}</p>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><span className="text-muted-foreground">Cost:</span> <span className="font-mono">{formatPrice(p.cost, currency)}</span></div>
          <div><span className="text-muted-foreground">Price:</span> <span className="font-mono text-gold">{formatPrice(p.price, currency)}</span></div>
          <div><span className="text-muted-foreground">Stock:</span> {p.inStock}/{p.stock}</div>
          <div><span className="text-muted-foreground">Status:</span> <StatusBadge status={statusKey} label={st.label} /></div>
          <div><span className="text-muted-foreground">Origin:</span> {p.origin}</div>
          <div><span className="text-muted-foreground">Lead Time:</span> {p.leadTime} days</div>
        </div>
        <p className="text-xs text-muted-foreground">{p.specs}</p>
      </div>
    ));
  }

  return (
    <div className="animate-fade-up space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-foreground">Product Catalog</h2>
        <span className="text-sm text-muted-foreground">{filtered.length} of {products.length} products</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, supplier, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`rounded-md px-2.5 py-1.5 text-xs font-medium capitalize transition-all ${category === cat ? 'bg-gold text-os-dark' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((p) => {
          const st = stockStatus(p.inStock, p.stock);
          const statusKey: Status = st.className.includes('red') ? 'red' : st.className.includes('orange') ? 'orange' : 'green';
          return (
            <button
              key={p.id}
              onClick={() => showDetail(p)}
              className="text-left rounded-xl border border-border bg-card p-4 hover:shadow-md transition-all group"
            >
              <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-muted mb-2">
                {p.imageUrl ? (
                  <Image src={p.imageUrl} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" />
                ) : (
                  <div className="flex items-center justify-center h-full text-4xl">{p.emoji}</div>
                )}
              </div>
              <div className="flex items-start justify-between">
                <StatusBadge status={statusKey} label={st.label} />
              </div>
              <h3 className="text-sm font-semibold text-foreground group-hover:text-gold transition-colors">{p.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{p.supplier}</p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-muted-foreground capitalize">{p.category}</span>
                <span className="text-sm font-mono font-bold text-gold">{formatPrice(p.price, currency)}</span>
              </div>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full rounded-xl border border-border bg-card p-12 text-center">
            <p className="text-muted-foreground">No products match your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
