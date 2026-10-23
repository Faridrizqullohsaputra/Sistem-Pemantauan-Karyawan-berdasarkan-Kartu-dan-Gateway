import React from 'react';
import { CreditCard, Clock, Wifi, MapPin, Building2, Hash, UserCheck } from 'lucide-react';
import { getCardHolder, getGateway, formatTime, timeAgo } from '../data/simulationData';

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

const DetectionCard = ({ detection }) => {
  const holder = getCardHolder(detection.cardId);
  const gw = getGateway(detection.gatewayId);
  const avatarStyle = getAvatarStyle(detection.cardId);

  if (!holder || !gw) return null;

  return (
    <div className="card-container p-5 hover:border-[var(--border-strong)] transition-all">
      {/* Header */}
      <div className="flex items-start gap-3.5 mb-3.5">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 relative border ${avatarStyle.bg} ${avatarStyle.text} ${avatarStyle.border}`}
        >
          <span>{holder.avatarInitials}</span>
          {holder.cardType === 'visitor' && (
            <span
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--warning)] text-white flex items-center justify-center text-[10px] font-bold shadow-xs"
              title="Visitor / Pengunjung"
            >
              V
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-[var(--text-primary)] truncate">
              {holder.name}
            </span>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
              holder.cardType === 'visitor'
                ? 'bg-[var(--warning-bg)] text-[var(--warning)] border border-[var(--warning-border)]'
                : 'bg-[var(--brand-bg)] text-[var(--brand)] border border-[var(--brand-border)]'
            }`}>
              {holder.cardType === 'visitor' ? 'Pengunjung' : 'Karyawan'}
            </span>
          </div>
          <div className="text-xs font-mono font-semibold text-[var(--brand)] mt-0.5">
            {holder.cardId}
          </div>
        </div>

        {/* Live indicator */}
        <div className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--success-bg)] text-[var(--success)] border border-[var(--success-border)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
          <span className="text-xs font-bold">Terdeteksi</span>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-2 text-xs py-3 border-y border-[var(--border-subtle)]">
        <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
          <Hash size={13} className="text-[var(--text-muted)] flex-shrink-0" />
          <span className="font-mono font-semibold text-[var(--text-primary)]">{holder.employeeId}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
          <Building2 size={13} className="text-[var(--text-muted)] flex-shrink-0" />
          <span className="font-medium text-[var(--text-secondary)] truncate">{holder.department}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[var(--text-muted)] col-span-2">
          <Wifi size={13} className="text-[var(--brand)] flex-shrink-0" />
          <span className="font-bold text-[var(--text-primary)] truncate">{gw.name}</span>
          <span className="font-mono text-[var(--text-muted)] ml-auto flex-shrink-0 font-medium">{gw.ip}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[var(--text-muted)] col-span-2">
          <MapPin size={13} className="text-[var(--danger)] flex-shrink-0" />
          <span className="text-[var(--text-secondary)] truncate">{gw.location}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[var(--text-muted)] col-span-2">
          <Clock size={13} className="text-[var(--text-muted)] flex-shrink-0" />
          <span className="font-mono font-medium text-[var(--text-primary)]">{formatTime(detection.detectedAt)}</span>
          <span className="text-[var(--text-muted)] ml-1">({timeAgo(detection.detectedAt)})</span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-3 pt-1 flex items-center justify-between text-xs text-[var(--text-muted)]">
        <span className="font-medium">
          Status: <strong className={holder.status === 'active' ? 'text-[var(--success)]' : 'text-[var(--danger)]'}>
            {holder.status === 'active' ? 'Kartu Aktif' : 'Kartu Nonaktif'}
          </strong>
        </span>
        <span className="text-xs font-mono font-semibold text-[var(--text-muted)] px-2 py-0.5 rounded bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
          SIMULASI
        </span>
      </div>
    </div>
  );
};

const CardIdentity = ({ activeDetections }) => {
  if (activeDetections.length === 0) {
    return (
      <div className="card-container p-12 text-center">
        <UserCheck size={44} className="mx-auto mb-3 text-[var(--border-strong)]" />
        <div className="text-base font-bold text-[var(--text-primary)]">Tidak ada kartu terdeteksi</div>
        <div className="text-xs text-[var(--text-muted)] mt-1">
          Gunakan tombol <strong>Masuk</strong> pada bar atas untuk menambah kartu
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-title">
            <CreditCard size={18} className="text-[var(--brand)]" />
            Kartu Terdeteksi ({activeDetections.length} Kartu Aktif)
          </h2>
          <p className="section-subtitle">
            Daftar identitas yang berada dalam radius sensor Gateway kantor
          </p>
        </div>
        <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
          DATA SIMULASI
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {activeDetections.map(det => (
          <DetectionCard key={det.id} detection={det} />
        ))}
      </div>
    </div>
  );
};

export default CardIdentity;
