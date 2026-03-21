import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import { Button } from '../components/ui/button';
import { X, Heart, Users, Code2, Loader2, Info } from 'lucide-react';
import { teamsApi, type Team } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export default function Matches() {
    const { user } = useAuth();
    const [teams, setTeams] = useState<Team[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        loadTeams();
    }, []);

    const loadTeams = async () => {
        setLoading(true);
        try {
            const data = await teamsApi.list();
            // Show all teams except the ones the user created
            setTeams(data.filter((t) => t.created_by !== user?.id));
        } catch (err) {
            console.error('Failed to load teams:', err);
        } finally {
            setLoading(false);
            setCurrentIndex(0);
        }
    };

    const handleAction = async (action: 'like' | 'dislike') => {
        const team = teams[currentIndex];
        if (!team) return;

        if (action === 'like') {
            setActionLoading(true);
            try {
                await teamsApi.requestJoin(team.id);
            } catch (err: any) {
                alert(err.message || 'Could not send join request');
            } finally {
                setActionLoading(false);
                setCurrentIndex(prev => prev + 1);
            }
        } else {
            setCurrentIndex(prev => prev + 1);
        }
    };

    const currentTeam = teams[currentIndex];

    return (
        <div className="min-h-screen bg-black text-white selection:bg-purple-500/30 overflow-hidden">
            <Sidebar />

            <main className="md:ml-64 h-screen flex flex-col items-center justify-center p-4 relative">
                {/* Background Blobs */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />

                <div className="text-center mb-6 z-10">
                    <h1 className="text-2xl font-bold">🔥 Discover Teams</h1>
                    <p className="text-zinc-500 text-sm mt-1">Find your perfect hackathon group</p>
                </div>

                <div className="relative w-full max-w-sm h-[560px] z-10">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
                        </div>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            {currentTeam ? (
                                <motion.div
                                    key={currentTeam.id}
                                    className="absolute inset-0 bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
                                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                                    animate={{ scale: 1, opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -20 }}
                                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                                >
                                    <div className="h-2/5 bg-zinc-800 relative flex items-center justify-center border-b border-white/10">
                                        <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center border-2 border-white/10 shadow-inner">
                                            <span className="text-5xl font-bold text-white/60">{currentTeam.name[0]}</span>
                                        </div>
                                        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-blue-400 border border-blue-500/30 flex items-center gap-1">
                                            <Users className="h-3 w-3" /> {currentTeam.member_count ?? 0}/{currentTeam.max_members}
                                        </div>
                                    </div>

                                    <div className="flex-1 p-6 flex flex-col gap-4 overflow-y-auto">
                                        <div>
                                            <h2 className="text-2xl font-bold">{currentTeam.name}</h2>
                                            {currentTeam.hackathon_name && (
                                                <p className="text-purple-400 font-medium flex items-center gap-1 mt-1 text-sm">
                                                    <Code2 className="h-4 w-4" /> {currentTeam.hackathon_name}
                                                </p>
                                            )}
                                        </div>
                                        
                                        {currentTeam.description && (
                                            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                                                <p className="text-zinc-300 text-sm leading-relaxed">
                                                    {currentTeam.description}
                                                </p>
                                            </div>
                                        )}

                                        {currentTeam.required_skills && currentTeam.required_skills.length > 0 && (
                                            <div className="mt-auto pt-2">
                                                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Required Skills</h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {currentTeam.required_skills.map((skill) => (
                                                        <span key={skill} className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-xs font-medium text-purple-300 shadow-sm shadow-purple-500/10">
                                                            {skill}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex flex-col items-center justify-center h-full text-center bg-zinc-900/50 rounded-3xl border border-white/5 p-6 shadow-xl"
                                >
                                    <div className="h-20 w-20 rounded-full bg-black/50 border border-white/10 flex items-center justify-center mb-4">
                                        <Info className="h-10 w-10 text-zinc-500" />
                                    </div>
                                    <h2 className="text-xl font-bold text-white mb-2">No more teams left!</h2>
                                    <p className="text-zinc-400 text-sm mb-6">You have seen all available teams. Check back later for new ones!</p>
                                    <Button onClick={loadTeams} variant="outline" className="border-white/10 text-white hover:bg-white/5">
                                        Refresh Teams
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}
                </div>

                {/* Controls */}
                {currentTeam && !loading && (
                    <div className="flex items-center gap-6 mt-8 z-10">
                        <Button
                            onClick={() => handleAction('dislike')}
                            disabled={actionLoading}
                            className="h-16 w-16 rounded-full bg-zinc-900 border border-red-500/20 text-red-500 hover:bg-red-500/10 hover:scale-110 transition-all shadow-lg shadow-red-500/5 disabled:opacity-50"
                        >
                            <X className="h-8 w-8" />
                        </Button>
                        <Button
                            onClick={() => handleAction('like')}
                            disabled={actionLoading}
                            className="h-16 w-16 rounded-full bg-zinc-900 border border-green-500/20 text-green-500 hover:bg-green-500/10 hover:scale-110 transition-all shadow-lg shadow-green-500/5 disabled:opacity-50"
                        >
                            {actionLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Heart className="h-8 w-8 fill-current" />}
                        </Button>
                    </div>
                )}
            </main>
        </div>
    );
}
