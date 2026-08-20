import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import { EmptyState } from "@/components/EmptyState";
import {
  Users,
  AlertTriangle,
  Search,
  Filter,
  Download,
  Plus,
  TrendingUp,
  TrendingDown,
  Eye,
  ChevronRight,
  Zap,
  Target,
  Activity,
  Heart,
  LayoutGrid,
  List,
  MoreVertical,
  ArrowRight,
  UserPlus,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

import EmployeeDrawer from "@/components/EmployeeDrawer";
import { getOverallRisk } from "@/data/mockEmployeeData";
import { getWorkforceKPIs, getAISignals } from "@/lib/workforce-utils";
import { api } from "@/servicess/api";
import { Loader2 } from "lucide-react";

// ---------------- PAGE ----------------
export default function Employees() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [activeFilter, setActiveFilter] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [selectedAtRiskEmployee, setSelectedAtRiskEmployee] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ department: "", risk: "", fitmentMin: "", fitmentMax: "" });
  const [showAll, setShowAll] = useState(false);
  const { toast } = useToast();
  const [sortConfig, setSortConfig] = useState({ key: null, dir: "asc" });
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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
          description: "Could not load employee data from server.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadEmployees();
  }, []);

  const handleSort = (key) => {
    setSortConfig(prev =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" }
    );
  };

  const SortIcon = ({ colKey }) => {
    if (sortConfig.key !== colKey) return <span style={{ color: "#CBD5E1", fontSize: "10px", marginLeft: "4px" }}>↕</span>;
    return <span style={{ color: "#2563EB", fontSize: "10px", marginLeft: "4px" }}>{sortConfig.dir === "asc" ? "↑" : "↓"}</span>;
  };

  const kpis = useMemo(() => getWorkforceKPIs(employees), [employees]);
  const aiSignals = useMemo(() => getAISignals(employees), [employees]);

  // Parse URL query parameters
  useState(() => {
    const params = new URLSearchParams(window.location.search);
    const dept = params.get("department");
    const riskParam = params.get("risk");

    if (dept) {
      setFilters(prev => ({ ...prev, department: dept }));
      setShowFilters(true);
    }
    if (riskParam === "fatigue") {
      setFilters(prev => ({ ...prev, risk: "HIGH" })); // Set to HIGH as a default for fatigue redirection
      setShowFilters(true);
    }
  });

  const kpiCards = useMemo(() => [
    {
      title: "Total Employees",
      value: kpis.totalEmployees.toString(),
      delta: "+8%",
      deltaType: "up",
      icon: Users,
      color: "blue",
    },
    {
      title: "Avg Fitment Score",
      value: `${kpis.avgFitment}%`,
      delta: "+12%",
      deltaType: "up",
      icon: Target,
      color: "green",
    },
    {
      title: "Burnout Risk",
      value: `${kpis.burnoutRisk}%`,
      delta: "-5%",
      deltaType: "down",
      icon: Heart,
      color: "red",
    },
    {
      title: "Automation Savings",
      value: `$${kpis.automationSavings}`,
      delta: "+15%",
      deltaType: "up",
      icon: Zap,
      color: "purple",
    },
  ], [kpis]);

  const filtered = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const isFatigueRisk = params.get("risk") === "fatigue";

    return employees.filter((e) => {
      const matchesSearch = (e.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (e.employeeId || "").toLowerCase().includes(search.toLowerCase());
      const matchesDept = !filters.department || e.department === filters.department;

      // Handle the generic risk filter vs the specific fatigue redirection
      let matchesRisk = !filters.risk || (getOverallRisk(e) || "").toUpperCase() === filters.risk;
      if (isFatigueRisk && !filters.risk) {
        matchesRisk = (e.scores?.fatigue || 0) >= 50;
      }

      const matchesFitMin = !filters.fitmentMin || (e.scores?.fitment || e.fitmentScore || 0) >= parseInt(filters.fitmentMin);
      const matchesFitMax = !filters.fitmentMax || (e.scores?.fitment || e.fitmentScore || 0) <= parseInt(filters.fitmentMax);

      return matchesSearch && matchesDept && matchesRisk && matchesFitMin && matchesFitMax;
    });
  }, [search, filters, employees]);

  const sortedFiltered = useMemo(() => {
    if (!sortConfig.key) return filtered;
    const sorted = [...filtered].sort((a, b) => {
      let aVal, bVal;
      switch (sortConfig.key) {
        case "name":       aVal = a.name; bVal = b.name; break;
        case "position":   aVal = a.position; bVal = b.position; break;
        case "department": aVal = a.department; bVal = b.department; break;
        case "fitment":    aVal = a.scores?.fitment || a.fitmentScore || 0; bVal = b.scores?.fitment || b.fitmentScore || 0; break;
        case "productivity": aVal = a.scores?.productivity || a.productivity || 0; bVal = b.scores?.productivity || b.productivity || 0; break;
        case "utilization": aVal = a.scores?.utilization || a.utilization || 0; bVal = b.scores?.utilization || b.utilization || 0; break;
        default: return 0;
      }
      if (aVal < bVal) return sortConfig.dir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.dir === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filtered, sortConfig]);

  const getFitmentColor = (score) => {
    if (score >= 85) return "bg-green-100 text-green-800";
    if (score >= 70) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getRiskIcon = (risk) => {
    switch (risk) {
      case "High": return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "Medium": return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return <Eye className="h-4 w-4 text-green-500" />;
    }
  };

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," +
      "Name,Email,Position,Department,Fitment Score,Productivity,Utilization,Salary\n" +
      employees.map(emp =>
        `${emp.name || 'Unknown'},${emp.email || ''},${emp.position || ''},${emp.department || ''},${emp.scores?.fitment || emp.fitmentScore || 0},${emp.scores?.productivity || emp.productivity || 0},${emp.scores?.utilization || emp.utilization || 0},${emp.salary || 0}`
      ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "employees.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddEmployee = () => navigate("/add-employee");
  const handleViewRecommendations = () => navigate("/optimization");
  const handleFilterToggle = () => setShowFilters(!showFilters);

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 font-['Inter']">
      <div className="max-w-7xl mx-auto space-y-6">
        {isLoading && (
          <div className="fixed inset-0 bg-white/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        )}
        {/* HEADER */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-semibold text-[#0F172A]">Employees</h1>
            <p className="text-[#64748B] mt-1">
              Monitor and manage workforce performance and wellbeing
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="border-[#E5E7EB] text-[#0F172A]" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white" onClick={handleAddEmployee}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          </div>
        </div>

        {/* AI WORKFORCE INSIGHT BANNER */}
        <Card className="p-6 bg-gradient-to-r from-[#EFF6FF] to-[#DBEAFE] border-[#E5E7EB] rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#2563EB] rounded-full">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#0F172A]">AI Workforce Insights</h3>
                <p className="text-[#64748B] mt-1">
                  {aiSignals.length > 0 ? aiSignals.map(s => s.message).join(". ") : "Workforce is operating within stable parameters. No critical optimizations recommended at this time."}
                </p>
              </div>
            </div>
            <Button variant="outline" className="border-[#2563EB] text-[#2563EB] hover:bg-[#EFF6FF]" onClick={handleViewRecommendations}>
              View Recommendations
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </Card>

        {/* KPI CARDS ROW */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {kpiCards.map((card, index) => (
            <Card
              key={index}
              className={`p-4 bg-white border-[#E5E7EB] rounded-xl shadow-sm relative overflow-hidden cursor-pointer transition-all hover:shadow-md hover:border-[#2563EB] ${activeFilter === card.title ? 'ring-2 ring-[#2563EB] border-[#2563EB]' : ''
                }`}
              onClick={() => setActiveFilter(activeFilter === card.title ? null : card.title)}
            >
              <div className="absolute top-0 right-0 p-2">
                <Badge className={`text-xs font-medium ${card.deltaType === 'up' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                  {card.deltaType === 'up' ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {card.delta}
                </Badge>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-full ${card.color === 'blue' ? 'bg-blue-100' :
                  card.color === 'green' ? 'bg-green-100' :
                    card.color === 'purple' ? 'bg-purple-100' :
                      card.color === 'orange' ? 'bg-orange-100' :
                        'bg-red-100'
                  }`}>
                  <card.icon className={`h-5 w-5 ${card.color === 'blue' ? 'text-blue-600' :
                    card.color === 'green' ? 'text-green-600' :
                      card.color === 'purple' ? 'text-purple-600' :
                        card.color === 'orange' ? 'text-orange-600' :
                          'text-red-600'
                    }`} />
                </div>
              </div>
              <div>
                <p className="text-sm text-[#64748B] font-medium">{card.title}</p>
                <p className="text-2xl font-semibold text-[#0F172A] mt-1">{card.value}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* FILTERS MODAL */}
        {showFilters && (
          <Card className="p-6 bg-white border-[#E5E7EB] rounded-xl shadow-sm mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-[#0F172A]">Filters</h3>
              <Button variant="ghost" onClick={() => setShowFilters(false)}>×</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#64748B] mb-2">Department</label>
                <select
                  className="w-full p-2 border border-[#E5E7EB] rounded-md"
                  value={filters.department}
                  onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                >
                  <option value="">All Departments</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Product">Product</option>
                  <option value="Design">Design</option>
                  <option value="Analytics">Analytics</option>
                  <option value="Marketing">Marketing</option>
                  <option value="HR">HR</option>
                  <option value="Sales">Sales</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#64748B] mb-2">Risk Level</label>
                <select
                  className="w-full p-2 border border-[#E5E7EB] rounded-md"
                  value={filters.risk}
                  onChange={(e) => setFilters({ ...filters, risk: e.target.value })}
                >
                  <option value="">All Risk Levels</option>
                  <option value="HIGH">High Risk</option>
                  <option value="MEDIUM">Medium Risk</option>
                  <option value="LOW">Low Risk</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#64748B] mb-2">Min Fitment Score</label>
                <Input
                  type="number"
                  placeholder="0"
                  className="w-full border-[#E5E7EB]"
                  value={filters.fitmentMin}
                  onChange={(e) => setFilters({ ...filters, fitmentMin: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#64748B] mb-2">Max Fitment Score</label>
                <Input
                  type="number"
                  placeholder="100"
                  className="w-full border-[#E5E7EB]"
                  value={filters.fitmentMax}
                  onChange={(e) => setFilters({ ...filters, fitmentMax: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={() => setFilters({ department: "", risk: "", fitmentMin: "", fitmentMax: "" })}>
                Clear Filters
              </Button>
              <Button variant="outline" onClick={() => setShowFilters(false)}>
                Apply Filters
              </Button>
            </div>
          </Card>
        )}

        {/* WORKFORCE OVERVIEW TABLE + RIGHT SIDEBAR */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* TABLE */}
          <Card className="xl:col-span-3 p-6 bg-white border-[#E5E7EB] rounded-xl shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-[#0F172A]">Workforce Overview</h2>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#64748B]" />
                  <Input
                    placeholder="Search employees..."
                    className="pl-9 w-64 border-[#E5E7EB]"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Button variant="outline" className="border-[#E5E7EB]" onClick={handleFilterToggle}>
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </div>
            </div>

            <table className="w-full text-sm">
              <thead className="bg-[#F8FAFC]">
                <tr className="border-b border-[#E5E7EB]">
                  {[
                    { key: "name", label: "Employee", align: "left" },
                    { key: "position", label: "Role", align: "center" },
                    { key: "department", label: "Department", align: "center" },
                    { key: "fitment", label: "Fitment", align: "center" },
                    { key: "productivity", label: "Productivity", align: "center" },
                    { key: "utilization", label: "Utilization %", align: "center" },
                    { key: "risk", label: "Risk", align: "center" },
                  ].map(col => (
                    <th
                      key={col.key}
                      className="p-3 font-medium"
                      style={{
                        textAlign: col.align,
                        cursor: col.key !== "risk" ? "pointer" : "default",
                        color: sortConfig.key === col.key ? "#2563EB" : "#0F172A",
                        fontWeight: sortConfig.key === col.key ? 700 : 500,
                        userSelect: "none",
                        whiteSpace: "nowrap",
                      }}
                      onClick={() => col.key !== "risk" && handleSort(col.key)}
                    >
                      {col.label}
                      {col.key !== "risk" && <SortIcon colKey={col.key} />}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedFiltered.length === 0 ? (
                  <tr><td colSpan={7}>
                    <EmptyState
                      icon={search || filters.department || filters.risk ? "🔍" : "👥"}
                      title={search || filters.department || filters.risk ? "No results match these filters" : "No employees found"}
                      description={search || filters.department || filters.risk ? "Try adjusting your search or filters to see more results." : "There are no employees in the system yet."}
                      actionLabel={search || filters.department || filters.risk ? "Clear Filters" : undefined}
                      onAction={search || filters.department || filters.risk ? () => { setSearch(""); setFilters({ department: "", risk: "", fitmentMin: "", fitmentMax: "" }); } : undefined}
                    />
                  </td></tr>
                ) : (
                  sortedFiltered.map((e) => (
                    <tr key={e.employeeId} className="border-b border-[#E5E7EB] hover:bg-[#F8FAFC] cursor-pointer h-16" onClick={() => setSelectedEmployee(e)}>
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm uppercase">
                            {(e.name || "UN").split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-medium text-[#0F172A]">{e.name}</p>
                            <p className="text-xs text-[#64748B]">{e.employeeId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-[#0F172A]">{e.position}</td>
                      <td className="p-3 text-[#0F172A]">{e.department}</td>
                      <td className="p-3">
                        <Badge className={`font-medium ${getFitmentColor(e.scores?.fitment || e.fitmentScore || 0)}`}>
                          {e.scores?.fitment || e.fitmentScore || 0}%
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Progress value={e.scores?.productivity || e.productivity || 0} className="w-20" />
                          <span className="text-xs">{e.scores?.productivity || e.productivity || 0}%</span>
                        </div>
                      </td>
                      <td className="p-3 font-medium text-[#0F172A]">{e.scores?.utilization || e.utilization || 0}%</td>
                      <td className="p-3">
                        {getRiskIcon(getOverallRisk(e))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <div className="flex justify-center mt-6">
              <Button
                variant="link"
                className="text-[#2563EB] hover:text-[#1D4ED8]"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? "Show Less" : "View All Employees"}
                <ChevronRight className={`h-4 w-4 ml-1 transition-transform ${showAll ? "rotate-90" : ""}`} />
              </Button>
            </div>
          </Card>

          {/* RIGHT SIDEBAR */}
          <div className="space-y-4">
            {/* AI WORKFORCE ALERTS */}
            <Card className="p-4 bg-white border-[#E5E7EB] rounded-xl shadow-sm">
              <h3 className="font-semibold text-[#0F172A] mb-4">AI Workforce Alerts</h3>
              <div className="space-y-3">
                {aiSignals.map((sig, i) => (
                  <div key={i} className="p-3 bg-blue-50 border border-blue-100 rounded-lg cursor-pointer hover:bg-blue-100" onClick={() => navigate(sig.path)}>
                    <div className="flex items-start gap-2">
                      <span className="text-blue-500">🔵</span>
                      <div>
                        <p className="text-sm font-medium text-[#0F172A] capitalize">{sig.type} Signal</p>
                        <p className="text-xs text-[#64748B]">{sig.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {aiSignals.length === 0 && <p className="text-xs text-muted-foreground italic">No active alerts.</p>}
              </div>
            </Card>

            {/* TOP 3 AT-RISK EMPLOYEES */}
            <Card className="p-4 bg-white border-[#E5E7EB] rounded-xl shadow-sm">
              <h3 className="font-semibold text-[#0F172A] mb-4">Top 3 At-Risk Employees</h3>
              <div className="space-y-3">
                {[...employees]
                  .sort((a, b) => (b.scores?.fatigue || 0) - (a.scores?.fatigue || 0))
                  .slice(0, 3)
                  .map(emp => (
                    <div
                      key={emp.employeeId}
                      className="flex items-center justify-between p-2 bg-red-50 rounded-lg cursor-pointer hover:bg-red-100 transition"
                      onClick={() => setSelectedEmployee(emp)}
                    >
                      <span className="text-sm font-medium text-[#0F172A]">{emp.name}</span>
                      <Badge className="bg-red-100 text-red-800">{getOverallRisk(emp).toUpperCase()}</Badge>
                    </div>
                  ))}
              </div>
            </Card>

            {/* PROMOTION-READY */}
            <Card className="p-4 bg-green-50 border border-green-200 rounded-xl shadow-sm">
              <h3 className="font-semibold text-[#0F172A] mb-3">Promotion-Ready</h3>
              <div className="space-y-2 mb-4">
                {employees
                  .filter(e => (e.scores?.fitment || e.fitmentScore || 0) >= 85)
                  .slice(0, 2)
                  .map(emp => (
                    <p key={emp.employeeId} className="text-sm text-[#0F172A]">{emp.name} → {emp.recommendedRole || 'Next Level'}</p>
                  ))}
              </div>
              <Button variant="outline" className="w-full border-green-300 text-green-700 hover:bg-green-100" onClick={() => navigate("/fitment?filter=promotion-ready")}>
                View All Candidates
              </Button>
            </Card>
          </div>
        </div>

        {/* DRAWER */}
        <EmployeeDrawer
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
        />

        {/* ALERT DETAIL DIALOG */}
        <Dialog open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedAlert?.type === 'burnout' && 'High Burnout Risk Alert'}
                {selectedAlert?.type === 'fitment' && 'Low Fitment Alert'}
                {selectedAlert?.type === 'utilization' && 'Underutilized Talent Alert'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold">{selectedAlert?.employee}</h4>
                <p className="text-sm text-gray-600 mt-1">{selectedAlert?.details}</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Recommended Actions:</h4>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {selectedAlert?.type === 'burnout' && (
                    <>
                      <li>Schedule wellness check-in within 48 hours</li>
                      <li>Review current workload and redistribute tasks</li>
                      <li>Consider temporary reduction in responsibilities</li>
                    </>
                  )}
                  {selectedAlert?.type === 'fitment' && (
                    <>
                      <li>Assess skill gaps and provide training opportunities</li>
                      <li>Consider role adjustment or internal mobility</li>
                      <li>Schedule performance coaching session</li>
                    </>
                  )}
                  {selectedAlert?.type === 'utilization' && (
                    <>
                      <li>Identify additional responsibilities or projects</li>
                      <li>Explore cross-training opportunities</li>
                      <li>Review career development goals</li>
                    </>
                  )}
                </ul>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => {
                  toast({
                    title: "Action Initiated",
                    description: `Intervention plan created for ${selectedAlert?.employee}`,
                  });
                  setSelectedAlert(null);
                }}>
                  Create Intervention Plan
                </Button>
                <Button variant="outline" onClick={() => setSelectedAlert(null)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* AT-RISK EMPLOYEE DETAIL DIALOG */}
        <Dialog open={!!selectedAtRiskEmployee} onOpenChange={() => setSelectedAtRiskEmployee(null)}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Employee Risk Assessment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold">{selectedAtRiskEmployee?.name}</h4>
                <p className="text-sm text-gray-600 mt-1">Risk Level: {selectedAtRiskEmployee?.risk}</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Risk Factors:</h4>
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li>Low productivity metrics</li>
                  <li>High fatigue indicators</li>
                  <li>Potential skill gaps</li>
                </ul>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => {
                  setSelectedEmployee(employees.find(emp => emp.name === selectedAtRiskEmployee?.name));
                  setSelectedAtRiskEmployee(null);
                }}>
                  View Full Profile
                </Button>
                <Button variant="outline" onClick={() => setSelectedAtRiskEmployee(null)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
