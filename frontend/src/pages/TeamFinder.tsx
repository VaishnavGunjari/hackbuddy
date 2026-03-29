import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { teamsApi, usersApi, type Team, type UserProfile } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Users, ShieldCheck, Loader2, X, Sparkles } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import ProfileModal from '../components/ProfileModal';

const SKILLS = ['AI/ML', 'Web Dev', 'Backend', 'UI/UX', 'Data Science', 'Mobile Dev', 'DevOps', 'Blockchain', 'Cybersecurity'];

export default function TeamFinder() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'teams' | 'people'>('teams');
  const [teams, setTeams] = useState<Team[]>([]);
  const [people, setPeople] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchSkill, setSearchSkill] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '', hackathon_name: '', required_skills: [] as string[], max_members: 4 });
  const [creating, setCreating] = useState(false);
  const [joinLoading, setJoinLoading] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [tab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (tab === 'teams') {
        const data = await teamsApi.list();
        setTeams(data.filter((t) => t.created_by !== user?.id));
      } else {
        const data = await usersApi.searchUsers(searchSkill ? { skills: searchSkill } : {});
        setPeople(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      if (tab === 'people') {
        const data = await usersApi.searchUsers(searchSkill ? { skills: searchSkill } : {});
        setPeople(data);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (teamId: string) => {
    setJoinLoading(teamId);
    try {
      await teamsApi.requestJoin(teamId);
      alert('Join request sent! The team leader will review it.');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Could not send request');
    } finally {
      setJoinLoading(null);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const team = await teamsApi.create(createForm);
      setShowCreate(false);
      navigate(`/team/${team.id}`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to create team');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex min-h-screen premium-bg text-white relative">
      {/* Subtle Background Glow */}
      <div className="fixed top-[-20%] right-[-10%] w-[60%] h-[60%] bg-orange-600/5 blur-[150px] pointer-events-none rounded-full" />

      <Sidebar />
      <ProfileModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
      
      <main className="md:ml-64 flex-1 p-6 md:p-8 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tight">Directory</h1>
            <p className="text-zinc-500 text-sm mt-1 font-medium">Discover top-tier teams and builders autonomously.</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-6 py-3 btn-primary shadow-[0_5px_20px_rgba(255,107,0,0.2)] hover:scale-105"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Create Team</span>
            <span className="sm:hidden">Create</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-[#111111] border border-white/5 rounded-full p-1 w-fit mb-8 shadow-inner">
          {(['teams', 'people'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
                tab === t 
                  ? 'bg-orange-500 text-white shadow-[0_0_15px_rgba(255,107,0,0.3)]' 
                  : 'text-zinc-500 hover:text-white hover:bg-white/5'
              }`}
            >
              {t === 'teams' ? 'Active Teams' : 'Global Builders'}
            </button>
          ))}
        </div>

        {/* Search (people tab) */}
        {tab === 'people' && (
          <div className="flex gap-3 mb-8 flex-wrap">
            {SKILLS.map((skill) => (
              <button
                key={skill}
                onClick={() => setSearchSkill(searchSkill === skill ? '' : skill)}
                className={`px-5 py-2 rounded-full text-sm font-bold border transition-all ${
                  searchSkill === skill 
                    ? 'bg-orange-500 border-orange-500 text-white shadow-[0_0_15px_rgba(255,107,0,0.2)]' 
                    : 'bg-[#111] border-white/5 text-zinc-400 hover:border-orange-500/50 hover:text-white'
                }`}
              >
                {skill}
              </button>
            ))}
            <button onClick={handleSearch} className="px-6 py-2 rounded-full border border-white/10 hover:border-orange-500/50 bg-[#161616] hover:bg-[#1a1a1a] text-white text-sm font-bold flex items-center gap-2 transition-all">
              <Search className="h-4 w-4 text-orange-500" /> Filter
            </button>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          </div>
        ) : tab === 'teams' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {teams.map((team, i) => (
              <motion.div key={team.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <div className="surface-card surface-hover p-6 flex flex-col h-full group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-[#161616] border border-white/10 flex items-center justify-center font-bold text-xl text-orange-500 group-hover:scale-110 transition-transform">
                        {team.name[0]}
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-lg leading-tight group-hover:text-orange-400 transition-colors">{team.name}</h3>
                        <p className="text-xs text-zinc-500 uppercase tracking-widest mt-0.5">{team.hackathon_name || 'Open Build'}</p>
                      </div>
                    </div>
                  </div>

                  {team.description && <p className="text-zinc-400 text-sm mb-5 line-clamp-2 leading-relaxed">{team.description}</p>}

                  <div className="flex items-center justify-between mt-auto mb-5">
                     {team.required_skills && team.required_skills.length > 0 ? (
                        <div className="flex gap-2 text-xs font-bold text-zinc-400">
                           <span className="text-orange-500">{team.required_skills.length}</span> Skills Requested
                        </div>
                     ) : (
                        <div className="text-xs text-zinc-600 font-medium tracking-wide">Any stack welcome</div>
                     )}
                     <div className="flex items-center gap-1.5 text-xs font-bold text-white bg-[#111] border border-white/5 rounded-full px-3 py-1">
                        <Users className="h-3 w-3 text-zinc-500" /> {team.member_count ?? 0} <span className="text-zinc-600">/ {team.max_members}</span>
                     </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-white/5">
                    <button
                      onClick={() => navigate(`/team/${team.id}`)}
                      className="flex-1 py-2.5 text-sm font-bold text-zinc-300 bg-[#161616] hover:bg-[#202020] border border-white/5 hover:border-white/10 rounded-full transition-colors"
                    >
                      Inspect Team
                    </button>
                    {team.created_by !== user?.id && (
                      <button
                        onClick={() => handleJoin(team.id)}
                        disabled={joinLoading === team.id}
                        className="flex-1 py-2.5 text-sm btn-primary rounded-full transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {joinLoading === team.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Request to Join'}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
            {teams.length === 0 && !loading && (
              <div className="col-span-3 surface-card p-16 text-center shadow-none bg-[#0a0a0a]">
                <Sparkles className="h-10 w-10 mx-auto mb-4 text-zinc-700" />
                <p className="text-lg font-bold text-white mb-2">No active teams found</p>
                <p className="text-sm text-zinc-500">Be the first to create a team and start recruiting.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {people.map((person, i) => (
              <motion.div key={person.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <div className="surface-card surface-hover p-6 h-full flex flex-col group">
                  <div className="flex items-center gap-4 mb-4">
                    <button
                      onClick={() => setSelectedUserId(person.id)}
                      className="w-14 h-14 rounded-full bg-[#161616] border border-white/5 flex items-center justify-center text-2xl font-black text-white group-hover:scale-110 group-hover:border-orange-500/50 group-hover:shadow-[0_0_15px_rgba(255,107,0,0.2)] transition-all overflow-hidden"
                      title="View profile"
                    >
                      {person.avatar_url ? (
                          <img src={person.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                          person.full_name[0]
                      )}
                    </button>
                    <div>
                      <button
                        onClick={() => setSelectedUserId(person.id)}
                        className="font-bold text-white text-lg leading-tight hover:text-orange-400 transition-colors text-left"
                      >
                        {person.full_name}
                      </button>
                      <p className="text-xs text-zinc-500 mt-0.5 tracking-wide uppercase">{person.college || 'Independent'}</p>
                    </div>
                  </div>
                  
                  {person.bio && <p className="text-zinc-400 text-sm mb-5 line-clamp-2 leading-relaxed">{person.bio}</p>}
                  
                  <div className="mt-auto mb-5">
                    {person.skills && person.skills.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                        {person.skills.slice(0, 3).map((s) => (
                            <span key={s} className="px-3 py-1 bg-[#111] border border-white/5 text-zinc-300 text-xs font-bold rounded-full">{s}</span>
                        ))}
                        {person.skills.length > 3 && (
                            <span className="px-2 py-1 text-zinc-500 text-xs font-bold">+{person.skills.length - 3}</span>
                        )}
                        </div>
                    ) : (
                        <span className="text-xs text-zinc-600 font-medium">No skills listed</span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    {person.experience_level ? (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-orange-500">
                        <ShieldCheck className="h-4 w-4" /> {person.experience_level}
                        </div>
                    ) : (
                        <div className="text-xs font-medium text-zinc-600">Pending Verification</div>
                    )}
                    <button
                        onClick={() => setSelectedUserId(person.id)}
                        className="text-sm font-bold text-white hover:text-orange-400 transition-colors"
                    >
                        Inspect &rarr;
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
            {people.length === 0 && !loading && (
              <div className="col-span-3 surface-card p-16 text-center shadow-none bg-[#0a0a0a]">
                <Sparkles className="h-10 w-10 mx-auto mb-4 text-zinc-700" />
                 <p className="text-lg font-bold text-white mb-2">No builders found</p>
                <p className="text-sm text-zinc-500">Try removing filters to widen your search.</p>
              </div>
            )}
          </div>
        )}

        {/* Create Team Modal */}
        <AnimatePresence>
          {showCreate && (
            <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="surface-card p-8 w-full max-w-lg">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-white tracking-tight">Create Team</h2>
                  <button onClick={() => setShowCreate(false)} className="w-8 h-8 rounded-full bg-[#161616] border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-orange-500 hover:border-orange-500 transition-all"><X className="h-4 w-4" /></button>
                </div>
                <form onSubmit={handleCreateTeam} className="space-y-5">
                  <div>
                    <label className="text-xs font-bold text-zinc-500 mb-2 block uppercase tracking-wider">Team Designation</label>
                    <input autoFocus value={createForm.name} onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))} placeholder="E.g. Protocol Apollo" required className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-700 focus:outline-none focus:border-orange-500 focus:shadow-[0_0_15px_rgba(255,107,0,0.2)] transition-all font-medium" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-500 mb-2 block uppercase tracking-wider">Target Hackathon <span className="text-zinc-700">(Optional)</span></label>
                    <input value={createForm.hackathon_name} onChange={(e) => setCreateForm((f) => ({ ...f, hackathon_name: e.target.value }))} placeholder="E.g. ETHGlobal" className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-700 focus:outline-none focus:border-orange-500 focus:shadow-[0_0_15px_rgba(255,107,0,0.2)] transition-all font-medium" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-500 mb-2 block uppercase tracking-wider">Mission Payload</label>
                    <textarea value={createForm.description} onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))} rows={3} placeholder="What problem are you solving?" className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-700 focus:outline-none focus:border-orange-500 focus:shadow-[0_0_15px_rgba(255,107,0,0.2)] transition-all resize-none font-medium" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-500 mb-3 block uppercase tracking-wider">Required Competencies</label>
                    <div className="flex flex-wrap gap-2.5">
                      {SKILLS.map((s) => (
                        <button key={s} type="button"
                          onClick={() => setCreateForm((f) => ({ ...f, required_skills: f.required_skills.includes(s) ? f.required_skills.filter((x) => x !== s) : [...f.required_skills, s] }))}
                          className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${createForm.required_skills.includes(s) ? 'bg-orange-500 border-orange-500 text-white shadow-[0_0_10px_rgba(255,107,0,0.3)]' : 'bg-[#111] border-white/5 text-zinc-400 hover:text-white hover:border-white/20'}`}
                        >{s}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-500 mb-2 block uppercase tracking-wider">Fleet Size (Max Members)</label>
                    <select value={createForm.max_members} onChange={(e) => setCreateForm((f) => ({ ...f, max_members: +e.target.value }))} className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 font-medium">
                      {[2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n} Operators</option>)}
                    </select>
                  </div>
                  <button type="submit" disabled={creating} className="w-full py-4 mt-4 btn-primary rounded-xl flex items-center justify-center gap-2 text-base shadow-[0_5px_20px_rgba(255,107,0,0.3)] disabled:opacity-50">
                    {creating ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Create Team'}
                  </button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
