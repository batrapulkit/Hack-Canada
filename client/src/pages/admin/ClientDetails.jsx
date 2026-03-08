import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    User, Mail, Phone, MapPin, Building,
    FileText, DollarSign, ArrowLeft, Download, Eye, Map
} from 'lucide-react';
import { format } from 'date-fns';
import { downloadInvoicePDF, generateInvoicePDF } from '../../utils/pdfGenerator';
import { toast } from "sonner";

export default function AdminClientDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [client, setClient] = useState(null);
    const [itineraries, setItineraries] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchClientData();
    }, [id]);

    const fetchClientData = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/admin/clients/${id}`);
            if (res.data.success) {
                setClient(res.data.client);
                setItineraries(res.data.itineraries || []);
                setInvoices(res.data.invoices || []);
            }
        } catch (error) {
            console.error('Error fetching admin client details:', error);
            toast.error('Failed to load client details');
        } finally {
            setLoading(false);
        }
    };

    const handleViewInvoicePDF = async (invoice) => {
        // Fetch agency details first if needed for invoice branding, 
        // but for now we'll pass generic name or rely on invoice data
        try {
            const doc = await generateInvoicePDF(invoice, 'Agency Invoice');
            window.open(doc.output('bloburl'), '_blank');
        } catch (err) {
            console.error('PDF view error:', err);
            toast.error('Failed to generate PDF');
        }
    };

    const handleDownloadInvoicePDF = async (invoice) => {
        try {
            await downloadInvoicePDF(invoice, 'Agency Invoice');
        } catch (err) {
            console.error('PDF download error:', err);
            toast.error('Failed to download PDF');
        }
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
            <div className="p-8 text-center bg-slate-50 min-h-screen">
                <div className="max-w-md mx-auto mt-20">
                    <User className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-slate-900">Client not found</h2>
                    <Button onClick={() => navigate(-1)} className="mt-4">
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto bg-slate-50/50 min-h-screen">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">{client.name || client.full_name}</h1>
                    <div className="flex items-center gap-2 text-slate-500">
                        <Badge variant="outline" className="bg-white">
                            Client ID: {client.id.slice(0, 8)}
                        </Badge>
                        <span>•</span>
                        <span>Added {format(new Date(client.created_at), 'MMM d, yyyy')}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Sidebar / Profile Info */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader>
                            <CardTitle>Contact Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3 text-slate-600">
                                <Mail className="w-4 h-4 text-slate-400" />
                                <span>{client.email || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-600">
                                <Phone className="w-4 h-4 text-slate-400" />
                                <span>{client.phone || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-600">
                                <MapPin className="w-4 h-4 text-slate-400" />
                                <span>{[client.city, client.country].filter(Boolean).join(', ') || 'N/A'}</span>
                            </div>
                            {client.company && (
                                <div className="flex items-center gap-3 text-slate-600">
                                    <Building className="w-4 h-4 text-slate-400" />
                                    <span>{client.company}</span>
                                </div>
                            )}

                            <div className="pt-6 border-t mt-2">
                                <p className="text-sm font-medium text-slate-900 mb-2">Notes</p>
                                <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-600 min-h-[80px]">
                                    {client.notes || 'No notes available.'}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader>
                            <CardTitle>Activity Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-indigo-50 rounded-lg text-center border border-indigo-100">
                                <p className="text-2xl font-bold text-indigo-700">{itineraries.length}</p>
                                <p className="text-xs text-indigo-600 uppercase tracking-wider font-semibold">Trips</p>
                            </div>
                            <div className="p-4 bg-emerald-50 rounded-lg text-center border border-emerald-100">
                                <p className="text-2xl font-bold text-emerald-700">{invoices.length}</p>
                                <p className="text-xs text-emerald-600 uppercase tracking-wider font-semibold">Invoices</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    <Tabs defaultValue="itineraries" className="w-full">
                        <TabsList className="bg-white border p-1 h-auto rounded-xl shadow-sm inline-flex mb-6">
                            <TabsTrigger value="itineraries" className="px-6 py-2 rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                                Itineraries
                            </TabsTrigger>
                            <TabsTrigger value="invoices" className="px-6 py-2 rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                                Invoices
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="itineraries" className="space-y-4">
                            {itineraries.length === 0 ? (
                                <Card className="border-dashed shadow-none bg-slate-50">
                                    <div className="text-center py-12">
                                        <Map className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                        <p className="font-medium text-slate-900">No itineraries found</p>
                                        <p className="text-sm text-slate-500">This client hasn't been part of any trips yet.</p>
                                    </div>
                                </Card>
                            ) : (
                                itineraries.map(itinerary => (
                                    <Card key={itinerary.id} className="hover:shadow-md transition-shadow group">
                                        <CardContent className="p-6 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-white border rounded-lg flex items-center justify-center text-indigo-600 shadow-sm group-hover:border-indigo-200 group-hover:bg-indigo-50 transition-colors">
                                                    <MapPin className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-slate-900 text-lg">{itinerary.destination || 'Untitled Trip'}</h4>
                                                    <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                                                        <span>{itinerary.duration} Days</span>
                                                        <span>•</span>
                                                        <span>Created {format(new Date(itinerary.created_at), 'MMM d, yyyy')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className="capitalize bg-white shadow-sm">
                                                {itinerary.status}
                                            </Badge>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </TabsContent>

                        <TabsContent value="invoices" className="space-y-4">
                            {invoices.length === 0 ? (
                                <Card className="border-dashed shadow-none bg-slate-50">
                                    <div className="text-center py-12">
                                        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                        <p className="font-medium text-slate-900">No invoices found</p>
                                        <p className="text-sm text-slate-500">This client has no billing history.</p>
                                    </div>
                                </Card>
                            ) : (
                                invoices.map(invoice => (
                                    <Card key={invoice.id} className="hover:shadow-md transition-shadow group">
                                        <CardContent className="p-6 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-white border rounded-lg flex items-center justify-center text-emerald-600 shadow-sm group-hover:border-emerald-200 group-hover:bg-emerald-50 transition-colors">
                                                    <DollarSign className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-slate-900 text-lg">Invoice #{invoice.invoice_number}</h4>
                                                    <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                                                        <span>Issued {format(new Date(invoice.created_at), 'MMM d, yyyy')}</span>
                                                        {invoice.due_date && <span>• Due {format(new Date(invoice.due_date), 'MMM d')}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <div className="text-right">
                                                    <p className="font-bold text-slate-900 text-lg">${parseFloat(invoice.total).toLocaleString()}</p>
                                                    <Badge variant="outline" className={`capitalize mt-1 ${invoice.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                            invoice.status === 'sent' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                                'bg-slate-50 text-slate-700 border-slate-200'
                                                        }`}>
                                                        {invoice.status}
                                                    </Badge>
                                                </div>
                                                <div className="flex gap-2 border-l pl-4">
                                                    <Button variant="ghost" size="icon" onClick={() => handleViewInvoicePDF(invoice)} title="View PDF">
                                                        <Eye className="w-4 h-4 text-slate-500" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDownloadInvoicePDF(invoice)} title="Download PDF">
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
