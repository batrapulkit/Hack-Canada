import React, { useState, useEffect } from "react";
import api from "../api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  Check,
  Zap,
  Download,
  TrendingUp,
  Calendar
} from "lucide-react";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";

const plans = [
  {
    name: "Starter",
    price: "$199",
    period: "/month",
    credits: "10,000 AI credits",
    features: [
      "Basic API access",
      "Standard support",
      "1 team member",
      "Sandbox environment"
    ],
    current: false
  },
  {
    name: "Growth",
    price: "$499",
    period: "/month",
    credits: "50,000 AI credits",
    features: [
      "Full API access",
      "Priority support",
      "5 team members",
      "Production environment",
      "Advanced analytics"
    ],
    current: false
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    credits: "Unlimited credits",
    features: [
      "Unlimited API access",
      "24/7 dedicated support",
      "Unlimited team members",
      "Custom integrations",
      "Advanced analytics",
      "SLA guarantee"
    ],
    current: true
  }
];

export default function Billing() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await api.get('/invoices');
      if (response.data.success) {
        const formatted = response.data.invoices.map(inv => ({
          id: inv.invoice_number,
          date: new Date(inv.created_at).toLocaleDateString(),
          amount: `$${inv.amount}`,
          status: inv.status
        }));
        setInvoices(formatted);
      }
    } catch (error) {
      console.error("Failed to fetch invoices:", error);
    } finally {
      setLoading(false);
    }
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
              <div className="p-2 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl">
                <CreditCard className="w-8 h-8 text-white" />
              </div>
              Billing & Subscription
            </h1>
            <p className="text-slate-600">
              Manage your plan, credits, and payment methods
            </p>
          </div>
        </div>
      </motion.div>

      {/* Current Usage */}
      <Card className="border-slate-200/60 shadow-lg bg-gradient-to-br from-indigo-50 to-purple-50">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-indigo-600" />
                <span className="text-sm font-medium text-slate-600">AI Credits Remaining</span>
              </div>
              <p className="text-3xl font-bold text-slate-900 mb-2">5,247</p>
              <Progress value={52} className="h-2" />
              <p className="text-xs text-slate-500 mt-2">52% of monthly allocation</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-cyan-600" />
                <span className="text-sm font-medium text-slate-600">Credits Used</span>
              </div>
              <p className="text-3xl font-bold text-slate-900">4,753</p>
              <p className="text-xs text-green-600 mt-2">↑ 12% from last month</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-slate-600">Billing Cycle</span>
              </div>
              <p className="text-3xl font-bold text-slate-900">12 days</p>
              <p className="text-xs text-slate-500 mt-2">Until next renewal</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Plan */}
      <Card className="border-slate-200/60 shadow-lg">
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl font-bold text-slate-900">Current Plan</CardTitle>
              <p className="text-sm text-slate-500 mt-1">Enterprise subscription</p>
            </div>
            <Badge className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
              Active
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <p className="text-sm text-slate-500">Monthly cost</p>
              <p className="text-4xl font-bold text-slate-900">Custom Pricing</p>
              <p className="text-sm text-slate-600 mt-2">Next billing: February 1, 2024</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline">Change Plan</Button>
              <Button className="bg-gradient-to-r from-red-600 to-red-700">
                Cancel Subscription
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`border-2 ${plan.current
                  ? 'border-indigo-600 shadow-2xl shadow-indigo-200'
                  : 'border-slate-200 shadow-lg'
                }`}>
                <CardHeader className={
                  plan.current
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600'
                    : 'bg-slate-50'
                }>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className={`text-xl font-bold ${plan.current ? 'text-white' : 'text-slate-900'
                        }`}>
                        {plan.name}
                      </CardTitle>
                      <p className={`text-sm mt-1 ${plan.current ? 'text-white/80' : 'text-slate-500'
                        }`}>
                        {plan.credits}
                      </p>
                    </div>
                    {plan.current && (
                      <Badge className="bg-white text-indigo-600">Current</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                    <span className="text-slate-500">{plan.period}</span>
                  </div>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-slate-600">
                        <Check className="w-4 h-4 text-green-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full ${plan.current
                        ? 'bg-slate-200 text-slate-600'
                        : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                      }`}
                    disabled={plan.current}
                  >
                    {plan.current ? 'Current Plan' : 'Upgrade'}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Invoices */}
      <Card className="border-slate-200/60 shadow-lg">
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <CardTitle className="text-xl font-bold text-slate-900">Billing History</CardTitle>
          <p className="text-sm text-slate-500 mt-1">Download past invoices</p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {invoices.map((invoice, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg">
                    <CreditCard className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{invoice.id}</p>
                    <p className="text-sm text-slate-500">{invoice.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-bold text-slate-900">{invoice.amount}</p>
                  <Badge className="bg-green-50 text-green-700 border-green-200">
                    {invoice.status}
                  </Badge>
                  <Button variant="ghost" size="icon">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}