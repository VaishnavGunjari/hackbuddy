import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Github, Linkedin, MapPin, GraduationCap, Loader2, Zap, UserPlus, AlertCircle } from 'lucide-react';
import { usersApi, teamsApi, type UserProfile, type Team } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

interface ProfileModalProps {
  userId: string | null;
  onClose: () => void;
}

export default function ProfileModal({ userId, onClose }: ProfileModalProps) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [ledTeams, setLedTeams] = useState<Team[]>([]);
  const [invitingTo, setInvitingTo] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setError('');
    setProfile(null);
    usersApi
      .getUser(userId)
      .then(setProfile)
      .catch(() => setError('Failed to establish comms with target.'))
      .finally(() => setLoading(false));

    if (user?.id) {
      teamsApi.myTeams().then((teams) => {
        // Find teams where current user is the creator/leader
        setLedTeams(teams.filter(t => t.created_by === user.id));
      }).catch(console.error);
    }
  }, [userId, user?.id]);

  const handleInvite = async (teamId: string) => {
    if (!userId) return;
    setInvitingTo(teamId);
    try {
      await teamsApi.inviteMember(teamId, userId);
      alert('Mission proposal transmitted successfully!');
    } catch {
      alert('Failed to transmit mission proposal.');
    } finally {
      setInvitingTo(null);
    }
  };

  return (
    <AnimatePresence>
      {userId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-[440px] bg-[#050505] border border-white/10 rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden max-h-[90vh] flex flex-col relative font-[Space_Grotesk]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Background ambient glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/10 blur-[80px] rounded-full pointer-events-none" />

            {/* Cover / Header image */}
            <div className="h-40 relative overflow-hidden shrink-0 bg-[#0a0a0a]">
              {profile?.cover_url ? (
                <img
                  src={profile.cover_url}
                  alt="Cover"
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="eager"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[#111] to-[#000]" />
              )}
              {/* Subtle grid pattern overlay */}
              <div className="absolute inset-0 opacity-10"
                style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,107,0,0.4) 1px, transparent 0)', backgroundSize: '32px 32px' }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/50 to-transparent" />
              <button
                onClick={onClose}
                className="absolute top-5 right-5 h-9 w-9 rounded-full bg-[#111]/80 backdrop-blur-md flex items-center justify-center border border-white/10 text-zinc-400 hover:text-white hover:bg-orange-500 hover:border-orange-500 hover:scale-110 transition-all z-20"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Avatar */}
            <div className="px-8 -mt-16 pb-2 shrink-0 z-10 flex justify-center">
              <div className="w-[100px] h-[100px] rounded-full border-[5px] border-[#050505] shadow-[0_5px_20px_rgba(255,107,0,0.15)] overflow-hidden bg-[#111] flex items-center justify-center text-3xl font-black text-white relative">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile?.full_name} className="w-full h-full object-cover" loading="eager" />
                ) : (
                  <span className="drop-shadow-md">{profile?.full_name?.[0]?.toUpperCase() || '?'}</span>
                )}
              </div>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1 px-8 pb-8 space-y-6 flex flex-col z-10">
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                </div>
              )}

              {error && (
                <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
                    <AlertCircle className="h-10 w-10 text-red-500" />
                    <p className="text-zinc-400 text-sm font-bold uppercase tracking-widest">{error}</p>
                </div>
              )}

              {profile && !loading && (
                <div className="space-y-6 mt-1 text-center">
                  {/* Name & Role */}
                  <div>
                    <h2 className="text-[28px] font-bold text-white tracking-tight leading-none mb-2">{profile.full_name}</h2>
                    {profile.experience_level && (
                      <span className="inline-flex items-center justify-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-[#111] border border-white/5 text-orange-500 uppercase tracking-widest">
                        <Zap className="h-3.5 w-3.5" />
                        Clearance: {profile.experience_level}
                      </span>
                    )}
                  </div>

                  {/* Bio */}
                  {profile.bio && (
                    <p className="text-zinc-400 text-sm leading-relaxed mx-auto max-w-[90%] font-medium">
                      "{profile.bio}"
                    </p>
                  )}

                  {/* Details */}
                  <div className="flex flex-col items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-widest border-y border-white/5 py-4">
                    {profile.college && (
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-orange-500 shrink-0" />
                        <span>{profile.college}</span>
                      </div>
                    )}
                    {profile.hackathon_interests && profile.hackathon_interests.length > 0 && (
                      <div className="flex items-center justify-center gap-2 flex-wrap">
                        <MapPin className="h-4 w-4 text-orange-500 shrink-0" />
                        <span>{profile.hackathon_interests.join(' • ')}</span>
                      </div>
                    )}
                  </div>

                  {/* Skills */}
                  {profile.skills && profile.skills.length > 0 && (
                    <div className="text-left bg-[#111] p-5 rounded-2xl border border-white/5">
                      <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-3 border-b border-white/5 pb-2">Verified Capabilities</h4>
                      <div className="flex flex-wrap gap-2 justify-start">
                        {profile.skills.map((skill) => (
                          <span
                            key={skill}
                            className="px-3 py-1.5 bg-[#0a0a0a] border border-white/5 rounded-full text-[11px] font-bold text-white shadow-inner uppercase tracking-wider"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Links */}
                  {(profile.github_url || profile.linkedin_url) && (
                    <div className="flex gap-4">
                      {profile.github_url && (
                        <a
                          href={profile.github_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#111] border border-white/5 rounded-xl text-xs font-bold text-white hover:text-white hover:bg-[#161616] transition-all uppercase tracking-wider"
                        >
                          <Github className="h-4 w-4 text-zinc-400" /> Repository
                        </a>
                      )}
                      {profile.linkedin_url && (
                        <a
                          href={profile.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#111] border border-white/5 rounded-xl text-xs font-bold text-white hover:text-white hover:bg-[#161616] transition-all uppercase tracking-wider"
                        >
                          <Linkedin className="h-4 w-4 text-zinc-400" /> Comm Link
                        </a>
                      )}
                    </div>
                  )}

                  {/* Invite to Team (Leaders only) */}
                  {ledTeams.length > 0 && userId !== user?.id && (
                    <div className="pt-2">
                       <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-3 text-left">Deploy Protocol</h4>
                      <div className="flex flex-col gap-2.5">
                        {ledTeams.map(t => (
                          <button
                            key={t.id}
                            onClick={() => handleInvite(t.id)}
                            disabled={invitingTo === t.id}
                            className="w-full flex items-center justify-between px-5 py-3.5 bg-[#111] border border-orange-500/20 hover:border-orange-500 hover:bg-[#1a110a] text-white rounded-xl text-xs font-bold transition-all text-left uppercase tracking-wider group"
                          >
                            <span className="truncate pr-4 truncate group-hover:text-orange-400 transition-colors">Invoke "{t.name}"</span>
                            {invitingTo === t.id ? (
                              <Loader2 className="h-5 w-5 text-orange-500 animate-spin shrink-0" />
                            ) : (
                              <UserPlus className="h-5 w-5 text-zinc-500 group-hover:text-orange-500 shrink-0 transition-colors" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
