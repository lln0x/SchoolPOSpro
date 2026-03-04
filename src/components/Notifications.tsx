import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Info, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import { Notification } from '../types';
import { cn } from '../lib/utils';

interface NotificationProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}

export const Notifications: React.FC<NotificationProps> = ({ notifications, onDismiss }) => {
  const activeNotifications = notifications.filter(n => !n.toastDismissed);
  
  return (
    <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3 w-80 pointer-events-none">
      <AnimatePresence>
        {activeNotifications.map((notif) => (
          <NotificationItem key={notif.id} notification={notif} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
};

const NotificationItem: React.FC<{ notification: Notification; onDismiss: (id: string) => void }> = ({ 
  notification, 
  onDismiss 
}) => {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(notification.id), 5000);
    return () => clearTimeout(timer);
  }, [notification.id, onDismiss]);

  const icons = {
    info: <Info className="text-blue-500" size={20} />,
    success: <CheckCircle className="text-emerald-500" size={20} />,
    warning: <AlertTriangle className="text-amber-500" size={20} />,
    error: <AlertCircle className="text-rose-500" size={20} />,
  };

  const bgColors = {
    info: 'bg-blue-50 border-blue-100',
    success: 'bg-emerald-50 border-emerald-100',
    warning: 'bg-amber-50 border-amber-100',
    error: 'bg-rose-50 border-rose-100',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className={cn(
        "pointer-events-auto p-4 rounded-2xl border shadow-lg flex gap-3 items-start relative overflow-hidden",
        bgColors[notification.type]
      )}
    >
      <div className="shrink-0 mt-0.5">{icons[notification.type]}</div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-bold text-app-main truncate">{notification.title}</h4>
        <p className="text-xs text-app-muted mt-1 line-clamp-2">{notification.message}</p>
      </div>
      <button 
        onClick={() => onDismiss(notification.id)}
        className="shrink-0 text-app-muted hover:text-app-main transition-colors"
      >
        <X size={16} />
      </button>
      <motion.div 
        initial={{ width: '100%' }}
        animate={{ width: 0 }}
        transition={{ duration: 5, ease: 'linear' }}
        className={cn(
          "absolute bottom-0 left-0 h-1 opacity-30",
          notification.type === 'success' ? 'bg-emerald-500' :
          notification.type === 'error' ? 'bg-rose-500' :
          notification.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
        )}
      />
    </motion.div>
  );
};
