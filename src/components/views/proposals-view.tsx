'use client';

import { useState, useMemo, useRef } from 'react';
import {
  Plus, Search, Trash2, Send, Save, X, Minus, ChevronDown,
  Printer,
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
  const [proposalSearch, setProposalSearch] = useState('');
  const [proposalStatusFilter, setProposalStatusFilter] = useState<string>('all');
  const searchRef = useRef<HTMLInputElement>(null);

  const PROPOSAL_STATUSES: string[] = ['all', 'draft', 'sent', 'approved', 'rejected'];
  const PROPOSAL_STATUS_LABELS: Record<string, string> = {
    all: 'All',
    draft: 'Draft',
    sent: 'Sent',
    approved: 'Approved',
    rejected: 'Rejected',
  };

  const filteredProposals = useMemo(() => {
    return proposals.filter((p) => {
      const matchSearch = proposalSearch === '' ||
        p.client.toLowerCase().includes(proposalSearch.toLowerCase()) ||
        p.project.toLowerCase().includes(proposalSearch.toLowerCase());
      const matchStatus = proposalStatusFilter === 'all' || p.status === proposalStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [proposals, proposalSearch, proposalStatusFilter]);

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
          {/* Cover Page */}
          <div className="rounded-t-2xl border border-b-0 border-border bg-card print:rounded-none print:border print:break-inside-avoid">
            {/* Company Header */}
            <div className="text-center py-10 md:py-14 px-8 md:px-12 border-b border-border">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-gold text-os-dark font-bold text-lg mb-4">
                FO
              </div>
              <h2 className="text-2xl font-bold text-foreground tracking-tight">Future OS</h2>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mt-1">Premium Interiors, Bamako</p>
            </div>

            {/* Project Title */}
            <div className="text-center py-10 md:py-14 px-8 md:px-12">
              <p className="text-xs font-medium uppercase tracking-[0.25em] text-gold mb-4">Commercial Proposal</p>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-4">
                {prop.project}
              </h1>
              <StatusBadge status={sm.status} label={sm.label} />
            </div>

            {/* Client & Meta */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm border-t border-border mx-8 md:mx-12 py-6">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Prepared for</p>
                <p className="font-semibold text-foreground">{prop.client}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Date</p>
                <p className="font-semibold text-foreground">{formatDate(prop.date)}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Reference</p>
                <p className="font-semibold text-foreground">{prop.id.slice(-6).toUpperCase()}</p>
              </div>
            </div>

            {/* Project Scope */}
            <div className="border-t border-border bg-muted/30 px-8 md:px-12 py-6">
              <p className="text-[10px] uppercase tracking-[0.2em] text-gold font-semibold mb-2">Project Scope</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Thank you for your trust in <span className="text-foreground font-semibold">Future OS</span>.
                Below you will find a curated selection of premium furnishings tailored to your project.
                Each piece has been chosen to meet the highest standards of quality, comfort, and design.
              </p>
            </div>

            {/* Contact Footer */}
            <div className="border-t border-border px-8 md:px-12 py-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] text-muted-foreground">
              <span>Quartier du Fleuve, Bamako, Mali</span>
              <span className="hidden sm:inline">·</span>
              <span>+223 76 00 00 00</span>
              <span className="hidden sm:inline">·</span>
              <span>visionandcost@futureos.ml</span>
            </div>
          </div>

          {/* Product Pages */}
          <div className="border-x border-border print:border-x-0 print:border">
            {propProducts.map((prod, idx) => (
              <div
                key={prod.id}
                className={`border-t border-border bg-card px-8 md:px-12 py-8 md:py-10 print:border-x-0 print:px-8 print:break-before-auto print:break-inside-avoid ${idx > 0 ? 'print-product-page' : ''}`}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 items-start">
                  {/* Photo — use plain <img> for print compatibility */}
                  <div>
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

          {/* Summary / Footer Page */}
          <div className="rounded-b-2xl border border-t border-border bg-card print:rounded-none print:border print:break-before-auto print:break-inside-avoid">
            {/* Pricing Summary */}
            <div className="p-8 md:p-12 pb-6 md:pb-6">
              <p className="text-[10px] uppercase tracking-[0.2em] text-gold font-semibold mb-4">Pricing Summary</p>
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
            </div>

            {/* Terms & Conditions */}
            <div className="border-t border-border px-8 md:px-12 py-6">
              <p className="text-[10px] uppercase tracking-[0.2em] text-gold font-semibold mb-3">Terms & Conditions</p>
              <ul className="text-xs text-muted-foreground leading-relaxed space-y-1.5">
                <li>This proposal is valid for <span className="text-foreground font-medium">30 days</span> from the date above.</li>
                <li>Payment terms: <span className="text-foreground font-medium">50% advance upon approval, 50% upon delivery</span>.</li>
                <li>Prices include delivery to site in Bamako, Mali.</li>
                <li>Installation services are available upon request at additional cost.</li>
                <li>Lead times begin upon receipt of advance payment.</li>
                <li>Manufacturer warranty applies to all products as per individual product terms.</li>
              </ul>
            </div>

            {/* Company Details */}
            <div className="border-t border-border px-8 md:px-12 py-6">
              <p className="text-[10px] uppercase tracking-[0.2em] text-gold font-semibold mb-3">Company Details</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-muted-foreground mb-0.5">Legal Name</p>
                  <p className="font-medium text-foreground">Future OS SARL</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-0.5">NIF</p>
                  <p className="font-medium text-foreground">XXXXXXXX-X</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-0.5">RCCM</p>
                  <p className="font-medium text-foreground">XXXXX-B-20XX</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-0.5">Address</p>
                  <p className="font-medium text-foreground">Quartier du Fleuve, Bamako, Mali</p>
                </div>
              </div>
            </div>

            {/* Approval Signature */}
            <div className="border-t border-border px-8 md:px-12 py-6">
              <p className="text-[10px] uppercase tracking-[0.2em] text-gold font-semibold mb-4">Client Approval</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-6">Client Name</p>
                  <div className="border-b border-foreground/30" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-6">Date</p>
                  <div className="border-b border-foreground/30" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-6">Signature</p>
                  <div className="border-b border-foreground/30" />
                </div>
              </div>
            </div>

            {/* Branding Footer */}
            <div className="border-t border-border px-8 md:px-12 py-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-gold flex items-center justify-center text-os-dark font-bold text-[9px]">
                  FO
                </div>
                <span className="font-medium text-foreground">Future OS</span>
              </div>
              <span>Quartier du Fleuve, Bamako, Mali</span>
              <span>+223 76 00 00 00</span>
              <span>visionandcost@futureos.ml</span>
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

      {proposals.length > 0 && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by client or project..."
              value={proposalSearch}
              onChange={(e) => setProposalSearch(e.target.value)}
              className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            {PROPOSAL_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setProposalStatusFilter(s)}
                className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-all ${proposalStatusFilter === s ? 'bg-gold text-os-dark' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
              >
                {PROPOSAL_STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>
      )}

      {proposals.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">No proposals yet. Create your first proposal.</p>
        </div>
      ) : filteredProposals.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">No proposals match your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredProposals.map((p) => {
            const sm = PROPOSAL_STATUS_MAP[p.status] || PROPOSAL_STATUS_MAP.draft;
            // Show first 3 product thumbnails
            const cardProducts = p.items
              .map((item) => products.find((pr) => pr.id === item.productId))
              .filter(Boolean)
              .slice(0, 3);
            const remaining = p.items.length - cardProducts.length;

            return (
              <div
                key={p.id}
                onClick={() => setPreviewProposal(p)}
                className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-md hover:shadow-xl hover:border-gold/30 transition-all duration-300 group cursor-pointer"
              >
                {/* Thumbnail strip */}
                <div className="flex h-28 bg-muted relative overflow-hidden">
                  {cardProducts.map((prod) =>
                    prod?.imageUrl ? (
                      <div key={prod.id} className="relative flex-1 first:rounded-tl-xl overflow-hidden">
                        <Image
                          src={prod.imageUrl}
                          alt={prod.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                          sizes="200px"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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
                  {/* Hover overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition-all duration-300 pointer-events-none">
                    <span className="opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 text-xs font-medium text-white bg-black/40 backdrop-blur-sm rounded-full px-3 py-1">
                      View Proposal
                    </span>
                  </div>
                </div>

                {/* Card body */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-foreground text-sm group-hover:text-gold transition-colors duration-200">{p.client}</p>
                      <p className="text-xs text-muted-foreground">{p.project}</p>
                    </div>
                    <StatusBadge status={sm.status} label={sm.label} />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                    <span>{formatDate(p.date)}</span>
                    <span>{p.items.length} items</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <span className="text-lg font-bold text-gold font-mono">{formatPrice(p.total, currency)}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteProposal(p.id); }}
                      className="rounded-lg p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100"
                      aria-label="Delete proposal"
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
    </div>
  );
}
