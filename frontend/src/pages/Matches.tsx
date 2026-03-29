import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ProfileModal from '../components/ProfileModal';
import { matchesApi, usersApi, type UserProfile } from '../lib/api';
import {
    X, Heart, Undo2, Loader2, Github, Linkedin,
    GraduationCap, Zap, Code2, RefreshCw, Sparkles
} from 'lucide-react';
import { Button } from '../components/ui/button';

type SwipeDir = 'left' | 'right' | null;

interface MatchToast {
    name: string;
    letter: string;
}

export default function Matches() {
    const [queue, setQueue] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [swiping, setSwiping] = useState(false);
    const [swipeDir, setSwipeDir] = useState<SwipeDir>(null);
    const [history, setHistory] = useState<UserProfile[]>([]); // for undo
    const [matchToast, setMatchToast] = useState<MatchToast | null>(null);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [skillFilter, setSkillFilter] = useState('');
    const [expFilter, setExpFilter] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [highlightedId, setHighlightedId] = useState<string | null>(null);
    const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [searchParams, setSearchParams] = useSearchParams();

    useEffect(() => {
        const highlightId = searchParams.get('highlight');
        loadQueue(highlightId || undefined);
        // Clear the highlight param from the URL so a refresh doesn't re-trigger
        if (highlightId) {
            setHighlightedId(highlightId);
            setSearchParams({}, { replace: true });
        }
        return () => { if (toastTimer.current) clearTimeout(toastTimer.current); };
    }, []);

    const loadQueue = async (prependId?: string) => {
        setLoading(true);
        try {
            const data = await matchesApi.potential();
            if (prependId) {
                // Try to front-load the highlighted profile
                const alreadyIn = data.some((p) => p.id === prependId);
                if (alreadyIn) {
                    // Move to front
                    setQueue([...data.filter((p) => p.id === prependId), ...data.filter((p) => p.id !== prependId)]);
                } else {
                    // Not in potential list (already swiped etc.) — fetch directly and prepend
                    try {
                        const highlighted = await usersApi.getUser(prependId);
                        setQueue([highlighted, ...data]);
                    } catch {
                        setQueue(data);
                    }
                }
            } else {
                setQueue(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const currentProfile = queue[0];

    const handleSwipe = async (dir: 'left' | 'right') => {
        if (!currentProfile || swiping) return;
        const action = dir === 'right' ? 'like' : 'dislike';

        setSwiping(true);
        setSwipeDir(dir);

        // Optimistically advance the queue
        const swiped = currentProfile;
        setHistory((prev) => [swiped, ...prev.slice(0, 4)]); // keep last 5
        setQueue((prev) => prev.slice(1));

        try {
            const res = await matchesApi.swipe(swiped.id, action);
            if (res.match) {
                showMatchToast(swiped);
            }
        } catch (err) {
            console.error('Swipe failed', err);
        } finally {
            setSwiping(false);
            setSwipeDir(null);
        }
    };

    const handleUndo = async () => {
        if (history.length === 0 || swiping) return;
        const last = history[0];
        try {
            await matchesApi.undo(last.id);
            setHistory((prev) => prev.slice(1));
            setQueue((prev) => [last, ...prev]);
        } catch (err) {
            console.error('Undo failed', err);
        }
    };

    const showMatchToast = (profile: UserProfile) => {
        setMatchToast({ name: profile.full_name, letter: profile.full_name?.[0] || '?' });
        if (toastTimer.current) clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setMatchToast(null), 4000);
    };

    const filtered = queue.filter((p) => {
        const skillOk = !skillFilter || p.skills?.some((s) => s.toLowerCase().includes(skillFilter.toLowerCase()));
        const expOk = !expFilter || p.experience_level?.toLowerCase() === expFilter.toLowerCase();
        return skillOk && expOk;
    });

    const displayProfile = filtered[0];

    return (
        <div className="min-h-screen premium-bg text-white overflow-hidden relative">
            <Sidebar />
            <ProfileModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} />

            {/* Match Toast */}
            <AnimatePresence>
                {matchToast && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: -60 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: -60 }}
                        className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-[#111111] border border-orange-500/50 rounded-2xl px-6 py-4 shadow-[0_10px_40px_rgba(255,107,0,0.3)]"
                    >
                        <Sparkles className="h-6 w-6 text-orange-500 animate-pulse" />
                        <div>
                            <p className="font-bold text-lg text-white tracking-tight">Synergy Confirmed!</p>
                            <p className="text-sm text-zinc-400">You and {matchToast.name} have formed a match.</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center font-bold text-lg text-white shadow-inner">
                            {matchToast.letter}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <main className="md:ml-64 h-screen flex flex-col items-center justify-center p-4 relative z-10">
                {/* Background Blobs */}
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-orange-600/5 blur-[150px] rounded-full pointer-events-none" />

                {/* Header */}
                <div className="text-center mb-6 z-10 relative w-full max-w-sm">
                    {/* Highlighted-profile banner */}
                    <AnimatePresence>
                        {highlightedId && queue[0]?.id === highlightedId && (
                            <motion.div
                                initial={{ opacity: 0, y: -10, height: 0 }}
                                animate={{ opacity: 1, y: 0, height: 'auto' }}
                                exit={{ opacity: 0, y: -10, height: 0 }}
                                className="mb-3 flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-300 text-xs font-bold"
                            >
                                <Heart className="h-3.5 w-3.5 fill-current" />
                                Liked your profile · Swipe right to match!
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <div className="flex items-center justify-between mb-2">
                        <h1 className="text-3xl font-bold flex items-center gap-2 tracking-tight">
                            <Zap className="h-7 w-7 text-orange-500" />
                            Discover
                        </h1>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleUndo}
                                disabled={history.length === 0 || swiping}
                                className="h-10 w-10 flex items-center justify-center rounded-full border border-white/5 bg-[#111111] text-zinc-400 hover:text-white hover:border-white/20 transition-colors disabled:opacity-30 disabled:hover:border-white/5 disabled:hover:text-zinc-400"
                                title="Undo last swipe"
                            >
                                <Undo2 className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setShowFilters((x) => !x)}
                                className={`h-10 px-4 flex items-center gap-2 rounded-full border text-sm font-bold transition-all ${showFilters ? 'border-orange-500 bg-orange-500 text-white shadow-[0_0_15px_rgba(255,107,0,0.4)]' : 'border-white/5 bg-[#111] text-zinc-400 hover:text-white hover:border-white/20'}`}
                            >
                                <Zap className="h-3.5 w-3.5" /> Filters
                            </button>
                            <button
                                onClick={() => loadQueue()}
                                className="h-10 w-10 flex items-center justify-center rounded-full border border-white/5 bg-[#111111] text-zinc-400 hover:text-white hover:border-white/20 transition-colors"
                                title="Refresh pool"
                            >
                                <RefreshCw className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>

                    {/* Filters Panel */}
                    <AnimatePresence>
                        {showFilters && (
                            <motion.div
                                initial={{ opacity: 0, y: -8, height: 0 }}
                                animate={{ opacity: 1, y: 0, height: 'auto' }}
                                exit={{ opacity: 0, y: -8, height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="surface-card p-3 mt-3 flex gap-2">
                                    <div className="relative flex-1">
                                        <Code2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                                        <input
                                            value={skillFilter}
                                            onChange={(e) => setSkillFilter(e.target.value)}
                                            placeholder="Skill..."
                                            className="w-full bg-[#0a0a0a] border border-white/5 rounded-lg pl-9 pr-3 py-2 text-white placeholder-zinc-600 text-xs focus:outline-none focus:border-orange-500/60 font-medium"
                                        />
                                    </div>
                                    <select
                                        value={expFilter}
                                        onChange={(e) => setExpFilter(e.target.value)}
                                        className="bg-[#0a0a0a] border border-white/5 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-orange-500/60 font-medium font-sans"
                                    >
                                        <option value="">Any Level</option>
                                        <option value="beginner">Beginner</option>
                                        <option value="intermediate">Intermediate</option>
                                        <option value="advanced">Advanced</option>
                                    </select>
                                    <button
                                        onClick={() => { setSkillFilter(''); setExpFilter(''); }}
                                        className="text-xs font-bold text-zinc-500 hover:text-orange-400 px-2 transition-colors uppercase tracking-wider"
                                    >Clear</button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-2">
                        {filtered.length > 0 ? `${filtered.length} candidates available` : 'Pool exhausted'}
                    </p>
                </div>

                {/* Card Stack */}
                <div className="relative w-full max-w-sm z-10" style={{ height: 520 }}>
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                        </div>
                    ) : !displayProfile ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute inset-0 flex flex-col items-center justify-center surface-card p-8 text-center"
                        >
                            <div className="h-24 w-24 rounded-full bg-[#0a0a0a] border border-white/5 flex items-center justify-center mb-6">
                                <Zap className="h-10 w-10 text-zinc-700" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Queue Empty</h2>
                            <p className="text-zinc-500 text-sm mb-6 leading-relaxed">
                                You've reviewed all available candidates in your area.<br />Adjust filters or check back later.
                            </p>
                            <Button onClick={() => loadQueue()} className="btn-primary rounded-full px-8 py-2">
                                <RefreshCw className="h-4 w-4 mr-2" /> Reload Database
                            </Button>
                        </motion.div>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            {/* Background cards (stack effect) */}
                            {filtered.slice(1, 3).reverse().map((profile, i) => (
                                <div
                                    key={profile.id}
                                    className="absolute inset-0 rounded-[32px] surface-card shadow-none"
                                    style={{
                                        transform: `scale(${0.94 + i * 0.03}) translateY(${(1 - i) * -12}px)`,
                                        zIndex: i,
                                    }}
                                />
                            ))}

                            {/* Top card — draggable */}
                            <SwipeCard
                                key={displayProfile.id}
                                profile={displayProfile}
                                onSwipe={handleSwipe}
                                onViewProfile={() => setSelectedUserId(displayProfile.id)}
                                swipeDir={swipeDir}
                            />
                        </AnimatePresence>
                    )}
                </div>

                {/* Action Buttons */}
                {displayProfile && !loading && (
                    <div className="flex items-center gap-6 mt-8 z-10">
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleSwipe('left')}
                            disabled={swiping}
                            className="h-16 w-16 rounded-full bg-[#111111] border border-white/10 text-red-500 hover:bg-red-500/10 hover:border-red-500/50 transition-all shadow-[0_5px_15px_rgba(0,0,0,0.5)] flex items-center justify-center disabled:opacity-50"
                        >
                            <X className="h-8 w-8" />
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleSwipe('right')}
                            disabled={swiping}
                            className="h-20 w-20 rounded-full bg-[#111111] border border-white/10 text-green-500 hover:bg-green-500/10 hover:border-green-500/50 transition-all shadow-[0_5px_20px_rgba(0,0,0,0.5)] flex items-center justify-center disabled:opacity-50"
                        >
                            <Heart className="h-10 w-10 fill-current" />
                        </motion.button>
                    </div>
                )}

                {/* Swipe hint */}
                <p className="text-zinc-600 text-xs font-medium mt-6 z-10 uppercase tracking-widest text-center">Swipe cards or use the controls</p>
            </main>
        </div>
    );
}

// ─── SwipeCard ────────────────────────────────────────────────────────────────

interface SwipeCardProps {
    profile: UserProfile;
    onSwipe: (dir: 'left' | 'right') => void;
    onViewProfile: () => void;
    swipeDir: SwipeDir;
}

function SwipeCard({ profile, onSwipe, onViewProfile, swipeDir }: SwipeCardProps) {
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-250, 0, 250], [-10, 0, 10]);
    const likeOpacity = useTransform(x, [20, 100], [0, 1]);
    const nopeOpacity = useTransform(x, [-100, -20], [1, 0]);
    const bgOverlay = useTransform(x, [-200, 0, 200], ['rgba(239,68,68,0.1)', 'rgba(0,0,0,0)', 'rgba(34,197,94,0.1)']);

    const handleDragEnd = (_: PointerEvent, info: PanInfo) => {
        const threshold = 100;
        if (info.offset.x > threshold) {
            onSwipe('right');
        } else if (info.offset.x < -threshold) {
            onSwipe('left');
        }
    };

    // Animate away if parent triggered swipe via button
    const exitX = swipeDir === 'right' ? 400 : swipeDir === 'left' ? -400 : 0;

    return (
        <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.8}
            onDragEnd={handleDragEnd}
            style={{ x, rotate }}
            initial={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ x: exitX, opacity: 0, scale: 0.9, transition: { duration: 0.3, ease: 'easeOut' } }}
            className="absolute inset-0 cursor-grab active:cursor-grabbing select-none"
        >
            {/* Background tint based on swipe direction */}
            <motion.div
                style={{ backgroundColor: bgOverlay }}
                className="absolute inset-0 rounded-[32px] z-20 pointer-events-none"
            />

            {/* LIKE stamp */}
            <motion.div
                style={{ opacity: likeOpacity }}
                className="absolute top-10 left-6 z-30 rotate-[-15deg] border-4 border-green-500 text-green-500 text-3xl font-black px-4 py-1.5 rounded-xl uppercase tracking-widest pointer-events-none drop-shadow-md bg-black/50 backdrop-blur-sm"
            >
                Connect
            </motion.div>

            {/* NOPE stamp */}
            <motion.div
                style={{ opacity: nopeOpacity }}
                className="absolute top-10 right-6 z-30 rotate-[15deg] border-4 border-red-500 text-red-500 text-3xl font-black px-4 py-1.5 rounded-xl uppercase tracking-widest pointer-events-none drop-shadow-md bg-black/50 backdrop-blur-sm"
            >
                Pass
            </motion.div>

            {/* Card body */}
            <div
                className="w-full h-full surface-card rounded-[32px] overflow-hidden flex flex-col"
                onClick={onViewProfile}
            >
                {/* Avatar area */}
                <div className="h-[45%] bg-[#080808] relative flex items-center justify-center border-b border-white/5">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    
                    <div className="h-32 w-32 rounded-full bg-[#111111] border-2 border-orange-500/20 shadow-[0_0_30px_rgba(255,107,0,0.15)] flex items-center justify-center text-5xl font-black z-10 select-none overflow-hidden">
                        {profile.avatar_url ? (
                           <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                           <span className="text-white drop-shadow-lg">{profile.full_name?.[0] || '?'}</span>
                        )}
                    </div>
                    {profile.experience_level && (
                        <div className="absolute top-6 left-6 bg-[#111] border border-white/10 px-3 py-1.5 rounded-full text-xs font-bold text-white z-10 flex items-center gap-1.5 uppercase tracking-wider">
                            <Zap className="h-3.5 w-3.5 text-orange-500" />
                            {profile.experience_level}
                        </div>
                    )}
                </div>

                {/* Profile info */}
                <div className="flex-1 p-6 flex flex-col gap-4 overflow-y-auto bg-gradient-to-b from-[#0a0a0a] to-[#050505]">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-white mb-1">{profile.full_name}</h2>
                        <p className="flex items-center gap-1.5 text-zinc-500 text-xs font-bold uppercase tracking-widest">
                            <GraduationCap className="h-4 w-4 shrink-0 text-orange-500" />
                            {profile.college || 'Independent Builder'}
                        </p>
                    </div>

                    {profile.bio ? (
                        <p className="text-zinc-400 text-sm leading-relaxed line-clamp-3">
                            {profile.bio}
                        </p>
                    ) : (
                        <p className="text-zinc-600 text-sm italic">No communications protocol established...</p>
                    )}

                    <div className="mt-auto">
                        <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2 border-b border-white/5 pb-2">Technical Capabilities</div>
                        {profile.skills && profile.skills.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {profile.skills.slice(0, 6).map((skill) => (
                                    <span
                                        key={skill}
                                        className="px-3 py-1 bg-[#111111] border border-white/5 rounded-full text-[11px] font-extrabold text-white uppercase tracking-wider shadow-[0_2px_10px_rgba(0,0,0,0.5)]"
                                    >
                                        {skill}
                                    </span>
                                ))}
                                {profile.skills.length > 6 && (
                                    <span className="px-3 py-1 bg-[#111] border border-white/5 rounded-full text-[11px] font-bold text-zinc-500 uppercase">+{profile.skills.length - 6}</span>
                                )}
                            </div>
                        ) : (
                            <p className="text-zinc-600 text-xs font-medium">Data not found.</p>
                        )}
                    </div>

                    {(profile.github_url || profile.linkedin_url) && (
                        <div className="flex gap-4 pt-4 border-t border-white/5 mt-2">
                            {profile.github_url && (
                                <a href={profile.github_url} target="_blank" rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex items-center justify-center flex-1 py-2 bg-[#161616] border border-white/5 rounded-xl gap-2 text-xs font-bold text-white hover:text-white hover:border-white/20 transition-all">
                                    <Github className="h-4 w-4 text-zinc-400" /> Relays
                                </a>
                            )}
                            {profile.linkedin_url && (
                                <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex items-center justify-center flex-1 py-2 bg-[#161616] border border-white/5 rounded-xl gap-2 text-xs font-bold text-white hover:text-white hover:border-white/20 transition-all">
                                    <Linkedin className="h-4 w-4 text-zinc-400" /> Comm
                                </a>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
