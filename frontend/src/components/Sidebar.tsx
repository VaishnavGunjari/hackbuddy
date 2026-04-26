import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    LayoutGrid,
    MessageSquare,
    Zap,
    LogOut,
    User,
    Search,
    Shield,
    Bell,
    Users,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { notificationsApi } from '../lib/api';
import { useState, useEffect, useCallback } from 'react';

export default function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [unreadNotifCount, setUnreadNotifCount] = useState(0);
    const [unreadChatCount, setUnreadChatCount] = useState(0);

    const fetchCounts = useCallback(async () => {
        if (!user) return;
        try {
            const [notifs, chatRes] = await Promise.all([
                notificationsApi.list(),
                fetch(
                    `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/chat/unread-count`,
                    { headers: { Authorization: `Bearer ${localStorage.getItem('haxion_token')}` } }
                ).then(r => r.ok ? r.json() : { unread_count: 0 }),
            ]);
            setUnreadNotifCount(notifs.filter(n => !n.is_read).length);
            setUnreadChatCount(chatRes.unread_count || 0);
        } catch { /* silent */ }
    }, [user]);

    useEffect(() => {
        fetchCounts();
        const interval = setInterval(fetchCounts, 30_000);
        return () => clearInterval(interval);
    }, [fetchCounts, location.pathname]);

    const menuItems = [
        { icon: LayoutGrid, label: 'Dashboard', path: '/dashboard' },
        { icon: Search, label: 'Find Teams', path: '/teams' },
        { icon: Zap, label: 'Matches', path: '/matches' },
        { icon: Users, label: 'Friends', path: '/friends' },
        { icon: MessageSquare, label: 'Chat', path: '/chat', badge: unreadChatCount },
        { icon: User, label: 'Profile', path: '/profile' },
    ];

    if (user?.role === 'admin') {
        menuItems.push({ icon: Shield, label: 'Admin', path: '/admin', badge: 0 });
    }

    const handleSignOut = () => {
        logout();
        navigate('/');
    };

    return (
        <>
        <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="fixed top-0 left-0 h-screen w-64 bg-[#0a0a0a] border-r border-white/5 hidden md:flex flex-col z-40"
        >
            {/* Logo */}
            <div className="h-24 flex items-center px-8">
                <Link to="/" className="flex items-center gap-3 font-bold text-xl text-white hover:text-orange-500 transition-colors">
                    <div className="h-9 w-9 flex items-center justify-center rounded-lg overflow-hidden">
                        <img src="/logo.png" alt="Haxion" className="w-full h-full object-contain" />
                    </div>
                    <span className="font-bold tracking-tight">Haxion</span>
                </Link>
            </div>

            {/* User info */}
            {user && (
                <div className="px-6 pb-6">
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#111111] border border-white/5">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden ring-2 ring-orange-500/20">
                            {user.avatar_url
                                ? <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                                : (user.full_name?.[0] || '?')
                            }
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{user.full_name}</p>
                            <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation */}
            <div className="flex-1 py-4 px-4 space-y-1.5 overflow-y-auto">
                {menuItems.map((item) => {
                    const isActive = location.pathname.startsWith(item.path);
                    return (
                        <Link to={item.path} key={item.path}>
                            <div className={`
                                relative flex items-center gap-3 px-4 py-3 rounded-full transition-all duration-300 group
                                ${isActive
                                    ? 'bg-[#181818] text-white border border-white/10'
                                    : 'text-zinc-500 hover:text-white hover:bg-white/5 border border-transparent'
                                }
                            `}>
                                <item.icon className={`h-5 w-5 transition-colors duration-300 ${isActive ? 'text-orange-500 drop-shadow-[0_0_8px_rgba(255,107,0,0.8)]' : 'text-zinc-600 group-hover:text-zinc-400'}`} />
                                <span className="font-semibold text-sm tracking-wide">{item.label}</span>
                                {item.badge !== undefined && item.badge > 0 && (
                                    <span className="ml-auto bg-orange-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(255,107,0,0.4)]">
                                        {item.badge}
                                    </span>
                                )}
                            </div>
                        </Link>
                    );
                })}
            </div>

            {/* Bottom Actions */}
            <div className="p-6">
                <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-full text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors border border-transparent"
                >
                    <LogOut className="h-5 w-5" />
                    <span className="font-semibold text-sm">Sign Out</span>
                </button>
            </div>
        </motion.div>

        {/* Top Right Floating Notifications */}
        {user && (
            <div className="fixed top-6 right-8 z-50">
                <Link
                    to="/notifications"
                    className="relative flex items-center justify-center p-3 rounded-full bg-[#111111] border border-white/10 text-white hover:border-white/30 transition-all shadow-lg hover:scale-105"
                >
                    <Bell className="h-6 w-6 text-zinc-400" />
                    {unreadNotifCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-[11px] font-bold min-w-[22px] h-[22px] rounded-full flex items-center justify-center px-1 border-2 border-[#000000] shadow-[0_0_10px_rgba(255,107,0,0.4)]">
                            {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
                        </span>
                    )}
                </Link>
            </div>
        )}
        </>
    );
}
