import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
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
        <div className="min-h-screen bg-black text-white selection:bg-purple-500/30">

            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                            <Code2 className="h-5 w-5 text-white" />
                        </div>
                        HackMate
                    </Link>
                    <div className="flex items-center gap-6">
                        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-400">
                            <a href="#features" className="hover:text-white transition-colors">Features</a>
                            <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
                            <a href="#testimonials" className="hover:text-white transition-colors">Stories</a>
                        </div>

                        {user ? (
                            <div className="flex items-center gap-4">
                                <Link to="/dashboard" className="hidden md:flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                                    <LayoutGrid className="h-4 w-4" />
                                    Dashboard
                                </Link>
                                <div className="h-8 w-[1px] bg-white/10 hidden md:block" />
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold ring-2 ring-black">
                                        {user.email?.[0].toUpperCase()}
                                    </div>
                                    <button
                                        onClick={handleSignOut}
                                        className="text-sm font-medium text-red-400 hover:text-red-300 transition-colors"
                                    >
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4">
                                <Link to="/signup">
                                    <Button size="sm" className="bg-white text-black hover:bg-zinc-200 font-semibold">Get Started</Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-24 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none opacity-50" />
                <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-blue-600/10 blur-[100px] rounded-full pointer-events-none opacity-30" />

                <div className="container mx-auto px-6 relative z-10 text-center max-w-5xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs font-medium text-purple-300 mb-8 backdrop-blur-sm"
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                        </span>
                        The #1 Platform for Hackathon Teaming
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-5xl md:text-8xl font-bold tracking-tight mb-8 bg-gradient-to-br from-white via-white/90 to-zinc-500 bg-clip-text text-transparent"
                    >
                        Build your dream team <br className="hidden md:block" />
                        in <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">seconds.</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-12 leading-relaxed"
                    >
                        Stop spamming Discord servers. HackMate uses intelligent matching to pair you with developers, designers, and visionaries who share your stack and passion.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                    >
                        <Link to="/signup">
                            <Button size="lg" className="h-14 px-8 text-lg bg-white text-black hover:bg-zinc-200 rounded-full font-semibold">
                                Start Matching Now
                            </Button>
                        </Link>
                        <Link to="/dashboard">
                            <div className="group flex items-center gap-2 px-6 py-4 text-zinc-400 hover:text-white transition-colors cursor-pointer">
                                <span className="font-medium">View Demo</span>
                                <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Link>
                    </motion.div>

                    {/* Social Proof */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5, duration: 1 }}
                        className="mt-20 pt-10 border-t border-white/5"
                    >
                        <p className="text-sm text-zinc-500 mb-6 font-medium">TRUSTED BY BUILDERS FROM</p>
                        <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                            <div className="flex items-center gap-2 text-xl font-bold text-white"><Globe className="h-6 w-6" /> Google Developer groups</div>
                            <div className="flex items-center gap-2 text-xl font-bold text-white"><Code2 className="h-6 w-6" /> MLH</div>
                            <div className="flex items-center gap-2 text-xl font-bold text-white"><Zap className="h-6 w-6" /> Devpost</div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Value Prop Section (Alternating Layout) */}
            <section id="features" className="py-32 container mx-auto px-6 space-y-32">

                {/* Feature 1 */}
                <div className="flex flex-col md:flex-row items-center gap-16">
                    <div className="flex-1 space-y-8">
                        <div className="h-12 w-12 rounded-2xl bg-pink-500/10 flex items-center justify-center border border-pink-500/20">
                            <Heart className="h-6 w-6 text-pink-500" />
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold">Swipe. Match. Build.</h2>
                        <div className="space-y-6 text-lg text-zinc-400">
                            <p>
                                Searching for teammates shouldn't feel like a job interview.
                                Our interface is designed for speed and intuition.
                            </p>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3">
                                    <div className="h-6 w-6 rounded-full bg-pink-500/20 flex items-center justify-center mt-1"><ChevronRight className="h-4 w-4 text-pink-500" /></div>
                                    <span>See relevant profiles based on tech stack overlap.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="h-6 w-6 rounded-full bg-pink-500/20 flex items-center justify-center mt-1"><ChevronRight className="h-4 w-4 text-pink-500" /></div>
                                    <span>Filter by role: Frontend, Backend, Design, or PM.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="h-6 w-6 rounded-full bg-pink-500/20 flex items-center justify-center mt-1"><ChevronRight className="h-4 w-4 text-pink-500" /></div>
                                    <span>Instant excitement when you get a match.</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className="flex-1 relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-purple-500/20 blur-3xl -z-10 rounded-full" />
                        <div className="relative bg-zinc-900 border border-white/10 rounded-3xl p-6 shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500">
                            {/* Mock Card UI */}
                            <div className="aspect-[3/4] bg-zinc-950 rounded-2xl overflow-hidden relative">
                                <div className="absolute top-4 right-4 bg-black/50 backdrop-blur px-3 py-1 rounded-full text-xs border border-white/10">React • Node.js</div>
                                <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black to-transparent">
                                    <h3 className="text-2xl font-bold">Alex Chen</h3>
                                    <p className="text-zinc-400">Full Stack Developer</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Feature 2 */}
                <div className="flex flex-col md:flex-row-reverse items-center gap-16">
                    <div className="flex-1 space-y-8">
                        <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                            <Zap className="h-6 w-6 text-blue-500" />
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold">AI Powered Synergy.</h2>
                        <div className="space-y-6 text-lg text-zinc-400">
                            <p>
                                Skills aren't everything. Our AI analyzes compatibility based on past projects,
                                working styles, and hackathon goals.
                            </p>
                            <p>
                                We give you a <strong>Compatibility Score</strong> so you know who you'll click with instantly.
                            </p>
                        </div>
                        <Button variant="outline" className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10">Learn about our Algo</Button>
                    </div>
                    <div className="flex-1 relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 blur-3xl -z-10 rounded-full" />
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 transform translate-y-8">
                                <div className="text-4xl font-bold text-blue-500 mb-2">98%</div>
                                <div className="text-sm text-zinc-400">Technical Fit</div>
                            </div>
                            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
                                <div className="text-4xl font-bold text-purple-500 mb-2">High</div>
                                <div className="text-sm text-zinc-400">Velocity Potential</div>
                            </div>
                            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 col-span-2">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-sm font-medium text-green-400">Recommended Match</span>
                                </div>
                                <p className="text-xs text-zinc-500">Based on your shared interest in Generative AI and Fintech.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Grid of Other Features */}
            <section className="py-24 bg-zinc-900/30 border-y border-white/5">
                <div className="container mx-auto px-6">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold mb-4">Everything needed to win</h2>
                        <p className="text-zinc-400">From the first message to the final commit, HackMate creates the infrastructure for success.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="p-8 rounded-3xl bg-black border border-white/10 hover:border-white/20 transition-colors group">
                            <MessageSquare className="h-10 w-10 text-zinc-500 group-hover:text-white transition-colors mb-6" />
                            <h3 className="text-xl font-bold mb-3">Real-time Chat</h3>
                            <p className="text-zinc-400 leading-relaxed">Dedicated channels for every match and team. Never miss a notification with instant delivery.</p>
                        </div>
                        <div className="p-8 rounded-3xl bg-black border border-white/10 hover:border-white/20 transition-colors group">
                            <Users className="h-10 w-10 text-zinc-500 group-hover:text-white transition-colors mb-6" />
                            <h3 className="text-xl font-bold mb-3">Group Formation</h3>
                            <p className="text-zinc-400 leading-relaxed">Scale up from a duo to a squad. Easily merge groups and assign roles to every member.</p>
                        </div>
                        <div className="p-8 rounded-3xl bg-black border border-white/10 hover:border-white/20 transition-colors group">
                            <Shield className="h-10 w-10 text-zinc-500 group-hover:text-white transition-colors mb-6" />
                            <h3 className="text-xl font-bold mb-3">Verified Profiles</h3>
                            <p className="text-zinc-400 leading-relaxed">Connect GitHub and LinkedIn to verify skills. No more teammates who can't ship code.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-32 container mx-auto px-6 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-purple-900/20 pointer-events-none" />
                <h2 className="text-5xl md:text-6xl font-bold mb-8 tracking-tight">Ready to ship?</h2>
                <p className="text-xl text-zinc-400 mb-12 max-w-xl mx-auto">
                    Join 10,000+ developers finding their perfect hackathon partners today.
                </p>
                <Link to="/signup">
                    <Button size="lg" className="h-16 px-10 text-xl bg-white text-black hover:bg-zinc-200 rounded-full">
                        Get Started for Free
                    </Button>
                </Link>
                <p className="mt-8 text-sm text-zinc-500">No credit card required • Open Source</p>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/10 py-12 bg-black">
                <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-zinc-500 text-sm">
                    <div className="flex items-center gap-2 mb-4 md:mb-0">
                        <div className="h-6 w-6 rounded bg-zinc-800 flex items-center justify-center">
                            <Code2 className="h-3 w-3 text-zinc-400" />
                        </div>
                        <span className="font-semibold text-zinc-300">HackMate</span>
                    </div>
                    <div className="flex gap-8">
                        <a href="#" className="hover:text-white transition-colors">Twitter</a>
                        <a href="#" className="hover:text-white transition-colors">GitHub</a>
                        <a href="#" className="hover:text-white transition-colors">Discord</a>
                    </div>
                    <p className="mt-4 md:mt-0">&copy; 2026 HackMate Inc. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
