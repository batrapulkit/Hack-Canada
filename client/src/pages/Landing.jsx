import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, X, Check, MessageSquare, Calendar, Sparkles, ChevronRight, Zap, ArrowRight } from 'lucide-react';
import TractionBar from '../components/landing/TractionBar';
import ProblemSolution from '../components/landing/ProblemSolution';

import PilotTestimonials from '../components/landing/PilotTestimonials';

export default function Landing() {
    const [showVideoModal, setShowVideoModal] = useState(false);

    const handleTourClick = () => {
        if (window.Supademo) {
            window.Supademo.open('cmkvpiwkt3btt12hhchdol7do');
        } else {
            console.error('Supademo is not loaded yet');
            // Fallback: try loading the script dynamically
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/@supademo/web-embed@latest/dist/supademo-web-embed.umd.js';
            script.async = true;
            script.onload = () => {
                if (window.Supademo) {
                    window.Supademo.open('cmkvpiwkt3btt12hhchdol7do');
                }
            };
            document.head.appendChild(script);
        }
    };

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
                            <Link to="/login" className="text-slate-400 hover:text-white font-medium">Sign In</Link>
                            <a href="https://form.typeform.com/to/yoSTuh1K" target="_blank" rel="noopener noreferrer" className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 px-6 py-2.5 rounded-full font-semibold hover:shadow-lg hover:shadow-amber-500/30 transition-all">
                                Request Access
                            </a>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section - Problem-First */}
            <section className="pt-32 pb-20 px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        {/* Left Side - Bold Problem Statement */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            {/* Beta Badge */}
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold mb-6">
                                <Zap className="w-4 h-4" />
                                Live Beta • 8 Pilot Partners • 42 Spots Left
                            </div>

                            <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                                Small Agencies Need
                                <br />
                                <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">Enterprise Speed</span>
                            </h1>

                            <p className="text-xl text-slate-300 mb-4 leading-relaxed max-w-xl">
                                Clients expect instant proposals. Manual itineraries take 15+ hours.
                            </p>
                            <p className="text-2xl font-semibold text-white mb-10">
                                We give you <span className="text-amber-400">AI superpowers</span> to compete with the big players.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <a
                                    href="https://form.typeform.com/to/yoSTuh1K"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 px-8 py-4 rounded-full font-semibold text-lg hover:shadow-xl hover:shadow-amber-500/30 transition-all group"
                                >
                                    Request Beta Access
                                    <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </a>
                                <button
                                    onClick={() => document.getElementById('demo-section')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="inline-flex items-center justify-center border-2 border-white/20 text-slate-300 px-8 py-4 rounded-full font-semibold text-lg hover:border-amber-500 hover:text-amber-400 transition-all"
                                >
                                    <Play className="w-5 h-5 mr-2" />
                                    Watch Demo
                                </button>
                            </div>

                            {/* Quick Stats */}
                            <div className="mt-10 flex items-center gap-8">
                                <div>
                                    <div className="text-3xl font-bold text-white">60 sec</div>
                                    <div className="text-sm text-slate-400">Proposal time</div>
                                </div>
                                <div className="w-px h-12 bg-white/10" />
                                <div>
                                    <div className="text-3xl font-bold text-white">15+ hrs</div>
                                    <div className="text-sm text-slate-400">Saved per week</div>
                                </div>
                                <div className="w-px h-12 bg-white/10" />
                                <div>
                                    <div className="text-3xl font-bold text-white">2x</div>
                                    <div className="text-sm text-slate-400">More conversions</div>
                                </div>
                            </div>

                            {/* BVZ Badge */}
                            <div className="mt-8 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                <span className="text-sm text-slate-400">Backed by</span>
                                <span className="text-sm font-bold text-emerald-400">Brampton Venture Zone</span>
                                <span className="text-xs text-slate-500">• Toronto Metropolitan University</span>
                            </div>
                        </motion.div>

                        {/* Right Side - iPhone Frame with Tono Screenshot */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="relative"
                        >
                            {/* Glowing backdrop */}
                            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-purple-500/20 blur-3xl opacity-40" />

                            {/* iPhone 15 Pro Frame */}
                            <div className="relative mx-auto w-[380px] h-[770px] bg-slate-900 rounded-[50px] p-3 shadow-2xl scale-110">
                                {/* Dynamic Island */}
                                <div className="absolute top-6 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-full z-10" />

                                {/* Screen */}
                                <div className="relative w-full h-full bg-white rounded-[42px] overflow-hidden">
                                    <img
                                        src="/tono.png"
                                        alt="Tono AI Chat Interface"
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                </div>
                            </div>

                            {/* Floating Badge */}
                            <div className="absolute -bottom-4 -left-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 rounded-2xl shadow-xl rotate-3">
                                <div className="text-sm font-semibold">Powered by Gemini</div>
                                <div className="text-xs opacity-90">Enterprise AI, Small Agency Price</div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Traction Bar - Real Metrics */}
            <TractionBar />

            {/* Powered By - Real Integrations */}
            <section className="py-12 bg-slate-900/50 border-y border-white/5">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <p className="text-center text-sm text-slate-500 mb-8 uppercase tracking-wider">Powered by industry-leading platforms</p>
                    <div className="flex flex-wrap justify-center items-center gap-12">
                        {['Google Gemini AI', 'Expedia', 'Trip.com', 'Google Flights'].map((partner, idx) => (
                            <span key={idx} className="text-lg font-semibold text-slate-400 hover:text-white transition-colors">
                                {partner}
                            </span>
                        ))}
                    </div>
                    <p className="text-center text-xs text-slate-600 mt-6">
                        Real-time data from trusted travel platforms
                    </p>

                    {/* BVZ Badge */}
                    <div className="mt-8 flex justify-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                            <span className="text-sm text-slate-400">Backed by</span>
                            <span className="text-sm font-bold text-emerald-400">Brampton Venture Zone</span>
                            <span className="text-xs text-slate-500">• Toronto Metropolitan University</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Problem/Solution Narrative */}
            <ProblemSolution />

            {/* How It Works - Simplified */}
            <section className="py-24 px-6 lg:px-8 bg-slate-900/30">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-5xl font-bold text-center text-white mb-6">
                        How Triponic Works
                    </h2>
                    <p className="text-xl text-slate-400 text-center mb-16 max-w-2xl mx-auto">
                        From client inquiry to booked trip in 3 simple steps
                    </p>

                    <div className="grid md:grid-cols-3 gap-12">
                        {/* Step 1 */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-center"
                        >
                            <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                                <MessageSquare className="w-10 h-10 text-slate-900" />
                            </div>
                            <div className="text-sm font-bold text-amber-500 mb-2 uppercase tracking-wider">Step 1</div>
                            <h3 className="text-2xl font-bold text-white mb-3">Chat with Tono AI</h3>
                            <p className="text-slate-400 text-lg">
                                Your AI assistant understands client needs through natural conversation. No forms, no templates.
                            </p>
                        </motion.div>

                        {/* Step 2 - With Itinerary Screenshot */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="text-center"
                        >
                            <div className="mb-6">
                                <img
                                    src="/day plan.png"
                                    alt="Day-by-day itinerary"
                                    className="rounded-2xl shadow-2xl border-2 border-slate-200 transform hover:scale-105 transition-transform"
                                    style={{ maxHeight: '200px', margin: '0 auto' }}
                                    loading="lazy"
                                />
                            </div>
                            <div className="text-sm font-bold text-blue-500 mb-2 uppercase tracking-wider">Step 2</div>
                            <h3 className="text-2xl font-bold text-white mb-3">AI Generates Proposal</h3>
                            <p className="text-slate-400 text-lg">
                                Complete day-by-day itineraries in 60 seconds. Professionally formatted, ready to send.
                            </p>
                        </motion.div>

                        {/* Step 3 */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="text-center"
                        >
                            <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                                <Check className="w-10 h-10 text-white" />
                            </div>
                            <div className="text-sm font-bold text-emerald-500 mb-2 uppercase tracking-wider">Step 3</div>
                            <h3 className="text-2xl font-bold text-white mb-3">Close the Deal</h3>
                            <p className="text-slate-400 text-lg">
                                Send PDF to client, track engagement, generate invoices. All automated.
                            </p>
                        </motion.div>
                    </div>
                </div>
            </section>



            {/* Product Demo Video */}
            <section id="demo-section" className="py-24 px-6 lg:px-8 bg-slate-950">
                <div className="max-w-6xl mx-auto text-center">
                    <h2 className="text-5xl font-bold text-white mb-6">
                        See it in action
                    </h2>
                    <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto">
                        Watch how Tono AI transforms a client conversation into a professional proposal
                    </p>
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="relative mt-12"
                    >
                        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden' }}>
                            <iframe
                                src="https://drive.google.com/file/d/1gtQYjIkpQPrIWMsVcZJVu0gRDW22w8IK/preview"
                                allow="autoplay"
                                frameBorder="0"
                                allowFullScreen
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: '16px' }}
                            />
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Key Features - Condensed Bento Grid */}
            <section className="py-24 px-6 lg:px-8 bg-slate-900/30">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-5xl font-bold text-white mb-4">
                            Everything you need to run your agency
                        </h2>
                        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                            Not just an itinerary builder. A complete operating system.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Feature 1 - Large */}
                        <div className="lg:col-span-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-3xl p-8 text-slate-900">
                            <Sparkles className="w-12 h-12 mb-4 opacity-90" />
                            <h3 className="text-3xl font-bold mb-3">AI-Powered Itineraries</h3>
                            <p className="text-slate-900/80 text-lg leading-relaxed">
                                Generate comprehensive proposals in 60 seconds with AI. Save 15+ hours per week.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="bg-slate-800/50 border-2 border-white/10 rounded-3xl p-8 hover:border-amber-500/30 transition-colors">
                            <Calendar className="w-10 h-10 text-amber-500 mb-4" />
                            <h3 className="text-2xl font-bold text-white mb-3">Client CRM</h3>
                            <p className="text-slate-400">Track preferences, history, and communication. 40% increase in repeat bookings.</p>
                        </div>

                        {/* Feature 3 */}
                        <div className="bg-slate-800/50 border-2 border-white/10 rounded-3xl p-8 hover:border-amber-500/30 transition-colors">
                            <MessageSquare className="w-10 h-10 text-blue-400 mb-4" />
                            <h3 className="text-2xl font-bold text-white mb-3">White-Label</h3>
                            <p className="text-slate-400">Your brand, your colors, your domain. Clients never know you're using Triponic.</p>
                        </div>

                        {/* Feature 4 */}
                        <div className="lg:col-span-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl p-8 text-white">
                            <h3 className="text-3xl font-bold mb-3">Revenue Analytics</h3>
                            <p className="text-blue-50 text-lg">
                                Track conversions, revenue per client, and booking trends. Make data-driven decisions.
                            </p>
                        </div>
                    </div>
                </div>
            </section>


            {/* Pilot Testimonials */}
            <PilotTestimonials />


            {/* Final CTA - Urgency Focused */}
            <section className="py-24 px-6 lg:px-8 bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/20 border border-slate-900/30 text-slate-900 text-sm font-bold mb-6">
                        <Zap className="w-4 h-4" />
                        Only 42 Beta Spots Remaining
                    </div>
                    <h2 className="text-5xl font-bold text-slate-900 mb-6">
                        Join the Future of Travel Agencies
                    </h2>
                    <p className="text-xl text-slate-900/80 mb-10">
                        Lock in <span className="font-bold">lifetime early adopter pricing</span>. Invite-only beta program.
                    </p>
                    <a
                        href="https://form.typeform.com/to/yoSTuh1K"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center bg-slate-900 text-white px-10 py-5 rounded-full font-bold text-xl hover:shadow-2xl transition-all hover:scale-105"
                    >
                        Request Your Access Code
                        <ArrowRight className="ml-2 w-6 h-6" />
                    </a>
                    <p className="text-sm text-slate-900/60 mt-6">
                        Fill out our application to receive your exclusive access code • Limited availability
                    </p>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 lg:px-8 bg-slate-900 text-slate-400">
                <div className="max-w-7xl mx-auto">
                    {/* BVZ Badge Section */}
                    <div className="flex justify-center mb-8">
                        <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-slate-800/50 border border-white/10">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                <span className="text-sm text-slate-300 font-medium">Proudly part of</span>
                            </div>
                            <div className="h-6 w-px bg-white/10"></div>
                            <span className="text-white font-bold">Brampton Venture Zone</span>
                            <span className="text-xs text-slate-500">by Toronto Metropolitan University</span>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <Link to="/" className="flex items-center gap-3">
                            <img src="/Logown.png" alt="Triponic" className="h-10 w-auto" />
                            <span className="text-white font-bold text-xl">Triponic</span>
                        </Link>
                        <div className="flex gap-8 text-sm">
                            <Link to="/" className="text-slate-400 hover:text-white transition-colors">Home</Link>
                            <Link to="/pricing" className="text-slate-400 hover:text-white transition-colors">Pricing</Link>
                            <Link to="/about" className="text-slate-400 hover:text-white transition-colors">About</Link>
                            <a href="mailto:info@triponic.com" className="text-slate-400 hover:text-white transition-colors">Contact</a>
                        </div>
                        <p className="text-sm">© 2026 Triponic. All rights reserved.</p>
                    </div>
                </div>
            </footer>

            {/* Video Modal */}
            <AnimatePresence>
                {showVideoModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                        onClick={() => setShowVideoModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="relative w-full max-w-6xl bg-white rounded-2xl overflow-hidden shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setShowVideoModal(false)}
                                className="absolute top-4 right-4 z-10 w-12 h-12 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
                            >
                                <X className="w-6 h-6 text-white" />
                            </button>
                            <video
                                autoPlay
                                controls
                                className="w-full aspect-video bg-black"
                            >
                                <source src="/demo.mp4" type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
