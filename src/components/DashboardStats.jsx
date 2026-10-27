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

const AreaSparkline = ({ color, id }) => (
  <svg className="w-20 h-9 overflow-visible" viewBox="0 0 70 28" fill="none">
    <defs>
      <linearGradient id={`spark-grad-${id}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity="0.25" />
        <stop offset="100%" stopColor={color} stopOpacity="0.0" />
      </linearGradient>
    </defs>
    {/* Gradient fill under curve */}
    <path
      d="M2 24 L 2 16 Q 16 6, 28 14 T 50 8 T 68 12 L 68 26 L 2 26 Z"
      fill={`url(#spark-grad-${id})`}
    />
    {/* Line stroke with high clarity */}
    <path
      d="M2 16 Q 16 6, 28 14 T 50 8 T 68 12"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.15))' }}
    />
  </svg>
);

const StatCard = ({ icon: Icon, label, value, sub, badgeType, badgeText, sparkColor, id, onClick }) => (
  <div
    onClick={onClick}
    className={`stat-card group ${onClick ? 'cursor-pointer hover:border-[var(--brand)] transition-all' : ''}`}
  >
    {/* Card Top: 44px Icon Box & Status Pill */}
    <div className="flex items-center justify-between mb-3.5">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-[var(--brand-bg)] text-[var(--brand)] border border-[var(--brand-border)] shadow-xs group-hover:scale-105 transition-transform">
        <Icon size={22} />
      </div>

      {badgeType === 'info' && (
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[var(--info-bg)] text-[var(--info)] border border-[var(--info-border)] shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--info)] animate-pulse" />
          <span>{badgeText}</span>
        </div>
      )}

      {badgeType === 'success' && (
        <div className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[var(--success-bg)] text-[var(--success)] border border-[var(--success-border)] shadow-xs">
          <TrendingUp size={12} strokeWidth={2.5} />
          <span>{badgeText}</span>
        </div>
      )}

      {badgeType === 'warning' && (
        <div className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[var(--warning-bg)] text-[var(--warning)] border border-[var(--warning-border)] shadow-xs">
          <AlertTriangle size={12} strokeWidth={2.5} />
          <span>{badgeText}</span>
        </div>
      )}

      {badgeType === 'danger' && (
        <div className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[var(--danger-bg)] text-[var(--danger)] border border-[var(--danger-border)] shadow-xs">
          <TrendingDown size={12} strokeWidth={2.5} />
          <span>{badgeText}</span>
        </div>
      )}
    </div>

    {/* Big Number & Sparkline with subtle area fill */}
    <div className="flex items-end justify-between mb-1.5">
      <div className="text-[32px] leading-tight font-extrabold text-[var(--text-primary)] tabular-nums tracking-tight">
        {value}
      </div>
      <AreaSparkline color={sparkColor} id={id} />
    </div>

    {/* Title & Description */}
    <div className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--brand)] transition-colors">{label}</div>
    {sub && <div className="text-xs text-[var(--text-muted)] mt-0.5 font-medium">{sub}</div>}
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
  const hasIssues = offlineGateways > 0 || warningGateways > 0;

  const stats = [
    {
      id: 'active',
      icon: CreditCard,
      label: 'Kartu Terdeteksi',
      value: activeDetections,
      sub: 'Saat ini aktif dalam jangkauan',
      badgeType: 'info',
      badgeText: 'Live Area',
      sparkColor: 'var(--brand)',
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
      sparkColor: 'var(--success)',
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
      sparkColor:
        offlineGateways > 0
          ? 'var(--danger)'
          : warningGateways > 0
          ? 'var(--warning)'
          : 'var(--success)',
    },
    {
      id: 'activity',
      icon: Activity,
      label: 'Total Aktivitas Deteksi',
      value: totalDetectionsToday,
      sub: 'Log pembacaan sensor hari ini',
      badgeType: 'success',
      badgeText: '+12% vs kemarin',
      sparkColor: 'var(--success)',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
      {stats.map((stat) => (
        <StatCard key={stat.id} {...stat} />
      ))}
    </div>
  );
};

export default DashboardStats;
