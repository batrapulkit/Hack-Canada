import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import api from '../api/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, MapPin, Star, Users, Trash2, Calendar, Loader2, Plus, Minus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { toast } from 'sonner';
import AddResortDialog from '../components/resorts/AddResortDialog';
import AIMatcherDialog from '../components/resorts/AIMatcherDialog';

export default function Resorts() {
    const [resorts, setResorts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [startDate, setStartDate] = useState('');
    // Departure City removed
    const [travelDate, setTravelDate] = useState('');
    const [tourOperator, setTourOperator] = useState('');
    const [adults, setAdults] = useState(2);
    const [children, setChildren] = useState(0);
    const [childAges, setChildAges] = useState([]);
    const [requirements, setRequirements] = useState('');
    const navigate = useNavigate();

    // Update child ages array when children count changes
    useEffect(() => {
        setChildAges(prev => {
            const newAges = [...prev];
            if (children > prev.length) {
                // Add default age 5 for new children
                return [...newAges, ...Array(children - prev.length).fill(5)];
            } else {
                // Trim
                return newAges.slice(0, children);
            }
        });
    }, [children]);

    const handleChildAgeChange = (index, value) => {
        const newAges = [...childAges];
        newAges[index] = parseInt(value) || 0;
        setChildAges(newAges);
    };

    useEffect(() => {
        fetchResorts();
    }, []);

    const fetchResorts = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('resorts')
                .select('*')
                .order('rating', { ascending: false });

            if (error) throw error;
            setResorts(data || []);
        } catch (error) {
            console.error('Error fetching resorts:', error);
            toast.error('Failed to load resorts');
        } finally {
            setLoading(false);
        }
    };

    const searchResorts = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);


        try {
            const res = await api.get('/resorts/search', {
                params: {
                    destination: searchQuery,
                    budget_level: 2,
                    amenities: requirements,
                    adults: adults,
                    children: children,
                    child_ages: childAges.join(',')
                }
            });

            // Handle mixing DB and Amadeus results
            // API returns straight JSON array (res.data)
            const raw = res.data;
            const results = Array.isArray(raw) ? raw : (raw.data || raw.results || []);

            setResorts(results);

            if (results.length === 0) {
                toast.info("No resorts found.");
            }

        } catch (err) {
            console.error(err);
            // Skip error UI if handled by global key checker
            if (err?.response?.status !== 412) {
                toast.error("Failed to search resorts.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery) {
            fetchResorts(); // If no search query, fetch all resorts
            return;
        }
        searchResorts(); // Call the new searchResorts function
    };

    const displayResorts = resorts;

    const getPriceLabel = (level) => {
        return Array(level).fill('$').join('');
    };

    const handleResortAction = async (resort, action = 'details') => {
        if (!resort.is_external) {
            navigate(`/resorts/${resort.id}`);
            return;
        }

        // Import Logic for External Resorts
        try {
            toast.loading("Importing resort details...");
            const { data } = await api.post('/resorts/import', resort);

            if (data && data.id) {
                toast.dismiss();
                toast.success("Resort imported successfully");
                navigate(`/resorts/${data.id}`);
            }
        } catch (error) {
            console.error("Import failed", error);
            toast.dismiss();
            toast.error(error.response?.data?.details || "Failed to access resort details");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this resort?")) return;

        try {
            await api.delete(`/resorts/${id}`);
            toast.success("Resort deleted");
            setResorts(prev => prev.filter(r => r.id !== id));
        } catch (error) {
            console.error("Delete failed", error);
            toast.error("Failed to delete resort");
        }
    };

    return (
        <div className="p-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Resorts Collection</h1>
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">BETA</Badge>
                        </div>
                        <p className="text-slate-500 mt-1">Manage your curated list of contracting resorts for AI ranking.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <AIMatcherDialog />
                        <AddResortDialog onResortAdded={(newResort) => setResorts([newResort, ...resorts])} />
                    </div>
                </div>

                {/* Advanced Search Bar */}
                {/* Professional Resort Search Bar */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-2">
                    <div className="flex flex-col lg:flex-row items-center divide-y lg:divide-y-0 lg:divide-x divide-slate-100">

                        {/* Destination */}
                        <div className="flex-1 w-full p-2 relative group">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1 pl-8">Destination</label>
                            <div className="relative">
                                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-purple-600 transition-colors" />
                                <Input
                                    placeholder="Where do they want to go?"
                                    className="border-0 shadow-none focus-visible:ring-0 p-0 pl-9 text-base font-semibold placeholder:font-normal placeholder:text-slate-400 h-9"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="w-full lg:w-48 p-2 relative group">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1 pl-8">Check-in</label>
                            <div className="relative">
                                <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-purple-600 transition-colors" />
                                <Input
                                    type="date"
                                    className="border-0 shadow-none focus-visible:ring-0 p-0 pl-9 text-sm font-medium h-9"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Guests */}
                        {/* Guests Popover */}
                        <div className="w-full lg:w-48 p-2 relative group">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1 pl-8">Guests</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <div className="relative cursor-pointer">
                                        <Users className="absolute left-2 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-purple-600 transition-colors" />
                                        <Button
                                            variant="ghost"
                                            className="w-full justify-start pl-9 text-left text-sm font-medium text-slate-900 hover:bg-transparent hover:text-slate-900 h-9"
                                        >
                                            {adults} Adt, {children} Chd
                                        </Button>
                                    </div>
                                </PopoverTrigger>
                                <PopoverContent className="w-80 bg-white p-4 shadow-xl border-slate-200" align="start">
                                    <div className="space-y-4">
                                        <h4 className="font-semibold leading-none text-slate-900">Guest Configuration</h4>
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium text-slate-900">Adults</p>
                                                <p className="text-xs text-slate-500">Ages 13+</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => setAdults(Math.max(1, adults - 1))}
                                                    disabled={adults <= 1}
                                                >
                                                    <Minus className="w-3 h-3" />
                                                </Button>
                                                <span className="w-4 text-center text-sm font-medium">{adults}</span>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => setAdults(adults + 1)}
                                                >
                                                    <Plus className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium text-slate-900">Children</p>
                                                <p className="text-xs text-slate-500">Ages 0-12</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => setChildren(Math.max(0, children - 1))}
                                                    disabled={children <= 0}
                                                >
                                                    <Minus className="w-3 h-3" />
                                                </Button>
                                                <span className="w-4 text-center text-sm font-medium">{children}</span>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => setChildren(children + 1)}
                                                >
                                                    <Plus className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Search Button */}
                        <div className="p-2 w-full lg:w-auto">
                            <Button
                                className="w-full lg:w-auto rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-md h-14 px-8 text-base"
                                onClick={handleSearch}
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5 mr-2" />}
                                Search
                            </Button>
                        </div>
                    </div>

                    {/* Extended Options (Collapsible or just below) */}
                    <div className="flex flex-wrap gap-4 p-4 pt-2 border-t border-slate-50">
                        {/* Tour Operator */}
                        <div className="w-full md:w-48">
                            <select
                                className="w-full rounded-md border-0 bg-slate-50 py-1.5 pl-3 text-sm text-slate-600 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-purple-600"
                                value={tourOperator}
                                onChange={(e) => setTourOperator(e.target.value)}
                            >
                                <option value="">Any Operator</option>
                                <option value="acv">Air Canada Vacations</option>
                                <option value="sunwing">Sunwing</option>
                                <option value="westjet">WestJet</option>
                                <option value="transat">Transat</option>
                            </select>
                        </div>

                        {/* Child Ages */}
                        {children > 0 && (
                            <div className="flex items-center gap-2 overflow-x-auto pb-1">
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">Ages:</span>
                                {childAges.map((age, idx) => (
                                    <Input
                                        key={idx}
                                        type="number"
                                        min="0"
                                        max="17"
                                        className="w-12 h-8 text-center text-xs bg-slate-50 border-slate-200 rounded"
                                        value={age}
                                        onChange={(e) => handleChildAgeChange(idx, e.target.value)}
                                        placeholder="Age"
                                    />
                                ))}
                            </div>
                        )}

                        <div className="flex-1 min-w-[200px]">
                            <Input
                                placeholder="Specific requirements (e.g. swim-up bar)..."
                                value={requirements}
                                onChange={(e) => setRequirements(e.target.value)}
                                className="h-8 text-sm bg-slate-50 border-slate-200"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="text-center py-12 text-slate-500">Loading resorts...</div>
            ) : displayResorts.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    <div className="max-w-md mx-auto">
                        <h3 className="text-lg font-medium text-slate-900 mb-1">No resorts found</h3>
                        <p className="text-slate-500 mb-4">Get started by adding your first resort contract or contract partners.</p>
                        <div className="flex justify-center">
                            <AddResortDialog onResortAdded={(newResort) => setResorts([newResort, ...resorts])} />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                    {displayResorts.map((resort) => (
                        <Card key={resort.id} className="group hover:shadow-xl transition-all duration-300 border-slate-200 overflow-hidden">
                            {/* Image Header */}
                            <div className="h-48 bg-slate-100 relative overflow-hidden">
                                {resort.image_url ? (
                                    <img
                                        src={resort.image_url}
                                        alt={resort.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = "/resort-placeholder.svg";
                                        }}
                                    />
                                ) : (
                                    <img
                                        src="/resort-placeholder.svg"
                                        alt={resort.name}
                                        className="w-full h-full object-cover"
                                    />
                                )}
                                <div className="absolute top-3 right-3">
                                    <Badge className="bg-white/90 text-slate-900 backdrop-blur-sm shadow-sm border-0 font-bold">
                                        {resort.rating} <Star className="w-3 h-3 ml-1 fill-yellow-400 text-yellow-400" />
                                    </Badge>
                                </div>
                            </div>

                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-lg font-bold text-slate-900 line-clamp-1">{resort.name}</CardTitle>
                                        <CardDescription className="flex items-center mt-1">
                                            <MapPin className="w-3 h-3 mr-1" /> {resort.location}, {resort.country}
                                            {resort.is_external && (
                                                <Badge variant="outline" className="ml-2 text-blue-600 border-blue-200 text-[10px] h-5">
                                                    {resort.id.startsWith('ai_') ? 'AI Simul.' : 'Amadeus Live'}
                                                </Badge>
                                            )}
                                        </CardDescription>
                                    </div>
                                    <Badge variant="outline" className="text-slate-600 border-slate-200 bg-slate-50">
                                        {getPriceLabel(resort.price_level)}
                                    </Badge>
                                </div>
                            </CardHeader>

                            <CardContent>
                                <div className="flex flex-wrap gap-1.5 mb-3">
                                    {resort.tags && resort.tags.slice(0, 3).map(tag => (
                                        <Badge key={tag} variant="secondary" className="text-xs bg-slate-100 text-slate-600 hover:bg-slate-200">
                                            {tag}
                                        </Badge>
                                    ))}
                                    {resort.tags && resort.tags.length > 3 && (
                                        <span className="text-xs text-slate-400 flex items-center">+{resort.tags.length - 3}</span>
                                    )}
                                </div>
                                <p className="text-sm text-slate-600 line-clamp-2">
                                    {resort.description || "No description provided."}
                                </p>
                            </CardContent>

                            <CardFooter className="pt-0 border-t border-slate-100 mt-4 p-4 bg-slate-50/30 flex justify-between items-center">
                                <div className="space-y-2">
                                    <div className="text-xs text-slate-500 font-medium flex justify-between">
                                        <span>AI Sentiment: <span className={resort.sentiment_score > 0.8 ? "text-green-600" : "text-amber-600"}>
                                            {Math.round((resort.sentiment_score || 0) * 100)}% Positive
                                        </span></span>
                                    </div>

                                    {/* AI Match Reasons */}
                                    {resort.match_details && resort.match_details.length > 0 && (
                                        <div className="bg-purple-50 rounded-md p-2 border border-purple-100">
                                            <p className="text-[10px] font-bold text-purple-700 uppercase mb-1 flex items-center">
                                                <Star className="w-3 h-3 mr-1 fill-purple-600" /> Top Match Factors
                                            </p>
                                            <ul className="text-[10px] text-purple-900 space-y-0.5">
                                                {resort.match_details.slice(0, 2).map((reason, i) => (
                                                    <li key={i} className="line-clamp-1">• {reason}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900" onClick={() => handleResortAction(resort, 'details')}>
                                        Details
                                    </Button>
                                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm" onClick={() => handleResortAction(resort, 'add')}>
                                        Add to Trip
                                    </Button>
                                    {!resort.is_external && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-500 hover:bg-red-50 hover:text-red-600"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(resort.id);
                                            }}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

