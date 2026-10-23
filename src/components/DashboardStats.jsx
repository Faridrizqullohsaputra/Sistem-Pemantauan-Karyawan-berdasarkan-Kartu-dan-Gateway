import React from 'react';
import {
  CreditCard,
  Users,
  Wifi,
  Activity,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

const AreaSparkline = ({ color, id }) => (
  <svg className="w-20 h-9 overflow-visible" viewBox="0 0 70 28" fill="none">
    <defs>
      <linearGradient id={`spark-grad-${id}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity="0.12" />
        <stop offset="100%" stopColor={color} stopOpacity="0.0" />
      </linearGradient>
    </defs>
    {/* Gradient fill under curve */}
    <path
      d="M2 24 L 2 16 Q 16 6, 28 14 T 50 8 T 68 12 L 68 26 L 2 26 Z"
      fill={`url(#spark-grad-${id})`}
    />
    {/* Line stroke */}
    <path
      d="M2 16 Q 16 6, 28 14 T 50 8 T 68 12"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const StatCard = ({ icon: Icon, label, value, sub, badgeType, badgeText, sparkColor, id }) => (
  <div className="stat-card group">
    {/* Card Top: 44px Icon Box (all in brand-bg + brand) & Status Pill */}
    <div className="flex items-center justify-between mb-3.5">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-[var(--brand-bg)] text-[var(--brand)]">
        <Icon size={22} />
      </div>

      {badgeType === 'info' && (
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[var(--info-bg)] text-[var(--info)] border border-[var(--info-border)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--info)] animate-pulse" />
          <span>{badgeText}</span>
        </div>
      )}

      {badgeType === 'success' && (
        <div className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[var(--success-bg)] text-[var(--success)] border border-[var(--success-border)]">
          <TrendingUp size={12} strokeWidth={2.5} />
          <span>{badgeText}</span>
        </div>
      )}

      {badgeType === 'danger' && (
        <div className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[var(--danger-bg)] text-[var(--danger)] border border-[var(--danger-border)]">
          <TrendingDown size={12} strokeWidth={2.5} />
          <span>{badgeText}</span>
        </div>
      )}
    </div>

    {/* Big Number & Sparkline with subtle area fill */}
    <div className="flex items-end justify-between mb-1.5">
      <div className="text-[32px] leading-tight font-bold text-[var(--text-primary)] tabular-nums">
        {value}
      </div>
      <AreaSparkline color={sparkColor} id={id} />
    </div>

    {/* Title & Description */}
    <div className="text-sm font-semibold text-[var(--text-primary)]">{label}</div>
    {sub && <div className="text-xs text-[var(--text-secondary)] mt-0.5">{sub}</div>}
  </div>
);

const DashboardStats = ({ activeDetections, totalRegistered, connectedGateways, totalGateways, totalDetectionsToday }) => {
  const offlineCount = totalGateways - connectedGateways;

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
    },
    {
      id: 'registered',
      icon: Users,
      label: 'Total Kartu Terdaftar',
      value: totalRegistered,
      sub: 'Karyawan & pengunjung terdata',
      badgeType: 'success',
      badgeText: '+2 bulan ini',
      sparkColor: 'var(--success)',
    },
    {
      id: 'gateways',
      icon: Wifi,
      label: 'Gateway Terhubung',
      value: `${connectedGateways}/${totalGateways}`,
      sub: offlineCount > 0 ? `${offlineCount} perangkat offline` : 'Seluruh perangkat online',
      badgeType: offlineCount > 0 ? 'danger' : 'success',
      badgeText: offlineCount > 0 ? `${offlineCount} offline` : 'Normal',
      sparkColor: offlineCount > 0 ? 'var(--danger)' : 'var(--success)',
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
