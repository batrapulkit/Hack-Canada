import React from "react";

export const SidebarProvider = ({ children }) => <>{children}</>;
export const Sidebar = ({ children, className = "" }) => (
  <aside className={`w-64 shrink-0 bg-white flex flex-col h-full ${className}`}>{children}</aside>
);
export const SidebarHeader = ({ children, className = "" }) => (
  <div className={`px-4 py-3 ${className}`}>{children}</div>
);
export const SidebarContent = ({ children, className = "" }) => (
  <div className={`flex-1 overflow-y-auto ${className}`}>{children}</div>
);
export const SidebarGroup = ({ children }) => <div>{children}</div>;
export const SidebarGroupContent = ({ children }) => <div>{children}</div>;
export const SidebarMenu = ({ children }) => <ul className="space-y-1">{children}</ul>;
export const SidebarMenuItem = ({ children }) => <li>{children}</li>;
export const SidebarMenuButton = ({ children, className = "" }) => (
  <div className={`cursor-pointer rounded-lg ${className}`}>{children}</div>
);
export const SidebarFooter = ({ children, className = "" }) => (
  <div className={`px-4 py-3 ${className}`}>{children}</div>
);
export const SidebarTrigger = ({ children, className = "" }) => (
  <div className={`cursor-pointer ${className}`}>{children}</div>
);
