// ──────────────────────────────────────────────────────────────
//  Future OS · Vision & Cost — Mock Data
//  ═══════════════════════════════════════════════════════════
//  REMOVE THIS FILE AND UPDATE services.ts to point to a
//  real backend to go live. No other code changes needed.
// ──────────────────────────────────────────────────────────────

import type {
  Product, Project, LogisticsEvent,
  PurchaseOrder, AfterSalesTicket, BudgetItem,
} from './types';

// ── PRODUCTS ──────────────────────────────────────────────────
export const PRODUCTS: Product[] = [
  {
    id: 'p1', name: 'Steelcase Gesture', supplier: 'Steelcase EU', category: 'seating', emoji: '🪑',
    cost: 850000, price: 1150000, stock: 22, inStock: 14,
    specs: 'Ergonomic, 12-yr warranty, 3D LiveBack',
    description: 'Premium task chair with 3D LiveBack technology. Ideal for executive offices.',
    origin: 'Italy', leadTime: 14,
    imageUrl: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/681f9b6f93da.jpg',
  },
  {
    id: 'p2', name: 'Frezza F1 Desk', supplier: 'Frezza IT', category: 'desks', emoji: '🪵',
    cost: 1200000, price: 1650000, stock: 12, inStock: 8,
    specs: '120×75cm, adjustable height, cable mgmt',
    description: 'Modern sit-stand desk with integrated cable management.',
    origin: 'Italy', leadTime: 10,
    imageUrl: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/9401e97dd9de.jpg',
  },
  {
    id: 'p3', name: 'Dieffebi Wall System', supplier: 'Dieffebi FR', category: 'walls', emoji: '🧱',
    cost: 320000, price: 430000, stock: 50, inStock: 45,
    specs: 'Modular, 3m height, acoustic panels',
    description: 'Flexible partition wall system for open offices. Soundproof.',
    origin: 'France', leadTime: 7,
    imageUrl: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/d37db16d548a.jpg',
  },
  {
    id: 'p4', name: 'Luxury LED Panel', supplier: 'Mali Lumière', category: 'lighting', emoji: '💡',
    cost: 150000, price: 210000, stock: 30, inStock: 30,
    specs: '600×600mm, 4000K, dimmable, 50W',
    description: 'High-end LED ceiling panel with daylight simulation. Local assembly.',
    origin: 'Mali (assembled)', leadTime: 3,
    imageUrl: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/71dca60bea28.jpg',
  },
  {
    id: 'p5', name: 'Steelcase Please', supplier: 'Steelcase EU', category: 'seating', emoji: '🪑',
    cost: 780000, price: 1050000, stock: 10, inStock: 5,
    specs: 'Executive chair, leather, lumbar support',
    description: 'Premium executive seating with polished aluminum base.',
    origin: 'Italy', leadTime: 14,
    imageUrl: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/e8a593a82c8a.jpg',
  },
  {
    id: 'p6', name: 'Frezza Meeting Table', supplier: 'Frezza IT', category: 'desks', emoji: '🪵',
    cost: 2400000, price: 3200000, stock: 6, inStock: 4,
    specs: '300×120cm, oval, power outlets',
    description: 'Large conference table with integrated power and data ports.',
    origin: 'Italy', leadTime: 12,
    imageUrl: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/7923d28a1aae.jpg',
  },
  {
    id: 'p7', name: 'Dieffebi Glass Wall', supplier: 'Dieffebi FR', category: 'walls', emoji: '🪟',
    cost: 450000, price: 590000, stock: 20, inStock: 12,
    specs: 'Full glass, 2.5m, soundproof, sliding',
    description: 'Elegant glass partition with sliding doors. Modern aesthetic.',
    origin: 'France', leadTime: 10,
    imageUrl: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/5b7087af96f6.jpg',
  },
  {
    id: 'p8', name: 'SmartTrack Lighting', supplier: 'Mali Lumière', category: 'lighting', emoji: '💡',
    cost: 98000, price: 135000, stock: 60, inStock: 48,
    specs: 'Track system, 24V, dimmable LEDs',
    description: 'Versatile track lighting for galleries, showrooms, and offices.',
    origin: 'Mali (assembled)', leadTime: 2,
    imageUrl: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/d6fc22c73b99.jpg',
  },
  {
    id: 'p9', name: 'Steelcase Storage Cabinet', supplier: 'Steelcase EU', category: 'storage', emoji: '🗄️',
    cost: 550000, price: 750000, stock: 15, inStock: 9,
    specs: '120×45×180cm, lockable, 4 shelves',
    description: 'Secure storage cabinet for offices. Powder-coated steel.',
    origin: 'Italy', leadTime: 14,
    imageUrl: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/fe6c1fac1001.jpg',
  },
  {
    id: 'p10', name: 'Frezza Sideboard', supplier: 'Frezza IT', category: 'storage', emoji: '🗄️',
    cost: 380000, price: 510000, stock: 8, inStock: 6,
    specs: '150×50×75cm, wood veneer, 2 doors',
    description: 'Elegant sideboard for meeting rooms and reception areas.',
    origin: 'Italy', leadTime: 10,
    imageUrl: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/54227993a50c.jpg',
  },
];

// ── PROJECTS ─────────────────────────────────────────────────
export const PROJECTS_DATA: Project[] = [
  {
    id: 'pr1', name: 'BCG Tower', client: 'BCG', budget: 48000000, spent: 31000000,
    status: 'active', phase: 'Installation', startDate: '2026-06-01', endDate: '2026-10-15',
    location: 'Bamako, Mali', items: ['p1', 'p2', 'p3', 'p4'],
  },
  {
    id: 'pr2', name: 'Banque Nationale', client: 'BNP', budget: 35000000, spent: 18000000,
    status: 'active', phase: 'Procurement', startDate: '2026-07-15', endDate: '2026-11-30',
    location: 'Bamako, Mali', items: ['p3', 'p4', 'p5', 'p9'],
  },
  {
    id: 'pr3', name: 'Radisson Blu', client: 'Radisson', budget: 62000000, spent: 55000000,
    status: 'active', phase: 'Final Installation', startDate: '2026-03-01', endDate: '2026-09-30',
    location: 'Bamako, Mali', items: ['p2', 'p6', 'p7', 'p8', 'p10'],
  },
  {
    id: 'pr4', name: 'UN Office Bamako', client: 'UN', budget: 28000000, spent: 27000000,
    status: 'completed', phase: 'Completed', startDate: '2025-11-01', endDate: '2026-04-30',
    location: 'Bamako, Mali', items: ['p1', 'p4', 'p8', 'p9'],
  },
  {
    id: 'pr5', name: 'Mali Digital Hub', client: 'Ministère', budget: 22000000, spent: 8200000,
    status: 'active', phase: 'Design', startDate: '2026-08-01', endDate: '2026-12-20',
    location: 'Bamako, Mali', items: ['p2', 'p3', 'p8', 'p10'],
  },
];

// ── LOGISTICS ────────────────────────────────────────────────
export const LOGISTICS_EVENTS: LogisticsEvent[] = [
  { title: 'Shipped · Milan (Frezza)', desc: 'Container #FR-8821 · 42 units', eta: '✅ Arrived', dot: 'green', timestamp: '2026-08-07' },
  { title: 'In-Transit · Dakar Port', desc: 'Steelcase container · Customs clearance', eta: '2 days', dot: 'gold', timestamp: '2026-08-06' },
  { title: 'Overland · Kayes → Bamako', desc: 'Truck #ML-204 · 60% of route', eta: '3 days', dot: '', timestamp: '2026-08-05' },
  { title: 'Final Delivery · BCG Site', desc: 'Installation crew on standby', eta: '5 days', dot: '', timestamp: '2026-08-04' },
  { title: 'Customs · Bamako Airport', desc: 'LED Panel shipment · 18% VAT pending', eta: '1 day', dot: 'gold', timestamp: '2026-08-03' },
];

// ── PURCHASE ORDERS ──────────────────────────────────────────
export const PURCHASE_ORDERS: PurchaseOrder[] = [
  { id: 'po-001', supplier: 'Steelcase EU', items: 'Steelcase Gesture ×22, Steelcase Please ×10, Storage Cabinet ×15', totalAmount: 31250000, status: 'Delivered', date: '2026-06-15', expectedDelivery: '2026-07-20' },
  { id: 'po-002', supplier: 'Frezza IT', items: 'F1 Desk ×12, Meeting Table ×6, Sideboard ×8', totalAmount: 42600000, status: 'In Transit', date: '2026-07-01', expectedDelivery: '2026-08-10' },
  { id: 'po-003', supplier: 'Dieffebi FR', items: 'Wall System ×50, Glass Wall ×20', totalAmount: 25900000, status: 'Processing', date: '2026-07-20', expectedDelivery: '2026-08-25' },
  { id: 'po-004', supplier: 'Mali Lumière', items: 'LED Panel ×30, SmartTrack ×60', totalAmount: 10800000, status: 'Delivered', date: '2026-06-10', expectedDelivery: '2026-06-20' },
];

// ── AFTER-SALES TICKETS ───────────────────────────────────────
export const AFTER_SALES_TICKETS: AfterSalesTicket[] = [
  { id: 'as-001', client: 'BCG', project: 'BCG Tower', issue: 'Chair armrest loose · 3rd floor', priority: 'Medium', status: 'Open', date: '2026-08-06' },
  { id: 'as-002', client: 'Radisson', project: 'Radisson Blu', issue: 'LED panel flickering · Lobby', priority: 'High', status: 'In Progress', date: '2026-08-05' },
  { id: 'as-003', client: 'UN', project: 'UN Office Bamako', issue: 'Desk height mechanism jammed', priority: 'Low', status: 'Resolved', date: '2026-08-01' },
  { id: 'as-004', client: 'BNP', project: 'Banque Nationale', issue: 'Glass wall seal broken · Conference room', priority: 'High', status: 'Open', date: '2026-08-07' },
  { id: 'as-005', client: 'BCG', project: 'BCG Tower', issue: 'Power outlet not working · Meeting table', priority: 'Medium', status: 'Pending Parts', date: '2026-08-04' },
];

// ── BUDGET DATA ───────────────────────────────────────────────
export const BUDGET_DATA: Record<string, BudgetItem> = {
  'Furniture & Equipment': { budget: 25000000, actual: 21500000 },
  'Logistics & Shipping':   { budget: 8000000,  actual: 9200000 },
  'Installation Labor':    { budget: 6000000,  actual: 4800000 },
  'Site Preparation':       { budget: 4000000,  actual: 3800000 },
  'Project Management':     { budget: 3000000,  actual: 2700000 },
  'Contingency':            { budget: 2000000,  actual: 500000 },
};
