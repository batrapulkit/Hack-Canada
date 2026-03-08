import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Filter, MoreHorizontal, Plane, Hotel, Ticket, Car, Edit, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

import CreateBookingDialog from "./CreateBookingDialog";
import FlightSearchDialog from "../flights/FlightSearchDialog";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function BookingList({ itineraryId }) {
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showFlightSearch, setShowFlightSearch] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [editingBooking, setEditingBooking] = useState(null);
    const queryClient = useQueryClient();

    const { data: bookings = [], isLoading } = useQuery({
        queryKey: ['bookings', itineraryId],
        queryFn: () => api.entities.Booking.list(itineraryId ? { itineraryId } : {}),
        initialData: []
    });

    const filteredBookings = bookings.filter(b => {
        const term = searchTerm.toLowerCase();
        return (
            (b.client?.full_name || '').toLowerCase().includes(term) ||
            (b.confirmation_number || '').toLowerCase().includes(term) ||
            (b.description || '').toLowerCase().includes(term)
        );
    });

    const getTypeIcon = (type) => {
        switch (type) {
            case 'Flight': return <Plane className="w-4 h-4" />;
            case 'Hotel': return <Hotel className="w-4 h-4" />;
            case 'Car': return <Car className="w-4 h-4" />;
            default: return <Ticket className="w-4 h-4" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
            case 'ticketed': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
            case 'planned': return 'bg-slate-100 text-slate-800 border-slate-200 border-dashed'; // Distinct style for Planned
            case 'quoted': return 'bg-amber-50 text-amber-800 border-amber-200 border-dashed';
            default: return 'bg-yellow-100 text-yellow-800';
        }
    };

    const handleFlightBooking = async (bookingData) => {
        try {
            await api.entities.Booking.create(bookingData);
            toast.success("Planned flight added to itinerary");
            queryClient.invalidateQueries(['bookings']);
        } catch (error) {
            console.error(error);
            toast.error("Failed to add flight");
        }
    };

    const handleEdit = (booking) => {
        setEditingBooking(booking);
        setShowCreateDialog(true);
    };

    const handleDelete = async (bookingId) => {
        if (!confirm('Are you sure you want to delete this booking?')) return;

        try {
            await api.entities.Booking.delete(bookingId);
            toast.success("Booking deleted successfully");
            queryClient.invalidateQueries(['bookings']);
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete booking");
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="relative w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-500" />
                    <Input
                        placeholder="Search bookings..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Booking
                </Button>
                <Button variant="outline" onClick={() => setShowFlightSearch(true)} className="ml-2 border-slate-300 text-slate-700 bg-white hover:bg-slate-50">
                    <Search className="w-4 h-4 mr-2" />
                    Find Flights
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Type</TableHead>
                                <TableHead>Client</TableHead>
                                <TableHead>Details</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Supplier</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Price</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredBookings.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                                        No bookings found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredBookings.map((booking) => (
                                    <TableRow key={booking.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {getTypeIcon(booking.booking_type)}
                                                <span>{booking.booking_type}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {booking.client?.full_name || 'Unknown'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-sm truncate max-w-[200px]">{booking.description}</span>
                                                <span className="text-xs text-slate-500">{booking.confirmation_number}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {booking.travel_date ? format(new Date(booking.travel_date), 'MMM d, yyyy') : '-'}
                                        </TableCell>
                                        <TableCell>{booking.supplier?.name || '-'}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className={`${getStatusColor(booking.booking_status)} border`}>
                                                {booking.booking_status === 'planned' ? 'Planned' : (booking.booking_status === 'quoted' ? 'Quote' : booking.booking_status)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {booking.metadata?.currency ? booking.metadata.currency + ' ' : '$'}
                                            {booking.sell_price?.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEdit(booking)}
                                                    className="h-8 w-8 p-0"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(booking.id)}
                                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <CreateBookingDialog
                open={showCreateDialog}
                onClose={() => {
                    setShowCreateDialog(false);
                    setEditingBooking(null);
                }}
                bookingToEdit={editingBooking}
            />

            <FlightSearchDialog
                open={showFlightSearch}
                onOpenChange={setShowFlightSearch}
                onAddBooking={handleFlightBooking}
                itineraryId={itineraryId}
            />
        </div>
    );
}
