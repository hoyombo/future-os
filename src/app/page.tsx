'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAppStore } from '@/lib/store';
import {
  apiService,
  fetchProducts, fetchProjects, fetchProposals, fetchExpenses,
  fetchInvoices, fetchBills, fetchRecurringExpenses, fetchTeamMembers,
  fetchPurchaseOrders, fetchAfterSalesTickets, fetchLogisticsEvents,
  fetchActivityLog, fetchBudgetData,
} from '@/lib/api-service';

import { AppSidebar } from '@/components/layout/app-sidebar';
import { AppTopbar } from '@/components/layout/app-topbar';
import { AppFooter } from '@/components/layout/app-footer';
import { ToastContainer } from '@/components/shared/toast-container';
import { DetailModal } from '@/components/shared/detail-modal';

const DashboardView = dynamic(() => import('@/components/views/dashboard-view').then(m => ({ default: m.DashboardView })), { loading: () => <ViewSkeleton /> });
const ProposalsView = dynamic(() => import('@/components/views/proposals-view').then(m => ({ default: m.ProposalsView })), { loading: () => <ViewSkeleton /> });
const CatalogView = dynamic(() => import('@/components/views/catalog-view').then(m => ({ default: m.CatalogView })), { loading: () => <ViewSkeleton /> });
const ProjectsView = dynamic(() => import('@/components/views/projects-view').then(m => ({ default: m.ProjectsView })), { loading: () => <ViewSkeleton /> });
const InventoryView = dynamic(() => import('@/components/views/inventory-view').then(m => ({ default: m.InventoryView })), { loading: () => <ViewSkeleton /> });
const ProcurementView = dynamic(() => import('@/components/views/procurement-view').then(m => ({ default: m.ProcurementView })), { loading: () => <ViewSkeleton /> });
const AftersalesView = dynamic(() => import('@/components/views/aftersales-view').then(m => ({ default: m.AftersalesView })), { loading: () => <ViewSkeleton /> });
const FinanceView = dynamic(() => import('@/components/views/finance-view').then(m => ({ default: m.FinanceView })), { loading: () => <ViewSkeleton /> });
const TeamView = dynamic(() => import('@/components/views/team-view').then(m => ({ default: m.TeamView })), { loading: () => <ViewSkeleton /> });
const ReportsView = dynamic(() => import('@/components/views/reports-view').then(m => ({ default: m.ReportsView })), { loading: () => <ViewSkeleton /> });

function ViewSkeleton() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gold border-t-transparent" />
    </div>
  );
}

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
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
  const addToast = useAppStore((s) => s.addToast);
  const initialized = useRef(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      // Debounce: transient session-fetch failures (flaky mobile networks,
      // service worker races) must not eject users to /login. If the session
      // recovers, the status change re-runs this effect and cancels the timer.
      const t = setTimeout(() => router.push('/login'), 1200);
      return () => clearTimeout(t);
    }
  }, [status, router]);

  useEffect(() => {
    if (initialized.current || status !== 'authenticated') return;
    initialized.current = true;

    try {
      const savedDark = localStorage.getItem('future_os_darkmode');
      if (savedDark === 'true') {
        document.documentElement.classList.add('dark');
        useAppStore.setState({ isDarkMode: true });
      }
    } catch { /* noop */ }

    const svc = apiService();
    setService(svc);

    Promise.all([
      fetchProducts(),
      fetchProjects(),
      fetchProposals(),
      fetchExpenses(),
      fetchInvoices(),
      fetchBills(),
      fetchRecurringExpenses(),
      fetchTeamMembers(),
      fetchPurchaseOrders(),
      fetchAfterSalesTickets(),
      fetchLogisticsEvents(),
      fetchActivityLog(),
      fetchBudgetData(),
    ]).then(([
      products, projects, proposals, expenses, invoices, bills,
      recurring, team, pos, tickets, logistics, activity, budget,
    ]) => {
      setProducts(products);
      setProjects(projects);
      setProposals(proposals);
      setExpenses(expenses);
      setInvoices(invoices);
      setBills(bills);
      setRecurringExpenses(recurring);
      setTeamMembers(team);
      setPurchaseOrders(pos);
      setAfterSalesTickets(tickets);
      setLogisticsEvents(logistics);
      setActivityLog(activity);
      setBudgetData(budget);
      setLoading(false);
    }).catch((err) => {
      console.error('[Future OS] API hydration failed:', err);
      addToast('error', '❌', 'Failed to load data from server. Using offline cache.');
      setLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

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

  if (status === 'loading' || loading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gold border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading Future OS...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') return null;

  return (
    <div className="flex h-dvh overflow-hidden">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AppTopbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {renderView()}
        </main>
        <AppFooter />
      </div>
      <ToastContainer />
      <DetailModal />
    </div>
  );
}
