import React from 'react';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const STYLES = {
  success: {
    border: 'border-[var(--success-border)]',
    bg: 'bg-[var(--bg-surface)]',
    icon: 'text-[var(--success)]',
    bar: 'bg-[var(--success)]',
  },
  error: {
    border: 'border-[var(--danger-border)]',
    bg: 'bg-[var(--bg-surface)]',
    icon: 'text-[var(--danger)]',
    bar: 'bg-[var(--danger)]',
  },
  warning: {
    border: 'border-[var(--warning-border)]',
    bg: 'bg-[var(--bg-surface)]',
    icon: 'text-[var(--warning)]',
    bar: 'bg-[var(--warning)]',
  },
  info: {
    border: 'border-[var(--brand-border)]',
    bg: 'bg-[var(--bg-surface)]',
    icon: 'text-[var(--brand)]',
    bar: 'bg-[var(--brand)]',
  },
};

const NotificationToast = ({ notifications, onRemove }) => {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-3">
      {notifications.map((notif, idx) => {
        const Icon = ICONS[notif.type] || Info;
        const style = STYLES[notif.type] || STYLES.info;
        return (
          <div
            key={notif.id}
            className={`notif-enter pointer-events-auto rounded-xl border ${style.border} ${style.bg} shadow-lg overflow-hidden`}
            style={{
              animationDelay: `${idx * 40}ms`,
            }}
          >
            {/* Color indicator bar */}
            <div className={`h-1 ${style.bar} w-full`} />
            <div className="flex items-start gap-3 p-3.5">
              <Icon size={18} className={`${style.icon} flex-shrink-0 mt-0.5`} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-[var(--text-primary)] truncate">
                  {notif.title}
                </div>
                <div className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-2 leading-relaxed">
                  {notif.message}
                </div>
                <div className="text-[10px] text-[var(--text-muted)] mt-1 font-mono">
                  {notif.timestamp.toLocaleTimeString('id-ID')}
                </div>
              </div>
              <button
                onClick={() => onRemove(notif.id)}
                className="flex-shrink-0 p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                title="Tutup notifikasi"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default NotificationToast;
