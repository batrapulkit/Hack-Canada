import React, { useState, useEffect } from "react";
import api from "@/api/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  FileText,
  Download,
  Send,
  Eye,
  DollarSign,
  Calendar,
  User,
  X,
  TrendingUp,
  Clock,
  CheckCircle2,
  Edit
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { toast } from "sonner";
import CreateQuoteDialog from "@/components/crm/CreateQuoteDialog"; // Import new component
import ViewQuoteDialog from "@/components/crm/ViewQuoteDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { downloadInvoicePDF, generateInvoicePDF } from '../utils/pdfGenerator';
import { useChat } from "@/contexts/ChatContext";

const statusStyles = {
  draft: 'bg-slate-100 text-slate-600 border-slate-200',
  sent: 'bg-blue-50 text-blue-600 border-blue-200',
  paid: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  overdue: 'bg-rose-50 text-rose-600 border-rose-200',
  cancelled: 'bg-slate-50 text-slate-400 border-slate-200',
};

export default function Quotes() {
  const queryClient = useQueryClient();
  const { openChat } = useChat();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [editingInvoice, setEditingInvoice] = useState(null);

  const { data: quotes = [], isLoading } = useQuery({
    queryKey: ['quotes'],
    queryFn: async () => {
      const response = await api.entities.Quote.list(); // Use helper
      return response || [];
    },
    initialData: [],
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const response = await api.get('/clients');
      return response.data.clients || [];
    },
    initialData: [],
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data?.settings || {};
    },
    initialData: {}
  });

  // Removed createQuoteMutation, newQuote state, and handleCreateSubmit as they are now in CreateQuoteDialog component

  const filteredQuotes = quotes.filter(quote =>
    (quote.client?.full_name || quote.client?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    quote.id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStatusChange = (e, quoteId, newStatus) => {
    e.stopPropagation();
    api.entities.Quote.updateStatus(quoteId, newStatus).then(() => {
      queryClient.invalidateQueries(['quotes']);
      toast.success("Quote status updated");
    });
  };

  const handleEditQuote = (e, quote) => {
    e.stopPropagation();
    setEditingInvoice(quote);
    setIsCreateOpen(true);
  };


  const handleOpenView = (invoice) => {
    setViewingInvoice(invoice);
  };



  const getBranding = () => ({
    agencyName: settings.company_name,
    logoUrl: settings.logo_url,
    addressLine1: settings.address_line1,
    addressLine2: settings.address_line2,
    city: settings.city,
    state: settings.state,
    zip: settings.zip,
    country: settings.country,
    phone: settings.phone,
    website: settings.domain,
    ticoRegistrationNumber: settings.tico_registration_number,
    invoiceSettings: settings.invoice_settings || {},
    color: settings.invoice_settings?.primaryColor || "#6366f1",
    brandColor: settings.invoice_settings?.primaryColor || "#6366f1",
    secondaryColor: settings.invoice_settings?.secondaryColor || "#334155"
  });

  const handleViewPDF = async (e, invoice) => {
    e.stopPropagation();
    try {
      console.log("Generating PDF for invoice:", invoice);
      const doc = await generateInvoicePDF(invoice, getBranding());
      const blobUrl = doc.output('bloburl');
      const newWindow = window.open(blobUrl, '_blank');
      if (!newWindow) {
        toast.error('Please allow popups to view the invoice PDF');
      }
    } catch (error) {
      console.error("Error viewing PDF:", error);
      toast.error("Failed to generate PDF for viewing");
    }
  };

  const handleDownloadPDF = async (e, invoice) => {
    e.stopPropagation();
    try {
      console.log("Downloading PDF for invoice:", invoice);
      await downloadInvoicePDF(invoice, getBranding());
      toast.success("Invoice downloaded successfully");
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error("Failed to download PDF");
    }
  };

  // Calculate stats
  const handleConvert = (e, quoteId) => {
    e.stopPropagation();
    if (!confirm("Convert this quote to an invoice?")) return;

    api.entities.Quote.convert(quoteId).then(() => {
      toast.success("Quote converted to Invoice!");
      queryClient.invalidateQueries(['quotes']);
    }).catch(err => {
      console.error(err);
      toast.error("Failed to convert quote");
    });
  };

  // Stats (Mocked or calculated from quotes)
  const totalRevenue = quotes.filter(i => i.status === 'accepted').reduce((acc, curr) => acc + (parseFloat(curr.total_price) || 0), 0);
  const pendingAmount = quotes.filter(i => i.status === 'sent' || i.status === 'draft').reduce((acc, curr) => acc + (parseFloat(curr.total_price) || 0), 0);
  const paidCount = quotes.filter(i => i.status === 'accepted' || i.status === 'invoiced').length;

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
            Quotes & Proposals
          </h1>
          <p className="text-slate-500 mt-1">
            Manage your proposals and convert them to invoices
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="border-slate-200 hover:bg-slate-50 text-slate-600"
            onClick={() => openChat('Create an invoice for [Client Name] for $1000')}
          >
            <Plus className="w-4 h-4 mr-2" />
            AI Create
          </Button>
          <Button
            className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20 transition-all"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Quote
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-0 shadow-lg shadow-indigo-500/5 bg-gradient-to-br from-indigo-500 to-purple-600 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <TrendingUp className="w-24 h-24" />
            </div>
            <CardContent className="p-6 relative z-10">
              <p className="text-indigo-100 font-medium text-sm">Accepted Value</p>
              <h3 className="text-3xl font-bold mt-2">${totalRevenue.toLocaleString()}</h3>
              <p className="text-indigo-100/80 text-xs mt-4">Potential Earnings</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-0 shadow-lg shadow-slate-200/50 bg-white">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-500 font-medium text-sm">Draft Value</p>
                  <h3 className="text-3xl font-bold text-slate-900 mt-2">${pendingAmount.toLocaleString()}</h3>
                </div>
                <div className="p-3 bg-orange-50 rounded-xl">
                  <Clock className="w-6 h-6 text-orange-500" />
                </div>
              </div>
              <p className="text-slate-400 text-xs mt-4">Pending Proposals</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-0 shadow-lg shadow-slate-200/50 bg-white">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-500 font-medium text-sm">Accepted Quotes</p>
                  <h3 className="text-3xl font-bold text-slate-900 mt-2">{paidCount}</h3>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                </div>
              </div>
              <p className="text-slate-400 text-xs mt-4">Ready for Invoice</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Search & Filter */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by client, ID, or amount..."
          className="pl-11 h-12 bg-white border-slate-200 shadow-sm rounded-xl focus:ring-2 focus:ring-indigo-500/20 transition-all"
        />
      </div>

      {/* Invoices List */}
      <div className="space-y-4">
        <AnimatePresence>
          {isLoading ? (
            [1, 2, 3].map(i => (
              <Card key={i} className="border-0 shadow-sm bg-white">
                <CardContent className="p-6">
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))
          ) : filteredQuotes.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-medium text-slate-900">No quotes found</h3>
              <p className="text-slate-500">Create a quote from an itinerary to get started.</p>
            </motion.div>
          ) : (
            filteredQuotes.map((quote, index) => (
              <motion.div
                key={quote.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className="border-0 shadow-sm hover:shadow-md transition-all bg-white group overflow-hidden cursor-pointer"
                  onClick={() => handleOpenView(quote)}
                >
                  <CardContent className="p-0">
                    <div className="flex flex-col lg:flex-row items-stretch">
                      {/* Left Status Stripe */}
                      <div className={`w-full lg:w-1.5 ${quote.status === 'accepted' || quote.status === 'invoiced' ? 'bg-emerald-500' : quote.status === 'sent' ? 'bg-blue-500' : 'bg-slate-300'}`} />

                      <div className="flex-1 p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm">
                            {(quote.client?.full_name || quote.client?.name || '?').charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-900">{quote.client?.full_name || quote.client?.name || 'Unknown Client'}</h4>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">#{quote.id?.slice(0, 8)}</p>
                            {quote.itinerary && <p className="text-[10px] text-indigo-500">via {quote.itinerary.destination}</p>}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-8 text-sm">
                          <div className="flex flex-col">
                            <span className="text-slate-400 text-xs mb-0.5">Amount</span>
                            <span className="font-bold text-slate-900">${parseFloat(quote.total_price).toLocaleString()}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-slate-400 text-xs mb-0.5">Valid Until</span>
                            <span className="text-slate-600">{format(new Date(quote.valid_until || quote.created_at), 'MMM d, yyyy')}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-slate-400 text-xs mb-0.5">Status</span>
                            <Badge variant="outline" className={`capitalize ${statusStyles[quote.status] || statusStyles.draft}`}>
                              {quote.status}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-900" onClick={(e) => handleViewPDF(e, quote)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-900" onClick={(e) => handleDownloadPDF(e, quote)}>
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-900" onClick={(e) => handleEditQuote(e, quote)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          {/* Status Dropdown */}
                          <div onClick={(e) => e.stopPropagation()}>
                            <Select
                              value={quote.status}
                              onValueChange={(val) => handleStatusChange({ stopPropagation: () => { } }, quote.id, val)}
                            >
                              <SelectTrigger className="h-8 w-[130px] text-xs">
                                <SelectValue placeholder="Status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="sent">Sent</SelectItem>
                                <SelectItem value="accepted">Accepted</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {quote.status === 'accepted' && (
                            <Button
                              size="sm"
                              className="bg-emerald-600 text-white hover:bg-emerald-700 h-8 text-xs"
                              onClick={(e) => handleConvert(e, quote.id)}
                            >
                              Convert to Invoice
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <CreateQuoteDialog
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        quoteToEdit={editingInvoice}
      />
      <ViewQuoteDialog
        open={!!viewingInvoice}
        onClose={() => setViewingInvoice(null)}
        quote={viewingInvoice}
      />
    </div>
  );
}