import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/client';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity as ActivityIcon, UserPlus, Map, Calendar, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';

export default function Activity() {
    const { data, isLoading, error } = useQuery({
        queryKey: ['adminActivity'],
        queryFn: async () => {
            const res = await api.get('/admin/activity');
            return res.data;
        }
    });

    const getIcon = (type) => {
        switch (type) {
            case 'new_agency': return <UserPlus className="w-4 h-4 text-emerald-500" />;
            case 'new_itinerary': return <Map className="w-4 h-4 text-blue-500" />;
            default: return <ActivityIcon className="w-4 h-4 text-slate-500" />;
        }
    };

    const getBadgeVariant = (type) => {
        switch (type) {
            case 'new_agency': return 'success';
            case 'new_itinerary': return 'default';
            default: return 'secondary';
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <Link to="/admin/dashboard">
                    <Button variant="ghost" size="sm" className="-ml-2 text-slate-500">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </Button>
                </Link>
                <div className="flex-1">
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">System Activity</h2>
                    <p className="text-slate-500 mt-1">Real-time feed of platform events and actions.</p>
                </div>
            </div>

            <Card className="border-slate-200 shadow-sm">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <ActivityIcon className="w-5 h-5 text-indigo-600" />
                            Recent Events
                        </CardTitle>
                        <Badge variant="outline" className="bg-white">Live Feed</Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <ScrollArea className="h-[600px]">
                        {isLoading ? (
                            <div className="p-8 text-center text-slate-500 flex flex-col items-center">
                                <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-indigo-600 animate-spin mb-4" />
                                Loading activity feed...
                            </div>
                        ) : error ? (
                            <div className="p-8 text-center text-red-500">
                                Failed to load activity feed.
                            </div>
                        ) : data?.activities?.length === 0 ? (
                            <div className="p-12 text-center text-slate-500">
                                No recent activity found.
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {data?.activities?.map((activity, index) => (
                                    <div key={index} className="flex gap-4 p-6 hover:bg-slate-50 transition-colors group">
                                        <div className="flex-shrink-0 mt-1">
                                            <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm group-hover:border-indigo-200 transition-colors">
                                                {getIcon(activity.type)}
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="text-sm font-medium text-slate-900 truncate">
                                                    {activity.title}
                                                </p>
                                                <span className="text-xs text-slate-400 whitespace-nowrap ml-4 flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {formatDistanceToNow(new Date(activity.date), { addSuffix: true })}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-500 truncate">
                                                {activity.subtitle}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}
