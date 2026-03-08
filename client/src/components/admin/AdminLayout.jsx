import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    Users,
    Activity,
    LogOut,
    ShieldCheck,
    Phone,
    Mail,
    Settings
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
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import AgencyBranding from "../agency/AgencyBranding";

const items = [
    { title: "Overview", url: "/admin/dashboard", icon: LayoutDashboard },
    { title: "Agencies", url: "/admin/agencies", icon: Users },
    { title: "Outreach", url: "/admin/leads", icon: Phone },
    { title: "Mass Email", url: "/admin/mass-email", icon: Mail },
    { title: "Activity", url: "/admin/activity", icon: Activity },
    { title: "Settings", url: "/admin/settings", icon: Settings },
];

export default function AdminLayout({ children }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { signOut } = useAuth();

    return (
        <SidebarProvider>
            <div className="min-h-screen flex w-full bg-slate-50">
                <Sidebar className="border-r border-slate-200 bg-white text-slate-900" variant="inset">
                    <SidebarHeader className="border-b border-slate-100 p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-black rounded-lg">
                                <ShieldCheck className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="font-bold text-black tracking-tight text-sm uppercase">Super Admin</h1>
                                <p className="text-xs text-black font-semibold">Platform Control</p>
                            </div>
                        </div>
                    </SidebarHeader>

                    <SidebarContent className="p-3">
                        <SidebarGroup>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {items.map((item) => {
                                        const isActive = location.pathname.startsWith(item.url);
                                        return (
                                            <SidebarMenuItem key={item.title}>
                                                <SidebarMenuButton
                                                    asChild
                                                    className={`mb-1 transition-all ${isActive
                                                        ? "bg-black text-white hover:bg-slate-800 hover:text-white"
                                                        : "text-slate-600 hover:bg-slate-100 hover:text-black"
                                                        }`}
                                                >
                                                    <Link to={item.url} className="flex items-center gap-3">
                                                        <item.icon className="w-5 h-5" />
                                                        <span className="font-medium">{item.title}</span>
                                                    </Link>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        );
                                    })}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    </SidebarContent>

                    <SidebarFooter className="border-t border-slate-100 p-4">
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-slate-500 hover:text-black hover:bg-slate-100"
                            onClick={() => {
                                signOut();
                                navigate('/login');
                            }}
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Sign Out
                        </Button>
                    </SidebarFooter>
                </Sidebar>

                <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    <div className="flex-1 overflow-auto p-8">
                        {children}
                    </div>
                </main>
            </div>
        </SidebarProvider>
    );
}
