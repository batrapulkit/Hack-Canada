import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function UsageChart({ usageLogs, isLoading }) {
  if (isLoading) {
    return (
      <Card className="border-slate-200/60 shadow-lg">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Group usage by day
  const chartData = usageLogs.reduce((acc, log) => {
    const date = new Date(log.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const existing = acc.find(item => item.date === date);
    if (existing) {
      existing.requests += 1;
      existing.credits += log.credits_used || 1;
    } else {
      acc.push({
        date,
        requests: 1,
        credits: log.credits_used || 1
      });
    }
    return acc;
  }, []).slice(-7);

  return (
    <Card className="border-slate-200/60 shadow-lg overflow-hidden">
      <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-slate-900">API Usage Overview</CardTitle>
            <p className="text-sm text-slate-500 mt-1">Last 7 days activity</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-lg">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-semibold text-indigo-900">+12.5%</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorCredits" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="date" 
              stroke="#94a3b8"
              style={{ fontSize: '12px', fontWeight: 500 }}
            />
            <YAxis 
              stroke="#94a3b8"
              style={{ fontSize: '12px', fontWeight: 500 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
              }}
            />
            <Area 
              type="monotone" 
              dataKey="requests" 
              stroke="#6366f1" 
              strokeWidth={3}
              fill="url(#colorRequests)"
              name="Requests"
            />
            <Area 
              type="monotone" 
              dataKey="credits" 
              stroke="#06b6d4" 
              strokeWidth={3}
              fill="url(#colorCredits)"
              name="Credits"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}