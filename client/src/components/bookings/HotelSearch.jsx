import React, { useState } from 'react';
import api from "@/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Hotel,
  Star,
  MapPin,
  Wifi,
  Coffee,
  Dumbbell,
  Sparkles,
  ThumbsUp,
  Users
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { DateRangePicker } from "@/components/ui/date-range-picker";

const mockHotels = [];

export default function HotelSearch() {
  const [searchParams, setSearchParams] = useState({
    destination: '',
    checkIn: '',
    checkOut: '',
    rooms: 1,
    guests: 2
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedReview, setExpandedReview] = useState(null);

  const handleSearch = async () => {
    if (!searchParams.destination || !searchParams.checkIn || !searchParams.checkOut) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    // In a real app, this would call an Amadeus/Booking.com API
    // For now, we show an empty state or could connect to a real backend if available
    setTimeout(() => {
      setResults([]);
      setLoading(false);
      toast.info('Search functionality would connect to GDS/Suppliers here.');
    }, 1000);
  };

  const getAIReviewSummary = async (hotelName) => {
    if (expandedReview === hotelName) {
      setExpandedReview(null);
      return;
    }

    setExpandedReview(hotelName);
  };

  return (
    <div className="space-y-6">
      <Card className="border-slate-200/60 shadow-lg">
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-purple-50 to-pink-50">
          <CardTitle className="flex items-center gap-2">
            <Hotel className="w-5 h-5 text-purple-600" />
            Search Hotels
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <Label htmlFor="destination">Destination</Label>
              <Input
                id="destination"
                value={searchParams.destination}
                onChange={(e) => setSearchParams({ ...searchParams, destination: e.target.value })}
                placeholder="Dubai, UAE"
              />
            </div>

            <div>
              <Label htmlFor="rooms">Rooms</Label>
              <Input
                id="rooms"
                type="number"
                min="1"
                value={searchParams.rooms}
                onChange={(e) => setSearchParams({ ...searchParams, rooms: e.target.value })}
              />
            </div>

            <div className="lg:col-span-2">
              <Label htmlFor="dateRange">Stay Dates</Label>
              <DateRangePicker
                date={{
                  from: searchParams.checkIn ? new Date(searchParams.checkIn) : undefined,
                  to: searchParams.checkOut ? new Date(searchParams.checkOut) : undefined
                }}
                setDate={(range) => {
                  setSearchParams({
                    ...searchParams,
                    checkIn: range?.from ? range.from.toISOString().split('T')[0] : '',
                    checkOut: range?.to ? range.to.toISOString().split('T')[0] : ''
                  });
                }}
              />
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleSearch}
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {loading ? (
                  <>Searching...</>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Search Hotels
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900">
              {results.length} hotels found
            </h3>
            <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200">
              <Sparkles className="w-3 h-3 mr-1" />
              AI Ranked
            </Badge>
          </div>

          <AnimatePresence>
            {results.map((hotel, index) => (
              <motion.div
                key={hotel.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-slate-200/60 shadow-md hover:shadow-lg transition-all overflow-hidden">
                  <div className="flex flex-col lg:flex-row">
                    <div className="lg:w-1/3 h-48 lg:h-auto relative">
                      <img
                        src={hotel.image}
                        alt={hotel.name}
                        className="w-full h-full object-cover"
                      />
                      {hotel.aiScore >= 90 && (
                        <Badge className="absolute top-3 right-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                          <Star className="w-3 h-3 mr-1" />
                          AI Top Pick
                        </Badge>
                      )}
                    </div>

                    <CardContent className="flex-1 p-6">
                      <div className="flex flex-col lg:flex-row justify-between gap-4">
                        <div className="flex-1 space-y-4">
                          <div>
                            <h4 className="text-xl font-bold text-slate-900 mb-2">{hotel.name}</h4>
                            <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                              <MapPin className="w-4 h-4" />
                              {hotel.location}
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${i < Math.floor(hotel.rating)
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-slate-300'
                                      }`}
                                  />
                                ))}
                              </div>
                              <span className="text-sm font-semibold text-slate-900">
                                {hotel.rating}
                              </span>
                              <span className="text-sm text-slate-500">
                                ({hotel.reviews} reviews)
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {hotel.amenities.slice(0, 4).map((amenity, i) => (
                              <Badge key={i} variant="outline" className="bg-slate-50">
                                {amenity}
                              </Badge>
                            ))}
                          </div>

                          {hotel.aiSummary && (
                            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                              <div className="flex items-start gap-3">
                                <Sparkles className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-xs font-semibold text-purple-900 mb-1">AI Review Summary</p>
                                  <p className="text-sm text-slate-700">{hotel.aiSummary}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col items-end justify-between gap-4 lg:w-48">
                          <div className="text-right">
                            <p className="text-sm text-slate-500 mb-1">From</p>
                            <p className="text-3xl font-bold text-slate-900">
                              ${hotel.price}
                            </p>
                            <p className="text-sm text-slate-500">per night</p>
                          </div>
                          <div className="space-y-2 w-full">
                            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 w-full">
                              Book Now
                            </Button>
                            <Button variant="outline" className="w-full text-xs">
                              View Details
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}