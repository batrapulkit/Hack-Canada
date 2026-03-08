import React from "react";
import api from "@/api/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  TrendingUp, 
  Users, 
  Map, 
  DollarSign,
  Plane,
  CheckCircle2,
  Clock,
  AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function TriponicDashboard() {
  const { data: leads = [] } = useQuery({
    queryKey: ['leads'],
    queryFn: () => api.entities.Lead.list('-created_date', 50),
    initialData: [],
  });

  const { data: itineraries = [] } = useQuery({
    queryKey: ['itineraries'],
    queryFn: () => api.entities.Itinerary.list('-created_date', 50),
    initialData: [],
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => api.entities.Booking.list('-created_date', 50),
    initialData: [],
  });

  const { data: quotes = [] } = useQuery({
    queryKey: ['quotes'],
    queryFn: () => api.entities.Quote.list('-created_date', 50),
    initialData: [],
  });

  const stats = {
    newLeads: leads.filter(l => l.status === 'new').length,
    activeItineraries: itineraries.filter(i => i.status === 'draft' || i.status === 'sent').length,
    confirmedBookings: bookings.filter(b => b.status === 'confirmed').length,
    revenue: bookings.filter(b => b.payment_status === 'paid').reduce((sum, b) => sum + (b.selling_price || 0), 0),
  };

  const recentLeads = leads.slice(0, 5);
  const urgentTasks = [
    { title: "Follow up with John Doe - Dubai Lead", priority: "high", time: "2 hours ago" },
    { title: "Complete Paris itinerary for Sarah", priority: "urgent", time: "4 hours ago" },
    { title: "Confirm hotel booking for Smith family", priority: "medium", time: "1 day ago" },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
          Welcome back! 👋
        </h1>
        <p className="text-slate-600">
          Here's what's happening with your travel business today
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-slate-200/60 shadow-lg hover:shadow-xl transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs text-green-600 font-semibold">+12%</span>
              </div>
              <p className="text-sm text-slate-500 mb-1">New Leads</p>
              <p className="text-3xl font-bold text-slate-900">{stats.newLeads}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-slate-200/60 shadow-lg hover:shadow-xl transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
                  <Map className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs text-blue-600 font-semibold">{stats.activeItineraries} active</span>
              </div>
              <p className="text-sm text-slate-500 mb-1">Itineraries</p>
              <p className="text-3xl font-bold text-slate-900">{itineraries.length}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-slate-200/60 shadow-lg hover:shadow-xl transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl shadow-lg">
                  <Plane className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs text-green-600 font-semibold">+8%</span>
              </div>
              <p className="text-sm text-slate-500 mb-1">Confirmed Bookings</p>
              <p className="text-3xl font-bold text-slate-900">{stats.confirmedBookings}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="border-slate-200/60 shadow-lg hover:shadow-xl transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-lg">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs text-green-600 font-semibold">+15%</span>
              </div>
              <p className="text-sm text-slate-500 mb-1">Revenue (MTD)</p>
              <p className="text-3xl font-bold text-slate-900">${stats.revenue.toLocaleString()}</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="border-slate-200/60 shadow-lg">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-xl font-bold">Revenue Trend</CardTitle>
              <p className="text-sm text-slate-500">Last 7 days performance</p>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={[
                  { day: 'Mon', revenue: 4200 },
                  { day: 'Tue', revenue: 5100 },
                  { day: 'Wed', revenue: 4800 },
                  { day: 'Thu', revenue: 6200 },
                  { day: 'Fri', revenue: 7100 },
                  { day: 'Sat', revenue: 5900 },
                  { day: 'Sun', revenue: 6800 },
                ]}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="day" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={3} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="border-slate-200/60 shadow-lg">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-xl font-bold">Urgent Tasks</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {urgentTasks.map((task, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className={`mt-1 p-1.5 rounded-lg ${
                      task.priority === 'urgent' ? 'bg-red-100' :
                      task.priority === 'high' ? 'bg-orange-100' : 'bg-blue-100'
                    }`}>
                      {task.priority === 'urgent' ? (
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      ) : (
                        <Clock className="w-4 h-4 text-orange-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">{task.title}</p>
                      <p className="text-xs text-slate-500 mt-1">{task.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-slate-200/60 shadow-lg">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-xl font-bold">Recent Leads</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {recentLeads.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No leads yet</p>
            ) : (
              recentLeads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {lead.full_name?.charAt(0) || 'L'}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{lead.full_name}</p>
                      <p className="text-sm text-slate-500">
                        {lead.destination || 'No destination'} • {lead.budget ? `$${lead.budget}` : 'No budget'}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    lead.status === 'new' ? 'bg-blue-50 text-blue-700' :
                    lead.status === 'contacted' ? 'bg-purple-50 text-purple-700' :
                    lead.status === 'won' ? 'bg-green-50 text-green-700' :
                    'bg-slate-50 text-slate-700'
                  }`}>
                    {lead.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}