import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import ProfileModal from '../components/ProfileModal';
import { friendsApi, usersApi, type FriendEntry, type FriendRequest, type UserProfile } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import {
    Users, UserPlus, Search, Loader2, CheckCircle, XCircle,
    UserCheck, Clock, Code2, MessageSquare, UserMinus, Zap
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { useNavigate, useSearchParams } from 'react-router-dom';

type Tab = 'friends' | 'requests' | 'search';

export default function Friends() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [tab, setTab] = useState<Tab>(
        (searchParams.get('tab') as Tab) || 'friends'
    );

    // Friends list
    const [friends, setFriends] = useState<FriendEntry[]>([]);
    const [friendsLoading, setFriendsLoading] = useState(true);

    // Requests
    const [requests, setRequests] = useState<FriendRequest[]>([]);
    const [requestsLoading, setRequestsLoading] = useState(true);
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

    // Search
    const [searchQuery, setSearchQuery] = useState('');
    const [skillFilter, setSkillFilter] = useState('');
    const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [sentIds, setSentIds] = useState<Set<string>>(new Set());
    const [sendingId, setSendingId] = useState<string | null>(null);

    // Profile Modal
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

    useEffect(() => {
        loadFriends();
        loadRequests();
    }, []);

    const loadFriends = async () => {
        setFriendsLoading(true);
        try {
            const data = await friendsApi.list();
            setFriends(data);
        } catch (err) {
            console.error(err);
        } finally {
            setFriendsLoading(false);
        }
    };

    const loadRequests = async () => {
        setRequestsLoading(true);
        try {
            const data = await friendsApi.pending();
            setRequests(data);
        } catch (err) {
            console.error(err);
        } finally {
            setRequestsLoading(false);
        }
    };

    const handleAccept = async (requestId: string) => {
        setActionLoadingId(requestId);
        try {
            await friendsApi.accept(requestId);
            setRequests((prev) => prev.filter((r) => r.id !== requestId));
            loadFriends(); // refresh
        } catch (err: any) {
            alert(err.message || 'Failed to establish comm link.');
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleReject = async (requestId: string) => {
        setActionLoadingId(requestId);
        try {
            await friendsApi.reject(requestId);
            setRequests((prev) => prev.filter((r) => r.id !== requestId));
        } catch (err: any) {
            alert(err.message || 'Failed to reject.');
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setSearchLoading(true);
        try {
            const data = await usersApi.searchUsers({ skills: skillFilter || undefined });
            const friendIds = new Set(friends.map((f) => f.id));
            const pendingIds = new Set(requests.map((r) =>
                r.is_incoming ? r.requester_id : r.receiver_id
            ));
            // Filter out self, existing friends, pending requests
            const filtered = data.filter((u) =>
                u.id !== user?.id &&
                !friendIds.has(u.id) &&
                !pendingIds.has(u.id) &&
                (!searchQuery || u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    u.skills?.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
                    u.college?.toLowerCase().includes(searchQuery.toLowerCase()))
            );
            setSearchResults(filtered);
        } catch (err) {
            console.error(err);
        } finally {
            setSearchLoading(false);
        }
    };

    const handleSendRequest = async (targetId: string) => {
        setSendingId(targetId);
        try {
            await friendsApi.sendRequest(targetId);
            setSentIds((prev) => new Set([...prev, targetId]));
        } catch (err: any) {
            alert(err.message || 'Could not initiate contact.');
        } finally {
            setSendingId(null);
        }
    };

    const incomingRequests = requests.filter((r) => r.is_incoming);
    const outgoingRequests = requests.filter((r) => !r.is_incoming);
    const pendingBadge = incomingRequests.length;

    const tabs: { id: Tab; label: string; icon: React.ElementType; badge?: number }[] = [
        { id: 'friends', label: 'Network', icon: UserCheck },
        { id: 'requests', label: 'Pending', icon: UserPlus, badge: pendingBadge },
        { id: 'search', label: 'Discover', icon: Search },
    ];

    return (
        <div className="flex min-h-screen premium-bg text-white relative font-[Space_Grotesk]">
            {/* Ambient Background */}
            <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] bg-orange-600/5 blur-[150px] pointer-events-none rounded-full" />
            
            <Sidebar />
            <ProfileModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} />

            <main className="md:ml-64 flex-1 p-6 md:p-10 relative z-10">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold flex items-center gap-3 tracking-tight">
                        <Users className="h-8 w-8 text-orange-500" />
                        Communications Network
                    </h1>
                    <p className="text-zinc-500 mt-2 font-medium tracking-wide">Manage direct connections and discover operators.</p>
                </div>

                {/* Tabs */}
                <div className="flex bg-[#111111] p-1.5 rounded-full border border-white/5 w-fit mb-8 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
                    {tabs.map((t) => {
                        const Icon = t.icon;
                        const isActive = tab === t.id;
                        return (
                            <button
                                key={t.id}
                                onClick={() => setTab(t.id)}
                                className={`relative flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all uppercase tracking-wider
                                    ${isActive ? 'bg-orange-500 text-white shadow-[0_5px_15px_rgba(255,107,0,0.3)]' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
                            >
                                <Icon className="h-4 w-4" />
                                {t.label}
                                {t.badge !== undefined && t.badge > 0 && (
                                    <span className="ml-1 bg-white text-orange-600 shadow-md text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full">
                                        {t.badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                <AnimatePresence mode="wait">
                    {/* ── FRIENDS TAB ── */}
                    {tab === 'friends' && (
                        <motion.div
                            key="friends"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                        >
                            {friendsLoading ? (
                                <div className="flex justify-center py-32">
                                    <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
                                </div>
                            ) : friends.length === 0 ? (
                                <div className="text-center py-32 text-zinc-600">
                                    <UserCheck className="h-16 w-16 mx-auto mb-5 opacity-30 text-zinc-500" />
                                    <p className="text-xl font-bold text-white mb-2">No Verified Contacts</p>
                                    <p className="text-sm tracking-wide">Scan the network to establish connections.</p>
                                    <Button
                                        onClick={() => setTab('search')}
                                        className="mt-8 btn-primary rounded-full px-8 py-3 text-sm tracking-widest uppercase font-bold"
                                    >
                                        Initiate Search
                                    </Button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                                    {friends.map((f, i) => (
                                        <motion.div
                                            key={f.id}
                                            initial={{ opacity: 0, y: 16 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="surface-card surface-hover p-5 flex items-center gap-4 group"
                                        >
                                            <button onClick={() => setSelectedUserId(f.id)} className="shrink-0 relative">
                                                <div className="w-14 h-14 rounded-full bg-[#161616] border border-white/5 flex items-center justify-center font-black text-xl text-orange-500 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(255,107,0,0.15)] overflow-hidden">
                                                    {f.avatar_url ? (
                                                        <img src={f.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                                    ) : (
                                                        f.full_name?.[0] || '?'
                                                    )}
                                                </div>
                                                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-[#111] rounded-full" />
                                            </button>
                                            <div className="flex-1 min-w-0">
                                                <button
                                                    onClick={() => setSelectedUserId(f.id)}
                                                    className="font-bold text-base text-white hover:text-orange-400 transition-colors text-left truncate block w-full"
                                                >
                                                    {f.full_name}
                                                </button>
                                                {f.email && <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider truncate mt-0.5">{f.email}</p>}
                                                <span className="inline-flex items-center gap-1.5 text-[10px] uppercase font-bold text-green-500 tracking-widest mt-2 border border-green-500/20 px-2 py-0.5 rounded-full bg-green-500/5">
                                                    <UserCheck className="h-3 w-3" /> Linked
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => navigate('/chat')}
                                                title="Open Comm Link"
                                                className="w-10 h-10 flex items-center justify-center rounded-full bg-[#161616] border border-white/5 text-zinc-400 hover:text-orange-500 hover:border-orange-500/50 shadow-sm transition-all shadow-[0_2px_5px_rgba(0,0,0,0.5)] group-hover:bg-[#1a1a1a]"
                                            >
                                                <MessageSquare className="h-4 w-4" />
                                            </button>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ── REQUESTS TAB ── */}
                    {tab === 'requests' && (
                        <motion.div
                            key="requests"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className="space-y-10"
                        >
                            {requestsLoading ? (
                                <div className="flex justify-center py-32">
                                    <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
                                </div>
                            ) : (
                                <>
                                    {/* Incoming */}
                                    <div>
                                        <h2 className="text-sm font-black text-white uppercase tracking-widest mb-5 flex items-center gap-3 border-b border-white/5 pb-3">
                                            <UserPlus className="h-5 w-5 text-orange-500" />
                                            Inbound Links
                                            {incomingRequests.length > 0 && (
                                                <span className="bg-orange-600 text-white text-[10px] px-2 py-0.5 rounded-full shadow-inner shadow-black/50">
                                                    {incomingRequests.length}
                                                </span>
                                            )}
                                        </h2>
                                        {incomingRequests.length === 0 ? (
                                            <div className="surface-card p-8 text-center bg-[#0a0a0a] shadow-none">
                                                <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">No inbound requests registered.</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                                {incomingRequests.map((req) => (
                                                    <motion.div
                                                        key={req.id}
                                                        initial={{ opacity: 0, x: -16 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0 }}
                                                        className="surface-card p-5 flex items-center gap-5 group border border-orange-500/10 hover:border-orange-500/30"
                                                    >
                                                        <button
                                                            onClick={() => setSelectedUserId(req.friend_profile?.id ?? req.requester_id)}
                                                            className="w-14 h-14 rounded-full bg-[#161616] border border-white/5 flex items-center justify-center font-black text-xl text-zinc-300 group-hover:text-orange-500 group-hover:scale-110 transition-all overflow-hidden"
                                                        >
                                                            {req.friend_profile?.avatar_url ? (
                                                                <img src={req.friend_profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                                            ) : (
                                                                req.friend_profile?.full_name?.[0] || '?'
                                                            )}
                                                        </button>
                                                        <div className="flex-1 min-w-0">
                                                            <button
                                                                onClick={() => setSelectedUserId(req.friend_profile?.id ?? req.requester_id)}
                                                                className="font-bold text-white hover:text-orange-400 transition-colors text-left truncate block text-base"
                                                            >
                                                                {req.friend_profile?.full_name || 'Unknown Operator'}
                                                            </button>
                                                            <p className="text-[11px] font-bold text-zinc-600 uppercase tracking-widest truncate mt-0.5">{req.friend_profile?.email || 'Encrypted'}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => handleAccept(req.id)}
                                                                disabled={actionLoadingId === req.id}
                                                                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[#111] border border-green-500/40 text-green-500 hover:bg-green-500/10 hover:border-green-500 rounded-xl text-xs font-bold transition-all disabled:opacity-50 uppercase tracking-widest shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] shadow-[0_2px_10px_rgba(34,197,94,0.1)]"
                                                            >
                                                                {actionLoadingId === req.id
                                                                    ? <Loader2 className="h-4 w-4 animate-spin" />
                                                                    : <CheckCircle className="h-4 w-4" />}
                                                                <span className="hidden sm:inline">Accept</span>
                                                            </button>
                                                            <button
                                                                onClick={() => handleReject(req.id)}
                                                                disabled={actionLoadingId === req.id}
                                                                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[#111] border border-red-500/30 text-red-500 hover:bg-red-500/10 hover:border-red-500 rounded-xl text-xs font-bold transition-all disabled:opacity-50 uppercase tracking-widest shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]"
                                                            >
                                                                <XCircle className="h-4 w-4" />
                                                                <span className="hidden sm:inline">Deny</span>
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Outgoing */}
                                    <div>
                                        <h2 className="text-sm font-black text-white uppercase tracking-widest mb-5 flex items-center gap-3 border-b border-white/5 pb-3">
                                            <Clock className="h-5 w-5 text-zinc-500" />
                                            Outbound Signals
                                        </h2>
                                        {outgoingRequests.length === 0 ? (
                                            <div className="surface-card p-8 text-center bg-[#0a0a0a] shadow-none border-dashed border-white/5">
                                                <p className="text-zinc-600 text-sm font-bold uppercase tracking-widest">No active outbound signals.</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                                {outgoingRequests.map((req) => (
                                                    <motion.div
                                                        key={req.id}
                                                        initial={{ opacity: 0, x: -16 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        className="surface-card p-5 flex items-center gap-5 border border-white/5"
                                                    >
                                                        <button
                                                            onClick={() => setSelectedUserId(req.friend_profile?.id ?? req.receiver_id)}
                                                            className="w-12 h-12 rounded-full bg-[#111] flex items-center justify-center font-black text-lg text-zinc-600 shrink-0 hover:scale-105 transition-transform overflow-hidden"
                                                        >
                                                            {req.friend_profile?.avatar_url ? (
                                                                <img src={req.friend_profile.avatar_url} alt="Avatar" className="w-full h-full object-cover grayscale opacity-50" />
                                                            ) : (
                                                                req.friend_profile?.full_name?.[0] || '?'
                                                            )}
                                                        </button>
                                                        <div className="flex-1 min-w-0 opacity-70">
                                                            <button
                                                                onClick={() => setSelectedUserId(req.friend_profile?.id ?? req.receiver_id)}
                                                                className="font-bold text-white hover:text-orange-300 transition-colors text-left truncate block text-sm"
                                                            >
                                                                {req.friend_profile?.full_name || 'Unknown Protocol'}
                                                            </button>
                                                            <p className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase mt-0.5 truncate">{req.friend_profile?.email || 'Signal sent'}</p>
                                                        </div>
                                                        <div className="flex items-center gap-3 border-l border-white/5 pl-4">
                                                            <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest flex items-center gap-1 bg-orange-500/10 px-2 py-1 rounded-md">
                                                                <Clock className="h-3 w-3" /> Waiting
                                                            </span>
                                                            <button
                                                                onClick={() => handleReject(req.id)}
                                                                disabled={actionLoadingId === req.id}
                                                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#111] border border-white/5 text-zinc-500 hover:text-red-500 hover:border-red-500/50 hover:bg-red-500/10 transition-all font-bold"
                                                                title="Abort request"
                                                            >
                                                                <UserMinus className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </motion.div>
                    )}

                    {/* ── SEARCH TAB ── */}
                    {tab === 'search' && (
                        <motion.div
                            key="search"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                        >
                            <form onSubmit={handleSearch} className="flex flex-wrap lg:flex-nowrap gap-3 mb-10 w-full max-w-4xl">
                                <div className="relative flex-1 min-w-[250px]">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-orange-500 pointer-events-none" />
                                    <input
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Scan by designation, stack, or origin..."
                                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-zinc-700 focus:outline-none focus:border-orange-500 focus:shadow-[0_0_15px_rgba(255,107,0,0.2)] text-sm font-medium transition-all"
                                    />
                                </div>
                                <div className="relative min-w-[180px]">
                                    <Code2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-500 pointer-events-none" />
                                    <input
                                        value={skillFilter}
                                        onChange={(e) => setSkillFilter(e.target.value)}
                                        placeholder="Filter by tech..."
                                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-zinc-700 focus:outline-none focus:border-orange-500 focus:shadow-[0_0_15px_rgba(255,107,0,0.2)] text-sm font-medium transition-all"
                                    />
                                </div>
                                <Button type="submit" className="btn-primary rounded-xl px-8 h-[52px] font-black uppercase tracking-widest text-xs flex items-center justify-center">
                                    Execute Scan
                                </Button>
                            </form>

                            {searchLoading ? (
                                <div className="flex justify-center py-32">
                                    <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
                                </div>
                            ) : searchResults.length === 0 ? (
                                <div className="surface-card p-16 text-center shadow-none bg-[#0a0a0a] max-w-2xl mx-auto border-dashed border-white/10">
                                    <Search className="h-14 w-14 mx-auto mb-4 text-zinc-700" />
                                    <p className="text-xl font-bold text-white mb-2">Network Scan Yielded Null</p>
                                    <p className="text-sm font-medium text-zinc-500 tracking-wide">Adjust search parameters to widen the ping radius.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    <AnimatePresence>
                                        {searchResults.map((u, i) => {
                                            const wasSent = sentIds.has(u.id);
                                            return (
                                                <motion.div
                                                    key={u.id}
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: i * 0.04 }}
                                                    className="surface-card p-6 flex flex-col gap-5 hover:border-orange-500/40 group"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <button onClick={() => setSelectedUserId(u.id)} className="shrink-0 relative">
                                                            <div className="w-14 h-14 rounded-full bg-[#111] border border-white/5 flex items-center justify-center font-black text-xl text-white group-hover:text-orange-500 group-hover:scale-110 group-hover:border-orange-500/50 transition-all shadow-[0_5px_15px_rgba(0,0,0,0.5)] overflow-hidden">
                                                                {u.avatar_url ? (
                                                                    <img src={u.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    u.full_name?.[0] || '?'
                                                                )}
                                                            </div>
                                                        </button>
                                                        <div className="min-w-0">
                                                            <button
                                                                onClick={() => setSelectedUserId(u.id)}
                                                                className="font-bold text-base text-white hover:text-orange-400 transition-colors text-left truncate w-full tracking-tight"
                                                            >
                                                                {u.full_name}
                                                            </button>
                                                            {u.college && <p className="text-[10px] font-medium text-zinc-500 tracking-widest uppercase truncate">{u.college}</p>}
                                                            {u.experience_level && (
                                                                <span className="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded border border-white/5 bg-[#111] text-zinc-400 uppercase tracking-widest mt-1.5">
                                                                   <Zap className="h-2.5 w-2.5 text-orange-500" /> {u.experience_level}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {u.bio ? (
                                                        <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2 font-medium">"{u.bio}"</p>
                                                    ) : (
                                                        <p className="text-[11px] text-zinc-600 uppercase tracking-widest font-bold border-l-2 border-white/5 pl-2 py-1">Classified log.</p>
                                                    )}

                                                    {u.skills && u.skills.length > 0 && (
                                                        <div className="flex flex-wrap gap-1.5 mt-auto">
                                                            {u.skills.slice(0, 4).map((skill) => (
                                                                <span key={skill} className="px-2.5 py-1 bg-[#111] border border-white/5 rounded-full text-[10px] font-black text-zinc-300 uppercase tracking-wider shadow-inner">
                                                                    {skill}
                                                                </span>
                                                            ))}
                                                            {u.skills.length > 4 && (
                                                                <span className="px-2 py-1 text-[10px] font-black text-zinc-600 uppercase">+{u.skills.length - 4}</span>
                                                            )}
                                                        </div>
                                                    )}

                                                    <div className="flex gap-3 pt-4 border-t border-white/5">
                                                        <button
                                                            onClick={() => setSelectedUserId(u.id)}
                                                            className="flex-1 border border-white/10 bg-[#0a0a0a] text-zinc-400 hover:text-white hover:border-white/30 text-[11px] font-bold py-2.5 rounded-xl transition-all uppercase tracking-wider"
                                                        >
                                                            Inspect
                                                        </button>
                                                        <button
                                                            onClick={() => !wasSent && handleSendRequest(u.id)}
                                                            disabled={sendingId === u.id || wasSent}
                                                            className={`flex-[1.5] flex items-center justify-center gap-2 rounded-xl text-[11px] font-black transition-all uppercase tracking-wider ${
                                                                wasSent
                                                                    ? 'bg-transparent border border-green-500/30 text-green-500 cursor-default shadow-[inset_0_0_10px_rgba(34,197,94,0.1)]'
                                                                    : 'bg-orange-600 hover:bg-orange-500 text-white shadow-[0_5px_15px_rgba(255,107,0,0.3)] disabled:opacity-50'
                                                            }`}
                                                        >
                                                            {sendingId === u.id ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : wasSent ? (
                                                                <><CheckCircle className="h-4 w-4" /> Signal Sent</>
                                                            ) : (
                                                                <><UserPlus className="h-4 w-4" /> Link Protocol</>
                                                            )}
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
