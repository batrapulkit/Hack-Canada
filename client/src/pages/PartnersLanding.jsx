import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useInView, useSpring, useTransform, useMotionValue } from 'framer-motion';
import {
    Sparkles, Zap, Globe, Users, BarChart3, Shield, Clock, Send,
    ChevronRight, ArrowRight, Star, CheckCircle2, Layers, Bot,
    Calendar, FileText, MessageSquare, Menu, X
} from 'lucide-react';

/* ─── Animated Counter ─── */
function AnimatedCounter({ target, suffix = '', duration = 2 }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-50px' });
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!isInView) return;
        let start = 0;
        const end = target;
        const step = Math.ceil(end / (duration * 60));
        const timer = setInterval(() => {
            start += step;
            if (start >= end) { setCount(end); clearInterval(timer); }
            else setCount(start);
        }, 1000 / 60);
        return () => clearInterval(timer);
    }, [isInView, target, duration]);

    return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ─── Floating Particle Grid ─── */
function ParticleGrid() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(40)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-1 h-1 rounded-full bg-amber-500/20"
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                        y: [0, -30, 0],
                        opacity: [0.2, 0.6, 0.2],
                    }}
                    transition={{
                        duration: 3 + Math.random() * 4,
                        repeat: Infinity,
                        delay: Math.random() * 3,
                        ease: 'easeInOut',
                    }}
                />
            ))}
            {/* Gradient grid lines */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `linear-gradient(rgba(245,158,11,0.5) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(245,158,11,0.5) 1px, transparent 1px)`,
                    backgroundSize: '60px 60px',
                }}
            />
        </div>
    );
}

/* ─── Section Reveal Wrapper ─── */
function Reveal({ children, className = '', delay = 0 }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

/* ─────────────────────── FEATURES DATA ─────────────────────── */
const features = [
    {
        icon: Bot,
        title: 'Tono AI Assistant',
        desc: 'Generate complete, day-by-day itineraries from a simple conversation. Powered by Google Gemini.',
        gradient: 'from-amber-500 to-orange-600',
        span: 'lg:col-span-2',
    },
    {
        icon: Users,
        title: 'Smart CRM',
        desc: 'Track client preferences, communication history, and booking patterns -all in one place.',
        gradient: 'from-blue-500 to-cyan-500',
    },
    {
        icon: FileText,
        title: 'Instant Invoicing',
        desc: 'Auto-generate professional invoices from itineraries. Templates built for travel agencies.',
        gradient: 'from-emerald-500 to-teal-500',
    },
    {
        icon: Globe,
        title: 'White-Label Ready',
        desc: 'Your brand, your colors, your domain. Clients never see Triponic -they see you.',
        gradient: 'from-purple-500 to-violet-600',
    },
    {
        icon: BarChart3,
        title: 'Revenue Analytics',
        desc: 'Real-time dashboards tracking conversions, revenue per client, and booking trends.',
        gradient: 'from-pink-500 to-rose-600',
        span: 'lg:col-span-2',
    },
];

const steps = [
    {
        num: '01',
        title: 'Connect Your Agency',
        desc: 'Sign up in 2 minutes. Import your existing clients or start fresh.',
        icon: Layers,
        color: 'amber',
    },
    {
        num: '02',
        title: 'Let AI Do the Work',
        desc: 'Chat with Tono to generate itineraries, proposals, and quotes instantly.',
        icon: Sparkles,
        color: 'blue',
    },
    {
        num: '03',
        title: 'Close More Deals',
        desc: 'Send polished PDFs, track engagement, and invoice -all automated.',
        icon: CheckCircle2,
        color: 'emerald',
    },
];

const testimonials = [
    {
        name: 'Ravi Sharma',
        agency: 'Wanderlust Travels',
        quote: 'Triponic cut our proposal time from hours to minutes. Our conversion rate doubled in the first month.',
        rating: 5,
    },
    {
        name: 'Dipak Patel',
        agency: 'Akshar Travels',
        quote: 'The AI itinerary builder is a game-changer. Clients are blown away by the quality and speed.',
        rating: 5,
    },
    {
        name: 'Priya Mehta',
        agency: 'Globe Setters',
        quote: 'White-label branding means my clients think I built this. The CRM and invoicing save me 15+ hours a week.',
        rating: 5,
    },
];

const stats = [
    { value: 10, suffix: '+', label: 'Partner Agencies' },
    { value: 1000, suffix: '+', label: 'Itineraries Generated' },
    { value: 20, suffix: 'hrs', label: 'Saved Per Week' },
    { value: 98, suffix: '%', label: 'Partner Satisfaction' },
];

/* ─── Lead Capture Modal ─── */
function LeadCaptureModal({ onSubmit }) {
    const [form, setForm] = useState({ name: '', email: '' });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState('');

    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = 'Name is required';
        if (!form.email.trim()) e.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email';
        return e;
    };

    const handleSubmit = async (evt) => {
        evt.preventDefault();
        const e = validate();
        if (Object.keys(e).length) { setErrors(e); return; }
        setLoading(true);
        setApiError('');
        try {
            const apiBase = import.meta.env.VITE_API_URL || '/api';
            const res = await fetch(`${apiBase}/public/waitlist`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ full_name: form.name.trim(), email: form.email.trim() }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || 'Something went wrong. Please try again.');
            }
        } catch (err) {
            setApiError(err.message);
            setLoading(false);
            return;
        }
        onSubmit(form);
    };

    return (
        <motion.div
            key="lead-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
            style={{ background: 'rgba(2,6,23,0.92)', backdropFilter: 'blur(16px)' }}
        >
            {/* Ambient glows */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 32, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.96 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="relative w-full max-w-md"
            >
                {/* Card */}
                <div className="bg-slate-900/80 backdrop-blur-2xl border border-white/[0.09] rounded-3xl p-8 shadow-2xl shadow-black/60">
                    {/* Logo + badge */}
                    <div className="flex flex-col items-center mb-8">
                        <img src="/Logown.png" alt="Triponic" className="h-10 w-auto mb-4" />
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider">
                            <Zap className="w-3 h-3" />
                            Early Partner Access
                        </div>
                    </div>

                    <h2 className="text-2xl font-extrabold text-white text-center mb-2 leading-tight">
                        See Triponic in Action
                    </h2>
                    <p className="text-slate-400 text-center text-sm mb-7 leading-relaxed">
                        Enter your details to unlock the full demo and landing page.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                        {/* Name */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Full Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Ravi Sharma"
                                value={form.name}
                                onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setErrors(er => ({ ...er, name: '' })); }}
                                className={`w-full bg-slate-800/60 border ${errors.name ? 'border-red-500/60' : 'border-white/[0.08]'
                                    } rounded-xl px-4 py-3 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all`}
                            />
                            {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Work Email</label>
                            <input
                                type="email"
                                placeholder="you@youragency.com"
                                value={form.email}
                                onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setErrors(er => ({ ...er, email: '' })); }}
                                className={`w-full bg-slate-800/60 border ${errors.email ? 'border-red-500/60' : 'border-white/[0.08]'
                                    } rounded-xl px-4 py-3 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all`}
                            />
                            {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
                        </div>

                        {/* Submit */}
                        <motion.button
                            type="submit"
                            disabled={loading}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            className="w-full mt-2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 font-bold py-3.5 rounded-xl text-sm hover:shadow-xl hover:shadow-amber-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                    </svg>
                                    Unlocking...
                                </>
                            ) : (
                                <>
                                    Unlock Full Demo
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </motion.button>
                    </form>

                    {apiError && (
                        <p className="mt-3 text-center text-xs text-red-400">{apiError}</p>
                    )}
                    <p className="mt-5 text-center text-xs text-slate-600">
                        No spam. No credit card. Just a quick look at what Triponic can do.
                    </p>
                </div>
            </motion.div>
        </motion.div>
    );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function PartnersLanding() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showStickyBar, setShowStickyBar] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
    const [hasSeenPopup, setHasSeenPopup] = useState(() => {
        try { return !!localStorage.getItem('triponic_lead'); } catch { return false; }
    });

    useEffect(() => {
        const handleScroll = () => {
            // Sticky bar logic
            setShowStickyBar(window.scrollY > 600);

            // Popup logic: show after ~35% scroll if not already seen
            if (!hasSeenPopup && !showPopup) {
                const scrolledAmount = window.scrollY;
                const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
                const scrollPercentage = scrolledAmount / totalHeight;

                if (scrollPercentage > 0.35) {
                    setShowPopup(true);
                    setHasSeenPopup(true); // Don't trigger again in this session
                }
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [hasSeenPopup, showPopup]);

    const navLinks = [
        { label: 'Features', href: '#features' },
        { label: 'How It Works', href: '#how-it-works' },
        { label: 'Testimonials', href: '#testimonials' },
        { label: 'Pricing', href: '/pricing' },
    ];

    const scrollTo = (id) => {
        setMobileMenuOpen(false);
        document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleLeadSubmit = (data) => {
        // Persist so returning visitors don't see the popup again
        try {
            localStorage.setItem('triponic_lead', JSON.stringify({ ...data, date: new Date().toISOString() }));
        } catch { }
        setShowPopup(false);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans overflow-x-hidden">
            <AnimatePresence>
                {showPopup && <LeadCaptureModal onSubmit={handleLeadSubmit} />}
            </AnimatePresence>

            {/* ═══ NAVIGATION ═══ */}
            <nav className="fixed w-full z-50 bg-slate-950/70 backdrop-blur-xl border-b border-white/[0.06]">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link to="/" className="flex items-center gap-3">
                            <img src="/Logown.png" alt="Triponic" className="h-10 w-auto" />
                            <span className="text-white font-bold text-xl tracking-tight">Triponic</span>
                        </Link>

                        {/* Desktop Nav */}
                        <div className="hidden md:flex items-center gap-8">
                            {navLinks.map((link) =>
                                link.href.startsWith('#') ? (
                                    <button
                                        key={link.label}
                                        onClick={() => scrollTo(link.href)}
                                        className="text-slate-400 hover:text-white text-sm font-medium transition-colors"
                                    >
                                        {link.label}
                                    </button>
                                ) : (
                                    <Link
                                        key={link.label}
                                        to={link.href}
                                        className="text-slate-400 hover:text-white text-sm font-medium transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                )
                            )}
                            <Link to="/login" className="text-slate-400 hover:text-white text-sm font-medium transition-colors">
                                Sign In
                            </Link>
                            <a
                                href="https://form.typeform.com/to/yoSTuh1K"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 px-5 py-2 rounded-full text-sm font-semibold hover:shadow-lg hover:shadow-amber-500/25 transition-all hover:scale-105"
                            >
                                Get Started
                            </a>
                        </div>

                        {/* Mobile toggle */}
                        <button
                            className="md:hidden text-white"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="md:hidden bg-slate-900/95 backdrop-blur-xl border-t border-white/5 px-6 py-6 space-y-4"
                    >
                        {navLinks.map((link) =>
                            link.href.startsWith('#') ? (
                                <button
                                    key={link.label}
                                    onClick={() => scrollTo(link.href)}
                                    className="block w-full text-left text-slate-300 hover:text-white font-medium py-2"
                                >
                                    {link.label}
                                </button>
                            ) : (
                                <Link
                                    key={link.label}
                                    to={link.href}
                                    className="block text-slate-300 hover:text-white font-medium py-2"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {link.label}
                                </Link>
                            )
                        )}
                        <Link to="/login" className="block text-slate-300 hover:text-white font-medium py-2" onClick={() => setMobileMenuOpen(false)}>
                            Sign In
                        </Link>
                        <a
                            href="https://form.typeform.com/to/yoSTuh1K"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-center bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 px-5 py-3 rounded-full font-semibold mt-2"
                        >
                            Get Started
                        </a>
                    </motion.div>
                )}
            </nav>

            {/* ═══ HERO ═══ */}
            <section className="relative pt-28 pb-24 lg:pt-40 lg:pb-32 px-6 lg:px-8">
                <ParticleGrid />

                {/* Ambient glow blobs */}
                <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        {/* Left copy */}
                        <motion.div
                            initial={{ opacity: 0, x: -40 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-8">
                                <Zap className="w-3.5 h-3.5" />
                                Now in Beta -Limited Spots
                            </div>

                            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-[1.08] tracking-tight mb-6">
                                The Operating System for
                                <br />
                                <span className="bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 bg-clip-text text-transparent">
                                    Modern Travel Agencies
                                </span>
                            </h1>

                            <p className="text-lg sm:text-xl text-slate-400 leading-relaxed max-w-xl mb-10">
                                AI-powered itineraries, smart CRM, invoicing, and analytics -everything your agency needs to
                                <span className="text-white font-medium"> close more deals in less time</span>.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <a
                                    href="https://form.typeform.com/to/yoSTuh1K"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 px-8 py-4 rounded-full font-bold text-lg hover:shadow-2xl hover:shadow-amber-500/30 transition-all hover:scale-[1.03] group"
                                >
                                    Request Access
                                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </a>
                                <button
                                    onClick={() => document.querySelector('#demo')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="inline-flex items-center justify-center border border-white/15 text-slate-300 px-8 py-4 rounded-full font-semibold text-lg hover:border-amber-500/40 hover:text-white transition-all backdrop-blur-sm"
                                >
                                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                                    Watch Demo
                                </button>
                            </div>

                            {/* Trust signals */}
                            <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-slate-500">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    No credit card required
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    Free during beta
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    Setup in 2 minutes
                                </div>
                            </div>
                        </motion.div>

                        {/* Right -Floating UI cards */}
                        <motion.div
                            initial={{ opacity: 0, x: 40 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                            className="relative hidden lg:block"
                        >
                            {/* Glow */}
                            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/15 via-transparent to-purple-500/15 blur-3xl" />

                            {/* Main card */}
                            <motion.div
                                animate={{ y: [0, -12, 0] }}
                                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                                className="relative bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl"
                            >
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                                        <Bot className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <div className="text-white font-semibold text-sm">Tono AI</div>
                                        <div className="text-slate-500 text-xs">Generating itinerary...</div>
                                    </div>
                                    <div className="ml-auto flex gap-1">
                                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                        <div className="w-2 h-2 rounded-full bg-amber-500/50 animate-pulse" style={{ animationDelay: '0.2s' }} />
                                        <div className="w-2 h-2 rounded-full bg-amber-500/30 animate-pulse" style={{ animationDelay: '0.4s' }} />
                                    </div>
                                </div>
                                {/* Simulated itinerary preview */}
                                <div className="space-y-3">
                                    {['Day 1 - Arrive in Bali, Seminyak check-in', 'Day 2 - Ubud rice terraces & temple tour', 'Day 3 - Mount Batur sunrise trek'].map((line, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.5 + i * 0.3 }}
                                            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06]"
                                        >
                                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold
                        ${i === 0 ? 'bg-amber-500/20 text-amber-400' : i === 1 ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                                {i + 1}
                                            </div>
                                            <span className="text-slate-300 text-sm">{line}</span>
                                        </motion.div>
                                    ))}
                                </div>
                                <div className="mt-5 flex items-center justify-between">
                                    <span className="text-xs text-slate-500">Generated in 47 seconds</span>
                                    <button className="text-xs font-semibold text-amber-400 flex items-center gap-1">
                                        Send to client <Send className="w-3 h-3" />
                                    </button>
                                </div>
                            </motion.div>

                            {/* Floating mini-card -Stats */}
                            <motion.div
                                animate={{ y: [0, 8, 0] }}
                                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                                className="absolute -bottom-6 -left-8 bg-slate-800/80 backdrop-blur-xl border border-white/10 rounded-2xl px-5 py-4 shadow-xl"
                            >
                                <div className="text-xs text-slate-500 mb-1">This week</div>
                                <div className="text-2xl font-bold text-white">24 proposals</div>
                                <div className="text-xs text-emerald-400 font-medium flex items-center gap-1 mt-1">
                                    <ArrowRight className="w-3 h-3 rotate-[-45deg]" /> +38% vs last week
                                </div>
                            </motion.div>

                            {/* Floating mini-card -Rating */}
                            <motion.div
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                                className="absolute -top-4 -right-6 bg-slate-800/80 backdrop-blur-xl border border-white/10 rounded-2xl px-5 py-4 shadow-xl"
                            >
                                <div className="flex items-center gap-1 mb-1">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                    ))}
                                </div>
                                <div className="text-white text-sm font-semibold">Client loved it!</div>
                                <div className="text-xs text-slate-500">Bali Honeymoon Package</div>
                            </motion.div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ═══ TRUSTED BY / LOGOS BAR ═══ */}
            <section className="py-10 border-y border-white/[0.04] bg-slate-900/40">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <p className="text-center text-xs text-slate-600 uppercase tracking-[0.2em] mb-6">Powered by industry-leading platforms</p>
                    <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-4">
                        {['Google Gemini AI', 'Expedia', 'Trip.com', 'Google Flights'].map((name, i) => (
                            <motion.span
                                key={i}
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="text-base font-semibold text-slate-500 hover:text-slate-300 transition-colors"
                            >
                                {name}
                            </motion.span>
                        ))}
                    </div>
                    <div className="mt-6 flex justify-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/8 border border-emerald-500/15">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-xs text-slate-400">Backed by</span>
                            <span className="text-xs font-bold text-emerald-400">Brampton Venture Zone</span>
                            <span className="text-[10px] text-slate-600">• Toronto Metropolitan University</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══ FEATURES BENTO GRID ═══ */}
            <section id="features" className="py-24 px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <Reveal>
                        <div className="text-center mb-16">
                            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400 mb-4 block">Features</span>
                            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-5">
                                Everything Your Agency Needs
                            </h2>
                            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                                Not just another itinerary tool -a complete operating system that automates your entire workflow.
                            </p>
                        </div>
                    </Reveal>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {features.map((f, i) => (
                            <Reveal key={i} delay={i * 0.08} className={f.span || ''}>
                                <div className="group relative h-full bg-slate-900/50 border border-white/[0.06] rounded-3xl p-7 hover:border-white/[0.12] transition-all duration-500 hover:shadow-2xl hover:shadow-amber-500/[0.03] overflow-hidden">
                                    {/* Subtle gradient accent on hover */}
                                    <div className={`absolute inset-0 bg-gradient-to-br ${f.gradient} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-500 rounded-3xl`} />

                                    <div className={`relative w-12 h-12 rounded-2xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-5 shadow-lg`}>
                                        <f.icon className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="relative text-xl font-bold text-white mb-2">{f.title}</h3>
                                    <p className="relative text-slate-400 leading-relaxed">{f.desc}</p>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══ CTA AFTER FEATURES ═══ */}
            <section className="py-16 px-6 lg:px-8">
                <Reveal>
                    <div className="max-w-5xl mx-auto bg-gradient-to-r from-slate-800/80 to-slate-900/80 backdrop-blur-xl border border-white/[0.08] rounded-3xl p-10 md:p-14 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="flex-1">
                            <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
                                See these features in action
                            </h3>
                            <p className="text-slate-400 text-lg">
                                Get a personalized demo and see how Triponic can transform your agency's workflow.
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                            <a
                                href="https://form.typeform.com/to/yoSTuh1K"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 px-7 py-3.5 rounded-full font-bold text-base hover:shadow-xl hover:shadow-amber-500/25 transition-all hover:scale-[1.03] group"
                            >
                                Start Free Trial
                                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </a>
                            <a
                                href="mailto:info@triponic.com"
                                className="inline-flex items-center justify-center border border-white/15 text-slate-300 px-7 py-3.5 rounded-full font-semibold text-base hover:border-amber-500/40 hover:text-white transition-all"
                            >
                                Contact Sales
                            </a>
                        </div>
                    </div>
                </Reveal>
            </section>

            {/* ═══ HOW IT WORKS ═══ */}
            <section id="how-it-works" className="py-24 px-6 lg:px-8 bg-slate-900/30">
                <div className="max-w-6xl mx-auto">
                    <Reveal>
                        <div className="text-center mb-16">
                            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400 mb-4 block">How It Works</span>
                            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-5">
                                Up and Running in Minutes
                            </h2>
                            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                                From signup to sending your first AI-generated proposal -it's that simple.
                            </p>
                        </div>
                    </Reveal>

                    <div className="grid md:grid-cols-3 gap-8 relative">
                        {/* Connecting line (desktop) */}
                        <div className="hidden md:block absolute top-16 left-[16.66%] right-[16.66%] h-px bg-gradient-to-r from-amber-500/30 via-blue-500/30 to-emerald-500/30" />

                        {steps.map((step, i) => (
                            <Reveal key={i} delay={i * 0.15}>
                                <div className="relative text-center">
                                    {/* Number circle */}
                                    <div className={`w-14 h-14 rounded-2xl bg-${step.color}-500/15 border border-${step.color}-500/20 flex items-center justify-center mx-auto mb-6 relative z-10`}
                                        style={{
                                            background: `linear-gradient(135deg, ${step.color === 'amber' ? 'rgba(245,158,11,0.15)' : step.color === 'blue' ? 'rgba(59,130,246,0.15)' : 'rgba(16,185,129,0.15)'} 0%, transparent 100%)`,
                                            borderColor: step.color === 'amber' ? 'rgba(245,158,11,0.2)' : step.color === 'blue' ? 'rgba(59,130,246,0.2)' : 'rgba(16,185,129,0.2)',
                                        }}>
                                        <step.icon className="w-6 h-6" style={{
                                            color: step.color === 'amber' ? '#f59e0b' : step.color === 'blue' ? '#3b82f6' : '#10b981',
                                        }} />
                                    </div>

                                    <div className="text-xs font-bold uppercase tracking-[0.2em] mb-3" style={{
                                        color: step.color === 'amber' ? '#f59e0b' : step.color === 'blue' ? '#3b82f6' : '#10b981',
                                    }}>
                                        Step {step.num}
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                                    <p className="text-slate-400 leading-relaxed">{step.desc}</p>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══ CTA AFTER HOW IT WORKS ═══ */}
            <section className="py-16 px-6 lg:px-8">
                <Reveal>
                    <div className="max-w-3xl mx-auto text-center">
                        <p className="text-slate-400 text-lg mb-6">
                            Ready to get started? It takes less than 2 minutes to set up.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <a
                                href="https://form.typeform.com/to/yoSTuh1K"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 px-8 py-4 rounded-full font-bold text-lg hover:shadow-xl hover:shadow-amber-500/25 transition-all hover:scale-[1.03] group"
                            >
                                Request Beta Access
                                <ChevronRight className="ml-1 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </a>
                            <Link
                                to="/pricing"
                                className="inline-flex items-center justify-center border border-white/15 text-slate-300 px-8 py-4 rounded-full font-semibold text-lg hover:border-amber-500/40 hover:text-white transition-all"
                            >
                                See Pricing Plans
                            </Link>
                        </div>
                        <div className="mt-6 flex flex-wrap justify-center gap-6 text-sm text-slate-500">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                14-day free trial
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                Cancel anytime
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                White-glove onboarding
                            </div>
                        </div>
                    </div>
                </Reveal>
            </section>

            {/* ═══ STATS ═══ */}
            <section className="py-20 px-6 lg:px-8 border-y border-white/[0.04]">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                        {stats.map((stat, i) => (
                            <Reveal key={i} delay={i * 0.1}>
                                <div className="text-center">
                                    <div className="text-4xl sm:text-5xl font-extrabold text-white mb-2">
                                        <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                                    </div>
                                    <div className="text-sm text-slate-500 font-medium">{stat.label}</div>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══ CTA AFTER STATS ═══ */}
            <section className="relative py-14 px-6 lg:px-8 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-amber-500/10" />
                <Reveal>
                    <div className="max-w-4xl mx-auto relative z-10 flex flex-col md:flex-row items-center justify-center gap-6 text-center md:text-left">
                        <div className="flex-1">
                            <h3 className="text-2xl font-bold text-white">
                                Join <span className="text-amber-400">10+ agencies</span> already growing with Triponic
                            </h3>
                        </div>
                        <a
                            href="https://form.typeform.com/to/yoSTuh1K"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center bg-white text-slate-900 px-8 py-4 rounded-full font-bold text-base hover:shadow-xl hover:shadow-white/20 transition-all hover:scale-[1.03] group shrink-0"
                        >
                            Get Started Free
                            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </a>
                    </div>
                </Reveal>
            </section>

            {/* ═══ DEMO / VIDEO ═══ */}
            <section id="demo" className="py-24 px-6 lg:px-8">
                <div className="max-w-5xl mx-auto">
                    <Reveal>
                        <div className="text-center mb-12">
                            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400 mb-4 block">See It In Action</span>
                            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-5">
                                Watch Tono Build an Itinerary
                            </h2>
                            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                                From client conversation to polished proposal in under 60 seconds.
                            </p>
                        </div>
                    </Reveal>

                    <Reveal delay={0.2}>
                        <div className="relative rounded-3xl overflow-hidden border border-white/[0.06] shadow-2xl shadow-black/50">
                            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden' }}>
                                <iframe
                                    src="https://drive.google.com/file/d/1gtQYjIkpQPrIWMsVcZJVu0gRDW22w8IK/preview"
                                    allow="autoplay"
                                    frameBorder="0"
                                    allowFullScreen
                                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                                />
                            </div>
                        </div>
                    </Reveal>

                    {/* CTA below video */}
                    <Reveal delay={0.3}>
                        <div className="mt-12 text-center">
                            <p className="text-slate-400 mb-6 text-lg">Impressed? Imagine what Tono can do for <span className="text-amber-400 font-semibold">your</span> agency.</p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <a
                                    href="https://form.typeform.com/to/yoSTuh1K"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 px-8 py-4 rounded-full font-bold text-lg hover:shadow-xl hover:shadow-amber-500/25 transition-all hover:scale-[1.03] group"
                                >
                                    Try It Free &mdash; No Card Needed
                                    <Sparkles className="ml-2 w-5 h-5 group-hover:rotate-12 transition-transform" />
                                </a>
                                <a
                                    href="mailto:info@triponic.com"
                                    className="inline-flex items-center justify-center border border-white/15 text-slate-300 px-8 py-4 rounded-full font-semibold text-lg hover:border-amber-500/40 hover:text-white transition-all"
                                >
                                    Book a Live Demo
                                </a>
                            </div>
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* ═══ TESTIMONIALS ═══ */}
            <section id="testimonials" className="py-24 px-6 lg:px-8 bg-slate-900/30">
                <div className="max-w-7xl mx-auto">
                    <Reveal>
                        <div className="text-center mb-16">
                            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400 mb-4 block">Testimonials</span>
                            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-5">
                                Loved by Agencies
                            </h2>
                            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                                Here&apos;s what our pilot partners are saying.
                            </p>
                        </div>
                    </Reveal>

                    <div className="grid md:grid-cols-3 gap-6">
                        {testimonials.map((t, i) => (
                            <Reveal key={i} delay={i * 0.12}>
                                <div className="bg-slate-900/60 border border-white/[0.06] rounded-3xl p-7 hover:border-white/[0.1] transition-all duration-500 h-full flex flex-col">
                                    <div className="flex items-center gap-1 mb-5">
                                        {[...Array(t.rating)].map((_, j) => (
                                            <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                                        ))}
                                    </div>
                                    <p className="text-slate-300 leading-relaxed mb-6 flex-1">&ldquo;{t.quote}&rdquo;</p>
                                    <div className="flex items-center gap-3 pt-4 border-t border-white/[0.06]">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-sm font-bold text-slate-900">
                                            {t.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="text-white font-semibold text-sm">{t.name}</div>
                                            <div className="text-slate-500 text-xs">{t.agency}</div>
                                        </div>
                                    </div>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══ BEFORE / AFTER ROI COMPARISON ═══ */}
            <section className="py-24 px-6 lg:px-8">
                <div className="max-w-5xl mx-auto">
                    <Reveal>
                        <div className="text-center mb-14">
                            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400 mb-4 block">The Difference</span>
                            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-5">Before vs After Triponic</h2>
                            <p className="text-lg text-slate-400 max-w-2xl mx-auto">See how agencies transform their operations.</p>
                        </div>
                    </Reveal>
                    <div className="grid md:grid-cols-2 gap-6">
                        <Reveal delay={0.1}>
                            <div className="bg-red-500/[0.04] border border-red-500/10 rounded-3xl p-8 h-full">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-bold uppercase tracking-wider mb-6">
                                    <X className="w-3 h-3" /> Without Triponic
                                </div>
                                <ul className="space-y-4">
                                    {[
                                        '4+ hours to build one itinerary',
                                        'Manual invoices in Word/Excel',
                                        'Client info scattered across emails',
                                        'No idea which proposals convert',
                                        "Generic templates that don't impress",
                                        'Weekends spent on admin work',
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-3 text-slate-400">
                                            <X className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </Reveal>
                        <Reveal delay={0.2}>
                            <div className="bg-emerald-500/[0.04] border border-emerald-500/10 rounded-3xl p-8 h-full">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-6">
                                    <CheckCircle2 className="w-3 h-3" /> With Triponic
                                </div>
                                <ul className="space-y-4">
                                    {[
                                        '60-second AI-generated itineraries',
                                        'One-click professional invoices',
                                        'All client data in smart CRM',
                                        'Real-time conversion analytics',
                                        'Stunning branded proposals',
                                        'Reclaim 15+ hours every week',
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-3 text-slate-300">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </Reveal>
                    </div>
                    <Reveal delay={0.3}>
                        <div className="mt-10 text-center">
                            <a
                                href="https://form.typeform.com/to/yoSTuh1K"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-8 py-4 rounded-full font-bold text-lg hover:shadow-xl hover:shadow-emerald-500/25 transition-all hover:scale-[1.03] group"
                            >
                                Make the Switch Today
                                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </a>
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* ═══ FINAL CTA ═══ */}
            <section className="py-24 px-6 lg:px-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(0,0,0,0)_0%,_rgba(0,0,0,0.15)_100%)]" />
                <div className="absolute top-10 left-10 w-72 h-72 rounded-full border border-white/10 pointer-events-none" />
                <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full border border-white/10 pointer-events-none" />

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <Reveal>
                        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-slate-900/20 border border-slate-900/20 text-slate-900 text-sm font-bold mb-8">
                            <Zap className="w-4 h-4" />
                            Limited Beta &mdash; Apply Now
                        </div>

                        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 mb-6 leading-tight">
                            Ready to Transform<br />Your Agency?
                        </h2>

                        <p className="text-xl text-slate-900/70 mb-10 max-w-2xl mx-auto">
                            Join 50+ travel agencies already using Triponic to close more deals, save time, and delight clients.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <a
                                href="https://form.typeform.com/to/yoSTuh1K"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center bg-slate-900 text-white px-10 py-5 rounded-full font-bold text-lg hover:shadow-2xl transition-all hover:scale-[1.03] group"
                            >
                                Request Your Access Code
                                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </a>
                            <Link
                                to="/pricing"
                                className="inline-flex items-center justify-center border-2 border-slate-900/30 text-slate-900 px-10 py-5 rounded-full font-bold text-lg hover:bg-slate-900/10 transition-all"
                            >
                                View Pricing
                            </Link>
                        </div>

                        <p className="text-sm text-slate-900/50 mt-8">
                            No credit card required &bull; Free during beta &bull; Lifetime early-adopter pricing
                        </p>
                    </Reveal>
                </div>
            </section>

            {/* ═══ FOOTER ═══ */}
            <footer className="py-16 px-6 lg:px-8 bg-slate-900 border-t border-white/[0.04]">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-center mb-10">
                        <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-slate-800/50 border border-white/[0.06]">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-sm text-slate-300 font-medium">Proudly part of</span>
                            <div className="h-5 w-px bg-white/10" />
                            <span className="text-white font-bold text-sm">Brampton Venture Zone</span>
                            <span className="text-xs text-slate-500">by Toronto Metropolitan University</span>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                        <Link to="/" className="flex items-center gap-3">
                            <img src="/Logown.png" alt="Triponic" className="h-10 w-auto" />
                            <span className="text-white font-bold text-xl">Triponic</span>
                        </Link>

                        <div className="flex flex-wrap justify-center gap-8 text-sm">
                            <Link to="/" className="text-slate-400 hover:text-white transition-colors">Home</Link>
                            <Link to="/pricing" className="text-slate-400 hover:text-white transition-colors">Pricing</Link>
                            <Link to="/about" className="text-slate-400 hover:text-white transition-colors">About</Link>
                            <a href="mailto:info@triponic.com" className="text-slate-400 hover:text-white transition-colors">Contact</a>
                        </div>

                        <p className="text-sm text-slate-600">&copy; 2026 Triponic. All rights reserved.</p>
                    </div>
                </div>
            </footer>

            {/* ═══ STICKY BOTTOM CTA BAR ═══ */}
            <motion.div
                initial={{ y: 100 }}
                animate={{ y: showStickyBar ? 0 : 100 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/90 backdrop-blur-xl border-t border-white/[0.08] px-4 py-3"
            >
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                    <div className="hidden sm:block">
                        <p className="text-white font-semibold text-sm">Ready to supercharge your agency?</p>
                        <p className="text-slate-500 text-xs">Free during beta &bull; No credit card required</p>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <a
                            href="https://form.typeform.com/to/yoSTuh1K"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 sm:flex-none inline-flex items-center justify-center bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 px-6 py-2.5 rounded-full font-bold text-sm hover:shadow-lg hover:shadow-amber-500/25 transition-all"
                        >
                            Get Started Free
                            <ArrowRight className="ml-1.5 w-4 h-4" />
                        </a>
                        <a
                            href="mailto:info@triponic.com"
                            className="hidden sm:inline-flex items-center justify-center border border-white/15 text-slate-300 px-6 py-2.5 rounded-full font-semibold text-sm hover:border-amber-500/40 hover:text-white transition-all"
                        >
                            Talk to Sales
                        </a>
                    </div>
                </div>
            </motion.div>

            {/* ═══ FLOATING ACTION BUTTON ═══ */}
            <motion.a
                href="https://form.typeform.com/to/yoSTuh1K"
                target="_blank"
                rel="noopener noreferrer"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: showStickyBar ? 1 : 0, opacity: showStickyBar ? 1 : 0 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="fixed bottom-20 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-2xl shadow-amber-500/30 cursor-pointer"
                title="Request Access"
            >
                <Send className="w-5 h-5 text-white" />
                <span className="absolute inset-0 rounded-full bg-amber-500/30 animate-ping" />
            </motion.a>
        </div>
    );
}
