import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Users, FileText, Calendar, DollarSign, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useNavigate } from 'react-router-dom';

const KpiCard = ({ title, value, trend, icon: Icon, colorClass, onClick, path }) => (
    <Card
        onClick={onClick}
        className={cn(
            "border-slate-200 transition-all duration-200",
            path && "cursor-pointer hover:shadow-md hover:border-blue-200 active:scale-[0.99]"
        )}
    >
        <CardContent className="p-6">
            <div className="flex items-center justify-between space-x-4">
                <div className="flex items-center space-x-2">
                    <div className={cn("p-2 rounded-lg bg-opacity-10", colorClass.bg)}>
                        <Icon className={cn("h-5 w-5", colorClass.text)} />
                    </div>
                    <p className="text-sm font-medium text-slate-500">{title}</p>
                </div>
                {trend !== undefined && trend !== 0 && (
                    <div className={cn("flex items-center text-xs font-medium px-2 py-1 rounded-full",
                        trend > 0 ? "text-emerald-700 bg-emerald-50" : "text-rose-700 bg-rose-50"
                    )}>
                        {trend > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>
            <div className="mt-4">
                <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
                <p className="text-xs text-slate-400 mt-1">vs last month</p>
            </div>
        </CardContent>
    </Card>
);

export default function KPICards({ stats }) {
    const navigate = useNavigate();
    // Safe defaults if stats are loading/missing
    const s = stats || { clients: {}, itineraries: {}, bookings: {}, invoices: {} };

    // Calculate Time Saved (Comprehensive MOAT Metric)
    // Itinerary = 1.5 hours
    // Invoice = 0.5 hours (30 mins)
    // Booking = 0.33 hours (20 mins)
    // Client = 0.25 hours (15 mins)
    // AI Chat = 0.1 hours (6 mins)
    const timeSaved = Math.round(
        ((s.itineraries.total || 0) * 1.5) +
        ((s.invoices.total || 0) * 0.5) +
        ((s.bookings.total || 0) * 0.33) +
        ((s.clients.total || 0) * 0.25) +
        ((s.ai?.total || 0) * 0.1)
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <KpiCard
                title="Time Saved (AI)"
                value={`${timeSaved} Hours`}
                trend={0}
                icon={Clock}
                colorClass={{ bg: 'bg-indigo-100', text: 'text-indigo-600' }}
            />
            <KpiCard
                title="Total Clients"
                value={s.clients.total || 0}
                trend={0}
                icon={Users}
                colorClass={{ bg: 'bg-blue-100', text: 'text-blue-600' }}
                path="/clients"
                onClick={() => navigate('/clients')}
            />
            <KpiCard
                title="Active Itineraries"
                value={s.itineraries.total || 0}
                trend={0}
                icon={FileText}
                colorClass={{ bg: 'bg-purple-100', text: 'text-purple-600' }}
                path="/itineraries"
                onClick={() => navigate('/itineraries')}
            />
            <KpiCard
                title="Pending Bookings"
                value={s.bookings.pending || 0}
                trend={0}
                icon={Calendar}
                colorClass={{ bg: 'bg-orange-100', text: 'text-orange-600' }}
                path="/bookings"
                onClick={() => navigate('/bookings')}
            />
            <KpiCard
                title="Revenue (YTD)"
                value={`$${(s.revenue?.total || 0).toLocaleString()}`}
                trend={0}
                icon={DollarSign}
                colorClass={{ bg: 'bg-emerald-100', text: 'text-emerald-600' }}
                path="/finance"
                onClick={() => navigate('/finance')}
            />
        </div>
    );
}
