import React, { useState } from "react";
import api from "@/api/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  Download, 
  TrendingUp, 
  Users, 
  Globe,
  Clock
} from "lucide-react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#6366f1', '#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b'];

export default function Analytics() {
  const { data: usageLogs = [] } = useQuery({
    queryKey: ['usageLogs'],
    queryFn: () => api.entities.UsageLog.list('-created_date', 100),
    initialData: [],
  });

  // Endpoint usage data
  const endpointData = usageLogs.reduce((acc, log) => {
    const endpoint = log.endpoint || 'unknown';
    const existing = acc.find(item => item.name === endpoint);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: endpoint, value: 1 });
    }
    return acc;
  }, []).slice(0, 5);

  // Daily usage data
  const dailyData = usageLogs.reduce((acc, log) => {
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
  }, []).slice(-14);

  const exportData = () => {
    const csv = [
      ['Date', 'Endpoint', 'Method', 'Status', 'Response Time', 'Credits'],
      ...usageLogs.map(log => [
        new Date(log.created_date).toLocaleString(),
        log.endpoint,
        log.method,
        log.status_code,
        log.response_time,
        log.credits_used
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'triponic-analytics.csv';
    link.click();
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              Analytics & Insights
            </h1>
            <p className="text-slate-600">
              Deep dive into your API usage and performance metrics
            </p>
          </div>
          <Button
            onClick={exportData}
            className="bg-gradient-to-r from-indigo-600 to-cyan-500"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-slate-200/60 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
              </div>
              <span className="text-sm font-medium text-slate-500">Total Requests</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{usageLogs.length.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/60 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-cyan-100 rounded-lg">
                <Users className="w-5 h-5 text-cyan-600" />
              </div>
              <span className="text-sm font-medium text-slate-500">Success Rate</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">98.5%</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/60 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Globe className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-slate-500">Endpoints Used</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{endpointData.length}</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/60 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-pink-100 rounded-lg">
                <Clock className="w-5 h-5 text-pink-600" />
              </div>
              <span className="text-sm font-medium text-slate-500">Avg Latency</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">156ms</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-slate-200/60 shadow-lg">
          <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
            <CardTitle className="text-xl font-bold text-slate-900">Usage Trends</CardTitle>
            <p className="text-sm text-slate-500">Last 14 days</p>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="date" 
                  stroke="#94a3b8"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#94a3b8"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
                  }}
                />
                <Bar dataKey="requests" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-slate-200/60 shadow-lg">
          <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
            <CardTitle className="text-xl font-bold text-slate-900">Endpoint Distribution</CardTitle>
            <p className="text-sm text-slate-500">Most popular APIs</p>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={endpointData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {endpointData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}