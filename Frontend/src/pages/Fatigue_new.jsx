
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Brain,
  TrendingDown,
  TrendingUp,
  ArrowRight,
  ChevronRight,
  Users,
  Clock,
  Activity,
  Heart,
  AlertTriangle,
  Target,
  Zap,
  DollarSign,
} from "lucide-react";

// Mock data for Fatigue Intelligence
const fatigueMetrics = {
  overallScore: 68,
  riskLevel: "MEDIUM",
  trend: -5,
};

const keyIndicators = [
  {
    title: "Workload Intensity",
    value: 76,
    change: 12,
    changeType: "up",
    icon: Target,
  },
  {
    title: "Overtime Frequency",
    value: 64,
    change: 8,
    changeType: "up",
    icon: Clock,
  },
  {
    title: "Focus Consistency",
    value: 58,
    change: -15,
    changeType: "down",
    icon: Activity,
  },
  {
    title: "Stress Signals",
    value: 71,
    change: 9,
    changeType: "up",
    icon: Heart,
  },
];

const employeeRisks = [
  {
    name: "Robert Taylor",
    role: "DevOps Engineer",
    workload: 98,
    stress: 85,
    overtime: 15,
    focusDrop: 25,
    fatigueScore: 92,
    burnoutRisk: "CRITICAL",
  },
  {
    name: "Emma Rodriguez",
    role: "Support Lead",
    workload: 92,
    stress: 88,
    overtime: 12,
    focusDrop: 20,
    fatigueScore: 88,
    burnoutRisk: "CRITICAL",
  },
  {
    name: "Sarah Johnson",
    role: "Senior Engineer",
    workload: 85,
    stress: 75,
    overtime: 8,
    focusDrop: 15,
    fatigueScore: 78,
    burnoutRisk: "HIGH",
  },
  {
    name: "Mike Chen",
    role: "Product Manager",
    workload: 78,
    stress: 70,
    overtime: 6,
    focusDrop: 10,
    fatigueScore: 72,
    burnoutRisk: "HIGH",
  },
  {
    name: "James Wilson",
    role: "Data Analyst",
    workload: 65,
    stress: 55,
    overtime: 4,
    focusDrop: 8,
    fatigueScore: 58,
    burnoutRisk: "MEDIUM",
  },
];

const teamFatigue = [
  {
    team: "Support Team",
    fatigue: 82,
    risk: "CRITICAL",
  },
  {
    team: "Product Team",
    fatigue: 76,
    risk: "HIGH",
  },
  {
    team: "Finance",
    fatigue: 68,
    risk: "MEDIUM",
  },
  {
    team: "Engineering",
    fatigue: 62,
    risk: "MEDIUM",
  },
];

const wellbeingSignals = [
  {
    title: "High Burnout Risk",
    count: 12,
    color: "red",
  },
  {
    title: "Low Engagement",
    count: 24,
    color: "yellow",
  },
  {
    title: "High Stress Exposure",
    count: 31,
    color: "orange",
  },
  {
    title: "Low Recovery Time",
    count: 19,
    color: "purple",
  },
];

const recommendedActions = [
  {
    title: "Enforce No-Meeting Days",
    fteImpact: "2.5 FTE",
    fatigueReduction: "15%",
    productivityGain: "8%",
    cost: "$12K",
  },
  {
    title: "Rotate On-Call Duties",
    fteImpact: "1.8 FTE",
    fatigueReduction: "12%",
    productivityGain: "6%",
    cost: "$8K",
  },
  {
    title: "Reduce Overtime Threshold",
    fteImpact: "3.2 FTE",
    fatigueReduction: "18%",
    productivityGain: "10%",
    cost: "$15K",
  },
  {
    title: "Add Recovery Breaks",
    fteImpact: "1.5 FTE",
    fatigueReduction: "10%",
    productivityGain: "5%",
    cost: "$6K",
  },
  {
    title: "Manager Coaching Program",
    fteImpact: "4.0 FTE",
    fatigueReduction: "22%",
    productivityGain: "12%",
    cost: "$20K",
  },
];

export default function Fatigue() {
  const getRiskColor = (risk) => {
    switch (risk) {
      case "CRITICAL": return "bg-red-50 border-red-200";
      case "HIGH": return "bg-yellow-50 border-yellow-200";
      case "MEDIUM": return "bg-blue-50 border-blue-200";
      case "LOW": return "bg-green-50 border-green-200";
      default: return "bg-gray-50 border-gray-200";
    }
  };

  const getRiskTextColor = (risk) => {
    switch (risk) {
      case "CRITICAL": return "text-red-800";
      case "HIGH": return "text-yellow-800";
      case "MEDIUM": return "text-blue-800";
      case "LOW": return "text-green-800";
      default: return "text-gray-800";
    }
  };

  const getSignalColor = (color) => {
    switch (color) {
      case "red": return "bg-red-100 border-red-300";
      case "yellow": return "bg-yellow-100 border-yellow-300";
      case "orange": return "bg-orange-100 border-orange-300";
      case "purple": return "bg-purple-100 border-purple-300";
      default: return "bg-gray-100 border-gray-300";
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 font-['Inter']">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* TOP BANNER */}
        <Card className="p-6 bg-gradient-to-r from-[#7C3AED] to-[#A855F7] border-[#E5E7EB] rounded-xl shadow-sm text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">AI Fatigue Summary</h1>
              <p className="mt-2 text-purple-100">
                18% of workforce approaching burnout. 12 employees require immediate intervention.
              </p>
            </div>
            <ChevronRight className="h-8 w-8 text-purple-200" />
          </div>
        </Card>

        {/* HEALTH INDEX */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-6 bg-white border-[#E5E7EB] rounded-xl shadow-sm">
            <div className="flex items-center gap-6">
              <div className="relative">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="#E5E7EB"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="#7C3AED"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - fatigueMetrics.overallScore / 100)}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-semibold text-[#0F172A]">{fatigueMetrics.overallScore}</div>
                    <div className="text-xs text-[#64748B]">/ 100</div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#0F172A]">Health Index</h3>
                <p className="text-[#64748B]">{fatigueMetrics.riskLevel} Risk</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium text-red-600">{fatigueMetrics.trend} pts</span>
                </div>
              </div>
            </div>
          </Card>

          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            {keyIndicators.map((indicator, index) => (
              <Card key={index} className="p-4 bg-white border-[#E5E7EB] rounded-xl shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <indicator.icon className="h-5 w-5 text-[#64748B]" />
                  <Badge className={`text-xs font-medium ${
                    indicator.changeType === 'up' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {indicator.changeType === 'up' ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                    {indicator.change}%
                  </Badge>
                </div>
                <p className="text-sm text-[#64748B] font-medium">{indicator.title}</p>
                <p className="text-xl font-semibold text-[#0F172A]">{indicator.value}%</p>
              </Card>
            ))}
          </div>
        </div>

        {/* EMPLOYEE FATIGUE RISK MATRIX */}
        <Card className="p-6 bg-white border-[#E5E7EB] rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold text-[#0F172A] mb-6">Employee Fatigue Risk Matrix</h2>
          <table className="w-full text-sm">
            <thead className="bg-[#F8FAFC]">
              <tr className="border-b border-[#E5E7EB]">
                <th className="p-3 text-left font-medium text-[#0F172A]">Employee</th>
                <th className="p-3 font-medium text-[#0F172A]">Role</th>
                <th className="p-3 font-medium text-[#0F172A]">Workload %</th>
                <th className="p-3 font-medium text-[#0F172A]">Stress</th>
                <th className="p-3 font-medium text-[#0F172A]">Overtime</th>
                <th className="p-3 font-medium text-[#0F172A]">Focus Drop</th>
                <th className="p-3 font-medium text-[#0F172A]">Fatigue Score</th>
                <th className="p-3 font-medium text-[#0F172A]">Burnout Risk</th>
                <th className="p-3 font-medium text-[#0F172A]">Action</th>
              </tr>
            </thead>
            <tbody>
              {employeeRisks.map((employee, index) => (
                <tr key={index} className={`border-b border-[#E5E7EB] ${getRiskColor(employee.burnoutRisk)}`}>
                  <td className="p-3 font-medium text-[#0F172A]">{employee.name}</td>
                  <td className="p-3 text-[#64748B]">{employee.role}</td>
                  <td className="p-3 font-medium text-[#0F172A]">{employee.workload}%</td>
                  <td className="p-3 font-medium text-[#0F172A]">{employee.stress}%</td>
                  <td className="p-3 font-medium text-[#0F172A]">{employee.overtime}hrs</td>
                  <td className="p-3 font-medium text-[#0F172A]">{employee.focusDrop}%</td>
                  <td className="p-3 font-medium text-[#0F172A]">{employee.fatigueScore}</td>
                  <td className="p-3">
                    <Badge className={`font-medium ${getRiskTextColor(employee.burnoutRisk)}`}>
                      {employee.burnoutRisk}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <Button variant="ghost" size="sm">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* TEAM & DEPARTMENT FATIGUE */}
        <div>
          <h2 className="text-xl font-semibold text-[#0F172A] mb-4">Team & Department Fatigue</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {teamFatigue.map((team, index) => (
              <Card key={index} className={`p-4 border-[#E5E7EB] rounded-xl shadow-sm ${getRiskColor(team.risk)}`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-[#0F172A]">{team.team}</h3>
                  <Badge className={`font-medium ${getRiskTextColor(team.risk)}`}>
                    {team.risk}
                  </Badge>
                </div>
                <p className="text-2xl font-semibold text-[#0F172A]">{team.fatigue}%</p>
              </Card>
            ))}
          </div>
        </div>

        {/* BURNOUT & WELLBEING SIGNALS */}
        <div>
          <h2 className="text-xl font-semibold text-[#0F172A] mb-4">Burnout & Wellbeing Signals</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {wellbeingSignals.map((signal, index) => (
              <Card key={index} className={`p-6 border rounded-xl shadow-sm ${getSignalColor(signal.color)}`}>
                <div className="text-center">
                  <p className="text-sm text-[#64748B] font-medium mb-2">{signal.title}</p>
                  <p className="text-3xl font-semibold text-[#0F172A]">{signal.count}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* AI RECOMMENDED ACTIONS */}
        <div>
          <h2 className="text-xl font-semibold text-[#0F172A] mb-4">AI Recommended Actions</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {recommendedActions.map((action, index) => (
              <Card key={index} className="p-6 bg-white border-[#E5E7EB] rounded-xl shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[#0F172A] mb-3">{action.title}</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-[#64748B]">FTE Impact</p>
                        <p className="font-medium text-[#0F172A]">{action.fteImpact}</p>
                      </div>
                      <div>
                        <p className="text-[#64748B]">Fatigue Reduction</p>
                        <p className="font-medium text-green-600">{action.fatigueReduction}</p>
                      </div>
                      <div>
                        <p className="text-[#64748B]">Productivity Gain</p>
                        <p className="font-medium text-blue-600">{action.productivityGain}</p>
                      </div>
                      <div>
                        <p className="text-[#64748B]">Cost</p>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-[#64748B]" />
                          <p className="font-medium text-[#0F172A]">{action.cost}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <Button className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white">
                  Apply
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
