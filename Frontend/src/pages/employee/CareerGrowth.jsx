import React, { useState, useEffect } from "react";
import { api } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer
} from "recharts";
import { 
  Rocket, Waypoints, Award, Target, ChevronRight, 
  CheckCircle2, Circle, Star, Sparkles, Loader2, BarChart3,
  User, Mail, MapPin, Zap, AlertTriangle, Brain, Briefcase
} from "lucide-react";

export default function CareerGrowth() {
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/employee/me/career");
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (err) {
        toast({ title: "Error", description: "Could not load career growth data.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-10 font-['Inter'] print-container">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
            Career Growth & Pathing
            <Badge className="bg-indigo-50 text-indigo-700 border-none px-3 py-1 text-xs font-black uppercase">
              {data.talentCategory}
            </Badge>
          </h1>
          <p className="text-muted-foreground mt-2">Personalized promotion readiness and skill benchmarks</p>
        </div>
        <div className="flex gap-4">
           <Button 
            className="bg-blue-600 hover:bg-blue-700 font-bold px-6 py-2 rounded-xl shadow-lg shadow-blue-100 transition-all hover:scale-[1.02] flex items-center gap-2 no-print"
            onClick={() => window.print()}
          >
            Download Career Growth PDF
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
            {/* Employee Overview Card (Visible in PDF) */}
            <Card className="border-none shadow-sm bg-white p-6 border-l-4 border-l-blue-600">
                <div className="flex flex-wrap gap-8 items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-50 rounded-xl">
                            <User className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Employee Name</p>
                            <p className="text-lg font-bold text-slate-800">{data.name}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-50 rounded-xl">
                            <Briefcase className="h-6 w-6 text-indigo-600" aria-hidden="true" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Role & Dept</p>
                            <p className="text-sm font-bold text-slate-700">{data.position} · {data.department}</p>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Stats Cluster */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <GrowthMetric label="Fitment Score" value={data.fitmentScore} color="text-blue-600" icon={Target} />
                <GrowthMetric label="Performance" value={data.performanceScore} color="text-emerald-600" icon={Award} />
                <GrowthMetric label="Utilization" value={data.utilization} color="text-amber-600" icon={Zap} />
                <GrowthMetric label="Fatigue Risk" value={data.fatigueScore} color={data.fatigueScore > 70 ? "text-red-600" : "text-slate-600"} icon={AlertTriangle} />
            </div>

            {/* Career Path Visualization */}
            <Card className="border-none shadow-md overflow-hidden bg-white">
                <CardHeader className="border-b border-slate-50 px-8 py-6">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Waypoints className="h-5 w-5 text-indigo-500" />
                    Standard Career Pathway
                </CardTitle>
                </CardHeader>
                <CardContent className="px-8 py-10">
                <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-12 md:gap-4">
                    <div className="absolute top-4 md:top-1/2 left-4 md:left-0 w-1 md:w-full h-full md:h-1 bg-slate-100 -translate-y-1/2 hidden md:block" />
                    
                    {data.careerPath.map((step, i) => (
                    <div key={i} className="relative z-10 flex flex-row md:flex-col items-center gap-4 md:gap-3 text-center w-full md:w-auto">
                        <div className={`h-10 w-10 rounded-2xl shadow-md flex items-center justify-center border-4 border-white transition-all transform hover:scale-110 ${
                        step.status === 'completed' ? 'bg-emerald-500 text-white' : 
                        step.status === 'current' ? 'bg-blue-600 text-white ring-4 ring-blue-50' : 
                        'bg-white text-slate-300'
                        }`}>
                        {step.status === 'completed' ? <CheckCircle2 size={18} /> : 
                        step.status === 'current' ? <Star size={18} className="fill-white" /> : <Circle size={18} />}
                        </div>
                        <div>
                        <h4 className={`text-sm font-bold ${step.status === 'locked' ? 'text-slate-400' : 'text-slate-800'}`}>{step.title}</h4>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{step.status}</p>
                        </div>
                    </div>
                    ))}
                </div>
                </CardContent>
            </Card>

            <Card className="shadow-lg border-none overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-blue-600 to-indigo-600" />
                <CardHeader>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-500" />
                    Road to: {data.nextRole}
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                            <p className="text-sm text-indigo-700 font-medium leading-relaxed italic">
                                "{data.recommendation}"
                            </p>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Requirement Checklist</h4>
                            {data.nextRoleRequirements.map((req, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-1 rounded-full ${req.met ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-300'}`}>
                                            <CheckCircle2 size={16} />
                                        </div>
                                        <span className={`text-sm font-semibold ${req.met ? 'text-slate-700' : 'text-slate-400'}`}>
                                            {req.skill}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100 h-full">
                             <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Competency Radar</p>
                             <div className="h-[250px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data.radarData}>
                                        <PolarGrid stroke="#e2e8f0" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} />
                                        <Radar
                                            name="Competency"
                                            dataKey="A"
                                            stroke="#3b82f6"
                                            fill="#3b82f6"
                                            fillOpacity={0.4}
                                        />
                                    </RadarChart>
                                </ResponsiveContainer>
                             </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>

        <div className="space-y-8">
            <div className="bg-white p-6 rounded-3xl shadow-xl shadow-indigo-50 border border-indigo-50 flex items-center gap-4">
                <div className="p-3 bg-indigo-500 rounded-2xl text-white shadow-lg shadow-indigo-200">
                    <Rocket size={24} />
                </div>
                <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Promotion Readiness</p>
                    <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-slate-800">{data.promotionReadiness}%</span>
                    <span className="text-xs font-bold text-emerald-500 flex items-center gap-0.5">
                        <Target size={12} /> Target 80%
                    </span>
                    </div>
                </div>
            </div>

            <Card className="shadow-lg border-none ring-1 ring-slate-100 overflow-hidden">
                <CardHeader>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-emerald-500" />
                    Benchmarks vs Peers
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                    <BenchmarkRow label="Technical Skill Proficiency" value={82} target={85} />
                    <BenchmarkRow label="Operational Efficiency" value={91} target={80} />
                    <BenchmarkRow label="Stakeholder Feedback" value={76} target={90} />
                    <BenchmarkRow label="Training Compliance" value={100} target={100} />
                </CardContent>
            </Card>
            
            <Card className="bg-slate-900 text-white p-6 rounded-3xl border-none">
                <h4 className="font-bold flex items-center gap-2 mb-4">
                    <Brain className="h-5 w-5 text-blue-400" />
                    Career Insight
                </h4>
                <p className="text-sm text-slate-400 leading-relaxed mb-6">
                    Based on your high performance and fitment scores, you are tracking well for a promotion within the next 4-6 months. Focus on "Strategic Planning" to bridge your final gap.
                </p>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 font-bold no-print" onClick={() => window.location.href='/employee/career-coach'}>
                    Talk to Career Coach
                </Button>
            </Card>
        </div>
      </div>
    </div>
  );
}

function GrowthMetric({ label, value, color, icon: Icon }) {
  return (
    <Card className="border-none shadow-sm overflow-hidden p-6 bg-white hover:bg-slate-50 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">{label}</p>
        <Icon size={16} className={color} />
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-black text-slate-800">{value}%</span>
      </div>
      <div className="mt-4 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color.replace('text-', 'bg-')} transition-all`} style={{ width: `${value}%` }} />
      </div>
    </Card>
  );
}

function BenchmarkRow({ label, value, target }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
        <span className="text-slate-500">{label}</span>
        <span className="text-slate-800">{value}% <span className="text-slate-300">/ {target}%</span></span>
      </div>
      <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className="absolute top-0 left-0 h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${value}%` }} />
        <div className="absolute top-0 h-full w-0.5 bg-slate-400 opacity-30 z-10" style={{ left: `${target}%` }} />
      </div>
    </div>
  );
}
