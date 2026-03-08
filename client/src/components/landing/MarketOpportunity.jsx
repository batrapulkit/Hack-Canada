import React from 'react';
import { motion } from 'framer-motion';
import { Globe, DollarSign, TrendingUp, Building2, Map } from 'lucide-react';

export default function MarketOpportunity() {
    const marketData = [
        {
            label: 'Total Addressable Market',
            value: '$177B',
            description: 'Global travel agency market',
            icon: Globe,
            color: 'from-blue-500 to-cyan-500'
        },
        {
            label: 'Serviceable Market',
            value: '57,000+',
            description: 'Travel agencies in the US',
            icon: Building2,
            color: 'from-purple-500 to-pink-500'
        },
        {
            label: 'Market Growth',
            value: '9.2%',
            description: 'Annual growth rate (CAGR)',
            icon: TrendingUp,
            color: 'from-emerald-500 to-teal-500'
        }
    ];

    return (
        <section className="py-24 px-6 lg:px-8 bg-slate-950 relative overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 via-slate-950 to-slate-900/50" />

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 text-blue-400 text-sm font-semibold mb-6">
                        <Map className="w-4 h-4" />
                        Market Opportunity
                    </div>
                    <h2 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                        A Massive Market
                        <br />
                        <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                            Ready for Disruption
                        </span>
                    </h2>
                    <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
                        The travel agency industry is growing rapidly, but small agencies are stuck with outdated tools.
                        We're bringing enterprise-level AI to everyone.
                    </p>
                </motion.div>

                {/* Market Stats Grid */}
                <div className="grid md:grid-cols-3 gap-6 mb-16">
                    {marketData.map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="relative group"
                            >
                                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/10 rounded-3xl p-8 hover:border-white/20 transition-all hover:scale-105">
                                    {/* Icon */}
                                    <div className={`w-14 h-14 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center mb-6 shadow-xl`}>
                                        <Icon className="w-7 h-7 text-white" />
                                    </div>

                                    {/* Value */}
                                    <div className="text-5xl font-bold text-white mb-3">
                                        {item.value}
                                    </div>

                                    {/* Label */}
                                    <div className="text-sm font-semibold text-slate-300 mb-2 uppercase tracking-wide">
                                        {item.label}
                                    </div>

                                    {/* Description */}
                                    <div className="text-sm text-slate-500">
                                        {item.description}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Why Now Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="bg-gradient-to-br from-amber-900/20 to-orange-900/20 border-2 border-amber-500/30 rounded-3xl p-12 text-center"
                >
                    <h3 className="text-3xl lg:text-4xl font-bold text-white mb-6">
                        Why Now?
                    </h3>
                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {[
                            {
                                title: 'AI Breakthrough',
                                description: 'GPT-4 makes human-quality itineraries possible for the first time'
                            },
                            {
                                title: 'Post-Pandemic Boom',
                                description: 'Travel demand at all-time highs, agencies overwhelmed with requests'
                            },
                            {
                                title: 'David vs. Goliath',
                                description: 'Small agencies need tech to compete with Expedia, Booking.com'
                            }
                        ].map((item, index) => (
                            <div key={index} className="text-left">
                                <div className="text-lg font-bold text-amber-400 mb-2">
                                    {item.title}
                                </div>
                                <div className="text-slate-300">
                                    {item.description}
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Vision Statement */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mt-16"
                >
                    <p className="text-2xl lg:text-3xl text-slate-300 max-w-4xl mx-auto leading-relaxed">
                        "We're not building a tool. We're building the <span className="text-white font-bold">operating system</span> for the next generation of travel agencies."
                    </p>
                    <div className="mt-6 text-slate-500 text-lg">
                        — Triponic Team
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
