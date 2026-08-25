import type {
  IAppService, Product, Project, LogisticsEvent, Proposal,
  Expense, Invoice, Bill, RecurringExpense, TeamMember,
  PurchaseOrder, AfterSalesTicket, ActivityEntry, BudgetItem,
} from './types';

// ── Offline cache helpers ─────────────────────────────────────
function cacheGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(`future_os_cache_${key}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function cacheSet<T>(key: string, data: T): void {
  try {
    localStorage.setItem(`future_os_cache_${key}`, JSON.stringify(data));
  } catch { /* quota exceeded */ }
}

// ── API fetcher with offline fallback ─────────────────────────
async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const cacheKey = path.replace(/\//g, '_');

  try {
    const res = await fetch(path, {
      headers: { 'Content-Type': 'application/json' },
      ...init,
    });
    if (!res.ok) throw new Error(`API ${res.status}`);
    const data = await res.json();
    // Cache successful GET responses for offline use
    if (!init?.method || init.method === 'GET') {
      cacheSet(cacheKey, data);
    }
    return data;
  } catch {
    // Network error — try cache
    const cached = cacheGet<T>(cacheKey);
    if (cached) return cached;
    throw new Error(`API ${init?.method || 'GET'} ${path} failed and no cache available`);
  }
}

export function apiService(): IAppService {
  return {
    // ── Products ────────────────────────────────────────────────
    getProducts() { return []; }, // hydrated async
    getProduct(_id: string) { return undefined; },

    // ── Projects ────────────────────────────────────────────────
    getProjects() { return []; },
    getProject(_id: string) { return undefined; },

    // ── Logistics ───────────────────────────────────────────────
    getLogisticsEvents() { return []; },

    // ── Proposals ───────────────────────────────────────────────
    getProposals() { return []; },
    saveProposal(proposal: Proposal) {
      const method = proposal.id ? 'PUT' : 'POST';
      const path = proposal.id ? `/api/proposals/${proposal.id}` : '/api/proposals';
      api(path, { method, body: JSON.stringify(proposal) });
    },
    deleteProposal(id: string) {
      api(`/api/proposals/${id}`, { method: 'DELETE' });
    },

    // ── Expenses ────────────────────────────────────────────────
    getExpenses() { return []; },
    addExpense(expense: Expense) {
      api('/api/expenses', { method: 'POST', body: JSON.stringify(expense) });
    },
    deleteExpense(id: string) {
      api(`/api/expenses/${id}`, { method: 'DELETE' });
    },

    // ── Invoices ────────────────────────────────────────────────
    getInvoices() { return []; },
    addInvoice(invoice: Invoice) {
      api('/api/invoices', { method: 'POST', body: JSON.stringify(invoice) });
    },
    deleteInvoice(id: string) {
      api(`/api/invoices/${id}`, { method: 'DELETE' });
    },

    // ── Bills ───────────────────────────────────────────────────
    getBills() { return []; },
    addBill(bill: Bill) {
      api('/api/bills', { method: 'POST', body: JSON.stringify(bill) });
    },
    deleteBill(id: string) {
      api(`/api/bills/${id}`, { method: 'DELETE' });
    },

    // ── Recurring ───────────────────────────────────────────────
    getRecurringExpenses() { return []; },
    addRecurringExpense(re: RecurringExpense) {
      api('/api/recurring', { method: 'POST', body: JSON.stringify(re) });
    },
    updateRecurringExpense(re: RecurringExpense) {
      api(`/api/recurring/${re.id}`, { method: 'PUT', body: JSON.stringify(re) });
    },

    // ── Team ────────────────────────────────────────────────────
    getTeamMembers() { return []; },
    addTeamMember(member: TeamMember) {
      api('/api/team', { method: 'POST', body: JSON.stringify(member) });
    },
    deleteTeamMember(id: string) {
      api(`/api/team/${id}`, { method: 'DELETE' });
    },

    // ── Activity ────────────────────────────────────────────────
    getActivityLog() { return []; },
    addActivity(entry: ActivityEntry) {
      api('/api/activity', { method: 'POST', body: JSON.stringify(entry) });
    },
    clearActivity() {
      api('/api/activity', { method: 'DELETE' });
    },

    // ── Purchase Orders ─────────────────────────────────────────
    getPurchaseOrders() { return []; },

    // ── After-Sales ─────────────────────────────────────────────
    getAfterSalesTickets() { return []; },

    // ── Budget ──────────────────────────────────────────────────
    getBudgetData() { return {}; },
  };
}

// ── Async fetchers for hydration ───────────────────────────────
export async function fetchProducts(): Promise<Product[]> {
  return api<Product[]>('/api/products');
}

export async function fetchProjects(): Promise<Project[]> {
  return api<Project[]>('/api/projects');
}

export async function fetchProposals(): Promise<Proposal[]> {
  return api<Proposal[]>('/api/proposals');
}

export async function fetchExpenses(): Promise<Expense[]> {
  return api<Expense[]>('/api/expenses');
}

export async function fetchInvoices(): Promise<Invoice[]> {
  return api<Invoice[]>('/api/invoices');
}

export async function fetchBills(): Promise<Bill[]> {
  return api<Bill[]>('/api/bills');
}

export async function fetchRecurringExpenses(): Promise<RecurringExpense[]> {
  return api<RecurringExpense[]>('/api/recurring');
}

export async function fetchTeamMembers(): Promise<TeamMember[]> {
  return api<TeamMember[]>('/api/team');
}

export async function fetchPurchaseOrders(): Promise<PurchaseOrder[]> {
  return api<PurchaseOrder[]>('/api/purchase-orders');
}

export async function fetchAfterSalesTickets(): Promise<AfterSalesTicket[]> {
  return api<AfterSalesTicket[]>('/api/after-sales');
}

export async function fetchLogisticsEvents(): Promise<LogisticsEvent[]> {
  return api<LogisticsEvent[]>('/api/logistics');
}

export async function fetchActivityLog(): Promise<ActivityEntry[]> {
  return api<ActivityEntry[]>('/api/activity');
}

export async function fetchBudgetData(): Promise<Record<string, BudgetItem>> {
  const items = await api<BudgetItem[]>('/api/budget');
  return Object.fromEntries(items.map((b) => [b.category, b]));
}
