import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/auth";
import {
    Brain,
    Zap,
    AlertTriangle,
    Target,
    BarChart3,
    Briefcase,
    Award,
    TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useLocation } from "wouter";
import { api } from "@/services/api";

export default function EmployeeDashboard() {
    const { user } = useAuth();
    const [, navigate] = useLocation();
    const [employeeData, setEmployeeData] = useState(null);
    const [analysis, setAnalysis] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const go = (path) => navigate(path);

    useEffect(() => {
        const loadData = async () => {
            try {
                // Get the employee's own record from the dedicated endpoint
                const empResponse = await api.get("/employee/me");
                if (empResponse.data.success) {
                    const myRecord = empResponse.data.data;
                    setEmployeeData(myRecord);

                    // Try to get analysis data for this employee
                    if (myRecord?._id) {
                        try {
                            const analysisRes = await api.get(`/analysis/employee/${myRecord._id}`);
                            if (analysisRes.data.success) {
                                setAnalysis(analysisRes.data);
                            }
                        } catch (err) {
                            console.log("Analysis not yet available");
                        }
                    }
                }
            } catch (error) {
                console.error("Employee dashboard fetch error:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [user]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-medium text-slate-500 animate-pulse">Loading your dashboard...</p>
            </div>
        );
    }

    if (!employeeData) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="text-center">
                    <h2 className="text-xl font-bold mb-2">No Employee Record Found</h2>
                    <p className="text-muted-foreground">Contact your manager to ensure your profile is set up.</p>
                </div>
            </div>
        );
    }

    const fitment = analysis?.analysis?.fitment_score ?? employeeData.scores?.fitment ?? employeeData.fitmentScore ?? 0;
    const productivity = analysis?.analysis?.productivity_score ?? employeeData.scores?.productivity ?? employeeData.productivity ?? 0;
    const utilization = analysis?.analysis?.utilization_score ?? employeeData.scores?.utilization ?? employeeData.utilization ?? 0;
    const fatigue = analysis?.analysis?.fatigue_score ?? employeeData.scores?.fatigue ?? employeeData.fatigueScore ?? 0;
    const recommendation = analysis?.analysis?.recommendation || 'Run workforce analysis to generate personalized insights.';
    const recommendationType = analysis?.analysis?.recommendation_type || 'stable';
    const talentCategory = analysis?.talentCategory?.category || 'Core Contributors';

    return (
        <div className="space-y-8 p-1">
            {/* HEADER */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                        Welcome back, {employeeData.name}
                    </h1>
                    <div className="flex items-center text-sm text-slate-500 mt-3 font-medium">
                        {employeeData.band && <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-600 text-xs mr-2 font-bold">{employeeData.band}</span>}
                        {employeeData.process_area && <span>{employeeData.process_area}</span>}
                        {employeeData.sub_process && <span className="mx-2">•</span>}
                        {employeeData.sub_process && <span>{employeeData.sub_process}</span>}
                    </div>
                </div>
                <Badge variant="outline" className="text-blue-600 bg-blue-50/50 border-blue-200 px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer hover:bg-blue-50">
                    Performance Risk / Critical Action
                </Badge>
            </div>

            {/* PERSONAL KPI STRIP */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <MetricCard
                    title="Fitment Score"
                    value={fitment + "%"}
                    icon={Target}
                    description="Role alignment index"
                    iconColor="text-blue-600"
                    bgColor="bg-blue-50"
                    strokeColor="#2563eb"
                    onClick={() => go("/employee/career")}
                />
                <MetricCard
                    title="Productivity"
                    value={productivity + "%"}
                    icon={BarChart3}
                    description="Task completion rate"
                    iconColor="text-emerald-600"
                    bgColor="bg-emerald-50"
                    strokeColor="#10b981"
                    onClick={() => go("/employee/work")}
                />
                <MetricCard
                    title="Utilization"
                    value={utilization + "%"}
                    icon={Zap}
                    description="Workload allocation"
                    iconColor="text-amber-500"
                    bgColor="bg-amber-50"
                    strokeColor="#f59e0b"
                    onClick={() => go("/employee/work")}
                />
                <MetricCard
                    title="Fatigue Level"
                    value={fatigue + "%"}
                    icon={AlertTriangle}
                    description="Burnout risk indicator"
                    iconColor={fatigue > 70 ? "text-red-600" : fatigue > 40 ? "text-amber-500" : "text-emerald-600"}
                    bgColor={fatigue > 70 ? "bg-red-50" : fatigue > 40 ? "bg-amber-50" : "bg-emerald-50"}
                    strokeColor={fatigue > 70 ? "#dc2626" : fatigue > 40 ? "#f59e0b" : "#10b981"}
                    onClick={() => go("/employee/wellbeing")}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                {/* SKILLS & ROLE PROFILE (Left) */}
                <Card className="border-slate-200 shadow-sm rounded-2xl flex flex-col">
                    <CardHeader className="pb-4 pt-6 px-6">
                        <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
                            <Brain className="h-5 w-5 text-blue-600" />
                            Skills & Role Profile
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 flex-1 flex flex-col px-6 pb-6">
                        {/* Fitment Progress */}
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="font-semibold text-slate-700">Role Fitment</span>
                                <span className="text-slate-600 font-medium">{fitment}%</span>
                            </div>
                            <Progress value={fitment} className="h-2.5 bg-blue-100 [&>div]:bg-blue-500" />
                        </div>

                        {/* Skills */}
                        <div className="space-y-3 flex-1">
                            <h4 className="text-sm font-semibold text-slate-800">Your Skills</h4>
                            <div className="flex flex-wrap gap-2">
                                {(employeeData.skills || []).map(skill => (
                                    <Badge key={skill} variant="secondary" className="bg-blue-50 text-blue-600 border border-blue-100/50 px-3 py-1 font-medium capitalize rounded-md hover:bg-blue-100 transition-colors shadow-sm">
                                        {skill}
                                    </Badge>
                                ))}
                                {(!employeeData.skills || employeeData.skills.length === 0) && (
                                    <span className="text-sm text-slate-400 italic">No skills data available</span>
                                )}
                            </div>
                        </div>

                        {/* Role Info */}
                        <div className="pt-5 border-t border-slate-100">
                            <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                                <div className="flex justify-between items-center col-span-2">
                                    <span className="text-sm text-slate-500">Current Role</span>
                                    <span className="text-sm font-semibold text-slate-900">{employeeData.currentRole || employeeData.position}</span>
                                </div>
                                <div className="flex justify-between items-center col-span-2">
                                    <span className="text-sm text-slate-500">Band</span>
                                    <Badge className="bg-slate-500 hover:bg-slate-600 text-white border-none px-2 rounded-md">{employeeData.band || 'N/A'}</Badge>
                                </div>
                                <div className="flex justify-between items-center col-span-2">
                                    <span className="text-sm text-slate-500">Experience</span>
                                    <span className="text-sm font-semibold text-slate-900">{employeeData.experience_years || 0} years</span>
                                </div>
                                <div className="flex justify-between items-center col-span-2">
                                    <span className="text-sm text-slate-500">Location</span>
                                    <span className="text-sm font-semibold text-slate-900">{employeeData.location || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* AI INSIGHTS (Right) */}
                <Card className="border-none shadow-sm rounded-2xl bg-[#F5F8FF] relative overflow-hidden flex flex-col">
                    {/* Decorative circle */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                    <CardHeader className="pb-4 pt-6 px-6 relative z-10">
                        <CardTitle className="text-lg font-bold flex items-center gap-3 text-slate-900">
                            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0 text-indigo-600">
                                <Award className="h-5 w-5" />
                            </div>
                            AI Career Insights
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 flex-1 flex flex-col relative z-10 px-6 pb-6">
                        {/* Recommendation Type Badge */}
                        <div>
                            <RecommendationBadge type={recommendationType} />
                        </div>

                        {/* Recommendation Text */}
                        <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-100 flex gap-3 items-start">
                            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 mt-0.5">
                                <Zap className="h-4 w-4 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-900 mb-1">AI Recommendation</p>
                                <p className="text-sm text-slate-500 leading-relaxed">
                                    {recommendation}
                                </p>
                            </div>
                        </div>

                        {/* Improvement Suggestions */}
                        <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-100 flex gap-3 items-start flex-1">
                            <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center shrink-0 mt-0.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-900 mb-2">Improvement Areas</p>
                                <ul className="space-y-2 text-sm text-slate-500">
                                    {fitment < 70 && (
                                        <li className="flex items-start gap-2">
                                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 shrink-0"></span>
                                            <span>Enhance skill alignment with role requirements through targeted training</span>
                                        </li>
                                    )}
                                    {fatigue > 50 && (
                                        <li className="flex items-start gap-2">
                                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 shrink-0"></span>
                                            <span>Monitor workload — consider discussing task redistribution with your manager</span>
                                        </li>
                                    )}
                                    {productivity < 70 && (
                                        <li className="flex items-start gap-2">
                                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 shrink-0"></span>
                                            <span>Focus on task prioritization to improve completion rates</span>
                                        </li>
                                    )}
                                    {fitment >= 70 && fatigue <= 50 && productivity >= 70 && (
                                        <li className="flex items-start gap-2">
                                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 shrink-0"></span>
                                            <span>Excellent performance! Continue current trajectory for growth opportunities</span>
                                        </li>
                                    )}
                                </ul>
                            </div>
                        </div>

                        <Button
                            className="w-full bg-[#5244E3] hover:bg-[#4336c9] text-white font-medium py-6 rounded-xl shadow-md transition-all group mt-2"
                            onClick={() => go("/employee/career-coach")}
                        >
                            <span className="flex items-center gap-2 text-sm">
                                <span className="text-lg">✨</span> Chat with AI Career Coach <span className="group-hover:translate-x-1 transition-transform">→</span>
                            </span>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

const TrendLine = ({ color }) => (
    <svg width="80" height="30" viewBox="0 0 80 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute bottom-4 right-4 opacity-40">
        <path d="M0 25 Q 15 25, 25 15 T 50 10 T 80 5" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
);

function MetricCard({ title, value, icon: Icon, description, iconColor, bgColor, strokeColor, onClick }) {
    return (
        <Card className="cursor-pointer hover:shadow-md transition-shadow relative overflow-hidden group rounded-2xl border-slate-200 shadow-sm" onClick={onClick}>
            <CardContent className="p-5 pb-6">
                <div className="flex gap-4 items-start">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${bgColor} mt-1`}>
                        <Icon className={`h-6 w-6 ${iconColor}`} strokeWidth={2} />
                    </div>
                    <div className="flex flex-col z-10 w-full">
                        <p className="text-sm font-semibold text-slate-700">{title}</p>
                        <div className="flex items-center gap-2 mt-1">
                            <h2 className="text-3xl font-extrabold text-slate-900">{value}</h2>
                            <Badge variant="outline" className="text-[9px] py-0 px-1.5 border-slate-300 text-slate-600 font-bold tracking-wider rounded-md h-5">LIVE</Badge>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{description}</p>
                    </div>
                </div>
                {/* Decorative Trend Line */}
                <TrendLine color={strokeColor} />
            </CardContent>
        </Card>
    );
}

function RecommendationBadge({ type }) {
    const badges = {
        burnout_risk: { label: 'Burnout Risk', className: 'bg-red-100 text-red-700 border-red-200' },
        overloaded: { label: 'Overloaded', className: 'bg-orange-100 text-orange-700 border-orange-200' },
        role_misalignment: { label: 'Role Misalignment', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
        underutilized: { label: 'Underutilized', className: 'bg-amber-100 text-amber-700 border-amber-200' },
        promotion_candidate: { label: 'Promotion Ready', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
        high_performer: { label: 'High Performer', className: 'bg-blue-100 text-blue-700 border-blue-200' },
        stable: { label: 'Stable Contributor', className: 'bg-slate-100 text-slate-600 border-slate-200 font-semibold' },
    };
    const badge = badges[type] || badges.stable;
    return <Badge variant="outline" className={`rounded-full px-3 py-1 ${badge.className}`}>{badge.label}</Badge>;
}
