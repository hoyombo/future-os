import { Schema, Table, column } from '@powersync/web';

// ── PowerSync schema — mirrors Prisma schema ──────────────────
// Tables listed here are managed by PowerSync's sync engine.
// Only synced tables should be listed here.

const products = new Table({
  name: column.text,
  supplier: column.text,
  category: column.text,
  emoji: column.text,
  cost: column.integer,
  price: column.integer,
  stock: column.integer,
  inStock: column.integer,
  specs: column.text,
  description: column.text,
  origin: column.text,
  leadTime: column.integer,
  imageUrl: column.text,
});

const projects = new Table({
  name: column.text,
  client: column.text,
  budget: column.integer,
  spent: column.integer,
  status: column.text,
  phase: column.text,
  startDate: column.text,
  endDate: column.text,
  location: column.text,
});

const proposals = new Table({
  client: column.text,
  project: column.text,
  date: column.text,
  status: column.text,
  createdAt: column.text,
  sentAt: column.text,
  subtotal: column.integer,
  markup: column.integer,
  total: column.integer,
});

const proposalItems = new Table({
  proposalId: column.text,
  productId: column.text,
  qty: column.integer,
});

const expenses = new Table({
  title: column.text,
  amount: column.integer,
  category: column.text,
  date: column.text,
  status: column.text,
  approval: column.text,
  createdBy: column.text,
});

const invoices = new Table({
  client: column.text,
  amount: column.integer,
  date: column.text,
  status: column.text,
  dueDate: column.text,
  paidAmount: column.integer,
});

const bills = new Table({
  supplier: column.text,
  amount: column.integer,
  date: column.text,
  status: column.text,
  dueDate: column.text,
});

const teamMembers = new Table({
  name: column.text,
  role: column.text,
  status: column.text,
});

const activityLog = new Table({
  text: column.text,
  detail: column.text,
  icon: column.text,
  timestamp: column.text,
});

export const appSchema = new Schema({
  products,
  projects,
  proposals,
  proposalItems,
  expenses,
  invoices,
  bills,
  teamMembers,
  activityLog,
});

export type AppSchema = typeof appSchema;
