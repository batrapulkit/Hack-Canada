import React from 'react';
import { motion } from 'framer-motion';
import { Clock, TrendingDown, Frown, Sparkles, Zap, Smile, TrendingUp } from 'lucide-react';

export default function ProblemSolution() {
    return (
        <section className="py-24 px-6 lg:px-8 bg-gradient-to-b from-slate-950 to-slate-900">
            <div className="max-w-7xl mx-auto">
                {/* Problem Statement */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-20"
                >
                    <h2 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                        Small Agencies Are
                        <br />
                        <span className="bg-gradient-to-r from-red-400 to-orange-500 bg-clip-text text-transparent">
                            Losing to Speed
                        </span>
                    </h2>
                    <p className="text-xl lg:text-2xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
                        Clients expect instant proposals. But creating a comprehensive itinerary takes 15+ hours of manual work. By the time you respond,{' '}
                        <span className="text-red-400 font-semibold">they've already booked with someone faster</span>.
                    </p>
                </motion.div>

                {/* Before/After Comparison */}
                <div className="grid lg:grid-cols-2 gap-8 mb-16">
                    {/* Before - The Old Way */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="relative"
                    >
                        <div className="bg-slate-800/30 border-2 border-red-500/30 rounded-3xl p-8 h-full">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                                    <Frown className="w-6 h-6 text-red-400" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-white">The Old Way</h3>
                                    <p className="text-sm text-red-400">Manual, slow, expensive</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {[
                                    { icon: Clock, text: '15+ hours per itinerary', color: 'text-red-400' },
                                    { icon: TrendingDown, text: '60% of quotes lost to competitors', color: 'text-red-400' },
                                    { icon: Clock, text: 'Days to respond to client inquiries', color: 'text-red-400' },
                                    { icon: Frown, text: 'Burned out from repetitive work', color: 'text-red-400' }
                                ].map((item, index) => {
                                    const Icon = item.icon;
                                    return (
                                        <div key={index} className="flex items-start gap-3">
                                            <Icon className={`w-5 h-5 ${item.color} flex-shrink-0 mt-1`} />
                                            <p className="text-slate-300">{item.text}</p>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                                <p className="text-sm text-red-300 font-semibold">
                                    Result: Clients choose faster alternatives like Expedia
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* After - The Triponic Way */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="relative"
                    >
                        <div className="bg-gradient-to-br from-emerald-900/20 to-teal-900/20 border-2 border-emerald-500/50 rounded-3xl p-8 h-full shadow-xl shadow-emerald-500/10">
                            {/* Glow effect */}
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 rounded-3xl blur-xl" />

                            <div className="relative">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                                        <Sparkles className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-white">With Triponic</h3>
                                        <p className="text-sm text-emerald-400">Instant, intelligent, profitable</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {[
                                        { icon: Zap, text: '60 seconds to generate proposals', color: 'text-emerald-400' },
                                        { icon: TrendingUp, text: '2x more quotes converted to bookings', color: 'text-emerald-400' },
                                        { icon: Zap, text: 'Instant responses with AI chat', color: 'text-emerald-400' },
                                        { icon: Smile, text: 'Focus on clients, not admin work', color: 'text-emerald-400' }
                                    ].map((item, index) => {
                                        const Icon = item.icon;
                                        return (
                                            <div key={index} className="flex items-start gap-3">
                                                <Icon className={`w-5 h-5 ${item.color} flex-shrink-0 mt-1`} />
                                                <p className="text-slate-100 font-medium">{item.text}</p>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="mt-8 p-4 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-xl">
                                    <p className="text-sm text-emerald-300 font-semibold">
                                        Result: Small agencies compete with enterprise speed + personal touch
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Badge */}
                        <div className="absolute -top-4 -right-4 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-900 px-4 py-2 rounded-full text-sm font-bold shadow-lg rotate-3">
                            🚀 This is Triponic
                        </div>
                    </motion.div>
                </div>

                {/* Stats Comparison */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center"
                >
                    <div className="inline-flex items-center gap-8 bg-slate-800/50 border border-white/10 rounded-2xl px-8 py-6">
                        <div>
                            <div className="text-4xl font-bold text-white mb-1">
                                15 hrs → <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">60 sec</span>
                            </div>
                            <div className="text-sm text-slate-400">Time per itinerary</div>
                        </div>
                        <div className="w-px h-12 bg-white/10" />
                        <div>
                            <div className="text-4xl font-bold text-white mb-1">
                                40% → <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">80%</span>
                            </div>
                            <div className="text-sm text-slate-400">Quote conversion rate</div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
