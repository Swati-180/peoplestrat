import { useEffect, useState } from "react";
import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

import { TooltipProvider } from "./components/ui/tooltip.jsx";
import { Toaster } from "./components/ui/toaster.jsx";
import { SidebarProvider, SidebarTrigger } from "./components/ui/sidebar.jsx";
import { AppSidebar } from "./components/AppSidebar.jsx";

import { NotificationPanel } from "./components/NotificationPanel.jsx";
import { ProfileDropdown } from "./components/ProfileDropdown.jsx";
import { Tooltip, TooltipContent, TooltipTrigger } from "./components/ui/tooltip.jsx";
import { HelpCircle, Lock } from "lucide-react";
import { Badge } from "./components/ui/badge.jsx";
import { Button } from "./components/ui/button.jsx";
import { cn } from "@/lib/utils";

import { AuthProvider, useAuth } from "./lib/auth.jsx";
import { WorkforceProvider } from "./contexts/WorkforceContext.jsx";
import { AIProvider } from "./contexts/AIContext.jsx";
import AIChat from "./components/AIChat.jsx";

/* ---------------- PAGES ---------------- */
import Dashboard from "./pages/Dashboard.jsx";
import Analytics from "./pages/Analytics.jsx";
import Employees from "./pages/Employees.jsx";
import FitmentAnalysis from "./pages/FitmentAnalysis.jsx";
import Softskills from "./pages/Softskills.jsx";
import Fatigue from "./pages/Fatigue.jsx";
import WorkforceIntelligence from "./pages/WorkforceIntelligence.jsx";
import GapAnalysis from "./pages/GapAnalysis.jsx";
import SixBySixAnalysis from "./pages/SixBySixAnalysis.jsx";
import Optimization from "./pages/Optimization.jsx";
import UploadData from "./pages/UploadData.jsx";
import Settings from "./pages/Settings.jsx";
import Documentation from "./pages/Documentation.jsx";
import AiEmployeeAssistant from "./pages/AiEmployeeAssistant.jsx";
import EmployeeDashboard from "./pages/EmployeeDashboard.jsx";

import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import NotFound from "./pages/not-found.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import OptiNXtLogo from "./components/OptiNXtLogo.jsx";
import EmployeeDataForm from "./pages/employee/EmployeeDataForm.jsx";
import AddEmployee from "./pages/AddEmployee.jsx";
import MyProfile from "./pages/employee/MyProfile.jsx";
import MyWorkPerformance from "./pages/employee/MyWorkPerformance.jsx";
import SkillsLearning from "./pages/employee/SkillsLearning.jsx";
import FatigueWellbeing from "./pages/employee/FatigueWellbeing.jsx";
import CareerGrowth from "./pages/employee/CareerGrowth.jsx";
import EmployeeNotifications from "./pages/employee/EmployeeNotifications.jsx";
import CareerCoach from "./pages/employee/CareerCoach.jsx";


/* ---------------- PROTECTED ROUTES ---------------- */

function ProtectedRoute({ component: Component }) {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [isLoading, user]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-500 animate-pulse">Initializing platform...</p>
      </div>
    );
  }

  if (!user) return null;

  return <Component />;
}

function ManagerRoute({ component: Component }) {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) navigate("/login");
  }, [isLoading, user]);

  if (isLoading)
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-500 animate-pulse">Checking permissions...</p>
      </div>
    );

  if (!user) return null;

  if ((user.role || "").toLowerCase() !== "manager") {
    return (
      <div className="flex items-center justify-center h-screen text-center">
        <div className="max-w-md p-8 bg-white rounded-2xl shadow-xl border border-slate-100">
          <div className="h-16 w-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
          <p className="text-slate-500 mb-8">
            This section requires Manager level access. Please contact your administrator if you believe this is an error.
          </p>
          <Button onClick={() => window.location.href = "/"}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  return <Component />;
}

/* ---------------- APP ROUTER ---------------- */

function AppRouter() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/" component={LandingPage} />

      <Route path="/dashboard" component={() => (
        <ProtectedRoute component={() => {
          const { user } = useAuth();
          return (user.role || "").toLowerCase() === "manager" ? <Dashboard /> : <EmployeeDashboard />;
        }} />
      )} />
      <Route path="/employees" component={() => <ManagerRoute component={Employees} />} />
      <Route path="/fitment" component={() => <ProtectedRoute component={FitmentAnalysis} />} />
      <Route path="/softskills" component={() => <ProtectedRoute component={Softskills} />} />
      <Route path="/fatigue" component={() => <ProtectedRoute component={Fatigue} />} />
      <Route path="/workforce-intelligence" component={() => <ManagerRoute component={WorkforceIntelligence} />} />

      {/* ✅ THIS ONE */}
      <Route
        path="/gap-analysis"
        component={() => <ManagerRoute component={GapAnalysis} />}
      />

      <Route
        path="/ai-assistant"
        component={() => <ProtectedRoute component={AiEmployeeAssistant} />}
      />

      <Route
        path="/six-by-six"
        component={() => <ManagerRoute component={SixBySixAnalysis} />}
      />
      <Route path="/optimization" component={() => <ManagerRoute component={Optimization} />} />
      <Route path="/analytics" component={() => <ManagerRoute component={Analytics} />} />
      <Route path="/settings" component={() => <ProtectedRoute component={Settings} />} />
      <Route path="/documentation" component={() => <ProtectedRoute component={Documentation} />} />
      <Route path="/employee/data-form" component={() => <ProtectedRoute component={EmployeeDataForm} />} />
      <Route path="/upload-data" component={() => <ManagerRoute component={UploadData} />} />
      <Route path="/add-employee" component={() => <ManagerRoute component={AddEmployee} />} />
      
      {/* Employee Portal Routes */}
      <Route path="/employee/profile" component={() => <ProtectedRoute component={MyProfile} />} />
      <Route path="/employee/work" component={() => <ProtectedRoute component={MyWorkPerformance} />} />
      <Route path="/employee/skills" component={() => <ProtectedRoute component={SkillsLearning} />} />
      <Route path="/employee/wellbeing" component={() => <ProtectedRoute component={FatigueWellbeing} />} />
      <Route path="/employee/career" component={() => <ProtectedRoute component={CareerGrowth} />} />
      <Route path="/employee/career-coach" component={() => <ProtectedRoute component={CareerCoach} />} />
      <Route path="/employee/notifications" component={() => <ProtectedRoute component={EmployeeNotifications} />} />

      <Route component={NotFound} />
    </Switch>
  );
}


/* ---------------- APP LAYOUT ---------------- */

function AppContent() {
  const { user, isLoading } = useAuth();
  const [location, navigate] = useLocation();
  const [isChatOpen, setIsChatOpen] = useState(false);

  const isAuthPage = location === "/login" || location === "/register";
  const isLandingPage = location === "/";

  // Redirect logged-in users away from auth pages and landing page
  useEffect(() => {
    if (!isLoading && user && (isAuthPage || isLandingPage)) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, isAuthPage, isLandingPage, isLoading, navigate]);

  if ((isAuthPage || isLandingPage) && !user) {
    return <AppRouter />;
  }

  return (
    <SidebarProvider style={{ "--sidebar-width": "16rem" }}>
      <div className="flex h-screen w-full">
        <AppSidebar />

        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Header */}
          <header className="flex items-center justify-between px-6 py-2.5 border-b border-sidebar-border bg-sidebar text-sidebar-foreground sticky top-0 z-40 shadow-sm">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-sidebar-accent hover:text-white transition-colors" />
              <div className="h-6 w-px bg-sidebar-border" />
            </div>

            <div className="flex items-center gap-2 lg:gap-4">
              <div className="flex items-center gap-1 border-r pr-4 border-sidebar-border">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <NotificationPanel onNavigate={navigate} />
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Notifications (F8)</TooltipContent>
                </Tooltip>


                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate("/documentation")}
                            className="text-sidebar-foreground/80 hover:text-white hover:bg-sidebar-accent transition-colors"
                        >
                            <HelpCircle className="h-5 w-5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Help & Documentation</TooltipContent>
                </Tooltip>
              </div>

              {user && <ProfileDropdown user={user} />}
            </div>
          </header>


          {/* Page */}
          <main className="flex-1 overflow-auto p-6">
            <AppRouter />
          </main>
        </div>
      </div>

      {/* Floating AI Chat (Only for Managers) */}
      {!isAuthPage && user?.role === "manager" && <AIChat isFloating={true} isOpen={isChatOpen} onToggle={() => setIsChatOpen(!isChatOpen)} />}
    </SidebarProvider>
  );
}

/* ---------------- ROOT ---------------- */

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WorkforceProvider>
          <AIProvider>
            <TooltipProvider>
              <AppContent />
              <Toaster />
            </TooltipProvider>
          </AIProvider>
        </WorkforceProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
