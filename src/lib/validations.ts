import { z } from 'zod';

export const expenseSchema = z.object({
  title: z.string().min(1).max(200),
  amount: z.number().int().positive(),
  category: z.string().min(1).max(100),
  date: z.string().min(1),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  approval: z.enum(['pending', 'approved', 'rejected']).optional(),
  createdBy: z.string().min(1).max(200),
});

export const invoiceSchema = z.object({
  client: z.string().min(1).max(200),
  amount: z.number().int().positive(),
  date: z.string().min(1),
  status: z.enum(['pending', 'partial', 'paid']).optional(),
  dueDate: z.string().min(1),
  paidAmount: z.number().int().min(0).optional(),
});

export const billSchema = z.object({
  supplier: z.string().min(1).max(200),
  amount: z.number().int().positive(),
  date: z.string().min(1),
  status: z.enum(['pending', 'paid']).optional(),
  dueDate: z.string().min(1),
});

export const recurringExpenseSchema = z.object({
  title: z.string().min(1).max(200),
  amount: z.number().int().positive(),
  frequency: z.enum(['Monthly', 'Quarterly', 'Yearly']),
  nextDate: z.string().min(1),
});

export const proposalItemSchema = z.object({
  productId: z.string().min(1),
  qty: z.number().int().positive(),
});

export const proposalSchema = z.object({
  client: z.string().min(1).max(200),
  project: z.string().min(1).max(200),
  date: z.string().min(1),
  status: z.enum(['draft', 'sent', 'approved', 'rejected']).optional(),
  subtotal: z.number().int().min(0),
  markup: z.number().int().min(0),
  total: z.number().int().min(0),
  items: z.array(proposalItemSchema).optional(),
});

export const productSchema = z.object({
  name: z.string().min(1).max(200),
  supplier: z.string().min(1).max(200),
  category: z.enum(['seating', 'desks', 'walls', 'lighting', 'storage']),
  cost: z.number().int().min(0),
  price: z.number().int().min(0),
  stock: z.number().int().min(0),
  inStock: z.number().int().min(0).optional(),
  specs: z.string().max(1000).optional(),
  description: z.string().max(2000).optional(),
  origin: z.string().max(200).optional(),
  leadTime: z.number().int().min(0).optional(),
});

export const projectItemSchema = z.object({
  productId: z.string().min(1),
});

export const projectSchema = z.object({
  name: z.string().min(1).max(200),
  client: z.string().min(1).max(200),
  budget: z.number().int().min(0),
  spent: z.number().int().min(0).optional(),
  status: z.enum(['active', 'completed', 'on-hold']).optional(),
  phase: z.string().min(1).max(200),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  location: z.string().min(1).max(200),
  items: z.array(projectItemSchema).optional(),
});

export const teamMemberSchema = z.object({
  name: z.string().min(1).max(200),
  role: z.string().min(1).max(200),
  status: z.enum(['Active', 'On Leave', 'Inactive']).optional(),
});

export const purchaseOrderSchema = z.object({
  supplier: z.string().min(1).max(200),
  items: z.string().min(1),
  totalAmount: z.number().int().positive(),
  status: z.enum(['draft', 'processing', 'in-transit', 'delivered']).optional(),
  date: z.string().min(1),
  expectedDelivery: z.string().min(1),
});

export const afterSalesTicketSchema = z.object({
  client: z.string().min(1).max(200),
  project: z.string().min(1).max(200),
  issue: z.string().min(1).max(1000),
  priority: z.enum(['Low', 'Medium', 'High']).optional(),
  status: z.enum(['Open', 'In Progress', 'Pending Parts', 'Resolved']).optional(),
  date: z.string().min(1),
});

export const activityEntrySchema = z.object({
  text: z.string().min(1).max(500),
  detail: z.string().max(1000).optional(),
  icon: z.string().max(50).optional(),
  timestamp: z.string().min(1),
  userId: z.string().optional(),
});
