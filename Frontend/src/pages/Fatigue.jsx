import { useWorkforceData } from "@/contexts/WorkforceContext";
import React, { useState, useMemo, useEffect } from "react";
import { api } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  Brain,
  TrendingDown,
  TrendingUp,
  ArrowRight,
  ChevronRight,
  Users,
  Clock,
  Activity,
  Heart,
  AlertTriangle,
  Target,
  Zap,
  Info,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import EmployeeDrawer from "@/components/EmployeeDrawer";
import { Loader2 } from "lucide-react";

export default function Fatigue() {
  const { employees: contextEmployees, getFatigueRisk } = useWorkforceData();
  const { user } = useAuth();
  const isEmployee = user?.role === "employee";
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const [modalData, setModalData] = useState(null);
  const [employeeWdt, setEmployeeWdt] = useState(null);

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const response = await api.get("/employees");
        if (response.data.success) {
          setEmployees(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch employees:", error);
        toast({
          title: "Error",
          description: "Could not load fatigue analytics.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadEmployees();
  }, [toast]);

  const displayEmployees = useMemo(() => {
    if (isEmployee) {
      return employees.filter(e => e._id === user.id || e.email === user.email);
    }
    return employees;
  }, [isEmployee, user, employees]);

  const fatigueMetrics = useMemo(() => {
    if (displayEmployees.length === 0) return { overallScore: 0, riskLevel: "UNKNOWN", trend: 0 };
    const avgFatigue = displayEmployees.reduce((sum, e) => sum + (e.scores?.fatigue || 0), 0) / displayEmployees.length;
    return {
      overallScore: Math.round(avgFatigue),
      riskLevel: avgFatigue >= 75 ? "CRITICAL" : avgFatigue >= 50 ? "HIGH" : "MEDIUM",
      trend: -5
    };
  }, [displayEmployees]);

  const keyIndicators = useMemo(() => {
    const avgUtilization = displayEmployees.length > 0 
      ? Math.round(displayEmployees.reduce((sum, e) => sum + (e.scores?.utilization || 0), 0) / displayEmployees.length)
      : 0;
    const avgProductivity = displayEmployees.length > 0
      ? Math.round(displayEmployees.reduce((sum, e) => sum + (e.scores?.productivity || 0), 0) / displayEmployees.length)
      : 0;
    
    return [
      {
        id: "utilization",
        title: "Workload Intensity",
        value: avgUtilization,
        change: 12,
        changeType: "up",
        icon: Target,
        definition: "Average utilization rate across all assigned projects and tasks.",
        recommendation: "Consider redistributing high-priority tasks from overloaded teams."
      },
      {
        id: "overtime",
        title: "Overtime Frequency",
        value: 64,
        change: 8,
        changeType: "up",
        icon: Clock,
        definition: "Percentage of employees reporting working hours beyond standard shifts.",
        recommendation: "Implement strictly enforced 'switch-off' hours for remote teams."
      },
      {
        id: "productivity",
        title: "Focus Consistency",
        value: avgProductivity,
        change: 15,
        changeType: "down",
        icon: Activity,
        definition: "Measure of sustained attention and output consistency throughout the day.",
        recommendation: "Incorporate focus-blocks and reduce non-essential recurring meetings."
      },
      {
        id: "fatigue",
        title: "Stress Signals",
        value: fatigueMetrics.overallScore,
        change: 9,
        changeType: "up",
        icon: Heart,
        definition: "AI-detected patterns in work habits indicating physiological or mental strain.",
        recommendation: "Schedule 1-on-1 wellness checks for high-risk flagged individuals."
      }
    ];
  }, [displayEmployees, fatigueMetrics]);

  const teamFatigue = useMemo(() => {
    const depts = [...new Set(employees.map(e => e.department))].filter(Boolean);
    return depts.map(dept => {
      const deptEmps = employees.filter(e => e.department === dept);
      const avgFatigue = deptEmps.reduce((sum, e) => sum + (e.scores?.fatigue || 0), 0) / deptEmps.length;
      return {
        team: dept,
        fatigue: Math.round(avgFatigue),
        risk: avgFatigue >= 75 ? "CRITICAL" : avgFatigue >= 50 ? "HIGH" : "MEDIUM",
      };
    }).sort((a, b) => b.fatigue - a.fatigue);
  }, [employees]);

  const wellbeingSignals = useMemo(() => [
    {
      title: "High Burnout Risk",
      count: employees.filter(e => (e.scores?.fatigue || 0) >= 75).length,
      employees: employees.filter(e => (e.scores?.fatigue || 0) >= 75),
      factor: "Extended high utilization (>95%)",
      color: "red",
    },
    {
      title: "Low Engagement",
      count: employees.filter(e => (e.scores?.productivity || 0) < 65).length,
      employees: employees.filter(e => (e.scores?.productivity || 0) < 65),
      factor: "Repetitive task cycles",
      color: "yellow",
    }
  ], [employees]);

  const getRiskBadge = (risk) => {
    switch (risk) {
      case "CRITICAL": return "bg-red-100 text-red-700 border-red-200";
      case "HIGH": return "bg-orange-100 text-orange-700 border-orange-200";
      case "MEDIUM": return "bg-blue-100 text-blue-700 border-blue-200";
      case "LOW": return "bg-green-100 text-green-700 border-green-200";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 font-['Inter']">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Fatigue Analysis</h1>
            <p className="text-slate-500 mt-1">Strategic workforce health and recovery monitoring</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="border-slate-200 bg-white text-slate-700" onClick={() => toast({ title: "Refreshing Data", description: "Calculating latest fatigue..." })}>
              <Activity className="mr-2 h-4 w-4" />
              Live Monitor
            </Button>
          </div>
        </div>

        {!isEmployee && (
          <Card className="p-8 bg-gradient-to-r from-slate-900 to-slate-800 border-none rounded-2xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-red-500 rounded-lg animate-pulse">
                    <Brain className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-red-400 font-bold tracking-wider text-xs uppercase">AI Critical Focus</span>
                </div>
                <h2 className="text-3xl font-bold">Fatigue Risk Alert</h2>
                <p className="text-slate-300 max-w-xl text-lg">
                  <span className="text-white font-bold">{wellbeingSignals[0].count} employees</span> are showing high attrition risk patterns.
                </p>
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-4 p-8 bg-white border-slate-200 rounded-2xl shadow-sm flex flex-col items-center justify-center space-y-6">
            <div className="relative">
              <svg className="w-40 h-40 transform -rotate-90">
                <circle cx="80" cy="80" r="70" stroke="#F1F5F9" strokeWidth="12" fill="none" />
                <circle
                  cx="80" cy="80" r="70" stroke={fatigueMetrics.riskLevel === 'CRITICAL' ? '#EF4444' : '#3B82F6'} strokeWidth="12" fill="none"
                  strokeDasharray={`${2 * Math.PI * 70}`}
                  strokeDashoffset={`${2 * Math.PI * 70 * (1 - (fatigueMetrics.overallScore || 0) / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-5xl font-black text-slate-900 tracking-tighter">{fatigueMetrics.overallScore}</span>
                <span className="text-slate-400 text-sm font-bold uppercase tracking-widest">Global Score</span>
              </div>
            </div>
            <Badge className={`px-4 py-1 text-sm font-bold ${getRiskBadge(fatigueMetrics.riskLevel)}`}>
              {fatigueMetrics.riskLevel} Fatigue Level
            </Badge>
          </Card>

          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {keyIndicators.map((indicator) => (
              <Card
                key={indicator.id}
                className="p-6 bg-white border-slate-200 rounded-2xl shadow-sm hover:border-blue-300 transition-all cursor-pointer group"
                onClick={() => {
                  setActiveModal('metric');
                  setModalData(indicator);
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="p-4 rounded-xl bg-slate-50 group-hover:bg-blue-50">
                    <indicator.icon className="h-6 w-6 text-slate-600 group-hover:text-blue-600" />
                  </div>
                  <Badge className="bg-slate-50 text-slate-700">{indicator.change}% Delta</Badge>
                </div>
                <div className="mt-8">
                  <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-1">{indicator.title}</p>
                  <p className="text-4xl font-black text-slate-900 tracking-tight">{indicator.value}%</p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {!isEmployee && (
          <Card className="border-slate-200 rounded-2xl overflow-hidden bg-white">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">Employee Fatigue Risk Matrix</h2>
            </div>
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Workload</TableHead>
                  <TableHead>Stress Vector</TableHead>
                  <TableHead className="text-right">Risk</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayEmployees.map((emp) => (
                  <TableRow key={emp.employeeId} onClick={() => setSelectedEmployee(emp)} className="cursor-pointer hover:bg-slate-50">
                    <TableCell className="font-bold">{emp.name}</TableCell>
                    <TableCell>{emp.scores?.utilization || 0}%</TableCell>
                    <TableCell>{emp.scores?.fatigue || 0}% Intensity</TableCell>
                    <TableCell className="text-right">
                      <Badge className={getRiskBadge(emp.scores?.fatigue >= 75 ? 'CRITICAL' : emp.scores?.fatigue >= 50 ? 'HIGH' : 'MEDIUM')}>
                        {emp.scores?.fatigue >= 75 ? 'CRITICAL' : emp.scores?.fatigue >= 50 ? 'HIGH' : 'MEDIUM'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      <Dialog open={activeModal === 'metric'} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{modalData?.title} Details</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-slate-600">{modalData?.definition}</p>
            <div className="p-4 bg-blue-50 rounded-xl">
              <h4 className="font-bold text-blue-900 text-sm mb-1">AI Recommendation</h4>
              <p className="text-sm text-blue-800">{modalData?.recommendation}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <EmployeeDrawer employee={selectedEmployee} onClose={() => setSelectedEmployee(null)} />
    </div>
  );
}
