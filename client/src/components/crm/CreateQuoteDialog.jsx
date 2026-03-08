import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import api from "@/api/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function CreateQuoteDialog({ open, onClose, quoteToEdit = null }) {
    const queryClient = useQueryClient();

    // Default form state
    const defaultState = {
        client_id: '',
        title: 'Proposal',
        introduction: '',
        header_text: '', // Terms
        footer_text: '',
        notes: '',
        due_date: '',
        items: [{ description: 'Travel Services', quantity: 1, unit_price: 0 }]
    };

    const [formData, setFormData] = useState(defaultState);

    // Load data when opening for edit or reset
    useEffect(() => {
        if (open) {
            if (quoteToEdit) {
                setFormData({
                    client_id: quoteToEdit.client_id,
                    title: quoteToEdit.title || 'Proposal',
                    introduction: quoteToEdit.introduction || '',
                    header_text: quoteToEdit.header_text || '',
                    footer_text: quoteToEdit.footer_text || '',
                    notes: quoteToEdit.notes || '',
                    due_date: quoteToEdit.valid_until ? quoteToEdit.valid_until.split('T')[0] : '',
                    items: quoteToEdit.quote_items && quoteToEdit.quote_items.length > 0
                        ? quoteToEdit.quote_items
                        : [{ description: 'Travel Services', quantity: 1, unit_price: quoteToEdit.total_price || 0 }]
                });
            } else {
                setFormData(defaultState);
            }
        }
    }, [open, quoteToEdit]);

    const { data: clients = [] } = useQuery({
        queryKey: ['clients'],
        queryFn: async () => {
            const response = await api.get('/clients');
            return response.data.clients || [];
        },
        initialData: [],
    });

    const calculateTotal = () => {
        return formData.items.reduce((sum, item) => sum + (parseFloat(item.quantity || 0) * parseFloat(item.unit_price || 0)), 0);
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;
        setFormData({ ...formData, items: newItems });
    };

    const addItem = () => {
        setFormData({ ...formData, items: [...formData.items, { description: '', quantity: 1, unit_price: 0 }] });
    };

    const removeItem = (index) => {
        if (formData.items.length > 1) {
            const newItems = formData.items.filter((_, i) => i !== index);
            setFormData({ ...formData, items: newItems });
        }
    };

    const mutation = useMutation({
        mutationFn: (data) => {
            if (quoteToEdit) {
                return api.patch(`/quotes/${quoteToEdit.id}`, data);
            }
            return api.entities.Quote.create(data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quotes'] });
            toast.success(quoteToEdit ? 'Quote updated' : 'Quote created successfully');
            onClose();
        },
        onError: (err) => {
            toast.error(err.response?.data?.error || 'Failed to save quote');
            console.error("Quote Save Error:", err);
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!quoteToEdit && !formData.client_id) {
            toast.error("Please select a client");
            return;
        }

        const total = calculateTotal();
        if (total <= 0) {
            // Warn but allow? No, usually require > 0
            // toast.error("Total amount must be greater than 0");
            // return;
        }

        mutation.mutate({
            ...formData,
            items: formData.items,
            total: total
        });
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{quoteToEdit ? 'Edit Quote' : 'Create New Quote'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Client</Label>
                            <Select
                                value={formData.client_id}
                                onValueChange={(val) => setFormData({ ...formData, client_id: val })}
                                disabled={!!quoteToEdit}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a client" />
                                </SelectTrigger>
                                <SelectContent>
                                    {clients.map(client => (
                                        <SelectItem key={client.id} value={client.id}>
                                            {client.full_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Due Date</Label>
                            <Input
                                type="date"
                                value={formData.due_date}
                                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Quote Title (e.g. "Draft Proposal" or "Summer Trip")</Label>
                        <Input
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Proposal"
                        />
                    </div>

                    {/* Line Items Section */}
                    <div className="space-y-2 border p-4 rounded-md bg-slate-50">
                        <Label className="mb-2 block">Line Items (Service, Hotel, Fee, etc.)</Label>
                        {formData.items.map((item, index) => (
                            <div key={index} className="flex gap-2 items-end mb-2">
                                <div className="flex-grow">
                                    <Label className="text-xs text-slate-500">Description</Label>
                                    <Input
                                        value={item.description}
                                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                        placeholder="Item Description"
                                    />
                                </div>
                                <div className="w-20">
                                    <Label className="text-xs text-slate-500">Qty</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={item.quantity}
                                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                    />
                                </div>
                                <div className="w-32">
                                    <Label className="text-xs text-slate-500">Price ($)</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={item.unit_price}
                                        onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                                    />
                                </div>
                                <div className="w-24 text-right pb-2 font-medium">
                                    ${(parseFloat(item.quantity || 0) * parseFloat(item.unit_price || 0)).toFixed(2)}
                                </div>
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)} disabled={formData.items.length === 1} className="text-rose-500 hover:text-rose-700">
                                    <span className="sr-only">Remove</span>
                                    &times;
                                </Button>
                            </div>
                        ))}
                        <div className="flex justify-between items-center mt-2">
                            <Button type="button" variant="outline" size="sm" onClick={addItem} className="text-blue-600 border-blue-200 hover:bg-blue-50">
                                + Add Item
                            </Button>
                            <div className="text-lg font-bold">
                                Total: ${calculateTotal().toFixed(2)}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Internal Notes</Label>
                        <Input
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Internal use only"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Introduction / Opening Message</Label>
                        <Textarea
                            placeholder="Dear Client, please find attached the proposal..."
                            className="h-24"
                            value={formData.introduction}
                            onChange={(e) => setFormData({ ...formData, introduction: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Terms & Conditions / Header Details</Label>
                        <Textarea
                            placeholder="Deposit required by..."
                            className="h-24"
                            value={formData.header_text}
                            onChange={(e) => setFormData({ ...formData, header_text: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Footer Text</Label>
                        <Input
                            placeholder="Thank you for your business!"
                            value={formData.footer_text}
                            onChange={(e) => setFormData({ ...formData, footer_text: e.target.value })}
                        />
                    </div>

                    <DialogFooter className="mt-6">
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={mutation.isPending} className="bg-slate-900 text-white hover:bg-slate-800">
                            {mutation.isPending ? 'Saving...' : (quoteToEdit ? 'Update Quote' : 'Create Quote')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
