import React from 'react';
import DashboardStats from '../components/DashboardStats';
import GatewayStatus from '../components/GatewayStatus';
import { Activity, ArrowRight, Clock, UserCheck } from 'lucide-react';
import { getCardHolder, getGateway, formatTime, timeAgo } from '../data/simulationData';

// Cohesive 5-color palette (indigo, teal, rose, amber, sky)
const PALETTES = [
  {
    bg: 'bg-indigo-50 dark:bg-indigo-950/50',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-200 dark:border-indigo-800/60',
  },
  {
    bg: 'bg-teal-50 dark:bg-teal-950/50',
    text: 'text-teal-700 dark:text-teal-300',
    border: 'border-teal-200 dark:border-teal-800/60',
  },
  {
    bg: 'bg-rose-50 dark:bg-rose-950/50',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-800/60',
  },
  {
    bg: 'bg-amber-50 dark:bg-amber-950/50',
    text: 'text-amber-800 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800/60',
  },
  {
    bg: 'bg-sky-50 dark:bg-sky-950/50',
    text: 'text-sky-700 dark:text-sky-300',
    border: 'border-sky-200 dark:border-sky-800/60',
  },
];

const getAvatarStyle = (cardId = '') => {
  const code = (cardId.charCodeAt(cardId.length - 1) || 0) + (cardId.charCodeAt(cardId.length - 2) || 0);
  return PALETTES[code % PALETTES.length];
};

const RecentActivityItem = ({ detection }) => {
  const holder = getCardHolder(detection.cardId);
  const gw = getGateway(detection.gatewayId);
  const avatarStyle = getAvatarStyle(detection.cardId);

  return (
    <div className="flex items-center gap-3.5 py-3 px-3 hover:bg-[var(--bg-subtle)] rounded-xl transition-colors">
      {/* Avatar with consistent pastel background and dark text */}
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 border ${avatarStyle.bg} ${avatarStyle.text} ${avatarStyle.border}`}
      >
        {holder?.avatarInitials}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Name: --text-primary weight 600 */}
          <span className="text-sm font-semibold text-[var(--text-primary)] truncate">
            {holder?.name}
          </span>
          {/* Chip CARD-00128: --bg-hover, --text-primary, --border-subtle, font mono */}
          <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)]">
            {holder?.cardId}
          </span>
          {/* Department: --text-muted */}
          <span className="text-xs text-[var(--text-muted)]">
            ({holder?.department})
          </span>
        </div>
        {/* Location: --text-secondary */}
        <div className="text-xs text-[var(--text-secondary)] mt-1 flex items-center gap-1.5 truncate">
          <span className="font-medium text-[var(--text-primary)]">{gw?.name}</span>
          <span className="text-[var(--border-strong)]">•</span>
          <span className="truncate">{gw?.location}</span>
        </div>
      </div>

      {/* Timestamp: Time in --text-primary mono, timeAgo in --text-muted */}
      <div className="text-right flex-shrink-0">
        <div className="text-xs font-mono font-semibold text-[var(--text-primary)]">
          {formatTime(detection.detectedAt)}
        </div>
        <div className="text-xs text-[var(--text-muted)] mt-0.5">
          {timeAgo(detection.detectedAt)}
        </div>
      </div>

      {/* Status dot: --success with halo ring (box-shadow 0 0 0 3px success-bg) */}
      <div
        className="w-2.5 h-2.5 rounded-full bg-[var(--success)] flex-shrink-0"
        style={{ boxShadow: '0 0 0 3px var(--success-bg)' }}
        title="Terdeteksi aktif"
      />
    </div>
  );
};

const DashboardPage = ({
  activeDetections,
  gateways,
  totalRegistered,
  totalDetectionsToday,
  onNavigate,
  historyRecords,
}) => {
  const connectedGateways = gateways.filter(g => g.status === 'connected').length;
  const recentHistory = historyRecords.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* 4 Stat Cards */}
      <DashboardStats
        activeDetections={activeDetections.length}
        totalRegistered={totalRegistered}
        connectedGateways={connectedGateways}
        totalGateways={gateways.length}
        totalDetectionsToday={totalDetectionsToday}
      />

      {/* Main Grid: 1/3 Gateway Status, 2/3 Live Feed & Recent Records */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column: 7 Gateway Status Cards */}
        <div className="xl:col-span-1">
          <GatewayStatus gateways={gateways} />
        </div>

        {/* Right Column: Live Detection Feed & 5 Recent Records */}
        <div className="xl:col-span-2 space-y-6">
          {/* Real-time Detection Feed Card */}
          <div className="card-container p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="section-title">
                  <Activity size={18} className="text-[var(--brand)]" />
                  Aktivitas Deteksi Terkini
                </h2>
                <p className="section-subtitle">
                  Kartu identitas yang saat ini berada di area jangkauan Gateway
                </p>
              </div>
              <button
                onClick={() => onNavigate('cards')}
                className="text-xs font-bold text-[var(--brand)] hover:opacity-80 flex items-center gap-1 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-[var(--brand-bg)]"
              >
                Lihat semua kartu <ArrowRight size={13} />
              </button>
            </div>

            {activeDetections.length === 0 ? (
              <div className="py-12 text-center text-[var(--text-muted)] text-sm">
                <UserCheck size={36} className="mx-auto mb-2 text-[var(--border-strong)]" />
                Belum ada kartu terdeteksi. Klik tombol <strong>Masuk</strong> pada bar atas untuk simulasi.
              </div>
            ) : (
              <div className="divide-y divide-[var(--border-subtle)]">
                {activeDetections.slice(0, 5).map(det => (
                  <RecentActivityItem key={det.id} detection={det} />
                ))}
                {activeDetections.length > 5 && (
                  <button
                    onClick={() => onNavigate('cards')}
                    className="w-full mt-3 py-2 text-xs font-semibold text-[var(--brand)] hover:opacity-85 transition-colors text-center bg-[var(--brand-bg)] rounded-lg"
                  >
                    +{activeDetections.length - 5} kartu lainnya sedang terdeteksi →
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 5 Last History Records */}
          <div className="card-container p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="section-title">
                  <Clock size={18} className="text-[var(--brand)]" />
                  5 Riwayat Pembacaan Terakhir
                </h2>
                <p className="section-subtitle">
                  Catatan waktu deteksi terbaru dari semua Gateway
                </p>
              </div>
              <button
                onClick={() => onNavigate('history')}
                className="text-xs font-bold text-[var(--brand)] hover:opacity-80 flex items-center gap-1 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-[var(--brand-bg)]"
              >
                Buka log lengkap <ArrowRight size={13} />
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[var(--border-subtle)]">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>Waktu Deteksi</th>
                    <th>ID Kartu</th>
                    <th>Nama Pemegang</th>
                    <th>Gateway & Lokasi</th>
                    <th>Status Kartu</th>
                  </tr>
                </thead>
                <tbody>
                  {recentHistory.map(rec => (
                    <tr key={rec.id}>
                      <td className="font-mono text-xs text-[var(--text-muted)] font-medium">
                        {timeAgo(rec.detectedAt)}
                      </td>
                      <td className="font-mono font-semibold text-xs text-[var(--brand)]">
                        {rec.cardId}
                      </td>
                      <td className="font-semibold text-[var(--text-primary)]">
                        {rec.holderName}
                      </td>
                      <td className="text-[var(--text-secondary)]">
                        <span className="font-semibold text-[var(--text-primary)]">{rec.gatewayName}</span>
                        <span className="text-[var(--text-muted)] ml-1.5">({rec.location})</span>
                      </td>
                      <td>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          rec.cardStatus === 'active'
                            ? 'bg-[var(--success-bg)] text-[var(--success)] border border-[var(--success-border)]'
                            : 'bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
                        }`}>
                          {rec.cardStatus === 'active' ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
