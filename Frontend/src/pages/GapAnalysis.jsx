import React, { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";
import { employees as centralEmployeesMock, getFitmentBand } from "@/data/mockEmployeeData";
import { api } from "@/servicess/api";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { Loader2, Search, Download } from "lucide-react";

/* ---------------- COMPONENT ---------------- */

export default function GapAnalysis() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [gapData, setGapData] = useState({ employeesWithGaps: [], summary: { topGaps: [], severityDistribution: [] } });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadGaps = async () => {
      try {
        const response = await api.get("/analysis/gaps");
        if (response.data.success) {
          setGapData(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch gap analysis data:", error);
        toast({
          title: "Error",
          description: "Could not load gap analysis data.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadGaps();
  }, [toast]);

  const filteredEmployees = useMemo(() => {
    return gapData.employeesWithGaps.filter(
      (e) =>
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.position.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, gapData.employeesWithGaps]);

  const barData = gapData.summary.topGaps;
  const donutData = gapData.summary.severityDistribution;

  const COLORS = ["#3B82F6", "#F59E0B", "#10B981"]; // Blue, Amber, Green - Refined palette

  const getSeverityVariant = (severity) => {
    switch (severity) {
      case "High": return "destructive";
      case "Medium": return "secondary";
      case "Low": return "outline";
      default: return "default";
    }
  };

  const handleExport = () => {
    if (!gapData.employeesWithGaps.length) return;
    const headers = "Name,Position,Department,Gap Severity,Gap Count,Fitment Score\n";
    const rows = gapData.employeesWithGaps.map(e => 
      `${e.name},${e.position},${e.department},${e.severity},${e.gapCount},${e.fitmentScore || 0}%`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "gap-analysis-report.csv";
    a.click();
    window.URL.revokeObjectURL(url);
    toast({ title: "Export Successful", description: "Report downloaded as CSV" });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 font-['Inter'] space-y-8">
      {isLoading && (
        <div className="fixed inset-0 bg-white/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      )}

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Gap Analysis</h1>
          <p className="text-slate-500 mt-1">
            Skill, performance & development gaps across {gapData.employeesWithGaps.length} employees
          </p>
        </div>

        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* SEARCH */}
      <div className="relative w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search employee or role..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-900 uppercase tracking-widest">Gap Count by Employee (Top 10)</CardTitle>
          </CardHeader>
          <CardContent className="h-64 pt-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 10, fontWeight: 700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 10, fontWeight: 700}} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="gaps" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-900 uppercase tracking-widest">Gap Severity Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-64 pt-6">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  dataKey="value"
                  innerRadius={65}
                  outerRadius={90}
                  paddingAngle={8}
                  stroke="none"
                >
                  {donutData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* TABLE */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Gap Overview</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="p-3 text-left">Employee</th>
                <th className="p-3 text-left">Role</th>
                <th className="p-3 text-center">Gaps</th>
                <th className="p-3 text-center">Severity</th>
                <th className="p-3 text-center">Fitment Score</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((e) => (
                <tr key={e.employeeId} className="border-b hover:bg-muted/50 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                        {e.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="font-medium">{e.name}</span>
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground">{e.position}</td>
                  <td className="p-3 text-center font-bold">{e.gapCount}</td>
                  <td className="p-3 text-center">
                    <Badge variant={getSeverityVariant(e.severity)}>
                      {e.severity}
                    </Badge>
                  </td>
                  <td className="p-3 text-center font-medium">{e.fitmentScore || 0}%</td>
                  <td className="p-3 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedEmployee(e)}
                    >
                      View Details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* DETAILS DIALOG */}
      <Dialog
        open={!!selectedEmployee}
        onOpenChange={() => setSelectedEmployee(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedEmployee && (
            <EmployeeDetail employee={selectedEmployee} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------------- DETAIL PAGE ---------------- */

function EmployeeDetail({ employee }) {
  const [interventions, setInterventions] = useState([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [source, setSource] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const fetchInterventions = async () => {
      setLoadingAI(true);
      try {
        const res = await api.post(`/analysis/gaps/${employee._id}/interventions`);
        if (res.data.success) {
          setInterventions(res.data.interventions);
          setSource(res.data.source);
        }
      } catch (error) {
        console.error("Intervention fetch error", error);
        toast({ title: "Failed to generate interventions", variant: "destructive" });
        setInterventions([
          { title: "Focused Upskilling", description: "Complete advanced role-specific certification." },
          { title: "Peer Mentorship", description: "Pair with a High-Fitment peer." }
        ]);
      } finally {
        setLoadingAI(false);
      }
    };
    if (employee._id) fetchInterventions();
  }, [employee._id, toast]);

  return (
    <div className="space-y-6 p-2">
      <div className="flex items-center gap-6">
        <div className="h-20 w-20 rounded-full bg-blue-50 border-2 border-blue-200 flex items-center justify-center text-2xl font-bold text-blue-600">
          {employee.name[0]}
        </div>

        <div className="flex-1">
          <h2 className="text-2xl font-bold">{employee.name}</h2>
          <p className="text-lg text-muted-foreground">{employee.position}</p>
          <div className="flex gap-2 mt-2">
            <Badge variant="outline">{employee.department}</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-red-50/50 border-red-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-800 uppercase">Fitment Gap</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">-{100 - (employee.fitmentScore || 0)}%</p>
            <p className="text-xs text-red-600/70 mt-1">Below target baseline</p>
          </CardContent>
        </Card>

        <Card className="bg-blue-50/50 border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-800 uppercase">Productivity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{employee.productivity || 0}%</p>
            <p className="text-xs text-blue-600/70 mt-1">Consistency score</p>
          </CardContent>
        </Card>

        <Card className="bg-purple-50/50 border-purple-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-800 uppercase">Fatigue Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-600">{employee.fatigueScore || 0}%</p>
            <p className="text-xs text-purple-600/70 mt-1">Stress exposure</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Skill Gap Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Technical Competency</span>
              <span className="text-muted-foreground">{employee.fitmentScore || 0}% Matching</span>
            </div>
            <Progress value={employee.fitmentScore || 0} className="h-2" />
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold text-sm">Recommended Interventions</h4>
              {source === "ai" && <Badge className="bg-purple-100 text-purple-700 border-purple-200">✨ AI Generated</Badge>}
            </div>
            
            {loadingAI ? (
              <div className="flex items-center justify-center p-6 space-x-2 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Analyzing skills and generating recommendations...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {interventions.map((inv, idx) => (
                  <div key={idx} className="p-3 rounded-lg border bg-muted/30">
                    <p className="font-medium text-sm">{inv.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{inv.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
