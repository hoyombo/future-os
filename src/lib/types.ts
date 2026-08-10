// ──────────────────────────────────────────────────────────────
//  Future OS · Vision & Cost — Type Definitions
// ──────────────────────────────────────────────────────────────

export type Currency = 'XOF' | 'EUR' | 'USD';

export type ViewName =
  | 'dashboard'
  | 'proposals'
  | 'catalog'
  | 'projects'
  | 'inventory'
  | 'procurement'
  | 'aftersales'
  | 'finance'
  | 'team'
  | 'reports';

export type ProductCategory = 'seating' | 'desks' | 'walls' | 'lighting' | 'storage';

export type Status = 'green' | 'orange' | 'red' | 'blue' | 'gold' | 'purple';

export interface Product {
  id: string;
  name: string;
  supplier: string;
  category: ProductCategory;
  emoji: string;
  cost: number;       // purchase cost in XOF
  price: number;      // selling price in XOF
  stock: number;      // total ordered
  inStock: number;     // available in warehouse
  specs: string;
  description: string;
  origin: string;
  leadTime: number;    // days
  imageUrl?: string;  // product photo URL
}

export interface Project {
  id: string;
  name: string;
  client: string;
  budget: number;
  spent: number;
  status: 'active' | 'completed' | 'on-hold';
  phase: string;
  startDate: string;
  endDate: string;
  location: string;
  items: string[];     // product IDs
}

export interface LogisticsEvent {
  title: string;
  desc: string;
  eta: string;
  dot: string;
  timestamp: string;
}

export interface ProposalItem {
  productId: string;
  qty: number;
}

export interface Proposal {
  id: string;
  client: string;
  project: string;
  date: string;
  items: ProposalItem[];
  status: 'draft' | 'sent' | 'approved' | 'rejected';
  createdAt: string;
  sentAt?: string;
  subtotal: number;
  markup: number;
  total: number;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  status: string;
  approval: string;
  createdBy: string;
}

export interface Invoice {
  id: string;
  client: string;
  amount: number;
  date: string;
  status: string;
  dueDate: string;
  paidAmount: number;
}

export interface Bill {
  id: string;
  supplier: string;
  amount: number;
  date: string;
  status: string;
  dueDate: string;
}

export interface RecurringExpense {
  id: string;
  title: string;
  amount: number;
  frequency: 'Monthly' | 'Quarterly' | 'Yearly';
  nextDate: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  status: 'Active' | 'On Leave' | 'Inactive';
}

export interface PurchaseOrder {
  id: string;
  supplier: string;
  items: string;
  totalAmount: number;
  status: string;
  date: string;
  expectedDelivery: string;
}

export interface AfterSalesTicket {
  id: string;
  client: string;
  project: string;
  issue: string;
  priority: string;
  status: string;
  date: string;
}

export interface ActivityEntry {
  id: string;
  text: string;
  detail: string;
  icon: string;
  timestamp: string;
}

export interface BudgetItem {
  budget: number;
  actual: number;
}

// Toast types
export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface Toast {
  id: string;
  type: ToastType;
  icon: string;
  message: string;
}

// Service interface — swap mock for real API by changing the factory
export interface IAppService {
  // Products
  getProducts(): Product[];
  getProduct(id: string): Product | undefined;

  // Projects
  getProjects(): Project[];
  getProject(id: string): Project | undefined;

  // Logistics
  getLogisticsEvents(): LogisticsEvent[];

  // Proposals (CRUD)
  getProposals(): Proposal[];
  saveProposal(proposal: Proposal): void;
  deleteProposal(id: string): void;

  // Expenses
  getExpenses(): Expense[];
  addExpense(expense: Expense): void;
  deleteExpense(id: string): void;

  // Invoices
  getInvoices(): Invoice[];
  addInvoice(invoice: Invoice): void;

  // Bills
  getBills(): Bill[];
  addBill(bill: Bill): void;

  // Recurring
  getRecurringExpenses(): RecurringExpense[];
  addRecurringExpense(re: RecurringExpense): void;
  updateRecurringExpense(re: RecurringExpense): void;

  // Team
  getTeamMembers(): TeamMember[];
  addTeamMember(member: TeamMember): void;
  deleteTeamMember(id: string): void;

  // Activity
  getActivityLog(): ActivityEntry[];
  addActivity(entry: ActivityEntry): void;
  clearActivity(): void;

  // Purchase Orders
  getPurchaseOrders(): PurchaseOrder[];

  // After-Sales
  getAfterSalesTickets(): AfterSalesTicket[];

  // Budget
  getBudgetData(): Record<string, BudgetItem>;
}
