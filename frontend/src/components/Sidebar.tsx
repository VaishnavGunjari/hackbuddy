import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    LayoutGrid,
    MessageSquare,
    Zap,
    LogOut,
    Code2,
    User,
    Search,
    Shield,
    Bell,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { notificationsApi } from '../lib/api';
import { useState, useEffect } from 'react';

export default function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (user) {
            notificationsApi.list()
                .then(data => setUnreadCount(data.filter(n => !n.is_read).length))
                .catch(console.error);
        }
    }, [user, location.pathname]); // refetch when changing pages

    const menuItems = [
        { icon: LayoutGrid, label: 'Dashboard', path: '/dashboard' },
        { icon: Search, label: 'Find Teams', path: '/teams' },
        { icon: Zap, label: 'Matches', path: '/matches' },
        { icon: Bell, label: 'Notifications', path: '/notifications', badge: unreadCount },
        { icon: MessageSquare, label: 'Chat', path: '/chat' },
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
        <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="fixed top-0 left-0 h-screen w-64 bg-black border-r border-white/10 hidden md:flex flex-col z-40"
        >
            {/* Logo */}
            <div className="h-20 flex items-center px-8 border-b border-white/5">
                <Link to="/" className="flex items-center gap-2 font-bold text-lg text-white hover:opacity-80 transition-opacity">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                        <Code2 className="h-5 w-5 text-white" />
                    </div>
                    HackMate
                </Link>
            </div>

            {/* User info */}
            {user && (
                <div className="px-4 py-4 border-b border-white/5">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                            {user.full_name?.[0] || '?'}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{user.full_name}</p>
                            <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation */}
            <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
                {menuItems.map((item) => {
                    const isActive = location.pathname.startsWith(item.path);
                    return (
                        <Link to={item.path} key={item.path}>
                            <div className={`
                                relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                                ${isActive ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5'}
                            `}>
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute left-0 w-1 h-7 bg-purple-500 rounded-r-full"
                                    />
                                )}
                                <item.icon className={`h-5 w-5 ${isActive ? 'text-purple-400' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                                <span className="font-medium">{item.label}</span>
                                {item.badge !== undefined && item.badge > 0 && (
                                    <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                        {item.badge}
                                    </span>
                                )}
                            </div>
                        </Link>
                    );
                })}
            </div>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-white/5">
                <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500/70 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                    <LogOut className="h-5 w-5" />
                    <span className="font-medium">Sign Out</span>
                </button>
            </div>
        </motion.div>
    );
}
