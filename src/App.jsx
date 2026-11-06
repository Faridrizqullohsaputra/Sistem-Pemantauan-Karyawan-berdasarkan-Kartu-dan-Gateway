import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import NotificationToast from './components/NotificationToast';
import CardIdentity from './components/CardIdentity';
import GatewayRangeMap from './components/GatewayRangeMap';
import DetectionHistory from './components/DetectionHistory';
import GatewayConfiguration from './components/GatewayConfiguration';
import CardManagement from './components/CardManagement';
import DashboardPage from './pages/DashboardPage';
import HardwareCardModal from './components/HardwareCardModal';
import { useSimulation } from './hooks/useSimulation';

function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isHardwareModalOpen, setIsHardwareModalOpen] = useState(false);
  const [selectedModalCardId, setSelectedModalCardId] = useState(null);
  const [selectedGwForConfig, setSelectedGwForConfig] = useState(null);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('company_gateway_theme') || 'light';
  });

  const {
    gateways,
    updateGatewayPosition,
    updateGatewayDevice,
    resetGatewayPositions,
    addGateway,
    deleteGateway,
    activeDetections,
    historyRecords,
    registeredCards,
    registerCard,
    updateCard,
    deleteCard,
    toggleCardStatus,
    detectCardById,
    detectAllActiveCards,
    clearAllDummyCards,
    scanBluetoothDevice,
    isScanningBLE,
    isSimRunning,
    setIsSimRunning,
    notifications,
    removeNotification,
    totalDetectionsToday,
    totalRegistered,
    addNotification,
    isSyncing,
    syncNetworkData,
    unknownCardSignals,
    registerUnknownCard,
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
            onConfigureGateway={(gwId) => {
              setSelectedGwForConfig(gwId);
              setActivePage('config');
            }}
            historyRecords={historyRecords}
            theme={theme}
            onAddNotification={addNotification}
            onUpdateGateway={updateGatewayDevice}
            onDetectCard={detectCardById}
            syncNetworkData={syncNetworkData}
            isSyncing={isSyncing}
          />
        );
      case 'cards':
        return (
          <CardIdentity
            activeDetections={activeDetections}
            gateways={gateways}
            onDetectCard={detectCardById}
            onNavigate={setActivePage}
            theme={theme}
          />
        );
      case 'registered-cards':
        return (
          <CardManagement
            registeredCards={registeredCards}
            activeDetections={activeDetections}
            onRegisterCard={registerCard}
            onUpdateCard={updateCard}
            onToggleStatus={toggleCardStatus}
            onDeleteCard={deleteCard}
            onDetectCard={detectCardById}
            onOpenHardwareModal={(cardId) => {
              setSelectedModalCardId(cardId || null);
              setIsHardwareModalOpen(true);
            }}
            onAddNotification={addNotification}
            unknownCardSignals={unknownCardSignals}
            onRegisterUnknownCard={registerUnknownCard}
            theme={theme}
          />
        );
      case 'map':
        return (
          <GatewayRangeMap
            activeDetections={activeDetections}
            gateways={gateways}
            theme={theme}
            onUpdateGatewayPosition={updateGatewayPosition}
            onResetGatewayPositions={resetGatewayPositions}
            onAddNotification={addNotification}
          />
        );
      case 'history':
        return (
          <DetectionHistory
            historyRecords={historyRecords}
            theme={theme}
            onAddNotification={addNotification}
          />
        );
      case 'config':
        return (
          <GatewayConfiguration
            gateways={gateways}
            onUpdateGateway={updateGatewayDevice}
            onAddGateway={addGateway}
            onDeleteGateway={deleteGateway}
            onAddNotification={addNotification}
            initialSelectedGwId={selectedGwForConfig}
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
        registeredCards={registeredCards}
        isCollapsed={sidebarCollapsed}
        theme={theme}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          activePage={activePage}
          notifications={notifications}
          onToggleSidebar={() => setSidebarCollapsed(v => !v)}
          activeDetections={activeDetections}
          theme={theme}
          onToggleTheme={toggleTheme}
          onSync={syncNetworkData}
          isSyncing={isSyncing}
          onOpenHardwareModal={(cardId) => {
            setSelectedModalCardId(cardId || null);
            setIsHardwareModalOpen(true);
          }}
        />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-5 lg:p-6">
          {renderPage()}
        </main>

        {/* Footer */}
        <footer className="px-6 py-3 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] dark:bg-[#0F172A] flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
          <span className="font-medium text-[var(--text-secondary)]">Company Gateway Monitoring Dashboard</span>
          <span className="font-mono text-[11px] text-[var(--text-muted)]">Enterprise IoT Gateway System</span>
          <span className="font-mono text-[11px] text-[var(--text-muted)]">v1.2.0 • Industrial SaaS</span>
        </footer>
      </div>

      {/* Modal: Capture Signal from Gateway for any or all active cards */}
      <HardwareCardModal
        isOpen={isHardwareModalOpen}
        onClose={() => {
          setIsHardwareModalOpen(false);
          setSelectedModalCardId(null);
        }}
        gateways={gateways}
        registeredCards={registeredCards}
        initialCardId={selectedModalCardId}
        onDetectCard={detectCardById}
        onDetectAllCards={detectAllActiveCards}
        onScanBluetooth={scanBluetoothDevice}
        isScanningBLE={isScanningBLE}
        isSimRunning={isSimRunning}
        onToggleSim={() => setIsSimRunning(v => !v)}
      />

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
