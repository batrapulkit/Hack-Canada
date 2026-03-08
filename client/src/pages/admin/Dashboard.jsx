import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/client';
import StatsCard from '@/components/admin/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from 'date-fns';
import {
    Building2,
    Map,
    Plane,
    Users,
    TrendingUp,
    Activity,
    DollarSign,
    CreditCard
} from 'lucide-react';

export default function AdminDashboard() {
    const { data: statsData, isLoading: statsLoading } = useQuery({
        queryKey: ['adminStats'],
        queryFn: async () => {
            const res = await api.get('/admin/stats');
            return res.data;
        }
    });

    const { data: activityData, isLoading: activityLoading } = useQuery({
        queryKey: ['adminActivity'],
        queryFn: async () => {
            const res = await api.get('/admin/activity');
            return res.data;
        }
    });

    const stats = statsData?.stats || {};
    const activities = activityData?.activities || [];

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h2>
                <p className="text-slate-500">Platform overview and performance metrics.</p>
            </div>

            {/* Revenue & Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                    title="Monthly Revenue (MRR)"
                    value={`$${stats.revenue?.mrr?.toLocaleString() || 0}`}
                    icon={DollarSign}
                    trend="Est."
                    isLoading={statsLoading}
                />
                <StatsCard
                    title="Active Subscriptions"
                    value={stats.revenue?.activeSubscriptions || 0}
                    icon={CreditCard}
                    description="Paid agencies"
                    isLoading={statsLoading}
                />
                <StatsCard
                    title="Total Agencies"
                    value={stats.totalAgencies || 0}
                    icon={Building2}
                    description={`${stats.newAgenciesLast30Days || 0} new in last 30 days`}
                    isLoading={statsLoading}
                />
                <StatsCard
                    title="Total Itineraries"
                    value={stats.totalItineraries || 0}
                    icon={Map}
                    isLoading={statsLoading}
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Plan Distribution */}
                <Card className="col-span-4 border-slate-200/60 shadow-sm">
                    <CardHeader>
                        <CardTitle>Plan Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {statsLoading ? (
                            <div className="h-[200px] flex items-center justify-center">Loading...</div>
                        ) : (
                            <div className="space-y-4">
                                {Object.entries(stats.revenue?.planBreakdown || {}).map(([plan, count]) => {
                                    // Calculate percentage
                                    const total = stats.totalAgencies || 1;
                                    const percentage = Math.round((count / total) * 100);

                                    // Readable labels
                                    const labels = {
                                        'agency_starter': 'Starter (Free)',
                                        'agency_plus': 'Plus ($49)',
                                        'agency_pro': 'Pro ($99)'
                                    };

                                    return (
                                        <div key={plan} className="space-y-1">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="font-medium text-slate-700">{labels[plan] || plan}</span>
                                                <span className="text-slate-500">{count} active ({percentage}%)</span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${plan === 'agency_pro' ? 'bg-indigo-600' : plan === 'agency_plus' ? 'bg-blue-500' : 'bg-slate-300'}`}
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}

                                {Object.keys(stats.revenue?.planBreakdown || {}).length === 0 && (
                                    <div className="text-center text-slate-500 py-10">No plan data available</div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Activity Feed */}
                <Card className="col-span-3 border-slate-200/60 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-indigo-600" />
                            Live Activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {activityLoading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => <div key={i} className="h-12 bg-slate-100 rounded animate-pulse" />)}
                            </div>
                        ) : activities.length === 0 ? (
                            <p className="text-slate-500 text-center py-8">No recent activity.</p>
                        ) : (
                            <div className="space-y-6">
                                {activities.map((activity, i) => (
                                    <div key={i} className="flex items-start gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                                        <div className={`mt-1 p-2 rounded-full ring-4 ring-white ${activity.type === 'new_agency' ? 'bg-indigo-100 text-indigo-600' : 'bg-pink-100 text-pink-600'
                                            }`}>
                                            {activity.type === 'new_agency' ? <Building2 className="w-4 h-4" /> : <Map className="w-4 h-4" />}
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium leading-none text-slate-900">{activity.title}</p>
                                            <p className="text-xs text-slate-500">{activity.subtitle}</p>
                                            <p className="text-xs text-slate-400">
                                                {formatDistanceToNow(new Date(activity.date), { addSuffix: true })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
