'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Search, Plus, X, Check, Loader2, Eye, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { useAppStore, formatPrice, generateId, getTimestamp } from '@/lib/store';
import { projectSchema } from '@/lib/validations';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import type { Project } from '@/lib/types';
import type { ProductCategory } from '@/lib/types';

const PHASES = ['Planning', 'Design', 'Procurement', 'Installation', 'Handover'];
const CATEGORIES: (ProductCategory | 'all')[] = ['all', 'seating', 'desks', 'walls', 'lighting', 'storage'];
const DRAFT_KEY = 'future_os_project_draft';

type FormData = {
  name: string;
  client: string;
  location: string;
  phase: string;
  budget: number;
  startDate: string;
  endDate: string;
  status?: 'active' | 'completed' | 'on-hold';
};

interface ProjectBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectBuilder({ open, onOpenChange }: ProjectBuilderProps) {
  const products = useAppStore((s) => s.products);
  const projects = useAppStore((s) => s.projects);
  const proposals = useAppStore((s) => s.proposals);
  const currency = useAppStore((s) => s.currency);
  const addProject = useAppStore((s) => s.addProject);
  const addToast = useAppStore((s) => s.addToast);
  const addActivity = useAppStore((s) => s.addActivity);

  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [catSearch, setCatSearch] = useState('');
  const [catFilter, setCatFilter] = useState<ProductCategory | 'all'>('all');
  const [clientSearch, setClientSearch] = useState('');
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const clientRef = useRef<HTMLDivElement>(null);
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(projectSchema.omit({ items: true, spent: true })) as any,
    defaultValues: {
      name: '',
      client: '',
      location: '',
      phase: '',
      budget: 0,
      startDate: '',
      endDate: '',
      status: 'active',
    },
  });

  const { watch, setValue, reset, handleSubmit, formState: { errors, isValid } } = form;
  const watchedBudget = watch('budget');
  const watchedClient = watch('client');

  // Client auto-suggest from existing projects + proposals
  const existingClients = useMemo(() => {
    const clientSet = new Set<string>();
    projects.forEach((p) => clientSet.add(p.client));
    proposals.forEach((p) => clientSet.add(p.client));
    return Array.from(clientSet).sort();
  }, [projects, proposals]);

  const filteredClientSuggestions = useMemo(() => {
    if (!clientSearch) return existingClients.slice(0, 8);
    const q = clientSearch.toLowerCase();
    return existingClients.filter((c) => c.toLowerCase().includes(q)).slice(0, 8);
  }, [clientSearch, existingClients]);

  // Product catalog filtering
  const filteredCatalog = useMemo(() => {
    return products.filter((p) => {
      if (catFilter !== 'all' && p.category !== catFilter) return false;
      if (catSearch) {
        const q = catSearch.toLowerCase();
        if (!p.name.toLowerCase().includes(q) && !p.supplier.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [products, catFilter, catSearch]);

  // Budget auto-suggest from selected products
  const suggestedBudget = useMemo(() => {
    return selectedProducts.reduce((sum, id) => {
      const prod = products.find((p) => p.id === id);
      return sum + (prod?.price ?? 0);
    }, 0);
  }, [selectedProducts, products]);

  const avgProjectBudget = useMemo(() => {
    if (projects.length === 0) return 0;
    return Math.round(projects.reduce((sum, p) => sum + p.budget, 0) / projects.length);
  }, [projects]);

  // Draft auto-save
  useEffect(() => {
    if (!open) return;
    if (draftTimerRef.current) clearInterval(draftTimerRef.current);
    draftTimerRef.current = setInterval(() => {
      const values = form.getValues();
      const draft = { ...values, selectedProducts, catFilter, catSearch };
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
        setDraftSaved(true);
        setTimeout(() => setDraftSaved(false), 2000);
      } catch { /* quota exceeded */ }
    }, 3000);
    return () => {
      if (draftTimerRef.current) clearInterval(draftTimerRef.current);
    };
  }, [open, form, selectedProducts, catFilter, catSearch]);

  // Restore draft on open
  useEffect(() => {
    if (!open) return;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft.name || draft.client) {
          reset({
            name: draft.name || '',
            client: draft.client || '',
            location: draft.location || '',
            phase: draft.phase || '',
            budget: draft.budget || 0,
            startDate: draft.startDate || '',
            endDate: draft.endDate || '',
            status: draft.status || 'active',
          });
          setSelectedProducts(draft.selectedProducts || []);
          setCatFilter(draft.catFilter || 'all');
          setCatSearch(draft.catSearch || '');
        }
      }
    } catch { /* corrupted draft */ }
  }, [open, reset]);

  // Close client suggestions on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (clientRef.current && !clientRef.current.contains(e.target as Node)) {
        setShowClientSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const addProduct = useCallback((id: string) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev : [...prev, id]
    );
  }, []);

  const removeProduct = useCallback((id: string) => {
    setSelectedProducts((prev) => prev.filter((pid) => pid !== id));
  }, []);

  function resetBuilder() {
    reset({ name: '', client: '', location: '', phase: '', budget: 0, startDate: '', endDate: '', status: 'active' });
    setSelectedProducts([]);
    setCatSearch('');
    setCatFilter('all');
    setClientSearch('');
    setShowPreview(false);
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* noop */ }
  }

  function handleClose() {
    resetBuilder();
    onOpenChange(false);
  }

  async function onSubmit(data: FormData) {
    if (selectedProducts.length === 0) {
      addToast('warning', '⚠️', 'Add at least one product');
      return;
    }
    setIsSaving(true);
    try {
      const project: Project = {
        id: generateId(),
        name: data.name.trim(),
        client: data.client.trim(),
        location: data.location.trim(),
        phase: data.phase,
        budget: data.budget,
        spent: 0,
        status: data.status || 'active',
        startDate: data.startDate,
        endDate: data.endDate,
        items: selectedProducts,
      };
      addProject(project);
      addToast('success', '✅', `Project "${project.name}" created`);
      addActivity({
        id: generateId(),
        text: 'Project created',
        detail: `${project.client} · ${project.name}`,
        icon: '🏗️',
        timestamp: getTimestamp(),
      });
      try { localStorage.removeItem(DRAFT_KEY); } catch { /* noop */ }
      handleClose();
    } catch {
      addToast('error', '❌', 'Failed to create project. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  function applySuggestedBudget() {
    setValue('budget', suggestedBudget, { shouldValidate: true });
  }

  // ── Preview Mode ──────────────────────────────────────────
  if (showPreview) {
    const values = form.getValues();
    const previewProducts = selectedProducts
      .map((id) => products.find((p) => p.id === id))
      .filter(Boolean);

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview Project</DialogTitle>
            <DialogDescription>Review your project before saving</DialogDescription>
          </DialogHeader>

          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {/* Thumbnail strip */}
            <div className="flex h-24 bg-muted relative overflow-hidden">
              {previewProducts.slice(0, 3).map((prod) =>
                prod?.imageUrl ? (
                  <div key={prod.id} className="relative flex-1 first:rounded-tl-xl overflow-hidden">
                    <Image src={prod.imageUrl} alt={prod.name} fill className="object-cover" sizes="200px" />
                  </div>
                ) : (
                  <div key={prod!.id} className="flex-1 flex items-center justify-center text-2xl bg-muted">
                    {prod!.emoji}
                  </div>
                )
              )}
              {selectedProducts.length > 3 && (
                <div className="flex items-center justify-center flex-1 bg-muted text-xs font-medium text-muted-foreground">
                  +{selectedProducts.length - 3} more
                </div>
              )}
            </div>

            <div className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-foreground">{values.client}</p>
                  <p className="text-xs text-muted-foreground">{values.name}</p>
                </div>
                <span className="rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs px-2.5 py-0.5 font-medium">Active</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <span>📍 {values.location}</span>
                <span>📅 {values.startDate} → {values.endDate}</span>
                <span>📋 {values.phase}</span>
                <span className="font-mono font-bold text-gold">{formatPrice(values.budget, currency)}</span>
              </div>

              <div className="pt-2 border-t border-border/50">
                <p className="text-xs text-muted-foreground mb-1">Products ({previewProducts.length})</p>
                <div className="flex flex-wrap gap-1">
                  {previewProducts.map((p) => (
                    <span key={p!.id} className="rounded-md bg-muted px-2 py-0.5 text-xs">{p!.name}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowPreview(false)} className="flex-1">
              <ArrowLeft className="h-4 w-4" /> Back to Edit
            </Button>
            <Button onClick={handleSubmit(onSubmit)} disabled={isSaving} className="flex-1 bg-gold text-os-dark hover:bg-gold-dark">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {isSaving ? 'Saving...' : 'Confirm & Create'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ── Builder Mode ──────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle>New Project</DialogTitle>
          <DialogDescription>Create a new project with products and details</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit(() => setShowPreview(true))} className="px-6 pb-6">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mt-4">
              {/* Left Panel — Product Catalog (3 cols) */}
              <div className="lg:col-span-3 rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Product Catalog</h3>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search products..."
                      value={catSearch}
                      onChange={(e) => setCatSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCatFilter(cat)}
                        className={`rounded-md px-2.5 py-1.5 text-xs font-medium capitalize transition-all ${catFilter === cat ? 'bg-gold text-os-dark' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-1">
                  {filteredCatalog.map((p) => {
                    const isSelected = selectedProducts.includes(p.id);
                    return (
                      <div
                        key={p.id}
                        className={`flex items-center gap-3 rounded-lg border p-3 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-gold bg-gold/5 ring-1 ring-gold/20'
                            : 'border-border hover:bg-muted/50'
                        }`}
                        onClick={() => isSelected ? removeProduct(p.id) : addProduct(p.id)}
                      >
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
                        <div className={`flex-shrink-0 rounded-md p-1.5 transition-all ${
                          isSelected ? 'bg-gold text-os-dark' : 'bg-gold/10 text-gold hover:bg-gold hover:text-os-dark'
                        }`}>
                          {isSelected ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        </div>
                      </div>
                    );
                  })}
                  {filteredCatalog.length === 0 && (
                    <p className="col-span-2 text-sm text-muted-foreground py-8 text-center">No products found</p>
                  )}
                </div>
              </div>

              {/* Right Panel — Project Form (2 cols) */}
              <div className="lg:col-span-2 space-y-4">
                {/* Project Details */}
                <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">Project Details</h3>

                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Name *</FormLabel>
                      <FormControl><Input placeholder="e.g. Office Fit-Out" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div ref={clientRef} className="relative">
                    <FormField control={form.control} name="client" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Client name"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              setClientSearch(e.target.value);
                              setShowClientSuggestions(true);
                            }}
                            onFocus={() => setShowClientSuggestions(true)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    {showClientSuggestions && filteredClientSuggestions.length > 0 && (
                      <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-lg border border-border bg-popover shadow-md max-h-40 overflow-y-auto">
                        {filteredClientSuggestions.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => {
                              setValue('client', c, { shouldValidate: true });
                              setClientSearch(c);
                              setShowClientSuggestions(false);
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <FormField control={form.control} name="location" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location *</FormLabel>
                      <FormControl><Input placeholder="e.g. Bamako, Mali" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="phase" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phase *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select phase" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PHASES.map((phase) => (
                            <SelectItem key={phase} value={phase}>{phase}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="on-hold">On Hold</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                {/* Budget + Dates */}
                <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">Budget & Timeline</h3>

                  <FormField control={form.control} name="budget" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Budget (XOF) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      {suggestedBudget > 0 && (
                        <div className="flex items-center gap-2 mt-1">
                          <button
                            type="button"
                            onClick={applySuggestedBudget}
                            className="text-xs text-gold hover:underline font-medium"
                          >
                            Use suggested: {formatPrice(suggestedBudget, currency)}
                          </button>
                          {avgProjectBudget > 0 && (
                            <span className="text-[10px] text-muted-foreground">
                              (avg: {formatPrice(avgProjectBudget, currency)})
                            </span>
                          )}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="grid grid-cols-2 gap-2">
                    <FormField control={form.control} name="startDate" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date *</FormLabel>
                        <FormControl><Input type="date" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="endDate" render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date *</FormLabel>
                        <FormControl><Input type="date" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>

                {/* Selected Products */}
                <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">Products ({selectedProducts.length})</h3>
                    {suggestedBudget > 0 && (
                      <span className="text-xs font-mono text-gold">{formatPrice(suggestedBudget, currency)}</span>
                    )}
                  </div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {selectedProducts.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-3">Click products to add them</p>
                    )}
                    {selectedProducts.map((id) => {
                      const prod = products.find((p) => p.id === id);
                      if (!prod) return null;
                      return (
                        <div key={id} className="flex items-center gap-2 rounded-lg border border-border bg-background p-2">
                          {prod.imageUrl ? (
                            <div className="relative h-6 w-6 rounded overflow-hidden bg-muted flex-shrink-0">
                              <Image src={prod.imageUrl} alt={prod.name} fill className="object-cover" sizes="24px" />
                            </div>
                          ) : (
                            <span className="text-sm">{prod.emoji}</span>
                          )}
                          <span className="flex-1 text-xs font-medium text-foreground truncate">{prod.name}</span>
                          <span className="text-[10px] font-mono text-muted-foreground">{formatPrice(prod.price, currency)}</span>
                          <button
                            type="button"
                            onClick={() => removeProduct(id)}
                            className="rounded p-0.5 text-muted-foreground hover:text-red-500 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-gold text-os-dark hover:bg-gold-dark"
                  >
                    <Eye className="h-4 w-4" /> Preview
                  </Button>
                </div>

                {draftSaved && (
                  <p className="text-[10px] text-muted-foreground text-center">Draft saved</p>
                )}
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
