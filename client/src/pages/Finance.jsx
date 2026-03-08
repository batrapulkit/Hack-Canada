import React from "react";
import api from "@/api/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Receipt,
  CreditCard
} from "lucide-react";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import RevenueChart from "@/components/dashboard/RevenueChart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InvoiceList from "../components/crm/InvoiceList";
import CreateInvoiceDialog from "../components/crm/CreateInvoiceDialog";
import ImportInvoiceDialog from "../components/crm/ImportInvoiceDialog";
import InvoiceTemplateSelector from "../components/crm/InvoiceTemplateSelector";
import { Button } from "@/components/ui/button";
import { Plus, Upload } from "lucide-react";
import { useState } from "react";

export default function TriponicFinance() {
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [showImportInvoice, setShowImportInvoice] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => api.entities.Booking.list(),
    initialData: [],
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => api.entities.Invoice.list(),
    initialData: [],
  });

  const stats = {
    totalRevenue: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (Number(i.total) || 0), 0),
    // Dynamic commission calculation (Profit = Sell Price - Cost)
    totalCommission: bookings.reduce((sum, b) => {
      const profit = (Number(b.sell_price) || 0) - (Number(b.cost) || 0);
      return sum + (profit > 0 ? profit : 0);
    }, 0),
    pendingPayments: invoices.filter(i => i.status === 'pending' || i.status === 'draft').reduce((sum, i) => sum + (Number(i.total) || 0), 0) || 0,
  };

  // Calculate real monthly revenue for the last 6 months
  const chartData = React.useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push({
        name: d.toLocaleString('default', { month: 'short' }),
        monthKey: `${d.getFullYear()}-${d.getMonth()}`, // helper for matching
        revenue: 0
      });
    }

    invoices.forEach(inv => {
      if (inv.status === 'paid' && inv.created_at) {
        const d = new Date(inv.created_at);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        const match = months.find(m => m.monthKey === key);
        if (match) {
          match.revenue += (parseFloat(inv.total) || 0);
        }
      }
    });

    return months;
  }, [invoices]);

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
            Finance Dashboard
          </h1>
          <p className="text-slate-600">
            Track revenue, expenses, and manage invoices
          </p>
        </motion.div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setShowImportInvoice(true)} className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Import Invoice
          </Button>
          <Button onClick={() => setShowTemplateSelector(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Invoice
          </Button>
        </div>
      </div>

      <InvoiceTemplateSelector
        open={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
        onSelectTemplate={(template) => {
          setSelectedTemplate(template);
          setShowTemplateSelector(false);
          setShowCreateInvoice(true);
        }}
      />

      <CreateInvoiceDialog
        open={showCreateInvoice}
        onClose={() => {
          setShowCreateInvoice(false);
          setSelectedTemplate(null);
        }}
        templateData={selectedTemplate}
      />

      <ImportInvoiceDialog
        open={showImportInvoice}
        onClose={() => setShowImportInvoice(false)}
        onSuccess={() => {
          // Refresh invoice list
          window.location.reload();
        }}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-slate-200/60 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-sm text-slate-500 mb-1">Total Revenue (Paid Invoices)</p>
            <p className="text-3xl font-bold text-slate-900">${stats.totalRevenue.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/60 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
                <Receipt className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-sm text-slate-500 mb-1">Commission Earned</p>
            <p className="text-3xl font-bold text-slate-900">${stats.totalCommission.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/60 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <TrendingDown className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-sm text-slate-500 mb-1">Pending Payments</p>
            <p className="text-3xl font-bold text-slate-900">${stats.pendingPayments.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <RevenueChart data={chartData} />
      </div>

      <Tabs defaultValue="invoices" className="space-y-6">
        <TabsList className="bg-white border border-slate-200 p-1">
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices">
          <InvoiceList />
        </TabsContent>

        <TabsContent value="reports">
          <Card className="border-slate-200/60 shadow-lg">
            <CardHeader className="border-b border-slate-100">
              <CardTitle>Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRevenueTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    formatter={(value) => [`$${value.toLocaleString()}`, "Revenue"]}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fill="url(#colorRevenueTrend)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}