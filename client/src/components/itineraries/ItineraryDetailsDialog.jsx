import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Users, DollarSign, Clock, FileDown, Edit, Send, Plane, Hotel, Utensils, Camera, Sun, X, ExternalLink, Copy, Mail, FileText } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { downloadItineraryPDF } from "@/utils/pdfGenerator";
import api from "@/api/client";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ItineraryDisplay from "./ItineraryDisplay";
import ItineraryPricingEditor from "./ItineraryPricingEditor";
import InvoiceList from "../crm/InvoiceList";
import { useBranding } from "@/contexts/BrandingContext";

export default function ItineraryDetailsDialog({ itinerary, open, onClose, onEdit }) {
    const [isExporting, setIsExporting] = useState(false);
    const { company_name, logo_url, brand_color, secondary_color, website } = useBranding();
    const queryClient = useQueryClient();

    const updateStatusMutation = useMutation({
        mutationFn: (newStatus) => api.patch(`/itineraries/${itinerary?.id}`, { status: newStatus }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['itineraries'] });
            toast.success("Status updated successfully");
        },
        onError: () => {
            toast.error("Failed to update status");
        }
    });

    if (!itinerary) return null;

    const details = itinerary.ai_generated_json?.detailedPlan || itinerary.ai_generated_json || {};
    const days = details.dailyPlan || details.daily || [];

    const handleExportPDF = async () => {
        setIsExporting(true);
        try {
            console.log("Exporting PDF with branding:", { company_name, logo_url });
            await downloadItineraryPDF(itinerary, company_name, logo_url, {
                brandColor: brand_color,
                secondaryColor: secondary_color,
                website: website
            });
            toast.success("PDF downloaded successfully!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate PDF");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose} className="max-w-4xl h-[90vh] overflow-hidden">
            <DialogContent className="flex flex-col p-0 h-[95vh] max-w-7xl w-[95vw]">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 relative">

                    <DialogHeader>
                        <div className="flex items-center justify-between mr-8">
                            <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-slate-900">
                                {itinerary.title || details.title || details.destination || "Trip Itinerary"}
                                <Select
                                    defaultValue={itinerary.status || 'draft'}
                                    onValueChange={(val) => updateStatusMutation.mutate(val)}
                                >
                                    <SelectTrigger className="w-[120px] h-8 ml-2 border-slate-200 bg-white">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="sent">Sent</SelectItem>
                                        <SelectItem value="approved">Approved</SelectItem>
                                        <SelectItem value="booked">Booked</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </DialogTitle>
                        </div>
                        <DialogDescription className="flex flex-wrap gap-6 pt-4 text-sm" as="div">
                            <span className="flex items-center gap-2 text-slate-600 font-medium">
                                <MapPin className="w-4 h-4 text-amber-500" />
                                {itinerary.destination}
                            </span>
                            <span className="flex items-center gap-2 text-slate-600 font-medium">
                                <Calendar className="w-4 h-4 text-amber-500" />
                                {itinerary.duration} Days
                            </span>
                            <span className="flex items-center gap-2 text-slate-600 font-medium">
                                <Users className="w-4 h-4 text-amber-500" />
                                {itinerary.travelers} Travelers
                            </span>
                            {itinerary.budget && (
                                <span className="flex items-center gap-2 text-slate-600 font-medium">
                                    <DollarSign className="w-4 h-4 text-amber-500" />
                                    {itinerary.budget} Budget
                                </span>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                </div>



                <div className="flex-1 overflow-hidden bg-slate-50/30 flex flex-col min-h-0">
                    <Tabs defaultValue="plan" className="w-full h-full flex flex-col">
                        <div className="px-6 pt-4 bg-white border-b border-slate-100 shrink-0 z-10">
                            <TabsList className="bg-slate-100">
                                <TabsTrigger value="plan" className="gap-2">
                                    <Calendar className="w-4 h-4" /> Daily Plan
                                </TabsTrigger>
                                <TabsTrigger value="pricing" className="gap-2">
                                    <DollarSign className="w-4 h-4" /> Pricing & Costing
                                </TabsTrigger>
                                <TabsTrigger value="invoices" className="gap-2">
                                    <FileText className="w-4 h-4" /> Invoices
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 relative">
                            <TabsContent value="plan" className="m-0 focus-visible:outline-none h-full">
                                <ItineraryDisplay
                                    data={details}
                                    itineraryItems={itinerary.itinerary_items}
                                    hideHeader={true}
                                />
                            </TabsContent>
                            <TabsContent value="pricing" className="m-0 focus-visible:outline-none h-full">
                                <ItineraryPricingEditor itinerary={itinerary} />
                            </TabsContent>
                            <TabsContent value="invoices" className="m-0 focus-visible:outline-none h-full">
                                <div className="p-1">
                                    <InvoiceList itineraryId={itinerary.id} />
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>

                {/* Action Buttons */}
                <div className="p-4 border-t border-slate-100 bg-white flex gap-3 justify-end">
                    <Button variant="outline" onClick={onEdit} className="gap-2 border-slate-200 hover:bg-slate-50 text-slate-700">
                        <Edit className="w-4 h-4" />
                        Edit
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleExportPDF}
                        disabled={isExporting}
                        className="gap-2 border-slate-200 hover:bg-slate-50 text-slate-700"
                    >
                        <FileDown className="w-4 h-4" />
                        {isExporting ? "Generating PDF..." : "Export PDF"}
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                className="gap-2 bg-slate-900 hover:bg-slate-800 text-white shadow-md shadow-slate-900/10"
                            >
                                <Send className="w-4 h-4" />
                                Share
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 bg-white border-slate-200 shadow-xl rounded-xl p-2">
                            <DropdownMenuItem
                                onClick={() => {
                                    const url = `${window.location.origin}/view/${itinerary.id}`;
                                    window.open(url, '_blank');
                                }}
                                className="cursor-pointer text-slate-700 focus:text-slate-900 focus:bg-slate-50 rounded-lg py-2.5 px-3 mb-1"
                            >
                                <ExternalLink className="w-4 h-4 mr-2 text-amber-500" />
                                <span className="font-medium">Open Public View</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => {
                                    const url = `${window.location.origin}/view/${itinerary.id}`;
                                    navigator.clipboard.writeText(url);
                                    toast.success("Public link copied!");
                                }}
                                className="cursor-pointer text-slate-700 focus:text-slate-900 focus:bg-slate-50 rounded-lg py-2.5 px-3 mb-1"
                            >
                                <Copy className="w-4 h-4 mr-2 text-slate-400" />
                                <span className="font-medium">Copy Link</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => {
                                    const url = `${window.location.origin}/view/${itinerary.id}`;
                                    window.location.href = `mailto:?subject=Trip Itinerary: ${itinerary.destination || 'Travel Plan'}&body=Check out this itinerary: ${url}`;
                                }}
                                className="cursor-pointer text-slate-700 focus:text-slate-900 focus:bg-slate-50 rounded-lg py-2.5 px-3"
                            >
                                <Mail className="w-4 h-4 mr-2 text-slate-400" />
                                <span className="font-medium">Share via Email</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                </div>
            </DialogContent>
        </Dialog>
    );
}
