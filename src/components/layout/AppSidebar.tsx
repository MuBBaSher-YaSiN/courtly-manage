import { useState } from "react";
import { 
  Scale, 
  Users, 
  FileText, 
  Calendar, 
  Settings, 
  Bell,
  Search,
  Home,
  UserCheck,
  Gavel,
  Upload
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const { session } = useAuth();

  const userRole = session?.user?.app_metadata?.role || 'PUBLIC';

  // Menu items based on role
  const getMenuItems = () => {
    const baseItems = [
      { title: "Dashboard", url: "/dashboard", icon: Home },
      { title: "Cases", url: "/cases", icon: Scale },
      { title: "Hearings", url: "/hearings", icon: Calendar },
      { title: "Documents", url: "/documents", icon: FileText },
      { title: "Notifications", url: "/notifications", icon: Bell },
      { title: "Search", url: "/search", icon: Search },
    ];

    const adminItems = [
      { title: "User Management", url: "/admin/users", icon: Users },
      { title: "System Settings", url: "/admin/settings", icon: Settings },
      { title: "Audit Logs", url: "/admin/audit", icon: UserCheck },
    ];

    const judgeClerkItems = [
      { title: "Filings Review", url: "/filings", icon: Gavel },
    ];

    if (userRole === 'ADMIN') {
      return [...baseItems, ...judgeClerkItems, ...adminItems];
    } else if (userRole === 'JUDGE' || userRole === 'CLERK') {
      return [...baseItems, ...judgeClerkItems];
    } else {
      return baseItems;
    }
  };

  const items = getMenuItems();

  const isActive = (path: string) => currentPath === path;
  const isExpanded = items.some((i) => isActive(i.url));
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "hover:bg-sidebar-accent/50";

  return (
    <Sidebar collapsible="icon">
      <SidebarTrigger className="m-2 self-end" />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Court Management</SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}