import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  TrendingUp,
  Activity,
  AlertTriangle,
  Building2,
  BarChart3,
} from "lucide-react";
import { employees as centralEmployees } from "@/data/mockEmployeeData";
import { getWorkforceKPIs } from "@/lib/workforce-utils";

import { WorkDistributionChart } from "@/components/WorkDistributionChart";
import { ProductivityChart } from "@/components/ProductivityChart";
import { FitmentScoreChart } from "@/components/FitmentScoreChart";

export default function Analytics() {
  const kpis = useMemo(() => getWorkforceKPIs(), []);

  const stats = useMemo(() => {
    const total = centralEmployees.length;
    const avgProd = centralEmployees.reduce((sum, e) => sum + e.scores.productivity, 0) / total;
    const avgUtil = centralEmployees.reduce((sum, e) => sum + e.scores.utilization, 0) / total;
    const highPerformers = centralEmployees.filter(e => e.scores.productivity > 85).length;

    return {
      totalEmployees: total,
      avgProductivity: Math.round(avgProd),
      avgUtilization: Math.round(avgUtil),
      highPerformers
    };
  }, []);

  const departmentCount = useMemo(() => {
    return new Set(centralEmployees.map(e => e.department).filter(Boolean)).size;
  }, []);

  const productivityHealth =
    stats.avgProductivity >= 80 ? "Good" :
      stats.avgProductivity >= 60 ? "Moderate" : "At Risk";

  return (
    <div className="space-y-10 font-['Inter']">

      {/* HEADER */}
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Deep workforce insights, trends, and performance analysis from {centralEmployees.length} active nodes.
        </p>
      </div>

      {/* KPI SNAPSHOT */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <KPI title="Total Employees" value={stats.totalEmployees} icon={Users} />
        <KPI title="Avg Productivity" value={`${stats.avgProductivity}%`} icon={TrendingUp} />
        <KPI title="Avg Utilization" value={`${stats.avgUtilization}%`} icon={Activity} />
        <KPI title="Departments Active" value={departmentCount} icon={Building2} />
      </div>

      {/* INSIGHT SUMMARY */}
      <Card className="bg-muted/40 border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Key Analytical Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Insight
            label="Productivity Health"
            value={productivityHealth}
            variant={productivityHealth === "Good" ? "success" : "destructive"}
          />
          <Insight
            label="High Performers Identified"
            value={`${stats.highPerformers} employees`}
          />
          <Insight
            label="Operational Risk"
            value={
              stats.avgUtilization < 60
                ? "Underutilization detected"
                : "Utilization within normal range"
            }
          />
        </CardContent>
      </Card>

      {/* OPERATIONAL ANALYTICS */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Work Distribution Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <WorkDistributionChart />
            <p className="text-xs text-muted-foreground mt-2">
              Aggregated from real process data across all departments.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Productivity Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductivityChart />
            <p className="text-xs text-muted-foreground mt-2">
              Historical productivity tracking derived from performance reviews.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* TALENT ANALYTICS */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Fitment Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <FitmentScoreChart />
          <div className="mt-4 flex gap-3 text-[10px] font-bold uppercase">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-100">Excellent (90–100)</Badge>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100">Good (75–89)</Badge>
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-100">Needs Training (&lt;75)</Badge>
          </div>
        </CardContent>
      </Card>

      {/* INTERPRETATION */}
      <Card className="border-dashed border-slate-300 bg-slate-50/50">
        <CardHeader>
          <CardTitle className="text-slate-700">Strategic Intelligence</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-500">
          <p>• Cross-department productivity variance is currently under ±5%, indicating high standardization.</p>
          <p>• Fitment analysis suggests a potential reskilling opportunity in {centralEmployees[0].department} nodes.</p>
          <p>• Real-time utilization monitoring enables dynamic workforce reallocation.</p>
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------- SMALL COMPONENTS ---------- */

function KPI({ title, value, icon: Icon }) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-default">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{title}</p>
        <Icon className="h-4 w-4 text-blue-600" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-black text-slate-900 tracking-tighter">{value}</div>
      </CardContent>
    </Card>
  );
}

function Insight({ label, value, variant }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
      <span className="font-medium text-slate-600">{label}</span>
      <Badge variant={variant || "secondary"} className="font-bold">{value}</Badge>
    </div>
  );
}
