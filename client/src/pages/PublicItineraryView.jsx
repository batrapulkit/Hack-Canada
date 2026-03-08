import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import ItineraryDisplay from '@/components/itineraries/ItineraryDisplay';
import PlanVerifier from '@/components/itineraries/PlanVerifier';
import { Loader2, MapPin, Calendar, Users, Mail, ArrowRight, CheckCircle2, Download, Phone, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { downloadItineraryPDF } from '@/utils/pdfGenerator';
import { toast } from 'sonner';

// Comprehensive mapping of destinations to high-quality Unsplash images
const DESTINATION_IMAGES = {
    'paris': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=2073&auto=format&fit=crop',
    'london': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=2070&auto=format&fit=crop',
    'new york': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=2070&auto=format&fit=crop',
    'tokyo': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1994&auto=format&fit=crop',
    'dubai': 'https://images.unsplash.com/photo-1512453979798-5ea904ac66de?q=80&w=2009&auto=format&fit=crop',
    'bali': 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=2038&auto=format&fit=crop',
    'rome': 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=1996&auto=format&fit=crop',
    'santorini': 'https://images.unsplash.com/photo-1613395877344-13d4c79e4284?q=80&w=2070&auto=format&fit=crop',
    'maldives': 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?q=80&w=2065&auto=format&fit=crop',
    'switzerland': 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?q=80&w=2070&auto=format&fit=crop',
    'thailand': 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?q=80&w=2039&auto=format&fit=crop',
    'pakistan': 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2070&auto=format&fit=crop', // Safe mountain/lake image
    'india': 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?q=80&w=2071&auto=format&fit=crop',
    'singapore': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?q=80&w=2052&auto=format&fit=crop',
    'australia': 'https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?q=80&w=2030&auto=format&fit=crop',
    'canada': 'https://images.unsplash.com/photo-1503614472-8c93d56e92ce?q=80&w=2011&auto=format&fit=crop',
    'default': 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2070&auto=format&fit=crop' // Generic mountains/lake
};

const getDestinationImage = (destination) => {
    if (!destination) return DESTINATION_IMAGES.default;
    const key = destination.toLowerCase();
    // Check for direct match or partial match
    for (const [city, url] of Object.entries(DESTINATION_IMAGES)) {
        if (key.includes(city)) return url;
    }
    return DESTINATION_IMAGES.default;
};

export default function PublicItineraryView() {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isExporting, setIsExporting] = useState(false);
    const [imgError, setImgError] = useState(false);

    // Reactiv Integration State
    const [reactivQr, setReactivQr] = useState(null);
    const [reactivLoading, setReactivLoading] = useState(false);
    const [campaignTag, setCampaignTag] = useState(null);

    // Audio Player State
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    useEffect(() => {
        const fetchItinerary = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/public/itinerary/${id}`);
                if (!response.ok) throw new Error('Failed to load itinerary');

                const json = await response.json();
                setData(json);
            } catch (err) {
                console.error(err);
                setError("Itinerary not found or access denied.");
            } finally {
                setLoading(false);
            }
        };

        fetchItinerary();
    }, [id]);

    useEffect(() => {
        if (audioRef.current && id) {
            audioRef.current.load();
        }
    }, [id]);

    const handleBookNow = async () => {
        // HACKATHON: Reactiv Instant App Clip Checkout
        if (!data || !data.itinerary) return;
        setReactivLoading(true);
        try {
            const { itinerary } = data;
            const price = itinerary.budget || 2500; // Mock price if missing
            const desc = itinerary.ai_generated_json?.summary || itinerary.notes || '';

            const response = await fetch(`${import.meta.env.VITE_API_URL}/reactiv/generate-qr`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    itineraryId: id,
                    packageName: itinerary.title || `Trip to ${itinerary.destination}`,
                    price: price,
                    description: desc
                })
            });

            if (!response.ok) throw new Error("Failed to generate checkout");
            const result = await response.json();

            if (result.success) {
                setReactivQr(result.qrCode);
                setCampaignTag(result.campaignTag);
                toast.success('Generated Instant Checkout QR!', { icon: '⚡' });
            }
        } catch (err) {
            console.error("Reactiv Error:", err);
            toast.error("Could not generate Reactiv checkout. Contacting agent instead.");
            // Fallback to old behavior
            const contactSection = document.getElementById('contact-section');
            if (contactSection) {
                contactSection.scrollIntoView({ behavior: 'smooth' });
            }
        } finally {
            setReactivLoading(false);
        }
    };

    const handleDownloadPDF = async () => {
        if (!data) return;
        setIsExporting(true);
        try {
            const { itinerary, agency } = data;
            await downloadItineraryPDF(itinerary, agency?.agency_name, agency?.logo_url);
            toast.success("PDF downloaded successfully!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate PDF");
        } finally {
            setIsExporting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-slate-900" />
                    <p className="text-slate-500 font-medium">Loading your journey...</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="text-center max-w-md w-full bg-white p-8 rounded-2xl shadow-lg border border-slate-100">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MapPin className="w-8 h-8 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800 mb-2">Itinerary Not Found</h1>
                    <p className="text-slate-600 mb-6">{error || "We couldn't find the itinerary you're looking for. It may have been removed or the link is invalid."}</p>
                    <Button onClick={() => window.location.reload()} variant="outline">Try Again</Button>
                </div>
            </div>
        );
    }

    const { itinerary, agency } = data;
    const details = itinerary.ai_generated_json?.detailedPlan || itinerary.ai_generated_json || {};

    // Use robust image mapping (prioritize Cloudinary branded image from server)
    const bgImage = itinerary.hero_image_url || getDestinationImage(itinerary.destination);

    return (
        <div className="min-h-screen bg-slate-50 font-sans selection:bg-amber-100 selection:text-amber-900">
            {/* Agency Header - Sticky & Glassmorphism */}
            <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/80 border-b border-slate-200/60 supports-[backdrop-filter]:bg-white/60 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {agency?.logo_url ? (
                            <img src={agency.logo_url} alt={agency.agency_name} className="h-8 w-auto object-contain" />
                        ) : (
                            <div className="h-8 w-8 bg-slate-900 rounded-lg flex items-center justify-center shadow-sm">
                                <span className="text-sm font-bold text-white">{agency?.agency_name?.charAt(0)}</span>
                            </div>
                        )}
                        <div className="hidden sm:block">
                            <h1 className="font-bold text-slate-900 text-sm leading-tight">{agency?.agency_name}</h1>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Travel Proposal</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {agency?.contact_email && (
                            <Button variant="ghost" size="sm" className="hidden sm:flex gap-2 text-slate-600 hover:text-slate-900" asChild>
                                <a href={`mailto:${agency.contact_email}`}>
                                    <Mail className="w-4 h-4" />
                                    Contact Agent
                                </a>
                            </Button>
                        )}
                        <Button
                            size="sm"
                            onClick={handleBookNow}
                            className="bg-slate-900 hover:bg-slate-800 text-white shadow-md shadow-slate-900/20 transition-all hover:scale-105 active:scale-95"
                        >
                            Book Now
                        </Button>
                    </div>
                </div>
            </header>

            {/* AI Greeting Voiceover */}
            <div
                className="fixed bottom-6 left-6 z-50 bg-white/95 backdrop-blur-xl rounded-full shadow-2xl border border-slate-200/60 p-2 flex items-center gap-3 animate-slide-up hover:scale-105 transition-transform cursor-pointer group"
                onClick={togglePlay}
            >
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-indigo-500/25 transition-shadow">
                    {isPlaying ? (
                        <Pause className="w-5 h-5 text-white fill-white" />
                    ) : (
                        <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                    )}
                </div>
                <div className="flex flex-col pr-5">
                    <span className="text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-wide uppercase">AI Audio Summary</span>
                    <span className="text-[11px] text-slate-500 font-medium">{isPlaying ? 'Playing...' : 'Listen to AI Guide'}</span>
                    <audio
                        ref={audioRef}
                        className="hidden"
                        onEnded={() => setIsPlaying(false)}
                        onPause={() => setIsPlaying(false)}
                        onPlay={() => setIsPlaying(true)}
                        onError={(e) => {
                            console.error("Audio Error:", e);
                            setIsPlaying(false);
                            toast.error("Audio summary unavailable. Generation failed or account restricted.");
                        }}
                    >
                        {id && <source src={`${import.meta.env.VITE_API_URL}/public/itinerary/${id}/audio?v=${Date.now()}`} type="audio/mpeg" />}
                    </audio>
                </div>
            </div>

            {/* Hero Section - Immersive */}
            <div className="relative h-[70vh] min-h-[600px] w-full overflow-hidden bg-slate-900">
                <div className="absolute inset-0">
                    <img
                        src={imgError ? DESTINATION_IMAGES.default : bgImage}
                        alt={itinerary.destination}
                        className="w-full h-full object-cover opacity-90 scale-105 animate-slow-zoom"
                        onError={() => setImgError(true)}
                    />
                    {/* Gradient Overlay - Adjusted to be less "black" but still readable text */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-900/30 to-transparent" />
                </div>

                <div className="absolute inset-0 flex items-end pb-20 sm:pb-32">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                        <div className="max-w-4xl animate-fade-in-up space-y-6">
                            <div className="flex flex-wrap gap-3">
                                <Badge variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md px-4 py-1.5 text-sm font-medium transition-colors">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    {itinerary.duration} Days
                                </Badge>
                                <Badge variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md px-4 py-1.5 text-sm font-medium transition-colors">
                                    <Users className="w-4 h-4 mr-2" />
                                    {itinerary.travelers} Travelers
                                </Badge>
                            </div>

                            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white leading-[1.1] tracking-tight drop-shadow-lg">
                                {itinerary.title || `Trip to ${itinerary.destination}`}
                            </h1>

                            <div className="flex flex-wrap items-center gap-8 text-slate-200 text-lg sm:text-xl font-light">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/10 rounded-full backdrop-blur-sm">
                                        <MapPin className="w-6 h-6 text-amber-400" />
                                    </div>
                                    <span className="font-medium text-white">{itinerary.destination}</span>
                                </div>
                                {itinerary.start_date && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                                        <span>{new Date(itinerary.start_date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10 pb-24">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Itinerary Details */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Intro Card */}
                        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8">
                            <h2 className="text-2xl font-bold text-slate-900 mb-4">Your Journey Begins Here</h2>
                            <p className="text-slate-600 leading-relaxed text-lg">
                                Get ready for an unforgettable adventure in {itinerary.destination}.
                                This carefully curated itinerary ensures you experience the best of culture, cuisine, and landscapes.
                            </p>
                        </div>

                        {/* AI Plan Verification */}
                        <PlanVerifier itinerary={itinerary} />

                        {/* Daily Plan */}
                        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                            <div className="p-6 sm:p-8 border-b border-slate-100 bg-slate-50/50">
                                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                                    <span className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-900 text-white">
                                        <Calendar className="w-5 h-5" />
                                    </span>
                                    Daily Itinerary
                                </h2>
                            </div>
                            <ItineraryDisplay data={details} />
                        </div>
                    </div>

                    {/* Right Column: Sticky Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 space-y-6">
                            {/* Booking Card */}
                            <div id="contact-section" className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 sm:p-8 ring-1 ring-slate-900/5">
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Ready to book?</h3>
                                <p className="text-slate-500 mb-8">Contact {agency?.agency_name} to customize and finalize your trip.</p>

                                <div className="space-y-4">
                                    {agency?.contact_email && (
                                        <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white h-12 text-base shadow-lg shadow-slate-900/20 transition-all hover:-translate-y-0.5" asChild>
                                            <a href={`mailto:${agency.contact_email}`}>
                                                <Mail className="w-5 h-5 mr-2" />
                                                Email Agent
                                            </a>
                                        </Button>
                                    )}
                                    <Button
                                        variant="outline"
                                        onClick={handleDownloadPDF}
                                        disabled={isExporting}
                                        className="w-full border-slate-200 hover:bg-slate-50 h-12 text-base transition-all"
                                    >
                                        {isExporting ? (
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        ) : (
                                            <Download className="w-5 h-5 mr-2" />
                                        )}
                                        {isExporting ? "Generating PDF..." : "Download PDF"}
                                    </Button>
                                </div>

                                {/* REACTIV APP CLIP QR MODAL */}
                                {reactivQr && (
                                    <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col items-center animate-fade-in-up">
                                        <div className="bg-slate-900 rounded-3xl p-6 shadow-2xl w-full max-w-[280px] border border-slate-800 text-center relative overflow-hidden">
                                            {/* Apple App Clip Pattern Header */}
                                            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 opacity-20"></div>

                                            <div className="relative z-10 flex flex-col items-center">
                                                <Badge className="bg-white/10 text-white mb-4 backdrop-blur-md border-white/20">
                                                    ⚡ Reactiv Instant Checkout
                                                </Badge>

                                                <div className="p-2 bg-white rounded-2xl shadow-inner mb-4">
                                                    <img src="/reactiv.png" alt="Scan to Book with Reactiv" className="w-40 h-40 object-contain rounded-xl" />
                                                </div>

                                                <p className="text-white font-medium text-sm mb-1">Scan with iPhone</p>
                                                <p className="text-slate-400 text-xs text-balance">Pay instantly with Apple Pay. No app download required.</p>

                                                {campaignTag && (
                                                    <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
                                                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                                        AI Tag: {campaignTag}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="mt-8 pt-8 border-t border-slate-100 space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1 bg-green-100 p-1 rounded-full">
                                            <CheckCircle2 className="w-3 h-3 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900 text-sm">100% Customizable</p>
                                            <p className="text-xs text-slate-500">Tailor this trip to your preferences</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1 bg-green-100 p-1 rounded-full">
                                            <CheckCircle2 className="w-3 h-3 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900 text-sm">Expert Support</p>
                                            <p className="text-xs text-slate-500">24/7 assistance during your trip</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Agency Info */}
                            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 flex items-center gap-4">
                                {agency?.logo_url ? (
                                    <img src={agency.logo_url} alt={agency.agency_name} className="h-14 w-14 object-contain bg-white rounded-xl p-2 border border-slate-100 shadow-sm" />
                                ) : (
                                    <div className="h-14 w-14 bg-white rounded-xl border border-slate-100 flex items-center justify-center shadow-sm">
                                        <span className="text-xl font-bold text-slate-700">{agency?.agency_name?.charAt(0)}</span>
                                    </div>
                                )}
                                <div>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Presented by</p>
                                    <h4 className="font-bold text-slate-900 text-lg leading-tight">{agency?.agency_name}</h4>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-slate-200 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <p className="text-slate-500 text-sm">© {new Date().getFullYear()} {agency?.agency_name || 'Travel Agency'}. All rights reserved.</p>

                    <div className="flex items-center gap-2 text-sm text-slate-400">
                        <span className="font-medium text-slate-400">Curated Travel Experience</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
