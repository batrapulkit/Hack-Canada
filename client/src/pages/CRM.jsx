import React, { useState } from "react";
import api from "@/api/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, BarChart3, Users, DollarSign, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

import LeadKanban from "../components/crm/LeadKanban.jsx";
import CreateLeadDialog from "../components/crm/CreateLeadDialog.jsx";
import LeadDetailsPanel from "../components/crm/LeadDetailsPanel.jsx";
import { Card } from "@/components/ui/card";

export default function CRM() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: () => api.entities.Lead.list('-created_date'),
    initialData: [],
  });

  const updateLeadMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.Lead.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });

  const filteredLeads = leads.filter(lead =>
    lead.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.destination?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStatusChange = async (leadId, newStatus) => {
    // Optimistic Update / Mutation
    updateLeadMutation.mutate({ id: leadId, data: { status: newStatus } });

    // Automation: If moved to "Won", automatically create a Client
    if (newStatus === 'won') {
      const lead = leads.find(l => l.id === leadId);
      if (lead) {
        try {
          const clientData = {
            name: lead.full_name || 'New Client',
            email: lead.email,
            phone: lead.phone,
            city: lead.destination ? lead.destination.split(',')[0] : '', // Simple extraction
            notes: `Converted from Lead: ${lead.full_name}\nTrip Interest: ${lead.destination}\nBudget: ${lead.currency || 'USD'} ${lead.budget}\nSource: ${lead.source || 'CRM Pipeline'}\n${lead.notes || ''}`
          };

          // Check for essential fields
          // Note: Backend will generate a placeholder email if missing, but we prefer a real one if possible.
          // We must send 'name' as createClient backend expects 'full_name' OR 'name'.
          await api.entities.Client.create(clientData);
          toast.success(`Deal Won! Client "${clientData.name}" created automatically.`);
        } catch (err) {
          console.error("Auto-client creation warning:", err);
          if (err.response?.status === 409 || err.message?.includes('duplicate')) {
            toast.info(`Deal Won! Client "${lead.full_name}" is already in your list.`);
          } else {
            console.error(err);
            // Don't show error toast if it's just a duplicate email that we didn't catch explicitly
          }
        }
      }
    }
  };

  // State to hold the lead being edited
  const [leadToEdit, setLeadToEdit] = useState(null);

  const openCreateDialog = () => {
    setLeadToEdit(null);
    setShowCreateDialog(true);
  };

  const openEditDialog = (lead) => {
    setLeadToEdit(lead);
    setShowCreateDialog(true);
  };

  // Calculate Metrics
  const totalLeads = leads.length;
  // Fallback potential value for demo if 0
  const calculatedValue = leads.reduce((sum, lead) => sum + (Number(lead.budget) || 0), 0);
  const potentialValue = calculatedValue;

  const rawConversion = totalLeads > 0
    ? ((leads.filter(l => l.status === 'won').length / totalLeads) * 100)
    : 0;

  // Force a "nice" conversion rate for demo if actual is 0
  const conversionRate = rawConversion.toFixed(1);

  const rawActive = leads.filter(l => l.status !== 'won' && l.status !== 'lost').length;
  // Force active deals count for demo
  const activeDeals = rawActive;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto min-h-screen">
      {/* Header & Actions */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-slate-900">CRM Pipeline</h1>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
              {totalLeads} Active
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Manage your travel leads and track conversions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="hidden sm:flex">
            <BarChart3 className="w-4 h-4 mr-2" />
            Reports
          </Button>
          <Button
            onClick={openCreateDialog}
            className="bg-slate-900 hover:bg-slate-800 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Lead
          </Button>
        </div>
      </div>

      {/* Pipeline Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Value</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">${potentialValue.toLocaleString()}</h3>
          </div>
          <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-emerald-600" />
          </div>
        </Card>

        <Card className="p-4 border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Conversion Rate</p>
            <div className="flex items-center gap-2 mt-1">
              <h3 className="text-2xl font-bold text-slate-900">{conversionRate}%</h3>
              <span className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                2.4%
              </span>
            </div>
          </div>
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-blue-600" />
          </div>
        </Card>

        <Card className="p-4 border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Deals</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{activeDeals}</h3>
          </div>
          <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-purple-600" />
          </div>
        </Card>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search leads..."
            className="pl-10 bg-white"
          />
        </div>
        <Button variant="outline" className="w-full md:w-auto">
          <Filter className="w-4 h-4 mr-2" />
          Filter View
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-4">
        <LeadKanban
          leads={filteredLeads}
          onStatusChange={handleStatusChange}
          onLeadClick={setSelectedLead}
          isLoading={isLoading}
        />
      </div>

      {showCreateDialog && (
        <CreateLeadDialog
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          leadToEdit={leadToEdit}
        />
      )}

      {selectedLead && (
        <LeadDetailsPanel
          lead={leads.find(l => l.id === selectedLead.id) || selectedLead}
          onClose={() => setSelectedLead(null)}
          onEdit={(leadToEditFromPanel) => openEditDialog(leadToEditFromPanel)}
        />
      )}
    </div>
  );
}
