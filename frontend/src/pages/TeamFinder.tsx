import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { teamsApi, usersApi, type Team, type UserProfile } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Users, ShieldCheck, Loader2, X, Sparkles } from 'lucide-react';
import Sidebar from '../components/Sidebar';

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
    <div className="flex min-h-screen bg-black text-white">
      <Sidebar />
      <main className="md:ml-64 flex-1 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-blue-400 bg-clip-text text-transparent">Team Finder</h1>
            <p className="text-zinc-400 text-sm mt-1">Discover teams and teammates for your next hackathon</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-500 hover:to-orange-500 text-white font-semibold rounded-3xl transition-all shadow-lg shadow-orange-500/25"
          >
            <Plus className="h-4 w-4" />
            Create Team
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-[#090909] rounded-3xl p-1 gap-1 w-fit mb-6">
          {(['teams', 'people'] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); }}
              className={`px-5 py-2 rounded-[32px] text-sm font-medium transition-all ${tab === t ? 'bg-orange-500 text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              {t === 'teams' ? '🏆 Teams' : '👥 People'}
            </button>
          ))}
        </div>

        {/* Search (people tab) */}
        {tab === 'people' && (
          <div className="flex gap-3 mb-6 flex-wrap">
            {SKILLS.map((skill) => (
              <button
                key={skill}
                onClick={() => { setSearchSkill(searchSkill === skill ? '' : skill); }}
                className={`px-4 py-2 rounded-3xl text-sm font-medium border transition-all ${
                  searchSkill === skill ? 'bg-orange-500 border-orange-500 text-white' : 'bg-[#090909] border-white/10 text-zinc-400 hover:border-orange-500/50'
                }`}
              >
                {skill}
              </button>
            ))}
            <button onClick={handleSearch} className="px-5 py-2 rounded-3xl bg-orange-500 text-white text-sm font-medium flex items-center gap-2">
              <Search className="h-4 w-4" /> Search
            </button>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
          </div>
        ) : tab === 'teams' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {teams.map((team, i) => (
              <motion.div key={team.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <div className="bg-[#090909]/80 border border-white/10 rounded-[32px] p-5 hover:border-orange-500/40 transition-all group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-3xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-xl font-bold shadow-lg">
                        {team.name[0]}
                      </div>
                      <div>
                        <h3 className="font-bold text-white group-hover:text-orange-300 transition-colors">{team.name}</h3>
                        <p className="text-xs text-zinc-500">{team.hackathon_name || 'Open'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-zinc-500">
                      <Users className="h-3 w-3" /> {team.member_count ?? 0}/{team.max_members}
                    </div>
                  </div>

                  {team.description && <p className="text-zinc-400 text-sm mb-3 line-clamp-2">{team.description}</p>}

                  {team.required_skills && team.required_skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {team.required_skills.map((s) => (
                        <span key={s} className="px-2.5 py-1 bg-orange-500/10 border border-orange-500/20 text-blue-300 text-xs rounded-[32px]">{s}</span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/team/${team.id}`)}
                      className="flex-1 py-2 text-sm text-zinc-300 bg-white/5 hover:bg-white/10 rounded-3xl transition-colors"
                    >
                      View Team
                    </button>
                    {team.created_by !== user?.id && (
                      <button
                        onClick={() => handleJoin(team.id)}
                        disabled={joinLoading === team.id}
                        className="flex-1 py-2 text-sm bg-orange-500 hover:bg-orange-500 text-white rounded-3xl transition-colors flex items-center justify-center gap-1 disabled:opacity-60"
                      >
                        {joinLoading === team.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Request to Join'}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {people.map((person, i) => (
              <motion.div key={person.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <div className="bg-[#090909]/80 border border-white/10 rounded-[32px] p-5 hover:border-orange-500/40 transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-xl font-bold">
                      {person.full_name[0]}
                    </div>
                    <div>
                      <h3 className="font-bold">{person.full_name}</h3>
                      <p className="text-xs text-zinc-500">{person.college || 'Independent'}</p>
                    </div>
                  </div>
                  {person.bio && <p className="text-zinc-400 text-sm mb-3 line-clamp-2">{person.bio}</p>}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {(person.skills || []).map((s) => (
                      <span key={s} className="px-2.5 py-1 bg-orange-500/10 border border-orange-500/20 text-orange-300 text-xs rounded-[32px]">{s}</span>
                    ))}
                  </div>
                  {person.experience_level && (
                    <div className="flex items-center gap-1 text-xs text-zinc-500 mt-2">
                      <ShieldCheck className="h-3 w-3" /> {person.experience_level}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
            {people.length === 0 && !loading && (
              <div className="col-span-3 text-center py-16 text-zinc-600">
                <Sparkles className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>No users found. Try a different skill filter.</p>
              </div>
            )}
          </div>
        )}

        {/* Create Team Modal */}
        <AnimatePresence>
          {showCreate && (
            <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-[#090909] border border-white/10 rounded-[32px] p-6 w-full max-w-md shadow-2xl">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-bold">Create a New Team</h2>
                  <button onClick={() => setShowCreate(false)} className="text-zinc-400 hover:text-white"><X className="h-5 w-5" /></button>
                </div>
                <form onSubmit={handleCreateTeam} className="space-y-4">
                  <input value={createForm.name} onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))} placeholder="Team Name" required className="w-full bg-black/50 border border-white/10 rounded-3xl px-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500/70" />
                  <input value={createForm.hackathon_name} onChange={(e) => setCreateForm((f) => ({ ...f, hackathon_name: e.target.value }))} placeholder="Hackathon Name (optional)" className="w-full bg-black/50 border border-white/10 rounded-3xl px-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500/70" />
                  <textarea value={createForm.description} onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))} rows={2} placeholder="What's your team building?" className="w-full bg-black/50 border border-white/10 rounded-3xl px-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500/70 resize-none" />
                  <div>
                    <label className="text-xs text-zinc-400 mb-2 block">Skills Needed</label>
                    <div className="flex flex-wrap gap-2">
                      {SKILLS.map((s) => (
                        <button key={s} type="button"
                          onClick={() => setCreateForm((f) => ({ ...f, required_skills: f.required_skills.includes(s) ? f.required_skills.filter((x) => x !== s) : [...f.required_skills, s] }))}
                          className={`px-3 py-1.5 rounded-[32px] text-xs font-medium border transition-all ${createForm.required_skills.includes(s) ? 'bg-orange-500 border-orange-500 text-white' : 'bg-black/40 border-white/10 text-zinc-400'}`}
                        >{s}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400 mb-1 block">Max Members</label>
                    <select value={createForm.max_members} onChange={(e) => setCreateForm((f) => ({ ...f, max_members: +e.target.value }))} className="w-full bg-black/50 border border-white/10 rounded-3xl px-4 py-2.5 text-white focus:outline-none">
                      {[2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n} people</option>)}
                    </select>
                  </div>
                  <button type="submit" disabled={creating} className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-500 hover:to-orange-500 text-white font-semibold rounded-3xl flex items-center justify-center gap-2 disabled:opacity-60">
                    {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Team'}
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
