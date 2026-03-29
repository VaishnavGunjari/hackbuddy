import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Code2, Heart, MessageSquare, Zap, Users, ChevronRight, Globe, Shield, LayoutGrid } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Landing() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleSignOut = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="min-h-screen premium-bg text-white selection:bg-orange-500/30 overflow-x-hidden">

            {/* Top Giant Glow (Horizon Effect) */}
            <div className="absolute top-[-400px] left-1/2 -translate-x-1/2 w-[140%] h-[800px] horizon-glow rounded-[100%] pointer-events-none opacity-80" />

            {/* Navigation */}
            <nav className="fixed top-8 w-full z-50 flex justify-center px-6 pointer-events-none">
                <div className="nav-pill px-6 py-3 flex items-center justify-between gap-12 pointer-events-auto">
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="text-orange-500 px-1 py-0.5 rounded shadow-sm shadow-orange-500/20 bg-orange-500/10">
                            <Code2 className="h-4 w-4" />
                        </div>
                        <span className="font-bold tracking-tight text-white group-hover:text-orange-400 transition-colors">HackMate</span>
                    </Link>

                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
                        <a href="#features" className="hover:text-white transition-colors">Features</a>
                        <a href="#how-it-works" className="hover:text-white transition-colors">Match Advantage</a>
                        <a href="#stories" className="hover:text-white transition-colors">Stories</a>
                        <a href="#" className="hover:text-white transition-colors">FAQ</a>
                    </div>

                    <div className="flex items-center">
                        {user ? (
                            <Link to="/dashboard">
                                <button className="btn-primary px-6 py-2 text-sm font-bold shadow-lg shadow-orange-500/20">
                                    Dashboard
                                </button>
                            </Link>
                        ) : (
                            <Link to="/signup">
                                <button className="btn-primary px-6 py-2 text-sm font-bold shadow-lg shadow-orange-500/20">
                                    Get Started
                                </button>
                            </Link>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-48 pb-24 z-10">
                <div className="container mx-auto px-6 text-center max-w-5xl">

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="text-6xl md:text-[5.5rem] leading-[1.1] font-bold tracking-tight mb-8 text-white"
                    >
                        <span className="text-orange-glow">HackMate</span> Build Smarter,<br className="hidden md:block" />
                        Faster, Better.
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                        className="text-lg md:text-xl text-zinc-400 max-w-3xl mx-auto mb-10 leading-relaxed font-medium"
                    >
                        The first fully integrated developer matching experience. No spam, no delays — HackMate empowers you to build with top-tier talent from global hackathons entirely autonomously.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                        className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                    >
                        <Link to="/signup">
                            <button className="btn-primary px-10 py-4 text-lg font-bold shadow-xl shadow-orange-500/25">
                                Get Started
                            </button>
                        </Link>
                        <Link to="/dashboard">
                            <button className="px-10 py-4 text-lg font-bold text-white bg-[#1a1a1a] hover:bg-[#222] border border-white/10 rounded-full transition-colors shadow-lg shadow-[#000]">
                                Learn More
                            </button>
                        </Link>
                    </motion.div>

                    {/* Dashboard Preview / Mockup */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="mt-24 mx-auto max-w-5xl relative perspective-1000"
                    >
                        {/* Soft ambient orange glow behind the UI panel */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[100%] bg-orange-600/10 blur-[100px] rounded-full" />
                        
                        <div className="surface-card p-2 rounded-2xl relative z-10 border border-t-white/10 border-x-black border-b-black shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
                            <div className="bg-[#080808] rounded-xl border border-white/5 overflow-hidden">
                                {/* Mock header */}
                                <div className="h-12 bg-[#0c0c0c] border-b border-white/5 flex items-center px-4 justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-full bg-[#161616] border border-white/10 flex items-center justify-center">
                                            <Code2 className="h-4 w-4 text-orange-500" />
                                        </div>
                                        <div className="h-6 w-32 bg-[#161616] rounded-md hidden md:block" />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-[#161616] border border-white/10" />
                                        <div className="w-8 h-8 rounded-full bg-[#161616] border border-white/10" />
                                    </div>
                                </div>
                                {/* Mock body */}
                                <div className="p-8 grid grid-cols-3 gap-6 opacity-80">
                                    <div className="col-span-2 h-48 bg-[#0c0c0c] rounded-xl border border-white/5 overflow-hidden p-6 relative">
                                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-orange-500/10 to-transparent" />
                                        <div className="text-xs text-zinc-500 font-medium mb-1 uppercase tracking-wider">Active Teams Formed</div>
                                        <div className="text-4xl font-bold text-white mb-2">32,402</div>
                                        <div className="text-xs text-green-500">↑ 11% Since last month</div>
                                    </div>
                                    <div className="h-48 bg-[#0c0c0c] rounded-xl border border-white/5 p-6 flex flex-col justify-between">
                                        <div>
                                            <div className="text-xs text-zinc-500 font-medium mb-1 uppercase tracking-wider">Success Rate</div>
                                            <div className="text-4xl font-bold text-white">98.4%</div>
                                        </div>
                                        <div className="h-2 w-full bg-[#161616] rounded-full overflow-hidden">
                                            <div className="h-full bg-orange-500 w-[98%]" />
                                        </div>
                                    </div>
                                    <div className="h-32 bg-[#0c0c0c] rounded-xl border border-white/5" />
                                    <div className="h-32 bg-[#0c0c0c] rounded-xl border border-white/5" />
                                    <div className="h-32 bg-[#0c0c0c] rounded-xl border border-white/5" />
                                </div>
                            </div>
                        </div>
                    </motion.div>

                </div>
            </section>

            {/* Sub-Feature Section (Orange Glow Cards) */}
            <section id="features" className="py-24 relative z-10 pt-48">
                <div className="container mx-auto px-6 max-w-6xl">
                    <div className="text-center mb-16">
                        <div className="inline-block px-4 py-1.5 rounded-full border border-orange-500/30 text-orange-500 text-xs font-bold uppercase tracking-widest mb-6 bg-orange-500/5">
                            The HackMate Advantage
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                            Unlock the Full Power of <br/> Developer Synergy
                        </h2>
                        <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
                            HackMate isn't just another Discord server. It's a fundamentally new way to form teams — deeply integrated, fully autonomous, and built for speed, transparency, and shipping code.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
                        <div className="surface-card p-8 surface-hover group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-[50px] rounded-full group-hover:bg-orange-500/20 transition-colors" />
                            <Zap className="h-8 w-8 text-white mb-6" />
                            <h3 className="text-xl font-bold text-white mb-3">Fastest Formation</h3>
                            <p className="text-zinc-400 text-sm leading-relaxed">
                                No delays. HackMate analyzes your tech stack and perfectly pairs you with complementary builders in milliseconds. No middleman.
                            </p>
                        </div>
                        <div className="surface-card p-8 surface-hover group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-[50px] rounded-full group-hover:bg-orange-500/20 transition-colors" />
                            <Shield className="h-8 w-8 text-white mb-6" />
                            <h3 className="text-xl font-bold text-white mb-3">The Safest Environment</h3>
                            <p className="text-zinc-400 text-sm leading-relaxed">
                                We verify Github and LinkedIn accounts natively. You only match with real developers who actually ship. No spam accounts allowed.
                            </p>
                        </div>
                        <div className="surface-card p-8 surface-hover group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-[50px] rounded-full group-hover:bg-orange-500/20 transition-colors" />
                            <Users className="h-8 w-8 text-white mb-6" />
                            <h3 className="text-xl font-bold text-white mb-3">Streamlined Experience</h3>
                            <p className="text-zinc-400 text-sm leading-relaxed">
                                From the first chat to the GitHub repo creation, everything happens seamlessly within your personalized team dashboard.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials / Stats Table Section */}
            <section id="stories" className="py-24 border-y border-white/5 bg-[#050505] relative overflow-hidden">
                <div className="absolute left-[-200px] top-1/2 -translate-y-1/2 w-96 h-96 bg-orange-600/5 blur-[120px] rounded-full pointer-events-none" />
                <div className="container mx-auto px-6 max-w-6xl relative z-10 flex flex-col md:flex-row items-center gap-16">
                    <div className="flex-1">
                        <div className="inline-block px-3 py-1 rounded-full border border-orange-500/30 text-orange-500 text-[10px] font-bold uppercase tracking-widest mb-6">
                            Referrals
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white leading-tight">
                            Build Teams. <br/> Win Prizes.
                        </h2>
                        <p className="text-zinc-400 text-lg mb-8 leading-relaxed">
                            HackMate charges absolutely nothing — and connects you with top talent representing 50% of recent large hackathon winners. The faster you build your squad, the sooner you start shipping. It's simple as that. This is how power users are dominating leaderboards completely autonomously.
                        </p>
                        
                        <div className="flex gap-4">
                            <div className="surface-card px-6 py-4 rounded-2xl border-orange-500/20 shadow-[0_5px_20px_rgba(255,107,0,0.1)]">
                                <div className="text-white font-bold mb-1">Top Rated User</div>
                                <div className="text-orange-500 text-2xl font-black">99.8%</div>
                            </div>
                            <div className="surface-card px-6 py-4 rounded-2xl">
                                <div className="text-white font-bold mb-1">Teams Actively Building</div>
                                <div className="text-white text-2xl font-black">12.4k</div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex-1 w-full">
                        <div className="surface-card rounded-2xl overflow-hidden border border-white/10 p-2">
                           <div className="bg-[#0a0a0a] rounded-xl border border-white/5">
                                <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center text-xs text-zinc-500 font-medium uppercase">
                                    <span>Top Users</span>
                                    <span>Role</span>
                                    <span>Win Velocity</span>
                                </div>
                                {[ 
                                  { n: '#001', h: 'xOx1...2a', r: 'Full Stack', v: '99%' },
                                  { n: '#002', h: 'Alx...bQ', r: 'Frontend', v: '95%' },
                                  { n: '#003', h: 'B0x...9m', r: 'Backend', v: '88%' },
                                  { n: '#004', h: 'Y0m...21', r: 'Designer', v: '85%' },
                                ].map((row, i) => (
                                    <div key={i} className={`flex justify-between items-center px-6 py-4 text-sm ${i !== 3 ? 'border-b border-white/5' : ''}`}>
                                        <div className="text-zinc-500">{row.n}</div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded-full bg-zinc-800" />
                                            <span className="text-zinc-300 font-medium">{row.h}</span>
                                        </div>
                                        <div className="text-zinc-500">{row.r}</div>
                                        <div className="font-bold text-orange-500">{row.v}</div>
                                    </div>
                                ))}
                           </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/5 py-12 bg-[#000000]">
                <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-zinc-500 text-sm">
                    <div className="flex items-center gap-2 mb-4 md:mb-0">
                        <div className="h-6 w-6 rounded border border-white/10 flex items-center justify-center bg-[#111]">
                            <Code2 className="h-3 w-3 text-white" />
                        </div>
                        <span className="font-semibold text-zinc-300 tracking-wide">HackMate</span>
                    </div>
                    <div className="flex gap-8 font-medium">
                        <a href="#" className="hover:text-white transition-colors">Platform</a>
                        <a href="#" className="hover:text-white transition-colors">Documentation</a>
                        <a href="#" className="hover:text-white transition-colors">Discord</a>
                    </div>
                    <p className="mt-4 md:mt-0 font-medium">&copy; 2026 HackMate Protocol Ltd.</p>
                </div>
            </footer>
        </div>
    );
}
