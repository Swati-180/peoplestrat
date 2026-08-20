import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Briefcase,
  Building,
  TrendingUp,
  AlertTriangle,
  Target,
  Users,
  Calendar,
  CheckCircle
} from "lucide-react";

const EmployeeProfileCard = ({ employee }) => {
  const getRiskColor = (risk) => {
    switch (risk.toLowerCase()) {
      case "high": return "destructive";
      case "medium": return "secondary";
      case "low": return "outline";
      default: return "outline";
    }
  };

  const getFitmentColor = (score) => {
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-blue-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getFatigueColor = (score) => {
    if (score >= 80) return "text-red-600";
    if (score >= 60) return "text-orange-600";
    if (score >= 40) return "text-yellow-600";
    return "text-green-600";
  };

  return (
    <Card className="w-full rounded-lg border border-slate-200 bg-white shadow-sm">
      <CardContent className="p-4 space-y-3">

        {/* Header: Name, Role, Risk Badge */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="font-semibold text-slate-900 text-sm">{employee.name}</h3>
            <div className="flex items-center gap-1 text-xs text-slate-600">
              <Briefcase className="h-3 w-3" />
              {employee.role}
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Building className="h-3 w-3" />
              {employee.department}
            </div>
          </div>
          <Badge variant={getRiskColor(employee.risk)} className="text-xs shrink-0">
            {employee.risk} Risk
          </Badge>
        </div>

        {/* Key Metrics: 2-column grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Target className="h-3 w-3" />
              Fitment
            </div>
            <div className={`text-sm font-semibold ${getFitmentColor(employee.fitment)}`}>
              {employee.fitment}%
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <AlertTriangle className="h-3 w-3" />
              Fatigue
            </div>
            <div className={`text-sm font-semibold ${getFatigueColor(employee.fatigue)}`}>
              {employee.fatigue}%
            </div>
          </div>
        </div>

        {/* 6×6 Matrix Position */}
        <div className="space-y-1">
          <div className="text-xs text-slate-500 font-medium">6×6 Matrix</div>
          <div className="flex gap-1">
            <Badge variant="outline" className="text-xs px-2 py-0">
              F: {employee.sixBySix.fatigue}
            </Badge>
            <Badge variant="outline" className="text-xs px-2 py-0">
              P: {employee.sixBySix.productivity}
            </Badge>
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="space-y-2">
          <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
            <CheckCircle className="h-3 w-3" />
            AI Recommendations
          </div>
          <ul className="space-y-1">
            {employee.recommendations.slice(0, 2).map((rec, index) => (
              <li key={index} className="text-xs text-slate-700 flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span className="leading-tight">{rec}</span>
              </li>
            ))}
            {employee.recommendations.length > 2 && (
              <li className="text-xs text-slate-500">
                +{employee.recommendations.length - 2} more
              </li>
            )}
          </ul>
        </div>

      </CardContent>
    </Card>
  );
};

export default EmployeeProfileCard;