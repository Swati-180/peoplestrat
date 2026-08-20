import React, { useState, useEffect } from "react";
import { api } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  AlertTriangle, Zap, Clock, Activity, ShieldCheck, 
  Info, Bell, Loader2, Sparkles, AlertCircle, Heart 
} from "lucide-react";

export default function FatigueWellbeing() {
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/employee/me/fatigue");
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (err) {
        toast({ title: "Error", description: "Could not load wellbeing data.", variant: "destructive" });
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

  const getStatusConfig = (score) => {
    if (score >= 75) return { label: 'CRITICAL', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', icon: AlertTriangle };
    if (score >= 50) return { label: 'WARNING', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', icon: AlertCircle };
    return { label: 'HEALTHY', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', icon: ShieldCheck };
  };

  const status = getStatusConfig(data.fatigueScore);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
            Fatigue & Wellbeing
            <Badge className={`${status.bg} ${status.color} ${status.border} border border-none shadow-none`}>
              {status.label}
            </Badge>
          </h1>
          <p className="text-muted-foreground mt-2">Personal workload balance and mental health markers</p>
        </div>
        <div className="flex items-center gap-2 p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
          <Clock className="h-5 w-5 text-indigo-500" />
          <span className="text-sm font-bold text-slate-600">{data.overtimeHours} Overtime Hours this month</span>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Fatigue Gauge Card */}
        <Card className="shadow-lg border-none bg-gradient-to-b from-white to-slate-50/50">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Activity className="h-5 w-5 text-rose-500" />
              Fatigue Level
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <div className="relative h-48 w-48 flex items-center justify-center">
              <svg className="h-full w-full transform -rotate-90">
                <circle
                  cx="50%"
                  cy="50%"
                  r="70"
                  fill="none"
                  stroke="#f1f5f9"
                  strokeWidth="12"
                />
                <circle
                  cx="50%"
                  cy="50%"
                  r="70"
                  fill="none"
                  stroke={data.fatigueScore > 70 ? "#ef4444" : data.fatigueScore > 40 ? "#f59e0b" : "#10b981"}
                  strokeWidth="12"
                  strokeDasharray={`${2 * Math.PI * 70}`}
                  strokeDashoffset={`${2 * Math.PI * 70 * (1 - data.fatigueScore / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-black text-slate-800">{data.fatigueScore}</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Score</span>
              </div>
            </div>
            <div className={`mt-6 px-6 py-2 rounded-full text-sm font-bold flex items-center gap-2 ${status.bg} ${status.color}`}>
              <status.icon size={16} />
              {data.riskLevel}
            </div>
          </CardContent>
        </Card>

        {/* Breakdown Stats */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatCard 
              label="Workload Utilization" 
              value={`${data.utilizationPct}%`} 
              icon={Zap} 
              color="text-amber-500"
              bg="bg-amber-50"
              progress={data.utilizationPct}
            />
            <StatCard 
              label="Recovery Capacity" 
              value={`${100 - data.fatigueScore}%`} 
              icon={Heart} 
              color="text-emerald-500" 
              bg="bg-emerald-50"
              progress={100 - data.fatigueScore}
            />
          </div>

          <Card className="border-none shadow-md overflow-hidden">
            <CardHeader className="bg-slate-900 text-white py-4 px-6 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold tracking-wider flex items-center gap-2">
                <Bell size={16} className="text-amber-400" />
                PERSONALIZED WELLBEING ALERTS
              </CardTitle>
              <Sparkles size={16} className="text-blue-400 opacity-50" />
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {data.alerts.map((alert, i) => (
                  <div key={i} className="p-5 flex items-start gap-4 hover:bg-slate-50 transition-colors">
                    <div className={`mt-1 p-2 rounded-xl border ${
                      alert.type === 'critical' ? 'bg-red-50 text-red-600 border-red-100' : 
                      alert.type === 'warning' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                      'bg-blue-50 text-blue-600 border-blue-100'
                    }`}>
                      {alert.type === 'critical' ? <AlertTriangle size={18} /> : 
                       alert.type === 'warning' ? <AlertCircle size={18} /> : <Info size={18} />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 mb-1 capitalize">{alert.type} Notice</p>
                      <p className="text-sm text-slate-600 leading-relaxed font-medium">{alert.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Deep Insights */}
      <h2 className="text-xl font-bold text-slate-800 px-1 mt-10">Advanced Predictive Markers</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <InsightBlock 
          label="Performance Decline Correlation" 
          value={`${data.performanceDecline}%`} 
          desc="Risk of output quality dropping due to persistent fatigue levels"
          color="text-rose-500"
        />
        <InsightBlock 
          label="Workload Intensity Index" 
          value={data.workloadIntensity} 
          desc="Complexity and stakeholder pressure relative to peer average"
          color="text-indigo-500"
        />
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, bg, progress }) {
  return (
    <Card className="border-none shadow-sm overflow-hidden group">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-2xl ${bg} ${color}`}>
            <Icon size={20} strokeWidth={2.5} />
          </div>
          <span className={`text-2xl font-black ${color}`}>{value}</span>
        </div>
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">{label}</p>
        <Progress value={progress} className="h-2 bg-slate-100" />
      </CardContent>
    </Card>
  );
}

function InsightBlock({ label, value, desc, color }) {
  return (
    <div className="flex gap-4 p-6 bg-white rounded-3xl shadow-sm border border-slate-100 hover:border-blue-200 transition-colors">
      <div className="flex flex-col items-center justify-center min-w-[70px]">
        <span className={`text-2xl font-black ${color}`}>{value}</span>
        <div className={`h-1 w-full mt-2 rounded-full ${color.replace('text-', 'bg-')} opacity-30`} />
      </div>
      <div>
        <h4 className="font-bold text-slate-800 text-sm mb-1">{label}</h4>
        <p className="text-xs text-slate-500 leading-relaxed font-medium">{desc}</p>
      </div>
    </div>
  );
}
