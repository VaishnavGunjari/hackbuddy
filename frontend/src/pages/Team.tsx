import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { teamsApi, type Team, type UserProfile, type JoinRequest } from '../lib/api';
import { motion } from 'framer-motion';
import { Users, MessageSquare, Sparkles, Loader2, CheckCircle, XCircle, Crown, User as UserIcon } from 'lucide-react';
import Sidebar from '../components/Sidebar';

export default function TeamDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [team, setTeam] = useState<Team | null>(null);
  const [suggestions, setSuggestions] = useState<UserProfile[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const isLeader = team?.members?.some((m) => m.role === 'leader' && m.profiles?.id === user?.id);

  useEffect(() => {
    if (!id) return;
    loadTeam();
  }, [id]);

  const loadTeam = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [teamData, suggestions] = await Promise.all([
        teamsApi.get(id),
        teamsApi.suggestMembers(id),
      ]);
      setTeam(teamData);
      setSuggestions(suggestions.slice(0, 5) as UserProfile[]);
      const currentIsLeader = teamData.members?.some((m: any) => m.role === 'leader' && m.profiles?.id === user?.id);
      if (currentIsLeader) {
        const reqs = await teamsApi.getJoinRequests(id);
        setJoinRequests(reqs);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (reqId: string) => {
    if (!id) return;
    setActionLoading(reqId);
    try {
      await teamsApi.acceptRequest(id, reqId);
      setJoinRequests((prev) => prev.filter((r) => r.id !== reqId));
      loadTeam();
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (reqId: string) => {
    if (!id) return;
    setActionLoading(reqId);
    try {
      await teamsApi.rejectRequest(id, reqId);
      setJoinRequests((prev) => prev.filter((r) => r.id !== reqId));
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-black text-white">
      <Sidebar />
      <main className="md:ml-64 flex-1 p-6">
        {loading ? (
          <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-purple-400" /></div>
        ) : !team ? (
          <p>Team not found.</p>
        ) : (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl">
            {/* Header */}
            <div className="bg-zinc-900/80 border border-white/10 rounded-2xl p-6 mb-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-2xl font-bold shadow-lg">
                  {team.name[0]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold">{team.name}</h1>
                    <div className="flex items-center gap-1 text-sm text-zinc-500">
                      <Users className="h-4 w-4" /> {(team.member_count ?? 0)}/{team.max_members}
                    </div>
                  </div>
                  {team.hackathon_name && <p className="text-purple-300 text-sm mt-1">🏆 {team.hackathon_name}</p>}
                  {team.description && <p className="text-zinc-400 mt-2">{team.description}</p>}
                  {team.required_skills && team.required_skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="text-xs text-zinc-500">Looking for:</span>
                      {team.required_skills.map((s) => (
                        <span key={s} className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs rounded-lg">{s}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => navigate(`/chat/${team.id}`)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  <MessageSquare className="h-4 w-4" /> Team Chat
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Members */}
              <section className="bg-zinc-900/80 border border-white/10 rounded-2xl p-5">
                <h2 className="font-semibold mb-4 flex items-center gap-2"><Users className="h-4 w-4 text-purple-400" /> Members</h2>
                <div className="space-y-3">
                  {(team.members || []).map((member) => (
                    <div key={member.profiles?.id} className="flex items-center gap-3 p-3 bg-black/30 rounded-xl">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                        {member.profiles?.full_name?.[0] || '?'}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{member.profiles?.full_name}</p>
                        <div className="flex gap-1 flex-wrap mt-0.5">
                          {(member.profiles?.skills || []).slice(0, 3).map((s) => (
                            <span key={s} className="text-[10px] text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded">{s}</span>
                          ))}
                        </div>
                      </div>
                      {member.role === 'leader' ? (
                        <Crown className="h-4 w-4 text-amber-400" aria-label="Team Leader" />
                      ) : (
                        <UserIcon className="h-4 w-4 text-zinc-600" aria-label="Member" />
                      )}
                    </div>
                  ))}
                </div>
              </section>

              <div className="space-y-6">
                {/* Join Requests (leader only) */}
                {isLeader && (
                  <section className="bg-zinc-900/80 border border-orange-500/20 rounded-2xl p-5">
                    <h2 className="font-semibold mb-4 text-orange-300 flex items-center gap-2">
                        ⏳ Join Requests {joinRequests.length > 0 && `(${joinRequests.length})`}
                    </h2>
                    {joinRequests.length === 0 ? (
                        <div className="text-center py-6 text-zinc-500 text-sm bg-black/20 rounded-xl border border-dashed border-white/5">
                            No pending requests at the moment.
                        </div>
                    ) : (
                        <div className="space-y-3">
                          {joinRequests.map((req) => (
                            <div key={req.id} className="flex items-center justify-between p-3 bg-black/30 rounded-xl border border-orange-500/10 hover:border-orange-500/30 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center font-bold text-sm shrink-0">
                                  {req.profiles?.full_name?.[0] || '?'}
                                </div>
                                <div>
                                    <p className="font-medium text-sm text-white">{req.profiles?.full_name || 'Unknown User'}</p>
                                    <div className="flex gap-1 flex-wrap mt-0.5">
                                      {(req.profiles?.skills || []).slice(0, 2).map((s: string) => (
                                        <span key={s} className="text-[10px] text-orange-300 bg-orange-500/10 px-1.5 py-0.5 rounded">{s}</span>
                                      ))}
                                      {(req.profiles?.skills?.length ?? 0) > 2 && (
                                        <span className="text-[10px] text-zinc-500 px-1">+{req.profiles!.skills!.length - 2} more</span>
                                      )}
                                    </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => handleAccept(req.id)} disabled={actionLoading === req.id}
                                  className="p-1.5 text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded-lg transition-colors" title="Accept">
                                  <CheckCircle className="h-5 w-5" />
                                </button>
                                <button onClick={() => handleReject(req.id)} disabled={actionLoading === req.id}
                                  className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors" title="Reject">
                                  <XCircle className="h-5 w-5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                    )}
                  </section>
                )}

                {/* Suggested Members */}
                {suggestions.length > 0 && (
                  <section className="bg-zinc-900/80 border border-white/10 rounded-2xl p-5">
                    <h2 className="font-semibold mb-4 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-amber-400" /> Suggested for Your Team
                    </h2>
                    <div className="space-y-2">
                      {suggestions.map((s) => (
                        <div key={s.id} className="flex items-center gap-3 p-3 bg-black/30 rounded-xl">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center font-bold text-sm">
                            {s.full_name[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{s.full_name}</p>
                            <div className="flex gap-1 flex-wrap mt-0.5">
                              {((s as UserProfile & { matching_skills?: string[] }).matching_skills || []).map((skill) => (
                                <span key={skill} className="text-[10px] text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded">{skill}</span>
                              ))}
                            </div>
                          </div>
                          <span className="text-xs font-bold text-amber-400">+{(s as UserProfile & { match_score?: number }).match_score}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
