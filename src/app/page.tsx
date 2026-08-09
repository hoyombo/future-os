'use client';

import { useEffect, useRef } from 'react';
import { useAppStore, generateId, getTimestamp } from '@/lib/store';
import { createAppService } from '@/lib/services';

import { AppSidebar } from '@/components/layout/app-sidebar';
import { AppTopbar } from '@/components/layout/app-topbar';
import { AppFooter } from '@/components/layout/app-footer';
import { ToastContainer } from '@/components/shared/toast-container';
import { DetailModal } from '@/components/shared/detail-modal';

import { DashboardView } from '@/components/views/dashboard-view';
import { ProposalsView } from '@/components/views/proposals-view';
import { CatalogView } from '@/components/views/catalog-view';
import { ProjectsView } from '@/components/views/projects-view';
import { InventoryView } from '@/components/views/inventory-view';
import { ProcurementView } from '@/components/views/procurement-view';
import { AftersalesView } from '@/components/views/aftersales-view';
import { FinanceView } from '@/components/views/finance-view';
import { TeamView } from '@/components/views/team-view';
import { ReportsView } from '@/components/views/reports-view';

export default function Home() {
  const currentView = useAppStore((s) => s.currentView);
  const setProducts = useAppStore((s) => s.setProducts);
  const setProjects = useAppStore((s) => s.setProjects);
  const setLogisticsEvents = useAppStore((s) => s.setLogisticsEvents);
  const setProposals = useAppStore((s) => s.setProposals);
  const setExpenses = useAppStore((s) => s.setExpenses);
  const setInvoices = useAppStore((s) => s.setInvoices);
  const setBills = useAppStore((s) => s.setBills);
  const setRecurringExpenses = useAppStore((s) => s.setRecurringExpenses);
  const setTeamMembers = useAppStore((s) => s.setTeamMembers);
  const setPurchaseOrders = useAppStore((s) => s.setPurchaseOrders);
  const setAfterSalesTickets = useAppStore((s) => s.setAfterSalesTickets);
  const setActivityLog = useAppStore((s) => s.setActivityLog);
  const setBudgetData = useAppStore((s) => s.setBudgetData);
  const setService = useAppStore((s) => s.setService);
  const addActivity = useAppStore((s) => s.addActivity);
  const addToast = useAppStore((s) => s.addToast);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Restore dark mode from localStorage
    try {
      const savedDark = localStorage.getItem('future_os_darkmode');
      if (savedDark === 'true') {
        document.documentElement.classList.add('dark');
        useAppStore.setState({ isDarkMode: true });
      }
    } catch {
      // localStorage unavailable — continue with default theme
    }

    // Create service and hydrate store
    try {
      const svc = createAppService();
      setService(svc);

      setProducts(svc.getProducts());
      setProjects(svc.getProjects());
      setLogisticsEvents(svc.getLogisticsEvents());
      setProposals(svc.getProposals());
      setExpenses(svc.getExpenses());
      setInvoices(svc.getInvoices());
      setBills(svc.getBills());
      setRecurringExpenses(svc.getRecurringExpenses());
      setTeamMembers(svc.getTeamMembers());
      setPurchaseOrders(svc.getPurchaseOrders());
      setAfterSalesTickets(svc.getAfterSalesTickets());
      setActivityLog(svc.getActivityLog());
      setBudgetData(svc.getBudgetData());
    } catch (err) {
      addToast('error', '❌', 'Failed to initialize data service. Check console for details.');
      console.error('[Future OS] Service initialization failed:', err);
    }

    // Seed initial activity if empty
    const currentActivity = useAppStore.getState().activityLog;
    if (currentActivity.length === 0) {
      const seed = [
        { text: 'System initialized', detail: 'Future OS is ready', icon: '🚀', delay: 0 },
        { text: 'Inventory synced', detail: '10 products loaded', icon: '📦', delay: 100 },
        { text: 'Projects loaded', detail: '5 active projects', icon: '📁', delay: 200 },
        { text: 'Budget data updated', detail: '6 categories synced', icon: '📊', delay: 300 },
      ];
      seed.forEach((s) => {
        setTimeout(() => {
          addActivity({
            id: generateId(),
            text: s.text,
            detail: s.detail,
            icon: s.icon,
            timestamp: getTimestamp(),
          });
        }, s.delay);
      });
    }

    // Listen for localStorage quota exceeded events from mock service
    const handleQuotaExceeded = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      addToast('error', '💾', detail?.message || 'Storage is full. Data may not be saved.');
    };
    window.addEventListener('future-os:storage-quota', handleQuotaExceeded);

    return () => {
      window.removeEventListener('future-os:storage-quota', handleQuotaExceeded);
    };
  }, []);

  function renderView() {
    switch (currentView) {
      case 'dashboard': return <DashboardView />;
      case 'proposals': return <ProposalsView />;
      case 'catalog': return <CatalogView />;
      case 'projects': return <ProjectsView />;
      case 'inventory': return <InventoryView />;
      case 'procurement': return <ProcurementView />;
      case 'aftersales': return <AftersalesView />;
      case 'finance': return <FinanceView />;
      case 'team': return <TeamView />;
      case 'reports': return <ReportsView />;
      default: return <DashboardView />;
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <AppSidebar />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <AppTopbar />

        {/* Scrollable view container */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {renderView()}
        </main>

        {/* Footer */}
        <AppFooter />
      </div>

      {/* Global overlays */}
      <ToastContainer />
      <DetailModal />
    </div>
  );
}
