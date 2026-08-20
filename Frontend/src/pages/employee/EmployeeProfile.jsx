import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import api from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  User, Briefcase, MapPin, Users, Calendar,
  Star, TrendingUp, Award, Brain, Target,
  CheckCircle2, ArrowRight, Zap, Activity
} from "lucide-react";

// Small radar chart for the profile page
function RadarChart({ data, size = 180 }) {
  const n = data.length;
  const cx = size / 2, cy = size / 2, r = size * 0.35;
  const toXY = (i, val) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    return { x: cx + r * (val / 100) * Math.cos(angle), y: cy + r * (val / 100) * Math.sin(angle) };
  };
  const gridPolygons = [0.25, 0.5, 0.75, 1].map(level =>
    Array.from({ length: n }, (_, i) => toXY(i, level * 100)).map(p => `${p.x},${p.y}`).join(" ")
  );
  const spokes = Array.from({ length: n }, (_, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    return { x2: cx + r * Math.cos(angle), y2: cy + r * Math.sin(angle) };
  });
  const valuePoly = data.map((d, i) => toXY(i, d.value)).map(p => `${p.x},${p.y}`).join(" ");

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {gridPolygons.map((p, i) => <polygon key={i} points={p} fill="none" stroke="#E2E8F0" strokeWidth="1" />)}
      {spokes.map((s, i) => <line key={i} x1={cx} y1={cy} x2={s.x2} y2={s.y2} stroke="#E2E8F0" strokeWidth="1" />)}
      <polygon points={valuePoly} fill="rgba(99,102,241,0.15)" stroke="#6366F1" strokeWidth="2" />
      {data.map((d, i) => {
        const p = toXY(i, d.value);
        return <circle key={i} cx={p.x} cy={p.y} r="4" fill="#6366F1" />;
      })}
      {spokes.map((s, i) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        const px = cx + (r + 18) * Math.cos(angle);
        const py = cy + (r + 18) * Math.sin(angle);
        return (
          <text key={i} x={px} y={py} textAnchor="middle" dominantBaseline="middle" fontSize="9" fontWeight="700" fill="#64748B">
            {data[i].label}
          </text>
        );
      })}
    </svg>
  );
}

export default function EmployeeProfile() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [rawEmp, setRawEmp] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.email) { setIsLoading(false); return; }
      try {
        const res = await api.get(`/employees?email=${user.email}`);
        const d = res.data;
        if (d.success && d.data && d.data.length > 0) setRawEmp(d.data[0]);
      } catch (e) {
        console.error("Profile fetch error:", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const profile = useMemo(() => {
    if (!rawEmp) return null;

    const fr = rawEmp.fitmentResponses || {};
    const wh = rawEmp.workingHours || {};
    const pc = rawEmp.processCharacteristics || {};
    const em = rawEmp.employeeMaster || {};

    const score = (v) => {
      if (!v) return 60;
      const s = String(v).toLowerCase();
      if (s.includes("volunteers") || s.includes("consensus") || s.includes("alignment") || s.includes("high") || s.includes("minimal")) return 90;
      if (s.includes("similar") || s.includes("listening") || s.includes("medium")) return 60;
      return 30;
    };

    const comm  = score(fr.communicativeness);
    const adapt = score(fr.changeReadyTechSavviness);
    const lead  = score(fr.multiplexer);
    const collab = score(fr.teamPlayerCollaboration);
    const inno  = score(fr.selfMotivated);
    const fitment = Math.round((comm + adapt + lead + collab + inno) / 5);

    const numericHours = Object.values(wh).filter(v => !isNaN(Number(v)) && v !== "").map(Number);
    const totalHours = numericHours.reduce((s, v) => s + v, 0);
    const utilization = totalHours > 0 ? Math.min(100, Math.round((totalHours / 160) * 100)) : 0;
    const fatigueScore = totalHours > 0 ? Math.min(100, Math.round(((totalHours / 160) * 100) * 0.6)) : 0;

    const hardSkills = pc.coreSkills ? pc.coreSkills.split(",").map(s => s.trim()).filter(Boolean) : [];
    const softSkills = pc.tools ? pc.tools.split(",").map(s => s.trim()).filter(Boolean) : [];

    const name = em.employeeName || user?.username || user?.email?.split("@")[0] || "Employee";
    const currentRole = em.currentRole || pc.designation || "Associate";
    const nextRole = pc.recommendedRole || (fitment > 80 ? "Senior " + currentRole : "Team Lead");
    const futureRole = "Director / Principal";

    return {
      name,
      email: user?.email || "—",
      department: em.department || pc.department || "General",
      manager: em.managerName || "—",
      designation: pc.designation || em.currentRole || "Associate",
      band: em.band || "D2",
      grade: em.grade || "Grade 2",
      location: em.location || "—",
      experience: pc.experience || "—",
      employeeId: em.employeeId || rawEmp._id?.toString().slice(-6).toUpperCase() || "—",
      fitment, utilization, fatigueScore,
      comm, adapt, lead, collab, inno,
      hardSkills, softSkills,
      currentRole, nextRole, futureRole,
      joinDate: em.joiningDate || "—",
      employmentType: em.employmentType || "Full-Time",
    };
  }, [rawEmp, user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 font-medium">Loading profile…</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md p-8 text-center border-indigo-100">
          <User className="h-12 w-12 text-indigo-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">No Profile Yet</h2>
          <p className="text-slate-500 mb-6 text-sm">Complete the Employee Data Form to build your profile.</p>
          <Button className="bg-indigo-600 hover:bg-indigo-700 w-full" onClick={() => navigate("/employee/data-form")}>
            Complete Assessment →
          </Button>
        </Card>
      </div>
    );
  }

  const radarData = [
    { label: "Comm.", value: profile.comm },
    { label: "Lead.", value: profile.lead },
    { label: "Adapt.", value: profile.adapt },
    { label: "Collab.", value: profile.collab },
    { label: "Innov.", value: profile.inno },
  ];

  return (
    <div className="space-y-6 pb-10">
      {/* HEADER HERO */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl font-black text-white shadow-lg">
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-extrabold tracking-tight">{profile.name}</h1>
            <p className="text-indigo-200 text-sm mt-0.5">{profile.designation} · {profile.department}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge className="bg-white/20 text-white border-white/30 text-xs font-semibold">{profile.employmentType}</Badge>
              <Badge className="bg-white/20 text-white border-white/30 text-xs font-semibold">{profile.band}</Badge>
              <Badge className="bg-white/20 text-white border-white/30 text-xs font-semibold">{profile.grade}</Badge>
            </div>
          </div>
          <Button variant="outline" size="sm" className="border-white/30 text-white hover:bg-white/20 flex-shrink-0"
            onClick={() => navigate("/employee/data-form")}>
            Edit Profile
          </Button>
        </div>

        {/* Mini KPIs in hero */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-white/20">
          {[
            { label: "Fitment Score", value: profile.fitment + "%" },
            { label: "Utilization", value: profile.utilization + "%" },
            { label: "Fatigue Score", value: profile.fatigueScore + "%" },
          ].map((item, i) => (
            <div key={i} className="text-center">
              <p className="text-2xl font-black">{item.value}</p>
              <p className="text-indigo-200 text-xs font-semibold mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Basic Info */}
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <User className="h-4 w-4 text-indigo-500" /> Employee Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { icon: Briefcase, label: "Designation", value: profile.designation },
              { icon: Users, label: "Department", value: profile.department },
              { icon: User, label: "Manager", value: profile.manager },
              { icon: MapPin, label: "Location", value: profile.location },
              { icon: Calendar, label: "Employment Type", value: profile.employmentType },
              { icon: Activity, label: "Employee ID", value: profile.employeeId },
            ].map(({ icon: Icon, label, value }, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-3.5 w-3.5 text-slate-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{label}</p>
                  <p className="text-sm font-semibold text-slate-800 truncate">{value || "—"}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Performance Summary */}
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-500" /> Performance Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Role Fitment", value: profile.fitment, color: "bg-blue-500" },
              { label: "Communication", value: profile.comm, color: "bg-indigo-500" },
              { label: "Leadership", value: profile.lead, color: "bg-purple-500" },
              { label: "Adaptability", value: profile.adapt, color: "bg-green-500" },
              { label: "Collaboration", value: profile.collab, color: "bg-amber-500" },
              { label: "Innovation", value: profile.inno, color: "bg-pink-500" },
            ].map(({ label, value, color }, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-600">{label}</span>
                  <span className="font-black text-slate-800">{value}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%`, transition: "width 0.5s ease" }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Skill Radar */}
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-500" /> Skill Radar
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-2">
            <RadarChart data={radarData} size={180} />
          </CardContent>
        </Card>
      </div>

      {/* Skills + Career Progression */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Top Skills */}
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" /> Top Skills
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile.hardSkills.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Technical / Core Skills</p>
                <div className="flex flex-wrap gap-2">
                  {profile.hardSkills.map(s => (
                    <Badge key={s} className="bg-blue-50 text-blue-700 border border-blue-100 font-semibold text-xs">{s}</Badge>
                  ))}
                </div>
              </div>
            )}
            {profile.softSkills.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Tools & Soft Skills</p>
                <div className="flex flex-wrap gap-2">
                  {profile.softSkills.map(s => (
                    <Badge key={s} className="bg-purple-50 text-purple-700 border border-purple-100 font-semibold text-xs">{s}</Badge>
                  ))}
                </div>
              </div>
            )}
            {profile.hardSkills.length === 0 && profile.softSkills.length === 0 && (
              <div className="text-center py-4">
                <p className="text-slate-400 text-sm">No skills recorded yet.</p>
                <Button size="sm" variant="link" className="text-blue-500 text-xs" onClick={() => navigate("/employee/data-form")}>
                  Add your skills →
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Career Progression */}
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Award className="h-4 w-4 text-purple-500" /> Career Progression Path
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative pl-6 space-y-0">
              {[
                { role: profile.futureRole, label: "Future Leadership Role", icon: Star, color: "border-purple-300 bg-purple-50", dot: "bg-purple-500", text: "text-purple-700" },
                { role: profile.nextRole, label: "Next Recommended Role", icon: TrendingUp, color: "border-blue-300 bg-blue-50", dot: "bg-blue-500", text: "text-blue-700" },
                { role: profile.currentRole, label: "Current Role", icon: Briefcase, color: "border-green-300 bg-green-50", dot: "bg-green-500", text: "text-green-700", active: true },
              ].map((step, i) => (
                <div key={i} className="relative flex items-start gap-3 pb-6 last:pb-0">
                  {/* Vertical line */}
                  {i < 2 && (
                    <div className="absolute left-[9px] top-5 w-0.5 h-full bg-slate-200" />
                  )}
                  {/* Dot */}
                  <div className={`relative z-10 flex-shrink-0 w-5 h-5 rounded-full border-2 ${step.dot} border-white mt-1 shadow-sm ring-2 ring-offset-1 ${step.active ? "ring-green-400" : "ring-slate-200"}`} />
                  {/* Content */}
                  <div className={`flex-1 p-3 rounded-xl border ${step.color} ${step.active ? "shadow-sm" : ""}`}>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{step.label}</p>
                    <p className={`font-bold text-sm mt-0.5 ${step.text}`}>{step.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
