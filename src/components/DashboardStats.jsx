import React from 'react';
import {
  CreditCard,
  Users,
  Wifi,
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
} from 'lucide-react';

const StatCard = ({
  icon: Icon,
  label,
  value,
  sub,
  badgeType,
  badgeText,
  accentColor = '#6366F1',
  onClick,
}) => (
  <div
    onClick={onClick}
    className={`stat-card group relative overflow-hidden ${
      onClick ? 'cursor-pointer hover:border-[var(--brand)]' : ''
    }`}
  >
    {/* Clean, razor-sharp top accent stripe (strictly contained, no color bleed) */}
    <div
      className="absolute left-0 right-0 top-0 h-[3px]"
      style={{ backgroundColor: accentColor }}
    />

    {/* Card Top: Icon Container & Status Badge */}
    <div className="mb-3.5 flex items-center justify-between">
      <div
        className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border transition-transform duration-200 group-hover:scale-105"
        style={{
          backgroundColor: `${accentColor}14`,
          borderColor: `${accentColor}28`,
          color: accentColor,
        }}
      >
        <Icon size={20} strokeWidth={2.2} />
      </div>

      {badgeText && (
        <div
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors"
          style={{
            backgroundColor: `${accentColor}12`,
            borderColor: `${accentColor}30`,
            color: accentColor,
            borderWidth: '1px',
          }}
        >
          {badgeType === 'info' && (
            <span className="relative flex h-2 w-2">
              <span
                className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                style={{ backgroundColor: accentColor }}
              />
              <span
                className="relative inline-flex h-2 w-2 rounded-full"
                style={{ backgroundColor: accentColor }}
              />
            </span>
          )}
          {badgeType === 'success' && <TrendingUp size={12} strokeWidth={2.5} />}
          {badgeType === 'warning' && <AlertTriangle size={12} strokeWidth={2.5} />}
          {badgeType === 'danger' && <TrendingDown size={12} strokeWidth={2.5} />}
          <span>{badgeText}</span>
        </div>
      )}
    </div>

    {/* Big Number & Navigation Cue */}
    <div className="mb-1 flex items-baseline justify-between">
      <div className="text-[32px] font-black leading-none tracking-tight text-[var(--text-primary)] tabular-nums">
        {value}
      </div>
      {onClick && (
        <span
          className="flex translate-x-1 items-center gap-0.5 text-[11px] font-bold opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
          style={{ color: accentColor }}
        >
          Lihat &rarr;
        </span>
      )}
    </div>

    {/* Title & Context Description */}
    <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] transition-colors group-hover:text-[var(--text-primary)]">
      {label}
    </div>
    {sub && (
      <div className="mt-1 truncate text-xs font-medium text-[var(--text-secondary)]">
        {sub}
      </div>
    )}
  </div>
);

const DashboardStats = ({
  activeDetections,
  totalRegistered,
  connectedGateways,
  totalGateways,
  totalDetectionsToday,
  warningGateways = 0,
  offlineGateways = 0,
  onNavigate,
}) => {
  const stats = [
    {
      id: 'active',
      icon: CreditCard,
      label: 'Kartu Terdeteksi',
      value: activeDetections,
      sub: 'Saat ini aktif dalam jangkauan',
      badgeType: 'info',
      badgeText: 'Live Area',
      accentColor: '#6366F1', // Indigo Brand
      onClick: onNavigate ? () => onNavigate('cards') : null,
    },
    {
      id: 'registered',
      icon: Users,
      label: 'Total Kartu Terdaftar',
      value: totalRegistered,
      sub: 'Klik untuk kelola & registrasi',
      badgeType: 'success',
      badgeText: 'Database',
      accentColor: '#10B981', // Emerald Success
      onClick: onNavigate ? () => onNavigate('registered-cards') : null,
    },
    {
      id: 'gateways',
      icon: Wifi,
      label: 'Gateway Terhubung',
      value: `${connectedGateways}/${totalGateways}`,
      sub:
        offlineGateways > 0 && warningGateways > 0
          ? `${warningGateways} warning, ${offlineGateways} offline`
          : offlineGateways > 0
          ? `${offlineGateways} perangkat offline`
          : warningGateways > 0
          ? `${warningGateways} perangkat warning`
          : 'Seluruh perangkat online',
      badgeType: offlineGateways > 0 ? 'danger' : warningGateways > 0 ? 'warning' : 'success',
      badgeText:
        offlineGateways > 0
          ? `${offlineGateways} offline`
          : warningGateways > 0
          ? `${warningGateways} warning`
          : 'Normal',
      accentColor:
        offlineGateways > 0
          ? '#EF4444' // Rose Danger
          : warningGateways > 0
          ? '#F59E0B' // Amber Warning
          : '#10B981', // Emerald Success
      onClick: onNavigate ? () => onNavigate('config') : null,
    },
    {
      id: 'activity',
      icon: Activity,
      label: 'Total Aktivitas Deteksi',
      value: totalDetectionsToday,
      sub: 'Log pembacaan sensor hari ini',
      badgeType: 'success',
      badgeText: 'Hari ini',
      accentColor: '#0EA5E9', // Sky Cyan
      onClick: onNavigate ? () => onNavigate('history') : null,
    },
  ];

  return (
    <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <StatCard key={stat.id} {...stat} />
      ))}
    </div>
  );
};

export default DashboardStats;
