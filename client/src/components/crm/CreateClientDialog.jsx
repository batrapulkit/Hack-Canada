import { useState, useEffect } from 'react';
import { CountrySelect } from "@/components/common/CountrySelect";
import { useNavigate } from 'react-router-dom';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent } from '../ui/dialog';
import { Textarea } from "../ui/textarea";
import { toast } from "sonner";
import { Plane, Calendar, DollarSign, Users, Sparkles } from 'lucide-react';
import api from '../../api/client';

export default function CreateClientDialog({ open, onClose, clientToEdit = null, onSuccess, initialData = null }) {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        company: '',
        address: '',
        city: '',
        country: '',
        notes: ''
    });

    // Anti-Gravity State
    const [pasteMode, setPasteMode] = useState(false);
    const [pasteText, setPasteText] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [followUpCommand, setFollowUpCommand] = useState(null); // Store "plan trip" command

    // Trip Details State
    const [tripDetails, setTripDetails] = useState({
        destination: '',
        startDate: '',
        endDate: '',
        duration: '',
        budget: '',
        travelers: 1,
        interests: '',
        notes: ''
    });

    useEffect(() => {
        if (clientToEdit) {
            setFormData({
                name: clientToEdit.name,
                email: clientToEdit.email,
                phone: clientToEdit.phone || '',
                company: clientToEdit.company || '',
                address: clientToEdit.address || '',
                city: clientToEdit.city || '',
                country: clientToEdit.country || '',
                notes: clientToEdit.notes || ''
            });
            // Reset trip details on edit mode
            setTripDetails({
                destination: '', startDate: '', endDate: '', budget: '', travelers: 1, interests: '', notes: ''
            });
        } else if (initialData) {
            setFormData({
                name: initialData.name || '',
                email: initialData.email || '',
                phone: initialData.phone || '',
                company: initialData.company || '',
                address: initialData.address || '',
                city: initialData.city || '',
                country: initialData.country || '',
                notes: initialData.notes || ''
            });

            // Capture Agentic Follow-Up
            if (initialData.follow_up) {
                setFollowUpCommand(initialData.follow_up);
            }

            // Reset trip details or prefill if needed in future
            setTripDetails({
                destination: '', startDate: '', endDate: '', budget: '', travelers: 1, interests: '', notes: ''
            });
        } else {
            resetForm();
        }
        // Reset paste mode when dialog opens/closes
        if (open && !clientToEdit) {
            setPasteMode(false);
            setPasteText('');
            // Don't reset followUpCommand here as it might be passed via open
        }
    }, [clientToEdit, open]);

    const resetForm = () => {
        setFormData({
            name: '', email: '', phone: '', company: '', address: '', city: '', country: '', notes: ''
        });
        setTripDetails({
            destination: '', startDate: '', endDate: '', duration: '', budget: '', travelers: 1, interests: '', notes: ''
        });
    };

    const handlePasteAnalysis = async () => {
        if (!pasteText.trim()) return;

        setIsAnalyzing(true);
        try {
            const data = await api.entities.Lead.parse(pasteText);

            setFormData(prev => ({
                ...prev,
                name: data.full_name || prev.name,
                email: data.email || prev.email,
                phone: data.phone || prev.phone,
                city: prev.city,
                country: prev.country,
                notes: (prev.notes ? prev.notes + '\n\n' : '') + (data.notes || '') + '\n[Source: Copied Text]',
            }));

            // Map Trip Details
            setTripDetails(prev => ({
                ...prev,
                destination: data.destination || prev.destination,
                startDate: data.start_date || prev.startDate,
                endDate: data.end_date || prev.endDate,
                duration: data.duration_days || prev.duration,
                budget: data.budget_approx_usd ? String(data.budget_approx_usd) : (data.budget_max ? String(data.budget_max) : (data.budget ? String(data.budget) : prev.budget)),
                travelers: data.num_adults ? (data.num_adults + (data.num_children || 0)) : (data.travelers || prev.travelers),
                interests: data.trip_interests ? data.trip_interests.join(', ') : prev.interests,
                notes: data.notes || prev.notes
            }));

            toast.success("Client & Trip details extracted!");
            setPasteMode(false);
        } catch (err) {
            console.error("AI Analysis failed", err);
            const msg = err.response?.data?.error || "Failed to analyze. Please try again.";
            toast.error(msg);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSubmit = async (e, shouldPlanTrip = false) => {
        if (e) e.preventDefault();

        if (!formData.name) {
            alert('Client Name is required');
            return;
        }

        try {
            let client;
            if (clientToEdit) {
                const res = await api.put(`/clients/${clientToEdit.id}`, formData);
                client = res.data.client;
                toast.success('Client updated successfully!');
            } else {
                const res = await api.post('/clients', formData);
                client = res.data.client;
                toast.success('Client created successfully!');

                // --- AUTO-CREATE INVOICE (Anti-Gravity) ---
                // If we have a budget/trip details, create a draft invoice automatically
                if (tripDetails.budget && parseFloat(tripDetails.budget) > 0) {
                    try {
                        let cleanBudgetStr = tripDetails.budget.toLowerCase().replace(/[^0-9.k]/g, '');
                        if (cleanBudgetStr.endsWith('k')) {
                            cleanBudgetStr = parseFloat(cleanBudgetStr) * 1000;
                        }
                        const budgetAmount = parseFloat(cleanBudgetStr);

                        console.log('[DEBUG] Auto-Invoice: Budget', tripDetails.budget, '->', budgetAmount);

                        if (!isNaN(budgetAmount) && budgetAmount > 0) {
                            const invoicePayload = {
                                client_id: client.id,
                                status: 'draft',
                                issue_date: new Date().toISOString(),
                                due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // +7 days
                                items: [
                                    {
                                        description: `Estimated Trip Cost: ${tripDetails.destination || 'Custom Trip'}`,
                                        quantity: 1,
                                        unit_price: budgetAmount
                                    }
                                ],
                                notes: `Auto-generated from AI inquiry extraction.\nTrip: ${tripDetails.destination}\nDates: ${tripDetails.startDate} - ${tripDetails.endDate}`
                            };

                            await api.entities.Invoice.create(invoicePayload);
                            toast.success(`Draft Invoice for $${budgetAmount} created!`);
                        }
                    } catch (invErr) {
                        console.error('Auto-invoice creation failed:', invErr);
                        toast.error('Client saved, but failed to create automatic invoice.');
                    }
                }
            }

            if (onSuccess) onSuccess();

            if (shouldPlanTrip) {
                onClose();
                // Navigate to Itineraries with state to open builder
                navigate('/itineraries', {
                    state: {
                        openAIBuilder: true,
                        client: client,
                        initialData: tripDetails
                    }
                });
            } else {
                onClose();
            }

            // --- AGENTIC AUTO-CHAIN EXECUTION ---
            if (followUpCommand && client) {
                // 1. Replace placeholder pronouns with actual name to avoid ambiguity
                // "Plan a trip for him" -> "Plan a trip for John Doe"
                let refinedCommand = followUpCommand
                    .replace(/\bhim\b/gi, client.name)
                    .replace(/\bher\b/gi, client.name)
                    .replace(/\bthem\b/gi, client.name)
                    .replace(/\bthis client\b/gi, client.name)
                    .replace(/\bthe client\b/gi, client.name);

                // Ensure the name is present if not already
                if (!refinedCommand.toLowerCase().includes(client.name.toLowerCase())) {
                    refinedCommand += ` for ${client.name}`;
                }

                console.log(`[Agentic] Chains Executing: "${refinedCommand}"`);

                // 2. Dispatch event for AIAssistant to pick up
                setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('ai:execute-command', {
                        detail: { command: refinedCommand }
                    }));
                }, 500); // Small delay to allow UI to close
            }

            // Force a small reload if requested to ensure global state updates (e.g. Dashboard stats)
            // But relying on onSuccess is better React practice.
            resetForm();
            setFollowUpCommand(null); // Clear command
        } catch (error) {
            console.error('Error saving client:', error);
            toast.error(error.response?.data?.error || 'Failed to save client');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
                <h2 className="text-2xl font-bold mb-6">
                    {clientToEdit ? 'Edit Client' : 'Add New Client'}
                </h2>

                {/* Smart Sync Feature */}
                <div className="mb-4">
                    {pasteMode ? (
                        <div className="space-y-4">
                            <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                                <h3 className="font-medium text-blue-800 mb-1 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4" />
                                    Smart Sync (AI Powered)
                                </h3>
                                <p className="text-sm text-blue-600 mb-3">
                                    Paste any unstructured text. We'll extract client AND trip details.
                                </p>
                                <Textarea
                                    value={pasteText}
                                    onChange={(e) => setPasteText(e.target.value)}
                                    placeholder="e.g. 'John Doe needs a trip to Japan in April for 2 weeks, budget $10k. Email: john@example.com'"
                                    className="min-h-[100px] bg-white border-blue-200"
                                />
                                <div className="flex gap-2 mt-3 justify-end">
                                    <Button variant="ghost" size="sm" onClick={() => setPasteMode(false)} type="button">Cancel</Button>
                                    <Button
                                        size="sm"
                                        type="button"
                                        onClick={handlePasteAnalysis}
                                        disabled={isAnalyzing || !pasteText.trim()}
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        {isAnalyzing ? 'Analyzing...' : 'Extract Details'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-end mb-2">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-blue-600 hover:bg-blue-50 border border-blue-100"
                                onClick={() => setPasteMode(true)}
                            >
                                <Sparkles className="w-4 h-4 mr-2" />
                                Smart Sync
                            </Button>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <form id="client-form" onSubmit={(e) => handleSubmit(e, false)}>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Client Details</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Name *</Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <Label>Email</Label>
                                <Input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div>
                                <Label>Phone</Label>
                                <Input
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>City</Label>
                                <Input
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div>
                                <Label>Country</Label>
                                <CountrySelect
                                    value={formData.country}
                                    onChange={(val) => setFormData({ ...formData, country: val })}
                                />
                            </div>
                        </div>

                        <div className="mt-4">
                            <Label>Notes</Label>
                            <Textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Add any additional notes about this client..."
                                className="min-h-[100px]"
                            />
                        </div>

                        {/* Hidden submit button to allow Enter key submission for normal save */}
                        <button type="submit" className="hidden" />
                    </form>

                    {/* Trip Details Section (Only valid for new clients or if data present) */}
                    {(tripDetails.destination || tripDetails.budget || pasteMode || !clientToEdit) && (
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mt-6">
                            <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Plane className="w-4 h-4" />
                                Trip Inquiry Details
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs">Destination</Label>
                                    <Input
                                        value={tripDetails.destination}
                                        onChange={(e) => setTripDetails({ ...tripDetails, destination: e.target.value })}
                                        className="bg-white h-8"
                                        placeholder="e.g. Italy"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs">Budget</Label>
                                    <div className="relative">
                                        <DollarSign className="w-3 h-3 absolute left-2 top-2.5 text-gray-400" />
                                        <Input
                                            value={tripDetails.budget}
                                            onChange={(e) => setTripDetails({ ...tripDetails, budget: e.target.value })}
                                            className="bg-white h-8 pl-8"
                                            placeholder="5000"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-xs">Start Date</Label>
                                    <div className="relative">
                                        <Calendar className="w-3 h-3 absolute left-2 top-2.5 text-gray-400" />
                                        <Input
                                            value={tripDetails.startDate}
                                            onChange={(e) => setTripDetails({ ...tripDetails, startDate: e.target.value })}
                                            className="bg-white h-8 pl-8"
                                            placeholder="YYYY-MM-DD"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-xs">Travelers</Label>
                                    <div className="relative">
                                        <Users className="w-3 h-3 absolute left-2 top-2.5 text-gray-400" />
                                        <Input
                                            value={tripDetails.travelers}
                                            onChange={(e) => setTripDetails({ ...tripDetails, travelers: e.target.value })}
                                            className="bg-white h-8 pl-8"
                                            type="number"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3 pt-4 border-t mt-6">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <div className="flex-1 flex gap-2 justify-end">
                            <Button type="button" variant="secondary" onClick={(e) => handleSubmit(e, false)}>
                                {clientToEdit ? 'Save Client Only' : 'Save Client'}
                            </Button>
                            <Button
                                type="button"
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                                onClick={(e) => handleSubmit(e, true)}
                            >
                                <Sparkles className="w-4 h-4 mr-2" />
                                Save & Plan Trip
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
