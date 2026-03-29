import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usersApi } from '../lib/api';
import { motion } from 'framer-motion';
import {
  Save, Github, Linkedin, Briefcase, Star, BookOpen,
  Loader2, CheckCircle, Camera, ImagePlus, X, Rocket
} from 'lucide-react';
import Sidebar from '../components/Sidebar';

const SKILLS = ['AI/ML', 'Web Dev', 'Backend', 'UI/UX', 'Data Science', 'Mobile Dev', 'DevOps', 'Blockchain', 'Cybersecurity', 'Other'];
const EXPERIENCE = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
const HACKATHON_INTERESTS = ['HealthTech', 'FinTech', 'EdTech', 'GreenTech', 'AI', 'Web3', 'Open Source', 'Social Impact', 'GameDev'];

export default function ProfileBuilder() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Image upload states
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    full_name: '',
    college: '',
    bio: '',
    experience_level: '',
    github_url: '',
    linkedin_url: '',
    skills: [] as string[],
    hackathon_interests: [] as string[],
  });

  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name || '',
        college: user.college || '',
        bio: user.bio || '',
        experience_level: user.experience_level || '',
        github_url: user.github_url || '',
        linkedin_url: user.linkedin_url || '',
        skills: user.skills || [],
        hackathon_interests: user.hackathon_interests || [],
      });
      if (user.avatar_url) setAvatarPreview(user.avatar_url);
      if ((user as any).cover_url) setCoverPreview((user as any).cover_url);
    }
  }, [user]);

  const toggleItem = (list: 'skills' | 'hackathon_interests', item: string) => {
    setForm((prev) => {
      const current = prev[list];
      return {
        ...prev,
        [list]: current.includes(item) ? current.filter((s) => s !== item) : [...current, item],
      };
    });
  };

  const validateFile = (file: File): string | null => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) return 'Only JPG, PNG, and WebP files are allowed.';
    if (file.size > 5 * 1024 * 1024) return 'File must be under 5MB.';
    return null;
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateFile(file);
    if (err) { setUploadError(err); return; }
    setUploadError('');

    // Show local preview immediately
    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);

    setAvatarUploading(true);
    try {
      const updated = await usersApi.uploadAvatar(file);
      setAvatarPreview(updated.avatar_url || objectUrl);
      await refreshUser();
    } catch {
      setUploadError('Avatar upload failed. Please try again.');
      setAvatarPreview(user?.avatar_url || null);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateFile(file);
    if (err) { setUploadError(err); return; }
    setUploadError('');

    const objectUrl = URL.createObjectURL(file);
    setCoverPreview(objectUrl);

    setCoverUploading(true);
    try {
      const updated = await usersApi.uploadCover(file);
      setCoverPreview((updated as any).cover_url || objectUrl);
      await refreshUser();
    } catch {
      setUploadError('Cover upload failed. Please try again.');
      setCoverPreview((user as any)?.cover_url || null);
    } finally {
      setCoverUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await usersApi.updateMe(form);
      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarUploading(true);
    try {
      await usersApi.updateMe({ avatar_url: null } as any);
      setAvatarPreview(null);
      await refreshUser();
    } catch {
      setUploadError('Failed to remove avatar.');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleRemoveCover = async () => {
    setCoverUploading(true);
    try {
      await usersApi.updateMe({ cover_url: null } as any);
      setCoverPreview(null);
      await refreshUser();
    } catch {
      setUploadError('Failed to remove cover photo.');
    } finally {
      setCoverUploading(false);
    }
  };

  return (
    <div className="flex min-h-screen premium-bg text-white font-[Space_Grotesk]">
      <Sidebar />
      <main className="md:ml-64 flex-1 pb-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

          {/* ── Cover Photo ── */}
          <div className="relative h-56 md:h-72 w-full group overflow-hidden bg-[#050505]">
            {coverPreview ? (
              <img
                src={coverPreview}
                alt="Cover"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-[#111]/80 to-[#000]/90 z-10" />
                <div className="absolute inset-0 z-0 flex items-center justify-center">
                    <div className="w-96 h-96 bg-orange-600/10 blur-[100px] rounded-full" />
                </div>
                <div className="absolute inset-0 opacity-10 z-[5]"
                  style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,107,0,0.4) 1px, transparent 0)', backgroundSize: '40px 40px' }}
                />
              </div>
            )}

            {/* Dark overlay on hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors duration-300 z-20 pointer-events-none" />

            {/* Change Cover Button */}
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              disabled={coverUploading}
              className="absolute bottom-20 right-6 flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#111]/80 backdrop-blur-md border border-white/10 text-white text-sm font-bold hover:bg-orange-500 hover:border-orange-500 transition-all opacity-0 group-hover:opacity-100 z-50 disabled:opacity-50"
            >
              {coverUploading
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <ImagePlus className="h-4 w-4" />
              }
              {coverUploading ? 'Uploading...' : 'Change Cover'}
            </button>

            {/* Remove cover button — visible on hover */}
            {coverPreview && !coverUploading && (
              <div className="absolute top-6 right-6 flex gap-3 opacity-0 group-hover:opacity-100 transition-all z-30">
                <button
                  type="button"
                  onClick={handleRemoveCover}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 backdrop-blur-md border border-red-500/20 text-red-500 text-xs font-bold hover:bg-red-500/20 transition-all"
                >
                  <X className="h-3.5 w-3.5" /> Remove Cover
                </button>
              </div>
            )}

            <input
              ref={coverInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleCoverChange}
            />
          </div>

          {/* ── Avatar + Name Header ── */}
          <div className="px-6 md:px-12 -mt-16 flex items-end gap-6 mb-8 relative z-30">
            {/* Avatar circle */}
            <div className="relative group shrink-0">
              <div className="w-32 h-32 rounded-full border-[6px] border-[#0a0a0a] shadow-[0_10px_30px_rgba(0,0,0,0.8)] overflow-hidden bg-[#111111] flex items-center justify-center text-5xl font-black text-white relative">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" loading="eager" />
                ) : (
                  <span className="text-zinc-500 drop-shadow-md">{user?.full_name?.[0]?.toUpperCase() || '?'}</span>
                )}
                {avatarUploading && (
                  <div className="absolute inset-0 bg-[#0a0a0a]/80 backdrop-blur-sm flex items-center justify-center rounded-full z-10">
                    <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                  </div>
                )}
              </div>

              {/* Camera edit overlay + remove button */}
              {!avatarUploading && (
                <>
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute inset-0 rounded-full border-[6px] border-transparent bg-black/0 group-hover:bg-black/70 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 backdrop-blur-[2px]"
                  >
                    <Camera className="h-8 w-8 text-white drop-shadow-lg" />
                  </button>
                  {avatarPreview && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="absolute bottom-1 right-1 h-8 w-8 rounded-full bg-red-500 flex items-center justify-center text-white border-[3px] border-[#0a0a0a] shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 hover:scale-110 z-20"
                      title="Remove photo"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </>
              )}
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            <div className="pb-3">
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">{user?.full_name || 'Operator Profile'}</h1>
              <p className="text-zinc-500 text-sm font-bold mt-1 uppercase tracking-widest">{user?.email}</p>
            </div>
          </div>

          {/* ── Upload Error Banner ── */}
          {uploadError && (
            <div className="mx-6 md:mx-12 mb-6 px-5 py-4 rounded-xl bg-[#111] border-l-4 border-red-500 shadow-md text-red-500 flex items-center justify-between font-bold text-sm">
              <div className="flex items-center gap-3">
                  <X className="h-5 w-5 bg-red-500/20 rounded-full p-0.5" />
                  {uploadError}
              </div>
              <button onClick={() => setUploadError('')} className="p-1 hover:bg-white/5 rounded-md transition-colors"><X className="h-4 w-4 text-zinc-500" /></button>
            </div>
          )}

          {/* Photo hints */}
          <div className="px-6 md:px-12 mb-8 flex gap-3 text-[10px] uppercase font-bold tracking-widest text-zinc-600">
            <span>Tap imagery to reconfigure • JPG/PNG/WEBP • 5MB Limit</span>
          </div>

          {/* ── Profile Form ── */}
          <form onSubmit={handleSave} className="px-6 md:px-12 space-y-8 max-w-5xl">
            {/* Basic Info */}
            <section className="bg-transparent space-y-5">
              <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                  <Briefcase className="h-5 w-5 text-orange-500" />
                  <h2 className="font-bold text-lg text-white uppercase tracking-wider">Identity & Comm Links</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div>
                  <label className="text-xs font-bold text-zinc-500 mb-2 block uppercase tracking-widest">Operator Designation *</label>
                  <input
                    value={form.full_name}
                    onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-5 py-3.5 text-white placeholder-zinc-700 font-medium focus:outline-none focus:border-orange-500 focus:shadow-[0_0_15px_rgba(255,107,0,0.15)] transition-all"
                    placeholder="E.g. JD Doe"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-500 mb-2 block uppercase tracking-widest">Affiliation / Station</label>
                  <input
                    value={form.college}
                    onChange={(e) => setForm((f) => ({ ...f, college: e.target.value }))}
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-5 py-3.5 text-white placeholder-zinc-700 font-medium focus:outline-none focus:border-orange-500 focus:shadow-[0_0_15px_rgba(255,107,0,0.15)] transition-all"
                    placeholder="E.g. MIT, Independent Builder"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-500 mb-2 block uppercase tracking-widest">Protocol Bio</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                  rows={4}
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-5 py-4 text-white placeholder-zinc-700 font-medium focus:outline-none focus:border-orange-500 focus:shadow-[0_0_15px_rgba(255,107,0,0.15)] transition-all resize-none leading-relaxed"
                  placeholder="Summarize your mission payload and operational history..."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-zinc-500 mb-2 flex items-center gap-2 uppercase tracking-widest"><Github className="h-4 w-4" /> Code Repository</label>
                  <input
                    value={form.github_url}
                    onChange={(e) => setForm((f) => ({ ...f, github_url: e.target.value }))}
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-5 py-3.5 text-white placeholder-zinc-700 font-medium focus:outline-none focus:border-orange-500 focus:shadow-[0_0_15px_rgba(255,107,0,0.15)] transition-all"
                    placeholder="https://github.com/..."
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-500 mb-2 flex items-center gap-2 uppercase tracking-widest"><Linkedin className="h-4 w-4" /> Professional Comms</label>
                  <input
                    value={form.linkedin_url}
                    onChange={(e) => setForm((f) => ({ ...f, linkedin_url: e.target.value }))}
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-5 py-3.5 text-white placeholder-zinc-700 font-medium focus:outline-none focus:border-orange-500 focus:shadow-[0_0_15px_rgba(255,107,0,0.15)] transition-all"
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
              </div>
            </section>

            {/* Skills */}
            <section className="bg-transparent space-y-5">
              <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                  <Star className="h-5 w-5 text-orange-500" />
                  <h2 className="font-bold text-lg text-white uppercase tracking-wider">Technical Capabilities</h2>
              </div>
              <p className="text-zinc-500 text-sm font-bold">Select all validated competencies.</p>
              <div className="flex flex-wrap gap-2.5 pt-2">
                {SKILLS.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleItem('skills', skill)}
                    className={`px-5 py-2.5 rounded-full text-xs font-black transition-all border uppercase tracking-wider hover:scale-105 active:scale-95 ${
                      form.skills.includes(skill)
                        ? 'bg-orange-500 border-orange-500 text-white shadow-[0_5px_15px_rgba(255,107,0,0.3)]'
                        : 'bg-[#111] border-white/5 text-zinc-400 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </section>

            {/* Experience */}
            <section className="bg-transparent space-y-5">
              <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                  <BookOpen className="h-5 w-5 text-orange-500" />
                  <h2 className="font-bold text-lg text-white uppercase tracking-wider">Clearance Level</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                {EXPERIENCE.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, experience_level: level }))}
                    className={`py-4 rounded-xl text-xs font-black transition-all border uppercase tracking-wider hover:scale-[1.02] active:scale-95 ${
                      form.experience_level === level
                        ? 'bg-[#111] border-orange-500 text-orange-500 shadow-[0_0_15px_rgba(255,107,0,0.2)]'
                        : 'bg-[#0a0a0a] border-white/5 text-zinc-500 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </section>

            {/* Hackathon Interests */}
            <section className="bg-transparent space-y-5">
              <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                  <Rocket className="h-5 w-5 text-orange-500" />
                  <h2 className="font-bold text-lg text-white uppercase tracking-wider">Mission Interests</h2>
              </div>
              <div className="flex flex-wrap gap-2.5 pt-2">
                {HACKATHON_INTERESTS.map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleItem('hackathon_interests', interest)}
                    className={`px-5 py-2.5 rounded-full text-xs font-black transition-all border uppercase tracking-wider hover:scale-105 active:scale-95 ${
                      form.hackathon_interests.includes(interest)
                        ? 'bg-[#1a1a1a] border-white/20 text-white shadow-inner shadow-white/5'
                        : 'bg-[#0a0a0a] border-white/5 text-zinc-600 hover:border-white/10 hover:text-zinc-300'
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </section>

            {/* Save */}
            <div className="flex justify-end gap-4 pb-12 pt-8 border-t border-white/5">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-8 py-4 rounded-xl border border-white/5 bg-[#111] text-zinc-400 font-bold hover:text-white hover:bg-[#161616] transition-all uppercase text-sm tracking-wider"
              >
                Abort
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-10 py-4 btn-primary rounded-xl font-black flex items-center gap-3 transition-all disabled:opacity-60 shadow-[0_5px_20px_rgba(255,107,0,0.3)] hover:shadow-[0_5px_25px_rgba(255,107,0,0.5)] uppercase text-sm tracking-widest text-white"
              >
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : saved ? <CheckCircle className="h-5 w-5 text-[#000]" /> : <Save className="h-5 w-5" />}
                {saved ? 'Synchronized' : saving ? 'Syncing...' : 'Upload Data'}
              </button>
            </div>
          </form>
        </motion.div>
      </main>
    </div>
  );
}
