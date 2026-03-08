import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Check,
    Sparkles,
    Users,
    Building2,
    Zap,
    Crown,
    ArrowRight,
    Gift,
    X
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const FadeIn = ({ children, delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay }}
    >
        {children}
    </motion.div>
);

export default function Pricing() {
    const plans = [
        {
            name: 'Starter',
            price: 29,
            icon: Sparkles,
            color: 'purple',
            gradient: 'from-purple-600 to-purple-400',
            bgGradient: 'from-purple-900/20 to-slate-900/50',
            bestFor: 'Solo travel advisors or beginners',
            usageLimit: '20 itinerary generations per month',
            features: [
                '1 agent seat',
                'Basic branding (logo + contact info)',
                'PDF export',
                'Client share link',
                'Save up to 20 itineraries',
                'Basic CRM (clients, notes)',
                'Email support'
            ],
            limitations: [
                'Triponic watermark'
            ]
        },
        {
            name: 'Pro',
            price: 49,
            icon: Users,
            color: 'blue',
            gradient: 'from-blue-600 to-cyan-400',
            bgGradient: 'from-blue-900/20 to-slate-900/50',
            bestFor: 'Small agencies with 2–5 advisors',
            usageLimit: '75 itinerary generations per month',
            popular: true,
            features: [
                'Up to 3 agent seats',
                'Remove Triponic watermark',
                'Save unlimited itineraries',
                'Team shared workspace',
                'PDF + client link customization',
                'Priority generation queue',
                'Upsell suggestions (hotels, tours)',
                'Priority email support'
            ],
            limitations: []
        },
        {
            name: 'Agency',
            price: 99,
            icon: Building2,
            color: 'pink',
            gradient: 'from-pink-600 to-purple-500',
            bgGradient: 'from-pink-900/20 to-slate-900/50',
            bestFor: 'Growing agencies & premium consultants',
            usageLimit: '250 itinerary generations per month',
            features: [
                'Up to 10 agent seats',
                'Full white-label (colors, fonts, branding)',
                'Admin dashboard',
                'Role-based access',
                'CRM Pro (pipeline, stages, tags)',
                'API access',
                'Fastest generation queue',
                'Monthly performance report',
                'Dedicated account manager (email)'
            ],
            limitations: []
        }
    ];

    const addOns = [
        { credits: 25, price: 9 },
        { credits: 100, price: 29 },
        { credits: 500, price: 79 }
    ];

    return (
        <div className="min-h-screen bg-slate-950 selection:bg-purple-500/30 selection:text-purple-200 font-sans text-slate-100 overflow-x-hidden">

            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/20 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px]" />
                <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[60%] h-[60%] rounded-full bg-slate-900/80 blur-[100px]" />
            </div>

            {/* Navigation */}
            <nav className="fixed w-full z-50 border-b border-white/5 bg-slate-950/50 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <Link to="/" className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                                <span className="text-white font-bold text-xl">T</span>
                            </div>
                            <span className="font-bold text-2xl tracking-tight text-white">
                                Triponic
                            </span>
                        </Link>

                        <div className="hidden md:flex items-center gap-8">
                            <Link to="/" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
                                Home
                            </Link>
                            <a href="/#features" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
                                Features
                            </a>
                            <Link to="/pricing" className="text-sm font-medium text-white transition-colors">
                                Pricing
                            </Link>
                        </div>

                        <div className="flex items-center gap-4">
                            <Link to="/login">
                                <Button variant="ghost" className="text-white hover:bg-white/10">
                                    Sign In
                                </Button>
                            </Link>
                            <Link to="/login?mode=register">
                                <Button variant="secondary" className="font-semibold rounded-full px-6 transition-all hover:scale-105">
                                    Get Started
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-16 lg:pt-48 lg:pb-24 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <FadeIn>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-purple-300 text-sm font-medium mb-8 backdrop-blur-sm">
                            <Zap className="w-4 h-4" />
                            Simple, transparent pricing
                        </div>

                        <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
                            <span className="text-white">Choose your plan,</span>
                            <br />
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400">
                                scale your agency
                            </span>
                        </h1>

                        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-4 leading-relaxed">
                            Start with our 7-day free trial. No credit card required.
                        </p>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 text-amber-400 text-sm font-semibold">
                            <Zap className="w-4 h-4" />
                            Beta Program: 46 spots remaining of 50 total
                        </div>
                    </FadeIn>
                </div>
            </section>

            {/* Pricing Cards */}
            <section className="relative py-16 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
                        {plans.map((plan, index) => {
                            const Icon = plan.icon;
                            return (
                                <FadeIn key={index} delay={index * 0.1}>
                                    <div className={`relative bg-gradient-to-br ${plan.bgGradient} border ${plan.popular ? 'border-blue-500/50 shadow-2xl shadow-blue-500/20 scale-105' : 'border-white/10'} rounded-3xl p-8 h-full hover:border-white/20 transition-all group`}>

                                        {/* Popular Badge */}
                                        {plan.popular && (
                                            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                                <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-4 py-1 rounded-full text-sm font-bold flex items-center gap-1 shadow-lg">
                                                    <Crown className="w-4 h-4" />
                                                    Most Popular
                                                </div>
                                            </div>
                                        )}

                                        {/* Icon */}
                                        <div className={`w-14 h-14 bg-gradient-to-br ${plan.gradient} rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg group-hover:scale-110 transition-transform`}>
                                            <Icon className="w-7 h-7" />
                                        </div>

                                        {/* Plan Name */}
                                        <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>

                                        {/* Best For */}
                                        <p className="text-sm text-slate-400 mb-6 min-h-[2.5rem]">{plan.bestFor}</p>

                                        {/* Price */}
                                        <div className="mb-6">
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-5xl font-bold text-white">${plan.price}</span>
                                                <span className="text-slate-400">/month</span>
                                            </div>
                                        </div>

                                        {/* Usage Limit */}
                                        <div className="mb-6 p-3 bg-white/5 border border-white/10 rounded-xl">
                                            <p className="text-sm font-semibold text-slate-300">{plan.usageLimit}</p>
                                        </div>

                                        {/* CTA Button */}
                                        <Link to="/login?mode=register">
                                            <Button
                                                className={`w-full h-12 rounded-full font-semibold transition-all mb-8 ${plan.popular
                                                    ? 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-lg shadow-blue-500/25'
                                                    : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                                                    }`}
                                            >
                                                Get Started
                                                <ArrowRight className="ml-2 w-4 h-4" />
                                            </Button>
                                        </Link>

                                        {/* Features */}
                                        <div className="space-y-3">
                                            {plan.features.map((feature, i) => (
                                                <div key={i} className="flex items-start gap-3">
                                                    <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${plan.gradient} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                                                        <Check className="w-3 h-3 text-white" />
                                                    </div>
                                                    <span className="text-sm text-slate-300">{feature}</span>
                                                </div>
                                            ))}

                                            {/* Limitations */}
                                            {plan.limitations.map((limitation, i) => (
                                                <div key={`limit-${i}`} className="flex items-start gap-3">
                                                    <div className="w-5 h-5 rounded-full bg-slate-700/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                        <X className="w-3 h-3 text-slate-400" />
                                                    </div>
                                                    <span className="text-sm text-slate-400 line-through">{limitation}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </FadeIn>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Free Trial Callout */}
            <section className="relative py-16 z-10">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <FadeIn>
                        <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 border border-purple-500/30 rounded-3xl p-12 text-center backdrop-blur-sm">
                            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-purple-500/30">
                                <Gift className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                                7-Day Free Trial
                            </h2>
                            <p className="text-xl text-slate-300 mb-2">
                                Try Triponic with <span className="font-bold text-purple-300">10 itinerary generations</span>
                            </p>
                            <p className="text-lg text-slate-400 mb-8">
                                No credit card required • Cancel anytime
                            </p>
                            <Link to="/login?mode=register">
                                <Button size="lg" className="h-14 px-8 text-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-full shadow-lg shadow-purple-500/25 transition-all hover:scale-105">
                                    Start Free Trial
                                    <ArrowRight className="ml-2 w-5 h-5" />
                                </Button>
                            </Link>
                        </div>
                    </FadeIn>
                </div>
            </section>

            {/* Add-Ons Section */}
            <section className="relative py-16 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <FadeIn>
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                                Need More Credits?
                            </h2>
                            <p className="text-xl text-slate-400">
                                Purchase additional itinerary generation credits that never expire
                            </p>
                        </div>
                    </FadeIn>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                        {addOns.map((addon, index) => (
                            <FadeIn key={index} delay={0.1 * index}>
                                <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-8 text-center hover:border-purple-500/30 transition-all group">
                                    <div className="text-4xl font-bold text-white mb-2">
                                        {addon.credits}
                                    </div>
                                    <div className="text-slate-400 mb-4">credits</div>
                                    <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400 mb-6">
                                        ${addon.price}
                                    </div>
                                    <div className="text-sm text-slate-500 mb-6">
                                        ${(addon.price / addon.credits).toFixed(2)} per credit
                                    </div>
                                    <Button className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-full transition-all group-hover:scale-105">
                                        Purchase
                                    </Button>
                                </div>
                            </FadeIn>
                        ))}
                    </div>

                    <FadeIn delay={0.4}>
                        <div className="text-center mt-8">
                            <p className="text-sm text-slate-500 flex items-center justify-center gap-2">
                                <Sparkles className="w-4 h-4 text-purple-400" />
                                Credits never expire and can be used with any plan
                            </p>
                        </div>
                    </FadeIn>
                </div>
            </section>

            {/* FAQ / Additional Info */}
            <section className="relative py-20 z-10 border-t border-white/5 bg-white/[0.02]">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <FadeIn>
                        <h2 className="text-2xl font-bold text-white mb-6">
                            Questions about pricing?
                        </h2>
                        <p className="text-slate-400 mb-8">
                            Our team is here to help you choose the right plan for your agency.
                        </p>
                        <Button variant="outline" className="rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20 backdrop-blur-sm px-8">
                            Contact Sales
                        </Button>
                    </FadeIn>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/10 py-12 bg-slate-950 relative z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                        <p className="text-slate-500 text-sm">© 2025 Triponic Inc. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
