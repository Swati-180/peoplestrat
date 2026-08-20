// Main App Sidebar component
import React from "react";
import {
  LayoutDashboard,
  BarChart3,
  Users,
  Upload,
  BookOpen,
  Zap,
  Brain,
  AlertCircle,
  LogOut,
  Target,
  Bot,
  ClipboardList,
  Activity,
  Layers,
  Rocket,
  Sparkles,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
} from "./ui/sidebar.jsx";
import { Link, useLocation } from "wouter";
import { Button } from "./ui/button.jsx";
import { useAuth } from "../lib/auth.jsx";
import { queryClient } from "../lib/queryClient.js";
import { cn } from "../lib/utils";
import { Avatar, AvatarFallback } from "./ui/avatar.jsx";
import OptiNXtLogo from "./OptiNXtLogo.jsx";

const menuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
];

const insightsItems = [
  { title: "Employees", url: "/employees", icon: Users },
  { title: "Fitment Analysis", url: "/fitment", icon: Target },
  { title: "Softskills", url: "/softskills", icon: Brain },
  { title: "Fatigue Analysis", url: "/fatigue", icon: AlertCircle },
  { title: "Workforce Intelligence", url: "/workforce-intelligence", icon: Activity },
  { title: "Gap Analysis", url: "/gap-analysis", icon: BarChart3 },
  { title: "6x6 Workforce Analysis", url: "/six-by-six", icon: Layers },
];

const adminDataItems = [
  { title: "Upload Data", url: "/upload-data", icon: Upload },
];

const adminOptimizationItems = [
  { title: "AI Assistant", url: "/ai-assistant", icon: Bot },
  { title: "Optimization", url: "/optimization", icon: Zap },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const role = (user?.role || "employee").toLowerCase();

  const handleLogout = () => {
    logout();
    queryClient.clear();
    window.location.href = "/login";
  };

  const NavItem = ({ item }) => (
    <SidebarMenuItem key={item.title}>
      <SidebarMenuButton asChild isActive={location === item.url} className="py-2 h-9">
        <Link to={item.url} className="flex items-center gap-3">
          <item.icon className={cn("h-4 w-4", location === item.url ? "text-white" : "text-sidebar-foreground/70")} />
          <span className={cn("font-medium", location === item.url ? "text-white" : "text-sidebar-foreground/70")}>
            {item.title}
          </span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar className="border-r-0 bg-sidebar">
      <SidebarHeader className="px-6 py-4 pb-2">
        <div style={{ paddingBottom: 4 }}>
          <OptiNXtLogo variant="full" size="sm" />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3">
        {/* MAIN SECTION */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-black tracking-[0.2em] text-sidebar-foreground/30 px-3 uppercase mb-2">Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => <NavItem key={item.title} item={item} />)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* INSIGHTS SECTION */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-black tracking-[0.2em] text-sidebar-foreground/30 px-3 uppercase mb-2">
            {role === "manager" ? "Insights" : "Employee Portal"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {role === "employee" ? (
                <>
                  <NavItem item={{ title: "My Profile", url: "/employee/profile", icon: Users }} />
                  <NavItem item={{ title: "My Work & Performance", url: "/employee/work", icon: LayoutDashboard }} />
                  <NavItem item={{ title: "Skills & Learning", url: "/employee/skills", icon: Brain }} />
                  <NavItem item={{ title: "Fatigue & Wellbeing", url: "/employee/wellbeing", icon: AlertCircle }} />
                  <NavItem item={{ title: "Career Growth", url: "/employee/career", icon: Rocket }} />
                  <NavItem item={{ title: "AI Career Coach", url: "/employee/career-coach", icon: Sparkles }} />
                  <NavItem item={{ title: "Employee Data Form", url: "/employee/data-form", icon: ClipboardList }} />
                </>
              ) : (
                insightsItems.map((item) => <NavItem key={item.title} item={item} />)
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* ADMIN DATA SECTION */}
        {role === "manager" && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-[10px] font-black tracking-[0.2em] text-sidebar-foreground/30 px-3 uppercase mb-2">Admin Data</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminDataItems.map((item) => <NavItem key={item.title} item={item} />)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* OPTIMIZATION SECTION */}
        {role === "manager" && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-[10px] font-black tracking-[0.2em] text-sidebar-foreground/30 px-3 uppercase mb-2">Optimization</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminOptimizationItems.map((item) => <NavItem key={item.title} item={item} />)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 mt-auto">
        <Button 
          variant="ghost" 
          className="w-full bg-white/5 hover:bg-white/10 text-sidebar-foreground hover:text-white border border-white/10 justify-start px-4 h-11 transition-all group" 
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-3 opacity-60 group-hover:opacity-100 transition-opacity" />
          <span className="font-bold text-xs uppercase tracking-widest">Logout</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
