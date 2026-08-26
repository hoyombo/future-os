import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Default admin user ──────────────────────────────────────
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'moussa@future-concept.net' },
    update: { password: hashedPassword },
    create: {
      id: 'user-1',
      email: 'moussa@future-concept.net',
      name: 'Moussa Diallo',
      password: hashedPassword,
      role: 'admin',
    },
  });
  console.log('  ✓ Admin user:', admin.email);

  // ── PRODUCTS ────────────────────────────────────────────────
  const products = [
    { id: 'p1', name: 'Steelcase Gesture', supplier: 'Steelcase EU', category: 'seating', emoji: '🪑', cost: 850000, price: 1150000, stock: 22, inStock: 14, specs: 'Ergonomic, 12-yr warranty, 3D LiveBack', description: 'Premium task chair with 3D LiveBack technology. Ideal for executive offices.', origin: 'Italy', leadTime: 14, imageUrl: '/products/p1.jpg' },
    { id: 'p5', name: 'Steelcase Please', supplier: 'Steelcase EU', category: 'seating', emoji: '🪑', cost: 780000, price: 1050000, stock: 10, inStock: 5, specs: 'Executive chair, leather, lumbar support', description: 'Premium executive seating with polished aluminum base.', origin: 'Italy', leadTime: 14, imageUrl: '/products/p5.jpg' },
    { id: 'p11', name: 'Herman Miller Aeron', supplier: 'Herman Miller US', category: 'seating', emoji: '🪑', cost: 920000, price: 1250000, stock: 18, inStock: 12, specs: 'Mesh, PostureFit SL, fully adjustable', description: 'Iconic ergonomic mesh chair with PostureFit SL back support.', origin: 'United States', leadTime: 21, imageUrl: '/products/p1.jpg' },
    { id: 'p12', name: 'Vitra Soft Pad', supplier: 'Vitra DE', category: 'seating', emoji: '🪑', cost: 1100000, price: 1480000, stock: 8, inStock: 4, specs: 'Leather, chrome base, swivel', description: 'Luxurious lounge chair with soft pad upholstery.', origin: 'Germany', leadTime: 18, imageUrl: '/products/p5.jpg' },
    { id: 'p13', name: 'Kinnarps 6000', supplier: 'Kinnarps SE', category: 'seating', emoji: '🪑', cost: 680000, price: 920000, stock: 25, inStock: 18, specs: 'Ergonomic, mesh back, adjustable arms', description: 'Versatile task chair for modern workspaces.', origin: 'Sweden', leadTime: 12, imageUrl: '/products/p1.jpg' },
    { id: 'p2', name: 'Frezza F1 Desk', supplier: 'Frezza IT', category: 'desks', emoji: '🪵', cost: 1200000, price: 1650000, stock: 12, inStock: 8, specs: '120×75cm, adjustable height, cable mgmt', description: 'Modern sit-stand desk with integrated cable management.', origin: 'Italy', leadTime: 10, imageUrl: '/products/p2.jpg' },
    { id: 'p6', name: 'Frezza Meeting Table', supplier: 'Frezza IT', category: 'desks', emoji: '🪵', cost: 2400000, price: 3200000, stock: 6, inStock: 4, specs: '300×120cm, oval, power outlets', description: 'Large conference table with integrated power and data ports.', origin: 'Italy', leadTime: 12, imageUrl: '/products/p6.jpg' },
    { id: 'p14', name: 'Herman Miller OE1', supplier: 'Herman Miller US', category: 'desks', emoji: '🪵', cost: 980000, price: 1350000, stock: 10, inStock: 6, specs: '140×70cm, writing desk, storage option', description: 'Minimalist writing desk with optional mobile storage.', origin: 'United States', leadTime: 16, imageUrl: '/products/p2.jpg' },
    { id: 'p15', name: 'Vitra Slow Desk', supplier: 'Vitra DE', category: 'desks', emoji: '🪵', cost: 1850000, price: 2500000, stock: 4, inStock: 2, specs: '180×80cm, solid wood, executive', description: 'Executive desk with solid wood top and refined details.', origin: 'Germany', leadTime: 20, imageUrl: '/products/p6.jpg' },
    { id: 'p16', name: 'Kinnarps Corner Desk', supplier: 'Kinnarps SE', category: 'desks', emoji: '🪵', cost: 1050000, price: 1420000, stock: 8, inStock: 5, specs: '160×160cm L-shape, cable tray', description: 'L-shaped corner desk maximizing workspace.', origin: 'Sweden', leadTime: 14, imageUrl: '/products/p2.jpg' },
    { id: 'p3', name: 'Dieffebi Wall System', supplier: 'Dieffebi FR', category: 'walls', emoji: '🧱', cost: 320000, price: 430000, stock: 50, inStock: 45, specs: 'Modular, 3m height, acoustic panels', description: 'Flexible partition wall system for open offices.', origin: 'France', leadTime: 7, imageUrl: '/products/p3.jpg' },
    { id: 'p7', name: 'Dieffebi Glass Wall', supplier: 'Dieffebi FR', category: 'walls', emoji: '🪟', cost: 450000, price: 590000, stock: 20, inStock: 12, specs: 'Full glass, 2.5m, soundproof, sliding', description: 'Elegant glass partition with sliding doors.', origin: 'France', leadTime: 10, imageUrl: '/products/p7.jpg' },
    { id: 'p17', name: 'Dieffebi Acoustic Wall', supplier: 'Dieffebi FR', category: 'walls', emoji: '🧱', cost: 380000, price: 520000, stock: 30, inStock: 22, specs: 'Sound-absorbing, NRC 0.85, modular', description: 'High-performance acoustic wall panel.', origin: 'France', leadTime: 8, imageUrl: '/products/p3.jpg' },
    { id: 'p18', name: 'Abstracta Mobile', supplier: 'Abstracta DK', category: 'walls', emoji: '🧱', cost: 280000, price: 390000, stock: 15, inStock: 10, specs: 'Mobile, 1.8m, whiteboard surface', description: 'Mobile partition with whiteboard surface.', origin: 'Denmark', leadTime: 9, imageUrl: '/products/p7.jpg' },
    { id: 'p19', name: 'Hush Phone Booth', supplier: 'Hush Office PL', category: 'walls', emoji: '🪟', cost: 2200000, price: 2950000, stock: 3, inStock: 2, specs: '1-person, acoustic, ventilated, LED', description: 'Private phone booth for confidential calls.', origin: 'Poland', leadTime: 25, imageUrl: '/products/p3.jpg' },
    { id: 'p4', name: 'Luxury LED Panel', supplier: 'Mali Lumière', category: 'lighting', emoji: '💡', cost: 150000, price: 210000, stock: 30, inStock: 30, specs: '600×600mm, 4000K, dimmable, 50W', description: 'High-end LED ceiling panel with daylight simulation.', origin: 'Mali (assembled)', leadTime: 3, imageUrl: '/products/p4.jpg' },
    { id: 'p8', name: 'SmartTrack Lighting', supplier: 'Mali Lumière', category: 'lighting', emoji: '💡', cost: 98000, price: 135000, stock: 60, inStock: 48, specs: 'Track system, 24V, dimmable LEDs', description: 'Versatile track lighting for galleries and offices.', origin: 'Mali (assembled)', leadTime: 2, imageUrl: '/products/p8.jpg' },
    { id: 'p20', name: 'Flos Parentesi', supplier: 'Flos IT', category: 'lighting', emoji: '💡', cost: 320000, price: 440000, stock: 12, inStock: 8, specs: 'Pendant, height-adjustable, LED', description: 'Iconic suspension lamp with infinite height adjustment.', origin: 'Italy', leadTime: 14, imageUrl: '/products/p4.jpg' },
    { id: 'p21', name: 'Artemide Tolomeo', supplier: 'Artemide IT', category: 'lighting', emoji: '💡', cost: 280000, price: 385000, stock: 20, inStock: 15, specs: 'Desk lamp, adjustable, aluminum', description: 'Award-winning adjustable desk lamp.', origin: 'Italy', leadTime: 10, imageUrl: '/products/p8.jpg' },
    { id: 'p22', name: 'Vibia Horizon', supplier: 'Vibia ES', category: 'lighting', emoji: '💡', cost: 450000, price: 620000, stock: 6, inStock: 4, specs: 'Linear pendant, 1.2m, LED, dimmable', description: 'Sleek linear pendant light for conference tables.', origin: 'Spain', leadTime: 16, imageUrl: '/products/p4.jpg' },
    { id: 'p9', name: 'Steelcase Storage Cabinet', supplier: 'Steelcase EU', category: 'storage', emoji: '🗄️', cost: 550000, price: 750000, stock: 15, inStock: 9, specs: '120×45×180cm, lockable, 4 shelves', description: 'Secure storage cabinet for offices.', origin: 'Italy', leadTime: 14, imageUrl: '/products/p9.jpg' },
    { id: 'p10', name: 'Frezza Sideboard', supplier: 'Frezza IT', category: 'storage', emoji: '🗄️', cost: 380000, price: 510000, stock: 8, inStock: 6, specs: '150×50×75cm, wood veneer, 2 doors', description: 'Elegant sideboard for meeting rooms.', origin: 'Italy', leadTime: 10, imageUrl: '/products/p10.jpg' },
    { id: 'p23', name: 'Vitra Drawer Unit', supplier: 'Vitra DE', category: 'storage', emoji: '🗄️', cost: 320000, price: 435000, stock: 20, inStock: 14, specs: 'Mobile, 3 drawers, lockable', description: 'Under-desk mobile drawer unit with central lock.', origin: 'Germany', leadTime: 8, imageUrl: '/products/p9.jpg' },
    { id: 'p24', name: 'HAY Compose Shelf', supplier: 'HAY DK', category: 'storage', emoji: '🗄️', cost: 280000, price: 385000, stock: 12, inStock: 8, specs: 'Modular, steel frame, 5 levels', description: 'Open shelving system with clean Scandinavian design.', origin: 'Denmark', leadTime: 12, imageUrl: '/products/p10.jpg' },
    { id: 'p25', name: 'Kinnarps Plus Bookcase', supplier: 'Kinnarps SE', category: 'storage', emoji: '🗄️', cost: 480000, price: 650000, stock: 10, inStock: 6, specs: '200×80cm, 6 shelves, adjustable', description: 'Tall bookcase with adjustable shelves.', origin: 'Sweden', leadTime: 14, imageUrl: '/products/p9.jpg' },
  ];

  for (const p of products) {
    await prisma.product.upsert({ where: { id: p.id }, update: p, create: p });
  }
  console.log(`  ✓ ${products.length} products`);

  // ── PROJECTS ────────────────────────────────────────────────
  const projectsData = [
    { id: 'pr1', name: 'BCG Tower', client: 'BCG', budget: 48000000, spent: 31000000, status: 'active', phase: 'Installation', startDate: new Date('2026-06-01'), endDate: new Date('2026-10-15'), location: 'Bamako, Mali', items: ['p1', 'p2', 'p3', 'p4'] },
    { id: 'pr2', name: 'Banque Nationale', client: 'BNP', budget: 35000000, spent: 18000000, status: 'active', phase: 'Procurement', startDate: new Date('2026-07-15'), endDate: new Date('2026-11-30'), location: 'Bamako, Mali', items: ['p3', 'p4', 'p5', 'p9'] },
    { id: 'pr3', name: 'Radisson Blu', client: 'Radisson', budget: 62000000, spent: 55000000, status: 'active', phase: 'Final Installation', startDate: new Date('2026-03-01'), endDate: new Date('2026-09-30'), location: 'Bamako, Mali', items: ['p2', 'p6', 'p7', 'p8', 'p10'] },
    { id: 'pr4', name: 'UN Office Bamako', client: 'UN', budget: 28000000, spent: 27000000, status: 'completed', phase: 'Completed', startDate: new Date('2025-11-01'), endDate: new Date('2026-04-30'), location: 'Bamako, Mali', items: ['p1', 'p4', 'p8', 'p9'] },
    { id: 'pr5', name: 'Mali Digital Hub', client: 'Ministère', budget: 22000000, spent: 8200000, status: 'active', phase: 'Design', startDate: new Date('2026-08-01'), endDate: new Date('2026-12-20'), location: 'Bamako, Mali', items: ['p2', 'p3', 'p8', 'p10'] },
  ];

  for (const p of projectsData) {
    const { items, ...data } = p;
    await prisma.project.upsert({
      where: { id: p.id },
      update: data,
      create: {
        ...data,
        items: { create: items.map((productId) => ({ productId })) },
      },
    });
  }
  console.log(`  ✓ ${projectsData.length} projects`);

  // ── PROPOSALS ───────────────────────────────────────────────
  const proposalsData = [
    { id: 'prp-001', client: 'Boston Consulting Group', project: 'BCG Tower — Executive Floors', date: new Date('2026-07-02'), status: 'approved', createdAt: new Date('2026-07-02T09:00:00Z'), sentAt: new Date('2026-07-03T10:00:00Z'), subtotal: 56800000, markup: 8520000, total: 65320000, items: [{ productId: 'p1', qty: 24 }, { productId: 'p2', qty: 6 }, { productId: 'p3', qty: 30 }, { productId: 'p6', qty: 2 }] },
    { id: 'prp-002', client: 'Radisson Blu Hotel', project: 'Radisson Blu — Lobby & Conference', date: new Date('2026-07-18'), status: 'sent', createdAt: new Date('2026-07-18T14:30:00Z'), sentAt: new Date('2026-07-19T09:15:00Z'), subtotal: 18720000, markup: 2808000, total: 21528000, items: [{ productId: 'p7', qty: 12 }, { productId: 'p4', qty: 20 }, { productId: 'p8', qty: 40 }, { productId: 'p10', qty: 4 }] },
    { id: 'prp-003', client: 'United Nations', project: 'UN Office Bamako — Fit-Out', date: new Date('2026-06-10'), status: 'approved', createdAt: new Date('2026-06-10T08:20:00Z'), sentAt: new Date('2026-06-11T08:00:00Z'), subtotal: 23200000, markup: 3480000, total: 26680000, items: [{ productId: 'p1', qty: 10 }, { productId: 'p9', qty: 5 }, { productId: 'p4', qty: 25 }, { productId: 'p8', qty: 20 }] },
    { id: 'prp-004', client: 'Banque Nationale de Developpement', project: 'BNP — Banking Hall', date: new Date('2026-08-08'), status: 'draft', createdAt: new Date('2026-08-08T16:45:00Z'), sentAt: null, subtotal: 19310000, markup: 2896500, total: 22206500, items: [{ productId: 'p5', qty: 8 }, { productId: 'p3', qty: 20 }, { productId: 'p21', qty: 6 }] },
    { id: 'prp-005', client: 'Ministere de la Transformation Digitale', project: 'Mali Digital Hub — Campus', date: new Date('2026-08-14'), status: 'sent', createdAt: new Date('2026-08-14T11:00:00Z'), sentAt: new Date('2026-08-15T09:00:00Z'), subtotal: 44900000, markup: 6735000, total: 51635000, items: [{ productId: 'p2', qty: 12 }, { productId: 'p8', qty: 30 }, { productId: 'p3', qty: 40 }, { productId: 'p24', qty: 10 }] },
  ];

  for (const p of proposalsData) {
    const { items, ...data } = p;
    await prisma.proposal.upsert({
      where: { id: p.id },
      update: data,
      create: {
        ...data,
        items: { create: items },
      },
    });
  }
  console.log(`  ✓ ${proposalsData.length} proposals`);

  // ── EXPENSES ────────────────────────────────────────────────
  const expensesData = [
    { id: 'ex1', title: 'BCG Tower · Installation labor', amount: 4800000, category: 'Installation', date: new Date('2026-08-05'), status: 'Approved', approval: 'Approved', createdBy: 'Moussa' },
    { id: 'ex2', title: 'Radisson Blu · Freight Dakar-Bamako', amount: 2100000, category: 'Logistics', date: new Date('2026-08-03'), status: 'Approved', approval: 'Approved', createdBy: 'Ibrahim' },
    { id: 'ex3', title: 'Office rent · August', amount: 850000, category: 'Admin', date: new Date('2026-08-01'), status: 'Approved', approval: 'Approved', createdBy: 'Fatoumata' },
    { id: 'ex4', title: 'UN Office · Final inspection', amount: 350000, category: 'Operations', date: new Date('2026-07-28'), status: 'Pending', approval: 'Pending', createdBy: 'Aminata' },
    { id: 'ex5', title: 'Marketing materials · Brochures', amount: 180000, category: 'Marketing', date: new Date('2026-07-25'), status: 'Approved', approval: 'Approved', createdBy: 'Moussa' },
    { id: 'ex6', title: 'BCG Tower · Site preparation', amount: 1200000, category: 'Installation', date: new Date('2026-08-08'), status: 'Pending', approval: 'Pending', createdBy: 'Aminata' },
    { id: 'ex7', title: 'Fleet fuel · August week 1', amount: 420000, category: 'Operations', date: new Date('2026-08-06'), status: 'Approved', approval: 'Approved', createdBy: 'Ibrahim' },
    { id: 'ex8', title: 'Hotel & travel · Bamako-Dakar', amount: 250000, category: 'Travel', date: new Date('2026-08-04'), status: 'Pending', approval: 'Pending', createdBy: 'Moussa' },
  ];

  for (const e of expensesData) {
    await prisma.expense.upsert({ where: { id: e.id }, update: e, create: e });
  }
  console.log(`  ✓ ${expensesData.length} expenses`);

  // ── INVOICES ────────────────────────────────────────────────
  const invoicesData = [
    { id: 'inv1', client: 'BCG', amount: 15000000, date: new Date('2026-07-15'), status: 'Paid', dueDate: new Date('2026-08-15'), paidAmount: 15000000,
      items: [
        { description: 'Steelcase Gesture — executive chairs', qty: 20, unitPrice: 600000 },
        { description: 'Delivery & installation', qty: 1, unitPrice: 3000000 },
      ] },
    { id: 'inv2', client: 'Radisson', amount: 22000000, date: new Date('2026-07-01'), status: 'Paid', dueDate: new Date('2026-08-01'), paidAmount: 22000000,
      items: [
        { description: 'Dieffebi Glass Wall partitions', qty: 30, unitPrice: 500000 },
        { description: 'Installation & sealing', qty: 1, unitPrice: 7000000 },
      ] },
    { id: 'inv3', client: 'UN', amount: 28000000, date: new Date('2026-06-15'), status: 'Paid', dueDate: new Date('2026-07-15'), paidAmount: 28000000,
      items: [
        { description: 'Herman Miller OE1 workstations', qty: 40, unitPrice: 550000 },
        { description: 'Steelcase storage cabinets', qty: 24, unitPrice: 250000 },
      ] },
    { id: 'inv4', client: 'BNP', amount: 8500000, date: new Date('2026-08-01'), status: 'Pending', dueDate: new Date('2026-09-01'), paidAmount: 0,
      items: [
        { description: 'SmartTrack lighting system', qty: 50, unitPrice: 130000 },
        { description: 'Luxury LED panels 600×600', qty: 10, unitPrice: 200000 },
      ] },
    { id: 'inv5', client: 'Ministère', amount: 5200000, date: new Date('2026-08-05'), status: 'Pending', dueDate: new Date('2026-09-05'), paidAmount: 0,
      items: [
        { description: 'Kinnarps 6000 task chairs', qty: 4, unitPrice: 800000 },
        { description: 'Mobile drawer units', qty: 8, unitPrice: 250000 },
      ] },
    { id: 'inv6', client: 'BCG', amount: 18500000, date: new Date('2026-08-10'), status: 'Partial', dueDate: new Date('2026-09-10'), paidAmount: 9000000,
      items: [
        { description: 'Frezza meeting tables 300×120', qty: 5, unitPrice: 2500000 },
        { description: 'Frezza sideboards', qty: 10, unitPrice: 380000 },
        { description: 'Delivery & installation', qty: 1, unitPrice: 2200000 },
      ] },
    { id: 'inv7', client: 'Radisson', amount: 32000000, date: new Date('2026-08-12'), status: 'Pending', dueDate: new Date('2026-09-12'), paidAmount: 0,
      items: [
        { description: 'Hush phone booths', qty: 4, unitPrice: 2200000 },
        { description: 'Dieffebi acoustic wall panels', qty: 100, unitPrice: 120000 },
        { description: 'Frezza F1 desks', qty: 14, unitPrice: 800000 },
      ] },
  ];

  for (const i of invoicesData) {
    const { items, ...data } = i;
    await prisma.invoice.upsert({
      where: { id: i.id },
      update: data,
      create: { ...data, items: { create: items } },
    });
  }
  console.log(`  ✓ ${invoicesData.length} invoices`);

  // ── BILLS ───────────────────────────────────────────────────
  const billsData = [
    { id: 'bl1', supplier: 'Steelcase EU', amount: 12500000, date: new Date('2026-06-15'), status: 'Paid', dueDate: new Date('2026-07-15') },
    { id: 'bl2', supplier: 'Frezza IT', amount: 18200000, date: new Date('2026-07-01'), status: 'Pending', dueDate: new Date('2026-08-30') },
    { id: 'bl3', supplier: 'Mali Lumière', amount: 4500000, date: new Date('2026-07-10'), status: 'Paid', dueDate: new Date('2026-08-10') },
  ];

  for (const b of billsData) {
    await prisma.bill.upsert({ where: { id: b.id }, update: b, create: b });
  }
  console.log(`  ✓ ${billsData.length} bills`);

  // ── RECURRING EXPENSES ──────────────────────────────────────
  const recurringData = [
    { id: 're1', title: 'Office rent · ACI 2000', amount: 850000, frequency: 'Monthly', nextDate: new Date('2026-09-01') },
    { id: 're2', title: 'Vehicle fleet maintenance', amount: 250000, frequency: 'Quarterly', nextDate: new Date('2026-10-01') },
    { id: 're3', title: 'Software licenses (Adobe, Office)', amount: 120000, frequency: 'Yearly', nextDate: new Date('2027-01-15') },
    { id: 're4', title: 'Insurance · Liability', amount: 380000, frequency: 'Yearly', nextDate: new Date('2027-02-01') },
  ];

  for (const r of recurringData) {
    await prisma.recurringExpense.upsert({ where: { id: r.id }, update: r, create: r });
  }
  console.log(`  ✓ ${recurringData.length} recurring expenses`);

  // ── TEAM ────────────────────────────────────────────────────
  const teamData = [
    { id: 'tm1', name: 'Moussa Diallo', role: 'Managing Director', status: 'Active' },
    { id: 'tm2', name: 'Aminata Traoré', role: 'Project Manager', status: 'Active' },
    { id: 'tm3', name: 'Ibrahim Keita', role: 'Procurement Officer', status: 'Active' },
    { id: 'tm4', name: 'Fatoumata Coulibaly', role: 'Accountant', status: 'Active' },
    { id: 'tm5', name: 'Oumar Sidibé', role: 'Lead Installer', status: 'Active' },
    { id: 'tm6', name: 'Kadiatou Bah', role: 'Designer', status: 'On Leave' },
  ];

  for (const t of teamData) {
    await prisma.teamMember.upsert({ where: { id: t.id }, update: t, create: t });
  }
  console.log(`  ✓ ${teamData.length} team members`);

  // ── PURCHASE ORDERS ─────────────────────────────────────────
  const poData = [
    { id: 'po-001', supplier: 'Steelcase EU', totalAmount: 31250000, status: 'Delivered', date: new Date('2026-06-15'), expectedDelivery: new Date('2026-07-20'),
      items: [{ productId: 'p1', qty: 22 }, { productId: 'p5', qty: 10 }, { productId: 'p9', qty: 15 }] },
    { id: 'po-002', supplier: 'Frezza IT', totalAmount: 42600000, status: 'In Transit', date: new Date('2026-07-01'), expectedDelivery: new Date('2026-08-10'),
      items: [{ productId: 'p2', qty: 12 }, { productId: 'p6', qty: 6 }, { productId: 'p10', qty: 8 }] },
    { id: 'po-003', supplier: 'Dieffebi FR', totalAmount: 25900000, status: 'Processing', date: new Date('2026-07-20'), expectedDelivery: new Date('2026-08-25'),
      items: [{ productId: 'p3', qty: 50 }, { productId: 'p7', qty: 20 }] },
    { id: 'po-004', supplier: 'Mali Lumière', totalAmount: 10800000, status: 'Delivered', date: new Date('2026-06-10'), expectedDelivery: new Date('2026-06-20'),
      items: [{ productId: 'p4', qty: 30 }, { productId: 'p8', qty: 60 }] },
    { id: 'po-005', supplier: 'Herman Miller US', totalAmount: 52400000, status: 'Processing', date: new Date('2026-08-05'), expectedDelivery: new Date('2026-09-10'),
      items: [{ productId: 'p11', qty: 18 }, { productId: 'p14', qty: 10 }] },
    { id: 'po-006', supplier: 'Vitra DE', totalAmount: 45200000, status: 'Draft', date: new Date('2026-08-10'), expectedDelivery: new Date('2026-09-25'),
      items: [{ productId: 'p12', qty: 8 }, { productId: 'p15', qty: 4 }, { productId: 'p23', qty: 20 }] },
  ];

  for (const po of poData) {
    const { items, ...data } = po;
    await prisma.purchaseOrder.upsert({
      where: { id: po.id },
      update: data,
      create: { ...data, items: { create: items } },
    });
  }
  console.log(`  ✓ ${poData.length} purchase orders`);

  // ── AFTER-SALES TICKETS ─────────────────────────────────────
  const asData = [
    { id: 'as-001', client: 'BCG', project: 'BCG Tower', issue: 'Chair armrest loose · 3rd floor', priority: 'Medium', status: 'Open', date: new Date('2026-08-06') },
    { id: 'as-002', client: 'Radisson', project: 'Radisson Blu', issue: 'LED panel flickering · Lobby', priority: 'High', status: 'In Progress', date: new Date('2026-08-05') },
    { id: 'as-003', client: 'UN', project: 'UN Office Bamako', issue: 'Desk height mechanism jammed', priority: 'Low', status: 'Resolved', date: new Date('2026-08-01') },
    { id: 'as-004', client: 'BNP', project: 'Banque Nationale', issue: 'Glass wall seal broken · Conference room', priority: 'High', status: 'Open', date: new Date('2026-08-07') },
    { id: 'as-005', client: 'BCG', project: 'BCG Tower', issue: 'Power outlet not working · Meeting table', priority: 'Medium', status: 'Pending Parts', date: new Date('2026-08-04') },
    { id: 'as-006', client: 'Ministère', project: 'Mali Digital Hub', issue: 'Sideboard door hinge squeaks', priority: 'Low', status: 'In Progress', date: new Date('2026-08-08') },
    { id: 'as-007', client: 'Radisson', project: 'Radisson Blu', issue: 'SmartTrack rail misaligned · Lounge', priority: 'Medium', status: 'Open', date: new Date('2026-08-09') },
  ];

  for (const t of asData) {
    await prisma.afterSalesTicket.upsert({ where: { id: t.id }, update: t, create: t });
  }
  console.log(`  ✓ ${asData.length} after-sales tickets`);

  // ── LOGISTICS ───────────────────────────────────────────────
  const logisticsData = [
    { title: 'Shipped · Milan (Frezza)', desc: 'Container #FR-8821 · 42 units', eta: new Date('2026-08-07'), dot: 'green', timestamp: new Date('2026-08-07') },
    { title: 'In-Transit · Dakar Port', desc: 'Steelcase container · Customs clearance', eta: new Date('2026-08-08'), dot: 'gold', timestamp: new Date('2026-08-06') },
    { title: 'Overland · Kayes → Bamako', desc: 'Truck #ML-204 · 60% of route', eta: new Date('2026-08-09'), dot: '', timestamp: new Date('2026-08-05') },
    { title: 'Final Delivery · BCG Site', desc: 'Installation crew on standby', eta: new Date('2026-08-11'), dot: '', timestamp: new Date('2026-08-04') },
    { title: 'Customs · Bamako Airport', desc: 'LED Panel shipment · 18% VAT pending', eta: new Date('2026-08-08'), dot: 'gold', timestamp: new Date('2026-08-03') },
  ];

  for (const l of logisticsData) {
    await prisma.logisticsEvent.create({ data: l });
  }
  console.log(`  ✓ ${logisticsData.length} logistics events`);

  // ── BUDGET ──────────────────────────────────────────────────
  const budgetData = [
    { category: 'Furniture & Equipment', budget: 25000000, actual: 21500000 },
    { category: 'Logistics & Shipping', budget: 8000000, actual: 9200000 },
    { category: 'Installation Labor', budget: 6000000, actual: 4800000 },
    { category: 'Site Preparation', budget: 4000000, actual: 3800000 },
    { category: 'Project Management', budget: 3000000, actual: 2700000 },
    { category: 'Contingency', budget: 2000000, actual: 500000 },
  ];

  for (const b of budgetData) {
    await prisma.budgetItem.upsert({
      where: { category: b.category },
      update: b,
      create: b,
    });
  }
  console.log(`  ✓ ${budgetData.length} budget items`);

  // ── ACTIVITY LOG ────────────────────────────────────────────
  const activityData = [
    { id: 'ac1', text: 'Invoice paid', detail: 'UN Office · CFA 28,000,000', icon: '✅', timestamp: '2026-08-07T14:10:00Z' },
    { id: 'ac2', text: 'Purchase order received', detail: 'Frezza IT · Container FR-8821', icon: '📦', timestamp: '2026-08-07T10:45:00Z' },
    { id: 'ac3', text: 'Proposal sent', detail: 'Mali Digital Hub · CFA 51,635,000', icon: '📋', timestamp: '2026-08-15T09:00:00Z' },
    { id: 'ac4', text: 'After-sales ticket opened', detail: 'BNP · Glass wall seal · High', icon: '🎧', timestamp: '2026-08-07T09:30:00Z' },
    { id: 'ac5', text: 'Payment received', detail: 'BCG Tower · CFA 15,000,000', icon: '💰', timestamp: '2026-08-06T15:20:00Z' },
    { id: 'ac6', text: 'Stock updated', detail: 'SmartTrack Lighting · +48 units', icon: '📊', timestamp: '2026-08-06T11:00:00Z' },
    { id: 'ac7', text: 'Expense approved', detail: 'Radisson Blu freight · CFA 2,100,000', icon: '💸', timestamp: '2026-08-05T16:30:00Z' },
    { id: 'ac8', text: 'Project milestone reached', detail: 'Radisson Blu · Final Installation (90%)', icon: '🏗️', timestamp: '2026-08-04T13:00:00Z' },
  ];

  for (const a of activityData) {
    await prisma.activityEntry.upsert({ where: { id: a.id }, update: a, create: a });
  }
  console.log(`  ✓ ${activityData.length} activity entries`);

  console.log('\n✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
