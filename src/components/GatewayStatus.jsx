import React from 'react';
import { Wifi, WifiOff, AlertTriangle, Loader2, Server, Clock, MapPin } from 'lucide-react';
import { timeAgo } from '../data/simulationData';

const StatusBadge = ({ status }) => {
  if (status === 'connected') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--success-bg)] text-[var(--success)] border border-[var(--success-border)]">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
        Connected
      </span>
    );
  }
  if (status === 'connecting') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--warning-bg)] text-[var(--warning)] border border-[var(--warning-border)]">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--warning)]" />
        Connecting
      </span>
    );
  }
  if (status === 'error') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--danger-bg)] text-[var(--danger)] border border-[var(--danger-border)]">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--danger)]" />
        Error
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
      <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]" />
      Disconnected
    </span>
  );
};

const SignalBar = ({ strength }) => {
  const bars = [25, 50, 75, 100];
  return (
    <div className="flex items-end gap-0.5 h-3.5" title={`Kekuatan Sinyal: ${strength}%`}>
      {bars.map((threshold, i) => (
        <div
          key={i}
          className={`w-1 rounded-xs transition-colors ${
            strength >= threshold
              ? strength > 70 ? 'bg-[var(--success)]' : strength > 40 ? 'bg-[var(--warning)]' : 'bg-[var(--danger)]'
              : 'bg-[var(--border-strong)]'
          }`}
          style={{ height: `${(i + 1) * 25}%` }}
        />
      ))}
    </div>
  );
};

const GatewayStatus = ({ gateways }) => {
  const connected = gateways.filter(g => g.status === 'connected').length;
  const total = gateways.length;

  return (
    <div className="card-container p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3.5">
        <div>
          <h2 className="section-title">
            <Server size={18} className="text-[var(--brand)]" />
            Status Gateway
          </h2>
          <p className="section-subtitle">
            Monitoring komunikasi 7 perangkat Gateway di perusahaan
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
          <span className="text-sm font-bold text-[var(--text-primary)] font-mono">{connected}</span>
          <span className="text-xs font-medium text-[var(--text-muted)]">/ {total} online</span>
        </div>
      </div>

      {/* Progress Bar: Track is border-subtle (not black), Fill is success */}
      <div className="w-full h-2 rounded-full bg-[var(--border-subtle)] mb-4 overflow-hidden">
        <div
          className="h-full rounded-full bg-[var(--success)] transition-all duration-300"
          style={{ width: `${(connected / total) * 100}%` }}
        />
      </div>

      {/* Gateway list: items with bg-subtle & border-subtle */}
      <div className="space-y-2.5">
        {gateways.map(gw => (
          <div
            key={gw.id}
            className="p-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] transition-all"
          >
            {/* Row 1: Chip GW-01, Name, Status Badge */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-[var(--brand-bg)] text-[var(--brand)] border border-[var(--brand-border)] flex-shrink-0">
                  {gw.id}
                </span>
                <span className="text-sm font-bold text-[var(--text-primary)] truncate">
                  {gw.name}
                </span>
              </div>
              <StatusBadge status={gw.status} />
            </div>

            {/* Row 2: IP address (mono text-primary), Location & 4d lalu (text-muted), Signal */}
            <div className="flex items-center justify-between text-xs gap-2 pt-2 border-t border-[var(--border-subtle)]">
              <div className="flex items-center gap-2 truncate">
                <span className="font-mono font-medium text-[var(--text-primary)]">
                  {gw.ip}
                </span>
                <span className="text-[var(--border-strong)]">•</span>
                <span className="truncate flex items-center gap-1 text-[var(--text-muted)]">
                  <MapPin size={11} className="text-[var(--text-muted)] flex-shrink-0" />
                  {gw.location}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {gw.status === 'connected' && (
                  <SignalBar strength={gw.signalStrength} />
                )}
                <span className="text-xs font-mono text-[var(--text-muted)] flex items-center gap-1">
                  <Clock size={11} />
                  {timeAgo(gw.lastSeen)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GatewayStatus;
