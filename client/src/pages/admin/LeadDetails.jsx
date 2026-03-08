import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/client';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Mail, Phone, MapPin, DollarSign, Calendar, Users, Briefcase, Globe } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminLeadDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const { data, isLoading, error } = useQuery({
        queryKey: ['adminLead', id],
        queryFn: async () => {
            const res = await api.get(`/admin/crm-leads/${id}`);
            return res.data;
        }
    });

    if (isLoading) return <div className="p-8 text-center text-slate-500 flex flex-col items-center"><div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-indigo-600 animate-spin mb-4" />Loading lead details...</div>;
    if (error || !data?.lead) return <div className="p-8 text-center text-red-500">Lead not found</div>;

    const { lead } = data;

    const getInitials = (name) => name?.substring(0, 2).toUpperCase() || 'LD';
    const stringToColor = (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) { hash = str.charCodeAt(i) + ((hash << 5) - hash); }
        const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
        return '#' + '00000'.substring(0, 6 - c.length) + c;
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <Button variant="ghost" className="mb-4 -ml-2 text-slate-500 hover:text-slate-900" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
            </Button>

            {/* Profile Header */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center md:items-start gap-8">
                <div
                    className="w-24 h-24 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-md ring-4 ring-slate-50"
                    style={{ background: `linear-gradient(135deg, ${stringToColor(lead.full_name || 'Lead')} 0%, ${stringToColor(lead.email || 'Lead')} 100%)` }}
                >
                    {getInitials(lead.full_name)}
                </div>
                <div className="flex-1 text-center md:text-left space-y-2">
                    <div className="flex flex-col md:flex-row items-center gap-3">
                        <h1 className="text-3xl font-bold text-slate-900">{lead.full_name}</h1>
                        <Badge className={`capitalize ${lead.status === 'won' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' :
                                lead.status === 'lost' ? 'bg-red-100 text-red-700 hover:bg-red-200' :
                                    'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            }`}>
                            {lead.status}
                        </Badge>
                    </div>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-slate-500">
                        {lead.email && (
                            <div className="flex items-center gap-1.5">
                                <Mail className="w-4 h-4" />
                                {lead.email}
                            </div>
                        )}
                        {lead.phone && (
                            <div className="flex items-center gap-1.5">
                                <Phone className="w-4 h-4" />
                                {lead.phone}
                            </div>
                        )}
                        <div className="flex items-center gap-1.5">
                            <Briefcase className="w-4 h-4" />
                            Source: {lead.source || 'Unknown'}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Trip Details */}
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Globe className="w-5 h-5 text-indigo-500" />
                            Trip Requirements
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-3 rounded-lg">
                                <span className="text-xs font-semibold text-slate-400 uppercase">Destination</span>
                                <div className="text-slate-900 font-medium flex items-center gap-2 mt-1">
                                    <MapPin className="w-4 h-4 text-slate-400" />
                                    {lead.destination || 'Not specified'}
                                </div>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-lg">
                                <span className="text-xs font-semibold text-slate-400 uppercase">Budget</span>
                                <div className="text-slate-900 font-medium flex items-center gap-2 mt-1">
                                    <DollarSign className="w-4 h-4 text-slate-400" />
                                    {lead.budget ? `$${lead.budget}` : 'Not specified'}
                                </div>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-lg">
                                <span className="text-xs font-semibold text-slate-400 uppercase">Dates</span>
                                <div className="text-slate-900 font-medium flex items-center gap-2 mt-1">
                                    <Calendar className="w-4 h-4 text-slate-400" />
                                    {lead.travel_dates || 'Flexible'}
                                </div>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-lg">
                                <span className="text-xs font-semibold text-slate-400 uppercase">Travelers</span>
                                <div className="text-slate-900 font-medium flex items-center gap-2 mt-1">
                                    <Users className="w-4 h-4 text-slate-400" />
                                    {lead.travelers || 'Not specified'}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Additional Info */}
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-purple-500" />
                            Additional Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <span className="text-xs font-semibold text-slate-400 uppercase block mb-2">Interests</span>
                            <div className="flex flex-wrap gap-2">
                                {lead.interests && lead.interests.length > 0 ? (
                                    lead.interests.map((interest, i) => (
                                        <Badge key={i} variant="secondary" className="bg-slate-100 text-slate-600">
                                            {interest}
                                        </Badge>
                                    ))
                                ) : (
                                    <span className="text-sm text-slate-400 italic">No interests logged</span>
                                )}
                            </div>
                        </div>
                        <div>
                            <span className="text-xs font-semibold text-slate-400 uppercase block mb-2">Notes</span>
                            <div className="bg-amber-50 border border-amber-100 p-4 rounded-lg text-sm text-slate-700 whitespace-pre-wrap">
                                {lead.notes || 'No additional notes provided.'}
                            </div>
                        </div>
                        <div className="text-xs text-slate-400 text-right pt-4 border-t border-slate-100">
                            Created: {format(new Date(lead.created_at), 'PPP pp')}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
