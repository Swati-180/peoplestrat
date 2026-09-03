import React, { useMemo } from "react";
import { useWorkforceData } from "@/contexts/WorkforceContext";
import { PageHeader } from "@/components/manager/PageHeader";
import { KpiStrip } from "@/components/manager/KpiStrip";
import { InsightList } from "@/components/manager/InsightList";
import { Loader2, Activity } from "lucide-react";
import { getWorkforceKPIs, getAISignals } from "@/lib/workforce-utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";
import { useLocation } from "wouter";

export default function Dashboard() {
  const { employees, isLoading } = useWorkforceData();
  const [, navigate] = useLocation();

  const kpis = useMemo(() => getWorkforceKPIs(employees || []), [employees]);
  const aiSignals = useMemo(() => getAISignals(employees || []), [employees]);

  if (isLoading) {
    return (
      <div className="p-8 bg-[#FAFAFA] min-h-screen flex justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // 1. KPI Data
  const kpiItems = [
    { label: "Total Workforce", value: kpis.totalEmployees || 0 },
    { label: "High Risk (Flight)", value: employees?.filter(e => e.flightRiskScore >= 70).length || 0, trend: -2 },
    { label: "Critical Skill Gaps", value: employees?.filter(e => (e.scores?.fitment || e.fitmentScore || 0) < 50).length || 0 },
    { label: "Promotion Ready", value: employees?.filter(e => (e.scores?.fitment || e.fitmentScore || 0) > 85).length || 0, trend: 5 }
  ];

  // 2. Attention Required
  const insights = aiSignals.slice(0, 4).map(sig => ({
    title: "System Alert",
    description: sig.message,
    badge: sig.message.toLowerCase().includes('critical') ? { text: 'High', type: 'risk' } : null,
    actionPayload: sig.path
  }));

  // 3. Charts Data
  const deptDist = [
    { name: "Engineering", count: employees?.filter(e => e.department === "Engineering").length || 0 },
    { name: "Sales", count: employees?.filter(e => e.department === "Sales").length || 0 },
    { name: "Marketing", count: employees?.filter(e => e.department === "Marketing").length || 0 },
    { name: "HR", count: employees?.filter(e => e.department === "HR").length || 0 },
  ].filter(d => d.count > 0);

  const fitmentPie = [
    { name: "Fit", value: employees?.filter(e => (e.scores?.fitment || e.fitmentScore || 0) >= 70).length || 0 },
    { name: "Train-to-Fit", value: employees?.filter(e => (e.scores?.fitment || e.fitmentScore || 0) >= 50 && (e.scores?.fitment || e.fitmentScore || 0) < 70).length || 0 },
    { name: "Unfit", value: employees?.filter(e => (e.scores?.fitment || e.fitmentScore || 0) < 50).length || 0 },
  ];

  const CHART_COLORS = ["#10B981", "#F59E0B", "#EF4444"];

  return (
    <div className="p-8 bg-[#FAFAFA] min-h-screen">
      <PageHeader 
        title={
          <span className="flex items-center gap-3">
            <Activity className="w-8 h-8 text-blue-600" /> Executive Dashboard
          </span>
        }
        subtitle="Live organizational health, risk & optimization intelligence"
      />

      <KpiStrip items={kpiItems} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <InsightList 
            title="Attention Required" 
            insights={insights}
            onActionClick={(path) => navigate(path)}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-sm border-gray-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-gray-900">Workforce by Department</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={deptDist} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6B8299" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#6B8299" }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: "rgba(0,0,0,0.05)" }} />
                    <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-gray-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-gray-900">Overall Fitment Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={fitmentPie}
                      dataKey="value"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                    >
                      {fitmentPie.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <Card className="shadow-sm border-gray-100 h-full">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-gray-900">Quick Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                <li className="text-sm text-gray-600 border-l-2 border-blue-500 pl-3">
                  <strong>Automation Potential:</strong> High potential savings identified in Engineering.
                </li>
                <li className="text-sm text-gray-600 border-l-2 border-green-500 pl-3">
                  <strong>Succession:</strong> 3 key positions currently lack ready successors.
                </li>
                <li className="text-sm text-gray-600 border-l-2 border-red-500 pl-3">
                  <strong>Fatigue Risk:</strong> Marketing team showing 15% above-average burnout risk.
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
