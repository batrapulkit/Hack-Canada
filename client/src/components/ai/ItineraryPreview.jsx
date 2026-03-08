import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Calendar, DollarSign, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from 'react-router-dom';

export default function ItineraryPreview({ data }) {
    const navigate = useNavigate();

    // Parse data if it's a string
    const itinerary = typeof data === 'string' ? JSON.parse(data) : data;

    // Extract details with fallbacks
    const destination = itinerary.destination || itinerary.title || "Mystery Trip";
    const duration = itinerary.duration || "Multi-day";
    const price = itinerary.price || itinerary.estimatedCost || "TBD";
    const highlights = itinerary.highlights || itinerary.activities || [];
    const imageUrl = itinerary.image || "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop";

    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="w-full max-w-sm my-2"
        >
            <Card className="overflow-hidden border-0 shadow-lg group cursor-pointer hover:shadow-xl transition-all duration-300 ring-1 ring-slate-200">
                <div className="relative h-48 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                    <img
                        src={imageUrl}
                        alt={destination}
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute bottom-4 left-4 z-20 text-white">
                        <Badge className="bg-white/20 backdrop-blur-md hover:bg-white/30 text-white border-0 mb-2">
                            <Sparkles className="w-3 h-3 mr-1 text-yellow-300" />
                            AI Generated
                        </Badge>
                        <h3 className="text-xl font-bold">{destination}</h3>
                    </div>
                </div>

                <CardContent className="p-4 bg-white">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center text-slate-600 text-sm">
                            <Calendar className="w-4 h-4 mr-1.5 text-indigo-500" />
                            {duration}
                        </div>
                        <div className="flex items-center font-semibold text-slate-900">
                            <DollarSign className="w-4 h-4 text-green-600" />
                            {price}
                        </div>
                    </div>

                    {highlights.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                            {highlights.slice(0, 3).map((tag, i) => (
                                <span key={i} className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-md">
                                    {typeof tag === 'string' ? tag : tag.name}
                                </span>
                            ))}
                            {highlights.length > 3 && (
                                <span className="text-xs px-2 py-1 bg-slate-50 text-slate-400 rounded-md">
                                    +{highlights.length - 3} more
                                </span>
                            )}
                        </div>
                    )}

                    <Button
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all"
                        onClick={() => navigate('/itineraries')}
                    >
                        View Full Itinerary
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </CardContent>
            </Card>
        </motion.div>
    );
}
