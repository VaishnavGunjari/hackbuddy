import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { teamsApi, type Team } from '../lib/api';
import { motion } from 'framer-motion';
import { Users, MessageSquare, Search, Plus, Zap, ChevronRight, Loader2 } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const cardVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.4 } }),
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    teamsApi.myTeams().then(setMyTeams).finally(() => setLoading(false));
  }, []);

  const profileComplete = !!(user?.skills?.length && user.college);

  const quickActions = [
    { icon: Search, label: 'Find Teams', desc: 'Browse open teams', path: '/teams' },
    { icon: Plus, label: 'Create Team', desc: 'Start your own team', path: '/teams' },
    { icon: MessageSquare, label: 'Team Chat', desc: 'Message your team', path: '/chat' },
    { icon: Zap, label: 'Matches', desc: 'View your matches', path: '/matches' },
  ];

  return (
    <div className="flex min-h-screen premium-bg text-white">
      <Sidebar />
      <main className="md:ml-64 flex-1 p-6 md:p-8 relative">

        {/* Subtle orange glow orb */}
        <div className="fixed top-0 right-0 w-[500px] h-[300px] bg-orange-600/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative z-10">
          {/* Welcome Banner */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
              Welcome back,{' '}
              <span className="text-white">{user?.full_name?.split(' ')[0]}</span> 👋
            </h1>
            <p className="text-zinc-500 mt-2 text-sm font-medium">Your centralized command center for team building.</p>
          </motion.div>

          {/* Profile completion banner */}
          {!profileComplete && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="mb-8 surface-card p-5 flex items-center justify-between gap-4 border-orange-500/20 shadow-[0_5px_30px_rgba(255,107,0,0.05)]"
            >
              <div>
                <p className="font-bold text-orange-500 mb-0.5">Profile Incomplete</p>
                <p className="text-sm text-zinc-400">Add your skills and college to unlock smart matchmaking.</p>
              </div>
              <button onClick={() => navigate('/profile')}
                className="btn-primary px-5 py-2.5 text-sm shrink-0">
                Complete Profile
              </button>
            </motion.div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
            {quickActions.map((action, i) => (
              <motion.div key={action.label} custom={i} variants={cardVariant} initial="hidden" animate="visible">
                <Link to={action.path}>
                  <div className="surface-card surface-hover p-6 cursor-pointer group h-full">
                    <div className="w-12 h-12 rounded-full bg-[#161616] border border-white/5 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-orange-500/10 group-hover:border-orange-500/30 transition-all duration-300">
                      <action.icon className="h-5 w-5 text-white group-hover:text-orange-500 transition-colors" />
                    </div>
                    <h3 className="font-bold text-base text-white">{action.label}</h3>
                    <p className="text-zinc-500 text-xs mt-1 font-medium">{action.desc}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* My Teams */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2 tracking-tight">
                <Users className="h-6 w-6 text-orange-500" />
                Active Teams
              </h2>
              <Link to="/teams" className="text-sm font-bold text-zinc-400 hover:text-white flex items-center gap-1 transition-colors">
                Browse Directory <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
              </div>
            ) : myTeams.length === 0 ? (
              <div className="surface-card border-dashed border-white/10 p-16 text-center shadow-none bg-[#0a0a0a]">
                <div className="w-16 h-16 rounded-full bg-[#111] border border-white/5 flex items-center justify-center mx-auto mb-5">
                  <Users className="h-6 w-6 text-zinc-600" />
                </div>
                <p className="text-zinc-300 font-bold text-lg mb-2">No active teams</p>
                <p className="text-zinc-500 text-sm mb-6 max-w-sm mx-auto">You haven't joined or created any teams yet. Start your journey by browsing the directory.</p>
                <button onClick={() => navigate('/teams')}
                  className="px-6 py-3 btn-primary text-sm shadow-[0_5px_20px_rgba(255,107,0,0.2)]">
                  Explore Directory
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {myTeams.map((team, i) => (
                  <motion.div key={team.id} custom={i} variants={cardVariant} initial="hidden" animate="visible">
                    <div className="surface-card p-6 flex flex-col h-full">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-[#161616] border border-white/10 flex items-center justify-center font-bold text-xl text-orange-500 shrink-0">
                            {team.name[0]}
                          </div>
                          <div>
                            <h3 className="font-bold text-white text-lg leading-tight">{team.name}</h3>
                            <p className="text-xs text-zinc-500 font-medium tracking-wide uppercase mt-1">{team.hackathon_name || 'Global Open Build'}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold text-white mb-6 bg-[#161616] border border-white/5 rounded-full px-3 py-1.5 w-fit">
                        <Users className="h-3.5 w-3.5 text-zinc-500" /> {team.member_count ?? '?'} <span className="text-zinc-500 font-medium">/ {team.max_members} spots</span>
                      </div>
                      <div className="flex gap-3 mt-auto pt-4 border-t border-white/5">
                        <button onClick={() => navigate(`/team/${team.id}`)}
                          className="flex-1 py-2.5 text-sm font-bold text-zinc-300 bg-[#161616] hover:bg-[#222] border border-white/5 hover:border-white/10 rounded-full transition-all">
                          Overview
                        </button>
                        <button onClick={() => navigate(`/chat/${team.id}`)}
                          className="flex-[1.5] py-2.5 text-sm font-bold btn-primary flex items-center justify-center gap-2">
                          <MessageSquare className="h-4 w-4" /> Open Comms
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </section>

          {/* Skills */}
          {user?.skills && user.skills.length > 0 && (
            <section className="mt-12">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-zinc-300">
                <Zap className="h-4 w-4 text-orange-500" /> Registered Stack
              </h2>
              <div className="flex flex-wrap gap-2.5">
                {user.skills.map((skill) => (
                  <span key={skill}
                    className="px-4 py-1.5 bg-[#111] border border-white/10 text-zinc-300 text-sm font-medium rounded-full cursor-default hover:bg-[#161616] hover:border-orange-500/30 transition-colors">
                    {skill}
                  </span>
                ))}
                <button onClick={() => navigate('/profile')}
                  className="px-4 py-1.5 border border-dashed border-white/10 text-zinc-500 hover:text-white font-medium text-sm rounded-full transition-colors hover:bg-white/5">
                  Update Stack
                </button>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
