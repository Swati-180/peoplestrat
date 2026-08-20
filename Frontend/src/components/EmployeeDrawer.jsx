import { X, Brain, Wrench, AlertTriangle, ShieldCheck, Zap, Target, TrendingUp, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from "recharts";
import { getOverallRisk, getFitmentBand } from "@/data/mockEmployeeData";
import { useToast } from "@/hooks/use-toast";

export default function EmployeeDrawer({ employee, onClose }) {
  const { toast } = useToast();
  if (!employee) return null;

  // Use database fields with fallbacks
  const communication = employee.communication || employee.fitmentScore || 60;
  const teamwork = employee.teamwork || Math.round(((employee.fitmentScore || 60) + (employee.productivity || 60)) / 2);
  const adaptability = employee.adaptability || employee.productivity || 60;
  const problemSolving = employee.problemSolving || Math.round((communication + 2 * (employee.productivity || 60)) / 3);
  const creativity = employee.creativity || (100 - (employee.fatigueScore || 0));

  const behavioralData = [
    { skill: "Communication", value: communication },
    { skill: "Teamwork", value: teamwork },
    { skill: "Adaptability", value: adaptability },
    { skill: "Problem Solving", value: problemSolving },
    { skill: "Creativity", value: creativity },
  ];

  const avgSoftSkillScore = Math.round((communication + teamwork + adaptability + problemSolving + creativity) / 5);

  const initials = (employee.name || "").split(' ').map(n => n[0]).join('').toUpperCase();
  const risk = getOverallRisk(employee);
  const fitmentBand = getFitmentBand(employee.scores.fitment || 0);

  // Derive Missing Skills logically
  const allPossibleSkills = ["Cloud Architecture", "Leadership", "Advanced SQL", "Public Speaking", "Strategic Planning", "Machine Learning"];
  const establishedHardSkills = employee.skills || [];
  const missingSkills = allPossibleSkills.filter(s => !establishedHardSkills.includes(s)).slice(0, 3);

  // Career Logic
  const nextMilestone = employee.recommendedRole || "Senior Professional";
  let suggestedAction = "Stability";
  if (employee.scores.fatigue > 75) suggestedAction = "Wellness Break & Workload Rebalance";
  else if (employee.scores.fitment < 70) suggestedAction = "Targeted Skill Training";
  else if (employee.scores.fitment >= 85) suggestedAction = "Promotion Path Review";

  // Strategic Insight Logic
  let strategicInsight = "";
  if (employee.scores.utilization > 90 && employee.scores.fatigue > 70) {
    strategicInsight = `${employee.name.split(' ')[0]} is highly utilized but showing significant fatigue markers. Burnout risk is imminent without immediate workload optimization.`;
  } else if (employee.scores.fitment >= 85 && employee.scores.utilization < 70) {
    strategicInsight = `High-potential talent with exceptional fitment scores currently being underutilized. Recommend immediate assignment to high-impact projects.`;
  } else if (employee.scores.fitment < 70) {
    strategicInsight = `Skill alignment gap detected for current role. Focused reskilling in ${missingSkills.join(", ")} could significantly boost productivity.`;
  } else {
    strategicInsight = `${employee.name.split(' ')[0]} is maintaining stable performance metrics with consistent output. Continue current growth trajectory toward ${nextMilestone}.`;
  }

  const getRiskBadge = (r) => {
    switch (r) {
      case "High": return <Badge className="bg-red-100 text-red-800 border-red-200"><AlertTriangle className="h-3 w-3 mr-1" /> HIGH RISK</Badge>;
      case "Medium": return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200"><AlertTriangle className="h-3 w-3 mr-1" /> MEDIUM RISK</Badge>;
      default: return <Badge className="bg-green-100 text-green-800 border-green-200"><ShieldCheck className="h-3 w-3 mr-1" /> LOW RISK</Badge>;
    }
  };

  const handleSendBrief = () => {
    toast({
      title: "Employee Brief Sent",
      description: `A technical and behavioral performance brief for ${employee.name} has been emailed to the department head.`,
    });
  };

  const handleAuditCareer = () => {
    toast({
      title: "Career Path Audit Started",
      description: `Analyzing ${employee.name}'s performance history against the "${nextMilestone}" role requirements. Suggested move: ${suggestedAction}.`,
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />

      {/* Drawer */}
      <div className="relative w-[450px] bg-white h-full shadow-2xl overflow-y-auto flex flex-col font-['Inter'] animate-in slide-in-from-right duration-500">
        {/* Header */}
        <div className="p-6 border-b bg-slate-50">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xs font-black text-slate-400 tracking-widest uppercase">INTEL-PROFILE // V1.28</h1>
            <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex items-center gap-5 mb-6">
            <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg ring-4 ring-blue-50">
              {initials}
            </div>
            <div>
              <p className="font-bold text-xl text-slate-900">{employee.name}</p>
              <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">{employee.position}</p>
              <p className="text-xs text-slate-500 font-medium">{employee.department} • <span className="font-mono">{employee.employeeId}</span></p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {getRiskBadge(risk)}
            <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">{fitmentBand.toUpperCase()}</Badge>
            {employee.tags?.map(tag => (
              <Badge key={tag} className="bg-slate-100 text-slate-600 border-slate-200 font-normal capitalize">
                {tag.replace('-', ' ')}
              </Badge>
            ))}
          </div>
        </div>

        {/* Metric Cards */}
        <div className="p-6 space-y-8">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Fitment</p>
              <p className="text-2xl font-black text-slate-900">{employee.fitmentScore || employee.scores?.fitment || 0}%</p>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Utilization</p>
              <p className="text-2xl font-black text-slate-900">{employee.utilization || employee.scores?.utilization || 0}%</p>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center border-blue-100 bg-blue-50/30">
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-tighter mb-1">Soft Skills Avg</p>
              <p className="text-2xl font-black text-blue-600">{avgSoftSkillScore}%</p>
            </div>
          </div>

          {/* Behavioral Capability Map */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <Brain className="h-4 w-4 text-blue-600" />
              </div>
              <h3 className="font-bold text-slate-900">Behavioral Capability Map</h3>
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={behavioralData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="skill" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Score" dataKey="value" stroke="#2563eb" strokeWidth={2} fill="#2563eb" fillOpacity={0.15} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Technical Competency */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-indigo-100 rounded-lg">
                <Wrench className="h-4 w-4 text-indigo-600" />
              </div>
              <h3 className="font-bold text-slate-900">Technical Competency</h3>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="h-3 w-3 text-green-500" /> Established Hard Skills
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {establishedHardSkills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-100 border-green-100 py-1">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="h-3 w-3 text-red-400" /> Missing / Gap Skills
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {missingSkills.map((skill, index) => (
                    <Badge key={index} variant="outline" className="text-red-500 border-red-200 bg-red-50/50">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Strategic Insight Box */}
          <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden group">
            <Zap className="absolute -right-4 -top-4 h-24 w-24 text-white/5 group-hover:text-blue-500/10 transition-colors" />
            <div className="relative z-10">
              <h4 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-3">Strategic Insight</h4>
              <p className="text-sm font-medium leading-relaxed mb-4">
                {strategicInsight}
              </p>

              <div className="pt-4 border-t border-white/10 space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                    <Target className="h-3 w-3" /> Next Milestone
                  </p>
                  <span className="text-xs font-bold text-blue-400">{nextMilestone}</span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                    <TrendingUp className="h-3 w-3" /> Suggested Action
                  </p>
                  <span className="text-xs font-bold text-green-400">{suggestedAction}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t bg-slate-50 mt-auto">
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 bg-white hover:bg-slate-50 border-slate-200 font-bold text-slate-700"
              onClick={handleSendBrief}
            >
              SEND BRIEF
            </Button>
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-200"
              onClick={handleAuditCareer}
            >
              AUDIT CAREER PATH
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
