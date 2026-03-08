import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    CheckCircle2,
    Circle,
    FileText,
    CreditCard,
    Send,
    Plane,
    AlertCircle
} from 'lucide-react';
import { supabase } from '@/config/supabase';

const WorkflowTimeline = ({ leadId, agencyId }) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    // Poll or Subscription for real-time updates
    useEffect(() => {
        fetchEvents();

        const subscription = supabase
            .channel('workflow_events')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'workflow_events',
                filter: `lead_id=eq.${leadId}`
            }, (payload) => {
                setEvents(prev => [payload.new, ...prev]);
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [leadId]);

    const fetchEvents = async () => {
        try {
            const { data, error } = await supabase
                .from('workflow_events')
                .select('*')
                .eq('lead_id', leadId)
                .order('created_at', { ascending: false }); // Newest first

            if (error) throw error;
            setEvents(data || []);
        } catch (err) {
            console.error('Failed to fetch events:', err);
        } finally {
            setLoading(false);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'LEAD_QUALIFIED': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
            case 'ITINERARY_CREATED': return <Plane className="h-5 w-5 text-blue-500" />;
            case 'QUOTE_CREATED': return <FileText className="h-5 w-5 text-purple-500" />;
            case 'QUOTE_SENT': return <Send className="h-5 w-5 text-orange-500" />;
            case 'INVOICE_SENT': return <CreditCard className="h-5 w-5 text-yellow-500" />;
            case 'INVOICE_PAID': return <CheckCircle2 className="h-5 w-5 text-green-600" />;
            default: return <Circle className="h-4 w-4 text-gray-400" />;
        }
    };

    if (loading) return <div className="p-4 text-center text-sm text-gray-500">Loading timeline...</div>;

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="text-lg">Workflow Timeline</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <ScrollArea className="h-[400px] px-6 pb-6">
                    <div className="relative border-l border-gray-200 ml-3 space-y-8">
                        {events.length === 0 ? (
                            <div className="ml-6 py-4 text-sm text-gray-500">No events recorded yet.</div>
                        ) : (
                            events.map((event) => (
                                <div key={event.id} className="relative ml-6">
                                    {/* Icon */}
                                    <span className="absolute -left-[37px] top-1 bg-white p-1">
                                        {getIcon(event.event_type)}
                                    </span>

                                    {/* Content */}
                                    <div className="flex flex-col space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-sm text-gray-900">
                                                {event.event_type.replace(/_/g, ' ')}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {new Date(event.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600">{event.message}</p>
                                        {event.metadata && Object.keys(event.metadata).length > 0 && (
                                            <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-x-auto">
                                                {JSON.stringify(event.metadata, null, 2)}
                                            </pre>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
};

export default WorkflowTimeline;
