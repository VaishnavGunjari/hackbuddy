import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { chatApi, friendsApi, teamsApi, type Message, type Team, type FriendEntry } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Send, Loader2, AlertTriangle, MessageSquare,
    Hash, UserCircle, Search, RefreshCw, Users, Zap
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import ProfileModal from '../components/ProfileModal';

// ── Types ─────────────────────────────────────────────────────────────────────

type ChatMode = 'team' | 'dm';
type SidebarTab = 'teams' | 'friends';

interface DmMessage {
    id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    created_at?: string;
    sender_name?: string;
    is_read?: boolean;
}

interface Conversation {
    mode: ChatMode;
    id: string;
    name: string;
    letter: string;
}

interface UnreadCounts {
    teams: Record<string, number>;
    friends: Record<string, number>;
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function Chat() {
    const { teamId } = useParams<{ teamId: string }>();
    const [searchParams] = useSearchParams();
    const dmParam = searchParams.get('dm'); // ?dm=userId opens DM directly
    const { user } = useAuth();
    const navigate = useNavigate();

    // sidebar
    const [sidebarTab, setSidebarTab] = useState<SidebarTab>('teams');
    const [teams, setTeams] = useState<Team[]>([]);
    const [friends, setFriends] = useState<FriendEntry[]>([]);
    const [sidebarSearch, setSidebarSearch] = useState('');
    const [loadingSidebar, setLoadingSidebar] = useState(true);
    const [unread, setUnread] = useState<UnreadCounts>({ teams: {}, friends: {} });

    // active conversation
    const [active, setActive] = useState<Conversation | null>(null);

    // messages
    const [teamMessages, setTeamMessages] = useState<Message[]>([]);
    const [dmMessages, setDmMessages] = useState<DmMessage[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(false);

    // input
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);

    // profile modal
    const [viewingUserId, setViewingUserId] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const initializedRef = useRef(false); // prevent double-select on re-render

    // ── Load sidebar + unread counts ──────────────────────────────────────────

    const loadUnread = useCallback(async () => {
        try {
            const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const res = await fetch(`${BASE}/chat/unread-count`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('haxion_token')}` },
            });
            if (res.ok) {
                const data = await res.json();
                setUnread({ teams: data.teams || {}, friends: data.friends || {} });
            }
        } catch { /* silent */ }
    }, []);

    // loadSidebar: ONLY fetches data, no auto-selection logic (stable, no URL deps)
    const loadSidebar = useCallback(async () => {
        setLoadingSidebar(true);
        try {
            const [teamsData, friendsData] = await Promise.all([
                teamsApi.myTeams(),
                friendsApi.list(),
            ]);
            setTeams(teamsData);
            setFriends(friendsData);

            // Auto-select ONCE on first load based on URL
            if (!initializedRef.current) {
                initializedRef.current = true;

                // ?dm=userId — jump to DM
                if (dmParam) {
                    const friend = friendsData.find((f) => f.id === dmParam);
                    if (friend) {
                        setSidebarTab('friends');
                        selectConversation({ mode: 'dm', id: friend.id, name: friend.full_name, letter: friend.full_name?.[0] || '?' });
                        return;
                    }
                }

                // /chat/:teamId — jump to team chat
                if (teamId) {
                    const team = teamsData.find((t) => t.id === teamId);
                    if (team) {
                        setSidebarTab('teams');
                        selectConversation({ mode: 'team', id: team.id, name: team.name, letter: team.name[0] });
                        return;
                    }
                }

                // Default: open first team
                if (teamsData.length > 0) {
                    const t = teamsData[0];
                    selectConversation({ mode: 'team', id: t.id, name: t.name, letter: t.name[0] });
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingSidebar(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        loadSidebar();
        loadUnread();
        const unreadPoll = setInterval(loadUnread, 15_000);
        return () => clearInterval(unreadPoll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // When ?dm= changes WHILE already on the chat page
    useEffect(() => {
        if (!dmParam || !initializedRef.current) return;
        const friend = friends.find((f) => f.id === dmParam);
        if (friend) {
            setSidebarTab('friends');
            selectConversation({ mode: 'dm', id: friend.id, name: friend.full_name, letter: friend.full_name?.[0] || '?' });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dmParam, friends]);

    // ── Load messages ──────────────────────────────────────────────────────────

    const loadMessages = useCallback(async () => {
        if (!active) return;
        try {
            if (active.mode === 'team') {
                const data = await chatApi.getMessages(active.id);
                setTeamMessages(data);
            } else {
                const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                const res = await fetch(`${BASE}/friends/${active.id}/messages`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('haxion_token')}` },
                });
                const data = await res.json();
                setDmMessages(Array.isArray(data) ? data : []);
            }
            // After loading, clear the unread badge
            setUnread((prev) => {
                const next = { ...prev };
                if (active.mode === 'team') {
                    const t = { ...next.teams };
                    delete t[active.id];
                    next.teams = t;
                } else {
                    const f = { ...next.friends };
                    delete f[active.id];
                    next.friends = f;
                }
                return next;
            });
        } catch (err) {
            console.error('load messages', err);
        } finally {
            setLoadingMessages(false);
        }
    }, [active]);

    useEffect(() => {
        if (!active) return;
        setLoadingMessages(true);
        setTeamMessages([]);
        setDmMessages([]);
        setText('');
        loadMessages();

        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = setInterval(loadMessages, 5000);
        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, [active?.id, active?.mode, loadMessages]);

    // ── Auto-scroll ────────────────────────────────────────────────────────────

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [teamMessages, dmMessages]);

    // ── Select conversation ────────────────────────────────────────────────────

    function selectConversation(conv: Conversation) {
        setActive(conv);
        if (conv.mode === 'team') navigate(`/chat/${conv.id}`, { replace: true });
        setTimeout(() => inputRef.current?.focus(), 100);
    }

    // ── Send message ───────────────────────────────────────────────────────────

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim() || !active || sending) return;
        setSending(true);
        const content = text.trim();
        setText('');

        try {
            if (active.mode === 'team') {
                const msg = await chatApi.sendMessage({ team_id: active.id, content });
                setTeamMessages((prev) => [...prev, msg]);
            } else {
                const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                const res = await fetch(`${BASE}/friends/messages`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('haxion_token')}`,
                    },
                    body: JSON.stringify({ receiver_id: active.id, content }),
                });
                const msg = await res.json();
                setDmMessages((prev) => [...prev, msg]);
            }
        } catch (err: any) {
            alert(err.message || 'Failed to send message');
            setText(content);
        } finally {
            setSending(false);
        }
    };

    // ── Filtered lists ─────────────────────────────────────────────────────────

    const q = sidebarSearch.toLowerCase();
    const filteredTeams = teams.filter((t) => !q || t.name.toLowerCase().includes(q));
    const filteredFriends = friends.filter((f) => !q || f.full_name?.toLowerCase().includes(q));

    const messages = active?.mode === 'team' ? teamMessages : dmMessages;

    const totalTeamUnread = Object.values(unread.teams).reduce((a, b) => a + b, 0);
    const totalFriendUnread = Object.values(unread.friends).reduce((a, b) => a + b, 0);

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <div className="flex h-screen premium-bg text-white overflow-hidden font-[Space_Grotesk]">
            <Sidebar />
            <ProfileModal userId={viewingUserId} onClose={() => setViewingUserId(null)} />

            {/* ── Conversation Sidebar ── */}
            <aside className="md:ml-64 w-80 border-r border-white/5 bg-[#050505] hidden md:flex flex-col shrink-0">

                {/* Sidebar Header */}
                <div className="p-5 border-b border-white/5 space-y-4">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-widest">
                        <MessageSquare className="h-4 w-4 text-orange-500" /> Comms Hub
                    </h2>

                    {/* Tab Buttons */}
                    <div className="flex bg-[#111111] p-1 rounded-xl border border-white/5 shadow-inner">
                        <button
                            onClick={() => setSidebarTab('teams')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all
                                ${sidebarTab === 'teams'
                                    ? 'bg-[#1a1a1a] text-orange-500 shadow-[0_2px_10px_rgba(0,0,0,0.5)] border border-white/5'
                                    : 'text-zinc-500 hover:text-white'}`}
                        >
                            <Hash className="h-3.5 w-3.5" />
                            Squads
                            {totalTeamUnread > 0 && (
                                <span className="text-[10px] font-bold text-white bg-orange-600 px-1.5 py-0.5 rounded-full drop-shadow-md">
                                    {totalTeamUnread}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setSidebarTab('friends')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all
                                ${sidebarTab === 'friends'
                                    ? 'bg-[#1a1a1a] text-orange-500 shadow-[0_2px_10px_rgba(0,0,0,0.5)] border border-white/5'
                                    : 'text-zinc-500 hover:text-white'}`}
                        >
                            <Users className="h-3.5 w-3.5" />
                            Direct
                            {totalFriendUnread > 0 && (
                                <span className="text-[10px] font-bold text-white bg-orange-600 px-1.5 py-0.5 rounded-full drop-shadow-md">
                                    {totalFriendUnread}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 pointer-events-none" />
                        <input
                            value={sidebarSearch}
                            onChange={(e) => setSidebarSearch(e.target.value)}
                            placeholder={`Search ${sidebarTab === 'teams' ? 'squads' : 'channels'}...`}
                            className="w-full bg-[#0a0a0a] border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-zinc-700 font-medium focus:outline-none focus:border-orange-500/50 transition-colors"
                        />
                    </div>
                </div>

                {/* Conversation List */}
                <div className="flex-1 overflow-y-auto p-3">
                    {loadingSidebar ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
                        </div>
                    ) : (
                        <AnimatePresence mode="wait">
                            {/* ── TEAMS TAB ── */}
                            {sidebarTab === 'teams' && (
                                <motion.div
                                    key="teams"
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -8 }}
                                    className="space-y-1"
                                >
                                    {filteredTeams.length === 0 ? (
                                        <div className="text-center text-zinc-600 text-xs py-10 px-4 font-medium">
                                            {sidebarSearch ? 'No squads found.' : 'Join a squad to unlock comms.'}
                                        </div>
                                    ) : filteredTeams.map((team) => {
                                        const isActive = active?.mode === 'team' && active.id === team.id;
                                        const badge = unread.teams[team.id] || 0;
                                        return (
                                            <button
                                                key={team.id}
                                                onClick={() => selectConversation({ mode: 'team', id: team.id, name: team.name, letter: team.name[0] })}
                                                className={`w-full text-left px-3 py-3 flex items-center gap-4 transition-all rounded-xl border
                                                    ${isActive ? 'bg-[#111] border-orange-500/30' : 'bg-transparent border-transparent hover:bg-white/5'}`}
                                            >
                                                <div className={`w-11 h-11 rounded-full bg-[#161616] flex items-center justify-center font-black text-sm shrink-0 border border-white/5 ${isActive ? 'text-orange-500 border-orange-500/50 shadow-[0_0_15px_rgba(255,107,0,0.2)]' : 'text-zinc-500'}`}>
                                                    {team.name[0]}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className={`text-sm font-bold truncate ${isActive ? 'text-white' : 'text-zinc-400'}`}>{team.name}</p>
                                                    <p className="text-[10px] font-medium text-zinc-600 truncate uppercase mt-0.5 tracking-wider">{team.hackathon_name || 'Encrypted Channel'}</p>
                                                </div>
                                                {badge > 0 && (
                                                    <span className="bg-orange-600 text-white text-[10px] font-bold min-w-[20px] h-5 rounded-full flex items-center justify-center px-1 shrink-0 animate-pulse shadow-[0_0_10px_rgba(255,107,0,0.4)]">
                                                        {badge > 99 ? '99+' : badge}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </motion.div>
                            )}

                            {/* ── FRIENDS / DM TAB ── */}
                            {sidebarTab === 'friends' && (
                                <motion.div
                                    key="friends"
                                    initial={{ opacity: 0, x: 8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 8 }}
                                    className="space-y-1"
                                >
                                    {filteredFriends.length === 0 ? (
                                        <div className="text-center text-zinc-600 text-xs py-10 px-4 font-medium">
                                            {sidebarSearch ? 'No matches found.' : 'Establish connections to open direct channels.'}
                                        </div>
                                    ) : filteredFriends.map((friend) => {
                                        const isActive = active?.mode === 'dm' && active.id === friend.id;
                                        const badge = unread.friends[friend.id] || 0;
                                        return (
                                            <button
                                                key={friend.id}
                                                onClick={() => selectConversation({ mode: 'dm', id: friend.id, name: friend.full_name, letter: friend.full_name?.[0] || '?' })}
                                                className={`w-full text-left px-3 py-3 flex items-center gap-4 transition-all rounded-xl border
                                                    ${isActive ? 'bg-[#111] border-orange-500/30' : 'bg-transparent border-transparent hover:bg-white/5'}`}
                                            >
                                                <div className={`relative w-11 h-11 rounded-full bg-[#161616] flex items-center justify-center font-black text-sm shrink-0 border border-white/5 ${isActive ? 'text-orange-500 border-orange-500/50 shadow-[0_0_15px_rgba(255,107,0,0.2)]' : 'text-zinc-500'}`}>
                                                    {friend.full_name?.[0] || '?'}
                                                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#000]" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className={`text-sm font-bold truncate ${isActive ? 'text-white' : 'text-zinc-400'}`}>{friend.full_name}</p>
                                                    <p className="text-[10px] font-medium text-zinc-600 uppercase mt-0.5 tracking-wider truncate">Direct Link</p>
                                                </div>
                                                {badge > 0 && (
                                                    <span className="bg-orange-600 text-white text-[10px] font-bold min-w-[20px] h-5 rounded-full flex items-center justify-center px-1 shrink-0 animate-pulse shadow-[0_0_10px_rgba(255,107,0,0.4)]">
                                                        {badge > 99 ? '99+' : badge}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}
                </div>
            </aside>

            {/* ── Chat Window ── */}
            <div className="flex-1 flex flex-col min-w-0 relative">
                {/* Subtle background glow for the chat pane */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] to-[#000000] z-[-1]" />
                
                {!active ? (
                    <div className="flex-1 flex items-center justify-center flex-col gap-5 text-center p-8 bg-transparent">
                        <div className="h-24 w-24 rounded-full bg-[#111] border border-white/5 flex items-center justify-center shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
                            <Zap className="h-10 w-10 text-zinc-700" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white tracking-tight">Comms Offline</p>
                            <p className="text-sm font-medium text-zinc-500 mt-2 max-w-sm mx-auto">
                                Initialize a connection by selecting a <span className="text-orange-500">squad</span> or <span className="text-orange-500">direct contact</span> from the communications hub.
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Chat Header */}
                        <div className="h-[72px] border-b border-white/5 flex items-center pl-6 pr-24 bg-[#050505]/90 backdrop-blur-md gap-4 shrink-0 shadow-sm relative z-10">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg relative shrink-0 border ${active.mode === 'team' ? 'bg-[#111] border-white/10 text-white' : 'bg-[#111] border-white/10 text-orange-500'}`}>
                                {active.letter}
                                {active.mode === 'dm' && (
                                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#050505]" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <button
                                    onClick={() => active.mode === 'dm' ? setViewingUserId(active.id) : undefined}
                                    className={`font-bold text-base text-white truncate ${active.mode === 'dm' ? 'hover:text-orange-500 transition-colors cursor-pointer' : 'cursor-default'}`}
                                >
                                    {active.name}
                                </button>
                                <p className="text-xs font-bold text-zinc-600 flex items-center gap-1.5 uppercase tracking-widest mt-0.5">
                                    {active.mode === 'team'
                                        ? <><Hash className="h-3 w-3 text-orange-600" /> Squad Frequency</>
                                        : <><UserCircle className="h-3 w-3 text-orange-600" /> P2P Link</>
                                    }
                                </p>
                            </div>
                            {active.mode === 'dm' && (
                                <button
                                    onClick={() => setViewingUserId(active.id)}
                                    className="text-xs font-bold text-white bg-[#111] px-4 py-2 rounded-full border border-white/10 hover:border-orange-500/50 hover:text-orange-500 transition-colors shadow-sm"
                                >
                                    Inspect Profile
                                </button>
                            )}
                            <button
                                onClick={loadMessages}
                                className="h-10 w-10 flex items-center justify-center rounded-full bg-[#111] border border-white/5 text-zinc-500 hover:text-white hover:border-white/20 transition-colors"
                                title="Refresh"
                            >
                                <RefreshCw className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {loadingMessages ? (
                                <div className="flex justify-center py-20">
                                    <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-zinc-600 gap-4">
                                    <div className="h-20 w-20 rounded-full bg-[#0a0a0a] border border-white/5 flex items-center justify-center">
                                        <MessageSquare className="h-8 w-8 text-zinc-800" />
                                    </div>
                                    <p className="text-sm font-medium tracking-wide uppercase text-zinc-500">Channel active. Send a payload to begin.</p>
                                </div>
                            ) : (
                                <AnimatePresence initial={false}>
                                    {messages.map((msg: any) => {
                                        const isMe = msg.sender_id === user?.id;
                                        return (
                                            <motion.div
                                                key={msg.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className={`flex ${isMe ? 'justify-end' : 'justify-start'} gap-3`}
                                            >
                                                {!isMe && (
                                                    <button
                                                        onClick={() => setViewingUserId(msg.sender_id)}
                                                        title="View profile"
                                                        className="w-10 h-10 rounded-full bg-[#111] border border-white/10 flex items-center justify-center text-xs font-black shrink-0 hover:scale-105 hover:border-orange-500/50 transition-all shadow-md text-zinc-300 self-end mb-5"
                                                    >
                                                        {(msg.sender_name || '?')[0]}
                                                    </button>
                                                )}
                                                <div className={`max-w-[75%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                                    {!isMe && (
                                                        <p className="text-[10px] font-bold text-zinc-500 mb-1.5 ml-1 uppercase tracking-wider">{msg.sender_name}</p>
                                                    )}
                                                    <div className={`px-5 py-3 rounded-[24px] text-[15px] leading-relaxed font-medium shadow-sm
                                                        ${isMe ? 'rounded-br-sm' : 'rounded-bl-sm'}
                                                        ${msg.is_flagged 
                                                            ? 'bg-red-500/10 border border-red-500/20' 
                                                            : isMe 
                                                                ? 'bg-orange-600 text-white shadow-[0_5px_15px_rgba(255,107,0,0.15)]' 
                                                                : 'bg-[#111] text-zinc-100 border border-white/5'
                                                        }`}
                                                        style={{wordBreak: 'break-word'}}
                                                    >
                                                        {msg.is_flagged ? (
                                                            <span className="flex items-center gap-2 text-red-400 italic text-sm font-bold">
                                                                <AlertTriangle className="h-4 w-4" />
                                                                Payload Blocked (Policy Violation)
                                                            </span>
                                                        ) : msg.content}
                                                    </div>
                                                    <p className="text-[10px] font-bold text-zinc-600 mt-1.5 mx-2 uppercase">
                                                        {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Bar */}
                        <div className="p-5 border-t border-white/5 bg-[#050505]/90 backdrop-blur-md shrink-0">
                            <form onSubmit={handleSend} className="max-w-4xl mx-auto flex gap-3 relative items-end">
                                <div className="flex-1 relative">
                                    <textarea
                                        autoFocus
                                        value={text}
                                        onChange={(e) => setText(e.target.value)}
                                        placeholder={`Broadcast to ${active.name}...`}
                                        className="w-full bg-[#111] border border-white/10 rounded-2xl pl-5 pr-14 py-4 text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500/50 focus:bg-[#151515] text-[15px] transition-all resize-none shadow-inner"
                                        rows={Math.min(Math.max(text.split('\n').length, 1), 5)}
                                        onKeyDown={(e) => { 
                                            if (e.key === 'Enter' && !e.shiftKey) { 
                                                e.preventDefault(); 
                                                handleSend(e as any); 
                                            } 
                                        }}
                                    />
                                    <span className="absolute right-4 bottom-4 text-[10px] font-bold text-zinc-700 uppercase pointer-events-none hidden sm:block">
                                        Enter to send
                                    </span>
                                </div>
                                <button
                                    type="submit"
                                    disabled={sending || !text.trim()}
                                    className="h-[54px] w-[54px] btn-primary rounded-2xl flex items-center justify-center disabled:opacity-40 transition-all shrink-0 shadow-lg mb-[1px]"
                                >
                                    {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5 ml-1" />}
                                </button>
                            </form>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
