// client/src/pages/Dashboard.jsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

import DashboardHeader from '../components/dashboard/DashboardHeader';
import KPICards from '../components/dashboard/KPICards';
import RevenueChart from '../components/dashboard/RevenueChart';

import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { ArrowRight, MapPin, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import CreateClientDialog from '../components/crm/CreateClientDialog';
import RedeemCouponDialog from '../components/dashboard/RedeemCouponDialog';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    clients: { total: 0, active: 0 },
    itineraries: { total: 0, draft: 0, confirmed: 0 },
    revenue: { total: 0 },
    bookings: { total: 0, pending: 0 },
    invoices: { total: 0, pending: 0 },
    ai: { total: 0 }
  });

  const [recentClients, setRecentClients] = useState([]);
  const [recentItineraries, setRecentItineraries] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [loading, setLoading] = useState(true);

  // State for Create Lead Dialog
  const [showCreateLead, setShowCreateLead] = useState(false);
  const [showRedeem, setShowRedeem] = useState(false);
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [clientsRes, itinerariesRes, clientStatsRes, bookingsRes, invoicesRes, settingsRes] = await Promise.all([
        api.get('/clients'),
        api.get('/itineraries?limit=100'), // Fetch more to get accurate count
        api.get('/clients/stats'),
        api.entities.Booking.list(),
        api.entities.Invoice.list(),
        api.get('/settings') // Fetch agency settings to get credits
      ]);

      const s = clientStatsRes.data.stats || {};
      const allItineraries = itinerariesRes.data.itineraries || [];
      const bookings = bookingsRes || [];
      const invoices = invoicesRes || [];
      const agency = settingsRes.data.agency || {};

      setCredits(agency.itinerary_credits !== undefined ? agency.itinerary_credits : 0);

      setRecentClients(clientsRes.data.clients?.slice(0, 5) || []);
      setRecentItineraries(allItineraries.slice(0, 5) || []);

      // Aggregate revenue by month for the chart
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const currentMonthIndex = new Date().getMonth();
      const last6Months = [];

      // Initialize last 6 months
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        const targetMonth = currentMonthIndex - i;
        d.setMonth(targetMonth);
        // Handle year-crossing (e.g., Dec -> Jan of previous year)
        if (targetMonth < 0) {
          d.setFullYear(d.getFullYear() - 1);
        }
        last6Months.push({
          name: months[d.getMonth()],
          fullName: format(d, 'MMMM yyyy'),
          revenue: 0,
          monthIndex: d.getMonth(),
          year: d.getFullYear()
        });
      }

      // Sum up paid invoices
      invoices.forEach(inv => {
        if (inv.status === 'paid' && inv.due_date) {
          const d = new Date(inv.due_date);
          const match = last6Months.find(m => m.monthIndex === d.getMonth() && m.year === d.getFullYear());
          if (match) {
            match.revenue += (Number(inv.total) || 0);
          }
        }
      });

      setRevenueData(last6Months);

      // Filter "Active" Itineraries (Confirmed or In Progress)
      const activeItinerariesCount = allItineraries.filter(it =>
        ['confirmed', 'published', 'in-progress'].includes(it.status?.toLowerCase())
      ).length;

      setStats({
        clients: {
          total: s.clients?.total || 0,
          active: s.clients?.active || 0,
        },
        ai: {
          total: s.ai?.total || 0,
        },
        itineraries: {
          total: activeItinerariesCount || allItineraries.length, // Fallback to total if 0 active
        },
        revenue: {
          total: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.total || 0), 0),
        },
        bookings: {
          total: bookings.length,
          pending: bookings.filter(b => b.booking_status === 'pending').length
        },
        invoices: {
          total: invoices.length,
          pending: invoices.filter(i => i.status !== 'paid').length
        }
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-20 w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-8 bg-slate-50/50 min-h-screen">

      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <DashboardHeader stats={stats} revenueData={revenueData} />
        <div className="flex items-center gap-3">
          <div className="bg-white px-3 py-1.5 rounded-md border border-slate-200 shadow-sm flex items-center gap-2">
            <span className="text-sm font-medium text-slate-500">Credits:</span>
            <span className={cn("text-sm font-bold", credits > 0 ? "text-indigo-600" : "text-red-500")}>
              {credits}
            </span>
            <Button variant="ghost" size="xs" onClick={() => setShowRedeem(true)} className="h-6 text-xs text-indigo-600 hover:text-indigo-700">
              Top Up
            </Button>
          </div>
          <Button
            onClick={() => setShowCreateLead(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:shadow-lg transition-all"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            Smart Sync (AI)
          </Button>
        </div>
      </div>

      {/* 2. Dashboard KPIs & Content */}
      <KPICards stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* 4. Revenue Chart (Main Feature) */}
        <RevenueChart data={revenueData} />

        {/* 5. Recent Activity / Clients Feed */}
        <Card className="col-span-1 border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-semibold text-slate-800">
              New Clients
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-xs text-blue-600 hover:text-blue-700 h-8" onClick={() => navigate('/clients')}>
              View All
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50">
              {recentClients.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  No clients yet.
                </div>
              ) : (
                recentClients.map(client => (
                  <div key={client.id} className="flex items-center p-4 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => navigate(`/clients/${client.id}`)}>
                    <Avatar className="h-9 w-9 border border-slate-100 mr-3">
                      <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${client.name}`} />
                      <AvatarFallback className="bg-blue-50 text-blue-600 text-xs">
                        {client.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {client.name}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {client.email}
                      </p>
                    </div>
                    <div className="text-xs text-slate-400">
                      Just now
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 5. Recent Itineraries Table */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
          <CardTitle className="text-base font-semibold text-slate-800">
            Recent Trips
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-xs text-blue-600 hover:text-blue-700 h-8" onClick={() => navigate('/itineraries')}>
            View All Trips <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {recentItineraries.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mb-3">
                <MapPin className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="text-sm font-medium text-slate-900">No itineraries yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Create your first trip to see it here.
              </p>
              <Button size="sm" className="mt-4 bg-slate-900" onClick={() => navigate('/itineraries')}>
                Create Trip
              </Button>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-medium">
                <tr>
                  <th className="px-4 py-3">Destination</th>
                  <th className="px-4 py-3">Dates</th>
                  <th className="px-4 py-3">Travelers</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Budget</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentItineraries.map((itinerary) => (
                  <tr key={itinerary.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer group" onClick={() => navigate('/itineraries')}>
                    <td className="px-4 py-3 font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                      {itinerary.destination}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                        {itinerary.startDate ? format(new Date(itinerary.startDate), 'MMM d') : 'TBD'}
                        <span className="text-slate-300">-</span>
                        {itinerary.duration} days
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {itinerary.travelers || 2} People
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className={cn(
                        "font-normal",
                        itinerary.status === 'confirmed' ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" :
                          "bg-amber-50 text-amber-700 hover:bg-amber-100"
                      )}>
                        {itinerary.status || 'Draft'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-700">
                      ${(itinerary.budget || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateClientDialog
        open={showCreateLead}
        onClose={() => setShowCreateLead(false)}
        onSuccess={fetchDashboardData}
      />
      <RedeemCouponDialog
        open={showRedeem}
        onClose={() => setShowRedeem(false)}
        onSuccess={(newCreds) => setCredits(newCreds)}
      />

    </div >
  );
}
