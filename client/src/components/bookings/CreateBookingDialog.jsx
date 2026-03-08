import React, { useState } from "react";
import { CountrySelect } from "@/components/common/CountrySelect";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import api from "@/api/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function CreateBookingDialog({ open, onClose }) {
    const queryClient = useQueryClient();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        client_id: "",
        supplier_id: "",
        booking_type: "Flight",
        booking_status: "confirmed",
        confirmation_number: "",
        travel_date: "",
        check_in_date: "",
        check_out_date: "",
        description: "",
        cost: "",
        sell_price: "",
        commission: "",
        country: ""
    });

    const { data: clients = [] } = useQuery({
        queryKey: ['clients'],
        queryFn: () => api.entities.Client.list(),
        initialData: []
    });

    const { data: suppliers = [] } = useQuery({
        queryKey: ['suppliers'],
        queryFn: () => api.entities.Supplier.list(),
        initialData: []
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.entities.Booking.create({
                ...formData,
                cost: parseFloat(formData.cost) || 0,
                sell_price: parseFloat(formData.sell_price) || 0,
                commission: parseFloat(formData.commission) || 0
            });
            toast.success("Booking created successfully");
            queryClient.invalidateQueries(['bookings']);
            onClose();
            setFormData({
                client_id: "",
                supplier_id: "",
                booking_type: "Flight",
                booking_status: "confirmed",
                confirmation_number: "",
                travel_date: "",
                check_in_date: "",
                check_out_date: "",
                description: "",
                cost: "",
                sell_price: "",
                commission: "",
                country: ""
            });
        } catch (error) {
            console.error(error);
            toast.error("Failed to create booking");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add Manual Booking</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Client</Label>
                            <Select
                                value={formData.client_id}
                                onValueChange={(val) => setFormData({ ...formData, client_id: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select client" />
                                </SelectTrigger>
                                <SelectContent>
                                    {clients.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Supplier</Label>
                            <Select
                                value={formData.supplier_id}
                                onValueChange={(val) => setFormData({ ...formData, supplier_id: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select supplier" />
                                </SelectTrigger>
                                <SelectContent>
                                    {suppliers.map(s => (
                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Type</Label>
                            <Select
                                value={formData.booking_type}
                                onValueChange={(val) => setFormData({ ...formData, booking_type: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Flight">Flight</SelectItem>
                                    <SelectItem value="Hotel">Hotel</SelectItem>
                                    <SelectItem value="Activity">Activity</SelectItem>
                                    <SelectItem value="Transfer">Transfer</SelectItem>
                                    <SelectItem value="Car">Car Rental</SelectItem>
                                    <SelectItem value="Insurance">Insurance</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select
                                value={formData.booking_status}
                                onValueChange={(val) => setFormData({ ...formData, booking_status: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="confirmed">Confirmed</SelectItem>
                                    <SelectItem value="ticketed">Ticketed</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>



                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Confirmation Number</Label>
                            <Input
                                value={formData.confirmation_number}
                                onChange={(e) => setFormData({ ...formData, confirmation_number: e.target.value })}
                                placeholder="e.g. XYZ123"
                            />
                        </div>

                        {/* Date Logic: Flight, Hotel, Car use Start/End. Others use Single Date unless specified */}
                        {(formData.booking_type === 'Hotel' || formData.booking_type === 'Car' || formData.booking_type === 'Flight') ? (
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-2">
                                    <Label>{formData.booking_type === 'Flight' ? 'Departure Date' : 'Check-in / Start'}</Label>
                                    <Input
                                        type="date"
                                        value={formData.check_in_date}
                                        onChange={(e) => setFormData({ ...formData, check_in_date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{formData.booking_type === 'Flight' ? 'Return Date' : 'Check-out / End'}</Label>
                                    <Input
                                        type="date"
                                        value={formData.check_out_date}
                                        onChange={(e) => setFormData({ ...formData, check_out_date: e.target.value })}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Label>Travel Date</Label>
                                <Input
                                    type="date"
                                    value={formData.travel_date}
                                    onChange={(e) => setFormData({ ...formData, travel_date: e.target.value })}
                                />
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Destination Country</Label>
                        <CountrySelect
                            value={formData.country}
                            onChange={(val) => setFormData({ ...formData, country: val })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Description / Details</Label>
                        <Textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Flight details, hotel room type, etc."
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Net Cost</Label>
                            <Input
                                type="number"
                                value={formData.cost}
                                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                                placeholder="0.00"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Sell Price</Label>
                            <Input
                                type="number"
                                value={formData.sell_price}
                                onChange={(e) => setFormData({ ...formData, sell_price: e.target.value })}
                                placeholder="0.00"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Commission</Label>
                            <Input
                                type="number"
                                value={formData.commission}
                                onChange={(e) => setFormData({ ...formData, commission: e.target.value })}
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Create Booking
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog >
    );
}
