import React, { useState } from 'react';
import api from "@/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Plane,
  Clock,
  TrendingUp,
  Sparkles,
  Calendar,
  Users,
  ArrowRight,
  Star,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar as CalendarType } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { useBranding } from "@/contexts/BrandingContext";
import { useAmadeus } from "@/contexts/AmadeusContext";
import AmadeusKeyRequiredDialog from "@/components/common/AmadeusKeyRequiredDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CANADIAN_AIRPORTS = [
  { code: "YYZ", name: "Toronto Pearson (YYZ)" },
  { code: "YVR", name: "Vancouver (YVR)" },
  { code: "YUL", name: "Montreal-Trudeau (YUL)" },
  { code: "YYC", name: "Calgary (YYC)" },
  { code: "YEG", name: "Edmonton (YEG)" },
  { code: "YOW", name: "Ottawa (YOW)" },
  { code: "YWG", name: "Winnipeg (YWG)" },
  { code: "YHZ", name: "Halifax (YHZ)" },
  { code: "YQB", name: "Quebec City (YQB)" }
];

// Mock flight data - in production, this would come from Skyscanner/Amadeus/Trip.com APIs
// Mock flight data removed - now using real Amadeus API

export default function FlightSearch() {
  const { branding } = useBranding();
  const { isConfigured } = useAmadeus();
  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const [searchParams, setSearchParams] = useState({
    from: '',
    to: '',
    departDate: '',
    returnDate: '',
    passengers: 1,
    class: 'economy'
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState('');

  const handleSearch = async () => {
    // Check if Amadeus is configured before searching
    if (!isConfigured()) {
      setShowKeyDialog(true);
      return;
    }

    if (!searchParams.from || !searchParams.to || !searchParams.departDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setResults([]);

    try {
      const response = await api.post('/amadeus/search', {
        from: searchParams.from.split(' - ')[0] || searchParams.from, // Extract code if format is "JFK - New York"
        to: searchParams.to.split(' - ')[0] || searchParams.to,
        departDate: searchParams.departDate,
        returnDate: searchParams.returnDate,
        passengers: searchParams.passengers,
        class: searchParams.class
      });

      if (response && response.length > 0) {
        setResults(response);
        toast.success(`Found ${response.length} flights`);
      } else {
        toast.info('No flights found for this route/date.');
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.error || 'Failed to search flights');

      // Fallback for demo if API fails (optional, but requested to remove "mock" behavior so likely keep error explicit)
      // I will remove the fallback entirely as requested.
    } finally {
      setLoading(false);
    }

    // Get AI recommendation (can keep or enhance)
    try {
      // Small delay to not block UI
      setTimeout(async () => {
        const aiResponse = await api.integrations.Core.InvokeLLM({
          prompt: `As a travel expert, provide a brief recommendation for flights from ${searchParams.from} to ${searchParams.to} for ${searchParams.passengers} passenger(s). Consider factors like best time to book, typical prices, and travel tips. Keep it to 2-3 sentences.`,
        });
        setAiRecommendation(aiResponse);
      }, 100);
    } catch (error) {
      console.error('AI recommendation failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-slate-200/60 shadow-lg">
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-blue-50 to-cyan-50">
          <CardTitle className="flex items-center gap-2">
            <Plane className="w-5 h-5 text-blue-600" />
            Search Flights
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {/* Professional Search Bar Layout - Polished */}
          <div className="flex flex-col xl:flex-row items-center bg-white rounded-2xl border border-slate-200 shadow-lg p-2 gap-3 xl:gap-0 h-auto xl:h-24">

            {/* Origin */}
            <div className="flex-1 w-full xl:w-auto relative group px-2 hover:bg-slate-50 rounded-xl transition-colors h-full flex flex-col justify-center cursor-pointer">
              <div className="flex flex-col px-3">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Where from?</label>
                {branding?.country === "Canada" ? (
                  <Select
                    value={searchParams.from}
                    onValueChange={(value) => setSearchParams({ ...searchParams, from: value })}
                  >
                    <SelectTrigger className="border-0 shadow-none focus:ring-0 p-0 h-auto text-lg font-bold text-slate-900 bg-transparent">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <Plane className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="truncate">{searchParams.from ? searchParams.from.split(' - ')[0] : <span className="text-slate-400 font-normal">Airport or City</span>}</span>
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {CANADIAN_AIRPORTS.map((airport) => (
                        <SelectItem key={airport.code} value={`${airport.code} - ${airport.name}`}>
                          <span className="font-bold">{airport.code}</span> - {airport.name}
                        </SelectItem>
                      ))}
                      <SelectItem value="Other">Other / Manual Input</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center gap-2">
                    <Plane className="w-4 h-4 text-slate-400 shrink-0" />
                    <Input
                      className="border-0 shadow-none focus-visible:ring-0 p-0 h-auto text-lg font-bold placeholder:font-normal placeholder:text-slate-400 bg-transparent w-full"
                      placeholder="Airport or City"
                      value={searchParams.from}
                      onChange={(e) => setSearchParams({ ...searchParams, from: e.target.value })}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="hidden xl:block w-px h-12 bg-slate-200 mx-1" />

            {/* Destination */}
            <div className="flex-1 w-full xl:w-auto relative group px-2 hover:bg-slate-50 rounded-xl transition-colors h-full flex flex-col justify-center">
              <div className="flex flex-col px-3">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Where to?</label>
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-slate-400 shrink-0" />
                  <Input
                    className="border-0 shadow-none focus-visible:ring-0 p-0 h-auto text-lg font-bold placeholder:font-normal placeholder:text-slate-400 bg-transparent w-full"
                    placeholder="Airport or City"
                    value={searchParams.to}
                    onChange={(e) => setSearchParams({ ...searchParams, to: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="hidden xl:block w-px h-12 bg-slate-200 mx-1" />

            {/* Dates */}
            <div className="flex-[1.5] w-full xl:w-auto relative group px-2 hover:bg-slate-50 rounded-xl transition-colors h-full flex flex-col justify-center">
              <div className="flex flex-col px-3">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Dates</label>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start text-left font-bold text-lg p-0 hover:bg-transparent h-auto",
                        !searchParams.departDate && "text-slate-400 font-normal"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4 text-slate-400 shrink-0" />
                      {searchParams.departDate ? (
                        searchParams.returnDate ? (
                          <span className="truncate">
                            {new Date(searchParams.departDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - {new Date(searchParams.returnDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        ) : (
                          <span>{new Date(searchParams.departDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                        )
                      ) : (
                        <span>Add Dates</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarType
                      initialFocus
                      mode="range"
                      defaultMonth={searchParams.departDate ? new Date(searchParams.departDate) : new Date()}
                      selected={{
                        from: searchParams.departDate ? new Date(searchParams.departDate) : undefined,
                        to: searchParams.returnDate ? new Date(searchParams.returnDate) : undefined
                      }}
                      onSelect={(range) => {
                        setSearchParams({
                          ...searchParams,
                          departDate: range?.from ? range.from.toISOString().split('T')[0] : '',
                          returnDate: range?.to ? range.to.toISOString().split('T')[0] : ''
                        });
                      }}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>

              </div>
            </div>

            {/* Divider */}
            <div className="hidden xl:block w-px h-12 bg-slate-200 mx-1" />

            {/* Passengers */}
            <div className="w-full xl:w-40 relative group px-2 hover:bg-slate-50 rounded-xl transition-colors h-full flex flex-col justify-center">
              <div className="flex flex-col px-3">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Travelers</label>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-400 shrink-0" />
                  <Input
                    type="number"
                    min="1"
                    className="border-0 shadow-none focus-visible:ring-0 p-0 h-auto text-lg font-bold bg-transparent w-full"
                    value={searchParams.passengers}
                    onChange={(e) => setSearchParams({ ...searchParams, passengers: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Search Button */}
            <div className="pl-2 pr-1 py-1">
              <Button
                onClick={handleSearch}
                disabled={loading}
                className="w-full xl:w-auto h-16 w-16 !p-0 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex items-center justify-center transition-all hover:scale-105"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <Search className="w-6 h-6" />
                )}
              </Button>
            </div>
          </div>

          {aiRecommendation && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200"
            >
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-purple-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900 mb-1">AI Recommendation</p>
                  <p className="text-sm text-slate-700">{aiRecommendation}</p>
                </div>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900">
              Found {results.length} flights
            </h3>
            <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
              Best prices guaranteed
            </Badge>
          </div>

          <AnimatePresence>
            {results.map((flight, index) => (
              <motion.div
                key={flight.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-slate-200/60 shadow-md hover:shadow-lg transition-all">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center">
                            <Plane className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900">{flight.airline}</h4>
                            <p className="text-sm text-slate-500">{flight.flightNumber}</p>
                          </div>
                          {flight.aiScore >= 90 && (
                            <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                              <Star className="w-3 h-3 mr-1" />
                              AI Pick
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-6">
                          <div>
                            <p className="text-2xl font-bold text-slate-900">{flight.departTime}</p>
                            <p className="text-sm text-slate-500">{flight.from}</p>
                          </div>

                          <div className="flex-1 flex flex-col items-center">
                            <div className="flex items-center gap-2 text-slate-400 mb-1">
                              <Clock className="w-4 h-4" />
                              <span className="text-xs">{flight.duration}</span>
                            </div>
                            <div className="w-full h-0.5 bg-slate-200 relative">
                              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600"></div>
                              <Plane className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-blue-600" />
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              {flight.stops === 0 ? 'Direct' : `${flight.stops} stop(s)`}
                            </p>
                          </div>

                          <div>
                            <p className="text-2xl font-bold text-slate-900">{flight.arriveTime}</p>
                            <p className="text-sm text-slate-500">{flight.to}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <Badge variant="outline">{flight.class}</Badge>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            {flight.carbonFootprint} CO₂
                          </Badge>
                          {flight.aiScore && (
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                              AI Score: {flight.aiScore}/100
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-3">
                        <div className="text-right">
                          <p className="text-3xl font-bold text-slate-900">
                            ${flight.price}
                          </p>
                          <p className="text-sm text-slate-500">per person</p>
                        </div>
                        <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 w-full lg:w-auto">
                          Select Flight
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Amadeus Key Required Dialog */}
      <AmadeusKeyRequiredDialog
        open={showKeyDialog}
        onOpenChange={setShowKeyDialog}
        feature="Flight Search"
      />
    </div>
  );
}