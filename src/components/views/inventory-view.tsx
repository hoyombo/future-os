'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Search, Trash2, Plus, Minus, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useAppStore, formatPrice, stockStatus, generateId, getTimestamp } from '@/lib/store';
import { StatusBadge } from '@/components/shared/status-badge';
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
import { productSchema } from '@/lib/validations';
import type { Product, ProductCategory, Status } from '@/lib/types';

const STOCK_FILTERS: { key: string; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'critical', label: 'Critical' },
  { key: 'low', label: 'Low' },
  { key: 'in-stock', label: 'In Stock' },
];

const STATUS_KEY_MAP: Record<string, Status> = {
  critical: 'red',
  low: 'orange',
  'in-stock': 'green',
  unknown: 'blue',
};

const CATEGORIES: ProductCategory[] = ['seating', 'desks', 'walls', 'lighting', 'storage'];

type ProductFormData = {
  name: string;
  supplier: string;
  category: ProductCategory;
  cost: number;
  price: number;
  stock: number;
  leadTime?: number;
  origin?: string;
};

export function InventoryView() {
  const products = useAppStore((s) => s.products);
  const projects = useAppStore((s) => s.projects);
  const currency = useAppStore((s) => s.currency);
  const openModal = useAppStore((s) => s.openModal);
  const adjustStock = useAppStore((s) => s.adjustStock);
  const saveProduct = useAppStore((s) => s.saveProduct);
  const deleteProduct = useAppStore((s) => s.deleteProduct);
  const addToast = useAppStore((s) => s.addToast);
  const addActivity = useAppStore((s) => s.addActivity);

  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema.omit({ specs: true, description: true, inStock: true })) as any,
    defaultValues: {
      name: '', supplier: '', category: 'seating', cost: 0, price: 0,
      stock: 0, leadTime: 0, origin: '',
    },
  });

  // Memoized product → project lookup
  const projectByProduct = useMemo(() => {
    const map = new Map<string, string>();
    for (const proj of projects) {
      for (const id of proj.items) {
        if (!map.has(id)) map.set(id, proj.name);
      }
    }
    return map;
  }, [projects]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const st = stockStatus(p.inStock, p.stock);
      if (stockFilter !== 'all' && st.key !== stockFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!p.name.toLowerCase().includes(q) && !p.supplier.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [products, stockFilter, search]);

  function openDetail(p: Product) {
    const st = stockStatus(p.inStock, p.stock);
    const projectName = projectByProduct.get(p.id) ?? '—';
    const marginPct = p.price > 0 ? Math.round(((p.price - p.cost) / p.price) * 100) : 0;
    openModal(p.name, (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><span className="text-muted-foreground">Supplier:</span> {p.supplier}</div>
          <div><span className="text-muted-foreground">Category:</span> <span className="capitalize">{p.category}</span></div>
          <div><span className="text-muted-foreground">Project:</span> {projectName}</div>
          <div><span className="text-muted-foreground">Stock:</span> {p.inStock}/{p.stock}</div>
          <div><span className="text-muted-foreground">Unit Cost:</span> <span className="font-mono">{formatPrice(p.cost, currency)}</span></div>
          <div><span className="text-muted-foreground">Sell Price:</span> <span className="font-mono">{formatPrice(p.price, currency)}</span></div>
          <div><span className="text-muted-foreground">Margin:</span> <span className="font-mono">{marginPct}%</span></div>
          <div><span className="text-muted-foreground">Lead Time:</span> {p.leadTime} days</div>
          <div><span className="text-muted-foreground">Origin:</span> {p.origin || '—'}</div>
          <div><span className="text-muted-foreground">Inventory Value:</span> <span className="font-mono">{formatPrice(p.price * p.inStock, currency)}</span></div>
        </div>
        {p.description && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Description</p>
            <p className="text-sm text-foreground leading-relaxed">{p.description}</p>
          </div>
        )}
        {p.specs && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Specifications</p>
            <p className="text-sm text-foreground">{p.specs}</p>
          </div>
        )}
        <p className="text-xs text-muted-foreground">Status: {st.label}</p>
      </div>
    ));
  }

  function handleAdjust(p: Product, delta: number, e: React.MouseEvent) {
    e.stopPropagation();
    adjustStock(p.id, delta);
    addToast(delta > 0 ? 'success' : 'info', delta > 0 ? '📥' : '📤', `${delta > 0 ? '+' : ''}${delta} ${p.name}`);
  }

  function executeDelete() {
    if (!deleteTarget) return;
    deleteProduct(deleteTarget.id);
    addToast('info', '🗑️', `${deleteTarget.name} deleted`);
    addActivity({
      id: generateId(),
      text: 'Product deleted',
      detail: deleteTarget.name,
      icon: '📦',
      timestamp: getTimestamp(),
    });
    setDeleteTarget(null);
  }

  async function onSubmit(data: ProductFormData) {
    setIsSaving(true);
    try {
      const product: Product = {
        id: generateId(),
        name: data.name.trim(),
        supplier: data.supplier.trim(),
        category: data.category,
        emoji: '📦',
        cost: data.cost,
        price: data.price,
        stock: data.stock,
        inStock: data.stock,
        specs: '',
        description: '',
        origin: data.origin?.trim() ?? '',
        leadTime: data.leadTime ?? 0,
      };
      saveProduct(product);
      addToast('success', '✅', `Product "${product.name}" added`);
      addActivity({
        id: generateId(),
        text: 'Product added to inventory',
        detail: `${product.name} · ${formatPrice(product.price, currency)}`,
        icon: '📦',
        timestamp: getTimestamp(),
      });
      form.reset({ name: '', supplier: '', category: 'seating', cost: 0, price: 0, stock: 0, leadTime: 0, origin: '' });
      setBuilderOpen(false);
    } catch {
      addToast('error', '❌', 'Failed to add product. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="animate-fade-up space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Inventory</h2>
        <Button onClick={() => setBuilderOpen(true)} className="bg-gold text-os-dark hover:bg-gold-dark">
          <Plus className="h-4 w-4" /> Add Product
        </Button>
      </div>

      {products.length > 0 && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by product or supplier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            {STOCK_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setStockFilter(f.key)}
                className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-all ${stockFilter === f.key ? 'bg-gold text-os-dark' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {products.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center space-y-3">
          <p className="text-muted-foreground">No products in inventory yet.</p>
          <Button onClick={() => setBuilderOpen(true)} className="bg-gold text-os-dark hover:bg-gold-dark">
            <Plus className="h-4 w-4" /> Add your first product
          </Button>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">No products match your search.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-md transition-all duration-300">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="Inventory products">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">Item</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs hidden md:table-cell">Supplier</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs hidden lg:table-cell">Project</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground text-xs">Qty</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground text-xs hidden sm:table-cell">Unit Cost</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground text-xs hidden xl:table-cell">Value</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground text-xs">Status</th>
                  <th className="px-2 py-3" aria-label="Actions" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredProducts.map((p) => {
                  const st = stockStatus(p.inStock, p.stock);
                  const statusKey = STATUS_KEY_MAP[st.key] ?? 'green';
                  const isCritical = st.key === 'critical';
                  return (
                    <tr
                      key={p.id}
                      onClick={() => openDetail(p)}
                      className="hover:bg-muted/50 cursor-pointer transition-colors group"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {p.imageUrl ? (
                            <div className="relative h-8 w-8 rounded-md overflow-hidden bg-muted flex-shrink-0">
                              <Image src={p.imageUrl} alt={p.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" sizes="32px" />
                            </div>
                          ) : (
                            <span className="text-lg">{p.emoji}</span>
                          )}
                          <div>
                            <p className="font-medium text-foreground group-hover:text-gold transition-colors duration-200">{p.name}</p>
                            <p className="text-xs text-muted-foreground md:hidden">{p.supplier}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{p.supplier}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{projectByProduct.get(p.id) ?? '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={(e) => handleAdjust(p, -1, e)}
                            className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors opacity-0 group-hover:opacity-100 disabled:pointer-events-none disabled:opacity-30"
                            disabled={p.inStock <= 0}
                            aria-label={`Remove one ${p.name}`}
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className={`font-mono text-xs min-w-[42px] ${isCritical ? 'text-red-500 font-bold' : 'text-foreground'}`}>
                            {p.inStock}<span className="text-muted-foreground">/{p.stock}</span>
                          </span>
                          <button
                            onClick={(e) => handleAdjust(p, 1, e)}
                            className="rounded p-0.5 text-gold hover:bg-gold/10 transition-colors opacity-0 group-hover:opacity-100"
                            aria-label={`Add one ${p.name}`}
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs hidden sm:table-cell">{formatPrice(p.cost, currency)}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-emerald-600 dark:text-emerald-400 hidden xl:table-cell">
                        {formatPrice(p.price * p.inStock, currency)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <StatusBadge status={statusKey} label={st.label} />
                      </td>
                      <td className="px-2 py-3 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteTarget(p); }}
                          className="rounded-lg p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100"
                          aria-label={`Delete ${p.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Product Dialog */}
      <Dialog open={builderOpen} onOpenChange={(open) => { if (!open) form.reset(); setBuilderOpen(open); }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Product</DialogTitle>
            <DialogDescription>Add a new product to your inventory</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name *</FormLabel>
                  <FormControl><Input placeholder="e.g. Executive Chair Pro" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="supplier" render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier *</FormLabel>
                  <FormControl><Input placeholder="Supplier name" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel>Category *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-3 gap-2">
                <FormField control={form.control} name="cost" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="price" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="stock" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Qty *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <FormField control={form.control} name="origin" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Origin</FormLabel>
                    <FormControl><Input placeholder="e.g. Italy" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="leadTime" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lead Time (days)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setBuilderOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving} className="flex-1 bg-gold text-os-dark hover:bg-gold-dark">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {isSaving ? 'Adding...' : 'Add Product'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete product?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &ldquo;{deleteTarget?.name}&rdquo; from inventory. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="bg-destructive text-white hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
