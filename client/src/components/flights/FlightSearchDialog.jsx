import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plane, AlertCircle, CheckCircle, Info, Search, MapPin, Calendar, Clock } from "lucide-react";
import api from "@/api/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"; // Ensure this exists or use alternative

export default function FlightSearchDialog({ open, onOpenChange, onAddBooking, itineraryId }) {
    const [searchParams, setSearchParams] = useState({
        from: '',
        to: '',
        departDate: '',
        passengers: 1,
        class: 'ECONOMY'
    });
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [manualMode, setManualMode] = useState(false);

    // Manual Entry State
    const [manualFlight, setManualFlight] = useState({
        description: '',
        airline: '',
        flightNumber: '',
        price: 0,
        currency: 'USD'
    });

    const handleSearch = async () => {
        setLoading(true);
        setError(null);
        setResults([]);

        try {
            const res = await api.post('/amadeus/flights', searchParams);

            if (Array.isArray(res.data)) {
                setResults(res.data);
                if (res.data.length === 0) {
                    setError('No flights found for this route.');
                }
            } else {
                console.error("Unexpected response:", res.data);
                throw new Error(res.data?.error || 'Invalid response format');
            }
        } catch (err) {
            console.error(err);
            // If it's a key error, the global interceptor will handle the popup.
            // We just clear results and stop loading.
            if (err.response?.status !== 412) {
                setError('Flight search unavailable. Please enter details manually.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleAddResult = (flight) => {
        const bookingData = {
            itinerary_id: itineraryId,
            booking_type: 'flight',
            booking_status: 'planned',
            description: `Flight: ${flight.from} to ${flight.to} (${flight.airline} ${flight.flightNumber})`,
            sell_price: flight.price,
            cost: flight.price,
            travel_date: `${searchParams.departDate}T${flight.departTime}:00`,
            metadata: {
                ...flight._raw,
                currency: flight.currency,
                source: 'amadeus_live_search',
                quoted_at: new Date().toISOString()
            }
        };

        if (onAddBooking) {
            onAddBooking(bookingData);
        }
        onOpenChange(false);
        setResults([]);
    };

    const handleManualSubmit = () => {
        if (!manualFlight.description) return;

        const bookingData = {
            itinerary_id: itineraryId,
            booking_type: 'flight',
            booking_status: 'planned',
            description: manualFlight.description,
            sell_price: parseFloat(manualFlight.price) || 0,
            cost: parseFloat(manualFlight.price) || 0,
            travel_date: manualFlight.date || searchParams.departDate || null,
            metadata: {
                currency: manualFlight.currency,
                airline: manualFlight.airline,
                flightNumber: manualFlight.flightNumber,
                source: 'manual_entry',
                quoted_at: new Date().toISOString()
            }
        };

        if (onAddBooking) {
            onAddBooking(bookingData);
        }
        onOpenChange(false);
        setManualMode(false);
        setManualFlight({ description: '', airline: '', flightNumber: '', price: 0, currency: 'USD' });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" aria-describedby="flight-search-description">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <DialogTitle>Find Flights</DialogTitle>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200 text-[10px] px-1.5 py-0 h-5">BETA</Badge>
                    </div>
                    <DialogDescription id="flight-search-description">
                        Search live availability. <span className="font-bold text-amber-600">Prices are indicative and not ticketed.</span>
                    </DialogDescription>
                </DialogHeader>

                {(error || manualMode) ? (
                    <div className="space-y-4 border p-4 rounded-lg bg-orange-50">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-orange-800 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" /> Manual Flight Entry
                            </h3>
                            <Button variant="ghost" size="sm" onClick={() => { setManualMode(false); setError(null); }}>
                                Back to Search
                            </Button>
                        </div>
                        <p className="text-sm text-orange-700 mb-4">
                            {error ? `System Notice: ${error}` : 'Manually enter flight details below.'}
                        </p>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="text-xs font-medium">Description (Route)</label>
                                <Input
                                    placeholder="e.g. LHR to JFK, BA117"
                                    value={manualFlight.description}
                                    onChange={e => setManualFlight({ ...manualFlight, description: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium">Airline Code</label>
                                <Input
                                    placeholder="e.g. BA"
                                    value={manualFlight.airline}
                                    onChange={e => setManualFlight({ ...manualFlight, airline: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium">Est. Price</label>
                                <div className="flex gap-2">
                                    <Input
                                        type="number"
                                        placeholder="0.00"
                                        value={manualFlight.price}
                                        onChange={e => setManualFlight({ ...manualFlight, price: e.target.value })}
                                    />
                                    <Select
                                        value={manualFlight.currency}
                                        onValueChange={v => setManualFlight({ ...manualFlight, currency: v })}
                                    >
                                        <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="USD">USD</SelectItem>
                                            <SelectItem value="EUR">EUR</SelectItem>
                                            <SelectItem value="GBP">GBP</SelectItem>
                                            <SelectItem value="CAD">CAD</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-medium">Travel Date</label>
                                <Input
                                    type="date"
                                    value={manualFlight.date || searchParams.departDate}
                                    onChange={e => setManualFlight({ ...manualFlight, date: e.target.value })}
                                />
                            </div>
                        </div>
                        <Button onClick={handleManualSubmit} className="w-full bg-orange-600 text-white hover:bg-orange-700">
                            Add Planned Flight
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Professional Search Bar */}
                        <div className="flex flex-col md:flex-row items-center bg-white rounded-xl border border-slate-200 shadow-sm p-1.5 gap-1.5 md:gap-0">

                            {/* Origin */}
                            <div className="flex-1 w-full md:w-auto relative group">
                                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                    <Plane className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                </div>
                                <div className="flex flex-col px-3 py-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-6">From</label>
                                    <Input
                                        className="border-0 shadow-none focus-visible:ring-0 p-0 h-6 pl-6 text-base font-semibold placeholder:font-normal"
                                        placeholder="Origin"
                                        value={searchParams.from}
                                        onChange={e => setSearchParams({ ...searchParams, from: e.target.value.toUpperCase() })}
                                        maxLength={3}
                                    />
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="hidden md:block w-px h-10 bg-slate-100 mx-2" />

                            {/* Destination */}
                            <div className="flex-1 w-full md:w-auto relative group">
                                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                    <MapPin className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                </div>
                                <div className="flex flex-col px-3 py-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-6">To</label>
                                    <Input
                                        className="border-0 shadow-none focus-visible:ring-0 p-0 h-6 pl-6 text-base font-semibold placeholder:font-normal"
                                        placeholder="Destination"
                                        value={searchParams.to}
                                        onChange={e => setSearchParams({ ...searchParams, to: e.target.value.toUpperCase() })}
                                        maxLength={3}
                                    />
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="hidden md:block w-px h-10 bg-slate-100 mx-2" />

                            {/* Date */}
                            <div className="flex-1 w-full md:w-auto relative group">
                                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                    <Calendar className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                </div>
                                <div className="flex flex-col px-3 py-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-6">Departure</label>
                                    <Input
                                        type="date"
                                        className="border-0 shadow-none focus-visible:ring-0 p-0 h-6 pl-6 text-sm font-medium"
                                        value={searchParams.departDate}
                                        onChange={e => setSearchParams({ ...searchParams, departDate: e.target.value })}
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="hidden md:block w-px h-10 bg-slate-100 mx-2" />

                            {/* Class */}
                            <div className="w-full md:w-40 relative">
                                <Select
                                    value={searchParams.class}
                                    onValueChange={v => setSearchParams({ ...searchParams, class: v })}
                                >
                                    <SelectTrigger className="border-0 shadow-none focus:ring-0 h-auto py-2 pl-2">
                                        <div className="text-left">
                                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Class</div>
                                            <SelectValue />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ECONOMY">Economy</SelectItem>
                                        <SelectItem value="PREMIUM_ECONOMY">Premium Eco</SelectItem>
                                        <SelectItem value="BUSINESS">Business</SelectItem>
                                        <SelectItem value="FIRST">First Class</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Search Button */}
                            <Button
                                onClick={handleSearch}
                                disabled={loading || !searchParams.from || !searchParams.to || !searchParams.departDate}
                                className="w-full md:w-auto h-12 md:h-14 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-md px-8"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                            </Button>
                        </div>

                        <div className="min-h-[200px] border rounded-lg p-2 max-h-[400px] overflow-y-auto space-y-2">
                            {results.length === 0 && !loading && !error && (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 mt-10">
                                    <Plane className="w-10 h-10 mb-2 opacity-20" />
                                    <p>Enter route details to search.</p>
                                    <Button variant="link" onClick={() => setManualMode(true)} className="text-xs mt-2">
                                        Or enter manually
                                    </Button>
                                </div>
                            )}

                            {results.map((flight) => (
                                <div key={flight.id} className="border p-3 rounded-lg hover:bg-slate-50 transition-colors flex justify-between items-center group">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge variant="outline" className="font-mono">{flight.airline}</Badge>
                                            <span className="font-bold text-lg">{flight.from} → {flight.to}</span>
                                        </div>
                                        <div className="text-sm text-slate-600 flex gap-4">
                                            <span>Dep: <b>{flight.departTime}</b></span>
                                            <span>Arr: <b>{flight.arriveTime}</b></span>
                                            <span>Duration: {flight.duration}</span>
                                        </div>
                                        <div className="text-xs text-slate-400 mt-1">
                                            {flight.stops === 0 ? 'Non-stop' : `${flight.stops} Stop(s)`} • {flight.flightNumber}
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className="text-xl font-bold text-slate-900">
                                            {flight.price.toFixed(2)} <span className="text-xs font-normal text-slate-500">{flight.currency}</span>
                                        </div>
                                        <div className="text-[10px] text-slate-400 mb-2">Indicative Price</div>
                                        <Button size="sm" onClick={() => handleAddResult(flight)} className="bg-slate-900 text-white">
                                            Add Planned
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="bg-blue-50 p-2 rounded text-xs text-blue-700 flex gap-2 items-start">
                            <Info className="w-4 h-4 shrink-0 mt-0.5" />
                            <p>
                                <b>Scope Notice:</b> Auto-search currently supports direct and simple connecting flights.
                                For complex multi-city itineraries, please use Manual Entry.
                            </p>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
