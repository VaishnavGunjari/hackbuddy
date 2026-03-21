import { useState, useEffect } from 'react';
import { adminApi, type Message, type UserProfile } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, ShieldOff, ShieldCheck, Trash2, Loader2, Users } from 'lucide-react';
import Sidebar from '../components/Sidebar';

export default function AdminPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'messages' | 'users'>('messages');
  const [flaggedMessages, setFlaggedMessages] = useState<Message[]>([]);
  const [warnedUsers, setWarnedUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== 'admin') { navigate('/dashboard'); return; }
    loadData();
  }, [user, tab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (tab === 'messages') {
        const data = await adminApi.getFlaggedMessages();
        setFlaggedMessages(data);
      } else {
        const data = await adminApi.getUsersWithWarnings();
        setWarnedUsers(data as UserProfile[]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    setActionLoading(msgId);
    try {
      await adminApi.deleteMessage(msgId);
      setFlaggedMessages((prev) => prev.filter((m) => m.id !== msgId));
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspend = async (userId: string) => {
    setActionLoading(userId);
    try {
      await adminApi.suspendUser(userId, 'Admin manual action');
      loadData();
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnsuspend = async (userId: string) => {
    setActionLoading(userId);
    try {
      await adminApi.unsuspendUser(userId);
      loadData();
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-black text-white">
      <Sidebar />
      <main className="md:ml-64 flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">Admin Panel</h1>
          <p className="text-zinc-400 text-sm mt-1">Monitor and moderate community activity</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-zinc-900 rounded-xl p-1 gap-1 w-fit mb-6">
          {(['messages', 'users'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-red-600 text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              {t === 'messages' ? '🚩 Flagged Messages' : '⚠️ Warned Users'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-red-400" /></div>
        ) : tab === 'messages' ? (
          <div className="space-y-3">
            {flaggedMessages.length === 0 ? (
              <div className="text-center py-20 text-zinc-600">
                <ShieldCheck className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No flagged messages. Community is clean! 🎉</p>
              </div>
            ) : flaggedMessages.map((msg, i) => (
              <motion.div key={msg.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                className="bg-zinc-900/80 border border-red-500/20 rounded-xl p-4 flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-zinc-200">{msg.sender_name || 'Unknown User'}</p>
                    <p className="text-zinc-400 text-sm mt-0.5 break-words">{msg.content}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-lg">{msg.flag_reason || 'flagged'}</span>
                      <span className="text-xs text-zinc-600">{msg.created_at ? new Date(msg.created_at).toLocaleString() : ''}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteMessage(msg.id)}
                  disabled={actionLoading === msg.id}
                  className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/10 transition-colors shrink-0"
                  title="Delete message"
                >
                  {actionLoading === msg.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </button>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {warnedUsers.length === 0 ? (
              <div className="text-center py-20 text-zinc-600">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No users with warnings.</p>
              </div>
            ) : warnedUsers.map((u, i) => (
              <motion.div key={u.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                className={`bg-zinc-900/80 border rounded-xl p-4 flex items-center justify-between gap-4 ${u.is_suspended ? 'border-red-500/30' : 'border-orange-500/20'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center font-bold text-sm">
                    {u.full_name[0]}
                  </div>
                  <div>
                    <p className="font-semibold">{u.full_name}</p>
                    <p className="text-xs text-zinc-500">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-xl font-bold text-orange-400">{u.warning_count}</p>
                    <p className="text-xs text-zinc-500">warnings</p>
                  </div>
                  {u.is_suspended ? (
                    <span className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-lg font-medium">SUSPENDED</span>
                  ) : null}
                  <div className="flex gap-2">
                    {!u.is_suspended ? (
                      <button
                        onClick={() => handleSuspend(u.id)}
                        disabled={actionLoading === u.id}
                        className="text-xs px-3 py-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center gap-1"
                      >
                        {actionLoading === u.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShieldOff className="h-3 w-3" />}
                        Suspend
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUnsuspend(u.id)}
                        disabled={actionLoading === u.id}
                        className="text-xs px-3 py-1.5 bg-green-600/80 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center gap-1"
                      >
                        {actionLoading === u.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShieldCheck className="h-3 w-3" />}
                        Unsuspend
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
