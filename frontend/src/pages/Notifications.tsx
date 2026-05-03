import { useState, useEffect, useCallback } from 'react';
import { notificationsApi, teamsApi, type Notification } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bell, Check, CheckCheck, Users, ShieldAlert, Heart,
    Sparkles, UserPlus, UserCheck, Loader2, RefreshCw,
    MessageSquare, Info, X
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import ProfileModal from '../components/ProfileModal';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import type { ReactElement } from 'react';

type FilterTab = 'all' | 'unread';

// Notification types where related_id = a user's profile ID
const USER_TYPES = new Set(['like', 'match', 'friend_request', 'friend_accepted']);

interface NotifMeta {
    icon: ReactElement;
    color: string;
    label: string;
    navigateTo?: (notif: Notification) => string | undefined;
    relatedIsUser: boolean;
}

function getNotifMeta(notif: Notification): NotifMeta {
    switch (notif.type) {
        case 'join_request':
            return {
                icon: <Users className="h-5 w-5 text-blue-400" />,
                color: 'bg-blue-500/10 ring-blue-500/20',
                label: 'Join Request',
                navigateTo: (n) => n.related_id ? `/team/${n.related_id}` : undefined,
                relatedIsUser: false,
            };
        case 'request_accepted':
            return {
                icon: <CheckCheck className="h-5 w-5 text-emerald-400" />,
                color: 'bg-emerald-500/10 ring-emerald-500/20',
                label: 'Accepted',
                navigateTo: () => '/teams',
                relatedIsUser: false,
            };
        case 'request_rejected':
            return {
                icon: <ShieldAlert className="h-5 w-5 text-red-400" />,
                color: 'bg-red-500/10 ring-red-500/20',
                label: 'Rejected',
                relatedIsUser: false,
            };
        case 'like':
            return {
                icon: <Heart className="h-5 w-5 text-pink-400 fill-current" />,
                color: 'bg-pink-500/10 ring-pink-500/20',
                label: 'Liked You',
                navigateTo: (n) => n.related_id ? `/matches?highlight=${n.related_id}` : '/matches',
                relatedIsUser: true,
            };
        case 'match':
            return {
                icon: <Sparkles className="h-5 w-5 text-yellow-400" />,
                color: 'bg-yellow-500/10 ring-yellow-500/20',
                label: 'New Match!',
                navigateTo: (n) => n.related_id ? `/chat?dm=${n.related_id}` : '/chat',
                relatedIsUser: true,
            };
        case 'friend_request':
            return {
                icon: <UserPlus className="h-5 w-5 text-orange-400" />,
                color: 'bg-orange-500/10 ring-orange-500/20',
                label: 'Friend Request',
                navigateTo: () => '/friends?tab=requests',
                relatedIsUser: true,
            };
        case 'friend_accepted':
            return {
                icon: <UserCheck className="h-5 w-5 text-green-400" />,
                color: 'bg-green-500/10 ring-green-500/20',
                label: 'Now Friends',
                navigateTo: () => '/friends',
                relatedIsUser: true,
            };
        case 'team_invite':
            return {
                icon: <Sparkles className="h-5 w-5 text-amber-400" />,
                color: 'bg-amber-500/10 ring-amber-500/20',
                label: 'Team Invite',
                navigateTo: (n) => n.related_id ? `/team/${n.related_id}` : '/teams',
                relatedIsUser: false,
            };
        case 'team_message':
            return {
                icon: <MessageSquare className="h-5 w-5 text-cyan-400" />,
                color: 'bg-cyan-500/10 ring-cyan-500/20',
                label: 'Team Chat',
                navigateTo: () => '/chat',
                relatedIsUser: false,
            };
        default:
            return {
                icon: <Info className="h-5 w-5 text-zinc-400" />,
                color: 'bg-zinc-800 ring-zinc-700',
                label: 'Info',
                relatedIsUser: false,
            };
    }
}

interface MiniProfile {
    id: string;
    full_name: string;
    email?: string;
}

export default function Notifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<FilterTab>('all');
    const [markingAll, setMarkingAll] = useState(false);
    const [profiles, setProfiles] = useState<Record<string, MiniProfile>>({});
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [acceptLoading, setAcceptLoading] = useState<string | null>(null);
    const navigate = useNavigate();

    const loadNotifications = useCallback(async () => {
        try {
            const data = await notificationsApi.list();
            setNotifications(data);
            // Collect unique user IDs to fetch profiles for
            fetchProfilesFor(data);
        } catch (err) {
            console.error('Failed to load notifications:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchProfilesFor = async (notifs: Notification[]) => {
        const ids = [...new Set(
            notifs
                .filter((n) => USER_TYPES.has(n.type) && n.related_id)
                .map((n) => n.related_id as string)
        )];
        if (ids.length === 0) return;

        const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const token = localStorage.getItem('hackbuddy_token');

        const results = await Promise.allSettled(
            ids.map((id) =>
                fetch(`${BASE}/users/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                }).then((r) => r.ok ? r.json() : null)
            )
        );

        const map: Record<string, MiniProfile> = {};
        results.forEach((res, i) => {
            if (res.status === 'fulfilled' && res.value) {
                map[ids[i]] = res.value;
            }
        });
        setProfiles((prev) => ({ ...prev, ...map }));
    };

    useEffect(() => {
        loadNotifications();
        const interval = setInterval(loadNotifications, 30_000);
        return () => clearInterval(interval);
    }, [loadNotifications]);

    const markAsRead = async (id: string) => {
        try {
            await notificationsApi.markAsRead(id);
            setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
        } catch (err) {
            console.error(err);
        }
    };

    const handleAcceptInvite = async (e: React.MouseEvent, notif: Notification) => {
        e.stopPropagation();
        if (!notif.related_id) return;
        setAcceptLoading(notif.id);
        try {
            await teamsApi.acceptInvite(notif.related_id);
            setNotifications((prev) => prev.map((n) => n.id === notif.id ? { ...n, is_read: true } : n));
            alert('You have successfully joined the team!');
            navigate(`/team/${notif.related_id}`);
        } catch (err: any) {
            alert(err?.response?.data?.detail || err.message || 'Failed to accept the invite.');
        } finally {
            setAcceptLoading(null);
        }
    };

    const markAllAsRead = async () => {
        setMarkingAll(true);
        try {
            await notificationsApi.markAllAsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        } catch (err) {
            console.error(err);
        } finally {
            setMarkingAll(false);
        }
    };

    const handleClick = (notif: Notification) => {
        // Don't auto-read actionable notifications so their state is properly handled on target pages
        if (!notif.is_read && notif.type !== 'team_invite' && notif.type !== 'friend_request') {
            markAsRead(notif.id);
        }
        const meta = getNotifMeta(notif);
        if (meta.navigateTo) {
            const dest = meta.navigateTo(notif);
            if (dest) navigate(dest);
        }
    };

    const displayed = tab === 'unread'
        ? notifications.filter((n) => !n.is_read)
        : notifications;

    const unreadCount = notifications.filter((n) => !n.is_read).length;

    return (
        <div className="flex min-h-screen bg-black text-white">
            <Sidebar />
            <ProfileModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} />

            <main className="md:ml-64 flex-1 p-6 md:p-10">
                <div className="max-w-2xl mx-auto">

                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center relative">
                                <Bell className="h-5 w-5 text-orange-500" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1">
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">Notifications</h1>
                                <p className="text-zinc-500 text-sm">
                                    {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={loadNotifications}
                                className="h-9 w-9 flex items-center justify-center rounded-xl border border-white/10 bg-[#111] text-zinc-500 hover:text-white hover:border-white/20 transition-colors"
                                title="Refresh"
                            >
                                <RefreshCw className="h-4 w-4" />
                            </button>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    disabled={markingAll}
                                    className="flex items-center gap-2 px-4 py-2 bg-[#111] hover:bg-[#161616] border border-white/10 hover:border-white/20 text-white font-medium rounded-xl transition-colors text-sm disabled:opacity-60"
                                >
                                    {markingAll
                                        ? <Loader2 className="h-4 w-4 animate-spin" />
                                        : <CheckCheck className="h-4 w-4 text-orange-500" />}
                                    Mark all read
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex bg-[#111111] p-1.5 rounded-full border border-white/5 w-fit mb-6 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
                        {(['all', 'unread'] as FilterTab[]).map((t) => (
                            <button
                                key={t}
                                onClick={() => setTab(t)}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-black transition-all uppercase tracking-wider
                                    ${tab === t ? 'bg-orange-500 text-white shadow-[0_5px_15px_rgba(255,107,0,0.3)]' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
                            >
                                {t === 'unread' && unreadCount > 0 && (
                                    <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">
                                        {unreadCount}
                                    </span>
                                )}
                                {t === 'all' ? 'All' : 'Unread'}
                            </button>
                        ))}
                    </div>

                    {/* List */}
                    {loading ? (
                        <div className="flex justify-center py-24">
                            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                        </div>
                    ) : displayed.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center py-24 bg-[#0a0a0a] rounded-2xl border border-white/5"
                        >
                            <Bell className="h-14 w-14 text-zinc-700 mx-auto mb-4" />
                            <p className="text-zinc-300 font-semibold text-lg">
                                {tab === 'unread' ? 'No unread notifications' : "You're all caught up!"}
                            </p>
                            <p className="text-zinc-600 text-sm mt-2">
                                {tab === 'unread' ? 'Switch to "All" to see history.' : 'New activity will appear here.'}
                            </p>
                        </motion.div>
                    ) : (
                        <div className="space-y-2">
                            <AnimatePresence initial={false}>
                                {displayed.map((notif, i) => {
                                    const meta = getNotifMeta(notif);
                                    const relatedProfile = meta.relatedIsUser && notif.related_id
                                        ? profiles[notif.related_id]
                                        : null;

                                    return (
                                        <motion.div
                                            key={notif.id}
                                            initial={{ opacity: 0, y: 12 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
                                            transition={{ delay: i * 0.03 }}
                                            onClick={() => handleClick(notif)}
                                            className={`group relative p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-4
                                                ${notif.is_read
                                                    ? 'bg-[#0a0a0a] border-white/5 hover:bg-[#111] hover:border-white/10'
                                                    : 'bg-[#111] border-orange-500/20 hover:border-orange-500/40 shadow-sm shadow-orange-500/5'
                                                }`}
                                        >
                                            {/* Unread dot */}
                                            {!notif.is_read && (
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-orange-500 rounded-full" />
                                            )}

                                            {/* Type icon */}
                                            <div className={`mt-0.5 h-10 w-10 shrink-0 rounded-xl flex items-center justify-center ring-1 ${meta.color}`}>
                                                {meta.icon}
                                            </div>

                                            {/* Body */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <span className={`text-xs font-semibold uppercase tracking-wider ${notif.is_read ? 'text-zinc-600' : 'text-orange-500'}`}>
                                                            {meta.label}
                                                        </span>

                                                        {/* Profile chip — shown when related_id is a user */}
                                                        {relatedProfile && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedUserId(notif.related_id!);
                                                                }}
                                                                className="flex items-center gap-2 mt-1.5 mb-1 group/profile"
                                                                title="View profile"
                                                            >
                                                                <div className="w-7 h-7 rounded-full bg-[#1a1610] border border-orange-500/30 flex items-center justify-center text-xs font-black text-orange-500 shrink-0 group-hover/profile:scale-110 transition-transform">
                                                                    {relatedProfile.full_name?.[0] || '?'}
                                                                </div>
                                                                <span className="text-sm font-semibold text-white group-hover/profile:text-orange-400 transition-colors truncate">
                                                                    {relatedProfile.full_name}
                                                                </span>
                                                            </button>
                                                        )}

                                                        <p className={`text-sm leading-relaxed mt-0.5 ${notif.is_read ? 'text-zinc-500' : 'text-zinc-300'}`}>
                                                            {notif.content}
                                                        </p>
                                                    </div>

                                                    {/* Per-item mark read */}
                                                    {!notif.is_read && (
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            {notif.type === 'team_invite' && (
                                                                <div className="flex gap-1.5">
                                                                    <button
                                                                        onClick={(e) => handleAcceptInvite(e, notif)}
                                                                        disabled={acceptLoading === notif.id}
                                                                        className="px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 text-xs font-bold rounded-lg transition-colors border border-green-500/20 disabled:opacity-50 flex items-center gap-1"
                                                                    >
                                                                        {acceptLoading === notif.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                                                                        Accept
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }}
                                                                        className="px-3 py-1.5 bg-zinc-500/10 hover:bg-zinc-500/20 text-zinc-400 text-xs font-bold rounded-lg transition-colors border border-zinc-500/20 flex items-center gap-1"
                                                                    >
                                                                        <X className="h-3 w-3" /> Decline
                                                                    </button>
                                                                </div>
                                                            )}
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }}
                                                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-white/5 text-zinc-600 hover:text-white"
                                                                title="Mark as read"
                                                            >
                                                                <Check className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                <p className="text-xs text-zinc-600 mt-1.5">
                                                    {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                                                </p>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
