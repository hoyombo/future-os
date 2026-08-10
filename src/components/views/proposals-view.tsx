'use client';

import { useState, useMemo, useRef } from 'react';
import {
  Plus, Search, Trash2, Send, Save, X, Minus, ChevronDown,
  Eye, Printer,
} from 'lucide-react';
import Image from 'next/image';
import { useAppStore, formatPrice, formatDate, generateId, getTimestamp } from '@/lib/store';
import { StatusBadge } from '@/components/shared/status-badge';
import type { Proposal, ProposalItem, ProductCategory, Status } from '@/lib/types';

const PROPOSAL_STATUS_MAP: Record<string, { status: Status; label: string }> = {
  draft: { status: 'gold', label: 'Draft' },
  sent: { status: 'blue', label: 'Sent' },
  approved: { status: 'green', label: 'Approved' },
  rejected: { status: 'red', label: 'Rejected' },
};

const CATEGORIES: (ProductCategory | 'all')[] = ['all', 'seating', 'desks', 'walls', 'lighting', 'storage'];

export function ProposalsView() {
  const proposals = useAppStore((s) => s.proposals);
  const products = useAppStore((s) => s.products);
  const setProposals = useAppStore((s) => s.setProposals);
  const addToast = useAppStore((s) => s.addToast);
  const addActivity = useAppStore((s) => s.addActivity);
  const currency = useAppStore((s) => s.currency);

  const [showBuilder, setShowBuilder] = useState(false);
  const [previewProposal, setPreviewProposal] = useState<Proposal | null>(null);
  const [client, setClient] = useState('');
  const [project, setProject] = useState('');
  const [canvasItems, setCanvasItems] = useState<ProposalItem[]>([]);
  const [catSearch, setCatSearch] = useState('');
  const [catFilter, setCatFilter] = useState<ProductCategory | 'all'>('all');
  const searchRef = useRef<HTMLInputElement>(null);

  const filteredCatalog = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(catSearch.toLowerCase()) ||
        p.supplier.toLowerCase().includes(catSearch.toLowerCase());
      const matchCat = catFilter === 'all' || p.category === catFilter;
      return matchSearch && matchCat;
    });
  }, [products, catSearch, catFilter]);

  const subtotal = canvasItems.reduce((sum, ci) => {
    const prod = products.find((p) => p.id === ci.productId);
    return sum + (prod ? prod.price * ci.qty : 0);
  }, 0);

  const markup = Math.round(subtotal * 0.15);
  const total = subtotal + markup;

  function addProductToCanvas(productId: string) {
    const existing = canvasItems.find((ci) => ci.productId === productId);
    if (existing) {
      setCanvasItems(canvasItems.map((ci) => ci.productId === productId ? { ...ci, qty: ci.qty + 1 } : ci));
    } else {
      setCanvasItems([...canvasItems, { productId, qty: 1 }]);
    }
  }

  function updateQty(productId: string, delta: number) {
    setCanvasItems(
      canvasItems
        .map((ci) => ci.productId === productId ? { ...ci, qty: Math.max(0, ci.qty + delta) } : ci)
        .filter((ci) => ci.qty > 0)
    );
  }

  function removeItem(productId: string) {
    setCanvasItems(canvasItems.filter((ci) => ci.productId !== productId));
  }

  function openNewBuilder() {
    setClient('');
    setProject('');
    setCanvasItems([]);
    setShowBuilder(true);
  }

  function saveProposal(status: 'draft' | 'sent') {
    if (!client.trim()) {
      addToast('warning', '⚠️', 'Client name is required');
      return;
    }
    if (canvasItems.length === 0) {
      addToast('warning', '⚠️', 'Add at least one item');
      return;
    }
    const proposal: Proposal = {
      id: generateId(),
      client: client.trim(),
      project: project.trim() || 'General',
      date: new Date().toISOString().slice(0, 10),
      items: canvasItems,
      status,
      createdAt: getTimestamp(),
      sentAt: status === 'sent' ? getTimestamp() : undefined,
      subtotal,
      markup,
      total,
    };
    const updated = [...proposals, proposal];
    setProposals(updated);
    addToast('success', '✅', `Proposal ${status === 'sent' ? 'sent' : 'saved as draft'}`);
    addActivity({
      id: generateId(),
      text: `Proposal ${status === 'sent' ? 'sent' : 'created'}`,
      detail: `${client} · ${formatPrice(total, currency)}`,
      icon: '📋',
      timestamp: getTimestamp(),
    });
    setShowBuilder(false);
  }

  function deleteProposal(id: string) {
    setProposals(proposals.filter((p) => p.id !== id));
    addToast('info', '🗑️', 'Proposal deleted');
  }

  function handlePrint() {
    window.print();
  }

  // ── Catalog-Style Preview (full-page) ────────────────────────
  if (previewProposal) {
    const prop = previewProposal;
    const sm = PROPOSAL_STATUS_MAP[prop.status] || PROPOSAL_STATUS_MAP.draft;
    const propProducts = prop.items
      .map((item) => {
        const prod = products.find((p) => p.id === item.productId);
        return prod ? { ...prod, qty: item.qty } : null;
      })
      .filter(Boolean) as (typeof products[number] & { qty: number })[];

    return (
      <div className="animate-fade-up print:p-0">
        {/* Toolbar (hidden on print) */}
        <div className="flex items-center justify-between mb-6 print:hidden">
          <button
            onClick={() => setPreviewProposal(null)}
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            ← Back to Proposals
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-lg bg-gold text-os-dark px-4 py-2 text-sm font-medium hover:bg-gold-dark transition-colors"
          >
            <Printer className="h-4 w-4" /> Print / PDF
          </button>
        </div>

        {/* Catalog Document */}
        <div className="max-w-4xl mx-auto">
          {/* Cover Header */}
          <div className="rounded-t-2xl border border-b-0 border-border bg-card p-8 md:p-12 print:rounded-none print:border print:p-8">
            <div className="flex items-start justify-between mb-8">
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-2">Proposal</p>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
                  {prop.project}
                </h1>
              </div>
              <StatusBadge status={sm.status} label={sm.label} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm border-t border-border pt-6">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Prepared for</p>
                <p className="font-semibold text-foreground">{prop.client}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Date</p>
                <p className="font-semibold text-foreground">{formatDate(prop.date)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Reference</p>
                <p className="font-semibold text-foreground">{prop.id.slice(-6).toUpperCase()}</p>
              </div>
            </div>
          </div>

          {/* Intro */}
          <div className="border-x border-border bg-card px-8 md:px-12 py-6 print:border-x-0 print:border print:px-8">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Thank you for your trust in <span className="text-foreground font-semibold">Future OS</span>.
              Below you will find a curated selection of premium furnishings tailored to your project.
              Each piece has been chosen to meet the highest standards of quality, comfort, and design.
            </p>
          </div>

          {/* Product Pages */}
          <div className="border-x border-border print:border-x-0 print:border">
            {propProducts.map((prod, idx) => (
              <div
                key={prod.id}
                className={`print-break-inside-avoid border-t border-border bg-card px-8 md:px-12 py-8 md:py-10 print:border-x-0 print:px-8 ${idx % 2 === 0 ? '' : ''}`}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                  {/* Photo — use plain <img> for print compatibility */}
                  <div className="print-break-inside-avoid">
                    {prod.imageUrl ? (
                      <img
                        src={prod.imageUrl}
                        alt={prod.name}
                        className="w-full aspect-[4/3] object-cover rounded-xl"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full aspect-[4/3] bg-muted rounded-xl text-6xl">{prod.emoji}</div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex flex-col justify-center">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-gold font-semibold mb-2">
                      {prod.category} · {prod.supplier}
                    </p>
                    <h2 className="text-xl md:text-2xl font-bold text-foreground tracking-tight mb-3">
                      {prod.name}
                    </h2>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                      {prod.description}
                    </p>

                    {/* Specs grid */}
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-5">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Origin</p>
                        <p className="text-sm font-medium text-foreground">{prod.origin}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Lead Time</p>
                        <p className="text-sm font-medium text-foreground">{prod.leadTime} days</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Specifications</p>
                        <p className="text-sm font-medium text-foreground">{prod.specs}</p>
                      </div>
                    </div>

                    {/* Quantity + Price */}
                    <div className="rounded-lg bg-muted/50 border border-border p-4">
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                            Unit Price
                          </p>
                          <p className="text-sm font-mono text-foreground">{formatPrice(prod.price, currency)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Qty</p>
                          <p className="text-2xl font-bold text-foreground">{prod.qty}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Line Total</p>
                          <p className="text-lg font-bold font-mono text-gold">
                            {formatPrice(prod.price * prod.qty, currency)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary / Footer */}
          <div className="rounded-b-2xl border border-t border-border bg-card p-8 md:p-12 print:rounded-none print:border print:p-8 print-break-inside-avoid">
            <div className="max-w-xs ml-auto space-y-3">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal ({prop.items.length} items)</span>
                <span className="font-mono">{formatPrice(prop.subtotal, currency)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Professional fee (15%)</span>
                <span className="font-mono">{formatPrice(prop.markup, currency)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-foreground pt-3 border-t border-border">
                <span>Total</span>
                <span className="font-mono text-gold">{formatPrice(prop.total, currency)}</span>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-border">
              <p className="text-xs text-muted-foreground leading-relaxed">
                This proposal is valid for 30 days from the date above. Prices include delivery to site
                in Bamako, Mali. Installation services are available upon request. We look forward to
                bringing your vision to life.
              </p>
              <div className="mt-4 flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gold flex items-center justify-center text-os-dark font-bold text-xs">
                  FO
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Future OS</p>
                  <p className="text-[10px] text-muted-foreground">Bamako, Mali · visionandcost@futureos.ml</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Builder Mode ─────────────────────────────────────────────
  if (showBuilder) {
    return (
      <div className="animate-fade-up space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Proposal Builder</h2>
          <button onClick={() => setShowBuilder(false)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Catalog Panel */}
          <div className="lg:col-span-3 rounded-xl border border-border bg-card p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Product Catalog</h3>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search products..."
                  value={catSearch}
                  onChange={(e) => setCatSearch(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="flex gap-1 flex-wrap">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCatFilter(cat)}
                    className={`rounded-md px-2.5 py-1.5 text-xs font-medium capitalize transition-all ${catFilter === cat ? 'bg-gold text-os-dark' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[500px] overflow-y-auto pr-1">
              {filteredCatalog.map((p) => (
                <div key={p.id} className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors">
                  {p.imageUrl ? (
                    <div className="relative h-10 w-10 rounded-md overflow-hidden bg-muted flex-shrink-0">
                      <Image src={p.imageUrl} alt={p.name} fill className="object-cover" sizes="40px" />
                    </div>
                  ) : (
                    <span className="text-2xl">{p.emoji}</span>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.supplier}</p>
                    <p className="text-xs font-mono text-gold mt-0.5">{formatPrice(p.price, currency)}</p>
                  </div>
                  <button
                    onClick={() => addProductToCanvas(p.id)}
                    className="rounded-md bg-gold/10 text-gold hover:bg-gold hover:text-os-dark p-1.5 transition-all"
                    aria-label={`Add ${p.name}`}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {filteredCatalog.length === 0 && (
                <p className="col-span-2 text-sm text-muted-foreground py-8 text-center">No products found</p>
              )}
            </div>
          </div>

          {/* Canvas Panel */}
          <div className="lg:col-span-2 rounded-xl border border-border bg-card p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Proposal Canvas</h3>
            <div className="space-y-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Client *</label>
                <input
                  type="text"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  placeholder="Client name"
                  className="w-full mt-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Project</label>
                <input
                  type="text"
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  placeholder="Project name (optional)"
                  className="w-full mt-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div className="border-t border-border pt-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">Items ({canvasItems.length})</p>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {canvasItems.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">Click + to add products</p>
                )}
                {canvasItems.map((ci) => {
                  const prod = products.find((p) => p.id === ci.productId);
                  if (!prod) return null;
                  return (
                    <div key={ci.productId} className="flex items-center gap-2 rounded-lg border border-border p-2">
                      {prod.imageUrl ? (
                        <div className="relative h-7 w-7 rounded overflow-hidden bg-muted flex-shrink-0">
                          <Image src={prod.imageUrl} alt={prod.name} fill className="object-cover" sizes="28px" />
                        </div>
                      ) : (
                        <span className="text-lg">{prod.emoji}</span>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{prod.name}</p>
                        <p className="text-[10px] text-muted-foreground">{formatPrice(prod.price, currency)} each</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => updateQty(ci.productId, -1)} className="rounded p-1 hover:bg-muted transition-colors"><Minus className="h-3 w-3" /></button>
                        <span className="w-6 text-center text-xs font-mono font-medium">{ci.qty}</span>
                        <button onClick={() => updateQty(ci.productId, 1)} className="rounded p-1 hover:bg-muted transition-colors"><Plus className="h-3 w-3" /></button>
                      </div>
                      <button onClick={() => removeItem(ci.productId)} className="rounded p-1 text-muted-foreground hover:text-red-500 transition-colors">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-border pt-3 space-y-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-mono">{formatPrice(subtotal, currency)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Markup (15%)</span>
                <span className="font-mono">{formatPrice(markup, currency)}</span>
              </div>
              <div className="flex justify-between font-bold text-foreground pt-1 border-t border-border">
                <span>Total</span>
                <span className="font-mono text-gold">{formatPrice(total, currency)}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => saveProposal('draft')} className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-muted px-4 py-2 text-sm font-medium hover:bg-secondary transition-colors">
                <Save className="h-4 w-4" /> Save Draft
              </button>
              <button onClick={() => saveProposal('sent')} className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-gold text-os-dark px-4 py-2 text-sm font-medium hover:bg-gold-dark transition-colors">
                <Send className="h-4 w-4" /> Send
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Proposal List ────────────────────────────────────────────
  return (
    <div className="animate-fade-up space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Proposals</h2>
        <button
          onClick={openNewBuilder}
          className="flex items-center gap-2 rounded-lg bg-gold text-os-dark px-4 py-2 text-sm font-medium hover:bg-gold-dark transition-colors"
        >
          <Plus className="h-4 w-4" /> New Proposal
        </button>
      </div>

      {proposals.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">No proposals yet. Create your first proposal.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {proposals.map((p) => {
            const sm = PROPOSAL_STATUS_MAP[p.status] || PROPOSAL_STATUS_MAP.draft;
            // Show first 3 product thumbnails
            const cardProducts = p.items
              .map((item) => products.find((pr) => pr.id === item.productId))
              .filter(Boolean)
              .slice(0, 3);
            const remaining = p.items.length - cardProducts.length;

            return (
              <div key={p.id} className="rounded-xl border border-border bg-card overflow-hidden hover:shadow-lg transition-all group">
                {/* Thumbnail strip */}
                <div className="flex h-24 bg-muted">
                  {cardProducts.map((prod) =>
                    prod?.imageUrl ? (
                      <div key={prod.id} className="relative flex-1 first:rounded-tl-xl overflow-hidden">
                        <Image
                          src={prod.imageUrl}
                          alt={prod.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="200px"
                        />
                      </div>
                    ) : (
                      <div key={prod!.id} className="flex-1 flex items-center justify-center text-2xl bg-muted">
                        {prod!.emoji}
                      </div>
                    )
                  )}
                  {remaining > 0 && (
                    <div className="flex items-center justify-center flex-1 bg-muted text-xs font-medium text-muted-foreground">
                      +{remaining} more
                    </div>
                  )}
                  {cardProducts.length === 0 && (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground text-xs">
                      No items
                    </div>
                  )}
                </div>

                {/* Card body */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-foreground text-sm">{p.client}</p>
                      <p className="text-xs text-muted-foreground">{p.project}</p>
                    </div>
                    <StatusBadge status={sm.status} label={sm.label} />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                    <span>{formatDate(p.date)}</span>
                    <span>{p.items.length} items</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-gold font-mono">{formatPrice(p.total, currency)}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setPreviewProposal(p)}
                        className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        aria-label="Preview proposal"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteProposal(p.id)}
                        className="rounded-lg p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        aria-label="Delete proposal"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
