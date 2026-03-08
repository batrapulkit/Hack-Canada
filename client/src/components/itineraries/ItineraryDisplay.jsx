import React from 'react';
import {
    MapPin,
    Calendar,
    Clock,
    DollarSign,
    Utensils,
    Info,
    Plane,
    Hotel,
    CheckCircle2,
    Sparkles,
    ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDayImageUrl } from "@/utils/imageUtils";

export default function ItineraryDisplay({ data, itineraryItems = [], hideHeader = false }) {
    const [imgError, setImgError] = React.useState({});

    const handleImgError = (index) => {
        setImgError(prev => ({ ...prev, [index]: true }));
    };

    if (!data) return null;

    // Handle both direct object and stringified JSON
    let itinerary = data;
    let parseError = null;

    if (typeof data === 'string') {
        try {
            const firstOpen = data.indexOf('{');
            const lastClose = data.lastIndexOf('}');

            if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
                const jsonStr = data.substring(firstOpen, lastClose + 1);
                itinerary = JSON.parse(jsonStr);
            } else {
                itinerary = JSON.parse(data);
            }
        } catch (e) {
            console.error("Failed to parse itinerary JSON", e);
            parseError = e.message;
            return (
                <div className="space-y-4">
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                        <h3 className="font-bold flex items-center gap-2">
                            <Info className="w-4 h-4" />
                            Unable to display premium view
                        </h3>
                        <p className="text-sm mt-1">We couldn't parse the itinerary data. Error: {parseError}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 font-mono text-sm whitespace-pre-wrap text-slate-700">
                        {data}
                    </div>
                </div>
            );
        }
    }

    // Normalize data structure
    const title = itinerary.title || itinerary.destination || "Trip Itinerary";
    const summary = itinerary.summary || itinerary.description || itinerary.overview;
    const days = itinerary.daily || itinerary.dailyPlan || itinerary.days || [];
    const tips = itinerary.travel_tips || itinerary.tips || [];
    const cuisine = itinerary.local_cuisine || itinerary.cuisine || [];

    // Logic to find hotel/flights from either JSON or Itinerary Items (Pricing)
    const jsonHotel = itinerary.hotel;
    const itemHotel = itineraryItems?.find(i =>
        i.title.toLowerCase().includes('hotel') ||
        i.title.toLowerCase().includes('stay') ||
        i.title.toLowerCase().includes('accommodation') ||
        i.title.toLowerCase().includes('resort')
    );

    // Construct displayed Hotel object
    const hotel = jsonHotel || (itemHotel ? {
        name: itemHotel.title,
        type: 'Accommodation',
        price: itemHotel.final_price ? formatPrice(itemHotel.final_price) : 'Check Price',
        // If it's an item, we don't have detailed "recommendation" or "type" fields usually, so we map simply
    } : {
        // ROBUST DEFAULT
        name: "Recommended Accommodation",
        type: "4-Star Standard",
        price: "Varies by dates",
        recommendation: "Centrally located 4-star hotel or similar"
    });


    const jsonFlights = itinerary.flights;
    const itemFlight = itineraryItems?.find(i =>
        i.title.toLowerCase().includes('flight') ||
        i.title.toLowerCase().includes('airline') ||
        i.title.toLowerCase().includes('ticket')
    );

    const flights = jsonFlights || (itemFlight ? {
        airline: itemFlight.title,
        departure: 'Departure', // Placeholder as line item doesn't have route info
        price: itemFlight.final_price ? formatPrice(itemFlight.final_price) : 'Check Price'
    } : {
        // ROBUST DEFAULT
        airline: "Major International Carriers",
        departure: "Your City",
        price: "Check current rates"
    });

    const currencyCode = itinerary.currency || 'USD';
    const formatPrice = (amount) => {
        if (!amount || isNaN(amount)) return amount;
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currencyCode,
            maximumFractionDigits: 0
        }).format(amount);
    };


    return (
        <div className="space-y-10 w-full mx-auto pb-12">
            {/* Header Section */}
            <div className={`relative overflow-hidden rounded-3xl bg-slate-900 text-white shadow-2xl ring-1 ring-white/10 ${hideHeader ? 'h-48' : ''}`}>
                <div className="absolute inset-0">
                    <img
                        src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2070&auto=format&fit=crop"
                        alt="Cover"
                        className="w-full h-full object-cover opacity-50"
                        onError={(e) => {
                            e.target.src = "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2070&auto=format&fit=crop";
                        }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-900/20" />
                </div>

                <div className={`relative ${hideHeader ? 'p-6' : 'p-8 md:p-12'}`}>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                        <div className="space-y-4 max-w-3xl">
                            {!hideHeader && (
                                <Badge className="bg-amber-500/20 text-amber-200 border-amber-500/30 backdrop-blur-md px-3 py-1 hover:bg-amber-500/30">
                                    <Sparkles className="w-3 h-3 mr-2 text-amber-400" />
                                    AI Generated Trip Plan
                                </Badge>
                            )}
                            <h1 className={`${hideHeader ? 'text-2xl md:text-3xl' : 'text-4xl md:text-5xl'} font-bold tracking-tight text-white leading-tight`}>
                                {title}
                            </h1>
                            {summary && !hideHeader && (
                                <p className="text-lg text-slate-200 leading-relaxed font-light border-l-2 border-amber-500/50 pl-4">
                                    {summary}
                                </p>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-3">
                            {itinerary.destination && (
                                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-slate-100 shadow-sm">
                                    <MapPin className="w-4 h-4 text-amber-400" />
                                    <span className="font-medium">{itinerary.destination}</span>
                                </div>
                            )}
                            {itinerary.duration && (
                                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-slate-100 shadow-sm">
                                    <Clock className="w-4 h-4 text-amber-400" />
                                    <span className="font-medium">{itinerary.duration} Days</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Costs Breakdown & Logistics - ALWAYS RENDERED for consistency */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Cost Summary */}
                <Card className="border-slate-100 shadow-sm hover:shadow-md transition-shadow bg-emerald-50/50 overflow-hidden group h-full">
                    <div className="h-1 bg-emerald-500 w-0 group-hover:w-full transition-all duration-500" />
                    <CardHeader className="pb-3 pt-5">
                        <CardTitle className="flex items-center gap-3 text-lg text-slate-800">
                            <div className="p-2 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
                                <DollarSign className="w-5 h-5 text-emerald-700" />
                            </div>
                            Estimated Budget
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pb-6">
                        <div className="font-bold text-slate-900 text-2xl">
                            {itineraryItems && itineraryItems.length > 0
                                ? formatPrice(itineraryItems.reduce((sum, item) => sum + (Number(item.final_price) || 0), 0))
                                : (itinerary.estimated_total_cost && !itinerary.estimated_total_cost.toString().includes(currencyCode) && !isNaN(parseFloat(itinerary.estimated_total_cost))
                                    ? formatPrice(parseFloat(itinerary.estimated_total_cost))
                                    : (itinerary.estimated_total_cost || "TBD"))}
                        </div>
                        <p className="text-sm text-slate-500">Total estimated cost for the entire trip.</p>
                    </CardContent>
                </Card>

                {/* Accommodation - Always rendered with fallback */}
                {/* Accommodation - Conditionally rendered */}
                {/* Accommodation - Conditionally rendered */}
                {itinerary.include_accommodation !== false && (
                    <Card className="border-slate-100 shadow-sm hover:shadow-md transition-shadow bg-white overflow-hidden group h-full">
                        <div className="h-1 bg-amber-500 w-0 group-hover:w-full transition-all duration-500" />
                        <CardHeader className="pb-3 pt-5">
                            <CardTitle className="flex items-center gap-3 text-lg text-slate-800">
                                <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-slate-100 transition-colors">
                                    <Hotel className="w-5 h-5 text-slate-600" />
                                </div>
                                Accommodation
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 pb-6">
                            {/* Check for Multiple Options First */}
                            {data.accommodation_options && data.accommodation_options.length > 0 ? (
                                <div className="space-y-4">
                                    {data.accommodation_options.map((opt, idx) => (
                                        <div key={idx} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                                            <div className="font-bold text-slate-900 text-sm">{opt.name}</div>
                                            <div className="text-xs text-slate-500 flex justify-between mt-1">
                                                <span>{opt.location || opt.type}</span>
                                                <span className="font-medium text-amber-600">{opt.price || "Check Price"}</span>
                                            </div>
                                            {opt.rating && (
                                                <div className="flex items-center gap-1 mt-1">
                                                    <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                                                        ★ {opt.rating}
                                                    </span>
                                                    {opt.reason && <span className="text-[10px] text-slate-400 italic truncate max-w-[120px]">{opt.reason}</span>}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : hotel ? (
                                <>
                                    <div className="font-bold text-slate-900 text-lg">{hotel.recommendation || hotel.name}</div>
                                    <div className="space-y-2">
                                        {hotel.type && (
                                            <div className="flex justify-between text-sm text-slate-500 border-b border-slate-50 pb-2">
                                                <span>Type</span>
                                                <span className="font-medium text-slate-700">{hotel.type}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-sm text-slate-500">
                                            <span>Approx. Cost</span>
                                            <span className="font-medium text-slate-700">
                                                {hotel.estimated_cost_per_night || hotel.price || "Check Price"}
                                            </span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="h-full flex flex-col justify-center text-slate-400 text-sm italic py-2">
                                    <p>No specific hotel included.</p>
                                    <p>Add one in "Pricing & Costing"</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Flights - Always rendered with fallback */}
                <Card className="border-slate-100 shadow-sm hover:shadow-md transition-shadow bg-white overflow-hidden group h-full">
                    <div className="h-1 bg-blue-500 w-0 group-hover:w-full transition-all duration-500" />
                    <CardHeader className="pb-3 pt-5">
                        <CardTitle className="flex items-center gap-3 text-lg text-slate-800">
                            <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-slate-100 transition-colors">
                                <Plane className="w-5 h-5 text-slate-600" />
                            </div>
                            Flights
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pb-6">
                        {flights ? (
                            <>
                                <div className="font-bold text-slate-900 text-lg">{flights.airline}</div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm text-slate-500 border-b border-slate-50 pb-2">
                                        <span>Route</span>
                                        <span className="font-medium text-slate-700">{flights.departure} <ArrowRight className="w-3 h-3 inline mx-1" /> {itinerary.destination}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-slate-500">
                                        <span>Approx. Cost</span>
                                        <span className="font-medium text-slate-700">
                                            {flights.price || "Check Price"}
                                        </span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="h-full flex flex-col justify-center text-slate-400 text-sm italic py-2">
                                <p>Flights not included.</p>
                                <p>Add one in "Pricing & Costing"</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Daily Itinerary - Horizontal Cards */}
            <div className="space-y-8">
                <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                    <Calendar className="w-6 h-6 text-slate-400" />
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Day by Day Plan</h2>
                </div>

                <div className="space-y-8">
                    {/* Empty State */}
                    {days.length === 0 && (
                        <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <h3 className="text-lg font-medium text-gray-900">No daily plan available</h3>
                            <p className="text-gray-500 max-w-sm mx-auto mt-1">
                                This itinerary doesn't have a generated daily plan yet. You can regenerate it using AI or add items manually.
                            </p>
                        </div>
                    )}

                    {days.map((day, index) => {
                        // Image Logic
                        // Robust Image Selection Logic (Matching PDF Generator)
                        const contextText = (day.title + " " + (day.description || "") + " " + (itinerary.destination || "")).toLowerCase();
                        // Use shared utility for consistent, diverse images
                        const imgUrl = getDayImageUrl(contextText, index, itinerary.id || itinerary._id || 'default');

                        return (
                            <Card key={index} className="overflow-hidden bg-white border border-slate-200 hover:shadow-xl transition-all duration-300 group">
                                <div className="flex flex-col md:flex-row h-full">
                                    {/* Day Indicator & Image wrapper */}
                                    <div className="relative md:w-72 md:shrink-0">
                                        <img
                                            src={imgError[index] ? "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1200" : imgUrl}
                                            alt={day.title}
                                            className="w-full h-64 md:h-full object-cover"
                                            onError={() => handleImgError(index)}
                                        />
                                        <div className="absolute top-4 left-4">
                                            <span className="inline-flex items-center justify-center bg-white/95 backdrop-blur shadow-sm px-4 py-1.5 rounded-full text-sm font-bold text-slate-900 ring-1 ring-slate-900/5">
                                                Day {day.day}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 p-6 md:p-8 flex flex-col">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                                            <h3 className="text-2xl font-bold text-slate-800 group-hover:text-amber-600 transition-colors">
                                                {day.title}
                                            </h3>
                                            {day.date && (
                                                <div className="flex items-center text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-100 text-sm">
                                                    <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                                                    {day.date}
                                                </div>
                                            )}
                                        </div>

                                        <div className="prose prose-slate prose-sm text-slate-600 mb-6 grow space-y-3">
                                            {day.morning && (
                                                <div>
                                                    <span className="text-xs font-bold text-amber-600 uppercase tracking-widest block mb-1">Morning</span>
                                                    <p className="mt-0">{day.morning}</p>
                                                </div>
                                            )}
                                            {day.afternoon && (
                                                <div>
                                                    <span className="text-xs font-bold text-amber-600 uppercase tracking-widest block mb-1">Afternoon</span>
                                                    <p className="mt-0">{day.afternoon}</p>
                                                </div>
                                            )}
                                            {day.evening && (
                                                <div>
                                                    <span className="text-xs font-bold text-amber-600 uppercase tracking-widest block mb-1">Evening</span>
                                                    <p className="mt-0">{day.evening}</p>
                                                </div>
                                            )}

                                            {/* Fallback if no sections are defined but description/summary exists */}
                                            {(!day.morning && !day.afternoon && !day.evening) && (
                                                <p className="leading-relaxed">
                                                    {day.description || day.summary}
                                                </p>
                                            )}
                                        </div>

                                        {/* Highlights Footer */}
                                        {(day.activities?.length > 0 || (day.meals && Object.values(day.meals).some(m => m))) && (
                                            <div className="pt-6 border-t border-slate-100 flex flex-wrap gap-6 mt-auto">
                                                {day.activities?.length > 0 && (
                                                    <div className="flex-1 min-w-[240px]">
                                                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-3">Highlights</span>
                                                        <div className="flex flex-wrap gap-2">
                                                            {day.activities.map((act, i) => (
                                                                <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100/50">
                                                                    <CheckCircle2 className="w-3 h-3 mr-1.5 text-emerald-500" />
                                                                    {act}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {day.meals && Object.values(day.meals).some(m => m) && (
                                                    <div>
                                                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-3">Dining</span>
                                                        <div className="flex items-center gap-2">
                                                            {day.meals.breakfast && (
                                                                <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 border border-orange-100" title="Breakfast">
                                                                    <Utensils className="w-4 h-4" />
                                                                </div>
                                                            )}
                                                            {day.meals.lunch && (
                                                                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 border border-blue-100" title="Lunch">
                                                                    <Utensils className="w-4 h-4" />
                                                                </div>
                                                            )}
                                                            {day.meals.dinner && (
                                                                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 border border-indigo-100" title="Dinner">
                                                                    <Utensils className="w-4 h-4" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* Travel Tips - Clean Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                <Card className="bg-slate-50/50 border-slate-200/60 shadow-none h-full">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base text-slate-700">
                            <Info className="w-4 h-4 text-amber-500" />
                            Essential Tips
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {tips.length > 0 ? (
                            <ul className="space-y-2">
                                {tips.slice(0, 6).map((tip, i) => (
                                    <li key={i} className="flex gap-2 text-slate-600 text-sm items-start">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                                        <span>{tip}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <span className="text-sm text-slate-400 italic">No specific travel tips for this itinerary.</span>
                        )}
                    </CardContent>
                </Card>

                <Card className="bg-slate-50/50 border-slate-200/60 shadow-none h-full">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base text-slate-700">
                            <Utensils className="w-4 h-4 text-amber-500" />
                            Local Flavors to Try
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {cuisine.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {cuisine.slice(0, 8).map((item, i) => (
                                    <span key={i} className="text-sm text-slate-600 bg-white border border-slate-200 px-2 py-1 rounded-md">
                                        {item}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <span className="text-sm text-slate-400 italic">No specific cuisine recommendations.</span>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
