import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Brain, Code, Users, Lock, Zap, ArrowRight, Award, Sparkles } from 'lucide-react';

export default function About() {
    return (
        <div className="min-h-screen bg-slate-950 font-sans text-slate-100">
            {/* Navigation */}
            <nav className="fixed w-full z-50 bg-slate-950/80 backdrop-blur-lg border-b border-white/10">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link to="/" className="flex items-center gap-3">
                            <img src="/Logown.png" alt="Triponic" className="h-12 w-auto" />
                            <span className="text-white font-bold text-2xl">Triponic</span>
                        </Link>
                        <div className="flex items-center gap-8">
                            <Link to="/" className="text-slate-400 hover:text-white font-medium">Home</Link>
                            <Link to="/login" className="text-slate-400 hover:text-white font-medium">Sign In</Link>
                            <a href="https://form.typeform.com/to/yoSTuh1K" target="_blank" rel="noopener noreferrer" className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 px-6 py-2.5 rounded-full font-semibold hover:shadow-lg hover:shadow-amber-500/30 transition-all">
                                Request Access
                            </a>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-16 px-6 lg:px-8">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 text-blue-400 text-sm font-semibold mb-6">
                            <Shield className="w-4 h-4" />
                            Security Experts Building Travel Tech
                        </div>
                        <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                            Built by Engineers Who Understand
                            <br />
                            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                                Security & Scale
                            </span>
                        </h1>
                        <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
                            We're a team of information security and AI experts who realized travel agencies were running on outdated, insecure tools. We built the operating system to fix it.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* The Problem We Saw */}
            <section className="py-16 px-6 lg:px-8 bg-slate-900/30">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold text-white mb-4">The Problem We Saw</h2>
                        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                            Travel agencies handle sensitive client data on Excel spreadsheets and Gmail threads
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            {
                                icon: Lock,
                                title: 'Data Security Nightmare',
                                description: 'Passports, credit cards, and personal data stored in unsecured files',
                                color: 'from-red-500 to-orange-500'
                            },
                            {
                                icon: Code,
                                title: 'No Real Technology',
                                description: 'Manual workflows that should be automated with modern AI',
                                color: 'from-yellow-500 to-amber-500'
                            },
                            {
                                icon: Zap,
                                title: 'No Competitive Edge',
                                description: 'Small agencies losing to enterprises with better tech infrastructure',
                                color: 'from-purple-500 to-pink-500'
                            }
                        ].map((problem, index) => {
                            const Icon = problem.icon;
                            return (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className="bg-slate-800/50 border border-white/10 rounded-2xl p-6"
                                >
                                    <div className={`w-12 h-12 bg-gradient-to-br ${problem.color} rounded-xl flex items-center justify-center mb-4`}>
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">{problem.title}</h3>
                                    <p className="text-slate-400">{problem.description}</p>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Meet the Founders */}
            <section className="py-24 px-6 lg:px-8 bg-slate-950">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">Meet the Team</h2>
                        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                            Security experts and AI engineers building the future of travel operations
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-12">
                        {/* Founder 1 - Pulkit */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-2 border-blue-500/30 rounded-3xl p-8"
                        >
                            <div className="flex items-start gap-4 mb-6">
                                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-xl">
                                    PB
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-white mb-1">Pulkit Batra</h3>
                                    <p className="text-blue-400 font-semibold">Co-Founder & CEO</p>
                                    <p className="text-sm text-slate-400">Information Security & AI</p>
                                </div>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div className="flex items-start gap-3">
                                    <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-1" />
                                    <p className="text-slate-300">
                                        <span className="font-semibold text-white">Security-First Mindset:</span> Background in information security ensures your client data is protected with enterprise-grade encryption and compliance.
                                    </p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Brain className="w-5 h-5 text-purple-400 flex-shrink-0 mt-1" />
                                    <p className="text-slate-300">
                                        <span className="font-semibold text-white">AI Architecture:</span> Built Triponic's AI engine using Google Gemini and custom NLP models to understand travel industry nuances.
                                    </p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Code className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" />
                                    <p className="text-slate-300">
                                        <span className="font-semibold text-white">Full-Stack Engineer:</span> Architected the entire platform from database to API to frontend for maximum performance and security.
                                    </p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/10">
                                <p className="text-sm text-slate-400 italic">
                                    "Agencies shouldn't have to choose between speed and security. We built Triponic to give them both."
                                </p>
                            </div>
                        </motion.div>

                        {/* Founder 2 - Harpreet */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="bg-gradient-to-br from-emerald-900/20 to-teal-900/20 border-2 border-emerald-500/30 rounded-3xl p-8"
                        >
                            <div className="flex items-start gap-4 mb-6">
                                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-xl">
                                    HS
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-white mb-1">Harpreet Singh</h3>
                                    <p className="text-emerald-400 font-semibold">Co-Founder & CTO</p>
                                    <p className="text-sm text-slate-400">Data Science & ML Engineering</p>
                                </div>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div className="flex items-start gap-3">
                                    <Brain className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-1" />
                                    <p className="text-slate-300">
                                        <span className="font-semibold text-white">Data Science DNA:</span> Specializes in machine learning pipelines that power Triponic's intelligent itinerary recommendations and pricing optimization.
                                    </p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Sparkles className="w-5 h-5 text-teal-400 flex-shrink-0 mt-1" />
                                    <p className="text-slate-300">
                                        <span className="font-semibold text-white">AI Model Training:</span> Builds and fine-tunes custom models that understand traveler preferences and booking patterns.
                                    </p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Zap className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-1" />
                                    <p className="text-slate-300">
                                        <span className="font-semibold text-white">Performance Engineering:</span> Optimizes backend infrastructure to handle thousands of concurrent AI requests with sub-second response times.
                                    </p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/10">
                                <p className="text-sm text-slate-400 italic">
                                    "Data science isn't just about algorithms. It's about understanding what agencies actually need to close more deals."
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Technical Excellence */}
            <section className="py-24 px-6 lg:px-8 bg-slate-900/30">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">Why Agencies Trust Us</h2>
                        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                            We built Triponic with the same security standards as banks and fintech companies
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {[
                            {
                                icon: Shield,
                                title: 'Enterprise-Grade Security',
                                points: [
                                    'End-to-end encryption for all client data',
                                    'SOC 2 Type II compliance roadmap',
                                    'Regular security audits and penetration testing',
                                    'Role-based access control (RBAC)'
                                ]
                            },
                            {
                                icon: Brain,
                                title: 'Advanced AI Technology',
                                points: [
                                    'Google Gemini AI for natural language understanding',
                                    'Custom ML models trained on travel data',
                                    'Real-time integration with Expedia, Trip.com, Google Flights',
                                    'Continuously improving recommendation engine'
                                ]
                            },
                            {
                                icon: Zap,
                                title: 'Built for Scale',
                                points: [
                                    'Cloud-native architecture (auto-scaling)',
                                    '99.9% uptime SLA',
                                    'Sub-second API response times',
                                    'Handles thousands of concurrent users'
                                ]
                            },
                            {
                                icon: Users,
                                title: 'Agency-First Design',
                                points: [
                                    'Built with industry professionals, not just for them',
                                    'White-label options for brand preservation',
                                    'Multi-user workspaces and collaboration',
                                    'Dedicated support for beta partners'
                                ]
                            }
                        ].map((feature, index) => {
                            const Icon = feature.icon;
                            return (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className="bg-slate-800/50 border border-white/10 rounded-2xl p-8"
                                >
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                                            <Icon className="w-6 h-6 text-white" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white">{feature.title}</h3>
                                    </div>
                                    <ul className="space-y-3">
                                        {feature.points.map((point, i) => (
                                            <li key={i} className="flex items-start gap-2">
                                                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                                                <span className="text-slate-300">{point}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Press Coverage - Real Media Mentions */}
            <section className="py-20 px-6 lg:px-8 bg-slate-950 border-y border-white/5">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 text-amber-400 text-sm font-semibold mb-6">
                            <Award className="w-4 h-4" />
                            Featured In
                        </div>
                        <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">Press Coverage</h2>
                        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                            Industry recognition for bringing AI innovation to travel planning
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                        {[
                            {
                                outlet: 'EIN Presswire',
                                title: 'Triponic Introduces New AI Travel Planning Platform',
                                url: 'https://www.einpresswire.com/article/870452787/triponic-introduces-new-ai-travel-planning-platform-for-clear-and-organised-trip-planning',
                                date: 'December 2024'
                            },
                            {
                                outlet: 'Tom.Travel',
                                title: 'Triponic déploie son IA pour simplifier la planification',
                                url: 'https://www.tom.travel/2025/12/22/triponic-deploie-son-ia-pour-simplifier-la-planification-de-voyages/',
                                date: 'December 2024'
                            },
                            {
                                outlet: 'IssueWire',
                                title: 'Bringing Clarity Back to Travel Planning with AI',
                                url: 'https://www.issuewire.com/triponic-is-bringing-clarity-back-to-travel-planning-with-ai-powered-tools-1849809946675855',
                                date: 'December 2024'
                            },
                            {
                                outlet: 'openPR',
                                title: 'Triponic Revolutionizes Travel Planning with Smart AI',
                                url: 'https://www.openpr.com/news/4287785/triponic-revolutionizes-travel-planning-with-smart-ai',
                                date: 'December 2024'
                            },
                            {
                                outlet: 'PRLog',
                                title: 'AI-Powered Tools for Clear Trip Planning',
                                url: 'https://www.prlog.org/13113169-triponic-is-bringing-clarity-back-to-travel-planning-with-ai-powered-tools.html',
                                date: 'December 2024'
                            }
                        ].map((article, index) => (
                            <motion.a
                                key={index}
                                href={article.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-slate-800/50 border border-white/10 rounded-2xl p-6 hover:border-amber-500/30 transition-all hover:scale-105 group"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="text-sm font-bold text-amber-400 uppercase tracking-wider">
                                        {article.outlet}
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2 group-hover:text-amber-400 transition-colors">
                                    {article.title}
                                </h3>
                                <p className="text-xs text-slate-500">{article.date}</p>
                            </motion.a>
                        ))}
                    </div>

                    <div className="text-center">
                        <p className="text-slate-500 text-sm">
                            Recognized by leading industry publications for innovation in travel technology
                        </p>
                    </div>
                </div>
            </section>

            {/* The Mission */}
            <section className="py-24 px-6 lg:px-8 bg-gradient-to-br from-blue-900/20 to-purple-900/20">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <Award className="w-16 h-16 text-blue-400 mx-auto mb-6" />
                        <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">Our Mission</h2>
                        <p className="text-2xl lg:text-3xl text-slate-300 leading-relaxed mb-8">
                            We're building the <span className="text-white font-bold">operating system</span> for the next generation of travel agencies.
                        </p>
                        <p className="text-lg text-slate-400 leading-relaxed">
                            Small agencies shouldn't need a team of engineers to compete with Expedia. With Triponic, they get enterprise-level AI, security, and automation without the enterprise complexity or cost.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 px-6 lg:px-8 bg-slate-950">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl font-bold text-white mb-6">
                        Ready to see what we've built?
                    </h2>
                    <p className="text-xl text-slate-400 mb-10">
                        Join our exclusive beta program and work directly with our founders
                    </p>
                    <a
                        href="https://form.typeform.com/to/yoSTuh1K"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600 text-white px-10 py-5 rounded-full font-bold text-xl hover:shadow-2xl transition-all hover:scale-105"
                    >
                        Request Beta Access
                        <ArrowRight className="ml-2 w-6 h-6" />
                    </a>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 lg:px-8 bg-slate-900 text-slate-400 border-t border-white/10">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <Link to="/" className="flex items-center gap-3">
                            <img src="/Logown.png" alt="Triponic" className="h-10 w-auto" />
                            <span className="text-white font-bold text-xl">Triponic</span>
                        </Link>
                        <div className="flex gap-8 text-sm">
                            <Link to="/" className="hover:text-white transition-colors">Home</Link>
                            <Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link>
                            <Link to="/about" className="hover:text-white transition-colors">About</Link>
                            <a href="mailto:info@triponic.com" className="hover:text-white transition-colors">Contact</a>
                        </div>
                        <p className="text-sm">© 2025 Triponic. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
