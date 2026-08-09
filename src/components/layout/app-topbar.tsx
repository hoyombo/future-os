'use client';

import { Bell, Search, ChevronDown, User } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import type { ViewName } from '@/lib/types';

const VIEW_LABELS: Record<ViewName, string> = {
  dashboard: 'Dashboard',
  proposals: 'Proposals',
  catalog: 'Product Catalog',
  projects: 'Projects',
  inventory: 'Inventory',
  procurement: 'Procurement',
  aftersales: 'After-Sales',
  finance: 'Finance',
  team: 'Team',
  reports: 'Reports & Analytics',
};

export function AppTopbar() {
  const currentView = useAppStore((s) => s.currentView);
  const proposals = useAppStore((s) => s.proposals);
  const afterSalesTickets = useAppStore((s) => s.afterSalesTickets);
  const openModal = useAppStore((s) => s.openModal);

  const openTickets = afterSalesTickets.filter((t) => t.status === 'Open' || t.status === 'In Progress').length;
  const alertCount = openTickets;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-card/80 backdrop-blur-sm px-4 md:px-6 py-3">
      <div>
        <h1 className="text-lg md:text-xl font-bold text-foreground">
          {greeting}, <span className="text-gold">Moussa</span>
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">{VIEW_LABELS[currentView]}</p>
      </div>
      <div className="os-topbar-actions flex items-center gap-2 md:gap-3">
        <button
          onClick={() => openModal('Notifications', (
            <div className="space-y-3">
              <p className="text-muted-foreground text-xs">No new notifications</p>
            </div>
          ))}
          className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {alertCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-pulse-red">
              {alertCount}
            </span>
          )}
        </button>
        <button
          onClick={() => openModal('Profile', (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold text-lg">M</div>
                <div>
                  <p className="font-semibold">Moussa Diallo</p>
                  <p className="text-sm text-muted-foreground">Managing Director</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Future Concept · Bamako, Mali</p>
            </div>
          ))}
          className="flex items-center gap-2 rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="User profile"
        >
          <div className="h-8 w-8 rounded-full bg-gold/20 flex items-center justify-center">
            <User className="h-4 w-4 text-gold" />
          </div>
          <span className="hidden md:block text-sm font-medium">Moussa</span>
          <ChevronDown className="hidden md:block h-3 w-3" />
        </button>
      </div>
    </header>
  );
}
