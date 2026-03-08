import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Mail, Calendar, Users, Map, Globe, Plus, Trash2, Key, Shield, User, Briefcase, FileText, ScrollText } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function AgencyDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState("overview");

    // State for Add Agent
    const [isAddAgentOpen, setIsAddAgentOpen] = useState(false);
    const [newAgent, setNewAgent] = useState({ name: '', email: '', password: '', role: 'agent' });

    // State for Add Credits
    const [isAddCreditsOpen, setIsAddCreditsOpen] = useState(false);
    const [creditsAmount, setCreditsAmount] = useState('');

    // Query
    const { data, isLoading, error } = useQuery({
        queryKey: ['adminAgency', id],
        queryFn: async () => {
            console.log('Fetching Agency Details for ID:', id);
            const res = await api.get(`/admin/agencies/${id}`);
            console.log('Agency Details Response:', res.data);
            return res.data;
        }
    });


    // Fetch Clients
    const { data: clientsData } = useQuery({
        queryKey: ['adminAgencyClients', id],
        queryFn: async () => {
            const res = await api.get(`/admin/agencies/${id}/clients`);
            return res.data;
        },
        enabled: activeTab === 'clients'
    });

    // Fetch Leads
    const { data: leadsData } = useQuery({
        queryKey: ['adminAgencyLeads', id],
        queryFn: async () => {
            const res = await api.get(`/admin/agencies/${id}/leads`);
            return res.data;
        },
        enabled: activeTab === 'leads'
    });

    // Fetch Itineraries
    const { data: itinerariesData } = useQuery({
        queryKey: ['adminAgencyItineraries', id],
        queryFn: async () => {
            const res = await api.get(`/admin/agencies/${id}/itineraries`);
            return res.data;
        },
        enabled: activeTab === 'itineraries'
    });

    // Fetch Invoices
    const { data: invoicesData } = useQuery({
        queryKey: ['adminAgencyInvoices', id],
        queryFn: async () => {
            const res = await api.get(`/admin/agencies/${id}/invoices`);
            return res.data;
        },
        enabled: activeTab === 'invoices'
    });

    // Mutations
    const updateAgencyMutation = useMutation({
        mutationFn: async (updates) => {
            console.log('Sending update to API:', updates);
            const response = await api.put(`/admin/agencies/${id}`, updates);
            console.log('API response:', response.data);
            return response.data;
        },
        onSuccess: (data) => {
            console.log('Update successful:', data);
            queryClient.invalidateQueries(['adminAgency', id]);
            toast.success("Agency updated successfully!");
        },
        onError: (error) => {
            console.error('Update failed:', error);
            toast.error(`Failed to update agency: ${error.response?.data?.error || error.message}`);
        }
    });

    const addCreditsMutation = useMutation({
        mutationFn: async (amount) => {
            const res = await api.post(`/admin/agencies/${id}/credits`, { amount: Number(amount) });
            return res.data;
        },
        onSuccess: (data) => {
            queryClient.setQueryData(['adminAgency', id], (oldData) => {
                if (!oldData) return oldData;
                return {
                    ...oldData,
                    agency: {
                        ...oldData.agency,
                        credits_balance: (oldData.agency.credits_balance || 0) + Number(creditsAmount)
                    }
                };
            });
            queryClient.invalidateQueries(['adminAgency', id]);
            setIsAddCreditsOpen(false);
            setCreditsAmount('');
            toast.success("Credits added successfully");
        },
        onError: (err) => {
            toast.error("Failed to add credits: " + (err.response?.data?.error || err.message));
        }
    });

    const addAgentMutation = useMutation({
        mutationFn: async (agentData) => {
            await api.post(`/admin/agencies/${id}/users`, agentData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['adminAgency', id]);
            setIsAddAgentOpen(false);
            setNewAgent({ name: '', email: '', password: '', role: 'agent' });
            toast.success("Agent added successfully");
        },
        onError: (err) => {
            toast.error("Failed to add agent: " + (err.response?.data?.error || err.message));
        }
    });

    const deleteAgentMutation = useMutation({
        mutationFn: async (userId) => {
            await api.delete(`/admin/users/${userId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['adminAgency', id]);
            toast.success("Agent removed successfully");
        }
    });

    const handlePlanChange = (val) => {
        console.log('Plan change triggered:', val);
        toast.info(`Updating plan to ${val.replace('agency_', '')}...`);
        updateAgencyMutation.mutate({ subscription_plan: val });
    };

    const handleStatusChange = (val) => {
        updateAgencyMutation.mutate({ subscription_status: val });
    };

    const handleAddAgent = (e) => {
        e.preventDefault();
        if (!newAgent.email || !newAgent.password || !newAgent.name) return;
        addAgentMutation.mutate(newAgent);
    };

    const handleAddCredits = (e) => {
        e.preventDefault();
        if (!creditsAmount || isNaN(creditsAmount)) return;
        addCreditsMutation.mutate(creditsAmount);
    }

    if (isLoading) return <div className="p-8 text-center text-slate-500 flex flex-col items-center"><div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-indigo-600 animate-spin mb-4" />Loading agency details...</div>;
    if (error || !data?.agency) return <div className="p-8 text-center text-red-500">Agency not found</div>;

    const { agency: rawAgency } = data;

    // Provide defaults for subscription fields that might be null
    const agency = {
        ...rawAgency,
        subscription_plan: rawAgency.subscription_plan || 'agency_starter',
        subscription_status: rawAgency.subscription_status || 'active',
        credits_balance: rawAgency.credits_balance || 0,
        usage_count: rawAgency.usage_count || 0,
        usage_limit: rawAgency.usage_limit || null
    };

    const getInitials = (name) => name?.substring(0, 2).toUpperCase() || 'AG';
    const stringToColor = (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) { hash = str.charCodeAt(i) + ((hash << 5) - hash); }
        const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
        return '#' + '00000'.substring(0, 6 - c.length) + c;
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div>
                <Button variant="ghost" size="sm" className="mb-4 text-slate-500 hover:text-slate-900 -ml-2" onClick={() => navigate('/admin/agencies')}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Agencies
                </Button>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="flex items-start gap-4">
                        <div
                            className="w-16 h-16 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-md ring-4 ring-slate-50"
                            style={{ background: `linear-gradient(135deg, ${stringToColor(agency.agency_name)} 0%, ${stringToColor(agency.contact_email)} 100%)` }}
                        >
                            {getInitials(agency.agency_name)}
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">{agency.agency_name}</h2>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mt-2">
                                <span className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 rounded-md font-medium text-slate-600">
                                    <Mail className="w-3.5 h-3.5" />
                                    {agency.contact_email}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5" />
                                    Joined {format(new Date(agency.created_at), 'MMM d, yyyy')}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Dialog open={isAddCreditsOpen} onOpenChange={setIsAddCreditsOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="h-14 border-slate-200 bg-slate-50/50 hover:bg-slate-100 flex flex-col items-end px-4 py-2 gap-0.5">
                                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Credits</span>
                                    <span className="text-lg font-bold text-slate-900 flex items-center gap-1">
                                        <Plus className="w-3 h-3 text-slate-400" />
                                        {agency.credits_balance || 0}
                                    </span>
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add Credits to Agency</DialogTitle>
                                    <CardDescription>Manually add credits to this agency's balance.</CardDescription>
                                </DialogHeader>
                                <form onSubmit={handleAddCredits} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Amount</Label>
                                        <Input
                                            type="number"
                                            min="1"
                                            placeholder="e.g. 50"
                                            value={creditsAmount}
                                            onChange={e => setCreditsAmount(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <DialogFooter>
                                        <Button type="submit" disabled={addCreditsMutation.isPending}>
                                            {addCreditsMutation.isPending ? 'Adding...' : 'Add Credits'}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>

                        <div className={`flex flex-col items-end px-4 py-2 rounded-lg border ${agency.subscription_status === 'active' ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'
                            }`}>
                            <span className="text-xs uppercase tracking-wider font-semibold text-emerald-900/60 mb-0.5">Status</span>
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${agency.subscription_status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                <span className={`font-bold ${agency.subscription_status === 'active' ? 'text-emerald-700' : 'text-slate-600'} capitalize`}>
                                    {agency.subscription_status}
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-col items-end px-4 py-2 rounded-lg border bg-indigo-50 border-indigo-100">
                            <span className="text-xs uppercase tracking-wider font-semibold text-indigo-900/60 mb-0.5">Plan</span>
                            <span className="font-bold text-indigo-700 capitalize">
                                {agency.subscription_plan?.replace('agency_', '') || 'Free'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="bg-white border p-1 h-auto rounded-xl shadow-sm inline-flex flex-wrap gap-1">
                    <TabsTrigger value="overview" className="px-5 py-2 rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Overview</TabsTrigger>
                    <TabsTrigger value="clients" className="px-5 py-2 rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Clients</TabsTrigger>
                    <TabsTrigger value="leads" className="px-5 py-2 rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white">CRM Leads</TabsTrigger>
                    <TabsTrigger value="itineraries" className="px-5 py-2 rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Itineraries</TabsTrigger>
                    <TabsTrigger value="invoices" className="px-5 py-2 rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Invoices</TabsTrigger>
                    <TabsTrigger value="agents" className="px-5 py-2 rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Agents</TabsTrigger>
                    <TabsTrigger value="billing" className="px-5 py-2 rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Billing</TabsTrigger>
                </TabsList>

                {/* OVERVIEW TAB */}
                <TabsContent value="overview">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-slate-500">Total Itineraries</CardTitle>
                                <Map className="h-4 w-4 text-indigo-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-slate-900">{agency.stats?.itineraryCount || 0}</div>
                                <p className="text-xs text-slate-400 mt-1">Lifetime trips created</p>
                            </CardContent>
                        </Card>
                        <Card className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-slate-500">Monthly Usage</CardTitle>
                                <Globe className="h-4 w-4 text-purple-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-baseline gap-2">
                                    <div className="text-3xl font-bold text-slate-900">{agency.usage_count}</div>
                                    <div className="text-sm font-medium text-slate-400">/ {agency.usage_limit || '∞'}</div>
                                </div>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                                    <div
                                        className="bg-purple-500 h-full rounded-full transition-all duration-500"
                                        style={{ width: `${Math.min(((agency.usage_count || 0) / (agency.usage_limit || 1)) * 100, 100)}%` }}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-slate-500">Active Team</CardTitle>
                                <Users className="h-4 w-4 text-emerald-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-slate-900">{agency.users?.length || 0}</div>
                                <div className="flex -space-x-2 mt-3">
                                    {agency.users?.slice(0, 5).map(u => (
                                        <div key={u.id} className="w-7 h-7 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-600">
                                            {u.name?.charAt(0)}
                                        </div>
                                    ))}
                                    {(agency.users?.length || 0) > 5 && (
                                        <div className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] text-slate-500">
                                            +{agency.users.length - 5}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* CLIENTS TAB */}
                <TabsContent value="clients">
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-slate-50/30">
                            <div>
                                <CardTitle className="text-lg">Clients</CardTitle>
                                <CardDescription>All clients managed by this agency.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {!clientsData?.clients || clientsData.clients.length === 0 ? (
                                <div className="p-12 text-center text-slate-500">
                                    <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                    <p className="font-medium text-slate-900">No clients yet</p>
                                    <p className="text-sm">This agency hasn't added any clients.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {clientsData.clients.map(client => (
                                        <div
                                            key={client.id}
                                            className="flex items-center justify-between p-6 hover:bg-slate-50 transition-colors cursor-pointer"
                                            onClick={() => navigate(`/admin/clients/${client.id}`)}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 font-bold text-sm">
                                                    {(client.full_name || client.name)?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                                        {client.full_name || client.name}
                                                    </p>
                                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                                        <span>{client.email || 'No email'}</span>
                                                        <span>•</span>
                                                        <span>{client.phone || 'No phone'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-medium text-slate-900">{client.city || 'Unknown Location'}</div>
                                                <div className="text-xs text-slate-500">Added {format(new Date(client.created_at), 'MMM d, yyyy')}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* LEADS TAB */}
                <TabsContent value="leads">
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-slate-50/30">
                            <div>
                                <CardTitle className="text-lg">CRM Leads</CardTitle>
                                <CardDescription>Sales pipeline and potential clients.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {!leadsData?.leads || leadsData.leads.length === 0 ? (
                                <div className="p-12 text-center text-slate-500">
                                    <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                    <p className="font-medium text-slate-900">No leads found</p>
                                    <p className="text-sm">This agency has no active leads.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {leadsData.leads.map(lead => (
                                        <div
                                            key={lead.id}
                                            className="flex items-center justify-between p-6 hover:bg-slate-50 transition-colors cursor-pointer"
                                            onClick={() => navigate(`/admin/crm-leads/${lead.id}`)}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm">
                                                    {(lead.full_name || lead.name)?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{lead.full_name || lead.name}</p>
                                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                                        <span>{lead.destination || 'Unspecified Plan'}</span>
                                                        <span className="capitalize px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100">{lead.status}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-medium text-slate-900">{lead.budget ? `$${lead.budget}` : 'No Budget'}</div>
                                                <div className="text-xs text-slate-500">
                                                    Created {format(new Date(lead.created_at), 'MMM d, yyyy')}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ITINERARIES TAB */}
                <TabsContent value="itineraries">
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-slate-50/30">
                            <div>
                                <CardTitle className="text-lg">Itineraries</CardTitle>
                                <CardDescription>Trip plans created by this agency.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {!itinerariesData?.itineraries || itinerariesData.itineraries.length === 0 ? (
                                <div className="p-12 text-center text-slate-500">
                                    <ScrollText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                    <p className="font-medium text-slate-900">No itineraries found</p>
                                    <p className="text-sm">This agency hasn't created any itineraries yet.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {itinerariesData.itineraries.map(itin => (
                                        <div key={itin.id} className="flex items-center justify-between p-6 hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-sm">
                                                    <Map className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900">{itin.destination || 'Untitled Trip'}</p>
                                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                                        <span>{itin.duration} days</span>
                                                        <span>•</span>
                                                        <span>{itin.client?.full_name || 'No Client'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-medium text-slate-900">
                                                    by {itin.created_by_user?.name || 'Agent'}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    {format(new Date(itin.created_at), 'MMM d, yyyy')}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* INVOICES TAB */}
                <TabsContent value="invoices">
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-slate-50/30">
                            <div>
                                <CardTitle className="text-lg">Invoices</CardTitle>
                                <CardDescription>Billing and payments generated by this agency.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {!invoicesData?.invoices || invoicesData.invoices.length === 0 ? (
                                <div className="p-12 text-center text-slate-500">
                                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                    <p className="font-medium text-slate-900">No invoices found</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {invoicesData.invoices.map(inv => (
                                        <div key={inv.id} className="flex items-center justify-between p-6 hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm">
                                                    <FileText className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900">#{inv.invoice_number}</p>
                                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                                        <span>{inv.client?.full_name || 'No Client'}</span>
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${inv.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                                                            inv.status === 'sent' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                                                            }`}>
                                                            {inv.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-bold text-slate-900">
                                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: inv.currency || 'USD' }).format(inv.total)}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    {format(new Date(inv.created_at), 'MMM d, yyyy')}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* AGENTS TAB */}
                < TabsContent value="agents" >
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-slate-50/30">
                            <div>
                                <CardTitle className="text-lg">Team Management</CardTitle>
                                <CardDescription>Manage users who have access to this agency.</CardDescription>
                            </div>
                            <Dialog open={isAddAgentOpen} onOpenChange={setIsAddAgentOpen}>
                                <DialogTrigger asChild>
                                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"><Plus className="w-4 h-4 mr-2" /> Add Member</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add New Team Member</DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={handleAddAgent} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Full Name</Label>
                                            <Input value={newAgent.name} onChange={e => setNewAgent({ ...newAgent, name: e.target.value })} placeholder="Jane Doe" required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Email</Label>
                                            <Input value={newAgent.email} onChange={e => setNewAgent({ ...newAgent, email: e.target.value })} type="email" placeholder="jane@agency.com" required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Password</Label>
                                            <Input value={newAgent.password} onChange={e => setNewAgent({ ...newAgent, password: e.target.value })} type="password" required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Role</Label>
                                            <Select value={newAgent.role} onValueChange={v => setNewAgent({ ...newAgent, role: v })}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="admin">Admin</SelectItem>
                                                    <SelectItem value="agent">Agent</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <DialogFooter>
                                            <Button type="submit" disabled={addAgentMutation.isPending}>
                                                {addAgentMutation.isPending ? 'Adding...' : 'Add Member'}
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100">
                                {agency.users?.map(user => (
                                    <div key={user.id} className="flex items-center justify-between p-6 hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm">
                                                {user.name?.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-900">{user.name}</p>
                                                <p className="text-sm text-slate-500">{user.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <Badge variant="secondary" className="capitalize bg-slate-100 text-slate-600 font-medium px-3">{user.role}</Badge>
                                            <div className="flex gap-2">
                                                <Button variant="outline" size="sm" className="h-8 text-slate-500 hover:text-indigo-600 border-slate-200" title="Manage Access">
                                                    <Key className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button variant="outline" size="sm" className="h-8 text-slate-500 hover:text-red-600 border-slate-200 hover:bg-red-50 hover:border-red-100" onClick={() => {
                                                    if (confirm("Are you sure you want to remove this user?")) deleteAgentMutation.mutate(user.id);
                                                }}>
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent >

                {/* BILLING TAB */}
                < TabsContent value="billing" >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-2 space-y-6">
                            <Card className="border-slate-200 shadow-sm">
                                <CardHeader>
                                    <CardTitle>Subscription Plan</CardTitle>
                                    <CardDescription>Manage the agency's billing tier and features.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        {['agency_starter', 'agency_plus', 'agency_pro'].map((plan) => (
                                            <div
                                                key={plan}
                                                onClick={() => handlePlanChange(plan)}
                                                className={`cursor-pointer p-4 rounded-xl border-2 transition-all hover:shadow-lg ${agency.subscription_plan === plan
                                                    ? 'border-indigo-600 bg-indigo-50 shadow-md ring-2 ring-indigo-200'
                                                    : 'border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-semibold capitalize text-slate-900">{plan.replace('agency_', '')}</span>
                                                    {agency.subscription_plan === plan && <div className="w-4 h-4 rounded-full bg-indigo-600 animate-pulse" />}
                                                </div>
                                                <div className="text-2xl font-bold text-slate-900">
                                                    {plan === 'agency_starter' ? '$0' : plan === 'agency_plus' ? '$49' : '$99'}
                                                    <span className="text-sm font-medium text-slate-500">/mo</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-slate-200 shadow-sm border-l-4 border-l-amber-500">
                                <CardHeader>
                                    <div className="flex items-center gap-2 text-amber-600 mb-1">
                                        <Shield className="w-5 h-5" />
                                        <span className="font-bold text-sm uppercase tracking-wider">Super Admin Control</span>
                                    </div>
                                    <CardTitle>Account Status</CardTitle>
                                    <CardDescription>Manually override the agency's access status.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-4">
                                        <Select defaultValue={agency.subscription_status} onValueChange={handleStatusChange}>
                                            <SelectTrigger className="w-[200px]">
                                                <SelectValue placeholder="Select Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="active">Active</SelectItem>
                                                <SelectItem value="suspended">Suspended</SelectItem>
                                                <SelectItem value="cancelled">Cancelled</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-sm text-slate-500">
                                            {agency.subscription_status === 'suspended'
                                                ? 'Agency users cannot log in while suspended.'
                                                : 'Agency has full system access.'}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div>
                            <Card className="bg-slate-50 border-slate-200">
                                <CardHeader>
                                    <CardTitle className="text-base">Billing History</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-center py-8 text-slate-400 text-sm">
                                        No invoices generated yet.
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent >
            </Tabs >
        </div >
    );
}
