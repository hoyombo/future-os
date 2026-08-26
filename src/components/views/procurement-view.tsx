'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Search, Trash2, Plus, Loader2, Truck, AlertTriangle, Wallet, X } from 'lucide-react';
import Image from 'next/image';
import { useAppStore, formatPrice, formatDate, generateId, getTimestamp } from '@/lib/store';
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
import { purchaseOrderSchema } from '@/lib/validations';
import type { PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus, Status } from '@/lib/types';

const PO_STATUS_MAP: Record<PurchaseOrderStatus, { status: Status; label: string }> = {
  draft: { status: 'gold', label: 'Draft' },
  processing: { status: 'orange', label: 'Processing' },
  'in-transit': { status: 'blue', label: 'In Transit' },
  delivered: { status: 'green', label: 'Delivered' },
};

const STATUS_FLOW: PurchaseOrderStatus[] = ['draft', 'processing', 'in-transit', 'delivered'];

type POFormData = {
  supplier: string;
  totalAmount: number;
  date: string;
  expectedDelivery: string;
};

export function ProcurementView() {
  const purchaseOrders = useAppStore((s) => s.purchaseOrders);
  const products = useAppStore((s) => s.products);
  const projects = useAppStore((s) => s.projects);
  const currency = useAppStore((s) => s.currency);
  const openModal = useAppStore((s) => s.openModal);
  const savePurchaseOrder = useAppStore((s) => s.savePurchaseOrder);
  const deletePurchaseOrder = useAppStore((s) => s.deletePurchaseOrder);
  const adjustStock = useAppStore((s) => s.adjustStock);
  const addToast = useAppStore((s) => s.addToast);
  const addActivity = useAppStore((s) => s.addActivity);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteTarget, setDeleteTarget] = useState<PurchaseOrder | null>(null);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Item builder state
  const [orderItems, setOrderItems] = useState<PurchaseOrderItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedQty, setSelectedQty] = useState(1);
  const [poProjectId, setPoProjectId] = useState('none');

  const form = useForm<POFormData>({
    resolver: zodResolver(purchaseOrderSchema.omit({ status: true, items: true })) as any,
    defaultValues: { supplier: '', totalAmount: 0, date: '', expectedDelivery: '' },
  });

  const filteredPOs = useMemo(() => {
    return purchaseOrders.filter((po) => {
      if (statusFilter !== 'all' && po.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!po.supplier.toLowerCase().includes(q)) return false;
        const itemMatch = po.items.some((item) => {
          const prod = products.find((p) => p.id === item.productId);
          return prod?.name.toLowerCase().includes(q);
        });
        if (!itemMatch) return false;
      }
      return true;
    });
  }, [purchaseOrders, statusFilter, search, products]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const committed = purchaseOrders
      .filter((po) => po.status !== 'delivered')
      .reduce((sum, po) => sum + po.totalAmount, 0);
    const inTransit = purchaseOrders.filter((po) => po.status === 'in-transit').length;
    const overdue = purchaseOrders.filter(
      (po) => po.status !== 'delivered' && po.expectedDelivery < today
    ).length;
    return { committed, inTransit, overdue };
  }, [purchaseOrders]);

  function addItem() {
    if (!selectedProductId) return;
    const existing = orderItems.find((i) => i.productId === selectedProductId);
    if (existing) {
      setOrderItems(orderItems.map((i) =>
        i.productId === selectedProductId ? { ...i, qty: i.qty + selectedQty } : i
      ));
    } else {
      setOrderItems([...orderItems, { productId: selectedProductId, qty: selectedQty }]);
    }
    setSelectedProductId('');
    setSelectedQty(1);
  }

  function removeItem(productId: string) {
    setOrderItems(orderItems.filter((i) => i.productId !== productId));
  }

  function updateItemQty(productId: string, qty: number) {
    if (qty <= 0) {
      removeItem(productId);
      return;
    }
    setOrderItems(orderItems.map((i) =>
      i.productId === productId ? { ...i, qty } : i
    ));
  }

  function openDetail(po: PurchaseOrder) {
    const sm = PO_STATUS_MAP[po.status as PurchaseOrderStatus] ?? { status: 'gold' as Status, label: po.status || 'Draft' };
    openModal(`Purchase Order · ${po.supplier}`, (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-muted-foreground">{po.id.toUpperCase()}</span>
          <StatusBadge status={sm.status} label={sm.label} />
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><span className="text-muted-foreground">Supplier:</span> {po.supplier}</div>
          <div><span className="text-muted-foreground">Total:</span> <span className="font-mono">{formatPrice(po.totalAmount, currency)}</span></div>
          <div><span className="text-muted-foreground">Ordered:</span> {formatDate(po.date)}</div>
          <div><span className="text-muted-foreground">Expected:</span> {formatDate(po.expectedDelivery)}</div>
          <div className="col-span-2"><span className="text-muted-foreground">Project:</span> {po.projectId ? (() => { const proj = projects.find((p) => p.id === po.projectId); return proj ? `${proj.client} — ${proj.name}` : '—'; })() : '—'}</div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Items</p>
          <div className="flex flex-wrap gap-1">
            {po.items.map((item, i) => {
              const prod = products.find((p) => p.id === item.productId);
              return (
                <span key={i} className="rounded-md bg-muted px-2 py-0.5 text-xs">
                  {prod ? prod.name : 'Unknown'} × {item.qty}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    ));
  }

  function handleStatusChange(po: PurchaseOrder, nextRaw: string) {
    const next = nextRaw as PurchaseOrderStatus;
    if (next === po.status) return;

    savePurchaseOrder({ ...po, status: next });
    addToast('success', '🚚', `${po.id.toUpperCase()} → ${PO_STATUS_MAP[next].label}`);
    addActivity({
      id: generateId(),
      text: `PO status updated`,
      detail: `${po.id.toUpperCase()} · ${po.supplier} → ${PO_STATUS_MAP[next].label}`,
      icon: '🚚',
      timestamp: getTimestamp(),
    });

    if (next === 'delivered') {
      const bumped: string[] = [];
      for (const item of po.items) {
        adjustStock(item.productId, item.qty);
        const prod = products.find((p) => p.id === item.productId);
        bumped.push(`${prod?.name ?? 'Unknown'} +${item.qty}`);
      }
      if (bumped.length > 0) {
        addToast('info', '📦', `Stock updated: ${bumped.join(', ')}`);
        addActivity({
          id: generateId(),
          text: 'Inventory restocked from delivery',
          detail: bumped.join(', '),
          icon: '📦',
          timestamp: getTimestamp(),
        });
      }
    }
  }

  async function onSubmit(data: POFormData) {
    if (orderItems.length === 0) {
      addToast('warning', '⚠️', 'Please add at least one item to the order.');
      return;
    }
    setIsSaving(true);
    try {
      const po: PurchaseOrder = {
        id: generateId(),
        supplier: data.supplier.trim(),
        items: orderItems,
        totalAmount: data.totalAmount,
        status: 'draft',
        date: data.date,
        expectedDelivery: data.expectedDelivery,
        projectId: poProjectId !== 'none' ? poProjectId : undefined,
      };
      savePurchaseOrder(po);
      addToast('success', '✅', `Purchase order created`);
      addActivity({
        id: generateId(),
        text: 'Purchase order created',
        detail: `${po.supplier} · ${formatPrice(po.totalAmount, currency)}`,
        icon: '🚚',
        timestamp: getTimestamp(),
      });
      form.reset({ supplier: '', totalAmount: 0, date: '', expectedDelivery: '' });
      setOrderItems([]);
      setPoProjectId('none');
      setBuilderOpen(false);
    } catch {
      addToast('error', '❌', 'Failed to create purchase order. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  function executeDelete() {
    if (!deleteTarget) return;
    deletePurchaseOrder(deleteTarget.id);
    addToast('info', '🗑️', `${deleteTarget.id.toUpperCase()} deleted`);
    setDeleteTarget(null);
  }

  return (
    <div className="animate-fade-up space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Procurement</h2>
        <Button onClick={() => setBuilderOpen(true)} className="bg-gold text-os-dark hover:bg-gold-dark">
          <Plus className="h-4 w-4" /> New Order
        </Button>
      </div>

      {/* Summary strip */}
      {purchaseOrders.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0">
              <Wallet className="h-4 w-4 text-gold" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Committed</p>
              <p className="text-sm font-mono font-bold text-foreground">{formatPrice(stats.committed, currency)}</p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
              <Truck className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">In Transit</p>
              <p className="text-sm font-bold text-foreground">{stats.inTransit} order{stats.inTransit === 1 ? '' : 's'}</p>
            </div>
          </div>
          <div className={`rounded-xl border bg-card p-4 flex items-center gap-3 ${stats.overdue > 0 ? 'border-red-500/30' : 'border-border'}`}>
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${stats.overdue > 0 ? 'bg-red-500/10' : 'bg-muted'}`}>
              <AlertTriangle className={`h-4 w-4 ${stats.overdue > 0 ? 'text-red-500' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Overdue</p>
              <p className={`text-sm font-bold ${stats.overdue > 0 ? 'text-red-500' : 'text-foreground'}`}>
                {stats.overdue} order{stats.overdue === 1 ? '' : 's'}
              </p>
            </div>
          </div>
        </div>
      )}

      {purchaseOrders.length > 0 && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by supplier or items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            <button
              onClick={() => setStatusFilter('all')}
              className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-all ${statusFilter === 'all' ? 'bg-gold text-os-dark' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
            >
              All
            </button>
            {STATUS_FLOW.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-all ${statusFilter === s ? 'bg-gold text-os-dark' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
              >
                {PO_STATUS_MAP[s].label}
              </button>
            ))}
          </div>
        </div>
      )}

      {purchaseOrders.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center space-y-3">
          <p className="text-muted-foreground">No purchase orders yet.</p>
          <Button onClick={() => setBuilderOpen(true)} className="bg-gold text-os-dark hover:bg-gold-dark">
            <Plus className="h-4 w-4" /> Create your first purchase order
          </Button>
        </div>
      ) : filteredPOs.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">No purchase orders match your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredPOs.map((po) => {
            const sm = PO_STATUS_MAP[po.status as PurchaseOrderStatus] ?? { status: 'gold' as Status, label: po.status || 'Draft' };
            const today = new Date().toISOString().slice(0, 10);
            const isOverdue = po.status !== 'delivered' && po.expectedDelivery < today;

            return (
              <div
                key={po.id}
                onClick={() => openDetail(po)}
                className={`rounded-xl border bg-card overflow-hidden shadow-md hover:shadow-xl hover:border-gold/30 transition-all duration-300 group cursor-pointer p-4 md:p-5 ${isOverdue ? 'border-red-500/30' : 'border-border/60'}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-sm text-foreground group-hover:text-gold transition-colors duration-200 font-mono">
                      {po.id.toUpperCase()}
                    </p>
                    <p className="text-xs text-muted-foreground">{po.supplier}</p>
                    {po.projectId && (() => {
                      const proj = projects.find((p) => p.id === po.projectId);
                      return proj ? <p className="text-[10px] text-blue-600 dark:text-blue-400 truncate">🏗 {proj.name}</p> : null;
                    })()}
                  </div>
                  <StatusBadge status={sm.status} label={sm.label} />
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                  {po.items.slice(0, 3).map((item, i) => {
                    const prod = products.find((p) => p.id === item.productId);
                    return (
                      <span key={i} className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                        {prod ? prod.name : 'Unknown'} × {item.qty}
                      </span>
                    );
                  })}
                  {po.items.length > 3 && (
                    <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                      +{po.items.length - 3} more
                    </span>
                  )}
                </div>

                <div className="flex items-end justify-between pt-2 border-t border-border/50">
                  <div>
                    <p className="text-lg font-bold text-gold font-mono leading-tight">{formatPrice(po.totalAmount, currency)}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Ordered {formatDate(po.date)} ·{' '}
                      <span className={isOverdue ? 'text-red-500 font-medium' : ''}>
                        {isOverdue ? 'Overdue ' : ''}{formatDate(po.expectedDelivery)}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <Select value={po.status} onValueChange={(v) => handleStatusChange(po, v)}>
                      <SelectTrigger size="sm" aria-label="Update status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_FLOW.map((s) => (
                          <SelectItem key={s} value={s}>{PO_STATUS_MAP[s].label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <button
                      onClick={() => setDeleteTarget(po)}
                      className="rounded-lg p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100"
                      aria-label={`Delete ${po.id.toUpperCase()}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Purchase Order Dialog */}
      <Dialog open={builderOpen} onOpenChange={(open) => {
        if (!open) {
          form.reset({ supplier: '', totalAmount: 0, date: '', expectedDelivery: '' });
          setOrderItems([]);
          setSelectedProductId('');
          setSelectedQty(1);
          setPoProjectId('none');
        }
        setBuilderOpen(open);
      }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Purchase Order</DialogTitle>
            <DialogDescription>Create a purchase order for a supplier</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="supplier" render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier *</FormLabel>
                  <FormControl><Input placeholder="e.g. Steelcase EU" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormItem>
                <FormLabel>Project</FormLabel>
                <Select value={poProjectId} onValueChange={setPoProjectId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="No project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No project (stock replenishment)</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.client} — {p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>

              {/* Item Builder */}
              <div className="space-y-2">
                <FormLabel>Items *</FormLabel>
                <div className="flex gap-2">
                  <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          <span className="flex items-center gap-2">
                            {p.imageUrl ? (
                              <div className="relative h-5 w-5 rounded overflow-hidden bg-muted flex-shrink-0">
                                <Image src={p.imageUrl} alt={p.name} fill className="object-cover" sizes="20px" />
                              </div>
                            ) : (
                              <span className="text-sm">{p.emoji}</span>
                            )}
                            {p.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min={1}
                    value={selectedQty}
                    onChange={(e) => setSelectedQty(parseInt(e.target.value) || 1)}
                    className="w-20"
                  />
                  <Button type="button" variant="outline" size="icon" onClick={addItem} disabled={!selectedProductId}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {orderItems.length > 0 && (
                  <div className="space-y-1 mt-2">
                    {orderItems.map((item) => {
                      const prod = products.find((p) => p.id === item.productId);
                      return (
                        <div key={item.productId} className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm">
                          {prod?.imageUrl ? (
                            <div className="relative h-6 w-6 rounded overflow-hidden bg-background flex-shrink-0">
                              <Image src={prod.imageUrl} alt={prod.name} fill className="object-cover" sizes="24px" />
                            </div>
                          ) : (
                            <span className="text-base">{prod?.emoji ?? '📦'}</span>
                          )}
                          <span className="flex-1 truncate">{prod?.name ?? 'Unknown'}</span>
                          <Input
                            type="number"
                            min={1}
                            value={item.qty}
                            onChange={(e) => updateItemQty(item.productId, parseInt(e.target.value) || 0)}
                            className="w-16 h-7 text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => removeItem(item.productId)}
                            className="text-muted-foreground hover:text-red-500 transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                {orderItems.length === 0 && (
                  <p className="text-xs text-muted-foreground">No items added yet. Select a product and quantity above.</p>
                )}
              </div>

              <FormField control={form.control} name="totalAmount" render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Amount (XOF) *</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-2">
                <FormField control={form.control} name="date" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order Date *</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="expectedDelivery" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected Delivery *</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
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
                  {isSaving ? 'Creating...' : 'Create Order'}
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
            <AlertDialogTitle>Delete purchase order?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {deleteTarget?.id.toUpperCase()} from {deleteTarget?.supplier}. This action cannot be undone.
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
