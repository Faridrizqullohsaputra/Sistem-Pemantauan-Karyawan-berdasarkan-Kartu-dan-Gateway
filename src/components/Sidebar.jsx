import React from 'react';
import {
  LayoutDashboard,
  CreditCard,
  Radio,
  History,
  Settings,
  ChevronRight,
  RadioTower,
  Server,
  ShieldCheck,
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'cards', label: 'Kartu Terdeteksi', icon: CreditCard },
  { id: 'map', label: 'Peta Jangkauan', icon: Radio },
  { id: 'history', label: 'Riwayat Deteksi', icon: History },
  { id: 'config', label: 'Konfigurasi Gateway', icon: Settings },
];

const Sidebar = ({ activePage, onNavigate, gateways, activeDetections, isCollapsed }) => {
  const connectedCount = gateways.filter(g => g.status === 'connected').length;
  const errorCount = gateways.filter(g => g.status === 'error' || g.status === 'disconnected').length;

  return (
    <aside
      className={`flex flex-col bg-[var(--bg-surface)] dark:bg-[#0F172A] border-r border-[var(--border-subtle)] transition-all duration-200 ${
        isCollapsed ? 'w-16' : 'w-64'
      } min-h-screen select-none z-30`}
    >
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--border-subtle)]">
        <div className="w-9 h-9 rounded-xl bg-[var(--brand)] flex items-center justify-center flex-shrink-0 text-white shadow-xs">
          <RadioTower size={19} />
        </div>
        {!isCollapsed && (
          <div className="min-w-0">
            <div className="text-sm font-bold text-[var(--text-primary)] leading-tight truncate">
              Gateway Monitor
            </div>
            <div className="text-xs text-[var(--text-muted)] font-medium truncate">
              Sistem Deteksi Kantor
            </div>
          </div>
        )}
      </div>

      {/* Gateway Health Widget - Always Light Surface in Light Mode */}
      {!isCollapsed && (
        <div className="mx-3 mt-3.5 p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
              <Server size={12} className="text-[var(--brand)]" />
              Status Perangkat
            </span>
            <span className="text-xs font-bold text-[var(--success)] bg-[var(--success-bg)] px-2 py-0.5 rounded-full border border-[var(--success-border)]">
              {connectedCount}/7 Online
            </span>
          </div>

          {/* Mini Status Visualizer */}
          <div className="flex gap-1 mb-2">
            {gateways.map(gw => (
              <div
                key={gw.id}
                className={`flex-1 h-1.5 rounded-full transition-colors ${
                  gw.status === 'connected' ? 'bg-[var(--success)]' :
                  gw.status === 'connecting' ? 'bg-[var(--warning)]' :
                  gw.status === 'error' ? 'bg-[var(--danger)]' : 'bg-[var(--border-strong)]'
                }`}
                title={`${gw.name} (${gw.ip}): ${gw.status}`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span>7 Titik Gateway</span>
            {errorCount > 0 ? (
              <span className="text-[var(--danger)] font-semibold">{errorCount} Perlu Dicek</span>
            ) : (
              <span className="text-[var(--success)] font-semibold">Semua Normal</span>
            )}
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 px-3 mt-4 space-y-1">
        {!isCollapsed && (
          <div className="px-2 mb-1.5 text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider">
            Menu Utama
          </div>
        )}
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          const badge = item.id === 'cards' ? activeDetections.length : null;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`nav-link w-full text-left ${isActive ? 'active' : ''} ${isCollapsed ? 'justify-center px-0' : ''}`}
              title={isCollapsed ? item.label : ''}
            >
              <Icon size={17} className={`flex-shrink-0 ${isActive ? 'text-[var(--brand)]' : 'text-[var(--text-muted)]'}`} />
              {!isCollapsed && (
                <>
                  <span className="flex-1 truncate">{item.label}</span>
                  {badge !== null && badge > 0 && (
                    <span className="ml-auto px-2 py-0.5 text-xs font-bold rounded-full bg-[var(--brand-bg)] text-[var(--brand)] border border-[var(--brand-border)]">
                      {badge}
                    </span>
                  )}
                  {isActive && <ChevronRight size={14} className="ml-1 text-[var(--brand)]" />}
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info Box */}
      {!isCollapsed && (
        <div className="px-3 pb-3 mt-auto">
          <div className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)] mb-1">
              <ShieldCheck size={14} className="text-[var(--brand)]" />
              <span>Sistem Monitoring</span>
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Memantau kartu identitas melalui IP 10.1.5.x
            </p>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
