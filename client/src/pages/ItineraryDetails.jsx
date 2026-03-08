import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Calendar, Users, FileText, Plane, Receipt, ShieldCheck, Loader2, CheckCircle2, XCircle, AlertCircle, Sparkles } from "lucide-react";
import BookingList from "../components/bookings/BookingList";
import InvoiceList from "../components/crm/InvoiceList";
import ItineraryDisplay from "../components/itineraries/ItineraryDisplay";
import { toast } from "sonner";

// Category badge colours


export default function ItineraryDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const { data: itinerary, isLoading } = useQuery({
        queryKey: ["itinerary", id],
        queryFn: () => api.get(`/itineraries/${id}`).then(res => res.data.itinerary),
    });

    if (isLoading) return <div className="p-8 text-center">Loading trip details...</div>;
    if (!itinerary) return <div className="p-8 text-center">Trip not found</div>;

    const details = itinerary.ai_generated_json?.detailedPlan || itinerary.ai_generated_json || {};

    return (
        <div className="p-6 lg:p-8 space-y-6">
            <div>
                <Button variant="ghost" onClick={() => navigate("/itineraries")} className="mb-4 pl-0 hover:pl-2 transition-all">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Trips
                </Button>

                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
                            {itinerary.title || details.title || itinerary.destination}
                        </h1>
                        <div className="flex items-center gap-4 text-slate-600">
                            <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {itinerary.destination}</span>
                            <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {itinerary.duration} Days</span>
                            <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {itinerary.travelers} Travelers</span>
                        </div>
                    </div>
                    <Badge variant="outline" className="text-lg px-4 py-1 capitalize">{itinerary.status}</Badge>
                </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="bg-white border border-slate-200 p-1 w-full lg:w-auto grid grid-cols-3">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                        <FileText className="w-4 h-4 mr-2" /> Overview
                    </TabsTrigger>
                    <TabsTrigger value="bookings" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                        <Plane className="w-4 h-4 mr-2" /> Bookings
                    </TabsTrigger>
                    <TabsTrigger value="invoices" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
                        <Receipt className="w-4 h-4 mr-2" /> Invoices
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm min-h-[400px]">
                    <ItineraryDisplay data={details} itineraryItems={itinerary.itinerary_items} hideHeader={true} />
                </TabsContent>


                <TabsContent value="bookings">
                    <BookingList itineraryId={id} />
                </TabsContent>

                <TabsContent value="invoices">
                    <InvoiceList itineraryId={id} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
