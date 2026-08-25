// ──────────────────────────────────────────────────────────────
//  Future OS · Vision & Cost — Mock Service Implementation
//  ═══════════════════════════════════════════════════════════
//  This service uses localStorage for persistence and static
//  mock data. Remove this file + mock-data.ts when going live.
// ──────────────────────────────────────────────────────────────

import type {
  IAppService, Product, Project, LogisticsEvent, Proposal,
  Expense, Invoice, Bill, RecurringExpense, TeamMember,
  PurchaseOrder, AfterSalesTicket, ActivityEntry, BudgetItem,
} from './types';
import {
  PRODUCTS, PROJECTS_DATA, LOGISTICS_EVENTS,
  PURCHASE_ORDERS, AFTER_SALES_TICKETS, BUDGET_DATA,
  SEED_TEAM, SEED_EXPENSES, SEED_INVOICES, SEED_BILLS, SEED_RECURRING,
  SEED_PROPOSALS, SEED_ACTIVITY,
} from './mock-data';

// ── LocalStorage helpers ──────────────────────────────────────
let _quotaExceededNotified = false;

function load<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(`future_os_${key}`);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, data: T): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(`future_os_${key}`, JSON.stringify(data));
    return true;
  } catch (err) {
    const isQuota = err instanceof DOMException && (
      err.name === 'QuotaExceededError' ||
      err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      (err as DOMException).code === 22 ||
      (err as DOMException).code === 1014
    );
    if (isQuota && !_quotaExceededNotified) {
      _quotaExceededNotified = true;
      // Dispatch a custom event the UI can listen to
      window.dispatchEvent(new CustomEvent('future-os:storage-quota', {
        detail: { key, message: 'Storage is full. Some data may not be saved. Consider exporting your data.' },
      }));
    }
    return false;
  }
}

// ── Factory ───────────────────────────────────────────────────
export function mockService(): IAppService {
  // Mutable state (survives page reload via localStorage)
  let proposals: Proposal[] = load<Proposal[]>('proposals', SEED_PROPOSALS);
  let expenses: Expense[] = load<Expense[]>('expenses', SEED_EXPENSES);
  let invoices: Invoice[] = load<Invoice[]>('invoices', SEED_INVOICES);
  let bills: Bill[] = load<Bill[]>('bills', SEED_BILLS);
  let recurringExpenses: RecurringExpense[] = load<RecurringExpense[]>('recurring', SEED_RECURRING);
  let teamMembers: TeamMember[] = load<TeamMember[]>('team', SEED_TEAM);
  let projects: Project[] = load<Project[]>('projects', PROJECTS_DATA);
  let products: Product[] = load<Product[]>('products', PRODUCTS);
  let purchaseOrders: PurchaseOrder[] = load<PurchaseOrder[]>('purchase_orders', PURCHASE_ORDERS);
  let afterSalesTickets: AfterSalesTicket[] = load<AfterSalesTicket[]>('after_sales', AFTER_SALES_TICKETS);
  let activityLog: ActivityEntry[] = load<ActivityEntry[]>('activity', SEED_ACTIVITY);

  return {
    // ── Products (CRUD) ───────────────────────────────────────
    getProducts() { return products; },
    getProduct(id: string) { return products.find(p => p.id === id); },
    saveProduct(product: Product) {
      const idx = products.findIndex(p => p.id === product.id);
      if (idx >= 0) products[idx] = product;
      else products.push(product);
      save('products', products);
    },
    deleteProduct(id: string) {
      products = products.filter(p => p.id !== id);
      save('products', products);
    },
    adjustStock(id: string, delta: number) {
      const product = products.find(p => p.id === id);
      if (!product) return;
      product.inStock = Math.max(0, product.inStock + delta);
      save('products', products);
    },

    // ── Projects (CRUD) ───────────────────────────────────────
    getProjects() { return projects; },
    getProject(id: string) { return projects.find(p => p.id === id); },
    saveProject(project: Project) {
      const idx = projects.findIndex(p => p.id === project.id);
      if (idx >= 0) projects[idx] = project;
      else projects.push(project);
      save('projects', projects);
    },
    deleteProject(id: string) {
      projects = projects.filter(p => p.id !== id);
      save('projects', projects);
    },

    // ── Logistics (read-only) ─────────────────────────────────
    getLogisticsEvents() { return LOGISTICS_EVENTS; },

    // ── Proposals (CRUD) ─────────────────────────────────────
    getProposals() { return proposals; },
    saveProposal(proposal: Proposal) {
      const idx = proposals.findIndex(p => p.id === proposal.id);
      if (idx >= 0) proposals[idx] = proposal;
      else proposals.push(proposal);
      save('proposals', proposals);
    },
    deleteProposal(id: string) {
      proposals = proposals.filter(p => p.id !== id);
      save('proposals', proposals);
    },

    // ── Expenses (CRUD) ─────────────────────────────────────
    getExpenses() { return expenses; },
    saveExpense(expense: Expense) {
      const idx = expenses.findIndex(e => e.id === expense.id);
      if (idx >= 0) expenses[idx] = expense;
      else expenses.unshift(expense);
      save('expenses', expenses);
    },
    deleteExpense(id: string) {
      expenses = expenses.filter(e => e.id !== id);
      save('expenses', expenses);
    },

    // ── Invoices (CRUD) ──────────────────────────────────────
    getInvoices() { return invoices; },
    saveInvoice(invoice: Invoice) {
      const idx = invoices.findIndex(i => i.id === invoice.id);
      if (idx >= 0) invoices[idx] = invoice;
      else invoices.unshift(invoice);
      save('invoices', invoices);
    },
    deleteInvoice(id: string) {
      invoices = invoices.filter(i => i.id !== id);
      save('invoices', invoices);
    },

    // ── Bills (CRUD) ──────────────────────────────────────────
    getBills() { return bills; },
    saveBill(bill: Bill) {
      const idx = bills.findIndex(b => b.id === bill.id);
      if (idx >= 0) bills[idx] = bill;
      else bills.unshift(bill);
      save('bills', bills);
    },
    deleteBill(id: string) {
      bills = bills.filter(b => b.id !== id);
      save('bills', bills);
    },

    // ── Recurring Expenses (CRUD) ────────────────────────────
    getRecurringExpenses() { return recurringExpenses; },
    saveRecurringExpense(re: RecurringExpense) {
      const idx = recurringExpenses.findIndex(r => r.id === re.id);
      if (idx >= 0) recurringExpenses[idx] = re;
      else recurringExpenses.push(re);
      save('recurring', recurringExpenses);
    },
    deleteRecurringExpense(id: string) {
      recurringExpenses = recurringExpenses.filter(r => r.id !== id);
      save('recurring', recurringExpenses);
    },

    // ── Team (CRUD) ──────────────────────────────────────────
    getTeamMembers() { return teamMembers; },
    saveTeamMember(member: TeamMember) {
      const idx = teamMembers.findIndex(m => m.id === member.id);
      if (idx >= 0) teamMembers[idx] = member;
      else teamMembers.push(member);
      save('team', teamMembers);
    },
    deleteTeamMember(id: string) {
      teamMembers = teamMembers.filter(m => m.id !== id);
      save('team', teamMembers);
    },

    // ── Activity Log ──────────────────────────────────────────
    getActivityLog() { return activityLog; },
    addActivity(entry: ActivityEntry) {
      activityLog.unshift(entry);
      if (activityLog.length > 100) activityLog = activityLog.slice(0, 100);
      save('activity', activityLog);
    },
    clearActivity() {
      activityLog = [];
      save('activity', activityLog);
    },

    // ── Purchase Orders (CRUD) ────────────────────────────────
    getPurchaseOrders() { return purchaseOrders; },
    savePurchaseOrder(po: PurchaseOrder) {
      const idx = purchaseOrders.findIndex(p => p.id === po.id);
      if (idx >= 0) purchaseOrders[idx] = po;
      else purchaseOrders.unshift(po);
      save('purchase_orders', purchaseOrders);
    },
    deletePurchaseOrder(id: string) {
      purchaseOrders = purchaseOrders.filter(p => p.id !== id);
      save('purchase_orders', purchaseOrders);
    },

    // ── After-Sales (CRUD) ────────────────────────────────────
    getAfterSalesTickets() { return afterSalesTickets; },
    saveTicket(ticket: AfterSalesTicket) {
      const idx = afterSalesTickets.findIndex(t => t.id === ticket.id);
      if (idx >= 0) afterSalesTickets[idx] = ticket;
      else afterSalesTickets.unshift(ticket);
      save('after_sales', afterSalesTickets);
    },
    deleteTicket(id: string) {
      afterSalesTickets = afterSalesTickets.filter(t => t.id !== id);
      save('after_sales', afterSalesTickets);
    },

    // ── Budget (read-only) ───────────────────────────────────
    getBudgetData() { return BUDGET_DATA as Record<string, BudgetItem>; },
  };
}
