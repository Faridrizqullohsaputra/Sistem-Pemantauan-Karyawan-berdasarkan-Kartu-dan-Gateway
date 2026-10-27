import React, { useState, useEffect } from 'react';
import {
  Bell,
  Menu,
  Sun,
  Moon,
  Radio,
  RefreshCw,
  LayoutDashboard,
  CreditCard,
  Map,
  History,
  Settings,
} from 'lucide-react';

/* Page meta data map */
const PAGE_META = {
  dashboard: {
    title: 'Dashboard Utama',
    desc: 'Monitoring kartu karyawan & pengunjung melalui jaringan 7 Gateway perusahaan',
    icon: LayoutDashboard,
    accentClass: 'text-indigo-600 dark:text-indigo-400',
    bgClass: 'bg-indigo-50 dark:bg-indigo-900/30',
    borderClass: 'border-indigo-200 dark:border-indigo-800/50',
  },
  cards: {
    title: 'Kartu Terdeteksi',
    desc: 'Daftar lengkap identitas kartu yang saat ini berada dalam radius sensor',
    icon: Radio,
    accentClass: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-50 dark:bg-emerald-900/30',
    borderClass: 'border-emerald-200 dark:border-emerald-800/50',
  },
  'registered-cards': {
    title: 'Registrasi & Data Kartu',
    desc: 'Basis data pendaftaran kartu RFID/BLE. Deteksi Gateway hanya memproses kartu yang terdaftar aktif',
    icon: CreditCard,
    accentClass: 'text-indigo-600 dark:text-indigo-400',
    bgClass: 'bg-indigo-50 dark:bg-indigo-900/30',
    borderClass: 'border-indigo-200 dark:border-indigo-800/50',
  },
  map: {
    title: 'Peta Jangkauan Gateway',
    desc: 'Visualisasi denah area perusahaan dan posisi kartu terdeteksi',
    icon: Map,
    accentClass: 'text-sky-600 dark:text-sky-400',
    bgClass: 'bg-sky-50 dark:bg-sky-900/30',
    borderClass: 'border-sky-200 dark:border-sky-800/50',
  },
  history: {
    title: 'Riwayat Deteksi',
    desc: 'Log lengkap seluruh aktivitas pembacaan kartu identitas',
    icon: History,
    accentClass: 'text-violet-600 dark:text-violet-400',
    bgClass: 'bg-violet-50 dark:bg-violet-900/30',
    borderClass: 'border-violet-200 dark:border-violet-800/50',
  },
  config: {
    title: 'Konfigurasi Gateway',
    desc: 'Pengaturan koneksi URL, autentikasi, dan status perangkat Gateway',
    icon: Settings,
    accentClass: 'text-slate-600 dark:text-slate-400',
    bgClass: 'bg-slate-100 dark:bg-slate-800/50',
    borderClass: 'border-slate-200 dark:border-slate-700/50',
  },
};

const Header = ({
  activePage,
  notifications,
  onToggleSidebar,
  activeDetections,
  theme,
  onToggleTheme,
  onSync,
  isSyncing = false,
  onOpenHardwareModal,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showNotifDot, setShowNotifDot] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (notifications.length > 0) setShowNotifDot(true);
  }, [notifications.length]);

  const meta = PAGE_META[activePage] || PAGE_META.dashboard;
  const PageIcon = meta.icon;

  const timeStr = currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = currentTime.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <header className="sticky top-0 z-40 bg-[var(--bg-surface)]/95 dark:bg-[#0F172A]/95 border-b border-[var(--border-subtle)] backdrop-blur-xl transition-colors duration-200">
      {/* ── Main header row ── */}
      <div className="flex items-center justify-between gap-4 px-5 md:px-6 py-3.5">
        {/* Left: Toggle + Page Title */}
        <div className="flex items-center gap-3.5 min-w-0">
          {/* Sidebar toggle */}
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] transition-all flex-shrink-0 active:scale-95"
            title="Toggle sidebar"
            id="btn-toggle-sidebar"
          >
            <Menu size={18} />
          </button>

          {/* Page Icon chip + Title block */}
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${meta.bgClass} ${meta.borderClass} ${meta.accentClass}`}>
              <PageIcon size={17} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-lg md:text-xl font-extrabold text-[var(--text-primary)] tracking-tight leading-tight">
                  {meta.title}
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                  </span>
                  Sistem Aktif
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] hidden sm:block truncate mt-0.5">
                {meta.desc}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Digital Clock */}
          <div className="hidden lg:flex flex-col items-end px-3 py-1.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
            <span className="text-sm font-mono font-bold text-[var(--text-primary)] tabular-nums leading-tight">
              {timeStr}
            </span>
            <span className="text-[10px] font-medium text-[var(--text-muted)] leading-tight">
              {dateStr}
            </span>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            id="btn-toggle-theme"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] text-xs font-semibold transition-all active:scale-95"
            title={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
          >
            {theme === 'dark' ? (
              <Sun size={15} className="text-amber-400" />
            ) : (
              <Moon size={15} className="text-indigo-600" />
            )}
            <span className="hidden md:inline">
              {theme === 'dark' ? 'Terang' : 'Gelap'}
            </span>
          </button>

          {/* Real Card Hardware Scanner Button */}
          <button
            onClick={() => onOpenHardwareModal?.()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-sm shadow-emerald-500/25 transition-all active:scale-95 cursor-pointer"
            title="Tangkap sinyal kartu aktif melalui Gateway (RFID / BLE / Webhook)"
          >
            <Radio size={14} className="animate-pulse text-white" />
            <span className="hidden sm:inline">Tangkap Sinyal Gateway</span>
          </button>

          {/* Sync Button */}
          <button
            id="btn-sync-gateway"
            onClick={onSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold text-xs shadow-sm shadow-indigo-500/25 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
            title="Sinkronkan status 7 Gateway"
          >
            <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
            <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan'}</span>
          </button>

          {/* Notification Bell */}
          <button
            id="btn-notifications"
            className="relative p-2 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all active:scale-95"
            title="Notifikasi sistem"
          >
            <Bell size={16} />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-indigo-600 text-white text-[9px] font-extrabold flex items-center justify-center ring-2 ring-[var(--bg-surface)]">
                {notifications.length > 9 ? '9+' : notifications.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Sub-header status strip ── */}
      <div className="px-5 md:px-6 py-2 border-t border-[var(--border-subtle)] bg-[var(--bg-subtle)]/60 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Network status */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] font-medium text-[var(--text-secondary)]">
            <Radio size={12} className="text-emerald-500 animate-pulse" />
            <span>Status Jaringan:</span>
            <span className="font-bold text-[var(--text-primary)]">7 Gateway Online</span>
          </div>

          <span className="text-[var(--border-strong)] hidden sm:inline">•</span>

          {/* Active card count */}
          <span className="inline-flex items-center gap-1.5 font-bold text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/40">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500" />
            </span>
            {activeDetections.length} kartu aktif di jangkauan
          </span>
        </div>

        <div className="text-[10px] text-[var(--text-muted)] font-medium hidden md:block tracking-wide">
          Sistem Monitoring Terpusat &nbsp;•&nbsp; Real-Time Gateway IoT
        </div>
      </div>
    </header>
  );
};

export default Header;
