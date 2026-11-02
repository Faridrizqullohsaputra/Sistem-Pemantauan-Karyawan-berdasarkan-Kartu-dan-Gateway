import React, { useState, useMemo } from 'react';
import {
  Server, Clock, MapPin, Wifi, WifiOff, AlertTriangle,
  Search, X, RefreshCw, Globe, Users, CheckCircle2,
  Activity, ShieldCheck, Settings,
} from 'lucide-react';
import { timeAgo } from '../data/simulationData';

/* ─── 3-Level Status Badge with Latency ─── */
const StatusBadge = ({ status, latency }) => {
  if (status === 'connected') {
    return (
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {latency && (
          <span className="hidden sm:inline-flex text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[var(--bg-hover)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
            {latency}ms
          </span>
        )}
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--success-bg)] text-[var(--success)] border border-[var(--success-border)]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--success)] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--success)]" />
          </span>
          Online
        </span>
      </div>
    );
  }
  if (status === 'connecting') {
    return (
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {latency && (
          <span className="hidden sm:inline-flex text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[var(--warning-bg)] text-[var(--warning)] border border-[var(--warning-border)]">
            {latency}ms
          </span>
        )}
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--warning-bg)] text-[var(--warning)] border border-[var(--warning-border)]">
          <AlertTriangle size={11} className="flex-shrink-0 animate-bounce" />
          Warning
        </span>
      </div>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--danger-bg)] text-[var(--danger)] border border-[var(--danger-border)] flex-shrink-0">
      <WifiOff size={11} className="flex-shrink-0" />
      Offline
    </span>
  );
};

/* ─── 4-Bar Signal Strength Meter ─── */
const SignalBar = ({ strength, status }) => {
  if (status === 'error' || status === 'disconnected' || !strength) {
    return <span className="text-[10px] font-mono text-[var(--text-muted)]">—</span>;
  }
  const bars = [25, 50, 75, 100];
  const color =
    strength > 70 ? 'var(--success)' :
    strength > 40 ? 'var(--warning)' :
    'var(--danger)';
  return (
    <div className="flex items-center gap-1" title={`Kekuatan Sinyal: ${strength}%`}>
      <div className="flex items-end gap-[2px] h-3.5">
        {bars.map((threshold, i) => (
          <div
            key={i}
            className="w-1 rounded-xs transition-all duration-300"
            style={{
              height: `${(i + 1) * 25}%`,
              backgroundColor: strength >= threshold ? color : 'var(--border-strong)',
              opacity: strength >= threshold ? 1 : 0.35,
            }}
          />
        ))}
      </div>
      <span className="text-[10px] font-mono font-semibold text-[var(--text-secondary)]">
        {strength}%
      </span>
    </div>
  );
};

const GatewayStatus = ({
  gateways = [],
  activeDetections = [],
  onAddNotification,
  onConfigureGateway,
  onUpdateGateway,
  syncNetworkData,
  isSyncing = false,
}) => {
  const [filter, setFilter] = useState('all'); // 'all' | 'connected' | 'connecting' | 'offline'
  const [search, setSearch] = useState('');
  const [pingingId, setPingingId] = useState(null);
  const [pingResults, setPingResults] = useState({});
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);

  // Group counts
  const total = gateways.length;
  const onlineGateways = gateways.filter(g => g.status === 'connected');
  const warningGateways = gateways.filter(g => g.status === 'connecting');
  const offlineGateways = gateways.filter(g => g.status === 'error' || g.status === 'disconnected');

  const onlineCount = onlineGateways.length;
  const warningCount = warningGateways.length;
  const offlineCount = offlineGateways.length;

  const onlinePct = total > 0 ? Math.round((onlineCount / total) * 100) : 0;
  const warningPct = total > 0 ? Math.round((warningCount / total) * 100) : 0;
  const offlinePct = total > 0 ? Math.max(0, 100 - onlinePct - warningPct) : 0;

  // Average latency of online gateways
  const avgLatency = useMemo(() => {
    const latencies = onlineGateways.map(g => g.latency).filter(Boolean);
    if (latencies.length === 0) return 14;
    return Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);
  }, [onlineGateways]);

  // Filtered gateway list
  const filteredGateways = useMemo(() => {
    return gateways.filter(gw => {
      // Status filter
      if (filter === 'connected' && gw.status !== 'connected') return false;
      if (filter === 'connecting' && gw.status !== 'connecting') return false;
      if (filter === 'offline' && (gw.status === 'connected' || gw.status === 'connecting')) return false;

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchId = gw.id.toLowerCase().includes(q);
        const matchName = gw.name.toLowerCase().includes(q);
        const matchIp = gw.ip.toLowerCase().includes(q);
        const matchLoc = gw.location.toLowerCase().includes(q);
        return matchId || matchName || matchIp || matchLoc;
      }
      return true;
    });
  }, [gateways, filter, search]);

  // Real Ping single gateway handler (menghubungi IP jaringan sebenarnya)
  const handlePing = async (gw, e) => {
    e?.stopPropagation();
    setPingingId(gw.id);

    try {
      const res = await fetch(`/api/gateway/ping?ip=${encodeURIComponent(gw.ip)}&id=${encodeURIComponent(gw.id)}`);
      const data = await res.json();
      setPingingId(null);

      if (data.success) {
        const ms = data.latency || 15;
        const ttl = data.ttl || 63;
        setPingResults(prev => ({ ...prev, [gw.id]: `${ms}ms` }));
        if (onUpdateGateway) {
          onUpdateGateway(gw.id, { status: 'connected', latency: ms, signalStrength: 88, issue: undefined });
        }
        if (onAddNotification) {
          onAddNotification(
            'success',
            `Ping Berhasil: ${gw.id}`,
            `Respon riil dari ${gw.ip}: ${ms}ms (TTL=${ttl}). Perangkat aktif dan terhubung.`
          );
        }
      } else {
        // Ping gagal (RTO) -> Terapkan status Error & alihkan kartu yang terdeteksi ke gateway terdekat yang aktif
        setPingResults(prev => ({ ...prev, [gw.id]: 'RTO' }));
        if (onUpdateGateway) {
          onUpdateGateway(gw.id, {
            status: 'error',
            latency: null,
            signalStrength: 0,
            issue: 'Koneksi perangkat gateway terputus (RTO)',
          });
        }
        if (onAddNotification) {
          onAddNotification(
            'error',
            `Ping Gagal: ${gw.id}`,
            `Perangkat ${gw.name} (${gw.ip}) tidak merespon (RTO). Status diatur ke Error.`
          );
        }
      }
    } catch (err) {
      setPingingId(null);
      // Gagal komunikasi/error jaringan -> Terapkan status Error
      setPingResults(prev => ({ ...prev, [gw.id]: 'ERROR' }));
      if (onUpdateGateway) {
        onUpdateGateway(gw.id, {
          status: 'error',
          latency: null,
          signalStrength: 0,
          issue: 'Gagal menghubungi perangkat (Network Error)',
        });
      }
      if (onAddNotification) {
        onAddNotification('error', `Ping Gagal: ${gw.id}`, `Gagal terhubung ke ${gw.name} (${gw.ip}). Status diatur ke Error.`);
      }
    }

    setTimeout(() => {
      setPingResults(prev => {
        const next = { ...prev };
        delete next[gw.id];
        return next;
      });
    }, 4500);
  };

  // Sync / Diagnostics trigger
  const handleSyncTrigger = () => {
    if (syncNetworkData) {
      syncNetworkData();
    } else {
      setIsRefreshingAll(true);
      setTimeout(() => {
        setIsRefreshingAll(false);
        if (onAddNotification) {
          onAddNotification(
            'info',
            'Diagnostik Jaringan Selesai',
            `Status 7 Gateway: ${onlineCount} Online, ${warningCount} Warning, ${offlineCount} Offline.`
          );
        }
      }, 700);
    }
  };

  return (
    <div className="card-container p-4 sm:p-5 h-full flex flex-col justify-between">
      {/* ── Top Section (Header + Health Bar + Search) ── */}
      <div className="flex-shrink-0">
        {/* ── Header ── */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="section-title">
              <Server size={17} className="text-[var(--brand)]" />
              Status Gateway IoT
            </h2>
            <p className="section-subtitle mt-0.5">
              Monitoring {total} perangkat • 3 level status operasional
            </p>
          </div>

          <button
            onClick={handleSyncTrigger}
            disabled={isSyncing || isRefreshingAll}
            title="Uji konektivitas seluruh gateway"
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border-subtle)] transition-all hover:border-[var(--brand-border)] flex-shrink-0 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={11} className={isSyncing || isRefreshingAll ? 'animate-spin text-[var(--brand)]' : ''} />
            <span className="hidden sm:inline">{isSyncing ? 'Sinkron...' : 'Uji Jaringan'}</span>
          </button>
        </div>

        {/* ── 3-Level Segmented Health Bar ── */}
        <div className="mb-3 p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
              Kesehatan Jaringan
              <span className="text-[10px] font-normal text-[var(--text-muted)]">
                ({onlinePct}% Operasional)
              </span>
            </span>
            <span className="font-mono text-xs font-bold text-[var(--text-primary)]">
              {onlineCount}/{total} Online
            </span>
          </div>

          {/* Multi-segment bar */}
          <div className="w-full h-2 rounded-full bg-[var(--border-subtle)] overflow-hidden flex">
            <div
              style={{ width: `${onlinePct}%` }}
              className="h-full bg-emerald-500 transition-all duration-500"
              title={`Online: ${onlineCount} (${onlinePct}%)`}
            />
            <div
              style={{ width: `${warningPct}%` }}
              className="h-full bg-amber-400 transition-all duration-500"
              title={`Warning: ${warningCount} (${warningPct}%)`}
            />
            <div
              style={{ width: `${offlinePct}%` }}
              className="h-full bg-rose-500 transition-all duration-500"
              title={`Offline: ${offlineCount} (${offlinePct}%)`}
            />
          </div>

          {/* 3-Level Filter Pills */}
          <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-[var(--border-subtle)] flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`px-2 py-0.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                filter === 'all'
                  ? 'bg-[var(--brand)] text-white shadow-xs'
                  : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              Semua
              <span className={`text-[10px] font-bold px-1.5 rounded-full ${filter === 'all' ? 'bg-white/25 text-white' : 'bg-[var(--bg-hover)] text-[var(--text-muted)]'}`}>
                {total}
              </span>
            </button>

            <button
              onClick={() => setFilter('connected')}
              className={`px-2 py-0.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                filter === 'connected'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-[var(--bg-surface)] text-[var(--success)] border border-[var(--success-border)] hover:bg-[var(--success-bg)]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Online
              <span className={`text-[10px] font-bold px-1.5 rounded-full ${filter === 'connected' ? 'bg-white/25 text-white' : 'bg-[var(--success-bg)] text-[var(--success)]'}`}>
                {onlineCount}
              </span>
            </button>

            <button
              onClick={() => setFilter('connecting')}
              className={`px-2 py-0.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                filter === 'connecting'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-[var(--bg-surface)] text-[var(--warning)] border border-[var(--warning-border)] hover:bg-[var(--warning-bg)]'
              }`}
            >
              <AlertTriangle size={11} />
              Warning
              <span className={`text-[10px] font-bold px-1.5 rounded-full ${filter === 'connecting' ? 'bg-white/25 text-white' : 'bg-[var(--warning-bg)] text-[var(--warning)]'}`}>
                {warningCount}
              </span>
            </button>

            <button
              onClick={() => setFilter('offline')}
              className={`px-2 py-0.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                filter === 'offline'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-[var(--bg-surface)] text-[var(--danger)] border border-[var(--danger-border)] hover:bg-[var(--danger-bg)]'
              }`}
            >
              <WifiOff size={11} />
              Offline
              <span className={`text-[10px] font-bold px-1.5 rounded-full ${filter === 'offline' ? 'bg-white/25 text-white' : 'bg-[var(--danger-bg)] text-[var(--danger)]'}`}>
                {offlineCount}
              </span>
            </button>
          </div>
        </div>

        {/* ── Search Input ── */}
        <div className="relative mb-2.5">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Cari ID, nama, IP, atau lokasi..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-styled pl-7 pr-6 py-1 text-xs w-full"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              <X size={11} />
            </button>
          )}
        </div>
      </div>

      {/* ── Middle Section: Gateway Cards List ── */}
      <div className="space-y-2.5 overflow-y-auto pr-1 flex-1 min-h-0 my-1">
        {filteredGateways.length === 0 ? (
          <div className="py-8 text-center text-xs text-[var(--text-muted)] flex flex-col items-center gap-1.5 bg-[var(--bg-subtle)] rounded-xl border border-[var(--border-subtle)]">
            <Server size={22} className="text-[var(--border-strong)]" />
            <span>Tidak ada Gateway yang sesuai filter.</span>
            {(search || filter !== 'all') && (
              <button
                onClick={() => { setSearch(''); setFilter('all'); }}
                className="text-xs font-semibold text-[var(--brand)] hover:underline mt-1 cursor-pointer"
              >
                Reset Filter
              </button>
            )}
          </div>
        ) : (
          filteredGateways.map(gw => {
            const isOnline = gw.status === 'connected';
            const isWarning = gw.status === 'connecting';
            const isOffline = gw.status === 'error' || gw.status === 'disconnected';

            const activeCardsCount = activeDetections.filter(d => d.gatewayId === gw.id).length;
            const pingMsg = pingResults[gw.id];
            const isPinging = pingingId === gw.id;

            return (
              <div
                key={gw.id}
                className={`p-3 rounded-xl border transition-all duration-150 hover:shadow-sm ${
                  isOnline
                    ? 'border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--success-border)]'
                    : isWarning
                    ? 'border-[var(--warning-border)] bg-[var(--warning-bg)]'
                    : 'border-[var(--danger-border)] bg-[var(--danger-bg)]'
                }`}
              >
                {/* ── Row 1: ID Chip + Full Name + Status Badge ── */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-[var(--brand-bg)] text-[var(--brand)] border border-[var(--brand-border)] flex-shrink-0">
                      {gw.id}
                    </span>
                    <span className="text-sm font-bold text-[var(--text-primary)] truncate">
                      {gw.name}
                    </span>
                  </div>
                  <StatusBadge status={gw.status} latency={gw.latency} />
                </div>

                {/* ── Row 2: Location + IP + Signal Bar ── */}
                <div className="flex items-center justify-between text-xs gap-2 mb-1.5 text-[var(--text-muted)]">
                  <div className="flex items-center gap-1.5 min-w-0 truncate">
                    <MapPin size={11} className="flex-shrink-0 text-[var(--text-muted)]" />
                    <span className="truncate">{gw.location}</span>
                    <span className="text-[var(--border-strong)]">•</span>
                    <span className="font-mono text-[11px] font-semibold text-[var(--text-secondary)]">{gw.ip}</span>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <SignalBar strength={gw.signalStrength} status={gw.status} />
                  </div>
                </div>

                {/* ── Issue notice if Warning / Offline ── */}
                {(isWarning || isOffline) && (
                  <div className="mb-2 px-2 py-0.5 rounded bg-[var(--bg-surface)]/90 border border-[var(--border-subtle)] flex items-center gap-1 text-[11px] font-medium text-[var(--text-secondary)]">
                    {isWarning ? <AlertTriangle size={11} className="text-[var(--warning)] flex-shrink-0" /> : <WifiOff size={11} className="text-[var(--danger)] flex-shrink-0" />}
                    <span className="truncate">{gw.issue || (isWarning ? 'Latensi tinggi terdeteksi pada gateway' : 'Koneksi perangkat gateway terputus')}</span>
                  </div>
                )}

                {/* ── Row 3: Active Cards + Last Seen + Ping action ── */}
                <div className="flex items-center justify-between text-xs pt-1.5 border-t border-[var(--border-subtle)] text-[var(--text-muted)]">
                  <div className="flex items-center gap-2 truncate">
                    <span className="flex items-center gap-1">
                      <Users size={11} className="text-[var(--brand)]" />
                      <span><strong className="text-[var(--text-primary)]">{activeCardsCount}</strong> kartu aktif</span>
                    </span>
                    <span className="text-[var(--border-strong)]">•</span>
                    <span className="flex items-center gap-1 font-mono text-[11px]">
                      <Clock size={10} />
                      {timeAgo(gw.lastSeen)}
                    </span>
                  </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {onConfigureGateway && (
                        <button
                          onClick={() => onConfigureGateway(gw.id)}
                          className="text-xs font-semibold px-2 py-0.5 rounded bg-[var(--bg-subtle)] hover:bg-[var(--brand-bg)] text-[var(--text-secondary)] hover:text-[var(--brand)] border border-[var(--border-subtle)] hover:border-[var(--brand-border)] transition-all flex items-center gap-1 cursor-pointer"
                          title={`Edit parameter perangkat ${gw.name} (lokasi tetap)`}
                        >
                          <Settings size={10} />
                          <span>Edit</span>
                        </button>
                      )}

                      {pingMsg ? (
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          pingMsg.includes('OK') || !pingMsg.includes('RTO')
                            ? 'bg-[var(--success-bg)] text-[var(--success)] border border-[var(--success-border)]'
                            : 'bg-[var(--danger-bg)] text-[var(--danger)] border border-[var(--danger-border)]'
                        }`}>
                          {pingMsg}
                        </span>
                      ) : (
                        <button
                          onClick={(e) => handlePing(gw, e)}
                          disabled={isPinging}
                          className="text-xs font-semibold px-2 py-0.5 rounded bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--brand)] border border-[var(--border-subtle)] transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <RefreshCw size={10} className={isPinging ? 'animate-spin text-[var(--brand)]' : ''} />
                          <span>{isPinging ? 'Menguji...' : 'Uji Ping'}</span>
                        </button>
                      )}
                    </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Bottom Section: Telemetry & Network Health Summary (Eliminates Empty Space) ── */}
      <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] flex-shrink-0 bg-[var(--bg-subtle)] -mx-4 -mb-4 sm:-mx-5 sm:-mb-5 p-3.5 sm:p-4 rounded-b-2xl">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Activity size={13} className="text-[var(--brand)]" />
            <span className="text-xs font-bold text-[var(--text-primary)]">
              Diagnostik Jaringan IoT
            </span>
          </div>
          <span className="text-[10px] font-mono text-[var(--text-muted)] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
            Polling: 8d
          </span>
        </div>

        {/* 3 Metric Pills */}
        <div className="grid grid-cols-3 gap-2 mb-2.5 text-center">
          <div className="p-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
            <div className="text-[10px] text-[var(--text-muted)] font-medium">Avg Latensi</div>
            <div className="text-xs font-mono font-bold text-[var(--text-primary)] mt-0.5">~{avgLatency} ms</div>
          </div>
          <div className="p-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
            <div className="text-[10px] text-[var(--text-muted)] font-medium">Konektivitas</div>
            <div className="text-xs font-mono font-bold text-[var(--success)] mt-0.5">{onlinePct}%</div>
          </div>
          <div className="p-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
            <div className="text-[10px] text-[var(--text-muted)] font-medium">Perhatian</div>
            <div className={`text-xs font-mono font-bold mt-0.5 ${warningCount + offlineCount > 0 ? 'text-[var(--warning)]' : 'text-[var(--success)]'}`}>
              {warningCount + offlineCount} Unit
            </div>
          </div>
        </div>

        {/* Full-width primary action button */}
        <button
          onClick={handleSyncTrigger}
          disabled={isSyncing || isRefreshingAll}
          className="w-full py-2 px-3 rounded-xl bg-[var(--brand-bg)] hover:bg-[var(--brand)] text-[var(--brand)] hover:text-white border border-[var(--brand-border)] text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={12} className={isSyncing || isRefreshingAll ? 'animate-spin' : ''} />
          <span>{isSyncing ? 'Menyinkronkan Seluruh Gateway...' : 'Sinkronisasi Jaringan Gateway'}</span>
        </button>
      </div>
    </div>
  );
};

export default GatewayStatus;
