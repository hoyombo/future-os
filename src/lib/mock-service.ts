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
  let activityLog: ActivityEntry[] = load<ActivityEntry[]>('activity', SEED_ACTIVITY);

  return {
    // ── Products (read-only from mock data) ──────────────────
    getProducts() { return PRODUCTS; },
    getProduct(id: string) { return PRODUCTS.find(p => p.id === id); },

    // ── Projects (read-only from mock data) ─────────────────
    getProjects() { return PROJECTS_DATA; },
    getProject(id: string) { return PROJECTS_DATA.find(p => p.id === id); },

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
    addExpense(expense: Expense) {
      expenses.push(expense);
      save('expenses', expenses);
    },
    deleteExpense(id: string) {
      expenses = expenses.filter(e => e.id !== id);
      save('expenses', expenses);
    },

    // ── Invoices (CRUD) ──────────────────────────────────────
    getInvoices() { return invoices; },
    addInvoice(invoice: Invoice) {
      invoices.push(invoice);
      save('invoices', invoices);
    },
    deleteInvoice(id: string) {
      invoices = invoices.filter(i => i.id !== id);
      save('invoices', invoices);
    },

    // ── Bills (CRUD) ──────────────────────────────────────────
    getBills() { return bills; },
    addBill(bill: Bill) {
      bills.push(bill);
      save('bills', bills);
    },
    deleteBill(id: string) {
      bills = bills.filter(b => b.id !== id);
      save('bills', bills);
    },

    // ── Recurring Expenses (CRUD) ────────────────────────────
    getRecurringExpenses() { return recurringExpenses; },
    addRecurringExpense(re: RecurringExpense) {
      recurringExpenses.push(re);
      save('recurring', recurringExpenses);
    },
    updateRecurringExpense(re: RecurringExpense) {
      const idx = recurringExpenses.findIndex(r => r.id === re.id);
      if (idx >= 0) recurringExpenses[idx] = re;
      save('recurring', recurringExpenses);
    },

    // ── Team (CRUD) ──────────────────────────────────────────
    getTeamMembers() { return teamMembers; },
    addTeamMember(member: TeamMember) {
      teamMembers.push(member);
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

    // ── Purchase Orders (read-only) ──────────────────────────
    getPurchaseOrders() { return PURCHASE_ORDERS; },

    // ── After-Sales (read-only) ──────────────────────────────
    getAfterSalesTickets() { return AFTER_SALES_TICKETS; },

    // ── Budget (read-only) ───────────────────────────────────
    getBudgetData() { return BUDGET_DATA as Record<string, BudgetItem>; },
  };
}
