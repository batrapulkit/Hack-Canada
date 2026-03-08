import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from "@/components/ui/dialog"; // Use standard shadcn dialog components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

export default function AddPackageDialog({ resortId, onPackageAdded }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        duration_days: '5',
        inclusions: 'All Inclusive, WiFi, Airport Transfers'
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const inclusionsArray = formData.inclusions.split(',').map(s => s.trim()).filter(Boolean);

            const { data, error } = await supabase
                .from('packages')
                .insert([{
                    resort_id: resortId,
                    name: formData.name,
                    description: formData.description,
                    price: parseFloat(formData.price),
                    duration_days: parseInt(formData.duration_days),
                    inclusions: inclusionsArray,
                    valid_from: new Date().toISOString(),
                    valid_until: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString()
                }])
                .select()
                .single();

            if (error) throw error;

            toast.success('Package created successfully!');
            setOpen(false);
            if (onPackageAdded) onPackageAdded(data);
            setFormData({ name: '', description: '', price: '', duration_days: '5', inclusions: 'All Inclusive, WiFi, Airport Transfers' });

        } catch (error) {
            console.error('Error adding package:', error);
            toast.error('Failed to create package');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="border-dashed border-purple-300 text-purple-700 hover:bg-purple-50">
                    <Plus className="w-4 h-4 mr-2" /> Create Custom Package
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create New Package</DialogTitle>
                    <DialogDescription>
                        Add a new travel package for this resort.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Package Name</Label>
                        <Input
                            id="name"
                            name="name"
                            placeholder="e.g. Honeymoon Special"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            name="description"
                            placeholder="Brief details..."
                            value={formData.description}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="price">Price (USD)</Label>
                            <Input
                                id="price"
                                name="price"
                                type="number"
                                min="0"
                                placeholder="2500"
                                value={formData.price}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="duration_days">Duration (Days)</Label>
                            <Input
                                id="duration_days"
                                name="duration_days"
                                type="number"
                                min="1"
                                value={formData.duration_days}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="inclusions">Inclusions (comma separated)</Label>
                        <Textarea
                            id="inclusions"
                            name="inclusions"
                            placeholder="WiFi, Breakfast, Spa Credit..."
                            value={formData.inclusions}
                            onChange={handleChange}
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading} className="bg-purple-600 hover:bg-purple-700">
                            {loading ? 'Creating...' : 'Create Package'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
