import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Ticket,
  Clock,
  Users,
  Star,
  MapPin,
  Calendar,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const mockActivities = [];

export default function ActivitySearch() {
  const [searchParams, setSearchParams] = useState({
    destination: '',
    date: '',
    category: 'all'
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchParams.destination) {
      toast.error('Please enter a destination');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setResults([]);
      setLoading(false);
      toast.info('Search functionality would connect to GDS/Suppliers here.');
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <Card className="border-slate-200/60 shadow-lg">
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-orange-50 to-red-50">
          <CardTitle className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-orange-600" />
            Discover Activities & Experiences
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="activityDestination">Destination</Label>
              <Input
                id="activityDestination"
                value={searchParams.destination}
                onChange={(e) => setSearchParams({ ...searchParams, destination: e.target.value })}
                placeholder="Dubai, UAE"
              />
            </div>

            <div>
              <Label htmlFor="activityDate">Date</Label>
              <Input
                id="activityDate"
                type="date"
                value={searchParams.date}
                onChange={(e) => setSearchParams({ ...searchParams, date: e.target.value })}
              />
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleSearch}
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
              >
                {loading ? (
                  <>Searching...</>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Search Activities
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-slate-900">
            {results.length} experiences available
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnimatePresence>
              {results.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="border-slate-200/60 shadow-md hover:shadow-xl transition-all overflow-hidden group">
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={activity.image}
                        alt={activity.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      {activity.aiRecommended && (
                        <Badge className="absolute top-3 left-3 bg-gradient-to-r from-orange-600 to-red-600 text-white">
                          <Sparkles className="w-3 h-3 mr-1" />
                          AI Pick
                        </Badge>
                      )}
                      <Badge className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-slate-900">
                        {activity.category}
                      </Badge>
                    </div>

                    <CardContent className="p-6 space-y-4">
                      <div>
                        <h4 className="text-lg font-bold text-slate-900 mb-2">{activity.name}</h4>

                        <div className="flex items-center gap-4 text-sm text-slate-600 mb-3">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {activity.location}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {activity.duration}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${i < Math.floor(activity.rating)
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-slate-300'
                                  }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-semibold">{activity.rating}</span>
                          <span className="text-sm text-slate-500">({activity.reviews})</span>
                        </div>

                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-slate-700">Highlights:</p>
                          <div className="flex flex-wrap gap-2">
                            {activity.highlights.map((highlight, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {highlight}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <div>
                          <p className="text-sm text-slate-500">From</p>
                          <p className="text-2xl font-bold text-slate-900">${activity.price}</p>
                        </div>
                        <Button className="bg-gradient-to-r from-orange-600 to-red-600">
                          Book Now
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}