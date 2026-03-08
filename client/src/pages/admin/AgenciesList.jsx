import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '@/api/client';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, MoreHorizontal, Building2, Trash2, Edit, AlertCircle, Users } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function AgenciesList() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const { data: agenciesData, isLoading } = useQuery({
        queryKey: ['adminAgencies'],
        queryFn: async () => {
            const res = await api.get('/admin/agencies');
            return res.data;
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            await api.delete(`/admin/agencies/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['adminAgencies']);
            toast.success("Agency deleted successfully");
        },
        onError: (err) => {
            toast.error("Failed to delete agency: " + err.message);
        }
    });

    const handleDelete = (e, id) => {
        e.stopPropagation();
        if (confirm("Are you sure you want to delete this agency? This action cannot be undone.")) {
            deleteMutation.mutate(id);
        }
    };

    const agencies = agenciesData?.agencies || [];

    const filteredAgencies = agencies.filter(agency => {
        const matchesSearch = agency.agency_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            agency.contact_email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || agency.subscription_status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const stringToColor = (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
        return '#' + '00000'.substring(0, 6 - c.length) + c;
    };

    const getInitials = (name) => name?.substring(0, 2).toUpperCase() || 'AG';

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Agencies</h2>
                    <p className="text-slate-500 mt-1">Manage your B2B partnerships and subscriptions.</p>
                </div>
                <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md">
                    <Building2 className="w-4 h-4 mr-2" />
                    Add New Agency
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <div className="md:col-span-4 bg-white p-1 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Search agencies..."
                            className="pl-10 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`h-7 px-3 rounded-md transition-all ${statusFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                            onClick={() => setStatusFilter('all')}
                        >
                            All
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`h-7 px-3 rounded-md transition-all ${statusFilter === 'active' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                            onClick={() => setStatusFilter('active')}
                        >
                            Active
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`h-7 px-3 rounded-md transition-all ${statusFilter === 'suspended' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                            onClick={() => setStatusFilter('suspended')}
                        >
                            Suspended
                        </Button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50 border-b border-slate-200">
                        <TableRow>
                            <TableHead className="pl-6 w-[350px]">Agency</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Plan</TableHead>
                            <TableHead>Users</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead className="text-right pr-6">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-48 text-center text-slate-500">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                                        <p>Loading agencies...</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredAgencies.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-48 text-center">
                                    <div className="flex flex-col items-center justify-center gap-1">
                                        <div className="p-3 bg-slate-100 rounded-full mb-2">
                                            <Building2 className="w-6 h-6 text-slate-400" />
                                        </div>
                                        <p className="font-medium text-slate-900">No agencies found</p>
                                        <p className="text-sm text-slate-500">Try adjusting your filters or search terms.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredAgencies.map((agency) => (
                                <TableRow
                                    key={agency.id}
                                    className="hover:bg-slate-50 cursor-pointer transition-colors group"
                                    onClick={() => navigate(`/admin/agencies/${agency.id}`)}
                                >
                                    <TableCell className="pl-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-sm ring-2 ring-white"
                                                style={{ background: `linear-gradient(135deg, ${stringToColor(agency.agency_name)} 0%, ${stringToColor(agency.contact_email || '')} 100%)` }}
                                            >
                                                {getInitials(agency.agency_name)}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                                    {agency.agency_name}
                                                </div>
                                                <div className="text-xs text-slate-500 font-medium">
                                                    {agency.contact_email}
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${agency.subscription_status === 'active'
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                            : agency.subscription_status === 'suspended'
                                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                : 'bg-slate-100 text-slate-600 border-slate-200'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${agency.subscription_status === 'active' ? 'bg-emerald-500' :
                                                agency.subscription_status === 'suspended' ? 'bg-amber-500' : 'bg-slate-400'
                                                }`} />
                                            <span className="capitalize">{agency.subscription_status || 'Inactive'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={`font-normal capitalize ${agency.subscription_plan === 'agency_pro' ? 'border-indigo-200 bg-indigo-50 text-indigo-700' :
                                            agency.subscription_plan === 'agency_plus' ? 'border-sky-200 bg-sky-50 text-sky-700' :
                                                'border-slate-200 text-slate-600'
                                            }`}>
                                            {agency.subscription_plan?.replace('agency_', '') || 'Free'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center text-slate-600 text-sm">
                                            <Users className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                                            {agency.users ? (Array.isArray(agency.users) ? agency.users.length : agency.users.count) : 0}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm text-slate-500">
                                            {format(new Date(agency.created_at), 'MMM d, yyyy')}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/admin/agencies/${agency.id}`); }}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    View Details
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50" onClick={(e) => handleDelete(e, agency.id)}>
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete Agency
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
