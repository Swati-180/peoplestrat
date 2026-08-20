import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  BarChart3,
  PieChart,
  Activity,
  Award,
  ChevronRight,
  TrendingUp as TrendingUpIcon,
  Search,
} from "lucide-react";
import { useLocation } from "wouter";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { employees as initialEmployees } from "@/data/mockEmployeeData";
import { api } from "@/services/api";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function WorkforceIntelligence() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [activeSheet, setActiveSheet] = useState(null); // 'workforce', 'performance', 'utilization', 'salary'
  const [activeDialog, setActiveDialog] = useState(null); // 'skill-gap', 'productivity'
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [deptSearch, setDeptSearch] = useState("");
  const [deptSort, setDeptSort] = useState({ key: 'headcount', dir: 'desc' });
  const [summary, setSummary] = useState(null);
  useEffect(() => {
    const loadData = async () => {
      try {
        const [empRes, sumRes] = await Promise.all([
          api.get("/employees"),
          api.get("/analysis/summary")
        ]);
        if (empRes.data.success) setEmployees(empRes.data.data);
        if (sumRes.data.success) setSummary(sumRes.data.summary);
      } catch (error) {
        console.error("Failed to fetch workforce data:", error);
        toast({
          title: "Error",
          description: "Could not load intelligence analytics.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [toast]);

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const response = await api.post("/analysis/run");
      if (response.data.success) {
        toast({
          title: "Analysis Complete",
          description: `Successfully analyzed ${response.data.analyzedCount} employees.`,
        });
        // Reload employees to get updated scores
        const empRes = await api.get("/employees");
        if (empRes.data.success) {
          setEmployees(empRes.data.data);
        }
      }
    } catch (error) {
      console.error("Analysis failed:", error);
      toast({
        title: "Analysis Failed",
        description: "An error occurred while running the AI analysis pipeline.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const kpiMetrics = useMemo(() => {
    if (employees.length === 0) return [];
    const avgPerf = employees.reduce((sum, e) => sum + (e.scores?.productivity || e.productivity || 0), 0) / employees.length;
    return [
      {
        id: "workforce",
        title: "Total Workforce",
        value: employees.length.toLocaleString(),
        change: "+2.4%",
        changeType: "up",
        icon: Users,
        color: "blue",
      },
      {
        id: "performance",
        title: "Avg Performance Score",
        value: avgPerf.toFixed(1),
        change: "+5.1%",
        changeType: "up",
        icon: Target,
        color: "green",
      },
      {
        id: "utilization",
        title: "Utilization Rate",
        value: `${(employees.reduce((sum, e) => sum + (e.utilization || 0), 0) / employees.length).toFixed(1)}%`,
        change: "+12.8%",
        changeType: "up",
        icon: Activity,
        color: "purple",
      },
      {
        id: "salary",
        title: "Salary Asset Value",
        value: `$${(employees.reduce((sum, e) => sum + (e.salary || 0), 0) / 1000000).toFixed(1)}M`,
        change: "+8.3%",
        changeType: "up",
        icon: DollarSign,
        color: "orange",
      },
    ];
  }, [employees]);

  const departmentOverview = useMemo(() => {
    const depts = [...new Set(employees.map(e => e.department))].filter(Boolean);
    let results = depts.map(dept => {
      const emps = employees.filter(e => e.department === dept);
      const perf = emps.length > 0 ? Math.round(emps.reduce((sum, e) => sum + (e.productivity || 0), 0) / emps.length) : 0;
      const utils = emps.length > 0 ? Math.round(emps.reduce((sum, e) => sum + (e.utilization || 0), 0) / emps.length) : 0;
      const salary = emps.reduce((sum, e) => sum + (e.salary || 0), 0);
      const riskCount = emps.filter(e => (e.fatigueScore || 0) > 75).length;
      return {
        name: dept,
        headcount: emps.length,
        performance: perf,
        utilization: utils,
        salary: salary,
        risk: riskCount > 2 ? "High" : riskCount > 0 ? "Medium" : "Low",
      };
    });

    // Filter
    if (deptSearch) {
      results = results.filter(d => d.name.toLowerCase().includes(deptSearch.toLowerCase()));
    }

    // Sort
    return [...results].sort((a, b) => {
        const factor = deptSort.dir === 'asc' ? 1 : -1;
        const aVal = a[deptSort.key] || 0;
        const bVal = b[deptSort.key] || 0;
        return (aVal - bVal) * factor;
    });
  }, [employees, deptSearch, deptSort]);

  const predictiveInsights = useMemo(() => {
    const attrRisk = employees.filter(e => (e.fatigueScore || 0) > 85).length;
    const promoReady = employees.filter(e => (e.fitmentScore || 0) > 90 && (e.productivity || 0) > 85).length;
    const trainingNeeds = employees.filter(e => (e.fitmentScore || 0) < 70).length;

    return [
      {
        title: "Attrition Risk",
        value: `${attrRisk} employees`,
        description: "High burnout/fatigue levels detected",
        color: "red",
      },
      {
        title: "Promotion Ready",
        value: `${promoReady} employees`,
        description: "High fitment and performance scores",
        color: "green",
      },
      {
        title: "Training Needs",
        value: `${trainingNeeds} employees`,
        description: "Fitment gaps requiring intervention",
        color: "yellow",
      },
      {
        title: "Workload Imbalance",
        value: `${departmentOverview.filter(d => d.utilization > 90).length} departments`,
        description: "Utilization exceeding 90% threshold",
        color: "blue",
      },
    ];
  }, [departmentOverview]);

  const aiInsights = useMemo(() => {
    if (!summary?.deptInsights) return [];
    return summary.deptInsights.map((insight, idx) => ({
        type: insight.status === 'warning' ? 'critical' : insight.status === 'opportunity' ? 'opportunity' : 'success',
        title: insight.status === 'warning' ? 'Capacity Alert' : 'Operational Insight',
        id: `insight-${idx}`,
        description: insight.insight,
        impact: insight.status === 'warning' ? 'High' : 'Medium',
        action: insight.status === 'warning' ? 'Rebalance Workload' : 'View Details',
        icon: insight.status === 'warning' ? AlertTriangle : insight.status === 'opportunity' ? Zap : CheckCircle,
    })).slice(0, 3);
  }, [summary]);

  const getRiskColor = (risk) => {
    switch (risk) {
      case "Low": return "text-green-600 bg-green-50";
      case "Medium": return "text-yellow-600 bg-yellow-50";
      case "High": return "text-red-600 bg-red-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  const getInsightColor = (type) => {
    switch (type) {
      case "critical": return "border-red-200 bg-red-50";
      case "opportunity": return "border-blue-200 bg-blue-50";
      case "success": return "border-green-200 bg-green-50";
      default: return "border-gray-200 bg-gray-50";
    }
  };

  const getPredictiveColor = (color) => {
    switch (color) {
      case "red": return "bg-red-100 border-red-300 pointer-events-auto cursor-pointer";
      case "green": return "bg-green-100 border-green-300 pointer-events-auto cursor-pointer";
      case "yellow": return "bg-yellow-100 border-yellow-300 pointer-events-auto cursor-pointer";
      case "blue": return "bg-blue-100 border-blue-300 pointer-events-auto cursor-pointer";
      default: return "bg-gray-100 border-gray-300";
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 font-['Inter']">
      <div className="max-w-7xl mx-auto space-y-8">
        {isLoading && (
          <div className="fixed inset-0 bg-white/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        )}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-left">
            <h1 className="text-4xl font-semibold text-[#0F172A] mb-2">Workforce Intelligence</h1>
            <p className="text-lg text-[#64748B]">AI-powered workforce analytics and optimization insights</p>
          </div>
          <Button 
            onClick={runAnalysis} 
            disabled={isAnalyzing}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-6 rounded-xl shadow-lg shadow-indigo-200 transition-all font-bold"
          >
            {isAnalyzing ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Analyzing...</>
            ) : (
              <><Brain className="mr-2 h-5 w-5" /> Run Intelligence Analysis</>
            )}
          </Button>
        </div>

        {/* KPI Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpiMetrics.map((metric, index) => (
            <Card
              key={index}
              className="p-6 bg-white border-[#E5E7EB] rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer hover:-translate-y-1"
              onClick={() => setActiveSheet(metric.id)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${metric.color === 'blue' ? 'bg-blue-100' :
                  metric.color === 'green' ? 'bg-green-100' :
                    metric.color === 'purple' ? 'bg-purple-100' :
                      'bg-orange-100'
                  }`}>
                  <metric.icon className={`h-6 w-6 ${metric.color === 'blue' ? 'text-blue-600' :
                    metric.color === 'green' ? 'text-green-600' :
                      metric.color === 'purple' ? 'text-purple-600' :
                        'text-orange-600'
                    }`} />
                </div>
                <Badge className={`text-xs font-medium ${metric.changeType === 'up' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                  {metric.changeType === 'up' ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {metric.change}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-[#64748B] font-medium mb-1">{metric.title}</p>
                <p className="text-3xl font-bold text-[#0F172A]">{metric.value}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* AI Insights Section */}
        <div>
          <h2 className="text-2xl font-semibold text-[#0F172A] mb-6">AI Workforce Insights</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {aiInsights.map((insight, index) => (
              <Card
                key={index}
                className={`p-6 border-2 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer hover:-translate-y-1 ${getInsightColor(insight.type)}`}
                onClick={() => {
                  if (insight.id === 'skill-gap') setActiveDialog('skill-gap');
                  else if (insight.id === 'productivity') setActiveDialog('productivity');
                  else if (insight.id === 'utilization-opt') navigate("/optimization");
                }}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl bg-white shadow-sm`}>
                    <insight.icon className={`h-6 w-6 ${insight.type === 'critical' ? 'text-red-600' :
                      insight.type === 'opportunity' ? 'text-blue-600' :
                        'text-green-600'
                      }`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[#0F172A] mb-2">{insight.title}</h3>
                    <p className="text-[#64748B] mb-4 text-sm">{insight.description}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {insight.impact} Impact
                      </Badge>
                      <span className="text-xs font-medium text-[#2563EB] flex items-center">
                        {insight.action}
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Department Overview */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold text-[#0F172A]">Department Performance Overview</h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Filter departments..."
                  value={deptSearch}
                  onChange={(e) => setDeptSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48 md:w-64 bg-white"
                />
              </div>
              <select 
                value={`${deptSort.key}-${deptSort.dir}`}
                onChange={(e) => {
                  const [key, dir] = e.target.value.split('-');
                  setDeptSort({ key, dir });
                }}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[140px]"
              >
                <option value="headcount-desc">Headcount (High-Low)</option>
                <option value="headcount-asc">Headcount (Low-High)</option>
                <option value="performance-desc">Performance (High-Low)</option>
                <option value="utilization-desc">Utilization (High-Low)</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {departmentOverview.map((dept, index) => (
              <Card
                key={index}
                className="p-6 bg-white border-[#E5E7EB] rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer hover:-translate-y-1"
                onClick={() => navigate(`/employees?department=${dept.name}`)}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-[#0F172A]">{dept.name}</h3>
                  <Badge className={`text-xs font-medium ${getRiskColor(dept.risk)}`}>
                    {dept.risk} Risk
                  </Badge>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-[#64748B]">Headcount</span>
                      <span className="font-medium text-[#0F172A]">{dept.headcount}</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-[#64748B]">Performance Score</span>
                      <span className="font-medium text-[#0F172A]">{dept.performance}%</span>
                    </div>
                    <Progress value={dept.performance} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-[#64748B]">Resource Utilization</span>
                      <span className="font-medium text-[#0F172A]">{dept.utilization}%</span>
                    </div>
                    <Progress value={dept.utilization} className="h-2" />
                  </div>
                  <div className="pt-2 flex justify-end">
                    <span className="text-xs font-medium text-[#2563EB] flex items-center">
                      View Team <ChevronRight className="h-3 w-3 ml-1" />
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Predictive Analytics */}
        <div>
          <h2 className="text-2xl font-semibold text-[#0F172A] mb-6">Predictive Workforce Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {predictiveInsights.map((insight, index) => (
              <Card
                key={index}
                className={`p-6 border rounded-xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1 ${getPredictiveColor(insight.color)}`}
                onClick={() => {
                  if (insight.title === "Attrition Risk") setActiveDialog("attrition");
                  else if (insight.title === "Promotion Ready") setActiveDialog("promotion");
                  else if (insight.title === "Training Needs") navigate("/fitment?filter=low-fitment");
                  else if (insight.title === "Workload Imbalance") setActiveSheet("utilization");
                }}
              >
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-[#0F172A] mb-2">{insight.title}</h3>
                  <p className="text-3xl font-bold text-[#0F172A] mb-2">{insight.value}</p>
                  <p className="text-sm text-[#64748B]">{insight.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Action Center */}
        <Card className="p-8 bg-white border border-slate-200 rounded-2xl shadow-sm relative overflow-hidden group">
          <div className="text-center relative z-10">
            <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">AI Workforce Optimization Center</h2>
            <p className="text-slate-500 mb-8 max-w-2xl mx-auto text-lg leading-relaxed">
              Leverage advanced AI algorithms to optimize workforce performance, predict future needs,
              and maximize organizational productivity through data-driven insights.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg font-black uppercase tracking-widest shadow-lg shadow-blue-200" onClick={() => toast({ title: "Generating Report", description: "Advanced AI analysis in progress..." })}>
                <Brain className="h-6 w-5 mr-3" />
                Generate AI Report
              </Button>
              <Button variant="outline" className="border-slate-200 text-slate-700 hover:bg-slate-50 px-8 py-6 text-lg font-bold" onClick={() => navigate("/")}>
                <BarChart3 className="h-5 w-5 mr-3 text-blue-600" />
                View Analytics Dashboard
              </Button>
            </div>
          </div>
          {/* Subtle decoration */}
          <div className="absolute right-[-20px] bottom-[-20px] opacity-[0.03] group-hover:opacity-[0.06] transition-opacity pointer-events-none">
            <Zap className="h-64 w-64 text-slate-900" />
          </div>
        </Card>
      </div>

      {/* Sheets & Dialogs */}
      <Sheet open={!!activeSheet} onOpenChange={() => setActiveSheet(null)}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {activeSheet === 'workforce' && "Total Workforce Details"}
              {activeSheet === 'performance' && "Performance Breakdown"}
              {activeSheet === 'utilization' && "Utilization Analysis"}
              {activeSheet === 'salary' && "Salary Expenditure Analysis"}
            </SheetTitle>
            <SheetDescription>
              {activeSheet === 'workforce' && "Full list of employees and their roles."}
              {activeSheet === 'performance' && "Department-wise productivity comparison."}
              {activeSheet === 'utilization' && "Workload distribution across organization."}
              {activeSheet === 'salary' && "Financial allocation by department."}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-8 space-y-6">
            {activeSheet === 'workforce' && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Dept</TableHead>
                    <TableHead>Position</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map(e => (
                    <TableRow key={e.employeeId}>
                      <TableCell className="font-medium">{e.name}</TableCell>
                      <TableCell>{e.department}</TableCell>
                      <TableCell>{e.position}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {activeSheet === 'performance' && (
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentOverview}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E5E7EB' }}
                      cursor={{ fill: '#F3F4F6' }}
                    />
                    <Bar dataKey="performance" name="Performance %" radius={[4, 4, 0, 0]}>
                      {departmentOverview.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.performance > 85 ? '#10B981' : entry.performance > 70 ? '#2563EB' : '#EF4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {activeSheet === 'utilization' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center text-red-600">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Overloaded Employees (&gt;90%)
                  </h4>
                  <div className="space-y-2">
                    {employees.filter(e => (e.utilization || 0) > 90).map(e => (
                      <div key={e.employeeId} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                        <span className="text-sm font-medium">{e.name}</span>
                        <Badge variant="destructive">{e.utilization || 0}%</Badge>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center text-blue-600">
                    <Zap className="h-4 w-4 mr-2" />
                    Underutilized Potential (&lt;60%)
                  </h4>
                  <div className="space-y-2">
                    {employees.filter(e => (e.utilization || 0) < 60).map(e => (
                      <div key={e.employeeId} className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <span className="text-sm font-medium">{e.name}</span>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">{e.utilization || 0}%</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeSheet === 'salary' && (
              <div className="space-y-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Department</TableHead>
                      <TableHead className="text-right">Asset Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {departmentOverview.map(d => (
                      <TableRow key={d.name}>
                        <TableCell className="font-medium">{d.name}</TableCell>
                        <TableCell className="text-right font-semibold">${(d.salary / 1000).toFixed(0)}K</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-6 w-6 text-orange-600" />
                    <div>
                      <p className="text-xs uppercase font-bold text-orange-800 tracking-wider">Total Portfolio</p>
                      <p className="text-2xl font-black text-orange-900">
                        ${(departmentOverview.reduce((sum, d) => sum + d.salary, 0) / 1000000).toFixed(2)}M
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={!!activeDialog} onOpenChange={() => setActiveDialog(null)}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {activeDialog === 'skill-gap' && "Skill Gap Detail"}
              {activeDialog === 'productivity' && "Productivity Milestone"}
              {activeDialog === 'attrition' && "High Attrition Risk"}
              {activeDialog === 'promotion' && "Promotion Readiness"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {activeDialog === 'skill-gap' && (
              <div className="space-y-3">
                <p className="text-sm text-slate-600">The following employees require immediate skills intervention:</p>
                {employees.filter(e => (e.scores?.fitment || e.fitmentScore || 0) < 70).map(e => (
                  <div key={e.employeeId} className="flex justify-between items-center p-3 border rounded-lg hover:bg-slate-50 cursor-pointer" onClick={() => navigate("/fitment")}>
                    <div>
                      <p className="font-medium text-sm">{e.name}</p>
                      <p className="text-xs text-slate-500">{e.department}</p>
                    </div>
                    <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">{e.scores?.fitment || e.fitmentScore || 0}% Fit</Badge>
                  </div>
                ))}
                <Button className="w-full mt-4" onClick={() => navigate("/gap-analysis")}>Open Gap Analysis Portal</Button>
              </div>
            )}

            {activeDialog === 'productivity' && (
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUpIcon className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900">+5.1% Growth</h4>
                  <p className="text-sm text-slate-500">Workforce-wide productivity increase detected</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500 uppercase font-bold">Top Contributor</p>
                    <p className="text-sm font-semibold">Engineering</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500 uppercase font-bold">New Hires</p>
                    <p className="text-sm font-semibold">82% On-track</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full" onClick={() => navigate("/analytics")}>Detailed Performance Report</Button>
              </div>
            )}

            {activeDialog === 'attrition' && (
              <div className="space-y-3">
                <div className="p-4 bg-red-50 border border-red-100 rounded-lg mb-4">
                  <div className="flex gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="text-sm font-bold text-red-900">Immediate Action Required</p>
                      <p className="text-xs text-red-700">Burnout threshold exceeded for high-value talent.</p>
                    </div>
                  </div>
                </div>
                {employees.filter(e => (e.fatigueScore || 0) > 85).map(e => (
                  <div key={e.employeeId} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{e.name}</p>
                      <Badge className="mt-1 bg-red-100 text-red-800 text-[10px]">{e.position}</Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-red-600">{e.fatigueScore || 0}%</p>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Fatigue</p>
                    </div>
                  </div>
                ))}
                <Button className="w-full bg-red-600 hover:bg-red-700 mt-4" onClick={() => navigate("/fatigue")}>View Stress Analysis</Button>
              </div>
            )}

            {activeDialog === 'promotion' && (
              <div className="space-y-3">
                <p className="text-sm text-slate-600">High-potential employees ready for internal mobility:</p>
                {employees.filter(e => (e.scores?.fitment || e.fitmentScore || 0) > 90 && (e.scores?.productivity || e.productivity || 0) > 85).map(e => (
                  <div key={e.employeeId} className="flex gap-4 items-center p-3 border rounded-lg bg-green-50/30">
                    <div className="w-20 h-20 rounded-full bg-blue-50 border-4 border-white flex items-center justify-center text-2xl font-bold text-blue-600 shadow-sm">
                      {(e.name || "U")[0]}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm">{e.name}</p>
                      <p className="text-xs text-slate-500">Targeting: {e.recommendedRole || "Advanced Role"}</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">READY</Badge>
                  </div>
                ))}
                <Button className="w-full bg-green-600 hover:bg-green-700 mt-4" onClick={() => navigate("/fitment")}>Manage Promotions</Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
