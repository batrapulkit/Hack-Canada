import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Car,
  Users,
  Luggage,
  Fuel,
  Settings,
  CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const mockCars = [];

export default function CarRentalSearch() {
  const [searchParams, setSearchParams] = useState({
    location: '',
    pickupDate: '',
    returnDate: '',
    pickupTime: '10:00',
    returnTime: '10:00'
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchParams.location || !searchParams.pickupDate || !searchParams.returnDate) {
      toast.error('Please fill in all required fields');
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
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-green-50 to-emerald-50">
          <CardTitle className="flex items-center gap-2">
            <Car className="w-5 h-5 text-green-600" />
            Rent a Car
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-3">
              <Label htmlFor="carLocation">Pick-up Location</Label>
              <Input
                id="carLocation"
                value={searchParams.location}
                onChange={(e) => setSearchParams({ ...searchParams, location: e.target.value })}
                placeholder="Dubai International Airport"
              />
            </div>

            <div>
              <Label htmlFor="pickupDate">Pick-up Date</Label>
              <Input
                id="pickupDate"
                type="date"
                value={searchParams.pickupDate}
                onChange={(e) => setSearchParams({ ...searchParams, pickupDate: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="pickupTime">Pick-up Time</Label>
              <Input
                id="pickupTime"
                type="time"
                value={searchParams.pickupTime}
                onChange={(e) => setSearchParams({ ...searchParams, pickupTime: e.target.value })}
              />
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleSearch}
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                {loading ? (
                  <>Searching...</>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Search Cars
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
            {results.length} vehicles available
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnimatePresence>
              {results.map((car, index) => (
                <motion.div
                  key={car.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="border-slate-200/60 shadow-md hover:shadow-lg transition-all overflow-hidden">
                    <div className="relative h-48">
                      <img
                        src={car.image}
                        alt={car.name}
                        className="w-full h-full object-cover"
                      />
                      <Badge className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-slate-900">
                        {car.category}
                      </Badge>
                    </div>

                    <CardContent className="p-6 space-y-4">
                      <div>
                        <h4 className="text-lg font-bold text-slate-900 mb-3">{car.name}</h4>

                        <div className="grid grid-cols-3 gap-3 mb-4">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Users className="w-4 h-4" />
                            <span>{car.passengers}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Luggage className="w-4 h-4" />
                            <span>{car.luggage}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Settings className="w-4 h-4" />
                            <span className="text-xs">{car.transmission}</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {car.features.map((feature, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                              <span>{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <div>
                          <p className="text-sm text-slate-500">From</p>
                          <p className="text-2xl font-bold text-slate-900">${car.price}</p>
                          <p className="text-xs text-slate-500">per day</p>
                        </div>
                        <Button className="bg-gradient-to-r from-green-600 to-emerald-600">
                          Reserve
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