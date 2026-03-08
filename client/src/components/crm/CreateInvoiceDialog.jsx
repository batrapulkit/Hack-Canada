import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import api from "@/api/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBranding } from "@/contexts/BrandingContext";

export default function CreateInvoiceDialog({ open, onClose, invoiceToEdit = null, initialData = null, templateData = null }) {
    const queryClient = useQueryClient();
    const branding = useBranding();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        client_id: "",
        itinerary_id: "",
        due_date: "",
        issue_date: new Date().toLocaleDateString('en-CA'),
        notes: "",
        status: "draft", // Add Default Status
        items: [{ description: "", quantity: 1, unit_price: 0 }]
    });

    // Reset or Populate form when dialog opens/changes
    React.useEffect(() => {
        if (open) {
            if (invoiceToEdit) {
                setFormData({
                    client_id: invoiceToEdit.client_id || "",
                    itinerary_id: invoiceToEdit.itinerary_id || "",
                    due_date: invoiceToEdit.due_date ? invoiceToEdit.due_date.split('T')[0] : "",
                    issue_date: invoiceToEdit.issue_date ? invoiceToEdit.issue_date.split('T')[0] : new Date().toISOString().split('T')[0],
                    notes: invoiceToEdit.notes || "",
                    status: invoiceToEdit.status || "draft",
                    tax_rate: invoiceToEdit.tax_rate !== undefined ? invoiceToEdit.tax_rate : (branding.invoiceSettings?.defaultTaxRate || 0),
                    items: invoiceToEdit.invoice_items && invoiceToEdit.invoice_items.length > 0
                        ? invoiceToEdit.invoice_items.map(item => ({
                            description: item.description,
                            quantity: item.quantity,
                            unit_price: item.unit_price,
                            taxable: item.taxable // Ensure we load saved taxable status
                        }))
                        : [{ description: "", quantity: 1, unit_price: 0, taxable: false }]
                });
            } else if (templateData) {
                // TEMPLATE PREFILL (New Invoice with Template)
                setFormData({
                    client_id: "",
                    itinerary_id: "",
                    due_date: "",
                    issue_date: new Date().toLocaleDateString('en-CA'),
                    notes: `Invoice based on ${templateData.name} template`,
                    tax_rate: branding.invoiceSettings?.defaultTaxRate || 0,
                    items: templateData.items || [{ description: "", quantity: 1, unit_price: 0, taxable: false }]
                });
            } else if (initialData) {
                // AI PREFILL (New Invoice with Data)
                setFormData({
                    client_id: initialData.client_id || "",
                    itinerary_id: initialData.itinerary_id || "",
                    due_date: initialData.due_date || "",
                    issue_date: new Date().toLocaleDateString('en-CA'),
                    notes: initialData.notes || "",
                    tax_rate: branding.invoiceSettings?.defaultTaxRate || 0,
                    items: initialData.items && initialData.items.length > 0
                        ? initialData.items
                        : [{ description: "", quantity: 1, unit_price: 0, taxable: false }]
                });
            } else {
                // NEW INVOICE DEFAULTS
                setFormData({
                    client_id: "",
                    itinerary_id: "",
                    due_date: "",
                    issue_date: new Date().toLocaleDateString('en-CA'),
                    notes: "",
                    tax_rate: branding.invoiceSettings?.defaultTaxRate || 0,
                    items: [{ description: "", quantity: 1, unit_price: 0, taxable: false }]
                });
            }
        }
    }, [open, invoiceToEdit, initialData, templateData]);

    const { data: clients = [] } = useQuery({
        queryKey: ['clients'],
        queryFn: () => api.entities.Client.list(),
        initialData: []
    });

    const { data: itineraries = [] } = useQuery({
        queryKey: ['itineraries'],
        queryFn: () => api.entities.Itinerary.list(),
        initialData: []
    });

    // Filter itineraries by selected client
    const clientItineraries = formData.client_id
        ? itineraries.filter(i => i.client_id === formData.client_id)
        : [];

    // Auto-populate when Trip is selected
    React.useEffect(() => {
        if (formData.itinerary_id && itineraries.length > 0) {
            const trip = itineraries.find(i => i.id === formData.itinerary_id);
            if (trip) {
                // If items are empty or standard default, replace them
                const isDefault = formData.items.length === 1 && !formData.items[0].description;
                if (isDefault) {
                    setFormData(prev => ({
                        ...prev,
                        due_date: trip.start_date ? trip.start_date.split('T')[0] : prev.due_date,
                        items: [{
                            description: `Trip to ${trip.destination} (${trip.duration} days)\nDates: ${trip.start_date ? trip.start_date.split('T')[0] : ''} - ${trip.end_date ? trip.end_date.split('T')[0] : ''}`,
                            quantity: 1,
                            unit_price: parseFloat(trip.budget) || 0,
                            taxable: true // Default to taxable
                        }]
                    }));
                    toast.info("Invoice details auto-populated from Trip");
                }
            }
        }
    }, [formData.itinerary_id, itineraries]);

    const handleAddItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { description: "", quantity: 1, unit_price: 0, taxable: false }]
        });
    };

    const handleRemoveItem = (index) => {
        const newItems = [...formData.items];
        newItems.splice(index, 1);
        setFormData({ ...formData, items: newItems });
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        let val = value;
        if (field === 'quantity') val = parseFloat(value) || 0;
        if (field === 'unit_price') val = parseFloat(value) || 0;

        newItems[index] = { ...newItems[index], [field]: val };
        setFormData({ ...formData, items: newItems });
    };

    const calculateTotals = () => {
        const subtotal = formData.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
        const tax = formData.items.reduce((sum, item) => item.taxable ? sum + (item.quantity * item.unit_price * 0.13) : sum, 0);
        return { subtotal, tax, total: subtotal + tax };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                client_id: formData.client_id || null,
                itinerary_id: formData.itinerary_id || null,
                due_date: formData.due_date || null,
                issue_date: formData.issue_date || new Date().toISOString(),
                items: formData.items, // Explicitly include items
                notes: formData.notes,
                status: formData.status || 'draft', // Include status in update/create
                currency: 'USD',
                total: calculateTotals().total
            };

            console.log("Sending Invoice Payload:", payload);
            console.log("Items being sent:", JSON.stringify(formData.items)); // Explicit log

            if (invoiceToEdit) {
                await api.entities.Invoice.update(invoiceToEdit.id, payload);
                toast.success("Invoice updated successfully");
            } else {
                await api.entities.Invoice.create(payload);
                toast.success("Invoice created successfully");
            }

            queryClient.invalidateQueries(['invoices']);
            onClose();
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.details || error.response?.data?.error || error.message || (invoiceToEdit ? "Failed to update invoice" : "Failed to create invoice");
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{invoiceToEdit ? "Edit Invoice" : "Create New Invoice"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Client</Label>
                            <Select
                                value={formData.client_id}
                                onValueChange={(val) => {
                                    // Smart Tax Logic: Check client country
                                    const selectedClient = clients.find(c => c.id === val);
                                    let newTaxRate = branding.invoiceSettings?.defaultTaxRate || 0;

                                    const agencyCountry = branding.country || 'Canada';
                                    const clientCountry = selectedClient?.country || '';

                                    console.log('Smart Tax Debug:', {
                                        selectedClient,
                                        clientCountry,
                                        agencyCountry,
                                        defaultRate: newTaxRate
                                    });

                                    if (clientCountry) {
                                        // If different countries, usually 0% tax (Export)
                                        if (clientCountry.trim().toLowerCase() !== agencyCountry.trim().toLowerCase()) {
                                            newTaxRate = 0;
                                            toast.info(`International client detected (${clientCountry}). Tax set to 0%.`);
                                        } else {
                                            // Same country, use default
                                            // If Canada, stick to 13?
                                            // Maybe toast?
                                        }
                                    }

                                    setFormData({ ...formData, client_id: val, itinerary_id: "", tax_rate: newTaxRate });
                                }}
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
                            <Label>Trip (Optional)</Label>
                            <Select
                                value={formData.itinerary_id}
                                onValueChange={(val) => setFormData({ ...formData, itinerary_id: val })}
                                disabled={!formData.client_id}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select trip" />
                                </SelectTrigger>
                                <SelectContent>
                                    {clientItineraries.map(i => (
                                        <SelectItem key={i.id} value={i.id}>{i.destination} ({i.duration} days)</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Issue Date</Label>
                            <Input
                                type="date"
                                value={formData.issue_date}
                                onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Due Date</Label>
                            <Input
                                type="date"
                                value={formData.due_date}
                                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(val) => setFormData({ ...formData, status: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="sent">Sent</SelectItem>
                                        <SelectItem value="paid">Paid</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>Line Items</Label>
                            <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                                <Plus className="w-4 h-4 mr-2" /> Add Item
                            </Button>
                        </div>
                        <div className="border rounded-md overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[40%]">Description</TableHead>
                                        <TableHead className="w-[15%]">Qty</TableHead>
                                        <TableHead className="w-[15%]">Price</TableHead>
                                        <TableHead className="w-[10%]">Tax?</TableHead>
                                        <TableHead className="w-[15%]">Total</TableHead>
                                        <TableHead className="w-[5%]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {formData.items.map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell>
                                                <Input
                                                    value={item.description}
                                                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                                    placeholder="Item description"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={item.unit_price}
                                                    onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                                                />
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={item.taxable || false}
                                                    onChange={(e) => handleItemChange(index, 'taxable', e.target.checked)}
                                                    className="h-4 w-4"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                ${(item.quantity * item.unit_price).toFixed(2)}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handleRemoveItem(index)}
                                                    disabled={formData.items.length === 1}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="flex flex-col items-end pt-2 space-y-1">
                            <div className="flex items-center gap-2 mb-1 justify-end">
                                <Label className="text-xs">Tax Rate %</Label>
                                <Input
                                    type="number"
                                    className="w-20 h-8 text-right"
                                    value={formData.tax_rate}
                                    onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
                                />
                            </div>
                            {/* Smart Tax Feedback */}
                            {formData.client_id && (
                                <p className="text-xs text-slate-400 italic text-right mb-1">
                                    {(() => {
                                        const client = clients.find(c => c.id === formData.client_id);
                                        const agencyCountry = (branding.country || 'Canada').trim().toLowerCase();
                                        const clientCountry = (client?.country || '').trim().toLowerCase();

                                        if (clientCountry && clientCountry !== agencyCountry) {
                                            return `International (${client?.country}) - Tax Exempt`;
                                        }
                                        return `Domestic (${branding.country || 'Default'}) - Default Rate applied`;
                                    })()}
                                </p>
                            )}
                            <p className="text-sm text-slate-500">Subtotal: ${calculateTotals().subtotal.toFixed(2)}</p>
                            <p className="text-sm text-slate-500">Tax: ${calculateTotals().tax.toFixed(2)}</p>
                            <p className="text-lg font-bold">Total: ${calculateTotals().total.toFixed(2)}</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Notes</Label>
                        <Textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Payment instructions, thank you note, etc."
                        />
                    </div>



                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Create Invoice
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
