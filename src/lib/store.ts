// ──────────────────────────────────────────────────────────────
//  Future OS · Vision & Cost — Zustand Store
// ──────────────────────────────────────────────────────────────

import { create } from 'zustand';
import type {
  Currency, ViewName, Toast, ToastType, IAppService,
  Product, Project, Proposal, Expense, Invoice, Bill,
  RecurringExpense, TeamMember, PurchaseOrder, AfterSalesTicket,
  ActivityEntry, LogisticsEvent, BudgetItem,
} from './types';

// ── Helpers ───────────────────────────────────────────────────
let idCounter = Date.now();
export function generateId(): string {
  return String(++idCounter);
}

export function getTimestamp(): string {
  return new Date().toISOString();
}

// Currency conversion rates (from XOF)
const RATES: Record<Currency, number> = {
  XOF: 1,
  EUR: 0.00152,
  USD: 0.00164,
};

const SYMBOLS: Record<Currency, string> = {
  XOF: 'CFA',
  EUR: '€',
  USD: '$',
};

export function formatPrice(amountXOF: number, currency: Currency = 'XOF'): string {
  const converted = Math.round(amountXOF * RATES[currency]);
  return `${SYMBOLS[currency]} ${converted.toLocaleString('en-US')}`;
}

export function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return dateStr; }
}

export function stockStatus(inStock: number, stock: number): { key: string; label: string; className: string } {
  if (!stock || stock <= 0) return { key: 'unknown', label: 'Unknown', className: 'status blue' };
  const ratio = inStock / stock;
  if (ratio <= 0.2) return { key: 'critical', label: 'Critical', className: 'status red' };
  if (ratio <= 0.5) return { key: 'low', label: 'Low', className: 'status orange' };
  return { key: 'in-stock', label: 'In Stock', className: 'status green' };
}

export function projectBudgetClass(spent: number, budget: number): string {
  if (!budget || budget <= 0) return '';
  const ratio = spent / budget;
  if (ratio >= 0.95) return 'danger';
  if (ratio >= 0.75) return 'warning';
  return '';
}

// ── Store ─────────────────────────────────────────────────────
interface AppState {
  // Navigation
  currentView: ViewName;
  setCurrentView: (v: ViewName) => void;

  // Project context
  currentProject: string;
  setCurrentProject: (p: string) => void;

  // Theme
  isDarkMode: boolean;
  toggleDarkMode: () => void;

  // Currency
  currency: Currency;
  setCurrency: (c: Currency) => void;

  // Projects view mode
  projectsViewMode: 'cards' | 'calendar';
  setProjectsViewMode: (m: 'cards' | 'calendar') => void;

  // Toast notifications
  toasts: Toast[];
  addToast: (type: ToastType, icon: string, message: string) => void;
  removeToast: (id: string) => void;

  // Modal
  modalOpen: boolean;
  modalTitle: string;
  modalContent: React.ReactNode;
  openModal: (title: string, content: React.ReactNode) => void;
  closeModal: () => void;

  // Mock data accessors (populated on init)
  products: Product[];
  projects: Project[];
  logisticsEvents: LogisticsEvent[];
  proposals: Proposal[];
  expenses: Expense[];
  invoices: Invoice[];
  bills: Bill[];
  recurringExpenses: RecurringExpense[];
  teamMembers: TeamMember[];
  purchaseOrders: PurchaseOrder[];
  afterSalesTickets: AfterSalesTicket[];
  activityLog: ActivityEntry[];
  budgetData: Record<string, BudgetItem>;

  // Activity
  addActivity: (entry: ActivityEntry) => void;
  clearActivity: () => void;

  // Service reference
  _service: IAppService | null;
  setService: (s: IAppService | null) => void;

  // Data mutations
  setProducts: (p: Product[]) => void;
  saveProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (id: string, delta: number) => void;
  setProjects: (p: Project[]) => void;
  addProject: (project: Project) => void;
  deleteProject: (id: string) => void;
  setLogisticsEvents: (e: LogisticsEvent[]) => void;
  setProposals: (p: Proposal[]) => void;
  setExpenses: (e: Expense[]) => void;
  saveExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => void;
  setInvoices: (i: Invoice[]) => void;
  saveInvoice: (invoice: Invoice) => void;
  deleteInvoice: (id: string) => void;
  setBills: (b: Bill[]) => void;
  saveBill: (bill: Bill) => void;
  deleteBill: (id: string) => void;
  setRecurringExpenses: (r: RecurringExpense[]) => void;
  saveRecurring: (re: RecurringExpense) => void;
  deleteRecurring: (id: string) => void;
  setTeamMembers: (t: TeamMember[]) => void;
  saveTeamMember: (member: TeamMember) => void;
  deleteTeamMember: (id: string) => void;
  setPurchaseOrders: (p: PurchaseOrder[]) => void;
  setAfterSalesTickets: (t: AfterSalesTicket[]) => void;
  saveTicket: (ticket: AfterSalesTicket) => void;
  deleteTicket: (id: string) => void;
  savePurchaseOrder: (po: PurchaseOrder) => void;
  deletePurchaseOrder: (id: string) => void;
  setActivityLog: (a: ActivityEntry[]) => void;
  setBudgetData: (b: Record<string, BudgetItem>) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Navigation
  currentView: 'dashboard',
  setCurrentView: (v) => set({ currentView: v }),

  // Project
  currentProject: 'bcg',
  setCurrentProject: (p) => set({ currentProject: p }),

  // Theme
  isDarkMode: false,
  toggleDarkMode: () => set((s) => {
    const next = !s.isDarkMode;
    if (typeof window !== 'undefined') {
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem('future_os_darkmode', JSON.stringify(next));
    }
    return { isDarkMode: next };
  }),

  // Currency
  currency: 'XOF',
  setCurrency: (c) => set({ currency: c }),

  // Projects view mode
  projectsViewMode: (typeof window !== 'undefined' && localStorage.getItem('future_os_projects_view') === 'calendar') ? 'calendar' : 'cards',
  setProjectsViewMode: (m) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('future_os_projects_view', m);
    }
    set({ projectsViewMode: m });
  },

  // Toasts
  toasts: [],
  addToast: (type, icon, message) => {
    const id = String(Date.now());
    set((s) => ({ toasts: [...s.toasts, { id, type, icon, message }] }));
    setTimeout(() => get().removeToast(id), 4000);
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter(t => t.id !== id) })),

  // Modal
  modalOpen: false,
  modalTitle: '',
  modalContent: null,
  openModal: (title, content) => set({ modalOpen: true, modalTitle: title, modalContent: content }),
  closeModal: () => set({ modalOpen: false, modalTitle: '', modalContent: null }),

  // Service
  _service: null,
  setService: (s) => set({ _service: s }),

  // Activity
  addActivity: (entry) => {
    const state = get();
    const newLog = [entry, ...state.activityLog].slice(0, 100);
    set({ activityLog: newLog });
    state._service?.addActivity(entry);
  },
  clearActivity: () => {
    const state = get();
    set({ activityLog: [] });
    state._service?.clearActivity();
  },

  // Data holders (hydrated on mount)
  products: [],
  projects: [],
  logisticsEvents: [],
  proposals: [],
  expenses: [],
  invoices: [],
  bills: [],
  recurringExpenses: [],
  teamMembers: [],
  purchaseOrders: [],
  afterSalesTickets: [],
  activityLog: [],
  budgetData: {},

  // Setters
  setProducts: (p) => set({ products: p }),
  saveProduct: (product) => {
    const state = get();
    const exists = state.products.some((p) => p.id === product.id);
    set({
      products: exists
        ? state.products.map((p) => (p.id === product.id ? product : p))
        : [...state.products, product],
    });
    state._service?.saveProduct(product);
  },
  deleteProduct: (id) => {
    const state = get();
    set({ products: state.products.filter((p) => p.id !== id) });
    state._service?.deleteProduct(id);
  },
  adjustStock: (id, delta) => {
    const state = get();
    const product = state.products.find((p) => p.id === id);
    if (!product) return;
    const updated: Product = {
      ...product,
      inStock: Math.max(0, product.inStock + delta),
    };
    set({
      products: state.products.map((p) => (p.id === id ? updated : p)),
    });
    state._service?.adjustStock(id, delta);
  },
  setProjects: (p) => set({ projects: p }),
  addProject: (project) => {
    const state = get();
    set({ projects: [...state.projects, project] });
    state._service?.saveProject(project);
  },
  deleteProject: (id) => {
    const state = get();
    set({ projects: state.projects.filter((p) => p.id !== id) });
    state._service?.deleteProject(id);
  },
  setLogisticsEvents: (e) => set({ logisticsEvents: e }),
  setProposals: (p) => set({ proposals: p }),
  setExpenses: (e) => set({ expenses: e }),
  saveExpense: (expense) => {
    const state = get();
    const exists = state.expenses.some((x) => x.id === expense.id);
    set({
      expenses: exists
        ? state.expenses.map((x) => (x.id === expense.id ? expense : x))
        : [expense, ...state.expenses],
    });
    state._service?.saveExpense(expense);
  },
  deleteExpense: (id) => {
    const state = get();
    set({ expenses: state.expenses.filter((x) => x.id !== id) });
    state._service?.deleteExpense(id);
  },
  setInvoices: (i) => set({ invoices: i }),
  saveInvoice: (invoice) => {
    const state = get();
    const exists = state.invoices.some((x) => x.id === invoice.id);
    set({
      invoices: exists
        ? state.invoices.map((x) => (x.id === invoice.id ? invoice : x))
        : [invoice, ...state.invoices],
    });
    state._service?.saveInvoice(invoice);
  },
  deleteInvoice: (id) => {
    const state = get();
    set({ invoices: state.invoices.filter((x) => x.id !== id) });
    state._service?.deleteInvoice(id);
  },
  setBills: (b) => set({ bills: b }),
  saveBill: (bill) => {
    const state = get();
    const exists = state.bills.some((x) => x.id === bill.id);
    set({
      bills: exists
        ? state.bills.map((x) => (x.id === bill.id ? bill : x))
        : [bill, ...state.bills],
    });
    state._service?.saveBill(bill);
  },
  deleteBill: (id) => {
    const state = get();
    set({ bills: state.bills.filter((x) => x.id !== id) });
    state._service?.deleteBill(id);
  },
  setRecurringExpenses: (r) => set({ recurringExpenses: r }),
  saveRecurring: (re) => {
    const state = get();
    const exists = state.recurringExpenses.some((x) => x.id === re.id);
    set({
      recurringExpenses: exists
        ? state.recurringExpenses.map((x) => (x.id === re.id ? re : x))
        : [...state.recurringExpenses, re],
    });
    state._service?.saveRecurringExpense(re);
  },
  deleteRecurring: (id) => {
    const state = get();
    set({ recurringExpenses: state.recurringExpenses.filter((x) => x.id !== id) });
    state._service?.deleteRecurringExpense(id);
  },
  setTeamMembers: (t) => set({ teamMembers: t }),
  saveTeamMember: (member) => {
    const state = get();
    const exists = state.teamMembers.some((m) => m.id === member.id);
    set({
      teamMembers: exists
        ? state.teamMembers.map((m) => (m.id === member.id ? member : m))
        : [...state.teamMembers, member],
    });
    state._service?.saveTeamMember(member);
  },
  deleteTeamMember: (id) => {
    const state = get();
    set({ teamMembers: state.teamMembers.filter((m) => m.id !== id) });
    state._service?.deleteTeamMember(id);
  },
  setPurchaseOrders: (p) => set({ purchaseOrders: p }),
  setAfterSalesTickets: (t) => set({ afterSalesTickets: t }),
  saveTicket: (ticket) => {
    const state = get();
    const exists = state.afterSalesTickets.some((t) => t.id === ticket.id);
    set({
      afterSalesTickets: exists
        ? state.afterSalesTickets.map((t) => (t.id === ticket.id ? ticket : t))
        : [ticket, ...state.afterSalesTickets],
    });
    state._service?.saveTicket(ticket);
  },
  deleteTicket: (id) => {
    const state = get();
    set({ afterSalesTickets: state.afterSalesTickets.filter((t) => t.id !== id) });
    state._service?.deleteTicket(id);
  },
  savePurchaseOrder: (po) => {
    const state = get();
    const exists = state.purchaseOrders.some((p) => p.id === po.id);
    set({
      purchaseOrders: exists
        ? state.purchaseOrders.map((p) => (p.id === po.id ? po : p))
        : [po, ...state.purchaseOrders],
    });
    state._service?.savePurchaseOrder(po);
  },
  deletePurchaseOrder: (id) => {
    const state = get();
    set({ purchaseOrders: state.purchaseOrders.filter((p) => p.id !== id) });
    state._service?.deletePurchaseOrder(id);
  },
  setActivityLog: (a) => set({ activityLog: a }),
  setBudgetData: (b) => set({ budgetData: b }),
}));
