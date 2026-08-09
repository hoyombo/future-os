'use client';

import { useState, useEffect } from 'react';
import {
  LayoutDashboard, FileText, Package, FolderKanban, Warehouse,
  ShoppingCart, HeadphonesIcon, DollarSign, Users, BarChart3,
  Moon, Sun, Clock, Wifi, ChevronDown, ChevronRight,
} from 'lucide-react';
import { useAppStore, formatPrice } from '@/lib/store';
import type { ViewName, Currency } from '@/lib/types';

interface NavItem {
  view: ViewName;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

export function AppSidebar() {
  const currentView = useAppStore((s) => s.currentView);
  const setCurrentView = useAppStore((s) => s.setCurrentView);
  const currency = useAppStore((s) => s.currency);
  const setCurrency = useAppStore((s) => s.setCurrency);
  const isDarkMode = useAppStore((s) => s.isDarkMode);
  const toggleDarkMode = useAppStore((s) => s.toggleDarkMode);
  const proposals = useAppStore((s) => s.proposals);
  const afterSalesTickets = useAppStore((s) => s.afterSalesTickets);
  const products = useAppStore((s) => s.products);
  const purchaseOrders = useAppStore((s) => s.purchaseOrders);

  const [time, setTime] = useState('');
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('en-US', {
          timeZone: 'Africa/Bamako',
          hour: '2-digit',
          minute: '2-digit',
        }) + ' BKO'
      );
    };
    tick();
    const id = setInterval(tick, 10000);
    return () => clearInterval(id);
  }, []);

  const openProposals = proposals.filter((p) => p.status === 'draft' || p.status === 'sent').length;
  const openTickets = afterSalesTickets.filter((t) => t.status === 'Open' || t.status === 'In Progress').length;
  const pendingPOs = purchaseOrders.filter((p) => p.status !== 'Delivered').length;

  const navItems: NavItem[] = [
    { view: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { view: 'proposals', label: 'Proposals', icon: <FileText className="h-4 w-4" />, badge: openProposals },
    { view: 'catalog', label: 'Catalog', icon: <Package className="h-4 w-4" /> },
    { view: 'projects', label: 'Projects', icon: <FolderKanban className="h-4 w-4" /> },
    { view: 'inventory', label: 'Inventory', icon: <Warehouse className="h-4 w-4" /> },
    { view: 'procurement', label: 'Procurement', icon: <ShoppingCart className="h-4 w-4" />, badge: pendingPOs },
    { view: 'aftersales', label: 'After-Sales', icon: <HeadphonesIcon className="h-4 w-4" />, badge: openTickets },
    { view: 'finance', label: 'Finance', icon: <DollarSign className="h-4 w-4" /> },
    { view: 'team', label: 'Team', icon: <Users className="h-4 w-4" /> },
    { view: 'reports', label: 'Reports', icon: <BarChart3 className="h-4 w-4" /> },
  ];

  const currencies: Currency[] = ['XOF', 'EUR', 'USD'];

  return (
    <aside className="os-sidebar flex flex-col w-60 shrink-0 bg-os-dark border-r border-sidebar-border text-sidebar-foreground h-screen sticky top-0 overflow-hidden">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-5">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center gap-0 text-xl font-bold tracking-tight"
        >
          <span className="text-white">future</span>
          <span className="text-gold">.OS</span>
        </button>
        <span className="lg:hidden text-xl font-bold tracking-tight">
          <span className="text-white">future</span>
          <span className="text-gold">.OS</span>
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
        {navItems.map((item) => (
          <button
            key={item.view}
            onClick={() => setCurrentView(item.view)}
            className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 group
              ${currentView === item.view
                ? 'bg-sidebar-accent text-gold border-l-2 border-gold'
                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-white'
              }`}
          >
            {item.icon}
            <span className="flex-1 text-left">{item.label}</span>
            {item.badge !== undefined && item.badge > 0 && (
              <span className="rounded-full bg-gold/20 text-gold text-[10px] font-bold px-1.5 py-0.5 min-w-[20px] text-center">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="px-3 pb-4 space-y-3 border-t border-sidebar-border pt-3">
        {/* Currency selector */}
        <div className="flex items-center gap-1">
          {currencies.map((c) => (
            <button
              key={c}
              onClick={() => setCurrency(c)}
              className={`flex-1 rounded-md py-1 text-[11px] font-semibold transition-all
                ${currency === c
                  ? 'bg-gold text-os-dark'
                  : 'bg-sidebar-accent text-sidebar-foreground hover:text-white'
                }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Dark mode toggle */}
        <button
          onClick={toggleDarkMode}
          className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-white transition-colors"
        >
          {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        {/* Time */}
        <div className="flex items-center gap-2 px-3 text-[11px] text-sidebar-foreground/60">
          <Clock className="h-3 w-3" />
          <span>{time}</span>
        </div>

        {/* Status indicators */}
        <div className="flex items-center justify-between px-3 text-[11px] text-sidebar-foreground/60">
          <div className="flex items-center gap-1.5">
            <Wifi className="h-3 w-3 text-emerald-500" />
            <span>4 online</span>
          </div>
          <span>{products.length} products</span>
        </div>
      </div>
    </aside>
  );
}
