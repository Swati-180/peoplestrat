import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Brain,
  MessageCircle,
  Users,
  Shield,
  Heart,
  Zap,
  TrendingUp,
  TrendingDown,
  Download,
  Search,
  Filter,
  User,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  Info,
  Lightbulb,
  Target,
  ChevronRight,
} from "lucide-react";
import { employees as initialEmployees, getOverallRisk } from "@/data/mockEmployeeData";
import { useAuth } from "@/lib/auth";
import EmployeeDrawer from "@/components/EmployeeDrawer";
import { api } from "@/services/api";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Softskills() {
  const { user } = useAuth();
  const isEmployee = (user?.role || "").toLowerCase() === "employee";
  const { toast } = useToast();
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
          description: "Could not load soft skills data.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadEmployees();
  }, [toast]);

  const handleExport = (data, filename = "export.csv") => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map(obj => Object.values(obj).join(",")).join("\n");
    const blob = new Blob([`${headers}\n${rows}`], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
    toast({ title: "Export Successful", description: `Data saved to ${filename}` });
  };

  const centralEmployees = useMemo(() => {
    if (isEmployee) {
      return employees.filter(e => e.employeeId === user?.employeeId);
    }
    return employees;
  }, [isEmployee, user, employees]);

  const [search, setSearch] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [activeModal, setActiveModal] = useState(null); // 'summary', 'health', 'trait', 'alert', 'opportunity'
  const [modalData, setModalData] = useState(null);

  // Derived Metrics Logic
  const calculateTraits = (emps) => {
    const total = emps.length || 1;
    const scores = emps.reduce((acc, e) => {
      const skill = e.fitmentScore || e.scores?.fitment || 60;
      const aptitude = e.productivity || e.scores?.productivity || 60;
      const fatigue = e.fatigueScore || e.scores?.fatigue || 0;
      
      acc.communication += skill;
      acc.teamwork += (skill + aptitude) / 2;
      acc.leadership += aptitude;
      acc.empathy += (skill + (100 - fatigue)) / 2;
      acc.stressResilience += 100 - fatigue;
      acc.learningAgility += (skill + 2 * aptitude) / 3;
      return acc;
    }, {
      communication: 0,
      teamwork: 0,
      leadership: 0,
      empathy: 0,
      stressResilience: 0,
      learningAgility: 0
    });

    return {
      communication: Math.round(scores.communication / total),
      teamwork: Math.round(scores.teamwork / total),
      leadership: Math.round(scores.leadership / total),
      empathy: Math.round(scores.empathy / total),
      stressResilience: Math.round(scores.stressResilience / total),
      learningAgility: Math.round(scores.learningAgility / total),
    };
  };

  const traitScores = useMemo(() => calculateTraits(centralEmployees), [centralEmployees]);

  const teamHealth = useMemo(() => {
    const avgScore = Math.round(Object.values(traitScores).reduce((a, b) => a + b, 0) / 6);
    return {
      score: avgScore,
      status: avgScore > 80 ? "Optimized" : avgScore > 60 ? "Stable" : "Critical",
      history: [78, 80, 82, 81, 83], // Mock history for trend
      skills: [
        { name: "Communication", level: traitScores.communication > 80 ? "Strong" : "Standard", color: "bg-blue-500" },
        { name: "Leadership", level: traitScores.leadership > 80 ? "Strong" : "Standard", color: "bg-amber-500" },
        { name: "Empathy", level: traitScores.empathy > 80 ? "Strong" : "Standard", color: "bg-green-500" },
        { name: "Resilience", level: traitScores.stressResilience > 80 ? "Strong" : "Standard", color: "bg-red-500" },
      ]
    };
  }, [traitScores]);

  const traits = useMemo(() => [
    {
      id: "communication",
      name: "Communication",
      score: traitScores.communication,
      benchmark: 78,
      trend: "up",
      icon: MessageCircle,
      definition: "Ability to convey complex information clearly and listen actively across diverse teams.",
      impact: "Low scores lead to misalignment, project delays, and decreased morale.",
      coaching: "Workshops on non-verbal cues and structured feedback loops."
    },
    {
      id: "teamwork",
      name: "Teamwork",
      score: traitScores.teamwork,
      benchmark: 82,
      trend: "up",
      icon: Users,
      definition: "Effective collaboration and contribution towards collective organizational goals.",
      impact: "Poor teamwork creates silos and increases individual burnout.",
      coaching: "Cross-departmental shadowing and team-bonding retrospectives."
    },
    {
      id: "leadership",
      name: "Leadership",
      score: traitScores.leadership,
      benchmark: 75,
      trend: "up",
      icon: Shield,
      definition: "Capability to inspire, guide, and mentor others while taking accountability for outcomes.",
      impact: "Weak leadership results in high turnover and lack of strategic direction.",
      coaching: "Situational leadership coaching and decision-making simulations."
    },
    {
      id: "empathy",
      name: "Empathy",
      score: traitScores.empathy,
      benchmark: 80,
      trend: "up",
      icon: Heart,
      definition: "Understanding and sharing the feelings of colleagues to build psychological safety.",
      impact: "Lack of empathy causes toxic work environments and reduced trust.",
      coaching: "Active listening training and inclusive culture workshops."
    },
    {
      id: "resilience",
      name: "Stress Resilience",
      score: traitScores.stressResilience,
      benchmark: 85,
      trend: "down",
      icon: Zap,
      definition: "Maintaining performance and composure under high-pressure or uncertain conditions.",
      impact: "Low resilience triggers absenteeism and long-term health leaves.",
      coaching: "Mindfulness sessions and workload management training."
    },
    {
      id: "agility",
      name: "Learning Agility",
      score: traitScores.learningAgility,
      benchmark: 80,
      trend: "up",
      icon: Brain,
      definition: "Speed and flexibility in acquiring new skills and adapting to changing environments.",
      impact: "Ignoring agility leads to skill stagnation and technological obsolescence.",
      coaching: "Self-paced learning allowances and experimental project assignments."
    },
  ], [traitScores]);

  const riskSignals = useMemo(() => {
    const highBurnout = centralEmployees.filter(e => (e.fatigueScore || e.scores?.fatigue || 0) > 75);
    const skillGap = centralEmployees.filter(e => (e.fitmentScore || e.scores?.fitment || 0) < 70);
    const lowLeadership = centralEmployees.filter(e => (e.productivity || e.scores?.productivity || 0) < 65);
    const criticalAttrition = centralEmployees.filter(e => (e.fatigueScore || e.scores?.fatigue || 0) > 80 && (e.utilization || e.scores?.utilization || 0) > 85);

    return [
      {
        id: "burnout",
        title: "High Burnout Risk",
        count: highBurnout.length,
        employees: highBurnout,
        color: "bg-red-50 border-red-200 text-red-700 font-bold",
        cause: "Chronic over-utilization (>95%) over the last quarter.",
        severity: "Critical - Requires immediate redistribution of high-intensity tasks.",
        action: "Initiate mandatory 2-day recovery break and reassign urgent vendor reconciliations."
      },
      {
        id: "gap",
        title: "Skill Gap Alert",
        count: skillGap.length,
        employees: skillGap,
        color: "bg-amber-50 border-amber-200 text-amber-700 font-bold",
        cause: "Emerging technological shifts in DevOps and Cloud management.",
        severity: "Medium - Strategic misalignment in Engineering department.",
        action: "Enroll in AWS/GCP certification paths and assign internal mentorship."
      },
      {
        id: "leadership",
        title: "Low Leadership Score",
        count: lowLeadership.length,
        employees: lowLeadership,
        color: "bg-orange-50 border-orange-200 text-orange-700 font-bold",
        cause: "Limited exposure to cross-functional team lead responsibilities.",
        severity: "Observation - Talent stalling at mid-professional level.",
        action: "Schedule Situational Leadership training and assign to lead 1 small-scale internal project."
      },
      {
        id: "attrition",
        title: "Critical Attrition",
        count: criticalAttrition.length,
        employees: criticalAttrition,
        color: "bg-red-100 border-red-300 text-red-900 font-bold",
        cause: "Combined high fatigue and top-tier fitment makes them prime poaching targets.",
        severity: "Immediate - Operational risk to 'Monthly Close' processes.",
        action: "Schedule Retention 1-on-1 and review salary/benefits alignment within 48 hours."
      },
    ];
  }, [centralEmployees]);

  const opportunities = useMemo(() => {
    const promoReady = centralEmployees.filter(e => (e.fitmentScore || e.scores?.fitment || 0) >= 85 && (e.fatigueScore || e.scores?.fatigue || 0) < 60);
    const coachingReq = centralEmployees.filter(e => (e.productivity || e.scores?.productivity || 0) < 80);
    const reassignment = centralEmployees.filter(e => (e.productivity || e.scores?.productivity || 0) > 85 && (e.fitmentScore || e.scores?.fitment || 0) < 75);
    const leadershipPipe = centralEmployees.filter(e => (e.productivity || e.scores?.productivity || 0) > 80 && (e.fitmentScore || e.scores?.fitment || 0) >= 75);

    return [
      {
        id: "promo",
        title: "Promotion Ready",
        count: promoReady.length,
        employees: promoReady,
        color: "border-blue-200 bg-blue-50/50 text-blue-800",
        reason: "Exceptional role fitment and consistent high productivity metrics.",
        nextStep: "Prepare case for Cloud Architect / Lead position promotion."
      },
      {
        id: "coach",
        title: "Coaching Required",
        count: coachingReq.length,
        employees: coachingReq,
        color: "border-blue-200 bg-blue-50/50 text-blue-800",
        reason: "Significant gap between potential aptitude and realized soft skills.",
        nextStep: "Assign Executive Presence coach and schedule monthly progress reviews."
      },
      {
        id: "reassign",
        title: "Role Reassignment",
        count: reassignment.length,
        employees: reassignment,
        color: "border-blue-200 bg-blue-50/50 text-blue-800",
        reason: "High soft-skill proficiency not aligned with current technical requirements.",
        nextStep: "Evaluate move to Client Success or Solutions Engineering tracks."
      },
      {
        id: "pipeline",
        title: "Leadership Pipeline",
        count: leadershipPipe.length,
        employees: leadershipPipe,
        color: "border-blue-200 bg-blue-50/50 text-blue-800",
        reason: "Demonstrated early signs of strategic thinking and mentoring capabilities.",
        nextStep: "Nominate for 'Emerging Leaders' corporate program."
      },
    ];
  }, [centralEmployees]);

  const filteredEmployees = useMemo(() => {
    return centralEmployees.filter(emp =>
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, centralEmployees]);

  const getScoreBadge = (score) => {
    if (score >= 85) return "bg-blue-100 text-blue-700 border-blue-200 font-bold";
    if (score >= 70) return "bg-green-100 text-green-700 border-green-200 font-medium";
    if (score >= 50) return "bg-amber-100 text-amber-700 border-amber-200";
    return "bg-red-100 text-red-700 border-red-200";
  };

  const getScoreLabel = (score) => {
    if (score >= 85) return "EXPERT";
    if (score >= 70) return "PROFICIENT";
    if (score >= 55) return "DEVELOPING";
    return "IMMEDIATE FOCUS";
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 font-['Inter']">
      <div className="max-w-7xl mx-auto space-y-8">
        {isLoading && (
          <div className="fixed inset-0 bg-white/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        )}
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Soft Skills Intelligence</h1>
            <p className="text-slate-500 mt-1">Behavioral assessment and cognitive performance analytics</p>
          </div>
          <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 border-slate-200 text-slate-600 font-bold hover:bg-slate-50 gap-2"
                  onClick={() => handleExport(centralEmployees, "soft-skills-analysis.csv")}
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
            <Button variant="outline" className="border-slate-200 bg-white shadow-sm" onClick={() => setActiveModal('summary')}>
              <Brain className="mr-2 h-4 w-4 text-blue-600" />
              Explain Model
            </Button>
          </div>
        </div>

        {/* AI BEHAVIORAL SUMMARY BANNER */}
        {!isEmployee && (
          <Card
            className="p-8 bg-gradient-to-r from-blue-900 to-slate-900 border-none rounded-2xl shadow-lg text-white cursor-pointer hover:shadow-xl transition-all group relative overflow-hidden"
            onClick={() => setActiveModal('summary')}
          >
            <div className="relative z-10 flex items-center justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Brain className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-blue-300 font-bold tracking-wider text-xs uppercase">MayaMaya Cognitive Engine</span>
                </div>
                <h2 className="text-3xl font-extrabold tracking-tight italic">Workforce Core Capabilities</h2>
                <p className="text-slate-300 max-w-2xl text-lg leading-relaxed">
                  Organizational empathy and communication scores are <span className="text-blue-200 font-bold">8.4% above benchmark</span>. However, stress resilience is trending down in Finance & IT units.
                </p>
                <div className="pt-2 flex items-center gap-4 text-sm font-medium">
                  <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-green-400" /> Strong Cultural Alignment</span>
                  <span className="flex items-center gap-1.5"><AlertTriangle className="h-4 w-4 text-amber-400" /> Resilience Warning</span>
                </div>
              </div>
              <ChevronRight className="h-10 w-10 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </div>
            {/* Visual background element */}
            <div className="absolute right-[-10px] top-[-20px] opacity-[0.05] group-hover:opacity-[0.1] transition-opacity">
              <Brain className="h-64 w-64 text-white" />
            </div>
          </Card>
        )}

        {/* GLOBAL HEALTH & TRAIT CARDS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Team Health Card */}
          <Card
            className="lg:col-span-4 p-8 bg-white border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer group"
            onClick={() => setActiveModal('health')}
          >
            <div className="flex flex-col h-full space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Health Index</h3>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Behavioral Composite</p>
                </div>
                <Badge className={`px-4 py-1 text-xs font-black tracking-tighter ${teamHealth.score > 80 ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                  {teamHealth.status.toUpperCase()}
                </Badge>
              </div>

              <div className="flex-1 flex items-center justify-center py-4">
                <div className="relative">
                  <svg className="w-44 h-44 transform -rotate-90">
                    <circle cx="88" cy="88" r="78" stroke="#F1F5F9" strokeWidth="12" fill="none" />
                    <circle
                      cx="88" cy="88" r="78" stroke="#3B82F6" strokeWidth="12" fill="none"
                      strokeDasharray={`${2 * Math.PI * 78}`}
                      strokeDashoffset={`${2 * Math.PI * 78 * (1 - teamHealth.score / 100)}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-6xl font-black text-slate-900 tracking-tighter">{teamHealth.score}</span>
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Global Pts</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-widest px-1">
                  <span>Traits Overview</span>
                  <span className="text-blue-600">Details →</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {teamHealth.skills.map((s, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between group-hover:bg-white transition-colors">
                      <span className="text-xs font-bold text-slate-700">{s.name}</span>
                      <div className={`w-2 h-2 rounded-full ${s.color}`} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Trait Cards */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {traits.map((trait) => (
              <Card
                key={trait.id}
                className="p-6 bg-white border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group relative overflow-hidden"
                onClick={() => {
                  setActiveModal('trait');
                  setModalData(trait);
                }}
              >
                <div className="flex items-start justify-between mb-8 relative z-10">
                  <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-blue-50 transition-colors">
                    <trait.icon className="h-6 w-6 text-slate-500 group-hover:text-blue-600" />
                  </div>
                  <div className="flex flex-col items-end">
                    <Badge variant="outline" className={`border-none px-1 text-[10px] font-black tracking-widest ${trait.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                      {trait.trend === 'up' ? '▲ GAINING' : '▼ DROPPING'}
                    </Badge>
                  </div>
                </div>

                <div className="relative z-10">
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest leading-none mb-1">{trait.name}</p>
                  <div className="flex items-baseline gap-2">
                    <h4 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{trait.score}%</h4>
                    <span className="text-[10px] font-bold text-slate-300">IND: {trait.benchmark}%</span>
                  </div>
                </div>
                {/* Background icon trace */}
                <trait.icon className="absolute right-[-20px] bottom-[-20px] h-32 w-32 text-slate-50 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Card>
            ))}
          </div>
        </div>

        {/* EMPLOYEE PERFORMANCE TABLE */}
        <Card className="border-slate-200 rounded-2xl shadow-sm overflow-hidden bg-white">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Behavioral Assessment Overview</h2>
              <p className="text-slate-500 text-sm">Granular soft-skill breakdown across workforce</p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search assets..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-10 border-slate-200 w-full"
                />
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow className="border-slate-100 hover:bg-transparent">
                  <TableHead className="font-bold text-slate-700 h-12 uppercase text-[10px] tracking-widest">Asset</TableHead>
                  <TableHead className="font-bold text-slate-700 h-12 uppercase text-[10px] tracking-widest">Comm.</TableHead>
                  <TableHead className="font-bold text-slate-700 h-12 uppercase text-[10px] tracking-widest">Leadership</TableHead>
                  <TableHead className="font-bold text-slate-700 h-12 uppercase text-[10px] tracking-widest">Resilience</TableHead>
                  <TableHead className="font-bold text-slate-700 h-12 uppercase text-[10px] tracking-widest">Adaptability</TableHead>
                  <TableHead className="font-bold text-slate-700 h-12 uppercase text-[10px] tracking-widest text-right">Alignment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((emp) => (
                  <TableRow
                    key={emp.employeeId}
                    className="cursor-pointer hover:bg-slate-50 h-16 transition-colors border-slate-100 group"
                    onClick={() => setSelectedEmployee(emp)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-[10px] text-slate-500 group-hover:border-blue-300 group-hover:bg-white transition-all">
                          {emp.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 leading-none mb-1">{emp.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{emp.position}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1.5 w-24">
                        <Progress value={emp.communication || emp.fitmentScore || 0} className="h-1.5" />
                        <span className="text-[10px] font-black text-slate-400">{emp.communication || emp.fitmentScore || 0}% Proficiency</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`border-none px-2 py-0.5 text-[10px] tracking-tighter ${getScoreBadge(emp.teamwork || emp.productivity || 0)}`}>
                        {getScoreLabel(emp.teamwork || emp.productivity || 0)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${(emp.fatigueScore || 0) < 40 ? 'bg-blue-500' : (emp.fatigueScore || 0) < 70 ? 'bg-amber-500' : 'bg-red-500'}`} />
                        <span className="text-xs font-bold text-slate-700">{100 - (emp.fatigueScore || 0)}% Sustainability</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-bold text-slate-900 tabular-nums">{emp.adaptability || Math.round(((emp.fitmentScore || 0) + (emp.productivity || 0)) / 2)}%</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-1.5 text-blue-600 font-black tracking-tighter text-sm">
                        {emp.fitmentScore || 0}%
                        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:translate-x-1 transition-all" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* RISK SIGNALS & TALENT OPPORTUNITIES */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
          {/* Alerts Card */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              Critical Behavioral Alerts
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {riskSignals.map((signal) => (
                <Card
                  key={signal.id}
                  className={`p-6 border-l-4 rounded-xl shadow-sm hover:shadow-md hover:scale-[1.02] transition-all cursor-pointer group flex flex-col justify-between ${signal.id === 'burnout' || signal.id === 'attrition' ? 'border-l-red-500' : 'border-l-amber-500'} bg-white`}
                  onClick={() => {
                    setActiveModal('alert');
                    setModalData(signal);
                  }}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">{signal.title}</h4>
                      <Badge className={signal.color}>{signal.count}</Badge>
                    </div>
                    <p className="text-sm text-slate-500 font-medium line-clamp-2 italic">"{signal.action}"</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Impact Check →</span>
                    <div className="flex -space-x-2">
                      {signal.employees.slice(0, 3).map((e, i) => (
                        <div key={i} className="w-6 h-6 rounded-lg bg-slate-100 border border-white flex items-center justify-center text-[10px] font-black text-slate-500">
                          {e.name[0]}
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Opportunities Card */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Target className="h-6 w-6 text-blue-600" />
              Strategic Talent Pipeline
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {opportunities.map((opp) => (
                <Card
                  key={opp.id}
                  className="p-6 border rounded-xl shadow-sm hover:shadow-md hover:translate-y-[-4px] transition-all cursor-pointer bg-white group flex flex-col justify-between border-slate-200"
                  onClick={() => {
                    setActiveModal('opportunity');
                    setModalData(opp);
                  }}
                >
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-black text-slate-900 tracking-tight">{opp.title}</h4>
                      <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600 font-black text-xs">
                        {opp.count}
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">{opp.nextStep}</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between relative z-10">
                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Review Candidates →</span>
                    <TrendingUp className="h-4 w-4 text-blue-300 group-hover:text-blue-600 transition-colors" />
                  </div>
                  {/* Subtle highlight bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MODALS */}

      {/* 1. Summary Modal - Explain Model */}
      <Dialog open={activeModal === 'summary'} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">MayaMaya Evaluation Framework</DialogTitle>
            <DialogDescription className="text-slate-500 font-medium">How we measure behavioral intelligence at scale.</DialogDescription>
          </DialogHeader>
          <div className="py-8 space-y-8">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 bg-slate-900 rounded-2xl text-white text-center">
                <p className="text-[10px] font-black text-blue-400 uppercase mb-1">Source data</p>
                <p className="text-xl font-black font-mono tracking-tighter">AI-V1.2</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Update rate</p>
                <p className="text-xl font-black text-slate-900">Weekly</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Confidence</p>
                <p className="text-xl font-black text-green-600">94%</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex gap-4 items-start">
                <div className="p-2 bg-blue-100 rounded-lg shrink-0">
                  <Lightbulb className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Behavioral Vectors</h4>
                  <p className="text-sm text-slate-500 leading-relaxed mt-1">Our model derives soft skills from communication tone (Skill Score), collaborative frequency (Teamwork), and goal-oriented behaviors (Aptitude).</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="p-2 bg-purple-100 rounded-lg shrink-0">
                  <Zap className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Recovery Benchmarking</h4>
                  <p className="text-sm text-slate-500 leading-relaxed mt-1">Sustainability and Resilience scores are negatively correlated with 'Fatigue Velocity' and 'Utilisation Clutter'.</p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-blue-50/50 border border-blue-100 rounded-2xl">
              <h4 className="font-black text-xs text-blue-900 uppercase tracking-widest mb-3">Primary Insights</h4>
              <ul className="space-y-3 text-sm font-medium text-slate-700">
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> High-performing units have 12% lower meeting density.</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Promotion-ready talent scores &gt;85% on Learning Agility.</li>
                <li className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" /> Burnout risk is highest in top 5% of technical performers.</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button className="w-full bg-slate-900 hover:bg-black text-white font-black" onClick={() => setActiveModal(null)}>
              Return to Intelligence Dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. Team Health Detail Modal */}
      <Dialog open={activeModal === 'health'} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">Workforce Health Topology</DialogTitle>
          </DialogHeader>
          <div className="py-8 space-y-8">
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Global Health Index</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl font-black text-slate-900 tracking-tighter">{teamHealth.score}</span>
                  <span className="text-green-600 font-bold">▲ 2.1%</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Evaluation status</p>
                <Badge className="bg-blue-600 text-white font-black px-4 py-1 tracking-widest uppercase text-[10px]">
                  {teamHealth.status}
                </Badge>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Departmental Behavioral Health</h4>
              {[
                { name: "Engineering", score: 82, trend: "Stable" },
                { name: "Finance", score: 68, trend: "At Risk" },
                { name: "IT & Infrastructure", score: 74, trend: "Neutral" },
                { name: "HR & Analytics", score: 91, trend: "Growth" },
              ].map((dept, i) => (
                <div key={i} className="flex items-center justify-between p-4 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors">
                  <span className="font-bold text-slate-900">{dept.name}</span>
                  <div className="flex items-center gap-4">
                    <Progress value={dept.score} className="w-24 h-1.5" />
                    <span className="w-12 text-right font-black text-sm text-slate-700">{dept.score}%</span>
                    <Badge variant="outline" className={`border-none px-0 text-[10px] font-bold ${dept.trend === 'At Risk' ? 'text-red-500' : 'text-blue-500'}`}>
                      {dept.trend.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
              <p className="text-xs text-amber-800/80 font-medium leading-relaxed">
                <span className="font-black">Strategy Recommendation:</span> We noticed a recurring behavioral dip in Finance during 'Monthly Close'. Recommend deploying high-resilience floaters from HR/Analytics during peak cycles.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 3. Trait Deep Dive Modal */}
      <Dialog open={activeModal === 'trait'} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">{modalData?.name} Profile</DialogTitle>
          </DialogHeader>
          <div className="py-8 space-y-8">
            <div className="flex items-center justify-between p-6 bg-slate-900 rounded-2xl text-white">
              <div>
                <p className="text-[10px] font-black text-blue-400 uppercase mb-1">Workforce Avg</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl font-black tracking-tighter tabular-nums">{modalData?.score}%</span>
                  <span className={`text-xs font-bold ${modalData?.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                    {modalData?.trend === 'up' ? '▲' : '▼'} {Math.abs(modalData?.score - (modalData?.benchmark || 0))} pts
                  </span>
                </div>
              </div>
              {modalData?.icon && <modalData.icon className="h-16 w-16 text-blue-500/50" />}
            </div>

            <div className="space-y-6">
              <div className="p-5 border border-slate-100 rounded-2xl bg-slate-50/50">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Info className="h-3 w-3" /> Definition & Scope
                </h4>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">{modalData?.definition}</p>
              </div>

              <div className="p-5 border border-red-100 rounded-2xl bg-red-50/20">
                <h4 className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3" /> Potential Risk Impact
                </h4>
                <p className="text-sm text-red-900/70 font-medium leading-relaxed">{modalData?.impact}</p>
              </div>

              <div className="p-5 border border-green-100 rounded-2xl bg-green-50/20">
                <h4 className="text-[10px] font-black text-green-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Target className="h-3 w-3" /> Suggested Interventions
                </h4>
                <p className="text-sm text-green-900/70 font-medium leading-relaxed italic">"{modalData?.coaching}"</p>
              </div>
            </div>

            <div className="pt-2">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Focus Individuals</h4>
              <div className="grid grid-cols-2 gap-2">
                {centralEmployees.sort((a, b) => (b.fitmentScore || b.scores?.fitment || 0) - (a.fitmentScore || a.scores?.fitment || 0)).slice(0, 4).map((e, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 bg-white shadow-sm">
                    <span>{e.name}</span>
                    <span className="text-blue-600">{e.fitmentScore || e.scores?.fitment || 0}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 4. Alert / Signal Modal */}
      <Dialog open={activeModal === 'alert'} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">{modalData?.title} Detail</DialogTitle>
          </DialogHeader>
          <div className="py-8 space-y-8">
            <div className="p-6 bg-red-100 border border-red-200 rounded-2xl">
              <h4 className="text-[10px] font-black text-red-700 uppercase tracking-widest mb-2">Detected Anomaly</h4>
              <p className="text-xl font-bold text-red-900 leading-tight">{modalData?.cause}</p>
              <div className="mt-4 flex items-center gap-2 text-red-700">
                <Badge variant="outline" className="border-red-400 text-red-800 font-black tracking-widest uppercase text-[10px]">
                  Severity: {modalData?.severity?.split(' ')[0]}
                </Badge>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Impacted Global Assets ({modalData?.count})</h4>
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                {modalData?.employees?.map(emp => (
                  <div key={emp.employeeId} className="flex items-center justify-between p-4 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 border border-red-100 flex items-center justify-center font-bold text-[10px]">
                        {emp.name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm leading-none">{emp.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">{emp.position}</p>
                      </div>
                    </div>
                    <Badge className="bg-white border-slate-200 text-slate-600 font-black text-[10px] tracking-tighter">
                      {emp.fatigueScore || 0}% Fatigue
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 bg-slate-900 rounded-2xl text-white shadow-lg space-y-4">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-400" />
                <h4 className="text-xs font-black text-blue-400 uppercase tracking-widest">Mandatory Executive Action</h4>
              </div>
              <p className="font-bold underline decoration-blue-500 decoration-2 underline-offset-4 text-lg">"{modalData?.action}"</p>
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-xs h-12 shadow-lg shadow-blue-900/20"
                onClick={() => {
                  toast({
                    title: "Protocol Confirmed",
                    description: `Executive action for ${modalData?.title} has been logged and initiated.`,
                  });
                  setActiveModal(null);
                }}
              >
                Confirm Execution Protocol
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 5. Opportunity Pipeline Modal */}
      <Dialog open={activeModal === 'opportunity'} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">{modalData?.title} Review</DialogTitle>
          </DialogHeader>
          <div className="py-8 space-y-8">
            <div className="p-6 bg-blue-900 rounded-2xl text-white">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[10px] font-black text-blue-200 uppercase tracking-widest">Candidate pipeline</h4>
                <Badge className="bg-blue-500 text-white border-none">{modalData?.count}</Badge>
              </div>
              <p className="text-2xl font-black tracking-tight leading-tight">{modalData?.reason}</p>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Qualified Assets</h4>
              <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {modalData?.employees?.map(emp => (
                  <div key={emp.employeeId} className="flex items-center justify-between p-4 border border-slate-100 rounded-2xl hover:border-blue-300 hover:bg-blue-50/30 transition-all cursor-pointer group" onClick={() => {
                    setSelectedEmployee(emp);
                    setActiveModal(null);
                  }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center font-black text-blue-700">
                        {emp.name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm leading-none">{emp.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tight">{emp.department}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge className="bg-green-100 text-green-700 border-green-200 font-black text-[10px] tracking-widest">
                        {emp.fitmentScore || 0}% FITMENT
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Strategic Next Step</h4>
              <div className="flex items-center gap-4 p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <div className="p-3 bg-blue-50 rounded-xl">
                  <ArrowRight className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-sm font-black text-slate-800 italic">"{modalData?.nextStep}"</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button 
                className="h-12 bg-slate-900 font-black text-xs tracking-widest uppercase hover:bg-black"
                onClick={() => {
                  toast({
                    title: "Batch Report Generated",
                    description: `A detailed analysis for all ${modalData?.count} candidates in the ${modalData?.title} pipeline has been sent to your email.`,
                  });
                }}
              >
                View Full Batch
              </Button>
              <Button 
                className="h-12 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs tracking-widest uppercase shadow-lg shadow-blue-100"
                onClick={() => {
                  toast({
                    title: "Workflow Initiated",
                    description: `Automated ${modalData?.title} workflow has been started for ${modalData?.count} assets.`,
                  });
                  setActiveModal(null);
                }}
              >
                Initiate Workflow
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* DRAWER COMPONENT */}
      <EmployeeDrawer
        employee={selectedEmployee}
        onClose={() => setSelectedEmployee(null)}
      />
    </div>
  );
}
