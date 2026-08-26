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

export type ExpenseStatus = 'pending' | 'approved' | 'rejected';
export type InvoiceStatus = 'draft' | 'pending' | 'partial' | 'paid' | 'overdue';
export type BillStatus = 'pending' | 'paid' | 'overdue';

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  status: ExpenseStatus;
  approval: ExpenseStatus;
  createdBy: string;
}

export interface InvoiceItem {
  description: string;
  qty: number;
  unitPrice: number;
}

export interface Invoice {
  id: string;
  client: string;
  amount: number;
  date: string;
  status: InvoiceStatus;
  dueDate: string;
  paidAmount: number;
  items: InvoiceItem[];
}

export interface Bill {
  id: string;
  supplier: string;
  amount: number;
  date: string;
  status: BillStatus;
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

export type PurchaseOrderStatus = 'draft' | 'processing' | 'in-transit' | 'delivered';

export interface PurchaseOrderItem {
  productId: string;
  qty: number;
}

export interface PurchaseOrder {
  id: string;
  supplier: string;
  items: PurchaseOrderItem[];
  totalAmount: number;
  status: PurchaseOrderStatus;
  date: string;
  expectedDelivery: string;
}

export type TicketPriority = 'Low' | 'Medium' | 'High';
export type TicketStatus = 'Open' | 'In Progress' | 'Pending Parts' | 'Resolved';

export interface AfterSalesTicket {
  id: string;
  client: string;
  project: string;
  issue: string;
  priority: TicketPriority;
  status: TicketStatus;
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
  id: string;
  category: string;
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
  saveProduct(product: Product): void;
  deleteProduct(id: string): void;
  adjustStock(id: string, delta: number): void;

  // Projects
  getProjects(): Project[];
  getProject(id: string): Project | undefined;
  saveProject(project: Project): void;
  deleteProject(id: string): void;

  // Logistics
  getLogisticsEvents(): LogisticsEvent[];

  // Proposals (CRUD)
  getProposals(): Proposal[];
  saveProposal(proposal: Proposal): void;
  deleteProposal(id: string): void;

  // Expenses
  getExpenses(): Expense[];
  saveExpense(expense: Expense): void;
  deleteExpense(id: string): void;

  // Invoices
  getInvoices(): Invoice[];
  saveInvoice(invoice: Invoice): void;
  deleteInvoice(id: string): void;

  // Bills
  getBills(): Bill[];
  saveBill(bill: Bill): void;
  deleteBill(id: string): void;

  // Recurring
  getRecurringExpenses(): RecurringExpense[];
  saveRecurringExpense(re: RecurringExpense): void;
  deleteRecurringExpense(id: string): void;

  // Team
  getTeamMembers(): TeamMember[];
  saveTeamMember(member: TeamMember): void;
  deleteTeamMember(id: string): void;

  // Activity
  getActivityLog(): ActivityEntry[];
  addActivity(entry: ActivityEntry): void;
  clearActivity(): void;

  // Purchase Orders
  getPurchaseOrders(): PurchaseOrder[];
  savePurchaseOrder(po: PurchaseOrder): void;
  deletePurchaseOrder(id: string): void;

  // After-Sales
  getAfterSalesTickets(): AfterSalesTicket[];
  saveTicket(ticket: AfterSalesTicket): void;
  deleteTicket(id: string): void;

  // Budget
  getBudgetData(): Record<string, BudgetItem>;
}
