import React, { useState } from 'react';
import { CountrySelect } from "@/components/common/CountrySelect";
import { supabase } from '@/lib/supabaseClient';
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';
import { Plus, Loader2 } from 'lucide-react';

export default function AddResortDialog({ onResortAdded }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        country: 'Mexico',
        description: '',
        price_level: '2',
        rating: '4.5',
        image_url: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data, error } = await supabase.from('resorts').insert({
                name: formData.name,
                location: formData.location,
                country: formData.country,
                description: formData.description,
                price_level: parseInt(formData.price_level),
                rating: parseFloat(formData.rating),
                image_url: formData.image_url,
                amenities: [], // Default empty
                tags: [], // Default empty
            }).select().single();

            if (error) throw error;

            toast.success('Resort added successfully!');
            setFormData({
                name: '',
                location: '',
                country: 'Mexico',
                description: '',
                price_level: '2',
                rating: '4.5',
                image_url: ''
            });
            if (onResortAdded) onResortAdded(data);
            setOpen(false);
        } catch (error) {
            console.error('Error adding resort:', error);
            toast.error('Failed to add resort.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/20">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Resort
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px] bg-white">
                <DialogHeader>
                    <DialogTitle>Add New Resort Contract</DialogTitle>
                    <DialogDescription>
                        Add a new property to your AI ranking engine.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Name
                        </Label>
                        <Input
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="e.g. Grand Velas"
                            className="col-span-3"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="location" className="text-right">
                            Location
                        </Label>
                        <Input
                            id="location"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            placeholder="e.g. Riviera Maya"
                            className="col-span-3"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="country" className="text-right">
                            Country
                        </Label>
                        <div className="col-span-3">
                            <CountrySelect
                                value={formData.country}
                                onChange={(val) => handleSelectChange('country', val)}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="price_level" className="text-right">
                            Price Level
                        </Label>
                        <Select
                            name="price_level"
                            value={formData.price_level}
                            onValueChange={(val) => handleSelectChange('price_level', val)}
                        >
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select level" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">$ Budget</SelectItem>
                                <SelectItem value="2">$$ Moderate</SelectItem>
                                <SelectItem value="3">$$$ High</SelectItem>
                                <SelectItem value="4">$$$$ Luxury</SelectItem>
                                <SelectItem value="5">$$$$$ Ultra</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="image_url" className="text-right">
                            Image URL
                        </Label>
                        <Input
                            id="image_url"
                            name="image_url"
                            value={formData.image_url}
                            onChange={handleChange}
                            placeholder="https://..."
                            className="col-span-3"
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="description" className="text-right">
                            Description
                        </Label>
                        <Textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className="col-span-3"
                            rows={3}
                        />
                    </div>
                </form>
                <DialogFooter>
                    <Button type="submit" disabled={loading} onClick={handleSubmit}>
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Save Resort
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
