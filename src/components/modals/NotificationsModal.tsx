import React from 'react';
import { X, CheckCircle, Bell } from 'lucide-react';
import { NotificationItem } from '../../types';

interface NotificationsModalProps {
  notifications: NotificationItem[];
  onClose: () => void;
  onMarkAllRead: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  notifications,
  onClose,
  onMarkAllRead,
}) => {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-[#080B10] border border-[#20242C] rounded-t-3xl sm:rounded-3xl shadow-2xl p-4 overflow-hidden max-h-[80vh] flex flex-col"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#20242C]">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-[#3B82FF]" />
            <h3 className="text-sm font-bold text-white">Notifications</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onMarkAllRead}
              className="text-[11px] text-[#3B82FF] hover:underline"
            >
              Mark all read
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#9298A3] hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-3 rounded-xl border transition-colors flex items-start gap-3 ${
                notif.read
                  ? 'bg-[#080B10] border-[#20242C]'
                  : 'bg-[#101010] border-[#2166FF]/30'
              }`}
            >
              <img
                src={notif.user.avatar}
                alt={notif.user.name}
                className="w-8 h-8 rounded-full object-cover border border-[#20242C] shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white/90">
                  <span className="font-semibold text-white">{notif.user.username}</span>{' '}
                  {notif.action}
                </p>
                <p className="text-[11px] text-[#9298A3] truncate mt-0.5">
                  {notif.target}
                </p>
                <span className="text-[10px] text-[#9298A3] mt-1 block">
                  {notif.time}
                </span>
              </div>
            </div>
          ))}

          {notifications.length === 0 && (
            <div className="py-12 text-center text-xs text-[#9298A3]">
              <CheckCircle size={28} className="mx-auto text-emerald-400 mb-2 opacity-70" />
              You're all caught up!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
