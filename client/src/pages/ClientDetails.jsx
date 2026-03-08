import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
    User, Mail, Phone, MapPin, Building, Calendar,
    FileText, DollarSign, ArrowLeft, Plus, Download, Eye, Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { downloadInvoicePDF, generateInvoicePDF } from '../utils/pdfGenerator';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function ClientDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [client, setClient] = useState(null);
    const [itineraries, setItineraries] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const queryClient = useQueryClient();

    const deleteItineraryMutation = useMutation({
        mutationFn: (id) => api.delete(`/itineraries/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['itineraries'] });
            // Also update local state
            setItineraries(prev => prev.filter(i => i.id !== deleteItineraryMutation.variables));
            toast.success('Itinerary deleted successfully');
            fetchClientData(); // Refresh data
        },
        onError: (error) => {
            console.error('Delete error:', error);
            toast.error('Failed to delete itinerary');
        }
    });

    const handleDeleteItinerary = (id, e) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this itinerary? This action cannot be undone.')) {
            deleteItineraryMutation.mutate(id);
        }
    };

    useEffect(() => {
        fetchClientData();
    }, [id]);

    const fetchClientData = async () => {
        try {
            setLoading(true);
            const [clientRes, itinerariesRes, invoicesRes] = await Promise.all([
                api.get(`/clients/${id}`),
                api.get(`/itineraries?clientId=${id}`),
                api.get(`/invoices?clientId=${id}`)
            ]);

            setClient(clientRes.data.client); // Assuming endpoint returns { client: ... } or adjust based on actual API
            setItineraries(itinerariesRes.data.itineraries || []);
            setInvoices(invoicesRes.data.invoices || []);
        } catch (error) {
            console.error('Error fetching client details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewInvoicePDF = async (invoice) => {
        const doc = await generateInvoicePDF(invoice, 'Triponic'); // You might want to fetch agency name
        window.open(doc.output('bloburl'), '_blank');
    };

    const handleDownloadInvoicePDF = async (invoice) => {
        await downloadInvoicePDF(invoice, 'Triponic');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
            </div>
        );
    }

    if (!client) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-2xl font-bold text-slate-900">Client not found</h2>
                <Button onClick={() => navigate('/clients')} className="mt-4">
                    Back to Clients
                </Button>
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/clients')}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">{client.name || client.full_name}</h1>
                    <p className="text-slate-500">Client Profile</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Sidebar / Profile Info */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Contact Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3 text-slate-600">
                                <Mail className="w-4 h-4" />
                                <span>{client.email}</span>
                            </div>
                            {client.phone && (
                                <div className="flex items-center gap-3 text-slate-600">
                                    <Phone className="w-4 h-4" />
                                    <span>{client.phone}</span>
                                </div>
                            )}
                            {(client.city || client.country) && (
                                <div className="flex items-center gap-3 text-slate-600">
                                    <MapPin className="w-4 h-4" />
                                    <span>{[client.city, client.country].filter(Boolean).join(', ')}</span>
                                </div>
                            )}
                            {client.company && (
                                <div className="flex items-center gap-3 text-slate-600">
                                    <Building className="w-4 h-4" />
                                    <span>{client.company}</span>
                                </div>
                            )}
                            <div className="pt-4 border-t">
                                <p className="text-sm font-medium text-slate-900 mb-2">Notes</p>
                                <p className="text-sm text-slate-500 whitespace-pre-wrap">
                                    {client.notes || 'No notes available.'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Stats</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50 rounded-lg text-center">
                                <p className="text-2xl font-bold text-slate-900">{itineraries.length}</p>
                                <p className="text-xs text-slate-500 uppercase tracking-wider">Trips</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-lg text-center">
                                <p className="text-2xl font-bold text-slate-900">{invoices.length}</p>
                                <p className="text-xs text-slate-500 uppercase tracking-wider">Invoices</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-2">
                    <Tabs defaultValue="itineraries" className="w-full">
                        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent space-x-6">
                            <TabsTrigger
                                value="itineraries"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-transparent px-0 py-3"
                            >
                                Itineraries
                            </TabsTrigger>
                            <TabsTrigger
                                value="invoices"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-transparent px-0 py-3"
                            >
                                Invoices
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="itineraries" className="mt-6 space-y-4">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">Trip History</h3>
                                <Button size="sm" onClick={() => navigate('/itineraries')}>
                                    <Plus className="w-4 h-4 mr-2" /> New Trip
                                </Button>
                            </div>
                            {itineraries.length === 0 ? (
                                <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed">
                                    <p className="text-slate-500">No itineraries found for this client.</p>
                                </div>
                            ) : (
                                itineraries.map(itinerary => (
                                    <Card key={itinerary.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/itineraries/${itinerary.id}`)}>
                                        <CardContent className="p-6 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                                                    <MapPin className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-slate-900">{itinerary.destination}</h4>
                                                    <p className="text-sm text-slate-500">{itinerary.duration} Days • {format(new Date(itinerary.created_at), 'MMM d, yyyy')}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="capitalize">{itinerary.status}</Badge>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    onClick={(e) => handleDeleteItinerary(itinerary.id, e)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </TabsContent>

                        <TabsContent value="invoices" className="mt-6 space-y-4">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">Billing History</h3>
                                <Button size="sm" onClick={() => navigate('/quotes')}>
                                    <Plus className="w-4 h-4 mr-2" /> New Invoice
                                </Button>
                            </div>
                            {invoices.length === 0 ? (
                                <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed">
                                    <p className="text-slate-500">No invoices found for this client.</p>
                                </div>
                            ) : (
                                invoices.map(invoice => (
                                    <Card key={invoice.id} className="hover:shadow-md transition-shadow">
                                        <CardContent className="p-6 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
                                                    <DollarSign className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-slate-900">Invoice #{invoice.invoice_number}</h4>
                                                    <p className="text-sm text-slate-500">{format(new Date(invoice.created_at), 'MMM d, yyyy')} • Due {invoice.due_date ? format(new Date(invoice.due_date), 'MMM d') : 'N/A'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <p className="font-bold text-slate-900">${parseFloat(invoice.total).toLocaleString()}</p>
                                                    <Badge variant="outline" className={`capitalize ${invoice.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                        invoice.status === 'sent' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                            'bg-slate-100 text-slate-700'
                                                        }`}>
                                                        {invoice.status}
                                                    </Badge>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => handleViewInvoicePDF(invoice)}>
                                                        <Eye className="w-4 h-4 text-slate-500" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDownloadInvoicePDF(invoice)}>
                                                        <Download className="w-4 h-4 text-slate-500" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
