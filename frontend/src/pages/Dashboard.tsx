import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { teamsApi, type Team } from '../lib/api';
import { motion } from 'framer-motion';
import { Users, MessageSquare, Search, Plus, Zap, ChevronRight, Loader2 } from 'lucide-react';
import Sidebar from '../components/Sidebar';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    teamsApi.myTeams().then(setMyTeams).finally(() => setLoading(false));
  }, []);

  const profileComplete = !!(user?.skills?.length && user.college);

  return (
    <div className="flex min-h-screen bg-black text-white">
      <Sidebar />
      <main className="md:ml-64 flex-1 p-6">
        {/* Welcome Banner */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold">
            Welcome back, <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">{user?.full_name?.split(' ')[0]}</span> 👋
          </h1>
          <p className="text-zinc-400 mt-1 text-sm">Ready to find your next hackathon team?</p>
        </motion.div>

        {/* Profile completion banner */}
        {!profileComplete && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="mb-6 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between gap-4"
          >
            <div>
              <p className="font-semibold text-amber-300">Complete your profile</p>
              <p className="text-sm text-amber-400/70">Add your skills and college so teams can find you.</p>
            </div>
            <button onClick={() => navigate('/profile')} className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xl text-sm transition-colors shrink-0">
              Complete Profile
            </button>
          </motion.div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Search, label: 'Find Teams', desc: 'Browse open teams', path: '/teams', gradient: 'from-purple-600 to-blue-600' },
            { icon: Plus, label: 'Create Team', desc: 'Start your own team', path: '/teams', gradient: 'from-emerald-600 to-teal-600' },
            { icon: MessageSquare, label: 'Team Chat', desc: 'Message your team', path: '/chat', gradient: 'from-pink-600 to-purple-600' },
            { icon: Zap, label: 'Matches', desc: 'View your matches', path: '/matches', gradient: 'from-orange-600 to-amber-600' },
          ].map((action, i) => (
            <motion.div key={action.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
              <Link to={action.path}>
                <div className="bg-zinc-900/80 border border-white/10 rounded-2xl p-5 hover:border-purple-500/40 transition-all group cursor-pointer">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <action.icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-bold text-sm">{action.label}</h3>
                  <p className="text-zinc-500 text-xs mt-0.5">{action.desc}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* My Teams */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2"><Users className="h-5 w-5 text-purple-400" /> My Teams</h2>
            <Link to="/teams" className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1">
              Browse All <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-7 w-7 animate-spin text-purple-400" /></div>
          ) : myTeams.length === 0 ? (
            <div className="bg-zinc-900/50 border border-dashed border-white/10 rounded-2xl p-10 text-center">
              <p className="text-zinc-500">You aren't in any teams yet.</p>
              <button onClick={() => navigate('/teams')} className="mt-4 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold transition-colors">
                Find a Team
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {myTeams.map((team, i) => (
                <motion.div key={team.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <div className="bg-zinc-900/80 border border-white/10 rounded-2xl p-5 hover:border-purple-500/40 transition-all">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center font-bold text-lg shrink-0">
                        {team.name[0]}
                      </div>
                      <div>
                        <h3 className="font-bold">{team.name}</h3>
                        <p className="text-xs text-zinc-500">{team.hackathon_name || 'Open Team'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-zinc-500 mb-4">
                      <Users className="h-3 w-3" /> {team.member_count ?? '?'} / {team.max_members} members
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => navigate(`/team/${team.id}`)} className="flex-1 py-2 text-sm text-zinc-300 bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
                        View Team
                      </button>
                      <button onClick={() => navigate(`/chat/${team.id}`)} className="flex-1 py-2 text-sm bg-purple-600/80 hover:bg-purple-600 text-white rounded-xl transition-colors flex items-center justify-center gap-1">
                        <MessageSquare className="h-3.5 w-3.5" /> Chat
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Skills summary */}
        {user?.skills && user.skills.length > 0 && (
          <section className="mt-8">
            <h2 className="text-lg font-bold mb-3">Your Skills</h2>
            <div className="flex flex-wrap gap-2">
              {user.skills.map((skill) => (
                <span key={skill} className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm rounded-xl">{skill}</span>
              ))}
              <button onClick={() => navigate('/profile')} className="px-3 py-1.5 border border-dashed border-white/10 text-zinc-500 hover:text-white text-sm rounded-xl transition-colors">
                + Edit Skills
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
