import React from 'react';
import { Bell, CheckCircle2, AlertCircle, Clock, ShieldAlert, X, ExternalLink } from 'lucide-react';
import { NotificationItem } from '../types';
import { glassModal } from '../lib/styles';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onSelectNotification: (item: NotificationItem) => void;
  onMarkAllRead: () => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  isOpen,
  onClose,
  notifications,
  onSelectNotification,
  onMarkAllRead,
}) => {
  if (!isOpen) return null;

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'approval':
        return <ShieldAlert className="w-4 h-4 text-emerald-400" />;
      case 'resolved':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'waiting':
        return <Clock className="w-4 h-4 text-amber-400" />;
      case 'issue':
        return <AlertCircle className="w-4 h-4 text-rose-400" />;
      default:
        return <Bell className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 md:p-6 bg-black/40 backdrop-blur-sm">
      <div
        id="notification-panel"
        className={`w-full max-w-md max-h-[85vh] flex flex-col rounded-2xl ${glassModal} overflow-hidden shadow-2xl border border-emerald-500/20 animate-in fade-in slide-in-from-right-4 duration-200`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white tracking-wide">Notifications</h3>
            {notifications.filter((n) => !n.read).length > 0 && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {notifications.filter((n) => !n.read).length} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onMarkAllRead}
              className="text-xs text-gray-400 hover:text-emerald-300 transition-colors"
            >
              Mark all read
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">
              <CheckCircle2 className="w-8 h-8 text-emerald-500/40 mx-auto mb-2" />
              All caught up. Naviq is monitoring in the background.
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectNotification(item)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                  item.read
                    ? 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04] text-gray-300'
                    : 'bg-emerald-950/30 border-emerald-500/30 hover:bg-emerald-950/40 text-white shadow-[0_0_15px_rgba(16,185,129,0.08)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getIcon(item.type)}
                    <span className="text-xs font-semibold text-gray-100">{item.title}</span>
                  </div>
                  <span className="text-[11px] text-gray-400">{item.time}</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed pl-6">{item.message}</p>
                {item.actionLabel && (
                  <div className="mt-1 pl-6 flex items-center gap-1 text-[11px] font-medium text-emerald-400 hover:text-emerald-300">
                    <span>{item.actionLabel}</span>
                    <ExternalLink className="w-3 h-3" />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
