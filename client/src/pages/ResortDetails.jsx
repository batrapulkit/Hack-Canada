import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import axios from '../config/axios';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    MapPin, Star, Share2, Heart, ArrowLeft,
    Wifi, Coffee, Utensils, Waves, Sun,
    Check, Calendar, DollarSign, Plus
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import AddPackageDialog from '../components/resorts/AddPackageDialog';

export default function ResortDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [resort, setResort] = useState(null);
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currency, setCurrency] = useState('USD'); // USD or CAD
    const [checkingAvailability, setCheckingAvailability] = useState(false);

    const convertPrice = (price) => {
        if (currency === 'CAD') return Math.round(price * 1.35);
        return price;
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            maximumFractionDigits: 0
        }).format(convertPrice(price));
    };

    const handleCheckAvailability = () => {
        setCheckingAvailability(true);
        // Simulate API call
        setTimeout(() => {
            setCheckingAvailability(false);
            toast.success("Good news! 5 rooms available for your dates.");
        }, 1500);
    };

    useEffect(() => {
        fetchResortDetails();
    }, [id]);

    const fetchResortDetails = async () => {
        try {
            setLoading(true);

            // Fetch Resort via API (Server Logic handles access)
            const token = localStorage.getItem('sb-rpcvjrvqqaqgqjgqj-auth-token') ?
                JSON.parse(localStorage.getItem('sb-rpcvjrvqqaqgqjgqj-auth-token')).access_token :
                localStorage.getItem('auth_token'); // Fallback to custom key if any

            // Just use the headers directly
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            const { data: resortData } = await axios.get(`/resorts/${id}`, { headers });
            setResort(resortData);

            // Fetch Live/AI Offers via API (Server creates them)
            const { data: offers } = await axios.get(`/resorts/${id}/offers`, { headers });
            setPackages(offers || []);

        } catch (error) {
            console.error('Error loading details:', error);
            const msg = error.response?.data?.details || error.response?.data?.error || "Failed to load resort details";

            // If resort not found, maybe redirect
            if (error.response?.status === 404) {
                toast.error("Resort not found");
                navigate('/resorts');
            } else {
                toast.error(msg);
            }
        } finally {
            setLoading(false);
        }
    };

    const { user, profile } = useAuth(); // Need to import useAuth

    const handleSelectPackage = async (pkg) => {
        if (!profile?.agency_id) {
            toast.error("Agency profile missing. Cannot create itinerary.");
            return;
        }

        try {
            setLoading(true);
            toast.info("Creating itinerary...");

            // 1. Create Itinerary via Server API (Bypasses RLS issues)
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + (pkg.duration_days || 5));

            const token = localStorage.getItem('auth_token'); // Ensure we have token
            const headers = { 'Authorization': `Bearer ${token}` };

            const itinPayload = {
                destination: resort.location,
                duration: pkg.duration_days || 5,
                travelers: 2,
                budget: 'luxury', // Default
                status: 'draft',
                start_date: startDate.toISOString(),
                end_date: endDate.toISOString(),
                ai_generated_json: {
                    title: `Trip to ${resort.name}`,
                    summary: `Luxury stay at ${resort.name} with ${pkg.name} package.`,
                    destination: resort.location,
                    duration: pkg.duration_days
                }
            };

            const { data: itinRes } = await axios.post('/itineraries', itinPayload, { headers });
            const itinerary = itinRes.itinerary;

            // 2. Add Itinerary Item via Server API
            const itemPayload = {
                title: `${resort.name} - ${pkg.name}`,
                activity_type: 'accommodation',
                cost_price: pkg.price,
                markup_type: 'percentage',
                markup_value: 10
                // final_price calculated by server
            };

            await axios.post(`/itineraries/${itinerary.id}/items`, itemPayload, { headers });

            toast.success("Itinerary created! Redirecting to Builder...");
            navigate(`/itineraries/${itinerary.id}`);

        } catch (error) {
            console.error("Booking Error:", error);
            const msg = error.response?.data?.error || error.message;
            toast.error("Failed to create itinerary: " + msg);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="flex h-screen items-center justify-center">Loading luxury experience...</div>;
    if (!resort) return null;

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Hero Section */}
            <div className="relative h-[60vh] w-full overflow-hidden bg-slate-900">
                {/* Main Full Width Background Image */}
                <div className="absolute inset-0">
                    <img
                        src={resort.image_url || "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1920&q=80"}
                        alt={resort.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "/resort-placeholder.svg";
                        }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

                {/* Navigation & Actions */}
                <div className="absolute top-6 left-6 right-6 flex justify-between items-center text-white">
                    <Button variant="ghost" className="hover:bg-white/20 text-white" onClick={() => navigate('/resorts')}>
                        <ArrowLeft className="w-5 h-5 mr-2" /> Back to Collection
                    </Button>
                    <div className="flex gap-2 items-center">
                        {/* Currency Toggle */}
                        <div className="bg-white/10 backdrop-blur-md rounded-lg p-1 flex items-center mr-2 border border-white/20">
                            <button
                                onClick={() => setCurrency('USD')}
                                className={`px-3 py-1 rounded-md text-sm font-bold transition-colors ${currency === 'USD' ? 'bg-white text-slate-900' : 'text-white hover:bg-white/10'}`}
                            >
                                USD
                            </button>
                            <button
                                onClick={() => setCurrency('CAD')}
                                className={`px-3 py-1 rounded-md text-sm font-bold transition-colors ${currency === 'CAD' ? 'bg-white text-slate-900' : 'text-white hover:bg-white/10'}`}
                            >
                                CAD
                            </button>
                        </div>

                        <Button variant="outline" size="icon" className="bg-white/10 border-white/20 hover:bg-white/20 text-white">
                            <Share2 className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="bg-white/10 border-white/20 hover:bg-white/20 text-white">
                            <Heart className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Hero Content */}
                <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 text-white">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-md px-3 py-1">
                                        {resort.country}
                                    </Badge>
                                    <div className="flex items-center text-yellow-400">
                                        <Star className="w-4 h-4 fill-current" />
                                        <span className="ml-1 font-bold">{resort.rating}</span>
                                    </div>
                                </div>
                                <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-2 drop-shadow-xl">
                                    {resort.name}
                                </h1>
                                <div className="flex items-center text-slate-300 text-lg">
                                    <MapPin className="w-5 h-5 mr-2" /> {resort.location}
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <div className="text-right mb-2">
                                    <span className="text-slate-300 text-sm block">Starting from</span>
                                    <span className="text-3xl font-bold">{resort.price_level ? Array(resort.price_level).fill('$').join('') : '$$$'}</span>
                                </div>
                                <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 font-bold px-8 shadow-2xl">
                                    Check Availability
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto -mt-10 relative z-10 px-8">
                <Tabs defaultValue="packages" className="space-y-8">
                    <TabsList className="h-14 p-1 bg-white shadow-xl rounded-2xl border border-slate-100 w-full md:w-auto inline-flex">
                        <TabsTrigger value="packages" className="h-full rounded-xl px-8 text-base font-medium data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                            Packages & Offers
                        </TabsTrigger>
                        <TabsTrigger value="overview" className="h-full rounded-xl px-8 text-base font-medium data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                            Overview
                        </TabsTrigger>
                        <TabsTrigger value="amenities" className="h-full rounded-xl px-8 text-base font-medium data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                            Amenities
                        </TabsTrigger>
                    </TabsList>

                    {/* PACKAGES TAB */}
                    <TabsContent value="packages" className="animate-in fade-in slide-in-from-bottom-4 duration-500">


                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-slate-900">Exclusive Packages</h2>
                            <AddPackageDialog
                                resortId={resort.id}
                                onPackageAdded={(newPkg) => setPackages([...packages, newPkg])}
                            />
                        </div>

                        {packages.length === 0 ? (
                            <Card className="bg-white/50 border-input border-dashed p-12 text-center">
                                <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                                    <DollarSign className="h-6 w-6 text-purple-600" />
                                </div>
                                <h3 className="text-lg font-medium text-slate-900">No Packages Available</h3>
                                <p className="text-slate-500 mb-6 max-w-sm mx-auto">Create your first travel package for this resort to start selling experiences.</p>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {packages.map((pkg, idx) => (
                                    <Card key={pkg.id} className={`relative overflow-hidden border-0 shadow-lg group hover:-translate-y-1 transition-all duration-300 ${idx === 1 ? 'ring-2 ring-purple-500 scale-105 md:scale-105 z-10 shadow-2xl' : 'bg-white'}`}>
                                        {idx === 1 && (
                                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500" />
                                        )}
                                        <CardHeader className="p-6 pb-2">
                                            <div className="flex justify-between items-start mb-2">
                                                <Badge variant="secondary" className="bg-slate-100">{pkg.duration_days} Days</Badge>
                                                {pkg.is_live && <Badge className="bg-green-600 animate-pulse">Live Rate</Badge>}
                                                {!pkg.is_live && idx === 1 && <Badge className="bg-purple-600">Best Value</Badge>}
                                            </div>
                                            <CardTitle className="text-2xl font-bold text-slate-900">{pkg.name}</CardTitle>
                                            <CardDescription className="line-clamp-2 mt-2">{pkg.description}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-6 py-4">
                                            <div className="flex items-baseline text-slate-900 mb-6">
                                                <span className="text-4xl font-extrabold tracking-tight">{formatPrice(pkg.price)}</span>
                                                <span className="ml-1 text-xl font-semibold text-slate-500">/pp</span>
                                            </div>
                                            <ul className="space-y-3">
                                                {(pkg.inclusions || []).map((inc, i) => (
                                                    <li key={i} className="flex items-start">
                                                        <div className="flex-shrink-0 h-5 w-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                                                            <Check className="h-3 w-3 text-green-600" />
                                                        </div>
                                                        <span className="ml-3 text-sm text-slate-600">{inc}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </CardContent>
                                        <CardFooter className="p-6 pt-0 mt-4">
                                            <Button
                                                className={`w-full font-semibold shadow-lg ${idx === 1 ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' : 'bg-slate-900 text-white'}`}
                                                onClick={() => handleSelectPackage(pkg)}
                                            >
                                                Select Package
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* OVERVIEW TAB */}
                    <TabsContent value="overview">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="md:col-span-2">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>About {resort.name}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="prose prose-slate max-w-none">
                                        <p className="text-slate-600 leading-relaxed text-lg">{resort.description}</p>
                                        <div className="mt-8 grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-slate-50 rounded-xl">
                                                <h4 className="font-semibold text-slate-900 mb-1">Check-in</h4>
                                                <p className="text-sm text-slate-500">From 3:00 PM</p>
                                            </div>
                                            <div className="p-4 bg-slate-50 rounded-xl">
                                                <h4 className="font-semibold text-slate-900 mb-1">Check-out</h4>
                                                <p className="text-sm text-slate-500">Until 12:00 PM</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="mt-8 border-purple-100 bg-purple-50/50">
                                    <CardHeader>
                                        <CardTitle className="text-purple-900 flex items-center">
                                            <Star className="w-5 h-5 mr-2 fill-purple-600 text-purple-600" />
                                            What's Included
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {["All Meals & Snacks", "Untimited Premium Drinks", "Non-motorized Water Sports", "Daily Entertainment", "Room Service (24/7)", "Kids Club Access"].map((item, i) => (
                                                <li key={i} className="flex items-center text-slate-700">
                                                    <Check className="w-4 h-4 text-green-600 mr-2" /> {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            </div>
                            <div>
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Location</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-48 bg-slate-200 rounded-lg flex items-center justify-center mb-4">
                                            <MapPin className="w-8 h-8 text-slate-400" />
                                            <span className="ml-2 text-slate-500">Map Preview</span>
                                        </div>
                                        <p className="text-sm text-slate-600 mb-2">{resort.location}, {resort.country}</p>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    {/* AMENITIES TAB */}
                    <TabsContent value="amenities">
                        <Card>
                            <CardHeader><CardTitle>Resort Amenities</CardTitle></CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {(resort.amenities || []).map((amenity, i) => (
                                        <div key={i} className="flex items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                                            <Waves className="w-5 h-5 text-blue-500 mr-3" />
                                            <span className="font-medium text-slate-700">{amenity}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
