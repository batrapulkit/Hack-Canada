import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Check, ArrowRight, MapPin, DollarSign } from 'lucide-react';
import axios from '@/config/axios';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

export default function AIMatcherDialog() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [request, setRequest] = useState('');
    const [results, setResults] = useState(null);

    const handleSearch = async () => {
        if (!request.trim()) return;
        setLoading(true);
        setResults(null);

        try {
            // Get token from localStorage (managed by AuthContext)
            const token = localStorage.getItem('auth_token');

            if (!token) {
                toast.error('Authentication error. Please login.');
                setLoading(false);
                return;
            }

            const response = await axios.post('/ai/resort-shortlist', {
                request: request
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data.success) {
                setResults(response.data.shortlist);
            } else {
                toast.error('AI could not find matches.');
            }
        } catch (error) {
            console.error("AI Matcher Error:", error);
            const msg = error.response?.data?.error || 'Failed to generate shortlist.';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleBook = async (resort) => {
        if (!resort.is_generated) {
            // Real resort: just view details
            window.location.href = `/resorts/${resort.id}`;
            return;
        }

        // Generated resort: Save to DB first
        try {
            toast.info('Saving resort to database...');

            // USE PLACEHOLDER IF IMAGE IS EMPTY OR MISSING
            const validImage = resort.image_url && resort.image_url.length > 10
                ? resort.image_url
                : "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=800&q=80";

            // 1. Insert Resort
            const { data: newResort, error: rError } = await supabase
                .from('resorts')
                .insert([{
                    name: resort.name,
                    location: resort.location,
                    country: resort.location.split(',').pop().trim(), // Simple parse
                    description: resort.description || `AI Recommended for: ${request}`,
                    amenities: resort.amenities || [],
                    price_level: resort.price_level,
                    image_url: validImage,
                    rating: 4.5, // Default for AI finds
                    sentiment_score: 0.9
                }])
                .select()
                .single();

            if (rError) throw rError;

            // 2. Insert Package (ALWAYS INSERT AT LEAST ONE)
            const pkg = resort.ai_match.recommended_package || {
                name: "Standard Luxury Stay",
                description: "Enjoy full access to all resort amenities including pool, beach, and dining.",
                price: 2500
            };

            await supabase.from('packages').insert([{
                resort_id: newResort.id,
                name: pkg.name,
                description: pkg.description || "Standard accommodation package.",
                price: pkg.price || 2000,
                duration_days: 5,
                inclusions: ["All Inclusive", "Airport Transfers", "Resort Credit", "Daily Activities"],
                valid_from: new Date().toISOString()
            }]);

            toast.success('Resort saved! Redirecting...');
            window.location.href = `/resorts/${newResort.id}`;

        } catch (err) {
            console.error("Save Error:", err);
            toast.error('Failed to save resort.');
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300 shadow-sm">
                    <Sparkles className="w-4 h-4 mr-2 text-purple-600" />
                    AI Smart Shortlist
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] bg-slate-50 max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <DialogTitle className="text-xl">AI Resort Matcher</DialogTitle>
                    </div>
                    <DialogDescription>
                        Describe your client's needs (e.g., "Family of 4 looking for a luxury Cancun resort under $5k with a kids club").
                        The AI will analyze dozens of options to find the top 5 perfect matches.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-6">
                    {/* Input Section */}
                    <div className="space-y-4">
                        <Textarea
                            placeholder="Describe your client's dream trip..."
                            className="min-h-[100px] text-base p-4 border-slate-300 focus:border-purple-500 focus:ring-purple-500 bg-white shadow-sm"
                            value={request}
                            onChange={(e) => setRequest(e.target.value)}
                        />
                        <Button
                            onClick={handleSearch}
                            disabled={loading || !request}
                            className="w-full bg-slate-900 text-white hover:bg-slate-800 h-12 text-base font-medium shadow-md transition-all"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin text-purple-400" />
                                    Analyzing Market Options...
                                </>
                            ) : (
                                <>
                                    Find Top 5 Matches <ArrowRight className="w-5 h-5 ml-2" />
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Results Section */}
                    {results && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-slate-900">Top Recommendations</h3>
                                <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                                    {results.length} Matches Found
                                </Badge>
                            </div>

                            <div className="grid gap-4">
                                {results.map((resort, idx) => (
                                    <Card key={resort.id} className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow bg-white">
                                        <div className="flex flex-col md:flex-row">
                                            {/* Image / Key Info */}
                                            <div className="md:w-1/3 h-48 md:h-auto relative bg-slate-200">
                                                <img
                                                    src={resort.image_url || "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=800&q=80"}
                                                    alt={resort.name}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=800&q=80";
                                                    }}
                                                />
                                                <div className="absolute top-2 left-2 flex gap-1">
                                                    <Badge className="bg-white/90 text-slate-900 backdrop-blur font-bold">
                                                        #{idx + 1}
                                                    </Badge>
                                                    <Badge className="bg-green-500 text-white border-0 font-bold">
                                                        {resort.ai_match.match_score}% Match
                                                    </Badge>
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="p-5 flex-1 flex flex-col justify-between">
                                                <div>
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <h4 className="text-xl font-bold text-slate-900">{resort.name}</h4>
                                                            <div className="flex items-center text-slate-500 text-sm mt-1">
                                                                <MapPin className="w-3 h-3 mr-1" /> {resort.location}
                                                            </div>
                                                        </div>
                                                        <div className="text-lg font-bold text-slate-700">
                                                            {resort.price_level ? Array(resort.price_level).fill('$').join('') : '$$$'}
                                                        </div>
                                                    </div>

                                                    <p className="text-slate-600 text-sm mb-4 italic border-l-2 border-purple-300 pl-3">
                                                        "{resort.ai_match.reasoning}"
                                                    </p>

                                                    {resort.is_generated && (
                                                        <Badge variant="outline" className="mb-3 text-amber-600 border-amber-200 bg-amber-50">
                                                            Market Suggestion (Not in DB)
                                                        </Badge>
                                                    )}

                                                    {/* Matched Package Highlight */}
                                                    {resort.ai_match.recommended_package && resort.ai_match.recommended_package.name && (
                                                        <div className="bg-purple-50 border border-purple-100 rounded-lg p-3 flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className="bg-white p-2 rounded-full shadow-sm">
                                                                    <Sparkles className="w-4 h-4 text-purple-600" />
                                                                </div>
                                                                <div>
                                                                    <div className="text-xs text-purple-600 font-bold uppercase tracking-wider">Best Package for Client</div>
                                                                    <div className="text-sm font-semibold text-slate-900">{resort.ai_match.recommended_package.name}</div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-lg font-bold text-purple-700">${resort.ai_match.recommended_package.price}</div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex justify-end mt-4 gap-2">
                                                    {resort.booking_link && (
                                                        <Button
                                                            variant="outline"
                                                            className="border-blue-200 text-blue-700 hover:bg-blue-50"
                                                            onClick={() => window.open(resort.booking_link, '_blank')}
                                                        >
                                                            Check Real Rates (Trip.com)
                                                        </Button>
                                                    )}
                                                    <Button
                                                        className="bg-slate-900 text-white"
                                                        onClick={() => handleBook(resort)}
                                                    >
                                                        {resort.is_generated ? 'Save & Book' : 'Select & Book'}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
