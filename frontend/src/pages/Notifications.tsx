import { useState, useEffect } from 'react';
import { notificationsApi, type Notification } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Users, ShieldAlert, Loader2 } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await notificationsApi.list();
      setNotifications(data);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const handleNotificationClick = (notif: Notification) => {
    if (!notif.is_read) {
      markAsRead(notif.id);
    }
    // Navigate where relevant
    if (notif.related_id) {
        if (notif.type.includes('request')) {
            navigate(`/team/${notif.related_id}`);
        }
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'join_request': return <Users className="h-5 w-5 text-blue-400" />;
      case 'request_accepted': return <Check className="h-5 w-5 text-emerald-400" />;
      case 'request_rejected': return <ShieldAlert className="h-5 w-5 text-red-400" />;
      default: return <Bell className="h-5 w-5 text-purple-400" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="flex min-h-screen bg-black text-white">
      <Sidebar />
      <main className="md:ml-64 flex-1 p-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Bell className="h-8 w-8 text-purple-500" /> Notifications
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-sm py-1 px-3 rounded-full font-semibold">
                  {unreadCount} new
                </span>
              )}
            </h1>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg transition-colors text-sm"
              >
                Mark all as read
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-20 bg-zinc-900/50 rounded-2xl border border-white/5">
              <Bell className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-400 font-medium">You're all caught up!</p>
              <p className="text-sm text-zinc-600 mt-1">No notifications right now.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {notifications.map((notif) => (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer flex gap-4 ${
                      notif.is_read
                        ? 'bg-zinc-900/40 border-white/5 hover:bg-zinc-900/80'
                        : 'bg-zinc-800/80 border-purple-500/30 shadow-lg shadow-purple-500/5 hover:bg-zinc-800'
                    }`}
                  >
                    <div className={`mt-1 h-10 w-10 shrink-0 rounded-full flex items-center justify-center ${
                        notif.is_read ? 'bg-black/50' : 'bg-black shadow-inner shadow-black/50'
                    }`}>
                      {getIconForType(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-base ${notif.is_read ? 'text-zinc-300' : 'text-white font-medium'}`}>
                        {notif.content}
                      </p>
                      <p className="text-xs text-zinc-500 mt-1.5 flex items-center gap-1.5">
                         {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                         {!notif.is_read && <span className="w-1.5 h-1.5 bg-purple-500 rounded-full inline-block" />}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
