import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usersApi } from '../lib/api';
import { motion } from 'framer-motion';
import { Save, Github, Linkedin, Briefcase, Star, BookOpen, Loader2, CheckCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const SKILLS = ['AI/ML', 'Web Dev', 'Backend', 'UI/UX', 'Data Science', 'Mobile Dev', 'DevOps', 'Blockchain', 'Cybersecurity', 'Other'];
const EXPERIENCE = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
const HACKATHON_INTERESTS = ['HealthTech', 'FinTech', 'EdTech', 'GreenTech', 'AI', 'Web3', 'Open Source', 'Social Impact', 'GameDev'];

export default function ProfileBuilder() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await usersApi.updateMe(form);
      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-black text-white">
      <Sidebar />
      <main className="md:ml-64 flex-1 p-6 max-w-3xl mx-auto w-full">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold mb-1 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Build Your Profile
          </h1>
          <p className="text-zinc-400 mb-8">Help teammates find you by showcasing your skills and interests</p>

          <form onSubmit={handleSave} className="space-y-8">
            {/* Basic Info */}
            <section className="bg-zinc-900/80 border border-white/10 rounded-2xl p-6 space-y-4">
              <h2 className="font-semibold text-lg flex items-center gap-2"><Briefcase className="h-5 w-5 text-purple-400" /> Basic Info</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Full Name *</label>
                  <input
                    value={form.full_name}
                    onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/70"
                    placeholder="Alex Johnson"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">College / University</label>
                  <input
                    value={form.college}
                    onChange={(e) => setForm((f) => ({ ...f, college: e.target.value }))}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/70"
                    placeholder="MIT, IIT, etc."
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Bio</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                  rows={3}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/70 resize-none"
                  placeholder="Tell teammates what you're about..."
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block flex items-center gap-1"><Github className="h-3 w-3" /> GitHub URL</label>
                  <input
                    value={form.github_url}
                    onChange={(e) => setForm((f) => ({ ...f, github_url: e.target.value }))}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/70"
                    placeholder="https://github.com/username"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block flex items-center gap-1"><Linkedin className="h-3 w-3" /> LinkedIn URL</label>
                  <input
                    value={form.linkedin_url}
                    onChange={(e) => setForm((f) => ({ ...f, linkedin_url: e.target.value }))}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/70"
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
              </div>
            </section>

            {/* Skills */}
            <section className="bg-zinc-900/80 border border-white/10 rounded-2xl p-6 space-y-4">
              <h2 className="font-semibold text-lg flex items-center gap-2"><Star className="h-5 w-5 text-purple-400" /> Your Skills</h2>
              <p className="text-zinc-500 text-sm">Select all that apply. Teams use these to find you.</p>
              <div className="flex flex-wrap gap-2">
                {SKILLS.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleItem('skills', skill)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                      form.skills.includes(skill)
                        ? 'bg-purple-600 border-purple-500 text-white'
                        : 'bg-black/40 border-white/10 text-zinc-400 hover:border-purple-500/50 hover:text-white'
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </section>

            {/* Experience */}
            <section className="bg-zinc-900/80 border border-white/10 rounded-2xl p-6 space-y-4">
              <h2 className="font-semibold text-lg flex items-center gap-2"><BookOpen className="h-5 w-5 text-purple-400" /> Experience Level</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {EXPERIENCE.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, experience_level: level }))}
                    className={`py-3 rounded-xl text-sm font-medium transition-all border ${
                      form.experience_level === level
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-black/40 border-white/10 text-zinc-400 hover:border-blue-500/50 hover:text-white'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </section>

            {/* Hackathon Interests */}
            <section className="bg-zinc-900/80 border border-white/10 rounded-2xl p-6 space-y-4">
              <h2 className="font-semibold text-lg flex items-center gap-2">🏆 Hackathon Interests</h2>
              <div className="flex flex-wrap gap-2">
                {HACKATHON_INTERESTS.map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleItem('hackathon_interests', interest)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                      form.hackathon_interests.includes(interest)
                        ? 'bg-emerald-600 border-emerald-500 text-white'
                        : 'bg-black/40 border-white/10 text-zinc-400 hover:border-emerald-500/50 hover:text-white'
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </section>

            {/* Save */}
            <div className="flex justify-end gap-3 pb-8">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3 rounded-xl border border-white/10 text-zinc-400 hover:text-white hover:border-white/30 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold flex items-center gap-2 transition-all disabled:opacity-60 shadow-lg shadow-purple-500/25"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle className="h-4 w-4 text-green-400" /> : <Save className="h-4 w-4" />}
                {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </motion.div>
      </main>
    </div>
  );
}
