import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import NotificationToast from './components/NotificationToast';
import CardIdentity from './components/CardIdentity';
import GatewayRangeMap from './components/GatewayRangeMap';
import DetectionHistory from './components/DetectionHistory';
import GatewayConfiguration from './components/GatewayConfiguration';
import DashboardPage from './pages/DashboardPage';
import { useSimulation } from './hooks/useSimulation';

function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('company_gateway_theme') || 'light';
  });

  const {
    gateways,
    activeDetections,
    historyRecords,
    notifications,
    removeNotification,
    isSimRunning,
    toggleSimulation,
    simulateNewDetection,
    simulateCardLeave,
    totalDetectionsToday,
    connectedGateways,
    totalRegistered,
    addNotification,
  } = useSimulation();

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('company_gateway_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Collapse sidebar on small screens by default
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarCollapsed(true);
      } else {
        setSidebarCollapsed(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return (
          <DashboardPage
            activeDetections={activeDetections}
            gateways={gateways}
            totalRegistered={totalRegistered}
            totalDetectionsToday={totalDetectionsToday}
            onNavigate={setActivePage}
            historyRecords={historyRecords}
            theme={theme}
          />
        );
      case 'cards':
        return <CardIdentity activeDetections={activeDetections} theme={theme} />;
      case 'map':
        return (
          <GatewayRangeMap
            activeDetections={activeDetections}
            gateways={gateways}
            theme={theme}
          />
        );
      case 'history':
        return <DetectionHistory historyRecords={historyRecords} theme={theme} />;
      case 'config':
        return (
          <GatewayConfiguration
            gateways={gateways}
            onAddNotification={addNotification}
            theme={theme}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] font-sans antialiased transition-colors duration-150">
      {/* Sidebar */}
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        gateways={gateways}
        activeDetections={activeDetections}
        isCollapsed={sidebarCollapsed}
        theme={theme}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          activePage={activePage}
          isSimRunning={isSimRunning}
          toggleSimulation={toggleSimulation}
          simulateNewDetection={simulateNewDetection}
          simulateCardLeave={simulateCardLeave}
          notifications={notifications}
          onToggleSidebar={() => setSidebarCollapsed(v => !v)}
          activeDetections={activeDetections}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-5 lg:p-6">
          {renderPage()}
        </main>

        {/* Footer */}
        <footer className="px-6 py-3 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
          <span className="font-medium text-[var(--text-secondary)]">Company Gateway Monitoring Dashboard</span>
          <span className="font-mono text-[11px] text-[var(--text-muted)]">Prototype — Data Simulasi</span>
          <span className="font-mono text-[11px] text-[var(--text-muted)]">v1.2.0 • Industrial SaaS</span>
        </footer>
      </div>

      {/* Toast Notifications */}
      <NotificationToast
        notifications={notifications}
        onRemove={removeNotification}
        theme={theme}
      />
    </div>
  );
}

export default App;
