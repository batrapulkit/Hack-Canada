import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Send, CheckCircle } from 'lucide-react';

export default function LeadCaptureWidget() {
    const { agencyId } = useParams();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        destination: '',
        travel_date: '',
        budget: '',
        notes: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/public/leads`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    agency_id: agencyId,
                    ...formData
                })
            });

            if (!response.ok) throw new Error('Failed to submit');

            setSuccess(true);
        } catch (err) {
            console.error(err);
            alert("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white p-6">
                <div className="text-center animate-fade-in-up">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Request Sent!</h2>
                    <p className="text-slate-600">We'll be in touch shortly to plan your dream trip.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white p-6 font-sans">
            <div className="max-w-md mx-auto">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-slate-900">Plan Your Trip</h2>
                    <p className="text-slate-500 text-sm mt-1">Tell us where you want to go</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                required
                                placeholder="John Doe"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                required
                                placeholder="john@example.com"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="destination">Where to?</Label>
                        <Input
                            id="destination"
                            required
                            placeholder="e.g. Bali, Paris, Tokyo"
                            value={formData.destination}
                            onChange={e => setFormData({ ...formData, destination: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="date">When?</Label>
                            <Input
                                id="date"
                                type="date"
                                value={formData.travel_date}
                                onChange={e => setFormData({ ...formData, travel_date: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="budget">Budget</Label>
                            <Input
                                id="budget"
                                placeholder="$2000"
                                value={formData.budget}
                                onChange={e => setFormData({ ...formData, budget: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Any specific interests?</Label>
                        <Textarea
                            id="notes"
                            placeholder="Honeymoon, Adventure, Food..."
                            className="h-24"
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                        Get Free Quote
                    </Button>

                    <div className="text-center pt-4">
                        <p className="text-[10px] text-slate-400">
                            Powered by <span className="font-bold">Triponic</span>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
