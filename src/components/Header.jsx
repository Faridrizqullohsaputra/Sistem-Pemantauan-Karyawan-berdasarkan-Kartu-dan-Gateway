import React, { useState, useEffect } from 'react';
import {
  Bell,
  Play,
  Pause,
  Plus,
  Minus,
  Menu,
  Clock,
  Sun,
  Moon,
  Radio,
} from 'lucide-react';

const Header = ({
  activePage,
  isSimRunning,
  toggleSimulation,
  simulateNewDetection,
  simulateCardLeave,
  notifications,
  onToggleSidebar,
  activeDetections,
  theme,
  onToggleTheme,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const pageTitle = {
    dashboard: 'Dashboard Utama',
    cards: 'Kartu Terdeteksi',
    map: 'Peta Jangkauan Gateway',
    history: 'Riwayat Deteksi',
    config: 'Konfigurasi Gateway',
  }[activePage] || 'Dashboard';

  const pageDesc = {
    dashboard: 'Monitoring kartu karyawan & pengunjung melalui jaringan 7 Gateway perusahaan',
    cards: 'Daftar lengkap identitas kartu yang saat ini berada dalam radius sensor',
    map: 'Visualisasi denah area perusahaan dan posisi kartu terdeteksi',
    history: 'Log lengkap seluruh aktivitas pembacaan kartu identitas',
    config: 'Pengaturan koneksi URL, autentikasi, dan status perangkat Gateway',
  }[activePage] || '';

  return (
    <header className="sticky top-0 z-40 bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] px-5 md:px-6 py-3 transition-colors duration-150">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Menu & Title */}
        <div className="flex items-center gap-3.5 min-w-0">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] border border-transparent hover:border-[var(--border-subtle)] transition-all flex-shrink-0"
            title="Toggle sidebar"
            id="btn-toggle-sidebar"
          >
            <Menu size={18} />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-base md:text-lg font-bold text-[var(--text-primary)] tracking-tight">
                {pageTitle}
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--success-bg)] text-[var(--success)] border border-[var(--success-border)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
                Sistem Aktif
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] hidden sm:block truncate mt-0.5">
              {pageDesc}
            </p>
          </div>
        </div>

        {/* Right: Controls & Actions */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          {/* Digital Clock */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs font-mono font-semibold text-[var(--text-primary)]">
            <Clock size={13} className="text-[var(--text-muted)]" />
            <span>{currentTime.toLocaleTimeString('id-ID')}</span>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            id="btn-toggle-theme"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] text-xs font-medium transition-all"
            title={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
          >
            {theme === 'dark' ? (
              <>
                <Sun size={14} className="text-amber-400" />
                <span className="hidden md:inline font-semibold">Mode Terang</span>
              </>
            ) : (
              <>
                <Moon size={14} className="text-[var(--brand)]" />
                <span className="hidden md:inline font-semibold">Mode Gelap</span>
              </>
            )}
          </button>

          {/* Simulation Action Buttons: Masuk, Keluar, Jeda (Strictly Equal Height, Radius, Padding) */}
          <div className="flex items-center gap-1.5">
            <button
              id="btn-simulate-detect"
              onClick={simulateNewDetection}
              className="btn-sim-enter"
              title="Simulasikan kartu masuk"
            >
              <Plus size={13} strokeWidth={2.5} />
              <span>Masuk</span>
            </button>

            <button
              id="btn-simulate-leave"
              onClick={simulateCardLeave}
              className="btn-sim-leave"
              title="Simulasikan kartu keluar"
            >
              <Minus size={13} strokeWidth={2.5} />
              <span>Keluar</span>
            </button>

            <button
              id="btn-toggle-simulation"
              onClick={toggleSimulation}
              className="btn-sim-pause"
              title={isSimRunning ? 'Jeda interval deteksi' : 'Lanjutkan deteksi'}
            >
              {isSimRunning ? <Pause size={13} /> : <Play size={13} />}
              <span className="hidden sm:inline">{isSimRunning ? 'Jeda' : 'Lanjut'}</span>
            </button>
          </div>

          {/* Notifications Bell */}
          <button
            id="btn-notifications"
            className="relative p-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
            title="Notifikasi sistem"
          >
            <Bell size={16} />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--brand)] text-white text-[10px] font-bold flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Sub Header Status Strip */}
      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--border-subtle)] text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-medium text-[var(--text-secondary)]">
            <Radio size={13} className={isSimRunning ? 'text-[var(--brand)]' : 'text-[var(--text-muted)]'} />
            <span>Mode Monitoring:</span>
            <span className="font-semibold text-[var(--text-primary)]">
              {isSimRunning ? 'Deteksi Otomatis Berjalan' : 'Simulasi Dijeda'}
            </span>
          </div>
          <span className="text-[var(--border-strong)]">•</span>
          <span className="font-bold text-[var(--brand)]">
            {activeDetections.length} kartu aktif di jangkauan
          </span>
        </div>

        <div className="text-[11px] text-[var(--text-muted)] font-medium">
          Prototipe Frontend — Data simulasi 7 perangkat Gateway
        </div>
      </div>
    </header>
  );
};

export default Header;
