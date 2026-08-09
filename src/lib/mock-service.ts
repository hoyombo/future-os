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
} from './mock-data';

// ── LocalStorage helpers ──────────────────────────────────────
function load<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(`future_os_${key}`);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch { return fallback; }
}

function save<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(`future_os_${key}`, JSON.stringify(data)); } catch {}
}

// ── Factory ───────────────────────────────────────────────────
export function mockService(): IAppService {
  // Mutable state (survives page reload via localStorage)
  let proposals: Proposal[] = load<Proposal[]>('proposals', []);
  let expenses: Expense[] = load<Expense[]>('expenses', []);
  let invoices: Invoice[] = load<Invoice[]>('invoices', []);
  let bills: Bill[] = load<Bill[]>('bills', []);
  let recurringExpenses: RecurringExpense[] = load<RecurringExpense[]>('recurring', []);
  let teamMembers: TeamMember[] = load<TeamMember[]>('team', []);
  let activityLog: ActivityEntry[] = load<ActivityEntry[]>('activity', []);

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

    // ── Bills (CRUD) ──────────────────────────────────────────
    getBills() { return bills; },
    addBill(bill: Bill) {
      bills.push(bill);
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
