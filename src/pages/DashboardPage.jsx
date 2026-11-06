import React, { useState, useMemo } from 'react';
import DashboardStats from '../components/DashboardStats';
import GatewayStatus from '../components/GatewayStatus';
import {
  Activity, ArrowRight, Clock, UserCheck,
  Search, X, BarChart2, TrendingUp,
} from 'lucide-react';
import { getCardHolder, getGateway, formatTime, timeAgo, GATEWAYS } from '../data/simulationData';

/* ── Color Palettes for Avatars ── */
const PALETTES = [
  { bg: 'bg-indigo-50 dark:bg-indigo-900/40', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-700/60' },
  { bg: 'bg-emerald-50 dark:bg-emerald-900/40', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-700/60' },
  { bg: 'bg-rose-50 dark:bg-rose-900/40',   text: 'text-rose-700 dark:text-rose-300',   border: 'border-rose-200 dark:border-rose-700/60'   },
  { bg: 'bg-amber-50 dark:bg-amber-900/40', text: 'text-amber-800 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-700/60' },
  { bg: 'bg-sky-50 dark:bg-sky-900/40',     text: 'text-sky-700 dark:text-sky-300',     border: 'border-sky-200 dark:border-sky-700/60'     },
];

const getAvatarStyle = (cardId = '') => {
  const code = (cardId.charCodeAt(cardId.length - 1) || 0) + (cardId.charCodeAt(cardId.length - 2) || 0);
  return PALETTES[code % PALETTES.length];
};

/* ── Hourly Activity Chart ── */
const HourlyActivityChart = ({ historyRecords }) => {
  // Build last 12 hours buckets
  const now = new Date();
  const hours = Array.from({ length: 12 }, (_, i) => {
    const h = new Date(now);
    h.setHours(now.getHours() - (11 - i), 0, 0, 0);
    return h;
  });

  const buckets = hours.map((hourStart, i) => {
    const hourEnd = i < 11 ? hours[i + 1] : new Date(now.getTime() + 3600000);
    const count = historyRecords.filter(r => {
      const t = new Date(r.detectedAt);
      return t >= hourStart && t < hourEnd;
    }).length;
    return { label: `${String(hourStart.getHours()).padStart(2, '0')}:00`, count };
  });

  const maxCount = Math.max(...buckets.map(b => b.count), 1);

  return (
    <div className="card-container p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="section-title">
            <BarChart2 size={17} className="text-[var(--brand)]" />
            Grafik Aktivitas Per Jam
          </h2>
          <p className="section-subtitle mt-0.5">
            Distribusi deteksi kartu dalam 12 jam terakhir
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--brand-bg)] border border-[var(--brand-border)]">
          <TrendingUp size={12} className="text-[var(--brand)]" />
          <span className="text-xs font-bold text-[var(--brand)]">
            {historyRecords.length} total
          </span>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="flex items-end gap-1.5 h-28">
        {buckets.map((b, i) => {
          const heightPct = Math.max((b.count / maxCount) * 100, b.count > 0 ? 8 : 3);
          const isCurrentHour = i === 11;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
              <div className="relative w-full flex flex-col justify-end" style={{ height: '80px' }}>
                {b.count > 0 && (
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {b.count}
                  </span>
                )}
                <div
                  className={`w-full rounded-t-md transition-all duration-500 ${
                    isCurrentHour
                      ? 'bg-gradient-to-t from-indigo-600 to-indigo-400 shadow-sm shadow-indigo-500/30'
                      : b.count > 0
                      ? 'bg-gradient-to-t from-emerald-600/80 to-emerald-400/70 dark:from-emerald-500/70 dark:to-emerald-400/50'
                      : 'bg-[var(--border-subtle)]'
                  }`}
                  style={{ height: `${heightPct}%` }}
                  title={`${b.label} — ${b.count} deteksi`}
                />
              </div>
              <span className={`text-[9px] font-mono font-medium ${
                isCurrentHour ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-[var(--text-muted)]'
              }`}>
                {b.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[var(--border-subtle)]">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-gradient-to-t from-emerald-600/80 to-emerald-400/70" />
          <span className="text-[10px] text-[var(--text-muted)] font-medium">Jam sebelumnya</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-gradient-to-t from-indigo-600 to-indigo-400" />
          <span className="text-[10px] text-[var(--text-muted)] font-medium">Jam ini</span>
        </div>
        <div className="ml-auto text-[10px] text-[var(--text-muted)]">
          Puncak: <span className="font-bold text-[var(--text-primary)]">{Math.max(...buckets.map(b => b.count))} deteksi/jam</span>
        </div>
      </div>
    </div>
  );
};

/* ── Activity Item ── */
const RecentActivityItem = ({ detection, gateways = [], onDetectCard }) => {
  const holder = getCardHolder(detection.cardId);
  const gw = getGateway(detection.gatewayId) || gateways.find(g => g.id === detection.gatewayId);
  const avatarStyle = getAvatarStyle(detection.cardId);

  return (
    <div className="flex items-center gap-3.5 py-3 px-3 hover:bg-[var(--bg-subtle)] rounded-xl transition-all duration-150 group">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 border ${avatarStyle.bg} ${avatarStyle.text} ${avatarStyle.border} group-hover:scale-105 transition-transform`}>
        {holder?.avatarInitials}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-[var(--text-primary)] truncate">
            {holder?.name}
          </span>
          <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-[var(--bg-hover)] text-[var(--brand)] border border-[var(--border-subtle)]">
            {holder?.cardId}
          </span>
          <span className="text-xs text-[var(--text-muted)]">
            ({holder?.department})
          </span>
        </div>
        <div className="text-xs text-[var(--text-secondary)] mt-1 flex items-center gap-1.5 flex-wrap">
          <span className="font-semibold text-[var(--text-primary)]">{gw?.name}</span>
          <span className="text-[var(--border-strong)]">•</span>
          <span className="truncate">{gw?.location}</span>
          {/* Pindah Gateway selector */}
          {onDetectCard && gateways.length > 0 && (
            <select
              value={detection.gatewayId}
              onChange={(e) => onDetectCard(detection.cardId, e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="ml-auto text-[10px] font-bold py-0.5 px-2 rounded-md bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--brand)] transition-colors cursor-pointer"
              title="Pindahkan kartu ini ke Gateway lain"
            >
              {gateways.map(g => (
                <option key={g.id} value={g.id}>
                  {g.id} — {g.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="text-right flex-shrink-0">
        <div className="text-xs font-mono font-semibold text-[var(--text-primary)]">
          {formatTime(detection.detectedAt)}
        </div>
        <div className="text-xs text-[var(--text-muted)] mt-0.5">
          {timeAgo(detection.detectedAt)}
        </div>
      </div>

      <div
        className="w-2.5 h-2.5 rounded-full bg-[var(--success)] flex-shrink-0 animate-pulse"
        style={{ boxShadow: '0 0 0 3px var(--success-bg)' }}
        title="Terdeteksi aktif"
      />
    </div>
  );
};

/* ── Main DashboardPage ── */
const DashboardPage = ({
  activeDetections,
  gateways,
  totalRegistered,
  totalDetectionsToday,
  onNavigate,
  onConfigureGateway,
  onUpdateGateway,
  historyRecords,
  onAddNotification,
  syncNetworkData,
  isSyncing,
  onDetectCard,
}) => {
  const connectedGateways = gateways.filter(g => g.status === 'connected').length;
  const warningGateways = gateways.filter(g => g.status === 'connecting').length;
  const offlineGateways = gateways.filter(g => g.status === 'error' || g.status === 'disconnected').length;
  const recentHistory = historyRecords.slice(0, 5);

  /* Activity feed search + filter */
  const [actSearch, setActSearch] = useState('');
  const [actGwFilter, setActGwFilter] = useState('all');

  const filteredDetections = useMemo(() => {
    let list = [...activeDetections];
    if (actSearch) {
      const q = actSearch.toLowerCase();
      list = list.filter(det => {
        const holder = getCardHolder(det.cardId);
        const gw = getGateway(det.gatewayId);
        return (
          det.cardId.toLowerCase().includes(q) ||
          holder?.name?.toLowerCase().includes(q) ||
          holder?.department?.toLowerCase().includes(q) ||
          gw?.name?.toLowerCase().includes(q) ||
          gw?.location?.toLowerCase().includes(q)
        );
      });
    }
    if (actGwFilter !== 'all') {
      list = list.filter(det => det.gatewayId === actGwFilter);
    }
    return list;
  }, [activeDetections, actSearch, actGwFilter]);

  const hasFilters = actSearch !== '' || actGwFilter !== 'all';

  return (
    <div className="space-y-6">
      {/* ── 4 Stat Cards ── */}
      <DashboardStats
        activeDetections={activeDetections.length}
        totalRegistered={totalRegistered}
        connectedGateways={connectedGateways}
        totalGateways={gateways.length}
        totalDetectionsToday={totalDetectionsToday}
        warningGateways={warningGateways}
        offlineGateways={offlineGateways}
        onNavigate={onNavigate}
      />

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Left: Gateway Status */}
        <div className="xl:col-span-1 flex flex-col xl:sticky xl:top-5">
          <GatewayStatus
            gateways={gateways}
            activeDetections={activeDetections}
            onAddNotification={onAddNotification}
            onConfigureGateway={onConfigureGateway}
            onUpdateGateway={onUpdateGateway}
            syncNetworkData={syncNetworkData}
            isSyncing={isSyncing}
          />
        </div>

        {/* Right: Live Feed + Recent History */}
        <div className="xl:col-span-2 space-y-6 flex flex-col">
          {/* ── Real-time Detection Feed ── */}
          <div className="card-container p-5">
            {/* Card Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="section-title">
                  <Activity size={17} className="text-[var(--brand)]" />
                  Aktivitas Deteksi Terkini
                </h2>
                <p className="section-subtitle mt-0.5">
                  {filteredDetections.length} kartu aktif
                  {hasFilters && ` (filter dari ${activeDetections.length})`}
                  {' '}dalam jangkauan Gateway
                </p>
              </div>
              <button
                onClick={() => onNavigate('cards')}
                className="text-xs font-bold text-[var(--brand)] hover:opacity-80 flex items-center gap-1 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-[var(--brand-bg)] flex-shrink-0"
              >
                Lihat semua <ArrowRight size={13} />
              </button>
            </div>

            {/* ── Filter Bar ── */}
            <div className="flex flex-wrap gap-2 mb-3">
              {/* Search */}
              <div className="relative flex-1 min-w-40">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  id="input-search-activity"
                  type="text"
                  placeholder="Cari nama, kartu, gateway..."
                  value={actSearch}
                  onChange={e => setActSearch(e.target.value)}
                  className="input-styled pl-8 py-1.5 text-xs"
                />
                {actSearch && (
                  <button
                    onClick={() => setActSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
              {/* Gateway Filter */}
              <select
                id="select-activity-gateway"
                value={actGwFilter}
                onChange={e => setActGwFilter(e.target.value)}
                className="input-styled px-3 py-1.5 text-xs appearance-none cursor-pointer min-w-40 font-medium"
              >
                <option value="all">Semua Gateway</option>
                {gateways.map(gw => (
                  <option key={gw.id} value={gw.id}>{gw.name}</option>
                ))}
              </select>
              {/* Clear filters */}
              {hasFilters && (
                <button
                  onClick={() => { setActSearch(''); setActGwFilter('all'); }}
                  className="px-2.5 py-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-[var(--bg-hover)] border border-[var(--border-subtle)] rounded-lg transition-all flex items-center gap-1"
                >
                  <X size={12} /> Reset
                </button>
              )}
            </div>

            {/* Activity list */}
            {filteredDetections.length === 0 ? (
              <div className="py-10 text-center text-[var(--text-muted)] text-sm flex flex-col items-center gap-2">
                <UserCheck size={32} className="text-[var(--border-strong)]" />
                {hasFilters
                  ? 'Tidak ada kartu yang sesuai filter.'
                  : 'Belum ada kartu identitas yang terdeteksi dalam jangkauan Gateway saat ini.'}
              </div>
            ) : (
              <div className="divide-y divide-[var(--border-subtle)]">
                {filteredDetections.slice(0, 6).map(det => (
                  <RecentActivityItem
                    key={det.id}
                    detection={det}
                    gateways={gateways}
                    onDetectCard={onDetectCard}
                  />
                ))}
                {filteredDetections.length > 6 && (
                  <button
                    onClick={() => onNavigate('cards')}
                    className="w-full mt-2 py-2 text-xs font-semibold text-[var(--brand)] hover:opacity-85 transition-colors text-center bg-[var(--brand-bg)] rounded-xl"
                  >
                    +{filteredDetections.length - 6} kartu lainnya sedang terdeteksi →
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ── Hourly Activity Chart ── */}
          <HourlyActivityChart historyRecords={historyRecords} />

          {/* ── 5 Last History Records ── */}
          <div className="card-container p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="section-title">
                  <Clock size={17} className="text-[var(--brand)]" />
                  Riwayat Pembacaan Terakhir
                </h2>
                <p className="section-subtitle mt-0.5">
                  5 catatan waktu deteksi terbaru dari seluruh Gateway
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
                    <th>Gateway &amp; Lokasi</th>
                    <th>Status Kartu</th>
                  </tr>
                </thead>
                <tbody>
                  {recentHistory.map(rec => (
                    <tr key={rec.id}>
                      <td className="font-mono text-xs text-[var(--text-muted)] font-medium whitespace-nowrap">
                        {timeAgo(rec.detectedAt)}
                      </td>
                      <td className="font-mono font-semibold text-xs text-[var(--brand)]">
                        {rec.cardId}
                      </td>
                      <td className="font-semibold text-[var(--text-primary)] text-xs">
                        {rec.holderName}
                      </td>
                      <td className="text-xs">
                        <span className="font-semibold text-[var(--text-primary)]">{rec.gatewayName}</span>
                        <span className="text-[var(--text-muted)] ml-1.5">({rec.location})</span>
                      </td>
                      <td>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          rec.cardStatus === 'active'
                            ? 'bg-[var(--success-bg)] text-[var(--success)] border border-[var(--success-border)]'
                            : 'bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
                        }`}>
                          {rec.cardStatus === 'active' ? (
                            <><span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" /> Aktif</>
                          ) : 'Nonaktif'}
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
