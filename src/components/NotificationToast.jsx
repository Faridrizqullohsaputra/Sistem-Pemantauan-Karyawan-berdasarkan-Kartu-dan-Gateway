import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ICONS = {
  success: CheckCircle,
  error:   AlertCircle,
  warning: AlertTriangle,
  info:    Info,
};

const STYLES = {
  success: { border: 'border-[var(--success-border)]', accent: 'bg-[var(--success)]', icon: 'text-[var(--success)]' },
  error:   { border: 'border-[var(--danger-border)]',  accent: 'bg-[var(--danger)]',  icon: 'text-[var(--danger)]'  },
  warning: { border: 'border-[var(--warning-border)]', accent: 'bg-[var(--warning)]', icon: 'text-[var(--warning)]' },
  info:    { border: 'border-[var(--brand-border)]',   accent: 'bg-[var(--brand)]',   icon: 'text-[var(--brand)]'   },
};

/* Individual toast with enter animation */
const Toast = ({ notif, onRemove }) => {
  const [visible, setVisible] = useState(false);
  const Icon = ICONS[notif.type] || Info;
  const style = STYLES[notif.type] || STYLES.info;

  useEffect(() => {
    // Trigger animation on mount
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={`pointer-events-auto rounded-2xl border ${style.border}
        bg-[var(--bg-surface)]/95 dark:bg-[#1E293B]/95
        backdrop-blur-xl shadow-xl shadow-black/15 dark:shadow-black/50
        overflow-hidden transition-all duration-300 ease-out
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
    >
      {/* Top accent bar */}
      <div className={`h-[3px] w-full ${style.accent}`} />

      <div className="flex items-start gap-3 px-4 py-3">
        <Icon size={17} className={`${style.icon} flex-shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-[var(--text-primary)] leading-snug">
            {notif.title}
          </div>
          <div className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-2 leading-relaxed">
            {notif.message}
          </div>
          <div className="text-[10px] text-[var(--text-muted)] mt-1.5 font-mono">
            {notif.timestamp.toLocaleTimeString('id-ID')}
          </div>
        </div>
        <button
          onClick={() => onRemove(notif.id)}
          className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all"
          title="Tutup notifikasi"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
};

const NotificationToast = ({ notifications, onRemove }) => {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 w-80 pointer-events-none">
      {notifications.map(notif => (
        <Toast key={notif.id} notif={notif} onRemove={onRemove} />
      ))}
    </div>
  );
};

export default NotificationToast;
