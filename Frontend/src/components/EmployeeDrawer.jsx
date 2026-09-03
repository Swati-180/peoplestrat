import React, { useState, useEffect } from "react";
import { X, Brain, Wrench, AlertTriangle, ShieldCheck, Zap, Target, TrendingUp, Activity, User, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from "recharts";
import { getOverallRisk, getFitmentBand } from "@/data/mockEmployeeData";
import { StatusBadge } from "@/components/manager/StatusBadge";
import { useToast } from "@/hooks/use-toast";

export default function EmployeeDrawer({ employee, onClose, contextData = {}, defaultTab = "profile" }) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState(defaultTab);
  
  // If the drawer opens from a specific page, respect the defaultTab passed
  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  if (!employee) return null;

  // Shared Data
  const risk = getOverallRisk(employee);
  const fitmentBand = getFitmentBand(employee.scores?.fitment || employee.fitmentScore || 0);
  const initials = (employee.name || "").split(' ').map(n => n[0]).join('').toUpperCase();

  // Behavioral Data
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

  // Missing Skills
  const allPossibleSkills = ["Cloud Architecture", "Leadership", "Advanced SQL", "Public Speaking", "Strategic Planning", "Machine Learning"];
  const establishedHardSkills = employee.skills || [];
  const missingSkills = allPossibleSkills.filter(s => !establishedHardSkills.includes(s)).slice(0, 3);

  // Strategic Insight Logic
  let strategicInsight = "Maintaining stable performance metrics with consistent output.";
  if (employee.scores?.utilization > 90 && employee.scores?.fatigue > 70) {
    strategicInsight = `Highly utilized but showing significant fatigue markers. Burnout risk is imminent without immediate workload optimization.`;
  } else if ((employee.scores?.fitment || employee.fitmentScore) >= 85 && (employee.scores?.utilization || employee.utilization) < 70) {
    strategicInsight = `High-potential talent with exceptional fitment scores currently being underutilized.`;
  } else if ((employee.scores?.fitment || employee.fitmentScore) < 70) {
    strategicInsight = `Skill alignment gap detected for current role. Focused reskilling recommended.`;
  }

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col font-['Inter'] animate-in slide-in-from-right duration-500">
        
        {/* Header */}
        <div className="p-6 border-b bg-gray-50 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xs font-black text-gray-400 tracking-widest uppercase">Employee Intelligence</h1>
            <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md">
              {initials}
            </div>
            <div>
              <p className="font-bold text-lg text-gray-900 leading-tight">{employee.name}</p>
              <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">{employee.position}</p>
              <p className="text-xs text-gray-500 font-medium">{employee.department}</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={risk} type="risk" />
            <StatusBadge status={fitmentBand} type="fitment" />
          </div>
        </div>

        {/* Navigation */}
        <div className="flex border-b overflow-x-auto shrink-0 bg-white px-2">
          {[
            { id: 'profile', icon: User, label: 'Profile' },
            { id: 'flight_risk', icon: ShieldAlert, label: 'Flight Risk' },
            { id: 'fatigue', icon: Activity, label: 'Fatigue' },
            { id: 'skills', icon: Brain, label: 'Skills' },
            { id: 'fitment', icon: Target, label: 'Fitment' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors
                ${activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'}
              `}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-white space-y-6">
          
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-center">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter mb-1">Fitment</p>
                  <p className="text-2xl font-black text-gray-900">{employee.fitmentScore || employee.scores?.fitment || 0}%</p>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-center">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter mb-1">Utilization</p>
                  <p className="text-2xl font-black text-gray-900">{employee.utilization || employee.scores?.utilization || 0}%</p>
                </div>
              </div>

              <div className="bg-slate-900 rounded-xl p-5 text-white shadow-lg relative overflow-hidden">
                <Zap className="absolute -right-4 -top-4 h-24 w-24 text-white/5" />
                <h4 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-2">Strategic Insight</h4>
                <p className="text-sm leading-relaxed">{strategicInsight}</p>
              </div>
            </div>
          )}

          {activeTab === 'flight_risk' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-red-50 border border-red-100 rounded-xl p-5">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-red-900">Risk Assessment</h3>
                  <StatusBadge status={contextData.risk?.riskLevel || risk} type="risk" />
                </div>
                
                <p className="text-3xl font-black text-red-700 mb-2">{contextData.risk?.flightRiskScore || 0}%</p>
                <p className="text-xs text-red-600/80 font-medium uppercase tracking-wide">Flight Risk Score</p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500" /> Key Drivers
                </h4>
                {contextData.risk?.flightRiskFactors?.length > 0 ? (
                  <ul className="space-y-2">
                    {contextData.risk.flightRiskFactors.map((factor, i) => (
                      <li key={i} className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md border border-gray-100">
                        {factor}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 italic">No specific risk drivers identified.</p>
                )}
              </div>

              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-500" /> Recommended Actions
                </h4>
                {contextData.risk?.actionItems?.length > 0 ? (
                  <ul className="space-y-2">
                    {contextData.risk.actionItems.map((action, i) => (
                      <li key={i} className="text-sm text-gray-600 bg-blue-50/50 p-3 rounded-md border border-blue-100">
                        {action.action.replace('[Flight Risk] ', '')}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 italic">No actions recommended at this time.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'fatigue' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-orange-50 border border-orange-100 rounded-xl p-5">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-orange-900">Fatigue & Burnout</h3>
                  <StatusBadge status={employee.fatigueScore >= 75 ? 'High' : employee.fatigueScore >= 50 ? 'Medium' : 'Low'} type="risk" />
                </div>
                <p className="text-3xl font-black text-orange-700 mb-2">{employee.fatigueScore || employee.scores?.fatigue || 0}%</p>
                <p className="text-xs text-orange-600/80 font-medium uppercase tracking-wide">Fatigue Score</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 mb-1">Workload Intensity</p>
                  <p className="text-lg font-bold text-gray-900">{contextData.fatigue?.workloadIntensity || 'Average'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 mb-1">Recent Overtime</p>
                  <p className="text-lg font-bold text-gray-900">{contextData.fatigue?.overtimeIndex || 'Normal'}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'skills' && (
            <div className="space-y-6 animate-in fade-in duration-300">
               <div>
                <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-500" /> Behavioral Matrix
                </h4>
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 shadow-sm">
                  <ResponsiveContainer width="100%" height={200}>
                    <RadarChart data={behavioralData}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="skill" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }} />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar name="Score" dataKey="value" stroke="#8b5cf6" strokeWidth={2} fill="#8b5cf6" fillOpacity={0.15} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-blue-500" /> Hard Skills Map
                </h4>
                <div className="flex flex-wrap gap-2">
                  {establishedHardSkills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-orange-500" /> Identified Gaps
                </h4>
                <div className="flex flex-wrap gap-2">
                  {missingSkills.map((skill, index) => (
                    <Badge key={index} variant="outline" className="text-orange-700 border-orange-200 bg-orange-50/50">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'fitment' && (
             <div className="space-y-6 animate-in fade-in duration-300">
               <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-blue-900">Role Fitment</h3>
                  <StatusBadge status={fitmentBand} type="fitment" />
                </div>
                <p className="text-3xl font-black text-blue-700 mb-2">{employee.fitmentScore || employee.scores?.fitment || 0}%</p>
                <p className="text-xs text-blue-600/80 font-medium uppercase tracking-wide">Alignment Score</p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4 text-green-500" /> Key Strengths
                </h4>
                <ul className="space-y-2">
                  <li className="text-sm text-gray-600 bg-green-50 p-3 rounded-md border border-green-100">
                    Exceeds baseline productivity metrics for {employee.position}.
                  </li>
                  <li className="text-sm text-gray-600 bg-green-50 p-3 rounded-md border border-green-100">
                    Strong behavioral alignment in Teamwork and Adaptability.
                  </li>
                </ul>
              </div>
             </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t bg-gray-50 mt-auto shrink-0">
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                toast({ title: "Email Sent", description: `Performance brief sent to manager.` });
              }}
            >
              Email Brief
            </Button>
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                toast({ title: "Audit Started", description: `Initiating career audit for ${employee.name}.` });
              }}
            >
              Audit Career
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Ensure the icon import works for ShieldAlert since it wasn't in original
import { ShieldAlert } from "lucide-react";
