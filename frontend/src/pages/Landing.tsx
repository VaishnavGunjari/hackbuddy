import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, ChevronDown, UserPlus, Cpu, Rocket, Code2, Shield, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Landing() {
    const { user } = useAuth();

    return (
        <div className="min-h-screen premium-bg text-white selection:bg-orange-500/30 overflow-x-hidden">

            {/* Top Giant Glow (Horizon Effect) */}
            <div className="absolute top-[-400px] left-1/2 -translate-x-1/2 w-[140%] h-[800px] horizon-glow rounded-[100%] pointer-events-none opacity-80" />

            {/* Navigation */}
            <nav className="fixed top-8 w-full z-50 px-8 pointer-events-none">
                <div className="max-w-7xl mx-auto flex items-center justify-between relative">
                    {/* Logo (Left Side) */}
                    <Link to="/" className="flex items-center gap-3 group pointer-events-auto">
                        <motion.img 
                            src="/logo.png" 
                            alt="Haxion Logo" 
                            className="h-8 object-contain"
                            animate={{ 
                                y: [-1, 1, -1],
                                filter: [
                                    "drop-shadow(0px 0px 2px rgba(0,255,255,0.4))", 
                                    "drop-shadow(0px 0px 8px rgba(0,255,255,0.8))", 
                                    "drop-shadow(0px 0px 2px rgba(0,255,255,0.4))"
                                ]
                            }}
                            transition={{ 
                                duration: 3, 
                                repeat: Infinity, 
                                ease: "easeInOut" 
                            }}
                        />
                        <span className="font-bold tracking-tight text-white group-hover:text-orange-400 transition-colors text-xl">Haxion</span>
                    </Link>

                    {/* Center Nav Pill */}
                    <div className="absolute left-1/2 -translate-x-1/2 nav-pill px-6 py-3 flex items-center gap-8 pointer-events-auto">
                        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
                            <a href="#features" className="hover:text-white transition-colors">Features</a>
                            <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
                            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
                        </div>
                    </div>

                    {/* Right Side Buttons */}
                    <div className="flex items-center pointer-events-auto">
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
                        <span className="text-orange-glow">Haxion</span> Build Smarter,<br className="hidden md:block" />
                        Faster, Better.
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                        className="text-lg md:text-xl text-zinc-400 max-w-3xl mx-auto mb-10 leading-relaxed font-medium"
                    >
                        The first fully integrated developer matching experience. No spam, no delays — Haxion empowers you to build with top-tier talent from global hackathons entirely autonomously.
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
                                        <div className="text-xs text-zinc-500 font-medium mb-1 uppercase tracking-wider">Platform Status</div>
                                        <div className="text-4xl font-bold text-white mb-2">Beta Live</div>
                                        <div className="text-xs text-orange-500">Early access open to all developers</div>
                                    </div>
                                    <div className="h-48 bg-[#0c0c0c] rounded-xl border border-white/5 p-6 flex flex-col justify-between">
                                        <div>
                                            <div className="text-xs text-zinc-500 font-medium mb-1 uppercase tracking-wider">Matching Engine</div>
                                            <div className="text-4xl font-bold text-white">Active</div>
                                        </div>
                                        <div className="h-2 w-full bg-[#161616] rounded-full overflow-hidden relative">
                                            <div className="absolute top-0 left-0 h-full bg-orange-500 w-full animate-pulse" />
                                        </div>
                                    </div>
                                    <div className="h-32 bg-[#0c0c0c] rounded-xl border border-white/5 flex items-center justify-center text-zinc-600 text-sm font-medium">Auto-Matching</div>
                                    <div className="h-32 bg-[#0c0c0c] rounded-xl border border-white/5 flex items-center justify-center text-zinc-600 text-sm font-medium">Skill Validation</div>
                                    <div className="h-32 bg-[#0c0c0c] rounded-xl border border-white/5 flex items-center justify-center text-zinc-600 text-sm font-medium">Team Chat</div>
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
                            The Haxion Advantage
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                            Unlock the Full Power of <br/> Developer Synergy
                        </h2>
                        <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
                            Haxion isn't just another Discord server. It's a fundamentally new way to form teams — deeply integrated, fully autonomous, and built for speed, transparency, and shipping code.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
                        <div className="surface-card p-8 surface-hover group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-[50px] rounded-full group-hover:bg-orange-500/20 transition-colors" />
                            <Zap className="h-8 w-8 text-white mb-6" />
                            <h3 className="text-xl font-bold text-white mb-3">Fastest Formation</h3>
                            <p className="text-zinc-400 text-sm leading-relaxed">
                                No delays. Haxion analyzes your tech stack and perfectly pairs you with complementary builders in milliseconds. No middleman.
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

            {/* How it Works Section - Premium */}
            <section id="how-it-works" className="py-32 relative overflow-hidden bg-[#020202]">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-orange-500/5 blur-[120px] rounded-full pointer-events-none" />
                
                <div className="container mx-auto px-6 max-w-6xl relative z-10">
                    <div className="text-center mb-24">
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-xs font-bold uppercase tracking-widest mb-6"
                        >
                            <Zap className="w-4 h-4" /> The Haxion Flow
                        </motion.div>
                        <motion.h2 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl md:text-5xl font-bold mb-6 text-white leading-tight"
                        >
                            From Solo to Squad <br/> in 3 Steps
                        </motion.h2>
                    </div>

                    <div className="space-y-24 relative">
                        {/* Connecting Line */}
                        <div className="absolute left-1/2 top-10 bottom-10 w-px bg-gradient-to-b from-orange-500/0 via-orange-500/20 to-orange-500/0 -translate-x-1/2 hidden md:block -z-10" />

                        {/* Step 1 */}
                        <div className="flex flex-col md:flex-row items-center gap-12 group">
                            <div className="flex-1 text-right md:pr-12 relative">
                                <h3 className="text-3xl font-bold text-white mb-4">Craft Your Identity</h3>
                                <p className="text-zinc-400 text-lg leading-relaxed">
                                    Set up your developer profile in seconds. Connect your GitHub, define your tech stack, and highlight the hackathon categories you want to dominate.
                                </p>
                            </div>
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-white/10 flex items-center justify-center shrink-0 shadow-2xl relative z-10 group-hover:border-orange-500/50 group-hover:shadow-[0_0_30px_rgba(255,107,0,0.2)] transition-all duration-500">
                                <UserPlus className="w-8 h-8 text-orange-500" />
                                <div className="absolute -inset-4 bg-orange-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            </div>
                            <div className="flex-1 md:pl-12 hidden md:block">
                                <div className="h-32 w-full max-w-sm bg-gradient-to-r from-white/5 to-transparent rounded-2xl border border-white/5 opacity-40 group-hover:opacity-100 transition-opacity duration-500 flex items-center px-6">
                                    <div className="w-full space-y-3">
                                        <div className="h-3 w-3/4 bg-white/10 rounded" />
                                        <div className="h-3 w-1/2 bg-white/10 rounded" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="flex flex-col md:flex-row-reverse items-center gap-12 group">
                            <div className="flex-1 text-left md:pl-12 relative">
                                <h3 className="text-3xl font-bold text-white mb-4">Algorithmic Matching</h3>
                                <p className="text-zinc-400 text-lg leading-relaxed">
                                    No more scrolling through endless Discord channels. Our proprietary matching engine pairs you with highly complementary developers based on skills, timezone, and project goals.
                                </p>
                            </div>
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-white/10 flex items-center justify-center shrink-0 shadow-2xl relative z-10 group-hover:border-orange-500/50 group-hover:shadow-[0_0_30px_rgba(255,107,0,0.2)] transition-all duration-500">
                                <Cpu className="w-8 h-8 text-orange-500" />
                                <div className="absolute -inset-4 bg-orange-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            </div>
                            <div className="flex-1 md:pr-12 hidden md:block flex justify-end">
                                <div className="h-32 w-full max-w-sm bg-gradient-to-l from-white/5 to-transparent rounded-2xl border border-white/5 opacity-40 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-end px-6 ml-auto">
                                    <div className="w-full space-y-3 flex flex-col items-end">
                                        <div className="h-3 w-full bg-orange-500/20 rounded" />
                                        <div className="h-3 w-3/4 bg-white/10 rounded" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="flex flex-col md:flex-row items-center gap-12 group">
                            <div className="flex-1 text-right md:pr-12 relative">
                                <h3 className="text-3xl font-bold text-white mb-4">Ship Code Faster</h3>
                                <p className="text-zinc-400 text-lg leading-relaxed">
                                    Jump straight into a dedicated team workspace. With integrated chat and seamless connection to your project repos, you can focus 100% on building and winning.
                                </p>
                            </div>
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-white/10 flex items-center justify-center shrink-0 shadow-2xl relative z-10 group-hover:border-orange-500/50 group-hover:shadow-[0_0_30px_rgba(255,107,0,0.2)] transition-all duration-500">
                                <Rocket className="w-8 h-8 text-orange-500" />
                                <div className="absolute -inset-4 bg-orange-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            </div>
                            <div className="flex-1 md:pl-12 hidden md:block">
                                <div className="h-32 w-full max-w-sm bg-gradient-to-r from-white/5 to-transparent rounded-2xl border border-white/5 opacity-40 group-hover:opacity-100 transition-opacity duration-500 flex items-center px-6">
                                     <div className="w-full space-y-4">
                                        <div className="flex gap-2">
                                            <div className="w-6 h-6 rounded-full bg-white/10" />
                                            <div className="h-6 w-1/2 bg-white/10 rounded-full" />
                                        </div>
                                        <div className="flex gap-2 justify-end">
                                            <div className="h-6 w-3/4 bg-orange-500/20 rounded-full" />
                                            <div className="w-6 h-6 rounded-full bg-white/10" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section id="faq" className="py-24 relative overflow-hidden bg-[#050505] border-t border-white/5">
                <div className="container mx-auto px-6 max-w-3xl relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-6 text-white">Frequently Asked Questions</h2>
                        <p className="text-zinc-400 text-lg">Everything you need to know about joining the Haxion beta.</p>
                    </div>

                    <div className="space-y-4">
                        {[
                            {
                                q: "Is Haxion free to use?",
                                a: "Yes! During our beta phase, Haxion is completely free for all developers. We want to build the best matching experience possible before thinking about monetization."
                            },
                            {
                                q: "How does the matching algorithm work?",
                                a: "Our engine analyzes your tech stack (frontend, backend, design, etc.), your timezone, and your experience level to pair you with users who perfectly complement your skills so you have a well-rounded team."
                            },
                            {
                                q: "Can I join if I already have a team?",
                                a: "Absolutely. If you have a partial team and just need a specific role (like a UI Designer or a Smart Contract Dev), you can specify exactly who you're looking for."
                            },
                            {
                                q: "Do I need a project idea to join?",
                                a: "Not at all. Many teams form around shared interests or technologies and brainstorm together. You can also join a team that already has a solid pitch."
                            },
                            {
                                q: "What happens after we match?",
                                a: "Once matched, you'll instantly get access to a private team workspace with real-time chat, where you can introduce yourselves and start building right away."
                            }
                        ].map((faq, i) => (
                            <details key={i} className="group bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden open:border-orange-500/30 transition-colors duration-300">
                                <summary className="flex items-center justify-between p-6 cursor-pointer list-none font-semibold text-white text-lg hover:text-orange-400 transition-colors [&::-webkit-details-marker]:hidden">
                                    {faq.q}
                                    <span className="transition-transform duration-300 group-open:rotate-180">
                                        <ChevronDown className="w-5 h-5 text-zinc-500 group-hover:text-orange-500" />
                                    </span>
                                </summary>
                                <div className="px-6 pb-6 text-zinc-400 leading-relaxed opacity-0 group-open:animate-fadeIn">
                                    {faq.a}
                                </div>
                            </details>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/5 py-12 bg-[#000000]">
                <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-zinc-500 text-sm">
                    <div className="flex items-center gap-2 mb-4 md:mb-0">
                        <img src="/logo.png" alt="Haxion" className="h-6 object-contain opacity-70 hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="flex gap-8 font-medium">
                        <a href="#" className="hover:text-white transition-colors">Platform</a>
                        <a href="https://discord.gg/QsPWPztx8" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Discord</a>
                    </div>
                    <p className="mt-4 md:mt-0 font-medium">&copy; 2026 Haxion Protocol Ltd.</p>
                </div>
            </footer>
        </div>
    );
}
