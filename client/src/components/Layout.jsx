import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  LayoutDashboard,
  Users,
  Map,
  Plane,
  FileText,
  Building2,
  DollarSign,
  Settings,
  LogOut,
  Search,
  Menu,
  MessageSquare,
  ChevronRight,
  Palmtree,
  Crown,
  Linkedin,
  Cpu,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import AgencyBranding from "./agency/AgencyBranding.jsx";
import AIAssistant from "./ai/AIAssistant.jsx";
import { useBranding } from "@/contexts/BrandingContext";
import TriponicWatermark from "./TriponicWatermark.jsx";
import CopilotWidget from "./Copilot/CopilotWidget.jsx";

const navigationItems = [
  { title: "Dashboard", url: createPageUrl("Dashboard"), icon: LayoutDashboard },
  { title: "CRM", url: createPageUrl("CRM"), icon: Users },
  { title: "Clients", url: createPageUrl("Clients"), icon: Users },
  { title: "Trips", url: createPageUrl("Itineraries"), icon: Map },
  { title: "Bookings", url: createPageUrl("Bookings"), icon: Plane },
  { title: "Resorts", url: createPageUrl("Resorts"), icon: Palmtree },
  { title: "Invoices", url: createPageUrl("Finance"), icon: DollarSign },
  { title: "Suppliers", url: createPageUrl("Suppliers"), icon: Building2 },
  { title: "Quotes", url: createPageUrl("Quotes"), icon: FileText },
  { title: "Settings", url: createPageUrl("Settings"), icon: Settings },
];

import { useChat } from "@/contexts/ChatContext";

import CreateInvoiceDialog from "@/components/crm/CreateInvoiceDialog";
import CreateClientDialog from "@/components/crm/CreateClientDialog";

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, agency, profile } = useAuth();
  const { isOpen, toggleChat } = useChat();
  const { company_name, plan } = useBranding();

  // AI Action State
  const [invoiceDialogState, setInvoiceDialogState] = useState({ open: false, data: null });
  const [clientDialogState, setClientDialogState] = useState({ open: false, data: null, clientToEdit: null });

  React.useEffect(() => {
    const handleAIInvoice = (event) => {
      const { client, suggested_trips } = event.detail;

      let initialData = {
        client_id: client?.id || ""
      };

      // If specific trips suggested (for manual selection), currently we just prefill client
      // Ideally we could pass trips to the dialog to highlight them?
      // For now, plain prefill is good. User selects trip from dropdown.
      // Wait, if AI returns one trip (but no budget), we should PRESELECT that trip ID.
      if (suggested_trips && suggested_trips.length === 1) {
        initialData.itinerary_id = suggested_trips[0].id;
      }

      setInvoiceDialogState({ open: true, data: initialData });
    };

    const handleAIClient = (event) => {
      const { client, initialData } = event.detail;
      if (client) {
        setClientDialogState({ open: true, clientToEdit: client, data: null });
      } else {
        setClientDialogState({ open: true, clientToEdit: null, data: initialData });
      }
    };

    window.addEventListener('ai:open-invoice-builder', handleAIInvoice);
    window.addEventListener('ai:open-client-builder', handleAIClient);
    return () => {
      window.removeEventListener('ai:open-invoice-builder', handleAIInvoice);
      window.removeEventListener('ai:open-client-builder', handleAIClient);
    };
  }, []);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 via-white to-purple-50/20">
        {/* Sidebar */}
        <Sidebar className="border-r border-slate-200/60 backdrop-blur-xl bg-white/95">
          <SidebarHeader className="border-b border-slate-200/60 p-4">
            <AgencyBranding />
          </SidebarHeader>

          {/* Super Admin Section - Simplified */}
          {profile?.role === 'super_admin' && (
            <div className="mx-4 mt-6 mb-2">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 font-black text-black text-xs uppercase tracking-widest">
                  Super Admin
                </div>
                <Badge className="bg-black text-white hover:bg-slate-800 text-[10px] px-1.5 py-0 h-4 border-0">
                  GOD MODE
                </Badge>
              </div>

              <Link to="/admin/dashboard" className="w-full block">
                <Button variant="outline" size="sm" className="w-full border-slate-300 !text-black hover:bg-slate-50 hover:!text-black justify-between shadow-sm" style={{ color: 'black' }}>
                  <span className="flex items-center font-semibold">
                    <Building2 className="w-4 h-4 mr-2 text-black" />
                    Platform Control (Admin)
                  </span>
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                </Button>
              </Link>
            </div>
          )}

          <SidebarContent className="p-3">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map((item) => {
                    const isActive = location.pathname === item.url;
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          className={`group relative mb-1 rounded-xl transition-all duration-300 ${isActive
                            ? "bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white shadow-lg shadow-purple-500/25"
                            : "hover:bg-slate-100/80 text-slate-700"
                            }`}
                        >
                          <Link to={item.url} className="flex items-center gap-3 px-4 py-2.5">
                            <item.icon
                              className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-500 group-hover:text-purple-600"
                                } transition-colors`}
                            />
                            <span className="font-medium text-sm">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-slate-200/60 p-4">
            {/* Credits Display */}
            {agency && (
              <div className="mb-4 px-1">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-500 font-medium">Itinerary Credits</span>
                  <span className="text-purple-600 font-bold">
                    {agency.itinerary_credits || 0} remaining
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(((agency.itinerary_credits || 0) / 20) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}

            <Button
              onClick={toggleChat}
              className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 text-white shadow-lg mb-3"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Ask Tono AI
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-semibold text-sm">{company_name.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 text-sm truncate">{company_name}</p>
                <p className="text-xs text-slate-500 truncate">{plan}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  signOut();
                  navigate('/login');
                }}
                title="Logout"
              >
                <LogOut className="w-4 h-4 text-slate-500" />
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        {/* Main Content */}
        <main className="flex-1 flex flex-col relative">
          <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-6 py-4 sticky top-0 z-10">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1">
                <SidebarTrigger className="lg:hidden hover:bg-slate-100 p-2 rounded-lg">
                  <Menu className="w-5 h-5" />
                </SidebarTrigger>
                <div className="relative flex-1 max-w-md hidden md:block">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search leads, trips, clients... (Ctrl+K)"
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Subscription Plan Badge */}
                {plan && (
                  <Badge
                    className={
                      plan.toLowerCase().includes('pro')
                        ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 shadow-md"
                        : plan.toLowerCase().includes('plus')
                          ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 shadow-md"
                          : "bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 border-slate-300"
                    }
                  >
                    <Crown className="w-3 h-3 mr-1.5" />
                    {plan.replace(' Plan', '')}
                  </Badge>
                )}
                <Badge className="bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  All Systems Live
                </Badge>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-auto">{children}</div>
          <TriponicWatermark />

          {/* AI Assistant Modal - Managed via Context now */}
          <AIAssistant />
          <CopilotWidget />

          {/* Global AI Action Dialogs */}
          <CreateInvoiceDialog
            open={invoiceDialogState.open}
            onClose={() => setInvoiceDialogState({ open: false, data: null })}
            initialData={invoiceDialogState.data}
          />
          <CreateClientDialog
            open={clientDialogState.open}
            onClose={() => setClientDialogState({ open: false, data: null, clientToEdit: null })}
            clientToEdit={clientDialogState.clientToEdit}
            initialData={clientDialogState.data}
          />
        </main>
      </div>
    </SidebarProvider >
  );
}