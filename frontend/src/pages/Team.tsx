import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { teamsApi, notificationsApi, type Team, type UserProfile, type JoinRequest } from '../lib/api';
import { motion } from 'framer-motion';
import { Users, MessageSquare, Sparkles, Loader2, CheckCircle, XCircle, Crown, User as UserIcon, Trash2, UserPlus, Check } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import ProfileModal from '../components/ProfileModal';

export default function TeamDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [team, setTeam] = useState<Team | null>(null);
  const [suggestions, setSuggestions] = useState<UserProfile[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [acceptLoading, setAcceptLoading] = useState(false);
  const [declineLoading, setDeclineLoading] = useState(false);
  const [hasInvite, setHasInvite] = useState(false);
  const [inviteId, setInviteId] = useState<string | null>(null);

  const isLeader = team?.members?.some((m) => m.role === 'leader' && m.profiles?.id === user?.id);
  const isMember = team?.members?.some((m) => m.profiles?.id === user?.id);

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
      } else if (!currentIsLeader && !teamData.members?.some((m: any) => m.profiles?.id === user?.id)) {
        // If not a member, check if we have a pending invite
        try {
          const notifs = await notificationsApi.list();
          const invite = notifs.find(n => n.type === 'team_invite' && n.related_id === id && !n.is_read);
          setHasInvite(!!invite);
          setInviteId(invite ? invite.id : null);
        } catch (err) {
          console.error('Failed to check invites', err);
        }
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

  const handleDeleteTeam = async () => {
    if (!id || !window.confirm("Are you sure you want to delete this team? This cannot be undone.")) return;
    setDeleteLoading(true);
    try {
      await teamsApi.delete(id);
      navigate('/teams');
    } catch (err) {
      console.error(err);
      setDeleteLoading(false);
    }
  };

  const handleInvite = async (userId: string) => {
    if (!id) return;
    setActionLoading(userId);
    try {
      await teamsApi.inviteMember(id, userId);
      // Optional: show a quick toast or alert, or update local state so we don't invite twice
      alert('Invitation sent successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to send invitation.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleJoin = async () => {
    if (!id) return;
    setJoinLoading(true);
    try {
      await teamsApi.requestJoin(id);
      alert('Join request sent successfully!');
    } catch (err: any) {
      alert(err.response?.data?.detail || err.message || 'Failed to send request');
    } finally {
      setJoinLoading(false);
    }
  };

  const handleAcceptInvite = async () => {
    if (!id) return;
    setAcceptLoading(true);
    try {
      await teamsApi.acceptInvite(id);
      alert('You have successfully joined the team!');
      loadTeam(); // Reload to show team chat and remove invite buttons
    } catch (err: any) {
      alert(err.response?.data?.detail || err.message || 'Failed to accept the invite.');
    } finally {
      setAcceptLoading(false);
    }
  };

  const handleDeclineInvite = async () => {
    if (!inviteId) return;
    setDeclineLoading(true);
    try {
      await notificationsApi.markAsRead(inviteId);
      setHasInvite(false);
      setInviteId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setDeclineLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-black text-white">
      <Sidebar />
      <ProfileModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
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
              <div className="flex gap-3 mt-5 flex-wrap">
                {isMember && (
                  <button
                    onClick={() => navigate(`/chat/${team.id}`)}
                    className="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold transition-colors"
                  >
                    <MessageSquare className="h-4 w-4" /> Team Chat
                  </button>
                )}
                {isLeader && (
                  <button
                    onClick={handleDeleteTeam}
                    disabled={deleteLoading}
                    className="flex items-center gap-2 px-5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                  >
                    {deleteLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    Delete Team
                  </button>
                )}
                {!isMember && hasInvite && (
                  <div className="flex gap-2">
                    <button
                      onClick={handleAcceptInvite}
                      disabled={acceptLoading || declineLoading}
                      className="flex items-center gap-2 px-5 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                      {acceptLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      Accept Invite
                    </button>
                    <button
                      onClick={handleDeclineInvite}
                      disabled={acceptLoading || declineLoading}
                      className="flex items-center gap-2 px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-white/5 hover:border-white/20 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                      {declineLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                      Decline
                    </button>
                  </div>
                )}
                {!isMember && !hasInvite && (
                  <button
                    onClick={handleJoin}
                    disabled={joinLoading}
                    className="flex items-center gap-2 px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                  >
                    {joinLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                    Request to Join
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Members */}
              <section className="bg-zinc-900/80 border border-white/10 rounded-2xl p-5">
                <h2 className="font-semibold mb-4 flex items-center gap-2"><Users className="h-4 w-4 text-purple-400" /> Members</h2>
                <div className="space-y-3">
                  {(team.members || []).map((member) => (
                    <div key={member.profiles?.id} className="flex items-center gap-3 p-3 bg-black/30 rounded-xl hover:bg-white/5 transition-colors">
                      <button
                        onClick={() => member.profiles?.id && setSelectedUserId(member.profiles.id)}
                        className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center font-bold text-sm shrink-0 hover:scale-110 transition-transform"
                        title="View profile"
                      >
                        {member.profiles?.full_name?.[0] || '?'}
                      </button>
                      <div className="flex-1">
                        <button
                          onClick={() => member.profiles?.id && setSelectedUserId(member.profiles.id)}
                          className="font-medium text-sm text-white hover:text-purple-300 transition-colors text-left"
                        >
                          {member.profiles?.full_name}
                        </button>
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
                                <button
                                  onClick={() => req.profiles?.id && setSelectedUserId(req.profiles.id)}
                                  className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center font-bold text-sm shrink-0 hover:scale-110 transition-transform"
                                  title="View profile"
                                >
                                  {req.profiles?.full_name?.[0] || '?'}
                                </button>
                                <div>
                                    <button
                                      onClick={() => req.profiles?.id && setSelectedUserId(req.profiles.id)}
                                      className="font-medium text-sm text-white hover:text-orange-300 transition-colors text-left"
                                    >
                                      {req.profiles?.full_name || 'Unknown User'}
                                    </button>
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
                {isLeader && suggestions.length > 0 && (
                  <section className="bg-zinc-900/80 border border-white/10 rounded-2xl p-5">
                    <h2 className="font-semibold mb-4 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-amber-400" /> Suggested for Your Team
                    </h2>
                    <div className="space-y-2">
                      {suggestions.map((s) => (
                        <div key={s.id} className="flex items-center gap-3 p-3 bg-black/30 rounded-xl hover:bg-white/5 transition-colors">
                          <button
                            onClick={() => setSelectedUserId(s.id)}
                            className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center font-bold text-sm hover:scale-110 transition-transform"
                            title="View profile"
                          >
                            {s.full_name[0]}
                          </button>
                          <div className="flex-1 min-w-0">
                            <button
                              onClick={() => setSelectedUserId(s.id)}
                              className="font-medium text-sm text-white hover:text-emerald-300 transition-colors text-left"
                            >
                              {s.full_name}
                            </button>
                            <div className="flex gap-1 flex-wrap mt-0.5">
                              {((s as UserProfile & { matching_skills?: string[] }).matching_skills || []).map((skill) => (
                                <span key={skill} className="text-[10px] text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded">{skill}</span>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold text-amber-400 mr-2" title="Match Score">
                              +{(s as UserProfile & { match_score?: number }).match_score}
                            </span>
                            {isLeader && (
                              <button
                                onClick={() => handleInvite(s.id)}
                                disabled={actionLoading === s.id}
                                className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors disabled:opacity-50"
                                title="Invite to Team"
                              >
                                {actionLoading === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                              </button>
                            )}
                          </div>
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
