import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Zap, Award } from 'lucide-react';

const AnimatedCounter = ({ end, duration = 2000, suffix = '' }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime;
        let animationFrame;

        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);

            setCount(Math.floor(progress * end));

            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            }
        };

        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [end, duration]);

    return <span>{count}{suffix}</span>;
};

export default function TractionBar() {
    const stats = [
        {
            icon: Users,
            label: 'Pilot Partners',
            value: 8,
            suffix: '',
            description: '8 agencies onboarded',
            color: 'from-blue-500 to-cyan-500'
        },
        {
            icon: Zap,
            label: 'Beta Spots Left',
            value: 42,
            suffix: '',
            description: 'Limited to 50 partners total',
            color: 'from-amber-500 to-orange-500'
        },
        {
            icon: Award,
            label: 'Founding Member Price',
            value: '50%',
            suffix: '',
            description: '50% off forever (reg. $99)',
            color: 'from-emerald-500 to-teal-500',
            noAnimation: true
        }
    ];

    return (
        <section className="py-16 px-6 lg:px-8 bg-slate-900/30 border-y border-white/5">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 text-amber-400 text-sm font-semibold mb-4"
                    >
                        <Zap className="w-4 h-4" />
                        Live Pilot Program
                    </motion.div>
                    <h2 className="text-3xl lg:text-4xl font-bold text-white mb-3">
                        Join Our Exclusive Beta
                    </h2>
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                        Currently working with select agencies to perfect the platform before public launch
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {stats.map((stat, index) => {
                        const Icon = stat.icon;
                        return (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="relative group"
                            >
                                <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all hover:scale-105">
                                    {/* Icon */}
                                    <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center mb-4 shadow-lg`}>
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>

                                    {/* Value */}
                                    <div className="text-4xl font-bold text-white mb-1">
                                        {stat.noAnimation ? (
                                            <span>{stat.value}{stat.suffix}</span>
                                        ) : (
                                            <>
                                                <AnimatedCounter end={stat.value} />
                                                {stat.suffix}
                                            </>
                                        )}
                                    </div>

                                    {/* Label */}
                                    <div className="text-sm font-semibold text-slate-300 mb-2">
                                        {stat.label}
                                    </div>

                                    {/* Description */}
                                    <div className="text-xs text-slate-500">
                                        {stat.description}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Trust Indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                    className="text-center mt-12"
                >
                    <p className="text-sm text-slate-500">
                        💡 <span className="text-slate-400 font-medium">Pilot agencies save 15+ hours per week</span> • Join the waitlist to secure your spot
                    </p>
                </motion.div>
            </div>
        </section>
    );
}
