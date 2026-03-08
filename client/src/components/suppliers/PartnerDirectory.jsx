import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Plus, ExternalLink, Globe } from "lucide-react";
import { toast } from "sonner";
import api from "@/api/client";
import { useQueryClient } from "@tanstack/react-query";
import ConnectPartnerDialog from "./ConnectPartnerDialog";

const POPULAR_PARTNERS = [
    {
        name: "Expedia",
        type: "OTA",
        website: "https://www.expedia.com",
        logo: "https://logo.clearbit.com/expedia.com",
        description: "One of the world's leading full-service online travel brands."
    },
    {
        name: "Booking.com",
        type: "OTA",
        website: "https://www.booking.com",
        logo: "https://logo.clearbit.com/booking.com",
        description: "Planet Earth's #1 accommodation site."
    },
    {
        name: "Agoda",
        type: "OTA",
        website: "https://www.agoda.com",
        logo: "https://logo.clearbit.com/agoda.com",
        description: "Discounted hotels and vacation rentals."
    },
    {
        name: "TripAdvisor",
        type: "Review & Booking",
        website: "https://www.tripadvisor.com",
        logo: "https://logo.clearbit.com/tripadvisor.com",
        description: "World's largest travel platform."
    },
    {
        name: "Skyscanner",
        type: "Metasearch",
        website: "https://www.skyscanner.com",
        logo: "https://logo.clearbit.com/skyscanner.com",
        description: "Global travel search engine for flights, hotels and car hire."
    },
    {
        name: "Kayak",
        type: "Metasearch",
        website: "https://www.kayak.com",
        logo: "https://logo.clearbit.com/kayak.com",
        description: "Searches hundreds of travel sites at once."
    },
    {
        name: "Airbnb",
        type: "Vacation Rentals",
        website: "https://www.airbnb.com",
        logo: "https://logo.clearbit.com/airbnb.com",
        description: "Vacation rentals, cabins, beach houses, and more."
    },
    {
        name: "Trivago",
        type: "Metasearch",
        website: "https://www.trivago.com",
        logo: "https://logo.clearbit.com/trivago.com",
        description: "Compare hotel prices from hundreds of booking sites."
    },
    {
        name: "Travelpayouts",
        type: "Affiliate Network",
        website: "https://www.travelpayouts.com",
        logo: "https://logo.clearbit.com/travelpayouts.com",
        description: "The ideal travel affiliate network for monetizing travel traffic."
    },
    {
        name: "Viator",
        type: "Activities",
        website: "https://www.viator.com",
        logo: "https://logo.clearbit.com/viator.com",
        description: "Tours, activities, and things to do."
    },
    {
        name: "GetYourGuide",
        type: "Activities",
        website: "https://www.getyourguide.com",
        logo: "https://logo.clearbit.com/getyourguide.com",
        description: "Book tickets for top attractions around the world."
    },
    {
        name: "Hotelbeds",
        type: "Wholesaler",
        website: "https://www.hotelbeds.com",
        logo: "https://logo.clearbit.com/hotelbeds.com",
        description: "Leading bedbank redefining how accommodation is distributed."
    },
    {
        name: "Test Partner",
        type: "Test",
        website: "https://example.com",
        logo: "https://ui-avatars.com/api/?name=Test+Partner&background=random",
        description: "Use this partner to test the booking page integration and visibility."
    }
];

export default function PartnerDirectory({ existingSuppliers = [] }) {
    const [selectedPartner, setSelectedPartner] = useState(null);
    const [showConnectDialog, setShowConnectDialog] = useState(false);

    const getExistingSupplier = (partnerName) => {
        return existingSuppliers.find(s => s.name.toLowerCase() === partnerName.toLowerCase());
    };

    const handleConnectClick = (partner) => {
        setSelectedPartner(partner);
        setShowConnectDialog(true);
    };

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {POPULAR_PARTNERS.map((partner) => {
                    const existing = getExistingSupplier(partner.name);
                    const isConnected = !!existing;

                    return (
                        <Card key={partner.name} className="border-slate-200/60 hover:shadow-lg transition-all group">
                            <CardContent className="p-6 flex flex-col h-full">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 bg-white border border-slate-100 rounded-xl flex items-center justify-center p-2 shadow-sm group-hover:scale-105 transition-transform">
                                        <img
                                            src={partner.logo}
                                            alt={partner.name}
                                            className="w-full h-full object-contain"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = `https://ui-avatars.com/api/?name=${partner.name}&background=random`;
                                            }}
                                        />
                                    </div>
                                    <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                                        {partner.type}
                                    </Badge>
                                </div>

                                <div className="mb-4 flex-grow">
                                    <h3 className="font-bold text-lg text-slate-900 mb-1">{partner.name}</h3>
                                    <p className="text-sm text-slate-500 line-clamp-2">{partner.description}</p>
                                </div>

                                <div className="space-y-3 mt-auto">
                                    {isConnected ? (
                                        <Button
                                            variant="outline"
                                            className="w-full bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800"
                                            onClick={() => handleConnectClick(partner)}
                                        >
                                            <Check className="w-4 h-4 mr-2" />
                                            Manage
                                        </Button>
                                    ) : (
                                        <Button
                                            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-md hover:shadow-lg transition-all"
                                            onClick={() => handleConnectClick(partner)}
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Connect
                                        </Button>
                                    )}

                                    <a
                                        href={partner.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center text-xs text-slate-400 hover:text-blue-600 transition-colors"
                                    >
                                        <Globe className="w-3 h-3 mr-1" />
                                        Visit Website
                                    </a>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {selectedPartner && (
                <ConnectPartnerDialog
                    open={showConnectDialog}
                    onClose={() => setShowConnectDialog(false)}
                    partner={selectedPartner}
                    existingSupplier={getExistingSupplier(selectedPartner?.name)}
                />
            )}
        </>
    );
}
