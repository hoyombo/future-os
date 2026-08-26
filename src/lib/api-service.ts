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
      credentials: 'include',
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
    saveProduct(product: Product) {
      const method = product.id ? 'PUT' : 'POST';
      const path = product.id ? `/api/products/${product.id}` : '/api/products';
      api(path, { method, body: JSON.stringify(product) });
    },
    deleteProduct(id: string) {
      api(`/api/products/${id}`, { method: 'DELETE' });
    },
    adjustStock(id: string, delta: number) {
      api(`/api/products/${id}`, { method: 'PATCH', body: JSON.stringify({ delta }) });
    },

    // ── Projects ────────────────────────────────────────────────
    getProjects() { return []; },
    getProject(_id: string) { return undefined; },
    saveProject(project: Project) {
      const method = project.id ? 'PUT' : 'POST';
      const path = project.id ? `/api/projects/${project.id}` : '/api/projects';
      api(path, { method, body: JSON.stringify(project) });
    },
    deleteProject(id: string) {
      api(`/api/projects/${id}`, { method: 'DELETE' });
    },

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
    saveExpense(expense: Expense) {
      const isNew = /^\d+$/.test(expense.id);
      const path = isNew ? '/api/expenses' : `/api/expenses/${expense.id}`;
      const method = isNew ? 'POST' : 'PUT';
      api(path, { method, body: JSON.stringify(expense) });
    },
    deleteExpense(id: string) {
      api(`/api/expenses/${id}`, { method: 'DELETE' });
    },

    // ── Invoices ────────────────────────────────────────────────
    getInvoices() { return []; },
    saveInvoice(invoice: Invoice) {
      const isNew = /^\d+$/.test(invoice.id);
      const path = isNew ? '/api/invoices' : `/api/invoices/${invoice.id}`;
      const method = isNew ? 'POST' : 'PUT';
      api(path, { method, body: JSON.stringify(invoice) });
    },
    deleteInvoice(id: string) {
      api(`/api/invoices/${id}`, { method: 'DELETE' });
    },

    // ── Bills ───────────────────────────────────────────────────
    getBills() { return []; },
    saveBill(bill: Bill) {
      const isNew = /^\d+$/.test(bill.id);
      const path = isNew ? '/api/bills' : `/api/bills/${bill.id}`;
      const method = isNew ? 'POST' : 'PUT';
      api(path, { method, body: JSON.stringify(bill) });
    },
    deleteBill(id: string) {
      api(`/api/bills/${id}`, { method: 'DELETE' });
    },

    // ── Recurring ───────────────────────────────────────────────
    getRecurringExpenses() { return []; },
    saveRecurringExpense(re: RecurringExpense) {
      const isNew = /^\d+$/.test(re.id);
      const path = isNew ? '/api/recurring' : `/api/recurring/${re.id}`;
      const method = isNew ? 'POST' : 'PUT';
      api(path, { method, body: JSON.stringify(re) });
    },
    deleteRecurringExpense(id: string) {
      api(`/api/recurring/${id}`, { method: 'DELETE' });
    },

    // ── Team ────────────────────────────────────────────────────
    getTeamMembers() { return []; },
    saveTeamMember(member: TeamMember) {
      const isNew = /^\d+$/.test(member.id);
      const path = isNew ? '/api/team' : `/api/team/${member.id}`;
      api(path, { method: isNew ? 'POST' : 'PUT', body: JSON.stringify(member) });
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

    savePurchaseOrder(po: PurchaseOrder) {
      // UI-generated ids are numeric (generateId()); seeded/DB ids are not.
      const isNew = /^\d+$/.test(po.id);
      const path = isNew ? '/api/purchase-orders/create' : `/api/purchase-orders/${po.id}`;
      api(path, { method: 'POST', body: JSON.stringify(po) });
    },
    deletePurchaseOrder(id: string) {
      api(`/api/purchase-orders/${id}`, { method: 'DELETE' });
    },

    // ── After-Sales ─────────────────────────────────────────────
    getAfterSalesTickets() { return []; },

    saveTicket(ticket: AfterSalesTicket) {
      const isNew = /^\d+$/.test(ticket.id);
      const path = isNew ? '/api/after-sales/create' : `/api/after-sales/${ticket.id}`;
      api(path, { method: 'POST', body: JSON.stringify(ticket) });
    },
    deleteTicket(id: string) {
      api(`/api/after-sales/${id}`, { method: 'DELETE' });
    },

    // ── Budget ──────────────────────────────────────────────────
    getBudgetData() { return {}; },
  };
}

// ── Async fetchers for hydration ───────────────────────────────
// DB rows may carry PascalCase statuses from seed data ('Paid', 'In Transit');
// the frontend expects lowercase kebab-case. Normalize on hydration.
function normalizeStatus<T extends string>(value: unknown): T {
  return String(value ?? '').trim().toLowerCase().replace(/\s+/g, '-') as T;
}

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
  const rows = await api<Expense[]>('/api/expenses');
  return rows.map((r) => ({ ...r, status: normalizeStatus(r.status), approval: normalizeStatus(r.approval) }));
}

export async function fetchInvoices(): Promise<Invoice[]> {
  const rows = await api<Invoice[]>('/api/invoices');
  return rows.map((r) => ({ ...r, status: normalizeStatus(r.status), dueDate: String(r.dueDate).slice(0, 10), date: String(r.date).slice(0, 10) }));
}

export async function fetchBills(): Promise<Bill[]> {
  const rows = await api<Bill[]>('/api/bills');
  return rows.map((r) => ({ ...r, status: normalizeStatus(r.status), dueDate: String(r.dueDate).slice(0, 10), date: String(r.date).slice(0, 10) }));
}

export async function fetchRecurringExpenses(): Promise<RecurringExpense[]> {
  return api<RecurringExpense[]>('/api/recurring');
}

export async function fetchTeamMembers(): Promise<TeamMember[]> {
  return api<TeamMember[]>('/api/team');
}

export async function fetchPurchaseOrders(): Promise<PurchaseOrder[]> {
  const rows = await api<PurchaseOrder[]>('/api/purchase-orders');
  return rows.map((r) => ({ ...r, status: normalizeStatus(r.status), date: String(r.date).slice(0, 10), expectedDelivery: String(r.expectedDelivery).slice(0, 10) }));
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
