import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plane, Hotel, Ticket, Car, ExternalLink, List } from "lucide-react";
import { motion } from "framer-motion";
import api from "@/api/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import FlightSearch from "../components/bookings/FlightSearch.jsx";
import HotelSearch from "../components/bookings/HotelSearch.jsx";
import ActivitySearch from "../components/bookings/ActivitySearch.jsx";
import CarRentalSearch from "../components/bookings/CarRentalSearch.jsx";
import BookingList from "../components/bookings/BookingList.jsx";

export default function Bookings() {
  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => api.entities.Supplier.list(),
    initialData: [],
  });

  const activeSuppliers = suppliers.filter(s => s.is_active);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Booking Centre</h1>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">BETA</Badge>
          </div>
          <p className="text-slate-500">
            Search and manage bookings across flights, hotels, and activities.
          </p>
        </div>
      </motion.div>



      <Tabs defaultValue="manage" className="space-y-6">
        <TabsList className="bg-white border border-slate-200 p-1 grid grid-cols-5 w-full lg:w-auto">
          <TabsTrigger
            value="manage"
            className="data-[state=active]:bg-slate-900 data-[state=active]:text-white"
          >
            <List className="w-4 h-4 mr-2" />
            Manage Bookings
          </TabsTrigger>
          <TabsTrigger
            value="flights"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white"
          >
            <Plane className="w-4 h-4 mr-2" />
            Flights
          </TabsTrigger>
          <TabsTrigger
            value="hotels"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white"
          >
            <Hotel className="w-4 h-4 mr-2" />
            Hotels
          </TabsTrigger>
          <TabsTrigger
            value="activities"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-red-600 data-[state=active]:text-white"
          >
            <Ticket className="w-4 h-4 mr-2" />
            Activities
          </TabsTrigger>
          <TabsTrigger
            value="cars"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white"
          >
            <Car className="w-4 h-4 mr-2" />
            Car Rentals
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manage">
          <BookingList />
        </TabsContent>

        <TabsContent value="flights">
          <FlightSearch />
        </TabsContent>

        <TabsContent value="hotels">
          <HotelSearch />
        </TabsContent>

        <TabsContent value="activities">
          <ActivitySearch />
        </TabsContent>

        <TabsContent value="cars">
          <CarRentalSearch />
        </TabsContent>
      </Tabs>
    </div>
  );
}