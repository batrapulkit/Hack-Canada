import React from 'react';
import { motion } from 'framer-motion';
import { Quote, Star } from 'lucide-react';

export default function PilotTestimonials() {
    const testimonials = [
        {
            quote: "The travel industry has been stuck in a manual 'copy-paste' cycle for too long, but Triponic is finally changing the game. By automating the biggest operational time-sucks - from unstructured client notes to complex resort searches - it allows advisors to stop fighting with data entry and get back to what they actually love: taking care of their clients. It is the operating system the global travel community has been waiting for.",
            author: "Ayesha Patel",
            role: "Luxury Travel Advisor",
            agency: "The Travel Agent Next Door",
            rating: 5,
            highlight: "The OS for Travel"
        },
        {
            quote: "Triponic...Very cool. Great tool for my trip planning services indeed...would love to see more.",
            author: "Jean-F Dabrowski",
            role: "Luxury Travel Consultant & Entrepreneur",
            agency: "Tailor-Made Travel Specialist",
            rating: 5,
            highlight: "Tailor-Made Travel"
        },
        {
            quote: "Triponic finally understands how travel agencies actually work. The GDS handling and invoicing alone save us a massive amount of manual effort. What used to take multiple tools and back-and-forth is now clean, structured, and fast. This is built for real agents.",
            author: "Dipak",
            role: "Travel Operations Manager",
            agency: "Akshar Travels",
            rating: 5,
            highlight: "GDS Game Changer"
        }
    ];

    return (
        <section className="py-24 px-6 lg:px-8 bg-gradient-to-b from-slate-900 to-slate-950">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold mb-6">
                        <Star className="w-4 h-4 fill-current" />
                        Pilot Program Feedback
                    </div>
                    <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
                        What Our Pilot Partners Say
                    </h2>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                        Real feedback from the agencies and influencers shaping our platform
                    </p>
                </motion.div>

                {/* Testimonials Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {testimonials.map((testimonial, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="relative group"
                        >
                            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/10 rounded-2xl p-8 hover:border-emerald-500/30 transition-all h-full flex flex-col">
                                {/* Quote Icon */}
                                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center mb-4 opacity-80">
                                    <Quote className="w-5 h-5 text-white" />
                                </div>

                                {/* Rating */}
                                <div className="flex gap-1 mb-4">
                                    {[...Array(testimonial.rating)].map((_, i) => (
                                        <Star key={i} className="w-4 h-4 text-amber-400 fill-current" />
                                    ))}
                                </div>

                                {/* Quote */}
                                <p className="text-slate-300 leading-relaxed mb-6 flex-grow">
                                    "{testimonial.quote}"
                                </p>

                                {/* Highlight Badge */}
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm font-semibold mb-4 self-start">
                                    ✨ {testimonial.highlight}
                                </div>

                                {/* Author */}
                                <div className="pt-4 border-t border-white/10">
                                    <div className="font-semibold text-white mb-1">
                                        {testimonial.author}
                                    </div>
                                    <div className="text-sm text-slate-400">
                                        {testimonial.role}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1">
                                        {testimonial.agency}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Join CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mt-16"
                >
                    <p className="text-slate-400 mb-2">
                        Want results like these?
                    </p>
                    <p className="text-lg text-white font-semibold">
                        Join the next cohort of pilot partners → Limited to 50 partners total
                    </p>
                </motion.div>
            </div>
        </section>
    );
}
