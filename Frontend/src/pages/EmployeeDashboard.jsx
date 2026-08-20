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
        <div className="space-y-10">
            {/* HEADER */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight">
                        Welcome back, {employeeData.name}
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        {employeeData.band && <Badge variant="outline" className="mr-2">{employeeData.band}</Badge>}
                        {employeeData.process_area && <span>{employeeData.process_area}</span>}
                        {employeeData.sub_process && <span> · {employeeData.sub_process}</span>}
                    </p>
                </div>
                <Badge className="bg-blue-50 text-blue-700 border-blue-100 px-3 py-1 text-sm">
                    {talentCategory}
                </Badge>
            </div>

            {/* PERSONAL KPI STRIP */}
            <div className="grid md:grid-cols-4 gap-6">
                <MetricCard
                    title="Fitment Score"
                    value={fitment + "%"}
                    icon={Target}
                    description="Role alignment index"
                    color="text-blue-600"
                    onClick={() => go("/employee/career")}
                />
                <MetricCard
                    title="Productivity"
                    value={productivity + "%"}
                    icon={TrendingUp}
                    description="Task completion rate"
                    color="text-emerald-600"
                    onClick={() => go("/employee/work")}
                />
                <MetricCard
                    title="Utilization"
                    value={utilization + "%"}
                    icon={Zap}
                    description="Workload allocation"
                    color="text-amber-600"
                    onClick={() => go("/employee/work")}
                />
                <MetricCard
                    title="Fatigue Level"
                    value={fatigue + "%"}
                    icon={AlertTriangle}
                    description="Burnout risk indicator"
                    color={fatigue > 70 ? "text-destructive" : fatigue > 40 ? "text-amber-600" : "text-green-600"}
                    onClick={() => go("/employee/wellbeing")}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* SKILLS & ROLE */}
                <Card className="border-blue-100">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <Brain className="h-5 w-5 text-blue-500" />
                            Skills & Role Profile
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Fitment Progress */}
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="font-medium">Role Fitment</span>
                                <span className="text-muted-foreground">{fitment}%</span>
                            </div>
                            <Progress value={fitment} className="h-2" />
                        </div>

                        {/* Skills */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold">Your Skills</h4>
                            <div className="flex flex-wrap gap-2">
                                {(employeeData.skills || []).map(skill => (
                                    <Badge key={skill} variant="secondary" className="bg-blue-50 text-blue-700 border-none capitalize">
                                        {skill}
                                    </Badge>
                                ))}
                                {(!employeeData.skills || employeeData.skills.length === 0) && (
                                    <span className="text-sm text-muted-foreground italic">No skills data available</span>
                                )}
                            </div>
                        </div>

                        {/* Role Info */}
                        <div className="pt-4 border-t space-y-2">
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Current Role</span>
                                <span className="text-sm font-medium">{employeeData.currentRole || employeeData.position}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Band</span>
                                <Badge>{employeeData.band || 'N/A'}</Badge>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Experience</span>
                                <span className="text-sm font-medium">{employeeData.experience_years || 0} years</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Location</span>
                                <span className="text-sm font-medium">{employeeData.location || 'N/A'}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* AI INSIGHTS */}
                <Card className="border-indigo-100 bg-indigo-50/30">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-indigo-500" />
                            AI Career Insights
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Recommendation Type Badge */}
                        <div className="flex items-center gap-2">
                            <RecommendationBadge type={recommendationType} />
                        </div>

                        {/* Recommendation Text */}
                        <div className="p-4 bg-white rounded-xl border border-indigo-100 shadow-sm">
                            <p className="text-sm font-medium mb-1">AI Recommendation</p>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {recommendation}
                            </p>
                        </div>

                        {/* Improvement Suggestions */}
                        <div className="p-4 bg-white rounded-xl border border-indigo-100 shadow-sm">
                            <p className="text-sm font-medium mb-2">Improvement Areas</p>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                {fitment < 70 && (
                                    <li className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                                        Enhance skill alignment with role requirements through targeted training
                                    </li>
                                )}
                                {fatigue > 50 && (
                                    <li className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                                        Monitor workload — consider discussing task redistribution with your manager
                                    </li>
                                )}
                                {productivity < 70 && (
                                    <li className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                                        Focus on task prioritization to improve completion rates
                                    </li>
                                )}
                                {fitment >= 70 && fatigue <= 50 && productivity >= 70 && (
                                    <li className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                        Excellent performance! Continue current trajectory for growth opportunities
                                    </li>
                                )}
                            </ul>
                        </div>

                        <Button className="w-full bg-indigo-600 hover:bg-indigo-700 font-bold py-6 rounded-xl shadow-lg shadow-indigo-200 transition-all hover:scale-[1.02]" onClick={() => go("/employee/career-coach")}>
                            Chat with AI Career Coach
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function MetricCard({ title, value, icon: Icon, description, color, onClick }) {
    return (
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
            <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <div className="flex items-baseline gap-2">
                    <h2 className="text-3xl font-bold">{value}</h2>
                    <Badge variant="outline" className="text-[10px] py-0">LIVE</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">{description}</p>
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
        stable: { label: 'Stable Contributor', className: 'bg-slate-100 text-slate-700 border-slate-200' },
    };
    const badge = badges[type] || badges.stable;
    return <Badge className={badge.className}>{badge.label}</Badge>;
}
