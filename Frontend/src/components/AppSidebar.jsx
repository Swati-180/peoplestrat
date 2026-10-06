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
  MessageSquare,
  Briefcase,
  ChevronDown
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible.jsx";
import { Link, useLocation } from "wouter";
import { Button } from "./ui/button.jsx";
import { useAuth } from "../lib/auth.jsx";
import { queryClient } from "../lib/queryClient.js";
import { cn } from "../lib/utils";
import { Avatar, AvatarFallback } from "./ui/avatar.jsx";
import PeopleStratLogo from "./PeopleStratLogo.jsx";

const menuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
];

const adminCategories = [
  {
    id: "people-access",
    title: "People & Access",
    items: [
      { title: "Employees", url: "/employees", icon: Users, roles: ["manager", "admin"] },
      { title: "User Management", url: "/users", icon: Users, roles: ["manager", "admin"] }
    ]
  },
  {
    id: "talent-performance",
    title: "Talent & Performance",
    items: [
      { title: "Fitment Analysis", url: "/fitment", icon: Target, roles: ["admin"] },
      { title: "Softskills", url: "/softskills", icon: Brain, roles: ["manager", "admin"] },
      { title: "Gap Analysis", url: "/gap-analysis", icon: BarChart3, roles: ["manager", "admin"] },
      { title: "6x6 Workforce Analysis", url: "/six-by-six", icon: Layers, roles: ["admin"] },
      { title: "Peer Feedback", url: "/peer-feedback", icon: MessageSquare, roles: ["manager", "admin"] }
    ]
  },
  {
    id: "workforce-insights",
    title: "Workforce Insights",
    items: [
      { title: "Workforce Intelligence", url: "/workforce-intelligence", icon: Activity, roles: ["admin"] },
      { title: "Fatigue Analysis", url: "/fatigue", icon: AlertCircle, roles: ["manager", "admin"] },
      { title: "Flight Risk", url: "/flight-risk", icon: AlertCircle, roles: ["admin"] }
    ]
  },
  {
    id: "talent-strategy",
    title: "Talent Strategy",
    items: [
      { title: "Leadership Pipeline", url: "/leadership-pipeline", icon: Zap, roles: ["admin"] },
      { title: "Succession Planning", url: "/succession-planning", icon: Users, roles: ["admin"] }
    ]
  },
  {
    id: "admin-data",
    title: "Admin Data",
    items: [
      { title: "Upload Data", url: "/upload-data", icon: Upload, roles: ["admin"] }
    ]
  },
  {
    id: "optimization",
    title: "Optimization",
    items: [
      { title: "AI Assistant", url: "/ai-assistant", icon: Bot, roles: ["admin"] },
      { title: "Optimization", url: "/optimization", icon: Zap, roles: ["admin"] }
    ]
  }
];

const employeeCategories = [
  {
    id: "profile",
    title: "Profile & Information",
    routes: ["/employee/profile", "/employee/data-form", "/employee/resume-builder"],
    items: [
      { title: "My Profile", url: "/employee/profile", icon: Users },
      { title: "Employee Data Form", url: "/employee/data-form", icon: ClipboardList },
      { title: "Resume Builder", url: "/employee/resume-builder", icon: Briefcase }
    ]
  },
  {
    id: "work",
    title: "Work & Performance",
    routes: ["/employee/work", "/employee/skills"],
    items: [
      { title: "My Work & Performance", url: "/employee/work", icon: LayoutDashboard },
      { title: "Skills & Learning", url: "/employee/skills", icon: Brain }
    ]
  },
  {
    id: "wellbeing",
    title: "Wellbeing & Feedback",
    routes: ["/employee/wellbeing", "/employee/pulse-check", "/peer-feedback"],
    items: [
      { title: "Fatigue & Wellbeing", url: "/employee/wellbeing", icon: AlertCircle },
      { title: "Pulse Check", url: "/employee/pulse-check", icon: Activity },
      { title: "Peer Feedback", url: "/peer-feedback", icon: MessageSquare }
    ]
  },
  {
    id: "assessments",
    title: "Assessments",
    routes: ["/employee/behavior-assessment"],
    items: [
      { title: "Behavior Assessment", url: "/employee/behavior-assessment", icon: Target }
    ]
  },
  {
    id: "career",
    title: "Career & Development",
    routes: ["/employee/career", "/employee/career-coach"],
    items: [
      { title: "Career Growth", url: "/employee/career", icon: Rocket },
      { title: "AI Career Coach", url: "/employee/career-coach", icon: Sparkles }
    ]
  }
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const role = (user?.role || "employee").toLowerCase();

  const [openCategory, setOpenCategory] = React.useState(() => {
    if (role === "employee") {
      const activeCategory = employeeCategories.find(cat => cat.routes.includes(location));
      return activeCategory ? activeCategory.id : "";
    } else {
      const activeCategory = adminCategories.find(cat => cat.items.some(item => item.url === location));
      return activeCategory ? activeCategory.id : "";
    }
  });

  const categoriesToRender = role === "employee" ? employeeCategories : adminCategories;

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
          <PeopleStratLogo variant="full" size="sm" />
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

        {/* DYNAMIC CATEGORIES SECTION */}
        <SidebarGroup className="gap-1 pt-4">
          {categoriesToRender.map((category) => {
            const visibleItems = role === "employee"
              ? category.items
              : category.items.filter(item => item.roles.includes(role));

            if (visibleItems.length === 0) return null;

            return (
              <Collapsible
                key={category.id}
                open={openCategory === category.id}
                onOpenChange={(isOpen) => setOpenCategory(isOpen ? category.id : "")}
                className="group/collapsible"
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-2 text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md transition-colors">
                  <span className="truncate">{category.title}</span>
                  <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-data-[state=closed]/collapsible:-rotate-90" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenu className="pl-4 mt-1 border-l border-sidebar-border/50 ml-3 gap-0.5">
                    {visibleItems.map(item => <NavItem key={item.title} item={item} />)}
                  </SidebarMenu>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </SidebarGroup>
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
