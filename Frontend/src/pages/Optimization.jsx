import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  DollarSign,
  Zap,
  Users,
  AlertCircle,
  ArrowUpRight,
  ShieldCheck,
  Loader2
} from "lucide-react";
import { api } from "@/services/api";

/* =================== COMPONENT =================== */
export default function Optimization() {
  const { toast } = useToast();
  const [recommendations, setRecommendations] = useState([]);
  const [totalEmps, setTotalEmps] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const response = await api.get('/optimization/recommendations');
        setRecommendations(response.data.recommendations);
        setTotalEmps(response.data.totalEmployeesAnalysis);
      } catch (err) {
        console.error("Failed to fetch optimizations:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRecommendations();
  }, []);

  const handleInitiate = () => {
    toast({
      title: "Optimization Initiated",
      description: "The selected workforce pipeline has been queued for execution.",
    });
  };

  const totalSavings = useMemo(() => {
    return recommendations.reduce((sum, rec) => {
      // Handle cases like ₹165.0L
      const cleanVal = rec.impact.savings.replace(/[^\d.]/g, '');
      const val = parseFloat(cleanVal) || 0;
      let multiplier = 1;
      if (rec.impact.savings.includes('L')) multiplier = 100000;
      if (rec.impact.savings.includes('M')) multiplier = 1000000;
      if (rec.impact.savings.includes('K')) multiplier = 1000;
      return sum + (val * multiplier);
    }, 0);
  }, [recommendations]);

  const totalEmployees = useMemo(() => {
    return recommendations.reduce((sum, rec) => sum + rec.impact.employees, 0);
  }, [recommendations]);

  return (
    <div className="space-y-10 pb-12 p-6 font-['Inter']">

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Optimization Recommendations
        </h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
          AI-driven workforce actions to reduce cost, risk, and inefficiencies based on current {totalEmps} employee records
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : (
        <>
          {/* EXECUTIVE SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <SummaryCard
          title="Avg Risk Reduction"
          value="30.6%"
          icon={ShieldCheck}
        />
        <SummaryCard
          title="Est. Annual Savings"
          value={`$${(totalSavings / 1000000).toFixed(2)}M`}
          icon={DollarSign}
        />
        <SummaryCard
          title="Automation Potential"
          value="15.5 FTE"
          icon={Zap}
        />
        <SummaryCard
          title="Employees Impacted"
          value={totalEmployees.toString()}
          icon={Users}
        />
      </div>

      {/* OPTIMIZATION CARDS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
            Priority Optimization Actions
          </h2>
          <Badge variant="secondary">
            {recommendations.length} AI Suggestions
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {recommendations.map((rec, idx) => (
            <Card key={idx} className="hover:shadow-md transition bg-white border-slate-200">
              <CardContent className="p-6 space-y-5">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {rec.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {rec.description}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center border-y py-4">
                  <Metric label="Scope" value={`${rec.impact.employees} EMP`} />
                  <Metric
                    label="Savings"
                    value={rec.impact.savings}
                    highlight
                  />
                  <Metric
                    label="Risk ↓"
                    value={`-${rec.impact.riskReduction}`}
                  />
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-2">
                    <AlertCircle size={12} />
                    Data Basis:{" "}
                    <span className="text-slate-700">{rec.basis}</span>
                  </p>
                  <ul className="space-y-2">
                    {rec.actions.map((a, i) => (
                      <li
                        key={i}
                        className="text-sm text-slate-600 flex gap-2"
                      >
                        <span className="w-1.5 h-1.5 mt-2 rounded-full bg-blue-500" />
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>

              <button 
                onClick={handleInitiate}
                className="w-full border-t py-3 text-xs font-semibold uppercase tracking-wide text-blue-600 hover:bg-slate-50 flex items-center justify-center gap-2 transition-colors"
               >
                Initiate Optimization
                <ArrowUpRight size={14} />
              </button>
            </Card>
          ))}
        </div>
      </div>
     </>
    )}
    </div>
  );
}

/* =================== SUB COMPONENTS =================== */

function SummaryCard({ title, value, icon: Icon }) {
  return (
    <Card className="bg-white border-slate-200">
      <CardContent className="p-5 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase text-muted-foreground font-medium">
            {title}
          </p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
        </div>
        <Icon className="w-6 h-6 text-blue-600" />
      </CardContent>
    </Card>
  );
}

function Metric({ label, value, highlight }) {
  return (
    <div>
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p
        className={`text-sm font-bold ${highlight ? "text-blue-600" : "text-slate-800"
          }`}
      >
        {value}
      </p>
    </div>
  );
}
