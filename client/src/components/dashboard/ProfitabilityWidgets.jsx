import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, DollarSign, TrendingUp, Briefcase } from 'lucide-react';
import { fetchProfitability } from '@/api/workflow';

const ProfitabilityWidgets = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const res = await fetchProfitability();
            console.log("Profitability API Response:", res);
            if (res.success) {
                setStats(res.stats);
            } else {
                setError(res.error || 'Failed to fetch data');
            }
        } catch (err) {
            console.error('Failed to load profitability:', err);
            setError(err.message || 'API Connection Error');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-4">Loading analytics...</div>;
    if (error) return (
        <div className="p-4 mb-8 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <h3 className="font-bold">Analytics Unavailable</h3>
            <p>Error: {error}</p>
        </div>
    );
    if (!stats) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">${stats.totalRevenue?.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                        Based on paid invoices
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Gross Profit</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-600">${stats.grossProfit?.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                        {stats.margin} margin
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

export default ProfitabilityWidgets;
