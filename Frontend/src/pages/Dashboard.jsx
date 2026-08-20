import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import {
  Users,
  Brain,
  Activity,
  Zap,
  AlertTriangle,
  Grid,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";
import { getWorkforceKPIs, getDepartmentDistributions, getAISignals } from "@/lib/workforce-utils";
import { SkeletonKPICard } from "@/components/SkeletonCard";
import { api } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

// Brand palette chart colors
const CHART_COLORS = ["#6A89A7", "#88BDF2", "#053259", "#BDDDFC", "#C8DCF0"];

export default function Dashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const { toast } = useToast();

  const go = (path) => navigate(path);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await api.get("/employees");
        if (response.data.success) {
          setEmployees(response.data.data);
        }
      } catch (error) {
        console.error("Dashboard fetch error:", error);
        toast({
          title: "Error",
          description: "Failed to load live workforce data.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [toast]);

  const kpis = useMemo(() => getWorkforceKPIs(employees), [employees]);
  const deptDist = useMemo(() => getDepartmentDistributions(employees), [employees]);
  const aiSignals = useMemo(() => getAISignals(employees), [employees]);

  const derivedData = useMemo(() => {
    return {
      workforce: {
        value: kpis.totalEmployees,
        topImpacted: employees.slice(0, 3).map(emp => emp.name),
        action: "Review hiring needs in understaffed departments"
      },
      fitment: {
        value: kpis.avgFitment + "%",
        topImpacted: [...employees].sort((a, b) => (a.scores?.fitment || a.fitmentScore || 0) - (b.scores?.fitment || b.fitmentScore || 0)).slice(0, 3).map(emp => emp.name),
        action: "Implement targeted training programs"
      },
      burnout: {
        value: kpis.burnoutRisk + "%",
        topImpacted: employees.filter(emp => (emp.scores?.fatigue || emp.fatigue || 0) >= 75).slice(0, 3).map(emp => emp.name),
        action: "Schedule wellness interventions"
      },
      automation: {
        value: kpis.automationSavings,
        topImpacted: [...employees].sort((a, b) => (b.scores?.automationPotential || 0) - (a.scores?.automationPotential || 0)).slice(0, 3).map(emp => emp.name),
        action: "Prioritize RPA implementation"
      }
    };
  }, [kpis, employees]);

  // Derived chart data
  const fitmentPie = useMemo(() => [
    { name: "Fit/Overfit", value: employees.filter(e => (e.scores?.fitment || e.fitmentScore || 0) >= 70).length },
    { name: "Train-to-Fit", value: employees.filter(e => (e.scores?.fitment || e.fitmentScore || 0) >= 50 && (e.scores?.fitment || e.fitmentScore || 0) < 70).length },
    { name: "Unfit", value: employees.filter(e => (e.scores?.fitment || e.fitmentScore || 0) < 50).length },
  ], [employees]);

  const fatiguePie = useMemo(() => [
    { name: "Low", value: employees.filter(e => (e.scores?.fatigue || e.fatigue || 0) < 50).length },
    { name: "Medium", value: employees.filter(e => (e.scores?.fatigue || e.fatigue || 0) >= 50 && (e.scores?.fatigue || e.fatigue || 0) < 75).length },
    { name: "High", value: employees.filter(e => (e.scores?.fatigue || e.fatigue || 0) >= 75).length },
  ], [employees]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* ── HEADER ── */}
      <div>
        <h1 className="page-title">Workforce Intelligence Command Center</h1>
        <p style={{ color: "#6B8299", marginTop: "6px", fontSize: "14px" }}>
          Live organizational health, risk &amp; optimization intelligence
        </p>
      </div>

      {/* ── KPI HERO STRIP ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px" }}>
        {isLoading ? (
          [0,1,2,3].map(i => <SkeletonKPICard key={i} />)
        ) : (
          <>
            <HeroKPI title="Workforce" value={derivedData.workforce.value} icon={Users} onClick={() => go("/employees")} />
            <HeroKPI title="Fitment Index" value={derivedData.fitment.value} icon={Brain} onClick={() => go("/fitment")} />
            <HeroKPI title="Burnout Risk" value={derivedData.burnout.value} icon={AlertTriangle} onClick={() => go("/fatigue")} />
            <HeroKPI title="Automation" value={derivedData.automation.value} icon={Zap} onClick={() => go("/workforce-intelligence")} />
          </>
        )}
      </div>

      {/* ── VISUAL INTELLIGENCE GRID ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>

        {/* Fitment Health */}
        <ChartCard title="Fitment Health" onClick={() => go("/fitment")}>
          <PieBlock data={fitmentPie} centerLabel={`${kpis.avgFitment}%`} centerSub="avg" />
        </ChartCard>

        {/* Fatigue Risk */}
        <ChartCard title="Fatigue Risk" onClick={() => go("/fatigue")}>
          <PieBlock data={fatiguePie} centerLabel={`${kpis.burnoutRisk}%`} centerSub="at risk" />
        </ChartCard>

        {/* Automation Potential — highlighted */}
        <ChartCard title="Automation Potential" onClick={() => go("/workforce-intelligence")} highlight>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "200px" }}>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#053259", fontWeight: 700, marginBottom: "10px", opacity: 0.7 }}>
                Potential Savings
              </p>
              <p className="automation-savings-value">{kpis.automationSavings}</p>
              <p className="automation-savings-subtitle">Annualized Opportunity</p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginTop: "16px", color: "#6A89A7" }}>
                <TrendingUp size={14} />
                <span style={{ fontSize: "12px", fontWeight: 600 }}>Learn Spaces</span>
                <ChevronRight size={14} />
              </div>
            </div>
          </div>
        </ChartCard>

        {/* Department Distribution */}
        <ChartCard title="Department Distribution (Fitment)" onClick={() => go("/employees")}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={deptDist} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#6B8299" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#6B8299" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "#FFF", border: "1px solid #D4E5F7", borderRadius: "8px", fontSize: "12px", boxShadow: "0 4px 12px rgba(56,73,89,0.1)" }}
                cursor={{ fill: "rgba(136,189,242,0.06)" }}
              />
              <Bar dataKey="fitment" fill="#6A89A7" name="Avg Fitment %" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Utilization by Dept */}
        <ChartCard title="Utilization by Dept." onClick={() => go("/employees")}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={deptDist} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#6B8299" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#6B8299" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "#FFF", border: "1px solid #D4E5F7", borderRadius: "8px", fontSize: "12px", boxShadow: "0 4px 12px rgba(56,73,89,0.1)" }}
                cursor={{ fill: "rgba(189,221,252,0.15)" }}
              />
              <Bar dataKey="utilization" fill="#88BDF2" name="Avg Utilization %" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 6×6 Matrix */}
        <ChartCard title="6×6 Workforce Matrix" onClick={() => go("/six-by-six")}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", paddingTop: "8px" }}>
            {["Critical", "High", "Medium", "Stable", "Strong", "Elite"].map(x => (
              <div
                key={x}
                onClick={(e) => {
                  e.stopPropagation();
                  go(`/six-by-six?level=${x}`);
                }}
                className="matrix-cell"
              >
                {x}
              </div>
            ))}
          </div>
        </ChartCard>

      </div>

      {/* ── AI SIGNALS ── */}
      <div className="ai-signals-card">
        <div className="chart-card-header">
          <span className="chart-card-title">AI Workforce Signals</span>
          <span style={{ fontSize: "11px", color: "#6D8196", fontWeight: 500 }}>Live · Auto-updating</span>
        </div>
        <div>
          {aiSignals.length > 0 ? aiSignals.map((sig, i) => (
            <SignalRow key={i} onClick={() => go(sig.path)}>{sig.message}</SignalRow>
          )) : (
            <div style={{ padding: "20px 22px", fontSize: "14px", color: "#6B8299", fontStyle: "italic" }}>
              No critical signals detected today.
            </div>
          )}
        </div>
      </div>

      {/* ── METRIC DETAIL MODAL ── */}
      <Dialog open={!!selectedMetric} onOpenChange={() => setSelectedMetric(null)}>
        <DialogContent style={{ borderRadius: "14px", border: "1px solid #E6E6E6", boxShadow: "0 20px 60px rgba(0,0,0,0.12)", maxHeight: "90vh", overflowY: "auto" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "#2C2C2C", fontSize: "18px", fontWeight: 600 }}>
              {selectedMetric === 'workforce' && 'Workforce Overview'}
              {selectedMetric === 'fitment' && 'Fitment Index Details'}
              {selectedMetric === 'burnout' && 'Burnout Risk Analysis'}
              {selectedMetric === 'automation' && 'Automation Potential'}
            </DialogTitle>
          </DialogHeader>
          {selectedMetric && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "8px" }}>
              <p style={{ fontSize: "14px", color: "#7A7A7A" }}>
                {selectedMetric === 'workforce' && 'This metric represents the total number of employees in the organization.'}
                {selectedMetric === 'fitment' && 'Fitment Index measures how well employees are matched to their roles based on skills and performance.'}
                {selectedMetric === 'burnout' && 'Burnout Risk indicates the percentage of employees showing high fatigue levels.'}
                {selectedMetric === 'automation' && 'Automation Potential shows estimated annual savings from automating repetitive tasks.'}
              </p>
              <div>
                <h4 style={{ fontWeight: 600, marginBottom: "8px", fontSize: "14px", color: "#4A4A4A" }}>Top 3 Impacted Employees</h4>
                <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
                  {derivedData[selectedMetric].topImpacted.map((name, i) => (
                    <li key={i} style={{ fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#6A89A7", display: "inline-block", flexShrink: 0 }}></span>
                      {name}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 style={{ fontWeight: 600, marginBottom: "6px", fontSize: "14px", color: "#4A4A4A" }}>Suggested Action</h4>
                <p style={{ fontSize: "13px", color: "#6A89A7", fontWeight: 500 }}>{derivedData[selectedMetric].action}</p>
              </div>
              <Button
                style={{ background: "#053259", color: "#fff", borderRadius: "8px", marginTop: "4px" }}
                onClick={() => {
                  setSelectedMetric(null);
                  if (selectedMetric === 'workforce') go('/employees');
                  if (selectedMetric === 'fitment') go('/fitment');
                  if (selectedMetric === 'burnout') go('/fatigue');
                  if (selectedMetric === 'automation') go('/workforce-intelligence');
                }}
              >
                View Details
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}

/* ===== UI SUB-COMPONENTS ===== */

function HeroKPI({ title, value, icon: Icon, onClick }) {
  return (
    <div className="kpi-analytics-card" onClick={onClick}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p className="kpi-metric-label">{title}</p>
          <p className="kpi-metric-value" style={{ marginTop: "10px" }}>{value}</p>
        </div>
        <div className="kpi-icon-container">
          <Icon size={20} style={{ color: "#053259" }} />
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, children, onClick, highlight }) {
  return (
    <div
      className={`chart-analytics-card${highlight ? " automation-savings-panel" : ""}`}
      onClick={onClick}
    >
      <div className="chart-card-header" style={highlight ? { borderBottom: "1px solid #E6E1B0" } : {}}>
        <span className="chart-card-title">{title}</span>
        <Grid size={14} style={{ color: "#88BDF2" }} />
      </div>
      <div className="chart-card-body">{children}</div>
    </div>
  );
}

function PieBlock({ data, centerLabel, centerSub }) {
  return (
    <div style={{ position: "relative" }}>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            innerRadius={52}
            outerRadius={82}
            strokeWidth={2}
            stroke="#F2F7FC"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "#FFF",
              border: "1px solid #E6E6E6",
              borderRadius: "8px",
              fontSize: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      {/* Center label */}
      {centerLabel && (
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
          pointerEvents: "none"
        }}>
          <div style={{ fontSize: "18px", fontWeight: 700, color: "#1E2D3D", lineHeight: 1.1 }}>{centerLabel}</div>
          {centerSub && <div style={{ fontSize: "10px", color: "#6B8299", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: "2px" }}>{centerSub}</div>}
        </div>
      )}
    </div>
  );
}

function SignalRow({ children, onClick }) {
  return (
    <div className="signal-row" onClick={onClick}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <span className="signal-badge">AI INSIGHT</span>
        <p style={{ fontSize: "13.5px", fontWeight: 500, color: "#1E2D3D" }}>{children}</p>
      </div>
      <ChevronRight size={15} style={{ color: "#88BDF2", flexShrink: 0 }} />
    </div>
  );
}
