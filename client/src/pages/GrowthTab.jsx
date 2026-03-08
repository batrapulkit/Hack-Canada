import React, { useState, useEffect } from 'react';
import { Linkedin, Sparkles, Copy, Check, RefreshCw, TrendingUp, Users, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const MOCK_ITINERARIES = [
    { id: 1, destination: 'Banff, Alberta', duration: 5, travelers: 2 },
    { id: 2, destination: 'Vancouver Island, BC', duration: 7, travelers: 4 },
    { id: 3, destination: 'Quebec City, QC', duration: 4, travelers: 2 },
    { id: 4, destination: 'Whistler, BC', duration: 5, travelers: 6 },
    { id: 5, destination: 'Prince Edward Island', duration: 5, travelers: 3 },
];

export default function GrowthTab() {
    const [itineraries, setItineraries] = useState(MOCK_ITINERARIES);
    const [selectedItinerary, setSelectedItinerary] = useState(null);
    const [generatedPost, setGeneratedPost] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        // Try to load real itineraries from the API
        const loadItineraries = async () => {
            try {
                const token = localStorage.getItem('authToken');
                const res = await fetch(`${import.meta.env.VITE_API_URL}/itineraries`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.itineraries?.length > 0) {
                        setItineraries(data.itineraries.map(i => ({
                            id: i.id,
                            destination: i.destination,
                            duration: i.duration,
                            travelers: i.travelers,
                        })));
                    }
                }
            } catch {
                // Use mock data silently
            }
        };
        loadItineraries();
    }, []);

    const handleGenerate = async () => {
        if (!selectedItinerary) {
            toast.error('Please select an itinerary first');
            return;
        }

        setIsGenerating(true);
        setGeneratedPost('');

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/social/generate-post`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    destination: selectedItinerary.destination,
                    duration: selectedItinerary.duration,
                    travelers: selectedItinerary.travelers,
                    agencyName: 'Triponic',
                }),
            });

            if (!res.ok) throw new Error('Failed to generate post');
            const data = await res.json();
            setGeneratedPost(data.post);
            toast.success('LinkedIn post generated!', { icon: '✍️' });
        } catch (err) {
            console.error(err);
            toast.error('Failed to generate post. Try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedPost);
        setCopied(true);
        toast.success('Copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShareLinkedIn = () => {
        const encodedText = encodeURIComponent(generatedPost);
        window.open(`https://www.linkedin.com/sharing/share-offsite/?text=${encodedText}`, '_blank');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 p-6 font-sans">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                        <Linkedin className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Growth &amp; Social</h1>
                        <p className="text-slate-400 text-sm">AI-powered LinkedIn posts for your brand</p>
                    </div>
                    <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                        <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                        <span className="text-blue-300 text-xs font-medium">Powered by Stan AI</span>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: 'Posts Generated', value: '12', icon: TrendingUp, color: 'blue' },
                        { label: 'Total Reach', value: '4.2K', icon: Users, color: 'indigo' },
                        { label: 'Trips Published', value: `${itineraries.length}`, icon: MapPin, color: 'purple' },
                    ].map(stat => (
                        <div key={stat.label} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
                            <div className={`w-8 h-8 rounded-xl bg-${stat.color}-500/20 flex items-center justify-center mb-3`}>
                                <stat.icon className={`w-4 h-4 text-${stat.color}-400`} />
                            </div>
                            <p className="text-2xl font-bold text-white">{stat.value}</p>
                            <p className="text-slate-400 text-xs mt-0.5">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Main Card */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6 space-y-6">
                    <div>
                        <h2 className="text-white font-semibold mb-1">Select a recent booking</h2>
                        <p className="text-slate-400 text-sm mb-4">Choose an itinerary to generate a post about</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {itineraries.map(it => (
                                <button
                                    key={it.id}
                                    onClick={() => setSelectedItinerary(it)}
                                    className={`text-left p-4 rounded-2xl border transition-all ${selectedItinerary?.id === it.id
                                            ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500'
                                            : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/30 to-indigo-500/30 flex items-center justify-center flex-shrink-0">
                                            <MapPin className="w-4 h-4 text-blue-300" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-white text-sm leading-tight">{it.destination}</p>
                                            <p className="text-slate-400 text-xs mt-1">{it.duration} days · {it.travelers} travelers</p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <Button
                        onClick={handleGenerate}
                        disabled={!selectedItinerary || isGenerating}
                        className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                        {isGenerating ? (
                            <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Crafting your post...</>
                        ) : (
                            <><Sparkles className="w-4 h-4 mr-2" /> Generate LinkedIn Post</>
                        )}
                    </Button>
                </div>

                {/* Generated Post */}
                {generatedPost && (
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between">
                            <h3 className="text-white font-semibold flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-blue-400" />
                                Your AI-Generated Post
                            </h3>
                            <button
                                onClick={handleGenerate}
                                className="text-slate-400 hover:text-white transition-colors"
                                title="Regenerate"
                            >
                                <RefreshCw className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Post Preview */}
                        <div className="bg-white rounded-2xl p-5 shadow-xl">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                                    T
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-900 text-sm">Triponic Travel</p>
                                    <p className="text-slate-400 text-xs">Travel Agency · Just now</p>
                                </div>
                            </div>
                            <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{generatedPost}</p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <Button
                                onClick={handleCopy}
                                variant="outline"
                                className="flex-1 border-white/20 text-white hover:bg-white/10 rounded-xl h-11"
                            >
                                {copied ? <><Check className="w-4 h-4 mr-2 text-green-400" /> Copied!</> : <><Copy className="w-4 h-4 mr-2" /> Copy Text</>}
                            </Button>
                            <Button
                                onClick={handleShareLinkedIn}
                                className="flex-1 bg-[#0077B5] hover:bg-[#006097] text-white rounded-xl h-11 font-semibold"
                            >
                                <Linkedin className="w-4 h-4 mr-2" />
                                Post to LinkedIn
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
